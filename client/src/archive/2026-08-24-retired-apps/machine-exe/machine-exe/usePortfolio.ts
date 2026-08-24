// MARKET.EXE — Portfolio Store (localStorage-backed)
import { useState, useCallback } from 'react';
import {
  Portfolio,
  Holding,
  Transaction,
  INITIAL_PORTFOLIO,
  STORAGE_KEY,
} from './types';

function loadPortfolio(): Portfolio {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...INITIAL_PORTFOLIO, holdings: {}, transactions: [] };
    const parsed = JSON.parse(raw) as Portfolio;
    return {
      cash: parsed.cash ?? INITIAL_PORTFOLIO.cash,
      holdings: parsed.holdings ?? {},
      transactions: parsed.transactions ?? [],
    };
  } catch {
    return { ...INITIAL_PORTFOLIO, holdings: {}, transactions: [] };
  }
}

function savePortfolio(p: Portfolio) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // ignore quota errors
  }
}

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState<Portfolio>(loadPortfolio);

  const update = useCallback((next: Portfolio) => {
    setPortfolio(next);
    savePortfolio(next);
  }, []);

  const buy = useCallback(
    (symbol: string, name: string, price: number, shares: number): string | null => {
      const cost = price * shares;
      setPortfolio(prev => {
        if (prev.cash < cost) return prev; // insufficient funds
        const existing = prev.holdings[symbol];
        const newShares = (existing?.shares ?? 0) + shares;
        const newAvgCost = existing
          ? (existing.avgCost * existing.shares + price * shares) / newShares
          : price;

        const holding: Holding = {
          symbol,
          name,
          shares: newShares,
          avgCost: newAvgCost,
          purchasedAt: existing?.purchasedAt ?? Date.now(),
        };

        const tx: Transaction = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          symbol,
          type: 'buy',
          shares,
          price,
          timestamp: Date.now(),
        };

        const next: Portfolio = {
          cash: prev.cash - cost,
          holdings: { ...prev.holdings, [symbol]: holding },
          transactions: [tx, ...prev.transactions].slice(0, 500),
        };
        savePortfolio(next);
        return next;
      });
      return null;
    },
    []
  );

  const sell = useCallback(
    (symbol: string, price: number, shares: number): string | null => {
      setPortfolio(prev => {
        const existing = prev.holdings[symbol];
        if (!existing || existing.shares < shares) return prev;

        const proceeds = price * shares;
        const newShares = existing.shares - shares;

        const tx: Transaction = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          symbol,
          type: 'sell',
          shares,
          price,
          timestamp: Date.now(),
        };

        const newHoldings = { ...prev.holdings };
        if (newShares <= 0) {
          delete newHoldings[symbol];
        } else {
          newHoldings[symbol] = { ...existing, shares: newShares };
        }

        const next: Portfolio = {
          cash: prev.cash + proceeds,
          holdings: newHoldings,
          transactions: [tx, ...prev.transactions].slice(0, 500),
        };
        savePortfolio(next);
        return next;
      });
      return null;
    },
    []
  );

  const reset = useCallback(() => {
    const fresh: Portfolio = { ...INITIAL_PORTFOLIO, holdings: {}, transactions: [] };
    update(fresh);
  }, [update]);

  // Derived totals
  const totalHoldingsValue = (quotes: Record<string, number>) =>
    Object.values(portfolio.holdings).reduce((sum, h) => {
      const price = quotes[h.symbol] ?? h.avgCost;
      return sum + h.shares * price;
    }, 0);

  const totalValue = (quotes: Record<string, number>) =>
    portfolio.cash + totalHoldingsValue(quotes);

  const isBankrupt = (quotes: Record<string, number>) =>
    portfolio.cash < 0.01 && Object.keys(portfolio.holdings).length === 0;

  const isMillionaire = (quotes: Record<string, number>) =>
    totalValue(quotes) >= 1_000_000;

  return {
    portfolio,
    buy,
    sell,
    reset,
    totalHoldingsValue,
    totalValue,
    isBankrupt,
    isMillionaire,
  };
}
