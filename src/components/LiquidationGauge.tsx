import React from 'react';
import type { LiquidationResult } from '../utils/liquidationCalculator';

interface LiquidationGaugeProps {
  result: LiquidationResult;
  position: { side: 'long' | 'short'; currentPrice: number };
}

export const LiquidationGauge: React.FC<LiquidationGaugeProps> = ({ result }) => {
  // Calculate gauge percentage (0-100%)
  // We'll show how close to liquidation (0% = liquidated, 100% = very safe)
  const safetyPercentage = Math.max(0, Math.min(100, result.distanceFromLiquidation * 10));
  
  // Color based on risk level
  let gaugeColor: string;
  let gaugeGradient: string;
  if (result.isCritical) {
    gaugeColor = '#ef4444'; // Red
    gaugeGradient = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
  } else if (result.isAtRisk) {
    gaugeColor = '#f59e0b'; // Orange
    gaugeGradient = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
  } else {
    gaugeColor = '#10b981'; // Green
    gaugeGradient = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
  }
  
  // Calculate angle for gauge (0-180 degrees)
  const angle = (safetyPercentage / 100) * 180;
  
  return (
    <div className="gauge-container">
      <div className="gauge-wrapper">
        <svg viewBox="0 0 200 120" className="gauge-svg">
          {/* Background arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="18"
            strokeLinecap="round"
          />
          {/* Foreground arc (colored based on risk) */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={result.isCritical ? '#ef4444' : result.isAtRisk ? '#f59e0b' : '#10b981'} />
              <stop offset="100%" stopColor={result.isCritical ? '#dc2626' : result.isAtRisk ? '#d97706' : '#059669'} />
            </linearGradient>
          </defs>
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={`${(angle / 180) * 502.65} 502.65`}
            transform="rotate(180 100 100)"
            style={{ transformOrigin: '100px 100px' }}
          />
          {/* Needle */}
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="25"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            transform={`rotate(${angle - 90} 100 100)`}
            style={{ transformOrigin: '100px 100px' }}
          />
          {/* Needle center dot */}
          <circle cx="100" cy="100" r="4" fill="#ffffff" />
        </svg>
        <div className="gauge-label">
          <div className="gauge-value" style={{ color: gaugeColor }}>
            {result.distanceFromLiquidation.toFixed(2)}%
          </div>
          <div className="gauge-subtitle">from liquidation</div>
          <div className="gauge-dollar">
            ${Math.abs(result.distanceInPrice).toFixed(2)} away
          </div>
        </div>
      </div>
      <style>{`
        .gauge-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0.5rem;
          width: 100%;
        }
        .gauge-wrapper {
          position: relative;
          width: 100%;
          max-width: 320px;
          height: 180px;
        }
        .gauge-svg {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3));
        }
        .gauge-label {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          width: 100%;
        }
        .gauge-value {
          font-size: 2.25rem;
          font-weight: 700;
          line-height: 1;
          margin-bottom: 0.125rem;
          letter-spacing: -0.02em;
        }
        .gauge-subtitle {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-top: 0.25rem;
          font-weight: 500;
        }
        .gauge-dollar {
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
          margin-top: 0.5rem;
          padding: 0.375rem 0.75rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.5rem;
          display: inline-block;
          backdrop-filter: blur(10px);
        }
      `}</style>
    </div>
  );
};
