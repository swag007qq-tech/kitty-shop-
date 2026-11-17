import React from 'react';
import {Plus, Check} from 'lucide-react';
import {CurrencyCode, Product} from '../types';
import {ProductImage} from './ProductImage';
import {
  CURRENCIES,
  formatAmount,
  getAvailablePriceEntries,
  getProductPrice,
} from '../utils/currency';
import {getRarityMeta, sortRarities} from '../utils/rarities';

interface ProductCardProps {
  product: Product;
  currency: CurrencyCode;
  cartQuantity: number;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  cartQuantity,
  onAddToCart,
}) => {
  const isOutOfStock = product.stock <= 0;
  const reachedStockLimit = !isOutOfStock && cartQuantity >= product.stock;
  const hasImage = Boolean(product.imageUrl && product.imageUrl.trim().length > 0);
  const rarities =
    product.game === 'adopt-me' && product.rarities?.length
      ? sortRarities(product.rarities)
      : [];

  const priceInCurrency = getProductPrice(product, currency);
  const isSoldInCurrency = priceInCurrency !== undefined;
  const availableEntries = getAvailablePriceEntries(product);

  return (
    <article className="group flex flex-col bg-[#FFFDFB] border-2 border-white rounded-2xl p-5 shadow-[-8px_0_24px_rgba(255,255,255,0.28),8px_0_24px_rgba(255,255,255,0.28),0_0_20px_rgba(255,255,255,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[-12px_0_34px_rgba(255,255,255,0.45),12px_0_34px_rgba(255,255,255,0.45),0_0_28px_rgba(255,255,255,0.38)]">
      {hasImage && (
        <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#FAF8F9] border border-black/[0.04] mb-4">
          <ProductImage
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      )}

      <div className="flex flex-col flex-1">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={`text-xs tabular-nums ${
              isOutOfStock ? 'text-[#9E3557] font-medium' : 'text-[#7D7478]'
            }`}
          >
            {isOutOfStock ? 'Нет в наличии' : `В наличии: ${product.stock} шт.`}
          </span>

          {rarities.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0" aria-label="Редкость">
              {rarities.map((code) => {
                const meta = getRarityMeta(code);
                return (
                  <img
                    key={code}
                    src={meta.iconSrc}
                    alt={meta.label}
                    title={meta.label}
                    className="w-6 h-6 object-contain select-none"
                  />
                );
              })}
            </div>
          )}
        </div>

        <h3 className="text-base font-semibold text-[#181617] leading-snug line-clamp-2">
          {product.title}
        </h3>

        {product.game === 'mm2' && product.subtitle && (
          <p className="mt-1 text-xs text-[#7D7478] line-clamp-1">{product.subtitle}</p>
        )}

        <div className="mt-auto pt-4 flex flex-wrap items-center justify-between gap-2.5 border-t border-black/[0.06]">
          {isSoldInCurrency ? (
            <span className="text-base font-semibold text-[#181617] tabular-nums whitespace-nowrap">
              {formatAmount(priceInCurrency, currency)}
            </span>
          ) : (
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-[#9E3557]">
                Не продаётся в {CURRENCIES[currency].shortLabel}
              </p>
              {availableEntries.length > 0 && (
                <p className="text-xs text-[#6E676B] tabular-nums truncate">
                  {availableEntries.map((e) => formatAmount(e.amount, e.code)).join(' · ')}
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            disabled={isOutOfStock || reachedStockLimit || !isSoldInCurrency}
            onClick={() => onAddToCart(product)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C85A7C] ${
              isOutOfStock || !isSoldInCurrency
                ? 'bg-[#F5F3F4] text-[#9B9196] cursor-not-allowed'
                : reachedStockLimit
                  ? 'bg-[#FAF0F4] text-[#9E3557] cursor-not-allowed'
                  : cartQuantity > 0
                    ? 'bg-[#FAF0F4] text-[#9E3557] border border-[#EBC7D4] hover:bg-[#F5E3EA]'
                    : 'bg-[#181617] text-white hover:bg-[#2E2A2C]'
            }`}
          >
            {isOutOfStock ? (
              <span>Распродано</span>
            ) : !isSoldInCurrency ? (
              <span>Нет в {CURRENCIES[currency].shortLabel}</span>
            ) : reachedStockLimit ? (
              <>
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>Максимум ({cartQuantity})</span>
              </>
            ) : cartQuantity > 0 ? (
              <>
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>В корзине: {cartQuantity}</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>В корзину</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
