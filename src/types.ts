export type GameCategory = 'adopt-me' | 'mm2';

export type CurrencyCode = 'UAH' | 'STARS' | 'ROBUX';

export type ProductPrices = Partial<Record<CurrencyCode, number>>;

export type AdoptMeRarity = 'F' | 'R' | 'N' | 'M';

export interface Product {
  id: string;
  game: GameCategory;
  title: string;
  subtitle?: string;
  rarities?: AdoptMeRarity[];
  prices: ProductPrices;
  stock: number;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}
