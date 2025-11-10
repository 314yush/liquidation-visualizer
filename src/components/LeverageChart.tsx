import React, { useMemo, useState, useCallback } from 'react';
import type { Position } from '../utils/liquidationCalculator';
import { calculateLiquidationPrice } from '../utils/liquidationCalculator';

interface LeverageChartProps {
  position: Position;
  onLeverageChange?: (leverage: number) => void;
}

export const LeverageChart: React.FC<LeverageChartProps> = ({ position, onLeverageChange }) => {
  const [hoveredLeverage, setHoveredLeverage] = useState<number | null>(null);
  const { entryPrice, side, collateral, currentPrice } = position;
  const currentLeverage = position.leverage;

  // Generate data points for leverage from 1x to 500x
  // Calculate distance from liquidation for each leverage point
  const chartData = useMemo(() => {
    const data: Array<{ leverage: number; distanceFromLiquidation: number; distanceInPrice: number }> = [];
    for (let lev = 1; lev <= 500; lev += 5) {
      const testPosition: Position = {
        ...position,
        leverage: lev,
      };
      const liqPrice = calculateLiquidationPrice(testPosition);
      
      // Calculate distance from liquidation
      let distanceInPrice: number;
      let distanceFromLiquidation: number;
      
      if (side === 'long') {
        distanceInPrice = currentPrice - liqPrice;
        distanceFromLiquidation = ((currentPrice - liqPrice) / currentPrice) * 100;
      } else {
        distanceInPrice = liqPrice - currentPrice;
        distanceFromLiquidation = ((liqPrice - currentPrice) / currentPrice) * 100;
      }
      
      data.push({ 
        leverage: lev, 
        distanceFromLiquidation,
        distanceInPrice
      });
    }
    return data;
  }, [position, currentPrice, side]);

  // Calculate chart dimensions and scales
  const chartWidth = 800;
  const chartHeight = 320;
  const padding = { top: 40, right: 40, bottom: 60, left: 80 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const minLeverage = 1;
  const maxLeverage = 500;
  const minDistance = Math.min(...chartData.map(d => d.distanceFromLiquidation));
  const maxDistance = Math.max(...chartData.map(d => d.distanceFromLiquidation));
  const distanceRange = maxDistance - minDistance;
  const distancePadding = Math.max(distanceRange * 0.1, 1); // At least 1% padding

  // Scale functions
  const scaleX = (leverage: number) => {
    return padding.left + ((leverage - minLeverage) / (maxLeverage - minLeverage)) * plotWidth;
  };

  const scaleY = (distance: number) => {
    // Invert Y axis so higher distance (safer) is at the top
    return padding.top + plotHeight - ((distance - (minDistance - distancePadding)) / (maxDistance - minDistance + distancePadding * 2)) * plotHeight;
  };

  // Generate path for the line
  const linePath = useMemo(() => {
    if (chartData.length === 0) return '';
    const path = chartData.map((point, index) => {
      const x = scaleX(point.leverage);
      const y = scaleY(point.distanceFromLiquidation);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    return path;
  }, [chartData, scaleX, scaleY]);

  // Handle mouse move for interaction
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if mouse is in plot area
    if (x >= padding.left && x <= padding.left + plotWidth && 
        y >= padding.top && y <= padding.top + plotHeight) {
      // Convert mouse X to leverage
      const leverage = minLeverage + ((x - padding.left) / plotWidth) * (maxLeverage - minLeverage);
      setHoveredLeverage(Math.round(leverage));
    } else {
      setHoveredLeverage(null);
    }
  }, [padding, plotWidth, plotHeight, minLeverage, maxLeverage]);

  // Handle click to set leverage
  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!onLeverageChange) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;

    if (x >= padding.left && x <= padding.left + plotWidth) {
      const leverage = minLeverage + ((x - padding.left) / plotWidth) * (maxLeverage - minLeverage);
      const roundedLeverage = Math.max(1, Math.min(500, Math.round(leverage)));
      onLeverageChange(roundedLeverage);
    }
  }, [onLeverageChange, padding, plotWidth, minLeverage, maxLeverage]);

  // Current position point
  const currentLiquidationPrice = calculateLiquidationPrice(position);
  let currentDistanceFromLiquidation: number;
  let currentDistanceInPrice: number;
  if (side === 'long') {
    currentDistanceInPrice = currentPrice - currentLiquidationPrice;
    currentDistanceFromLiquidation = ((currentPrice - currentLiquidationPrice) / currentPrice) * 100;
  } else {
    currentDistanceInPrice = currentLiquidationPrice - currentPrice;
    currentDistanceFromLiquidation = ((currentLiquidationPrice - currentPrice) / currentPrice) * 100;
  }
  const currentX = scaleX(currentLeverage);
  const currentY = scaleY(currentDistanceFromLiquidation);

  // Hovered position point
  let hoveredDistanceFromLiquidation: number | null = null;
  let hoveredDistanceInPrice: number | null = null;
  if (hoveredLeverage) {
    const hoveredLiquidationPrice = calculateLiquidationPrice({ ...position, leverage: hoveredLeverage });
    if (side === 'long') {
      hoveredDistanceInPrice = currentPrice - hoveredLiquidationPrice;
      hoveredDistanceFromLiquidation = ((currentPrice - hoveredLiquidationPrice) / currentPrice) * 100;
    } else {
      hoveredDistanceInPrice = hoveredLiquidationPrice - currentPrice;
      hoveredDistanceFromLiquidation = ((hoveredLiquidationPrice - currentPrice) / currentPrice) * 100;
    }
  }
  const hoveredX = hoveredLeverage ? scaleX(hoveredLeverage) : null;
  const hoveredY = hoveredDistanceFromLiquidation !== null ? scaleY(hoveredDistanceFromLiquidation) : null;

  // Generate Y-axis ticks
  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const step = (maxDistance - minDistance + distancePadding * 2) / 5;
    for (let i = 0; i <= 5; i++) {
      ticks.push(minDistance - distancePadding + step * i);
    }
    return ticks;
  }, [minDistance, maxDistance, distancePadding]);

  // Generate X-axis ticks
  const xTicks = [1, 50, 100, 200, 300, 400, 500];

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="leverage-chart-container">
      <h3 className="chart-title">Distance from Liquidation vs Leverage</h3>
      
      <svg
        width={chartWidth}
        height={chartHeight}
        className="leverage-chart-svg"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseLeave={() => setHoveredLeverage(null)}
      >
        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <g key={`grid-y-${i}`}>
            <line
              x1={padding.left}
              y1={scaleY(tick)}
              x2={padding.left + plotWidth}
              y2={scaleY(tick)}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="1"
            />
          </g>
        ))}
        {xTicks.map((tick, i) => (
          <g key={`grid-x-${i}`}>
            <line
              x1={scaleX(tick)}
              y1={padding.top}
              x2={scaleX(tick)}
              y2={padding.top + plotHeight}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="1"
            />
          </g>
        ))}

        {/* Chart line */}
        <path
          d={linePath}
          fill="none"
          stroke={currentDistanceFromLiquidation < 10 ? '#ef4444' : currentDistanceFromLiquidation < 20 ? '#f59e0b' : '#10b981'}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Hovered point */}
        {hoveredLeverage && hoveredX !== null && hoveredY !== null && hoveredDistanceFromLiquidation !== null && (
          <>
            <circle
              cx={hoveredX}
              cy={hoveredY}
              r="6"
              fill="#ffffff"
              stroke={hoveredDistanceFromLiquidation < 10 ? '#ef4444' : hoveredDistanceFromLiquidation < 20 ? '#f59e0b' : '#10b981'}
              strokeWidth="2"
            />
            <g className="hover-tooltip">
              <rect
                x={hoveredX - 70}
                y={hoveredY - 60}
                width="140"
                height="50"
                rx="8"
                fill="rgba(0, 0, 0, 0.8)"
                stroke="rgba(255, 255, 255, 0.2)"
              />
              <text
                x={hoveredX}
                y={hoveredY - 45}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="12"
                fontWeight="600"
              >
                {hoveredLeverage}x Leverage
              </text>
              <text
                x={hoveredX}
                y={hoveredY - 28}
                textAnchor="middle"
                fill="#9ca3af"
                fontSize="11"
              >
                {formatPercentage(hoveredDistanceFromLiquidation)} away
              </text>
              <text
                x={hoveredX}
                y={hoveredY - 12}
                textAnchor="middle"
                fill="#9ca3af"
                fontSize="10"
              >
                {formatCurrency(hoveredDistanceInPrice!)}
              </text>
            </g>
          </>
        )}

        {/* Current position point */}
        <circle
          cx={currentX}
          cy={currentY}
          r="8"
          fill="#ffffff"
          stroke={currentDistanceFromLiquidation < 10 ? '#ef4444' : currentDistanceFromLiquidation < 20 ? '#f59e0b' : '#10b981'}
          strokeWidth="3"
          className="current-point"
        />
        <g className="current-tooltip">
          <rect
            x={currentX - 80}
            y={currentY - 70}
            width="160"
            height="60"
            rx="8"
            fill="rgba(99, 102, 241, 0.9)"
            stroke="rgba(255, 255, 255, 0.3)"
          />
          <text
            x={currentX}
            y={currentY - 50}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="11"
            fontWeight="600"
          >
            Current Position
          </text>
          <text
            x={currentX}
            y={currentY - 35}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="13"
            fontWeight="700"
          >
            {currentLeverage}x Leverage
          </text>
          <text
            x={currentX}
            y={currentY - 20}
            textAnchor="middle"
            fill="#a5b4fc"
            fontSize="11"
          >
            {formatPercentage(currentDistanceFromLiquidation)} away
          </text>
          <text
            x={currentX}
            y={currentY - 7}
            textAnchor="middle"
            fill="#a5b4fc"
            fontSize="10"
          >
            {formatCurrency(currentDistanceInPrice)}
          </text>
        </g>

        {/* Y-axis */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + plotHeight}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="2"
        />
        {yTicks.map((tick, i) => (
          <g key={`y-tick-${i}`}>
            <line
              x1={padding.left - 5}
              y1={scaleY(tick)}
              x2={padding.left}
              y2={scaleY(tick)}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1"
            />
            <text
              x={padding.left - 10}
              y={scaleY(tick) + 4}
              textAnchor="end"
              fill="#9ca3af"
              fontSize="11"
            >
              {formatPercentage(tick)}
            </text>
          </g>
        ))}
        <text
          x={-chartHeight / 2}
          y={20}
          transform={`rotate(-90 ${20} ${chartHeight / 2})`}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="12"
          fontWeight="600"
        >
          Distance from Liquidation (%)
        </text>

        {/* X-axis */}
        <line
          x1={padding.left}
          y1={padding.top + plotHeight}
          x2={padding.left + plotWidth}
          y2={padding.top + plotHeight}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="2"
        />
        {xTicks.map((tick, i) => (
          <g key={`x-tick-${i}`}>
            <line
              x1={scaleX(tick)}
              y1={padding.top + plotHeight}
              x2={scaleX(tick)}
              y2={padding.top + plotHeight + 5}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1"
            />
            <text
              x={scaleX(tick)}
              y={padding.top + plotHeight + 25}
              textAnchor="middle"
              fill="#9ca3af"
              fontSize="11"
            >
              {tick}x
            </text>
          </g>
        ))}
        <text
          x={padding.left + plotWidth / 2}
          y={chartHeight - 10}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="12"
          fontWeight="600"
        >
          Leverage
        </text>
      </svg>

      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ 
            background: currentDistanceFromLiquidation < 10 ? '#ef4444' : currentDistanceFromLiquidation < 20 ? '#f59e0b' : '#10b981' 
          }} />
          <span>Distance from Liquidation</span>
        </div>
        <div className="legend-item">
          <div className="legend-color current" />
          <span>Current Position ({currentLeverage}x - {formatPercentage(currentDistanceFromLiquidation)} away)</span>
        </div>
        <p className="chart-hint">Click on the chart to adjust leverage and see how it affects your safety margin</p>
      </div>

      <style>{`
        .leverage-chart-container {
          width: 100%;
        }
        .chart-title {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
        }
        .leverage-chart-svg {
          width: 100%;
          height: auto;
          cursor: crosshair;
        }
        .current-point {
          filter: drop-shadow(0 4px 8px rgba(99, 102, 241, 0.4));
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        .hover-tooltip text,
        .current-tooltip text {
          pointer-events: none;
        }
        .chart-legend {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.875rem;
          color: #d1d5db;
        }
        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 4px;
        }
        .legend-color.current {
          background: #6366f1;
          border: 2px solid #ffffff;
        }
        .chart-hint {
          margin: 0.5rem 0 0 0;
          font-size: 0.75rem;
          color: #6b7280;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

