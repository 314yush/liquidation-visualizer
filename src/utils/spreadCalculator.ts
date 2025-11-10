import BigNumber from 'bignumber.js';
import type { PairInfo } from '../types/pairInfo';

export interface SpreadParams {
  market: string;
  leverage: number;
  positionSize: number; // In USD
  currentPrice: number;
  isLong: boolean;
  pairInfo: PairInfo;
  pairIndex?: number; // Optional pair index for default multiplier selection
}

export interface SpreadResult {
  priceImpactSpread: number;
  skewImpactSpread: number;
  dynamicSpread: number;
  pnlDynamicSpread: number;
}

/**
 * Calculate price impact spread
 */
function getPriceImpactSpread({
  isLong,
  onePercentDepthAbove,
  onePercentDepthBelow,
  positionSize,
  priceImpactMultiplier,
}: {
  isLong: boolean;
  onePercentDepthAbove: BigNumber;
  onePercentDepthBelow: BigNumber;
  positionSize: BigNumber;
  priceImpactMultiplier: BigNumber;
}): number {
  const onePercentDepthParam = isLong ? onePercentDepthAbove : onePercentDepthBelow;
  
  if (onePercentDepthParam.isZero()) {
    return 0;
  }
  
  const param = priceImpactMultiplier
    .times(positionSize)
    .div(onePercentDepthParam)
    .div(1e18)
    .toNumber();
  
  const priceImpactSpread = Math.exp(param) - 1;
  return priceImpactSpread;
}

/**
 * Calculate skew impact spread
 */
function getSkewImpactSpread({
  isLong,
  positionSize,
  skewImpactMultipler,
  pairInfo,
}: {
  isLong: boolean;
  positionSize: BigNumber;
  skewImpactMultipler: BigNumber;
  pairInfo: PairInfo;
}): number {
  if (!pairInfo.openInterest) {
    return 0;
  }
  
  const longOpenInterest = BigNumber(pairInfo.openInterest.long).times(1e18);
  const shortOpenInterest = BigNumber(pairInfo.openInterest.short).times(1e18);
  
  if (longOpenInterest.isZero()) {
    return 0;
  }
  
  const totalOpenInterest = longOpenInterest.plus(shortOpenInterest);
  
  const skewP = isLong
    ? longOpenInterest.div(totalOpenInterest)
    : shortOpenInterest.div(totalOpenInterest);
  
  const skewPAfter = isLong
    ? longOpenInterest.plus(positionSize).div(totalOpenInterest.plus(positionSize))
    : shortOpenInterest.plus(positionSize).div(totalOpenInterest.plus(positionSize));
  
  const rawSpread = BigNumber(Math.exp(skewPAfter.toNumber()))
    .minus(Math.exp(skewP.toNumber()))
    .plus(Math.exp(1 - skewPAfter.toNumber()))
    .minus(Math.exp(1 - skewP.toNumber()))
    .times(1e18);
  
  const skewImpactSpread = skewImpactMultipler.times(rawSpread).div(1e36).toNumber();
  
  return skewImpactSpread;
}

/**
 * Calculate dynamic spread using Avantis algorithm
 */
