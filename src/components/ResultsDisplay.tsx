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
  const distanceColor = result.isCritical ? '#FF4E4E' : result.isAtRisk ? '#F5C518' : '#00FFC2';
  
  return (
    <>
      {/* Liquidation Gauge */}
      <div className="brutal-card gauge-card">
        <div className="card-label">LIQUIDATION VISUALISER</div>
        <LiquidationGauge result={result} position={position} />
      </div>

      {/* Key Metric Cards */}
      <div className="brutal-card metric-card liquidation-card">
        <div className="card-label">LIQUIDATION PRICE</div>
        <div className="metric-content">
          <div className="metric-value danger">
            ${result.liquidationPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="metric-hint">Price at which position will be liquidated</div>
        </div>
      </div>
      
      <div className="brutal-card metric-card distance-card">
        <div className="card-label">DISTANCE FROM LIQUIDATION</div>
        <div className="metric-content">
          <div className="metric-value" style={{ color: distanceColor }}>
            {result.distanceFromLiquidation.toFixed(2)}%
          </div>
          <div className="metric-dollar">
            ${Math.abs(result.distanceInPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} away
          </div>
          <div className="metric-hint">Current safety margin</div>
        </div>
      </div>
      
      {result.spread !== undefined && (
        <div className="brutal-card metric-card spread-card">
          <div className="card-label">SPREAD IMPACT</div>
          <div className="metric-content">
            <div className="metric-value warning">
              {result.spread >= 0 ? '+' : ''}{result.spread.toFixed(4)}%
            </div>
            <div className="metric-hint">Applied to entry price</div>
          </div>
        </div>
      )}

      {/* Leverage Chart */}
      <div className="brutal-card chart-card">
        <div className="card-label">LEVERAGE VS LIQUIDATION MAP</div>
        <LeverageChart position={position} onLeverageChange={onLeverageChange} />
      </div>

      <style>{`
        .gauge-card {
          grid-column: span 6;
          grid-row: span 2;
          display: flex;
          flex-direction: column;
        }
        .metric-card {
          grid-column: span 3;
          display: flex;
          flex-direction: column;
        }
        .chart-card {
          grid-column: span 12;
        }
        .metric-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          margin-top: 1rem;
        }
        .metric-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 2rem;
          font-weight: 700;
          color: #000000;
          line-height: 1.1;
          margin-bottom: 0.5rem;
        }
        .metric-value.danger {
          color: #FF4E4E;
        }
        .metric-value.warning {
          color: #F5C518;
        }
        .metric-dollar {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1rem;
          font-weight: 600;
          color: #000000;
          margin-bottom: 0.5rem;
        }
        .metric-hint {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.75rem;
          color: #666666;
          margin-top: auto;
        }
        .liquidation-card {
          border-left: 4px solid #FF4E4E;
        }
        .distance-card {
          border-left: 4px solid ${distanceColor};
        }
        .spread-card {
          border-left: 4px solid #F5C518;
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
