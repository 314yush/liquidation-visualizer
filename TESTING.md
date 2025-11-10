# Testing Guide

## Quick Start Testing

### 1. Install Dependencies (if not already done)
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The app will start on `http://localhost:5173` (or another port if 5173 is busy).

### 3. Open in Browser
Open the URL shown in the terminal (usually `http://localhost:5173`)

## Manual Testing Checklist

### ✅ Basic Functionality

#### Price Fetching
- [ ] **Auto-fetch on load**: When you open the app, the current price should automatically load from Binance
- [ ] **Market change**: Change the market dropdown - price should update automatically
- [ ] **Auto-refresh**: Wait 5 seconds - price should update automatically (check console for API calls)
- [ ] **Manual refresh**: Click the refresh button (🔄) - price should update
- [ ] **Manual override**: Type a custom price - auto-refresh should pause, "from Binance" label should disappear
- [ ] **Error handling**: Disconnect internet or block Binance API - should show error message

#### Position Calculation
- [ ] **Long position**: 
  - Market: BTC/USD
  - Side: Long
  - Collateral: 1000
  - Leverage: 10x
  - Entry: 50000
  - Current: 51000 (should show profit)
  - Click "Calculate Liquidation" - should show results

- [ ] **Short position**:
  - Market: ETH/USD
  - Side: Short
  - Collateral: 500
  - Leverage: 20x
  - Entry: 3000
  - Current: 2900 (should show profit)
  - Click "Calculate Liquidation" - should show results

- [ ] **High leverage (risky)**:
  - Leverage: 500x
  - Entry: 50000
  - Current: 50100 (very close to entry)
  - Should show "At Risk" or "Critical Risk" warning

#### Spread Integration
- [ ] **With pair info**: If Avantis API is accessible, spread should be calculated and shown
- [ ] **Without pair info**: If API fails, calculation should still work (without spread)

#### Visualizations
- [ ] **Gauge**: Should show distance from liquidation with color coding
- [ ] **Price indicator**: Should show entry, current, and liquidation prices on a bar
- [ ] **Stats cards**: Should display all metrics correctly
- [ ] **Risk warnings**: Should show appropriate warnings for risky positions

### ✅ Edge Cases

- [ ] **Zero collateral**: Try 0 collateral - should handle gracefully
- [ ] **Maximum leverage**: Try 500x leverage - should work
- [ ] **Very small price difference**: Entry 50000, Current 50001 - should calculate correctly
- [ ] **Large price difference**: Entry 50000, Current 60000 - should show large profit
- [ ] **Negative PnL**: Entry higher than current for long - should show loss
- [ ] **Invalid input**: Try negative numbers - browser validation should prevent
- [ ] **Very high prices**: Try prices like 1000000 - should format correctly

### ✅ UI/UX

- [ ] **Responsive design**: Resize browser window - layout should adapt
- [ ] **Loading states**: Button should show "Loading Market Data..." when fetching pair info
- [ ] **Price loading**: Price input should be disabled while loading
- [ ] **Error messages**: Should be clear and helpful
- [ ] **Form validation**: Required fields should be validated
- [ ] **Color coding**: 
  - Green for safe positions
  - Orange for at-risk positions
  - Red for critical positions

## Testing Different Scenarios

### Scenario 1: Safe Long Position
```
Market: BTC/USD
Side: Long
Collateral: $10,000
Leverage: 5x
Entry Price: $50,000
Current Price: $55,000
```
**Expected**: 
- Green gauge (safe)
- Positive PnL
- Distance from liquidation > 10%

### Scenario 2: Risky High Leverage
```
Market: ETH/USD
Side: Long
Collateral: $1,000
Leverage: 100x
Entry Price: $3,000
Current Price: $2,950
```
**Expected**:
- Orange/Red gauge (at risk)
- Negative PnL
- Distance from liquidation < 10%
- Warning message displayed

### Scenario 3: Short Position Near Liquidation
```
Market: SOL/USD
Side: Short
Collateral: $500
Leverage: 50x
Entry Price: $100
Current Price: $102
```
**Expected**:
- Close to liquidation
- Small distance remaining
- Risk warning

## API Testing

### Test Binance API Connection
Open browser console and check:
- Network tab should show requests to `fapi.binance.com`
- No CORS errors
- Prices should be valid numbers

### Test Avantis API Connection
- Network tab should show requests to `socket-api.avantisfi.com`
- Pair info should load (or show error if unavailable)
- Spread should be calculated if data available

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browser (responsive)

## Performance Testing

- [ ] **Initial load**: Should be fast (< 2 seconds)
- [ ] **Price updates**: Should be smooth (no flickering)
- [ ] **Multiple calculations**: Should handle rapid form submissions
- [ ] **Memory**: No memory leaks after extended use

## Common Issues to Check

1. **CORS errors**: If APIs are blocked, check browser console
2. **Price not updating**: Check if manual override is enabled
3. **Spread not showing**: Check if Avantis API is accessible
4. **Calculation errors**: Check browser console for errors

## Production Build Test

```bash
npm run build
npm run preview
```

Test the production build to ensure:
- [ ] Build completes without errors
- [ ] All features work in production mode
- [ ] Assets load correctly
- [ ] No console errors

## Next Steps for Automated Testing

If you want to add automated tests, consider:
- **Unit tests**: Test calculation functions
- **Integration tests**: Test API integrations
- **E2E tests**: Test user flows with Playwright or Cypress

To add testing:
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```


