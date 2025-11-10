import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Position } from '../utils/liquidationCalculator';
import { fetchBinancePrice } from '../utils/binanceApi';

interface PositionFormProps {
  onSubmit: (position: Position) => void;
  initialPosition?: Partial<Position>;
}

const MARKETS = [
  'BTC/USD',
  'ETH/USD',
  'SOL/USD',
];

export const PositionForm: React.FC<PositionFormProps> = ({ onSubmit, initialPosition }) => {
  const [market, setMarket] = useState(initialPosition?.market || MARKETS[0]);
  
  // Sync market when initialPosition changes
  useEffect(() => {
    if (initialPosition?.market && initialPosition.market !== market) {
      setMarket(initialPosition.market);
    }
  }, [initialPosition?.market, market]);
  const [side, setSide] = useState<'long' | 'short'>(initialPosition?.side || 'long');
  const [collateral, setCollateral] = useState(initialPosition?.collateral?.toString() || '1000');
  const [leverage, setLeverage] = useState(initialPosition?.leverage || 10);
  const lastSubmittedLeverageRef = useRef<number>(initialPosition?.leverage || 10);
  const isUserInputRef = useRef<boolean>(false);
  const isInternalUpdateRef = useRef<boolean>(false);

  // Sync leverage when initialPosition changes from external source (e.g., chart interaction)
  useEffect(() => {
    if (initialPosition?.leverage !== undefined && 
        initialPosition.leverage !== leverage &&
        !isUserInputRef.current &&
        !isInternalUpdateRef.current) {
      isInternalUpdateRef.current = true;
      setLeverage(initialPosition.leverage);
      lastSubmittedLeverageRef.current = initialPosition.leverage;
      setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 0);
    }
  }, [initialPosition?.leverage, leverage]);

  const [binancePrice, setBinancePrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const autoRefreshIntervalRef = useRef<number | null>(null);

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
    
    autoRefreshIntervalRef.current = window.setInterval(() => {
      fetchPrice(false);
    }, 5000);
    
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [market, fetchPrice]);

  // Auto-submit when price, collateral, leverage, or side changes
  const submitTimeoutRef = useRef<number | null>(null);
  useEffect(() => {
    if (binancePrice !== null && collateral && parseFloat(collateral) > 0) {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
      
      submitTimeoutRef.current = window.setTimeout(() => {
        const newPosition = {
          market,
          side,
          collateral: parseFloat(collateral),
          leverage,
          entryPrice: binancePrice,
          currentPrice: binancePrice,
        };
        lastSubmittedLeverageRef.current = leverage;
        onSubmit(newPosition);
      }, 100);
    }
    
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, [binancePrice, collateral, leverage, side, market, onSubmit]);

  const handleMaxCollateral = () => {
    if (binancePrice) {
      // Set to a large round number for demo
      setCollateral('10000');
    }
  };

  const handleHalfCollateral = () => {
    const current = parseFloat(collateral);
    if (!isNaN(current)) {
      setCollateral((current / 2).toString());
    }
  };

  return (
    <>
      {/* Control Panel */}
      <div className="brutal-card control-panel">
        <div className="card-label">CONTROL PANEL</div>
        <div className="controls-grid">
          <div className="control-group">
            <label className="control-label">POSITION SIDE</label>
            <div className="side-toggle">
              <button
                type="button"
                className={`brutal-btn side-btn ${side === 'long' ? 'active long' : ''}`}
                onClick={() => setSide('long')}
              >
                LONG
              </button>
              <button
                type="button"
                className={`brutal-btn side-btn ${side === 'short' ? 'active short' : ''}`}
                onClick={() => setSide('short')}
              >
                SHORT
              </button>
            </div>
          </div>

          <div className="control-group">
            <label className="control-label">COLLATERAL (USD)</label>
            <div className="collateral-input-wrapper">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={collateral}
                onChange={(e) => setCollateral(e.target.value)}
                className="brutal-input collateral-input"
                required
              />
              <div className="collateral-chips">
                <button
                  type="button"
                  className="brutal-chip"
                  onClick={handleHalfCollateral}
                >
                  HALF
                </button>
                <button
                  type="button"
                  className="brutal-chip"
                  onClick={handleMaxCollateral}
                >
                  MAX
                </button>
              </div>
            </div>
          </div>

          <div className="control-group leverage-control">
            <label className="control-label">LEVERAGE: {leverage}X</label>
            <div className="leverage-wrapper">
              <input
                type="range"
                min="1"
                max="500"
                step="1"
                value={leverage}
                onChange={(e) => {
                  isUserInputRef.current = true;
                  const newLeverage = parseInt(e.target.value, 10);
                  setLeverage(newLeverage);
                  lastSubmittedLeverageRef.current = newLeverage;
                  setTimeout(() => {
                    isUserInputRef.current = false;
                  }, 200);
                }}
                className="brutal-slider"
              />
              <div className="leverage-labels">
                <span>1X</span>
                <span>250X</span>
                <span>500X</span>
              </div>
              <input
                type="number"
                min="1"
                max="500"
                value={leverage}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1 && val <= 500) {
                    setLeverage(val);
                  }
                }}
                className="brutal-input leverage-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Current Price */}
      <div className="brutal-card price-card">
        <div className="card-label">CURRENT PRICE (BINANCE)</div>
        <div className="price-display">
          {priceLoading ? (
            <span className="price-loading">LOADING...</span>
          ) : priceError ? (
            <span className="price-error">ERROR</span>
          ) : binancePrice !== null ? (
            <span className="price-amount">${binancePrice.toFixed(2)}</span>
          ) : (
            <span className="price-loading">—</span>
          )}
        </div>
        <div className="price-hint">AUTO-UPDATE: 5S</div>
      </div>

      <style>{`
        .control-panel {
          grid-column: span 12;
        }
        .controls-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 1.5rem;
          margin-top: 1rem;
        }
        .control-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .control-group:not(.leverage-control) {
          grid-column: span 4;
        }
        .leverage-control {
          grid-column: span 12;
        }
        .control-label {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .side-toggle {
          display: flex;
          gap: 1rem;
        }
        .brutal-btn {
          flex: 1;
          padding: 1rem;
          border: 2px solid #000000;
          background: #FFFFFF;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.875rem;
          font-weight: 700;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          box-shadow: 4px 4px 0 0 #000000;
          transition: all 0.1s;
        }
        .brutal-btn:hover {
          transform: translate(-2px, -2px);
          box-shadow: 6px 6px 0 0 #000000;
        }
        .brutal-btn:active {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0 0 #000000;
        }
        .side-btn.active.long {
          background: #00FFC2;
          border-color: #000000;
          color: #000000;
        }
        .side-btn.active.short {
          background: #FF4E4E;
          border-color: #000000;
          color: #FFFFFF;
        }
        .collateral-input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .brutal-input {
          padding: 0.875rem 1rem;
          border: 2px solid #000000;
          background: #FFFFFF;
          color: #000000;
          font-family: 'JetBrains Mono', monospace;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.1s;
        }
        .brutal-input:focus {
          outline: none;
          background: #F5C518;
          border-color: #000000;
        }
        .collateral-input {
          font-size: 1.125rem;
        }
        .collateral-chips {
          display: flex;
          gap: 0.5rem;
        }
        .brutal-chip {
          padding: 0.5rem 1rem;
          border: 2px solid #000000;
          background: #FFFFFF;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.75rem;
          font-weight: 700;
          color: #000000;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 3px 3px 0 0 #000000;
          transition: all 0.1s;
        }
        .brutal-chip:hover {
          transform: translate(-1px, -1px);
          box-shadow: 4px 4px 0 0 #000000;
        }
        .brutal-chip:active {
          transform: translate(1px, 1px);
          box-shadow: 2px 2px 0 0 #000000;
        }
        .leverage-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .brutal-slider {
          width: 100%;
          height: 12px;
          background: #FFFFFF;
          border: 2px solid #000000;
          outline: none;
          -webkit-appearance: none;
          appearance: none;
          box-shadow: 3px 3px 0 0 #000000;
        }
        .brutal-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          background: #F5C518;
          border: 3px solid #000000;
          cursor: pointer;
          box-shadow: 4px 4px 0 0 #000000;
        }
        .brutal-slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: #F5C518;
          border: 3px solid #000000;
          cursor: pointer;
          box-shadow: 4px 4px 0 0 #000000;
        }
        .leverage-labels {
          display: flex;
          justify-content: space-between;
          font-family: 'JetBrains Mono', monospace;
          font-size: 1rem;
          font-weight: 700;
          color: #000000;
        }
        .leverage-input {
          width: 120px;
          align-self: flex-end;
        }
        .price-card {
          grid-column: span 4;
        }
        .price-display {
          padding: 1.25rem;
          background: #0B0B0B;
          border: 2px solid #000000;
          text-align: center;
          margin-top: 1rem;
          box-shadow: 4px 4px 0 0 #000000;
        }
        .price-amount {
          font-family: 'JetBrains Mono', monospace;
          font-size: 2rem;
          font-weight: 700;
          color: #F5C518;
          letter-spacing: 0.05em;
        }
        .price-loading {
          font-family: 'JetBrains Mono', monospace;
          color: #000000;
          font-weight: 600;
        }
        .price-error {
          font-family: 'JetBrains Mono', monospace;
          color: #FF4E4E;
          font-weight: 700;
        }
        .price-hint {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          color: #000000;
          margin-top: 0.5rem;
          text-align: center;
          font-weight: 600;
        }
        .brutal-card {
          background: #FFFFFF;
          border: 3px solid #000000;
          padding: 1.5rem;
          box-shadow: 6px 6px 0 0 #000000;
          transition: all 0.1s;
        }
        .brutal-card:hover {
          transform: translate(-2px, -2px);
          box-shadow: 8px 8px 0 0 #000000;
        }
        .card-label {
          background: #000000;
          color: #F5C518;
          padding: 0.5rem 1rem;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: -1.5rem -1.5rem 1rem -1.5rem;
          border-bottom: 2px solid #F5C518;
        }
      `}</style>
    </>
  );
};
