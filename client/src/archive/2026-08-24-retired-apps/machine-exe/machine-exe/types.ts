// MARKET.EXE — Core Types

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;       // absolute change
  changePercent: number; // percent change
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  previousClose?: number;
  lastUpdated?: number;  // ms timestamp of last successful fetch
}

export interface SparklinePoint {
  t: number; // timestamp ms
  v: number; // value
}

export interface Holding {
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;      // average cost basis per share
  purchasedAt: number;  // timestamp of first purchase
}

export interface Transaction {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  shares: number;
  price: number;
  timestamp: number;
}

export interface Portfolio {
  cash: number;
  holdings: Record<string, Holding>;
  transactions: Transaction[];
}

export const INITIAL_PORTFOLIO: Portfolio = {
  cash: 100_000,
  holdings: {},
  transactions: [],
};

export const POPULAR_TICKERS = ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'AMZN', 'META', 'SPY'];

export const STORAGE_KEY = 'market_exe_portfolio_v1';
