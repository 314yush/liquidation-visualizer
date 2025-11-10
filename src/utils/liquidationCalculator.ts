import { calculateDynamicSpread, type SpreadParams } from './spreadCalculator';
import type { PairInfo } from '../types/pairInfo';
import { getPairIndexFromMarket } from './pairInfoApi';

export interface Position {
  market: string;
  side: 'long' | 'short';
  collateral: number; // In USD or base currency
  leverage: number; // e.g., 500 for 500x
  entryPrice: number;
  currentPrice: number;
  pairInfo?: PairInfo; // Optional pair info for spread calculation
}

export interface LiquidationResult {
  liquidationPrice: number;
  distanceFromLiquidation: number; // Percentage
  distanceInPrice: number; // Absolute price difference
  marginRatio: number; // Current margin ratio
  isAtRisk: boolean; // True if within 10% of liquidation
  isCritical: boolean; // True if within 5% of liquidation
  spread?: number; // Dynamic spread applied (as percentage)
}

/**
 * Calculate liquidation price for a position
 * 
 * Avantis liquidates positions when they reach -85% loss of collateral.
 * 
 * Formula:
 * - Loss % of collateral = (Price Move % × Leverage)
 * - At liquidation: 85% = (Price Move % × Leverage)
 * - Therefore: Price Move % = 85% / Leverage
 * 
 * For LONG positions:
 * - Liquidation = Entry Price × (1 - 0.85 / Leverage)
 * 
 * For SHORT positions:
 * - Liquidation = Entry Price × (1 + 0.85 / Leverage)
 * 
 * Example: 10x leverage, $100 collateral, $100 entry
 * - Price move to liquidation: 85% / 10 = 8.5%
 * - Long liquidation: $100 × (1 - 0.085) = $91.50
 * - Short liquidation: $100 × (1 + 0.085) = $108.50
 * - Loss at liquidation: 8.5% × $1,000 position = $85 (85% of $100 collateral) ✓
 */
export function calculateLiquidationPrice(position: Position): number {
  const { side, entryPrice, leverage } = position;
  
  // Avantis liquidates at -85% loss of collateral
  const lossThreshold = 0.85; // 85%
  
  // Price move % to liquidation = Loss Threshold / Leverage
  const priceMovePercent = lossThreshold / leverage;
  
  if (side === 'long') {
    // Long position liquidates when price drops
    // Liquidation = Entry × (1 - Price Move %)
    return entryPrice * (1 - priceMovePercent);
  } else {
    // Short position liquidates when price rises
    // Liquidation = Entry × (1 + Price Move %)
    return entryPrice * (1 + priceMovePercent);
  }
}

/**
 * Calculate current margin ratio
 */
export function calculateMarginRatio(position: Position): number {
  const { side, entryPrice, currentPrice, leverage, collateral } = position;
  
  // Position size = collateral * leverage
  const positionSize = collateral * leverage;
  
  // Calculate PnL
  let pnl: number;
  if (side === 'long') {
    pnl = (currentPrice - entryPrice) * (positionSize / entryPrice);
  } else {
    pnl = (entryPrice - currentPrice) * (positionSize / entryPrice);
  }
  
  // Current equity = collateral + PnL
  const currentEquity = collateral + pnl;
  
  // Margin ratio = equity / position size
  return currentEquity / positionSize;
}

/**
 * Calculate distance from liquidation
 */
export function calculateLiquidationDistance(position: Position): LiquidationResult {
  const liquidationPrice = calculateLiquidationPrice(position);
  const { side, currentPrice } = position;
  
  let distanceInPrice: number;
  let distanceFromLiquidation: number;
  
  if (side === 'long') {
    // For long: liquidation is below current price
    distanceInPrice = currentPrice - liquidationPrice;
    distanceFromLiquidation = ((currentPrice - liquidationPrice) / currentPrice) * 100;
  } else {
    // For short: liquidation is above current price
    distanceInPrice = liquidationPrice - currentPrice;
    distanceFromLiquidation = ((liquidationPrice - currentPrice) / currentPrice) * 100;
  }
  
  const marginRatio = calculateMarginRatio(position);
  
  // Risk thresholds
  const isAtRisk = distanceFromLiquidation < 10; // Within 10% of liquidation
  const isCritical = distanceFromLiquidation < 5; // Within 5% of liquidation
  
  return {
    liquidationPrice,
    distanceFromLiquidation,
    distanceInPrice,
    marginRatio,
    isAtRisk,
    isCritical,
  };
}

/**
 * Calculate liquidation with spread impact
 */
export function calculateLiquidationWithSpread(position: Position): LiquidationResult {
  // If no pair info, calculate without spread
  if (!position.pairInfo) {
    return calculateLiquidationDistance(position);
  }
  
  // Get spread-adjusted entry price using dynamic spread calculation
  const pairIndex = getPairIndexFromMarket(position.market);
  const spreadParams: SpreadParams = {
    market: position.market,
    leverage: position.leverage,
    positionSize: position.collateral * position.leverage,
    currentPrice: position.currentPrice,
    isLong: position.side === 'long',
    pairInfo: position.pairInfo,
    pairIndex,
  };
  
  const spreadResult = calculateDynamicSpread(spreadParams);
  
  // Adjust entry price based on spread
  // The spread affects the effective entry price
  let adjustedEntryPrice = position.entryPrice;
  if (position.side === 'long') {
    // Long pays spread on entry (pays more)
    adjustedEntryPrice = position.entryPrice * (1 + spreadResult.dynamicSpread);
  } else {
    // Short pays spread on entry (gets less)
    adjustedEntryPrice = position.entryPrice * (1 - spreadResult.dynamicSpread);
  }
  
  // Recalculate with adjusted entry price
  const adjustedPosition = { ...position, entryPrice: adjustedEntryPrice };
  const result = calculateLiquidationDistance(adjustedPosition);
  
  // Add spread information to result
  result.spread = spreadResult.dynamicSpread * 100; // Convert to percentage
  
  return result;
}


