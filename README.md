# Avantis Liquidation Visualizer

A web application to help traders visualize their distance from liquidation on Avantis, an AMM-based perpetual DEX offering up to 500x leverage.

## Features

- **Real-time Price Data**: Automatically fetches current prices from Binance Futures API
- **Real-time Liquidation Calculation**: Calculate liquidation prices based on position parameters
- **Dynamic Spread Integration**: Accounts for dynamic spreads that increase with leverage
- **Auto-refresh**: Prices update automatically every 5 seconds
- **Manual Override**: Users can manually set prices if needed
- **Visual Risk Indicators**: 
  - Gauge showing distance from liquidation
  - Price indicator showing entry, current, and liquidation prices
  - Color-coded risk warnings
- **Multiple Markets**: Support for various trading pairs (BTC, ETH, SOL, etc.)
- **Comprehensive Stats**: 
  - Liquidation price
  - Distance from liquidation (percentage and absolute)
  - Current margin ratio
  - Unrealized PnL
  - Current equity
  - Dynamic spread percentage

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

The app automatically fetches:
- **Pair information** from the Avantis API (`https://socket-api.avantisfi.com/v1/data`) to calculate dynamic spreads
- **Current prices** from Binance Futures API (`https://fapi.binance.com/fapi/v1/ticker/price`)

If either API is unavailable, calculations will proceed with available data or fallback values.

## Customization

### Spread Calculation

The dynamic spread calculation is fully integrated and uses the Avantis algorithm:
- **Price Impact Spread**: Based on position size and market depth
- **Skew Impact Spread**: Based on open interest imbalance
- **Dynamic Caps**: Spreads are capped based on pair parameters

The calculation is located in `src/utils/spreadCalculator.ts` and uses real-time data from the Avantis API.

### Market Mapping

The market-to-pair-index mapping is in `src/utils/pairInfoApi.ts`. Update the `getPairIndexFromMarket` function if your market indices differ:
- BTC/USD: 0
- ETH/USD: 1
- SOL/USD: 2
- etc.

### Maintenance Margin

The maintenance margin is currently set to 0.5% in `src/utils/liquidationCalculator.ts`. Adjust the `maintenanceMargin` constant in the `calculateLiquidationPrice` function to match your protocol's settings.

### Markets

Add or modify markets in `src/components/PositionForm.tsx` in the `MARKETS` array. Make sure to also update the market-to-symbol mapping in `src/utils/binanceApi.ts` if you add new markets.

### Price Source

Prices are fetched from Binance Futures API. The market mapping is:
- BTC/USD → BTCUSDT
- ETH/USD → ETHUSDT
- SOL/USD → SOLUSDT
- etc.

To change the price source or add more exchanges, modify `src/utils/binanceApi.ts`.

## Quick Start

1. **Install dependencies**:
```bash
npm install
```

2. **Start development server**:
```bash
npm run dev
```

3. **Open browser**: Navigate to the URL shown (usually `http://localhost:5173`)

4. **Test the app**: See [TESTING.md](./TESTING.md) for detailed testing instructions

## Usage

1. Select a market from the dropdown (price auto-loads from Binance)
2. Choose your position side (Long or Short)
3. Enter your collateral amount
4. Set your leverage (1x to 500x)
5. Enter your entry price
6. Current price is auto-fetched (or enter manually)
7. Click "Calculate Liquidation" to see the visualization

## Risk Warnings

- **Critical Risk** (Red): Within 5% of liquidation price
- **At Risk** (Orange): Within 10% of liquidation price
- **Safe** (Green): More than 10% away from liquidation

## Technology Stack

- React 18
- TypeScript
- Vite
- CSS-in-JS (inline styles)

## License

MIT


