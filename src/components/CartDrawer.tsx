import React, {useEffect, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {X, Minus, Plus, Trash2, ShoppingBag} from 'lucide-react';
import {CartItem, CurrencyCode, Product} from '../types';
import {ProductImage} from './ProductImage';
import {
  CURRENCY_LIST,
  CURRENCIES,
  formatAmount,
  getAvailablePriceEntries,
  getProductPrice,
} from '../utils/currency';
import {getRarityMeta, sortRarities} from '../utils/rarities';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  products: Product[];
  currency: CurrencyCode;
  onChangeCurrency: (currency: CurrencyCode) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  products,
  currency,
  onChangeCurrency,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  const [buyNotice, setBuyNotice] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setBuyNotice(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const resolvedItems = cart
    .map((entry) => {
      const product = products.find((p) => p.id === entry.productId);
      if (!product) return null;
      return {product, quantity: entry.quantity};
    })
    .filter((x): x is {product: Product; quantity: number} => x !== null);

  const symbol = CURRENCIES[currency].symbol;

  let totalCost = 0;
  let hasUnpricedItems = false;

  for (const item of resolvedItems) {
    const unitPrice = getProductPrice(item.product, currency);
    if (unitPrice === undefined) {
      hasUnpricedItems = true;
    } else {
      totalCost += unitPrice * item.quantity;
    }
  }

  const totalUnits = resolvedItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Корзина"
        >
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.2}}
            onClick={onClose}
            className="fixed inset-0 bg-black/25 backdrop-blur-[1px]"
          />

          <motion.aside
            initial={{x: '100%'}}
            animate={{x: 0}}
            exit={{x: '100%'}}
            transition={{duration: 0.3, ease: [0.16, 1, 0.3, 1]}}
            className="relative z-10 w-full max-w-md bg-white h-full flex flex-col border-l border-black/[0.08] shadow-2xl"
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-black/[0.06] flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-[#181617]">
                  Корзина
                </h2>
                <p className="text-xs text-[#7D7478] tabular-nums mt-0.5">
                  Выбрано позиций: {totalUnits}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть корзину"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-[#6E676B] hover:text-[#181617] hover:bg-[#FAF8F9] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Currency Switcher inside Cart */}
            <div className="px-4 sm:px-6 py-3 bg-[#FAF8F9] border-b border-black/[0.06] flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-[#6E676B]">Валюта:</span>
              <div className="inline-flex items-center gap-1 p-0.5 bg-white border border-black/[0.07] rounded-lg">
                {CURRENCY_LIST.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => onChangeCurrency(item.code)}
                    className={`px-2 sm:px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap ${
                      currency === item.code
                        ? 'bg-[#181617] text-white'
                        : 'text-[#6E676B] hover:text-[#181617]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {resolvedItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-12 h-12 rounded-2xl bg-[#FAF8F9] border border-black/[0.06] flex items-center justify-center text-[#9B8D93] mb-4">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <p className="font-serif text-xl font-semibold text-[#181617]">
                    Корзина пока пуста
                  </p>
                  <p className="mt-1.5 text-sm text-[#6E676B] max-w-xs">
                    Добавьте понравившиеся предметы из каталога Adopt Me или MM2.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-black/[0.06]">
                  {resolvedItems.map(({product, quantity}) => {
                    const gameLabel = product.game === 'adopt-me' ? 'Adopt Me' : 'MM2';
                    const atStockMax = quantity >= product.stock;
                    const hasImage = Boolean(product.imageUrl && product.imageUrl.trim().length > 0);
                    const unitPrice = getProductPrice(product, currency);
                    const availableEntries = getAvailablePriceEntries(product);

                    return (
                      <li key={product.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex gap-4">
                          {hasImage && (
                            <div className="w-20 h-16 rounded-lg overflow-hidden bg-[#FAF8F9] border border-black/[0.05] shrink-0">
                              <ProductImage
                                src={product.imageUrl}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[11px] text-[#7D7478] mb-0.5">
                                  {gameLabel} · В наличии: {product.stock}
                                </p>
                                <div className="flex items-center gap-1.5">
                                  <h3 className="text-sm font-semibold text-[#181617] truncate">
                                    {product.title}
                                  </h3>
                                  {product.game === 'adopt-me' &&
                                    product.rarities &&
                                    product.rarities.length > 0 && (
                                      <div className="flex items-center gap-1 shrink-0">
                                        {sortRarities(product.rarities).map((code) => {
                                          const meta = getRarityMeta(code);
                                          return (
                                            <img
                                              key={code}
                                              src={meta.iconSrc}
                                              alt={meta.label}
                                              className="w-4 h-4 object-contain"
                                            />
                                          );
                                        })}
                                      </div>
                                    )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => onRemoveItem(product.id)}
                                aria-label={`Удалить ${product.title}`}
                                className="p-1.5 text-[#8C8387] hover:text-[#9E3557] rounded-md transition-colors shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="mt-3 flex items-center justify-between gap-3">
                              <div className="inline-flex items-center border border-black/[0.09] rounded-lg bg-white">
                                <button
                                  type="button"
                                  onClick={() => onUpdateQuantity(product.id, -1)}
                                  aria-label="Уменьшить количество"
                                  className="w-8 h-8 flex items-center justify-center text-[#4B4448] hover:text-[#181617] hover:bg-[#FAF8F9] rounded-l-lg transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-8 text-center text-xs font-medium tabular-nums text-[#181617]">
                                  {quantity}
                                </span>
                                <button
                                  type="button"
                                  disabled={atStockMax}
                                  onClick={() => onUpdateQuantity(product.id, 1)}
                                  aria-label="Увеличить количество"
                                  className={`w-8 h-8 flex items-center justify-center rounded-r-lg transition-colors ${
                                    atStockMax
                                      ? 'text-[#C4BDC0] cursor-not-allowed'
                                      : 'text-[#4B4448] hover:text-[#181617] hover:bg-[#FAF8F9]'
                                  }`}
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              {unitPrice !== undefined ? (
                                <span className="text-sm font-semibold text-[#181617] tabular-nums">
                                  {formatAmount(unitPrice * quantity, currency)}
                                </span>
                              ) : (
                                <div className="text-right">
                                  <p className="text-[11px] font-medium text-[#9E3557]">
                                    Нет цены в {symbol}
                                  </p>
                                  {availableEntries.length > 0 && (
                                    <p className="text-[11px] text-[#7D7478] tabular-nums">
                                      {availableEntries
                                        .map((e) => formatAmount(e.amount * quantity, e.code))
                                        .join(' · ')}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-5 border-t border-black/[0.06] bg-[#FAF8F9]">
              {hasUnpricedItems && resolvedItems.length > 0 && (
                <p className="mb-3 text-[11px] text-[#9E3557]">
                  Часть товаров в корзине не продаётся в {symbol} — переключите валюту для их учёта.
                </p>
              )}

              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-[#6E676B]">Общая стоимость</span>
                <span className="text-xl font-semibold text-[#181617] tabular-nums">
                  {formatAmount(totalCost, currency)}
                </span>
              </div>

              <button
                type="button"
                disabled={resolvedItems.length === 0}
                onClick={() => setBuyNotice(true)}
                className={`w-full py-3.5 px-5 text-sm font-medium rounded-xl transition-colors duration-150 ${
                  resolvedItems.length === 0
                    ? 'bg-[#E8E4E6] text-[#9A9195] cursor-not-allowed'
                    : 'bg-[#181617] text-white hover:bg-[#2E2A2C]'
                }`}
              >
                Купить
              </button>

              {buyNotice && resolvedItems.length > 0 && (
                <p className="mt-3 text-xs text-center text-[#7D7478]">
                  Оформление заказа пока недоступно — переход отключён.
                </p>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
