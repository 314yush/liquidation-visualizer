import React from 'react';
import type { LiquidationResult } from '../utils/liquidationCalculator';

interface LiquidationGaugeProps {
  result: LiquidationResult;
  position: { side: 'long' | 'short'; currentPrice: number };
}

export const LiquidationGauge: React.FC<LiquidationGaugeProps> = ({ result }) => {
  // Calculate gauge fill percentage
  // The gauge shows distance from liquidation
  // Map distance to gauge fill: 0% distance = 0% fill (at liquidation), higher distance = more fill (towards safe)
  // Use a scale where 5% distance = 100% filled gauge for better visibility
  const maxDistanceForGauge = 5; // 5% distance = 100% filled gauge
  const fillPercentage = Math.min(100, Math.max(0, (result.distanceFromLiquidation / maxDistanceForGauge) * 100));
  
  // Color based on risk level
  let gaugeColor: string;
  if (result.isCritical) {
    gaugeColor = '#FF4E4E'; // Red
  } else if (result.isAtRisk) {
    gaugeColor = '#F5C518'; // Yellow
  } else {
    gaugeColor = '#00FFC2'; // Green
  }
  
  // Calculate gauge fill
  // The gauge shows distance FROM liquidation
  // - Small distance (close to liquidation) = fill should be near LIQUIDATION end (right)
  // - Large distance (safe) = fill should be near SAFE end (left)
  // Since the path goes from left to right, and is rotated 180deg, we fill from the start
  const angle = (fillPercentage / 100) * 180; // Angle in degrees
  
  // Arc length for 180-degree arc with radius 80: π * r = π * 80 ≈ 251.33
  const arcLength = Math.PI * 80;
  
  // Calculate dash array - fill from start of path
  const dashLength = (angle / 180) * arcLength;
  
  // Generate tick marks
  const ticks = [];
  for (let i = 0; i <= 10; i++) {
    const tickAngle = (i / 10) * 180;
    ticks.push(tickAngle);
  }
  
  return (
    <div className="gauge-container">
      <div className="gauge-wrapper">
        <svg viewBox="0 0 200 140" className="gauge-svg">
          {/* Background arc */}
          <path
            d="M 20 120 A 80 80 0 0 1 180 120"
            fill="none"
            stroke="#E5E5E5"
            strokeWidth="20"
            strokeLinecap="round"
          />
          
          {/* Color segments */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00FFC2" />
              <stop offset="50%" stopColor="#F5C518" />
              <stop offset="100%" stopColor="#FF4E4E" />
            </linearGradient>
          </defs>
          
          {/* Foreground arc (colored based on risk) */}
          {/* Fill represents distance from liquidation - more distance = more fill */}
          {/* Path goes from left (SAFE) to right (LIQUIDATION) */}
          {/* We want: small distance = near right (LIQUIDATION), large distance = near left (SAFE) */}
          {/* So we fill from right by using dashOffset to start from the end */}
          <path
            d="M 20 120 A 80 80 0 0 1 180 120"
            fill="none"
            stroke={gaugeColor}
            strokeWidth="20"
            strokeLinecap="round"
            strokeDasharray={`${dashLength} ${arcLength}`}
            strokeDashoffset={arcLength - dashLength}
            transform="rotate(180 100 120)"
            style={{ transformOrigin: '100px 120px' }}
          />
          
          {/* Tick marks */}
          {ticks.map((tickAngle, i) => {
            const rad = (tickAngle - 90) * (Math.PI / 180);
            const x1 = 100 + 70 * Math.cos(rad);
            const y1 = 120 + 70 * Math.sin(rad);
            const x2 = 100 + 80 * Math.cos(rad);
            const y2 = 120 + 80 * Math.sin(rad);
            const isMajor = i % 2 === 0;
            
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#000000"
                strokeWidth={isMajor ? 2 : 1}
              />
            );
          })}
          
          {/* Labels */}
          <text x="20" y="135" fontFamily="Space Grotesk" fontSize="8" fontWeight="700" fill="#000000">
            SAFE
          </text>
          <text x="160" y="135" fontFamily="Space Grotesk" fontSize="8" fontWeight="700" fill="#000000" textAnchor="end">
            LIQUIDATION
          </text>
          
          {/* Needle - points to current position on gauge */}
          <line
            x1="100"
            y1="120"
            x2="100"
            y2="30"
            stroke="#000000"
            strokeWidth="3"
            strokeLinecap="round"
            transform={`rotate(${angle - 90} 100 120)`}
            style={{ transformOrigin: '100px 120px' }}
          />
          
          {/* Needle center dot */}
          <circle cx="100" cy="120" r="5" fill="#000000" />
        </svg>
        
        <div className="gauge-label">
          <div className="gauge-value" style={{ color: gaugeColor }}>
            {result.distanceFromLiquidation.toFixed(2)}%
          </div>
          <div className="gauge-subtitle">FROM LIQUIDATION</div>
          <div className="gauge-dollar">
            ${Math.abs(result.distanceInPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AWAY
          </div>
        </div>
      </div>
      
      <style>{`
        .gauge-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 1rem;
          width: 100%;
          flex: 1;
        }
        .gauge-wrapper {
          position: relative;
          width: 100%;
          max-width: 400px;
          height: 220px;
        }
        .gauge-svg {
          width: 100%;
          height: 100%;
        }
        .gauge-label {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          width: 100%;
        }
        .gauge-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 2.5rem;
          font-weight: 700;
          line-height: 1;
          margin-bottom: 0.25rem;
          letter-spacing: -0.02em;
        }
        .gauge-subtitle {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.7rem;
          color: #000000;
          margin-top: 0.25rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .gauge-dollar {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.875rem;
          font-weight: 600;
          color: #000000;
          margin-top: 0.5rem;
          padding: 0.5rem 1rem;
          background: #F5C518;
          border: 2px solid #000000;
          display: inline-block;
          box-shadow: 3px 3px 0 0 #000000;
        }
      `}</style>
    </div>
  );
};
