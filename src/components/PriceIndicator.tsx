import React from 'react';
import type { Position, LiquidationResult } from '../utils/liquidationCalculator';

interface PriceIndicatorProps {
  position: Position;
  result: LiquidationResult;
}

export const PriceIndicator: React.FC<PriceIndicatorProps> = ({ position, result }) => {
  const { entryPrice, currentPrice, side } = position;
  const { liquidationPrice } = result;
  
  // Determine price range for visualization
  const minPrice = Math.min(entryPrice, currentPrice, liquidationPrice) * 0.95;
  const maxPrice = Math.max(entryPrice, currentPrice, liquidationPrice) * 1.05;
  const priceRange = maxPrice - minPrice;
  
  // Calculate positions as percentages
  const entryPercent = ((entryPrice - minPrice) / priceRange) * 100;
  const currentPercent = ((currentPrice - minPrice) / priceRange) * 100;
  const liquidationPercent = ((liquidationPrice - minPrice) / priceRange) * 100;
  
  // Determine if current price is above or below entry
  const isProfit = side === 'long' 
    ? currentPrice > entryPrice 
    : currentPrice < entryPrice;
  
  return (
    <div className="price-indicator">
      <div className="price-indicator-header">
        <h3>Price Visualization</h3>
      </div>
      
      <div className="price-bar-container">
        <div className="price-bar">
          {/* Liquidation zone (red gradient) */}
          <div
            className="liquidation-zone"
            style={{
              left: `${Math.min(entryPercent, liquidationPercent)}%`,
              width: `${Math.abs(entryPercent - liquidationPercent)}%`,
            }}
          />
          
          {/* Entry price marker */}
          <div
            className="price-marker entry-marker"
            style={{ left: `${entryPercent}%` }}
          >
            <div className="marker-line" />
            <div className="marker-label entry-label">
              <div className="marker-label-title">Entry</div>
              <div className="marker-label-value">${entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>
          
          {/* Current price marker */}
          <div
            className={`price-marker current-marker ${isProfit ? 'profit' : 'loss'}`}
            style={{ left: `${currentPercent}%` }}
          >
            <div className="marker-line" />
            <div className="marker-label current-label">
              <div className="marker-label-title">Current</div>
              <div className="marker-label-value">${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>
          
          {/* Liquidation price marker */}
          <div
            className="price-marker liquidation-marker"
            style={{ left: `${liquidationPercent}%` }}
          >
            <div className="marker-line" />
            <div className="marker-label danger liquidation-label">
              <div className="marker-label-title">Liquidation</div>
              <div className="marker-label-value">${liquidationPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Price range labels */}
      <div className="price-range">
        <span className="price-range-min">${minPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span className="price-range-max">${maxPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      
      <style>{`
        .price-indicator {
          margin: 0;
          padding: 0;
        }
        .price-indicator-header {
          margin-bottom: 1.5rem;
        }
        .price-indicator-header h3 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #ffffff;
        }
        .price-bar-container {
          position: relative;
          height: 180px;
          margin-bottom: 1rem;
        }
        .price-bar {
          position: relative;
          width: 100%;
          height: 10px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 5px;
          margin-top: 90px;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .liquidation-zone {
          position: absolute;
          height: 100%;
          background: linear-gradient(90deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.3) 50%, rgba(185, 28, 28, 0.3) 100%);
          border-radius: 5px;
          opacity: 0.6;
        }
        .price-marker {
          position: absolute;
          top: -90px;
          transform: translateX(-50%);
          z-index: 10;
        }
        .marker-line {
          width: 3px;
          height: 90px;
          background: rgba(255, 255, 255, 0.3);
          margin: 0 auto;
          border-radius: 2px;
        }
        .entry-marker .marker-line {
          background: linear-gradient(180deg, #6366f1 0%, #4f46e5 100%);
          width: 3px;
        }
        .current-marker .marker-line {
          background: ${isProfit 
            ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)' 
            : 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)'};
          width: 4px;
          box-shadow: 0 0 12px ${isProfit ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'};
        }
        .liquidation-marker .marker-line {
          background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%);
          width: 4px;
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.5);
        }
        .marker-label {
          margin-top: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.75rem;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          min-width: 120px;
        }
        .marker-label-title {
          font-size: 0.75rem;
          color: #9ca3af;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }
        .marker-label-value {
          font-size: 0.875rem;
          font-weight: 700;
          color: #ffffff;
        }
        .entry-label {
          border-color: #6366f1;
        }
        .entry-label .marker-label-value {
          color: #a5b4fc;
        }
        .current-label {
          border-color: ${isProfit ? '#10b981' : '#ef4444'};
        }
        .current-label .marker-label-value {
          color: ${isProfit ? '#6ee7b7' : '#fca5a5'};
        }
        .liquidation-label {
          background: rgba(239, 68, 68, 0.2);
          border-color: #ef4444;
        }
        .liquidation-label .marker-label-title {
          color: #fca5a5;
        }
        .liquidation-label .marker-label-value {
          color: #fca5a5;
        }
        .price-range {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: #9ca3af;
          font-weight: 500;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
};
