import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Position } from '../utils/liquidationCalculator';
import { fetchBinancePrice } from '../utils/binanceApi';
import { calculateDynamicSpread, type SpreadParams } from '../utils/spreadCalculator';
import { getPairIndexFromMarket } from '../utils/pairInfoApi';
import type { PairInfoResponse } from '../types/pairInfo';

interface PositionFormProps {
  onSubmit: (position: Position) => void;
  initialPosition?: Partial<Position>;
  isLoading?: boolean;
  pairInfoData?: PairInfoResponse | null;
}

const MARKETS = [
  'BTC/USD',
  'ETH/USD',
  'SOL/USD',
];

export const PositionForm: React.FC<PositionFormProps> = ({ onSubmit, initialPosition, isLoading = false, pairInfoData }) => {
  const [market, setMarket] = useState(initialPosition?.market || MARKETS[0]);
  const [side, setSide] = useState<'long' | 'short'>(initialPosition?.side || 'long');
  const [collateral, setCollateral] = useState(initialPosition?.collateral?.toString() || '1000');
  const [leverage, setLeverage] = useState(initialPosition?.leverage || 10);
  const lastSubmittedLeverageRef = useRef<number>(initialPosition?.leverage || 10);
  const isUserInputRef = useRef<boolean>(false);
  const isInternalUpdateRef = useRef<boolean>(false);

  // Sync leverage when initialPosition changes from external source (e.g., chart interaction)
  // But not when it's from our own submission or user input
  useEffect(() => {
    if (initialPosition?.leverage !== undefined && 
        initialPosition.leverage !== leverage &&
        !isUserInputRef.current &&
        !isInternalUpdateRef.current) {
      isInternalUpdateRef.current = true;
      setLeverage(initialPosition.leverage);
      lastSubmittedLeverageRef.current = initialPosition.leverage;
      // Reset flag after state update
      setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 0);
    }
  }, [initialPosition?.leverage, leverage]);
  const [binancePrice, setBinancePrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const autoRefreshIntervalRef = useRef<number | null>(null);

  // Calculate dynamic spread in real-time
  const spreadResult = useMemo(() => {
    // Debug logging
    console.log('Spread calculation check:', {
      hasPairInfoData: !!pairInfoData,
      binancePrice,
      collateral,
      market,
    });

    if (!pairInfoData) {
      console.log('No pairInfoData available');
      return null;
    }

    if (!binancePrice || !collateral || parseFloat(collateral) <= 0) {
      console.log('Missing price or collateral');
      return null;
    }

    const pairIndex = getPairIndexFromMarket(market);
    const pairInfo = pairInfoData[pairIndex];
    
    console.log('Pair lookup:', {
      market,
      pairIndex,
      hasPairInfo: !!pairInfo,
    });
    
    if (!pairInfo) {
      console.log('No pair info found for index', pairIndex);
      return null;
    }

    try {
      const spreadParams: SpreadParams = {
        market,
        leverage,
        positionSize: parseFloat(collateral) * leverage,
        currentPrice: binancePrice,
        isLong: side === 'long',
        pairInfo,
        pairIndex,
      };

      const result = calculateDynamicSpread(spreadParams);
      
      console.log('Spread calculated:', result);
      
      // Add base spread for display
      return {
        ...result,
        baseSpread: (pairInfo.spreadP || 0) / 100, // Convert from percentage to decimal
      };
    } catch (error) {
      console.error('Error calculating spread:', error);
      return null;
    }
  }, [pairInfoData, market, leverage, collateral, binancePrice, side]);

  // Fetch price from Binance
  const fetchPrice = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setPriceLoading(true);
      setPriceError(null);
      const price = await fetchBinancePrice(market);
      setBinancePrice(price);
    } catch (error) {
      console.error('Failed to fetch price:', error);
      setPriceError('Failed to fetch price from Binance');
    } finally {
      if (showLoading) setPriceLoading(false);
    }
  }, [market]);

  // Fetch price on mount and when market changes
  useEffect(() => {
    fetchPrice(true);
    
    // Auto-refresh price every 5 seconds
    autoRefreshIntervalRef.current = window.setInterval(() => {
      fetchPrice(false); // Silent refresh
    }, 5000);
    
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [market, fetchPrice]);

  // Handle market change
  const handleMarketChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMarket(e.target.value);
  };

  // Auto-submit when price, collateral, leverage, or side changes
  // Use a ref to debounce rapid changes
  const submitTimeoutRef = useRef<number | null>(null);
  useEffect(() => {
    if (binancePrice !== null && collateral && parseFloat(collateral) > 0) {
      // Clear any pending submission
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
      
      // Debounce rapid changes (especially from slider)
      submitTimeoutRef.current = window.setTimeout(() => {
        const newPosition = {
          market,
          side,
          collateral: parseFloat(collateral),
          leverage,
          entryPrice: binancePrice,
          currentPrice: binancePrice,
        };
        // Update ref before submitting to prevent feedback loop
        lastSubmittedLeverageRef.current = leverage;
        onSubmit(newPosition);
      }, 100); // Debounce for slider to reduce rapid updates
    }
    
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, [binancePrice, collateral, leverage, side, market, onSubmit]);

  return (
    <form className="position-form" onSubmit={(e) => e.preventDefault()}>
      <div className="bento-form-grid">
        <div className="form-group">
          <label htmlFor="market">Market</label>
          <select
            id="market"
            value={market}
            onChange={handleMarketChange}
            className="form-input"
          >
            {MARKETS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="side">Position Side</label>
          <div className="side-toggle">
            <button
              type="button"
              className={`toggle-btn ${side === 'long' ? 'active long' : ''}`}
              onClick={() => setSide('long')}
            >
              Long
            </button>
            <button
              type="button"
              className={`toggle-btn ${side === 'short' ? 'active short' : ''}`}
              onClick={() => setSide('short')}
            >
              Short
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="collateral">Collateral (USD)</label>
          <input
            id="collateral"
            type="number"
            step="0.01"
            min="0.01"
            value={collateral}
            onChange={(e) => setCollateral(e.target.value)}
            className="form-input"
            required
          />
        </div>

        <div className="form-group leverage-group">
          <label htmlFor="leverage">
            Leverage: {leverage}x
          </label>
          <div className="leverage-slider-container">
            <input
              id="leverage"
              type="range"
              min="1"
              max="500"
              step="1"
              value={leverage}
              onChange={(e) => {
                isUserInputRef.current = true;
                const newLeverage = parseInt(e.target.value, 10);
                setLeverage(newLeverage);
                // Reset flag after a delay to prevent sync effect from firing
                setTimeout(() => {
                  isUserInputRef.current = false;
                }, 200);
              }}
              className="leverage-slider"
            />
            <div className="leverage-labels">
              <span>1x</span>
              <span>250x</span>
              <span>500x</span>
            </div>
          </div>
        </div>

        <div className="form-group price-display">
          <label>Current Price (from Binance)</label>
          <div className="price-value">
            {priceLoading ? (
              <span className="price-loading">Loading...</span>
            ) : priceError ? (
              <span className="price-error-text">{priceError}</span>
            ) : binancePrice !== null ? (
              <span className="price-amount">${binancePrice.toFixed(2)}</span>
            ) : (
              <span className="price-loading">—</span>
            )}
          </div>
          <div className="price-hint">Auto-updates every 5 seconds</div>
        </div>
      </div>

      <style>{`
        .position-form {
          grid-column: span 12;
        }
        .bento-form-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 1rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1rem;
          padding: 1rem;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .form-group:hover {
          border-color: rgba(255, 255, 255, 0.15);
        }
        .form-group label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }
        .form-input {
          padding: 0.625rem 0.875rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.625rem;
          font-size: 0.9375rem;
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          transition: all 0.2s;
        }
        .form-input:focus {
          outline: none;
          border-color: rgba(99, 102, 241, 0.5);
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        .form-input option {
          background: #1a1f3a;
          color: #ffffff;
        }
        .side-toggle {
          display: flex;
          gap: 0.75rem;
        }
        .toggle-btn {
          flex: 1;
          padding: 0.625rem 0.875rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.625rem;
          background: rgba(255, 255, 255, 0.05);
          font-size: 0.8125rem;
          font-weight: 600;
          color: #9ca3af;
          cursor: pointer;
          transition: all 0.2s;
        }
        .toggle-btn:hover {
          border-color: rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.08);
        }
        .toggle-btn.active.long {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-color: #10b981;
          color: white;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        .toggle-btn.active.short {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border-color: #ef4444;
          color: white;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }
        .leverage-group {
          grid-column: span 6;
        }
        .leverage-slider-container {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .leverage-slider {
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.1);
          outline: none;
          -webkit-appearance: none;
          appearance: none;
        }
        .leverage-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }
        .leverage-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }
        .leverage-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: #6b7280;
        }
        .price-display {
          grid-column: span 6;
        }
        .price-value {
          padding: 1rem;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 0.75rem;
          text-align: center;
        }
        .price-amount {
          font-size: 1.75rem;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.02em;
        }
        .price-loading {
          color: #9ca3af;
          font-style: italic;
        }
        .price-error-text {
          color: #ef4444;
          font-size: 0.875rem;
        }
        .price-hint {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.5rem;
          text-align: center;
        }
      `}</style>
    </form>
  );
};
