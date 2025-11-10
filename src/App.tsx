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

  // Fetch pair info on mount
  useEffect(() => {
    async function loadPairInfo() {
      try {
        const data = await fetchPairInfo();
        setPairInfoData(data);
      } catch (error) {
        console.error('Failed to load pair info:', error);
      }
    }
    
    loadPairInfo();
    
    // Refresh pair info every 30 seconds
    const interval = setInterval(loadPairInfo, 30000);
    return () => clearInterval(interval);
  }, []);

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
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Avantis Liquidation Visualizer</h1>
        <p className="subtitle">
          Visualize your distance from liquidation with up to 500x leverage
        </p>
      </header>

      <main className="app-main">
        <div className="bento-container">
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

      <style>{`
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .app {
          min-height: 100vh;
          background: #0a0e27;
          background-image: 
            radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
            radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
          display: flex;
          flex-direction: column;
        }
        .app-header {
          padding: 1.5rem 2rem 1rem;
          text-align: center;
          color: #ffffff;
        }
        .app-header h1 {
          margin: 0 0 0.25rem 0;
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }
        .subtitle {
          margin: 0;
          font-size: 0.875rem;
          color: #9ca3af;
          font-weight: 400;
        }
        .app-main {
          flex: 1;
          padding: 1rem 2rem 2rem;
        }
        .bento-container {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 1rem;
          grid-auto-rows: minmax(80px, auto);
        }
      `}</style>
    </div>
  );
}

export default App;


