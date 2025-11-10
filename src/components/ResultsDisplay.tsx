import React from 'react';
import type { Position, LiquidationResult } from '../utils/liquidationCalculator';
import { LiquidationGauge } from './LiquidationGauge';
import { LeverageChart } from './LeverageChart';

interface ResultsDisplayProps {
  position: Position;
  result: LiquidationResult;
  onLeverageChange?: (leverage: number) => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ position, result, onLeverageChange }) => {
  const distanceColor = result.isCritical ? '#ef4444' : result.isAtRisk ? '#f59e0b' : '#10b981';
  
  return (
    <>
      <div className="bento-card gauge-card">
        <LiquidationGauge result={result} position={position} />
      </div>

      <div className="bento-card stat-card liquidation-card">
        <div className="stat-label">Liquidation Price</div>
        <div className="stat-value danger">${result.liquidationPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div className="stat-hint">Price at which position will be liquidated</div>
      </div>
      
      <div className="bento-card stat-card distance-card">
        <div className="stat-label">Distance from Liquidation</div>
        <div className="stat-value" style={{ color: distanceColor }}>
          {result.distanceFromLiquidation.toFixed(2)}%
        </div>
        <div className="stat-dollar">
          ${Math.abs(result.distanceInPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} away
        </div>
        <div className="stat-hint">Current safety margin</div>
      </div>
      
      {result.spread !== undefined && (
        <div className="bento-card stat-card spread-card">
          <div className="stat-label">Dynamic Spread</div>
          <div className="stat-value warning">
            {result.spread >= 0 ? '+' : ''}{result.spread.toFixed(4)}%
          </div>
          <div className="stat-hint">Applied to entry price</div>
        </div>
      )}

      <div className="bento-card leverage-chart-card">
        <LeverageChart position={position} onLeverageChange={onLeverageChange} />
      </div>


      <style>{`
        .bento-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1rem;
          padding: 1.25rem;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .bento-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
        }
        .bento-card:hover {
          border-color: rgba(255, 255, 255, 0.15);
        }
        .gauge-card {
          grid-column: span 6;
          grid-row: span 2;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .stat-card {
          grid-column: span 4;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .liquidation-card {
          border-left: 3px solid #ef4444;
        }
        .distance-card {
          border-left: 3px solid ${distanceColor};
        }
        .spread-card {
          border-left: 3px solid #f59e0b;
        }
        .leverage-chart-card {
          grid-column: span 12;
        }
        .stat-label {
          font-size: 0.7rem;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.75rem;
          font-weight: 600;
        }
        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.1;
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }
        .stat-value.danger {
          color: #ef4444;
        }
        .stat-value.warning {
          color: #f59e0b;
        }
        .stat-dollar {
          font-size: 1rem;
          font-weight: 600;
          color: #d1d5db;
          margin-bottom: 0.375rem;
        }
        .stat-hint {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: auto;
        }
      `}</style>
    </>
  );
};
