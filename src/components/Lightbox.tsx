import { Sheet } from './Sheet';
import { PhotoImg } from './PhotoImg';
import type { Photo } from '../content/types';

export function Lightbox({ photo, onClose }: { photo: Photo | null; onClose: () => void }) {
  return (
    <Sheet open={!!photo} onClose={onClose} title="מהאלבום שלנו">
      {photo && (
        <figure className="m-0 pb-3">
          <PhotoImg photo={photo} eager className="max-h-[62dvh] w-full rounded-2xl object-contain" />
          <figcaption className="mt-3 font-serif text-[17px] leading-relaxed">{photo.caption}</figcaption>
        </figure>
      )}
    </Sheet>
  );
}