export function calculateDynamicSpread(params: SpreadParams): SpreadResult {
  const {
    isLong,
    leverage,
    positionSize,
    pairInfo,
  } = params;
  
  // Debug: Log input parameters
  console.log('Spread Calculation Input:', {
    isLong,
    leverage,
    positionSize,
    hasPairInfo: !!pairInfo,
  });
  
  // Get pair info with defaults
  const priceImpactMultiplier = pairInfo?.priceImpactMultiplier ?? 0;
  const skewImpactMultiplier = pairInfo?.skewImpactMultiplier ?? 0;
  const pairSpreadP = pairInfo?.spreadP ?? 0;
  const onePercentDepthAbove = pairInfo?.pairParams?.onePercentDepthAbove ?? 0;
  const onePercentDepthBelow = pairInfo?.pairParams?.onePercentDepthBelow ?? 0;
  const pnlSpreadP = pairInfo?.pnlSpreadP ?? 0;
  
  // Debug: Log extracted values
  console.log('Extracted Pair Info:', {
    priceImpactMultiplier,
    skewImpactMultiplier,
    pairSpreadP,
    onePercentDepthAbove,
    onePercentDepthBelow,
    pnlSpreadP,
  });
  
  // Default values for storage pair params
  const pairIndex = params.pairIndex ?? 0;
  const pnlPriceImpactMultiplier =
    pairInfo?.storagePairParams?.pnlPriceImpactMultiplier ?? (pairIndex === 1 ? 1.4 : 1.2);
  const pnlSkewImpactMultiplier =
    pairInfo?.storagePairParams?.pnlSkewImpactMultiplier ?? (pairIndex === 1 ? 1.4 : 1.2);
  const pnlNegSpreadCap = pairInfo?.storagePairParams?.pnlPosSpreadCap ?? 2;
  const pnlPosSpreadCap = pairInfo?.storagePairParams?.pnlNegSpreadCap ?? 5;
  const posSpreadCap = pairInfo?.storagePairParams?.negSpreadCap ?? 2;
  const negSpreadCap = pairInfo?.storagePairParams?.posSpreadCap ?? 25;
  
  // Convert to BigNumber with 18 decimals
  const positionSizeBN = BigNumber(positionSize).times(leverage).times(1e18);
  const priceImpactMultiplierBN = BigNumber(priceImpactMultiplier).times(1e18);
  const pnlPriceImpactMultiplierBN = BigNumber(pnlPriceImpactMultiplier).times(1e18);
  const skewImpactMultiplerBN = BigNumber(skewImpactMultiplier).times(1e18);
  const pnlSkewImpactMultiplerBN = BigNumber(pnlSkewImpactMultiplier).times(1e18);
  const onePercentDepthAboveBN = BigNumber(onePercentDepthAbove).times(1e18);
  const onePercentDepthBelowBN = BigNumber(onePercentDepthBelow).times(1e18);
  const pairSpreadPBN = BigNumber(pairSpreadP).times(1e18);
  const pnlSpreadPBN = BigNumber(pnlSpreadP).times(1e18);
  
  // Calculate price impact spreads
  const priceImpactSpread = getPriceImpactSpread({
    isLong,
    onePercentDepthAbove: onePercentDepthAboveBN,
    onePercentDepthBelow: onePercentDepthBelowBN,
    positionSize: positionSizeBN,
    priceImpactMultiplier: priceImpactMultiplierBN,
  });
  
  const pnlPriceImpactSpread = getPriceImpactSpread({
    isLong,
    onePercentDepthAbove: onePercentDepthAboveBN,
    onePercentDepthBelow: onePercentDepthBelowBN,
    positionSize: positionSizeBN,
    priceImpactMultiplier: pnlPriceImpactMultiplierBN,
  });
  
  // Calculate skew impact spreads
  const skewImpactSpread = getSkewImpactSpread({
    isLong,
    positionSize: positionSizeBN,
    skewImpactMultipler: skewImpactMultiplerBN,
    pairInfo,
  });
  
  const pnlSkewImpactSpread = getSkewImpactSpread({
    isLong,
    positionSize: positionSizeBN,
    skewImpactMultipler: pnlSkewImpactMultiplerBN,
    pairInfo,
  });
  
  // Calculate dynamic spreads
  const dynamicSpreadBN = pairSpreadPBN
    .plus(BigNumber(priceImpactSpread).times(1e18))
    .plus(BigNumber(skewImpactSpread).times(1e18));
  
  const pnlDynamicSpreadBN = pnlSpreadPBN
    .plus(BigNumber(pnlPriceImpactSpread).times(1e18))
    .plus(BigNumber(pnlSkewImpactSpread).times(1e18));
  
  let dynamicSpread = dynamicSpreadBN.div(1e18).toNumber();
  let pnlDynamicSpread = pnlDynamicSpreadBN.div(1e18).toNumber();
  
  // Apply caps
  const positiveLimit = BigNumber(1e18).times(posSpreadCap).div(100);
  const negativeLimit = BigNumber(1e18).times(negSpreadCap).div(100).negated();
  const pnlPositiveLimit = BigNumber(1e18).times(pnlPosSpreadCap).div(100);
  const pnlNegativeLimit = BigNumber(1e18).times(pnlNegSpreadCap).div(100).negated();
  
  if (dynamicSpreadBN.isGreaterThan(positiveLimit)) {
    dynamicSpread = positiveLimit.div(1e18).toNumber();
  }
  if (dynamicSpreadBN.isLessThan(negativeLimit)) {
    dynamicSpread = negativeLimit.div(1e18).toNumber();
  }
  if (pnlDynamicSpreadBN.isGreaterThan(pnlPositiveLimit)) {
    pnlDynamicSpread = pnlPositiveLimit.div(1e18).toNumber();
  }
  if (pnlDynamicSpreadBN.isLessThan(pnlNegativeLimit)) {
    pnlDynamicSpread = pnlNegativeLimit.div(1e18).toNumber();
  }
  
  return {
    priceImpactSpread: isNaN(priceImpactSpread) ? 0 : priceImpactSpread,
    skewImpactSpread: isNaN(skewImpactSpread) ? 0 : skewImpactSpread,
    dynamicSpread: isNaN(dynamicSpread) ? 0 : dynamicSpread,
    pnlDynamicSpread: isNaN(pnlDynamicSpread) ? 0 : pnlDynamicSpread,
  };
}

/**
 * Get the effective spread for a long position (entry + spread, exit - spread)
 */
export function getLongSpread(spreadResult: SpreadResult): { entry: number; exit: number } {
  const spread = spreadResult.dynamicSpread;
  return {
    entry: 1 + spread, // Pay more on entry
    exit: 1 - spread,  // Get less on exit
  };
}

/**
 * Get the effective spread for a short position (entry - spread, exit + spread)
 */
export function getShortSpread(spreadResult: SpreadResult): { entry: number; exit: number } {
  const spread = spreadResult.dynamicSpread;
  return {
    entry: 1 - spread, // Get less on entry
    exit: 1 + spread,  // Pay more on exit
  };
}
