import React from 'react';
import {ShoppingBag, ShieldCheck} from 'lucide-react';
import {GameCategory} from '../types';
import {KittyMark} from './KittyLogo';

interface NavbarProps {
  activeGame: GameCategory | null;
  onSelectGame: (game: GameCategory | null) => void;
  cartCount: number;
  onOpenCart: () => void;
  isAdmin: boolean;
  onOpenAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeGame,
  onSelectGame,
  cartCount,
  onOpenCart,
  isAdmin,
  onOpenAdmin,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#261710]/88 backdrop-blur-md border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectGame(null)}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F3C5D2] rounded-md px-1 py-1"
        >
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#FFF7F0] p-1 shadow-xs transition-transform duration-200 group-hover:scale-105 shrink-0">
            <KittyMark className="w-full h-full" />
          </span>
          <span className="font-serif text-xl sm:text-2xl font-semibold tracking-[0.08em] text-[#FFF8F3]">
            KITTY SHOP
          </span>
        </button>

        {/* Zone 2: Clean Single-Line Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#D8C2B4]">
          <button
            type="button"
            onClick={() => onSelectGame('adopt-me')}
            className={`relative py-1 whitespace-nowrap shrink-0 transition-colors duration-150 ${
              activeGame === 'adopt-me' ? 'text-[#FFF8F3]' : 'hover:text-[#FFF8F3]'
            }`}
          >
            Adopt Me
            {activeGame === 'adopt-me' && (
              <span className="absolute left-0 right-0 -bottom-0.5 h-[1.5px] bg-[#F3C5D2]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onSelectGame('mm2')}
            className={`relative py-1 whitespace-nowrap shrink-0 transition-colors duration-150 ${
              activeGame === 'mm2' ? 'text-[#FFF8F3]' : 'hover:text-[#FFF8F3]'
            }`}
          >
            MM2
            {activeGame === 'mm2' && (
              <span className="absolute left-0 right-0 -bottom-0.5 h-[1.5px] bg-[#F3C5D2]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onSelectGame(null)}
            className={`relative py-1 whitespace-nowrap shrink-0 transition-colors duration-150 ${
              activeGame === null ? 'text-[#FFF8F3]' : 'hover:text-[#FFF8F3]'
            }`}
          >
            Выбор игры
            {activeGame === null && (
              <span className="absolute left-0 right-0 -bottom-0.5 h-[1.5px] bg-[#F3C5D2]" />
            )}
          </button>
        </nav>

        {/* Zone 3: Admin Action + Cart */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenAdmin}
            className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-medium rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F3C5D2] ${
              isAdmin
                ? 'bg-[#F9E4EC] text-[#7D2443] border border-[#F3C5D2] hover:bg-[#F4D5E1]'
                : 'text-[#F5E8DF] border border-white/15 bg-white/[0.06] hover:bg-white/[0.14] hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>{isAdmin ? 'Админ-панель' : 'Войти как администратор'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            aria-label="Открыть корзину"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#261710] bg-[#FFF8F3] rounded-lg hover:bg-[#F5E6DC] transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F3C5D2]"
          >
            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Корзина</span>
            <span className="tabular-nums font-mono text-[11px] bg-[#261710]/10 px-1.5 py-0.5 rounded">
              {cartCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
