import React, {useState} from 'react';
import {KittyMark} from './KittyLogo';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({src, alt, className = ''}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#FAF7F8] text-[#9B8D93] select-none ${className}`}
        role="img"
        aria-label={alt}
      >
        <KittyMark className="w-16 h-16 mb-2 opacity-80" />
        <span className="text-xs font-medium tracking-wide text-[#8C7D83] px-4 text-center line-clamp-1">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
