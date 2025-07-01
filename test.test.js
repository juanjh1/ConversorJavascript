import { describe, it, expect, vi } from "vitest";
import { getDateLikeString, convert } from "./utils.js";

describe('getDateLikeString', () => {
  it('debe devolver la fecha en formato YYYY-MM-DD', () => {
    const date = new Date('2024-01-15T12:00:00Z');
    expect(getDateLikeString(date)).toBe('2024-01-15');
  });
});

describe('convert', () => {
  it('debe convertir correctamente usando la tasa de cambio', async () => {
    const latestExchange = new Map();
    latestExchange.set('USD', { EUR: 0.9, date: '2024-01-15' });
    const exchangeHistory = [];
    const amount = 10;
    const baseCurrency = 'USD';
    const targetCurrency = 'EUR';
    const seed = '';
    const apiKey = '';

    global.validateStatusOfExchange = vi.fn();

    const result = await convert(
      amount,
      baseCurrency,
      targetCurrency,
      latestExchange,
      exchangeHistory,
      seed,
      apiKey
    );
    expect(result).toBe(9);
    expect(exchangeHistory.length).toBe(1);
    expect(exchangeHistory[0].baseCurrency).toBe('USD');
    expect(exchangeHistory[0].targetCurrency).toBe('EUR');
  });
});

it('lanza error si no existe la tasa de cambio', async () => {
  const latestExchange = new Map();
  latestExchange.set('USD', { date: '2024-01-15' }); // No hay EUR
  const exchangeHistory = [];
  const amount = 10;
  const baseCurrency = 'USD';
  const targetCurrency = 'EUR';
  const seed = '';
  const apiKey = '';

  globalThis.validateStatusOfExchange = vi.fn();

  await expect(
    convert(
      amount,
      baseCurrency,
      targetCurrency,
      latestExchange,
      exchangeHistory,
      seed,
      apiKey
    )
  ).rejects.toThrow('No se encontró tasa de cambio de USD a EUR');
});
