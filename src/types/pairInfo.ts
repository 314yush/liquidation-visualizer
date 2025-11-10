/**
 * Type definitions for Avantis pair information
 */

export interface PairParams {
  onePercentDepthAbove: number;
  onePercentDepthBelow: number;
}

export interface StoragePairParams {
  pnlPriceImpactMultiplier: number;
  pnlSkewImpactMultiplier: number;
  pnlPosSpreadCap: number;
  pnlNegSpreadCap: number;
  negSpreadCap: number;
  posSpreadCap: number;
}

export interface OpenInterest {
  long: number;
  short: number;
}

export interface PairInfo {
  priceImpactMultiplier: number;
  skewImpactMultiplier: number;
  spreadP: number;
  pairParams?: PairParams;
  storagePairParams?: StoragePairParams;
  pnlSpreadP?: number;
  openInterest?: OpenInterest;
}

export interface PairInfoResponse {
  [pairIndex: number]: PairInfo;
}


