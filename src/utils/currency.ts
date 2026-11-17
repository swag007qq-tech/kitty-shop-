import {CurrencyCode, Product, ProductPrices} from '../types';

export interface CurrencyConfig {
  code: CurrencyCode;
  label: string;
  shortLabel: string;
  symbol: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  UAH: {
    code: 'UAH',
    label: 'гривны',
    shortLabel: '₴',
    symbol: '₴',
  },
  STARS: {
    code: 'STARS',
    label: 'звёзды',
    shortLabel: '★',
    symbol: '★',
  },
  ROBUX: {
    code: 'ROBUX',
    label: 'робуксы',
    shortLabel: 'R$',
    symbol: 'R$',
  },
};

export const CURRENCY_LIST: CurrencyConfig[] = [
  CURRENCIES.UAH,
  CURRENCIES.STARS,
  CURRENCIES.ROBUX,
];

export function getProductPrice(
  product: Pick<Product, 'prices'>,
  currency: CurrencyCode,
): number | undefined {
  const prices: ProductPrices = product.prices || {};
  const val = prices[currency];
  if (typeof val === 'number' && !Number.isNaN(val) && val >= 0) {
    return val;
  }
  return undefined;
}

export function formatAmount(amount: number, currency: CurrencyCode): string {
  const formatted = new Intl.NumberFormat('ru-RU').format(amount);
  return `${formatted} ${CURRENCIES[currency].symbol}`;
}

export function getAvailablePriceEntries(
  product: Pick<Product, 'prices'>,
): Array<{code: CurrencyCode; amount: number}> {
  return CURRENCY_LIST.map((c) => {
    const amount = getProductPrice(product, c.code);
    return amount !== undefined ? {code: c.code, amount} : null;
  }).filter((x): x is {code: CurrencyCode; amount: number} => x !== null);
}
