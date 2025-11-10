import React, { useEffect, useRef } from 'react';
import type { LiquidationResult } from '../utils/liquidationCalculator';

interface LiquidationGaugeProps {
  result: LiquidationResult;
  position: { side: 'long' | 'short'; currentPrice: number; leverage: number };
}

export const LiquidationGauge: React.FC<LiquidationGaugeProps> = ({ result, position }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate gauge value (0-100) based on leverage
  // 1x leverage = 0% fill (empty, safe)
  // 500x leverage = 100% fill (full, close to liquidation)
  const gaugeValue = Math.min(100, Math.max(0, ((position.leverage - 1) / (500 - 1)) * 100));

  // Color based on risk level
  let gaugeColor: string;
  if (result.isCritical) {
    gaugeColor = '#FF4E4E'; // Red
  } else if (result.isAtRisk) {
    gaugeColor = '#F5C518'; // Yellow
  } else {
    gaugeColor = '#00FFC2'; // Green
  }

  const getColor = (value: number): string => {
    if (value < 20) {
      return '#00FFC2'; // Low - Green/Cyan
    } else if (value < 40) {
      return '#66FF33'; // Low to Moderate - Light Green
    } else if (value < 60) {
      return '#F5C518'; // Moderate - Yellow
    } else if (value < 80) {
      return '#FF9900'; // Moderate to High - Orange
    } else {
      return '#FF4E4E'; // High - Red
    }
  };

  const drawGauge = (value: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height;
    const radius = canvas.width / 2 - 10;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw gauge background
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
    ctx.lineWidth = 25;
    ctx.strokeStyle = '#E5E5E5';
    ctx.stroke();

    // Draw gauge value
    const startAngle = Math.PI;
    const endAngle = (value / 100) * Math.PI + startAngle;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.lineWidth = 24;
    ctx.strokeStyle = getColor(value);
    ctx.stroke();

    // Draw pointer
    const pointerLength = radius - 40;
    const pointerX = centerX + pointerLength * Math.cos(endAngle);
    const pointerY = centerY + pointerLength * Math.sin(endAngle);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(pointerX, pointerY);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000';
    ctx.stroke();

    // Draw center dot
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#000000';
    ctx.fill();
  };

  useEffect(() => {
    drawGauge(gaugeValue);
  }, [gaugeValue]);

  return (
    <div className="gauge-container">
      <div className="gauge-wrapper">
        <canvas
          ref={canvasRef}
          width={400}
          height={220}
          className="gauge-canvas"
        />
        <div className="gauge-label">
          <div className="gauge-value" style={{ color: gaugeColor }}>
            {result.distanceFromLiquidation.toFixed(2)}%
          </div>
          <div className="gauge-subtitle">FROM LIQUIDATION</div>
          <div className="gauge-dollar">
            ${Math.abs(result.distanceInPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AWAY
          </div>
        </div>
        <div className="gauge-labels">
          <span className="gauge-label-left">SAFE</span>
          <span className="gauge-label-right">LIQUIDATION</span>
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
        .gauge-canvas {
          width: 100%;
          height: 100%;
          display: block;
        }
        .gauge-label {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          width: 100%;
        }
        .gauge-labels {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          padding: 0 20px;
        }
        .gauge-label-left,
        .gauge-label-right {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          color: #000000;
          text-transform: uppercase;
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
