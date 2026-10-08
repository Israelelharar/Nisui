import type { Photo } from '../content/types';

/** Responsive, lazy, layout-stable photo. */
export function PhotoImg({ photo, className = '', sizes = '(max-width: 480px) 100vw, 480px', eager }: { photo: Photo; className?: string; sizes?: string; eager?: boolean }) {
  return (
    <img
      src={photo.srcSmall}
      srcSet={`${photo.srcSmall} 560w, ${photo.src} ${photo.width}w`}
      sizes={sizes}
      width={photo.width}
      height={photo.height}
      alt={photo.alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={`h-auto bg-env object-cover ${className}`}
    />
  );
}
