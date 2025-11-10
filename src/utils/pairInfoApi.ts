import type { PairInfoResponse } from '../types/pairInfo';

// Use proxy in development to avoid CORS issues
const API_URL = import.meta.env.DEV 
  ? '/api/avantisfi/v1/data'
  : 'https://socket-api.avantisfi.com/v1/data';

let cachedPairInfo: PairInfoResponse | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

/**
 * Fetch pair information from Avantis API
 */
export async function fetchPairInfo(): Promise<PairInfoResponse> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (cachedPairInfo && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedPairInfo;
  }
  
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch pair info: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // The API returns data in a nested structure
    // Check if data has a pairInfos property or if it's the direct response
    let pairInfos: PairInfoResponse;
    
    if (data.pairInfos) {
      // If data has pairInfos property, use that
      pairInfos = data.pairInfos;
    } else if (data.success && typeof data === 'object') {
      // If it's the full response object, extract pairInfos
      // The API returns pairs as string keys, convert to number keys
      pairInfos = {};
      for (const key in data) {
        if (key !== 'success' && key !== 'pairCount' && key !== 'maxTradesPerPair' && 
            key !== 'totalOi' && key !== 'maxOpenInterest' && key !== 'overrides') {
          const numKey = parseInt(key, 10);
          if (!isNaN(numKey)) {
            pairInfos[numKey] = data[key];
          }
        }
      }
    } else {
      // Assume it's already in the correct format
      pairInfos = data;
    }
    
    cachedPairInfo = pairInfos;
    lastFetchTime = now;
    return pairInfos;
  } catch (error) {
    console.error('Error fetching pair info:', error);
    // Return cached data if available, even if stale
    if (cachedPairInfo) {
      return cachedPairInfo;
    }
    throw error;
  }
}

/**
 * Get pair index from market name
 * This is a mapping - you may need to adjust based on your actual market indices
 */
export function getPairIndexFromMarket(market: string): number {
  const marketMap: Record<string, number> = {
    'BTC/USD': 0,
    'ETH/USD': 1,
    'SOL/USD': 2,
    'AVAX/USD': 3,
    'MATIC/USD': 4,
    'ARB/USD': 5,
    'OP/USD': 6,
  };
  
  return marketMap[market] ?? 0;
}

