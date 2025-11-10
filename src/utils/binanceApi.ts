/**
 * Binance API utilities for fetching real-time prices
 * Uses Binance Futures API for perpetual contracts
 */

// Use proxy in development to avoid CORS issues
const BINANCE_FUTURES_API = import.meta.env.DEV
  ? '/api/binance/fapi/v1/ticker/price'
  : 'https://fapi.binance.com/fapi/v1/ticker/price';

/**
 * Map market names to Binance futures symbols
 */
export function getBinanceSymbol(market: string): string {
  const marketMap: Record<string, string> = {
    'BTC/USD': 'BTCUSDT',
    'ETH/USD': 'ETHUSDT',
    'SOL/USD': 'SOLUSDT',
    'AVAX/USD': 'AVAXUSDT',
    'MATIC/USD': 'MATICUSDT',
    'ARB/USD': 'ARBUSDT',
    'OP/USD': 'OPUSDT',
  };
  
  return marketMap[market] || 'BTCUSDT';
}

/**
 * Fetch current price from Binance Futures API
 */
export async function fetchBinancePrice(market: string): Promise<number> {
  const symbol = getBinanceSymbol(market);
  
  try {
    const response = await fetch(`${BINANCE_FUTURES_API}?symbol=${symbol}`);
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.price) {
      throw new Error('Price not found in response');
    }
    
    return parseFloat(data.price);
  } catch (error) {
    console.error(`Error fetching Binance price for ${market}:`, error);
    throw error;
  }
}

/**
 * Fetch prices for multiple markets
 * Note: Binance doesn't have a direct endpoint for multiple symbols in one call
 * This function fetches prices sequentially (for future optimization, consider batching)
 */
export async function fetchMultiplePrices(markets: string[]): Promise<Record<string, number>> {
  const priceMap: Record<string, number> = {};
  
  try {
    // Fetch prices in parallel
    const pricePromises = markets.map(async (market) => {
      try {
        const price = await fetchBinancePrice(market);
        return { market, price };
      } catch (error) {
        console.error(`Failed to fetch price for ${market}:`, error);
        return null;
      }
    });
    
    const results = await Promise.all(pricePromises);
    
    results.forEach((result) => {
      if (result) {
        priceMap[result.market] = result.price;
      }
    });
    
    return priceMap;
  } catch (error) {
    console.error('Error fetching multiple Binance prices:', error);
    throw error;
  }
}

