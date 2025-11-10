# Liquidation Math Explanation

## Current Formula

For a position with:
- **Entry Price**: P
- **Leverage**: L (e.g., 500 for 500x)
- **Maintenance Margin**: M (currently 0.5% = 0.005)

### Long Position Liquidation

**Formula**: `Liquidation Price = Entry Price × (1 - 1/Leverage - Maintenance Margin)`

**Example** (500x leverage, $105,824.50 entry):
- Liquidation = $105,824.50 × (1 - 1/500 - 0.005)
- Liquidation = $105,824.50 × (1 - 0.002 - 0.005)
- Liquidation = $105,824.50 × 0.993
- Liquidation = **$105,083.73**

**Distance**: $105,824.50 - $105,083.73 = **$740.77 (0.70%)**

### Short Position Liquidation

**Formula**: `Liquidation Price = Entry Price × (1 + 1/Leverage + Maintenance Margin)`

**Example** (500x leverage, $105,824.50 entry):
- Liquidation = $105,824.50 × (1 + 1/500 + 0.005)
- Liquidation = $105,824.50 × (1 + 0.002 + 0.005)
- Liquidation = $105,824.50 × 1.007
- Liquidation = **$106,565.27**

**Distance**: $106,565.27 - $105,824.50 = **$740.77 (0.70%)**

## Why This Formula?

1. **Position Size**: With $1,000 collateral at 500x = $500,000 position
2. **Price Move to Liquidation**: 
   - Loss = Position Size × Price Move %
   - At liquidation: Loss = Collateral
   - Therefore: Price Move % = Collateral / Position Size = 1 / Leverage
   - For 500x: 1/500 = 0.2%
3. **Maintenance Margin**: Additional buffer (0.5%) before liquidation
4. **Total Move**: 0.2% + 0.5% = **0.7%**

## Potential Issues

If this seems inaccurate, it could be:

1. **Wrong Maintenance Margin**: Avantis might use a different maintenance margin rate
2. **Different Formula**: Your protocol might use a different liquidation formula
3. **Spread Impact**: The spread might be affecting the calculation differently than expected
4. **Initial Margin**: Some protocols use initial margin requirements that differ

## Questions to Verify

1. What is Avantis's actual maintenance margin rate?
2. Does Avantis use a different liquidation formula?
3. Should we account for fees or other factors?
4. Is there a minimum margin requirement that differs from maintenance margin?

Please provide the correct formula or values so we can update the calculation!


