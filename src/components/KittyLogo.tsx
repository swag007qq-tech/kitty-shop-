import React from 'react';

interface KittyLogoProps {
  className?: string;
}

export const KITTY_LOGO_SRC = '/assets/kitty-logo.png';

export const KittyMark: React.FC<KittyLogoProps> = ({className = 'w-10 h-10'}) => (
  <img
    src={KITTY_LOGO_SRC}
    alt="KITTY SHOP"
    referrerPolicy="no-referrer"
    className={`object-contain select-none ${className}`}
  />
);
