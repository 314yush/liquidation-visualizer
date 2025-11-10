import React, { useMemo, useState, useCallback, useRef } from 'react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Area, ComposedChart } from 'recharts';
import type { Position } from '../utils/liquidationCalculator';
import { calculateLiquidationPrice } from '../utils/liquidationCalculator';
import { motion } from 'framer-motion';

interface LeverageChartProps {
  position: Position;
  onLeverageChange?: (leverage: number) => void;
}

export const LeverageChart: React.FC<LeverageChartProps> = ({ position, onLeverageChange }) => {
  const [, setHoveredLeverage] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const { side, currentPrice } = position;
  const currentLeverage = position.leverage;

  // Generate data points for leverage from 1x to 500x
  const chartData = useMemo(() => {
    if (!currentPrice || currentPrice <= 0) {
      return [];
    }
    
    const data: Array<{ leverage: number; distanceFromLiquidation: number; distanceInPrice: number }> = [];
    for (let lev = 1; lev <= 500; lev += 2) {
      const testPosition: Position = {
        ...position,
        leverage: lev,
      };
      const liqPrice = calculateLiquidationPrice(testPosition);
      
      let distanceInPrice: number;
      let distanceFromLiquidation: number;
      
      if (side === 'long') {
        distanceInPrice = currentPrice - liqPrice;
        distanceFromLiquidation = currentPrice > 0 ? ((currentPrice - liqPrice) / currentPrice) * 100 : 0;
      } else {
        distanceInPrice = liqPrice - currentPrice;
        distanceFromLiquidation = currentPrice > 0 ? ((liqPrice - currentPrice) / currentPrice) * 100 : 0;
      }
      
      // Ensure valid numbers
      if (!isNaN(distanceFromLiquidation) && !isNaN(distanceInPrice) && isFinite(distanceFromLiquidation) && isFinite(distanceInPrice)) {
        data.push({ 
          leverage: lev, 
          distanceFromLiquidation: Math.max(0, distanceFromLiquidation),
          distanceInPrice
        });
      }
    }
    return data;
  }, [position, currentPrice, side]);

  // Current position data
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

  // Calculate max distance for fixed Y-axis - zoomed in to focus on relevant range
  // Use a smaller max to zoom in on the data
  const maxDistance = useMemo(() => {
    if (chartData.length === 0) return 30;
    const max = Math.max(...chartData.map(d => d.distanceFromLiquidation));
    // Round up to nearest 2.5, but cap at 30% for zoomed-in view
    // This focuses on the lower range where most data points are
    const calculatedMax = Math.ceil(max / 2.5) * 2.5;
    return Math.min(30, Math.max(10, calculatedMax));
  }, [chartData]);

  // Create safe zone data with null values outside safe zone
  const safeZoneChartData = useMemo(() => {
    return chartData.map(d => ({
      ...d,
      safeZoneDistance: d.leverage <= 20 ? d.distanceFromLiquidation : null
    }));
  }, [chartData]);

  // Find closest data point to current leverage for marker
  const currentDataPoint = useMemo(() => {
    return chartData.find(d => Math.abs(d.leverage - currentLeverage) <= 1) || 
           chartData.reduce((prev, curr) => 
             Math.abs(curr.leverage - currentLeverage) < Math.abs(prev.leverage - currentLeverage) ? curr : prev
           );
  }, [chartData, currentLeverage]);

  // Handle mouse move for hover
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging || !chartRef.current) return;
    
    const rect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const chartWidth = rect.width - 160; // Account for padding
    const leverage = Math.max(1, Math.min(500, Math.round((x / chartWidth) * 500)));
    setHoveredLeverage(leverage);
  }, [isDragging]);

  // Handle drag to adjust leverage
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!onLeverageChange || !chartRef.current) return;
    setIsDragging(true);
    
    const rect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const chartWidth = rect.width - 160;
    const leverage = Math.max(1, Math.min(500, Math.round((x / chartWidth) * 500)));
    onLeverageChange(leverage);
  }, [onLeverageChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="brutal-tooltip">
          <div className="tooltip-label">LEVERAGE: {data.leverage}X</div>
          <div className="tooltip-value">DISTANCE: {data.distanceFromLiquidation.toFixed(2)}%</div>
          <div className="tooltip-value">MARGIN: ${Math.abs(data.distanceInPrice).toFixed(2)}</div>
        </div>
      );
    }
    return null;
  };

  // Custom dot for current position - more visible
  const CurrentPositionDot = (props: any) => {
    const { cx, cy } = props;
    if (cx === undefined || cy === undefined) return null;
    
    return (
      <g>
        {/* Outer glow circle */}
        <circle
          cx={cx}
          cy={cy}
          r="12"
          fill="#F5C518"
          opacity="0.3"
        />
        {/* Main circle */}
        <circle
          cx={cx}
          cy={cy}
          r="10"
          fill="#000000"
          stroke="#F5C518"
          strokeWidth="4"
        />
        {/* Inner highlight */}
        <circle
          cx={cx}
          cy={cy}
          r="5"
          fill="#F5C518"
        />
        {/* Arrow pointer */}
        <polygon
          points={`${cx},${cy - 20} ${cx - 8},${cy - 32} ${cx + 8},${cy - 32}`}
          fill="#F5C518"
          stroke="#000000"
          strokeWidth="3"
        />
      </g>
    );
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Don't render if no data or invalid price
  if (!chartData || chartData.length === 0 || !currentPrice || currentPrice <= 0) {
    return (
      <div className="chart-container">
        <div className="chart-wrapper">
          <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'JetBrains Mono', color: '#000000' }}>
            LOADING CHART DATA...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="chart-container"
      ref={chartRef}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setHoveredLeverage(null);
        setIsDragging(false);
      }}
    >
      <div className="chart-wrapper">
        <ComposedChart
          width={900}
          height={400}
          data={safeZoneChartData}
          margin={{ top: 20, right: 30, left: 80, bottom: 40 }}
        >
          <defs>
            <linearGradient id="safeZoneGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00FFC2" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#00FFC2" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#000000" 
            strokeWidth="1"
            vertical={true}
            horizontal={true}
          />
          
          {/* Risk zone reference lines */}
          <ReferenceLine y={10} stroke="#F5C518" strokeWidth="2" strokeDasharray="5 5" label={{ value: "10% RISK ZONE", position: "right", fill: "#F5C518", fontFamily: 'Space Grotesk', fontSize: 11, fontWeight: 700 }} />
          <ReferenceLine y={5} stroke="#FF4E4E" strokeWidth="2" strokeDasharray="6 4" label={{ value: "5% CRITICAL", position: "right", fill: "#FF4E4E", fontFamily: 'Space Grotesk', fontSize: 11, fontWeight: 700 }} />
          <ReferenceLine y={20} stroke="#00FFC2" strokeWidth="2" strokeDasharray="5 5" label={{ value: "20% SAFE", position: "right", fill: "#00FFC2", fontFamily: 'Space Grotesk', fontSize: 11, fontWeight: 700 }} />
          <ReferenceLine y={7.5} stroke="#000000" strokeWidth="1" strokeDasharray="2 2" opacity={0.2} />
          <ReferenceLine y={12.5} stroke="#000000" strokeWidth="1" strokeDasharray="2 2" opacity={0.2} />
          <ReferenceLine y={17.5} stroke="#000000" strokeWidth="1" strokeDasharray="2 2" opacity={0.2} />
          
          {/* Key leverage reference lines */}
          <ReferenceLine x={10} stroke="#000000" strokeWidth="1" strokeDasharray="2 2" opacity={0.3} />
          <ReferenceLine x={50} stroke="#000000" strokeWidth="1" strokeDasharray="2 2" opacity={0.3} />
          <ReferenceLine x={100} stroke="#000000" strokeWidth="1" strokeDasharray="2 2" opacity={0.3} />
          <ReferenceLine x={250} stroke="#000000" strokeWidth="1" strokeDasharray="2 2" opacity={0.3} />
          <XAxis
            dataKey="leverage"
            type="number"
            stroke="#000000"
            strokeWidth="3"
            tick={{ fill: '#000000', fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 700 }}
            label={{ value: 'LEVERAGE (X)', position: 'insideBottom', offset: -10, fill: '#000000', fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 700 }}
            domain={[1, 500]}
            ticks={Array.from({ length: Math.floor(500 / 5) + 1 }, (_, i) => i * 5).filter(t => t >= 1 && t <= 500 && (t % 25 === 0 || t === 1 || t === 500))}
            allowDataOverflow={false}
            tickLine={{ stroke: '#000000', strokeWidth: 2 }}
          />
          <YAxis
            stroke="#000000"
            strokeWidth="3"
            tick={{ fill: '#000000', fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 700 }}
            label={{ value: 'DISTANCE TO LIQUIDATION (%)', angle: -90, position: 'insideLeft', fill: '#000000', fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 700 }}
            domain={[0, maxDistance]}
            allowDataOverflow={false}
            tickLine={{ stroke: '#000000', strokeWidth: 2 }}
            ticks={Array.from({ length: Math.floor(maxDistance / 2.5) + 1 }, (_, i) => i * 2.5)}
            tickFormatter={(value) => value % 5 === 0 ? `${value}%` : `${value.toFixed(1)}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Safe zone area (1x-20x) - more visible */}
          <Area
            type="monotone"
            dataKey="safeZoneDistance"
            fill="url(#safeZoneGradient)"
            stroke="#00FFC2"
            strokeWidth="2"
            isAnimationActive={false}
            connectNulls={false}
          />
          
          {/* Main line */}
          <Line
            type="monotone"
            dataKey="distanceFromLiquidation"
            stroke="#FF4E4E"
            strokeWidth="3"
            dot={false}
            activeDot={{ r: 8, fill: '#F5C518', stroke: '#000000', strokeWidth: 3 }}
            isAnimationActive={false}
            connectNulls={false}
          />
          
          {/* Current position reference line */}
          <ReferenceLine
            x={currentLeverage}
            stroke="#F5C518"
            strokeWidth="2"
            strokeDasharray="8 4"
            label={{ value: `CURRENT: ${currentLeverage}X`, position: "top", fill: "#F5C518", fontFamily: 'Space Grotesk', fontSize: 11, fontWeight: 700, offset: 10 }}
          />
          
          {/* Current position dot */}
          {currentDataPoint && (
            <Line
              type="monotone"
              dataKey="distanceFromLiquidation"
              data={[currentDataPoint]}
              stroke="none"
              dot={<CurrentPositionDot />}
              activeDot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
          )}
        </ComposedChart>
      </div>

      {/* Current position tooltip */}
      <motion.div
        className="current-position-tooltip"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '1rem',
        }}
      >
        <div className="tooltip-label">CURRENT POSITION</div>
        <div className="tooltip-value">LEVERAGE: {currentLeverage}X</div>
        <div className="tooltip-value">DISTANCE: {formatPercentage(currentDistanceFromLiquidation)}</div>
        <div className="tooltip-value">MARGIN: ${Math.abs(currentDistanceInPrice).toFixed(2)}</div>
      </motion.div>

      {/* Info box */}
      <div className="chart-info">
        <div className="info-icon">💡</div>
        <div className="info-text">
          <div>Increasing leverage reduces your liquidation distance exponentially.</div>
          <div>Spread impact at high leverage can increase liquidation risk by 10–30%.</div>
        </div>
      </div>

      <style>{`
        .chart-container {
          position: relative;
          width: 100%;
          padding: 1rem;
        }
        .chart-wrapper {
          background: #FFFFFF;
          border: 2px solid #000000;
          padding: 1rem;
          box-shadow: 4px 4px 0 0 #000000;
        }
        .brutal-tooltip {
          background: #F5C518;
          border: 2px solid #000000;
          padding: 0.75rem 1rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          box-shadow: 4px 4px 0 0 #000000;
        }
        .tooltip-label {
          font-weight: 700;
          color: #000000;
          margin-bottom: 0.25rem;
          text-transform: uppercase;
        }
        .tooltip-value {
          font-weight: 600;
          color: #000000;
          margin-bottom: 0.125rem;
        }
        .current-position-tooltip {
          background: #F5C518;
          border: 2px solid #000000;
          padding: 0.75rem 1rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          box-shadow: 4px 4px 0 0 #000000;
          text-align: center;
        }
        .chart-info {
          margin-top: 1.5rem;
          padding: 1rem;
          background: #FFFFFF;
          border: 2px solid #000000;
          box-shadow: 4px 4px 0 0 #000000;
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }
        .info-icon {
          font-size: 1.5rem;
        }
        .info-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          color: #000000;
          line-height: 1.6;
        }
        .info-text div {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
};
