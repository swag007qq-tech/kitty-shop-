import React, {useEffect, useState} from 'react';
import {KittyMark} from './KittyLogo';
import {resolveCloudImageSrc} from '../utils/catalogCloud';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({src, alt, className = ''}) => {
  const [resolvedSrc, setResolvedSrc] = useState<string>(() =>
    src.startsWith('firestore-img://') ? '' : src,
  );
  const [isLoading, setIsLoading] = useState<boolean>(() =>
    src.startsWith('firestore-img://'),
  );
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    setHasError(false);

    if (!src) {
      setResolvedSrc('');
      setIsLoading(false);
      return;
    }

    if (!src.startsWith('firestore-img://')) {
      setResolvedSrc(src);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    resolveCloudImageSrc(src)
      .then((url) => {
        if (!active) return;
        setResolvedSrc(url);
        if (!url) setHasError(true);
      })
      .catch(() => {
        if (active) setHasError(true);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [src]);

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center bg-[#FAF7F8] animate-pulse ${className}`}
        aria-label={alt}
      />
    );
  }

  if (!resolvedSrc || hasError) {
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
      src={resolvedSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
