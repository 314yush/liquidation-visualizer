import { useState, useEffect } from 'react';
import type { Position, LiquidationResult } from './utils/liquidationCalculator';
import { calculateLiquidationWithSpread } from './utils/liquidationCalculator';
import { PositionForm } from './components/PositionForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { fetchPairInfo, getPairIndexFromMarket } from './utils/pairInfoApi';
import type { PairInfoResponse } from './types/pairInfo';

function App() {
  const [position, setPosition] = useState<Position | null>(null);
  const [result, setResult] = useState<LiquidationResult | null>(null);
  const [pairInfoData, setPairInfoData] = useState<PairInfoResponse | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  // Fetch pair info on mount
  useEffect(() => {
    async function loadPairInfo() {
      try {
        const data = await fetchPairInfo();
        setPairInfoData(data);
        setLastUpdateTime(new Date());
      } catch (error) {
        console.error('Failed to load pair info:', error);
      }
    }
    
    loadPairInfo();
    
    // Refresh pair info every 30 seconds
    const interval = setInterval(loadPairInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update last update time when position changes
  useEffect(() => {
    if (position) {
      setLastUpdateTime(new Date());
    }
  }, [position]);

  const handlePositionSubmit = (newPosition: Position) => {
    // Attach pair info to position if available
    let positionWithPairInfo = { ...newPosition };
    
    if (pairInfoData) {
      const pairIndex = getPairIndexFromMarket(newPosition.market);
      const pairInfo = pairInfoData[pairIndex];
      if (pairInfo) {
        positionWithPairInfo.pairInfo = pairInfo;
      }
    }
    
    setPosition(positionWithPairInfo);
    const liquidationResult = calculateLiquidationWithSpread(positionWithPairInfo);
    setResult(liquidationResult);
    setLastUpdateTime(new Date());
  };

  const getTimeSinceUpdate = () => {
    const seconds = Math.floor((new Date().getTime() - lastUpdateTime.getTime()) / 1000);
    return seconds;
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>AVANTIS RISK DASHBOARD</h1>
          <div className="header-controls">
            <div className="market-selector-wrapper">
              <label className="header-label">MARKET</label>
              <select 
                className="market-selector"
                value={position?.market || 'BTC/USD'}
                onChange={(e) => {
                  if (position) {
                    handlePositionSubmit({ ...position, market: e.target.value });
                  }
                }}
              >
                <option value="BTC/USD">BTC/USD</option>
                <option value="ETH/USD">ETH/USD</option>
                <option value="SOL/USD">SOL/USD</option>
              </select>
            </div>
            <div className="live-toggle-wrapper">
              <label className="header-label">LIVE MODE</label>
              <div className="live-toggle">
                <input type="checkbox" id="liveToggle" defaultChecked />
                <label htmlFor="liveToggle" className="toggle-switch"></label>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="dashboard-container">
          <PositionForm 
            onSubmit={handlePositionSubmit} 
            initialPosition={position || undefined}
          />
          
          {position && result && (
            <ResultsDisplay 
              position={position} 
              result={result}
              onLeverageChange={(leverage) => {
                const updatedPosition = { ...position, leverage };
                handlePositionSubmit(updatedPosition);
              }}
            />
          )}
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-strip">
          [ AVANTIS sAMM ENGINE | 500x MAX LEVERAGE | DYNAMIC SPREAD ACTIVE | LAST UPDATE: {getTimeSinceUpdate()}s AGO ]
        </div>
      </footer>

      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          margin: 0;
          font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background: #F8F8F8;
        }
        .app {
          min-height: 100vh;
          background: #F8F8F8;
          display: flex;
          flex-direction: column;
        }
        .app-header {
          background: #FFFFFF;
          border-bottom: 3px solid #000000;
          padding: 1.5rem 2rem;
          box-shadow: 0 4px 0 0 #000000;
        }
        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2rem;
        }
        .app-header h1 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 0;
        }
        .header-controls {
          display: flex;
          gap: 2rem;
          align-items: flex-end;
        }
        .market-selector-wrapper,
        .live-toggle-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .header-label {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .market-selector {
          padding: 0.75rem 1rem;
          border: 2px solid #000000;
          background: #FFFFFF;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.875rem;
          font-weight: 600;
          color: #000000;
          cursor: pointer;
          box-shadow: 4px 4px 0 0 #000000;
          transition: all 0.1s;
        }
        .market-selector:hover {
          transform: translate(-2px, -2px);
          box-shadow: 6px 6px 0 0 #000000;
        }
        .market-selector:active {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0 0 #000000;
        }
        .live-toggle {
          display: flex;
          align-items: center;
        }
        .live-toggle input[type="checkbox"] {
          display: none;
        }
        .toggle-switch {
          width: 60px;
          height: 32px;
          background: #FFFFFF;
          border: 2px solid #000000;
          position: relative;
          cursor: pointer;
          box-shadow: 4px 4px 0 0 #000000;
          transition: all 0.1s;
        }
        .toggle-switch::before {
          content: '';
          position: absolute;
          width: 24px;
          height: 24px;
          background: #000000;
          top: 2px;
          left: 2px;
          transition: all 0.1s;
        }
        .live-toggle input[type="checkbox"]:checked + .toggle-switch::before {
          left: 32px;
          background: #F5C518;
        }
        .live-toggle input[type="checkbox"]:checked + .toggle-switch {
          background: #F5C518;
        }
        .toggle-switch:active {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0 0 #000000;
        }
        .app-main {
          flex: 1;
          padding: 2rem;
        }
        .dashboard-container {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 1.5rem;
          grid-auto-rows: minmax(100px, auto);
        }
        .app-footer {
          background: #000000;
          border-top: 3px solid #F5C518;
          padding: 0.75rem 2rem;
        }
        .footer-strip {
          max-width: 1400px;
          margin: 0 auto;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          color: #F5C518;
          text-align: center;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
}

export default App;
