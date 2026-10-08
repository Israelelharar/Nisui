import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Sheet } from '../components/Sheet';
import { deletePhoto, listPhotos, photoSrc, type PhotoMeta } from './album';

/** The pig's photo album: polaroids pinned in a grid; tap to open, share, save or remove. */
export function AlbumSheet({ open, onClose, name, canDelete }: { open: boolean; onClose: () => void; name: string; canDelete: boolean }) {
  const [photos, setPhotos] = useState<PhotoMeta[] | null>(null);
  const [big, setBig] = useState<PhotoMeta | null>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    listPhotos().then((p) => alive && setPhotos(p));
    return () => {
      alive = false;
    };
  }, [open]);

  const share = async (p: PhotoMeta) => {
    try {
      const blob = await (await fetch(photoSrc(p))).blob();
      const file = new File([blob], `${name}-${p.id}.jpg`, { type: 'image/jpeg' });
      if (navigator.canShare?.({ files: [file] })) return await navigator.share({ files: [file], title: name });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = file.name;
      a.click();
    } catch {
      /* cancelled */
    }
  };
  const remove = async (p: PhotoMeta) => {
    if (!window.confirm('למחוק את התמונה מהאלבום?')) return;
    await deletePhoto(p);
    setPhotos((cur) => cur?.filter((x) => x.id !== p.id) ?? null);
    setBig(null);
  };

  return (
    <>
      <Sheet open={open} onClose={onClose} title={`האלבום של ${name} 📸`}>
        {!photos && <p className="py-10 text-center text-muted">פותח את האלבום…</p>}
        {photos?.length === 0 && (
          <p className="py-10 text-center leading-relaxed text-muted">
            עוד אין תמונות.
            <br />
            לוחצים על 📸 בחדר, והוא מצטלם בבגדים של עכשיו.
          </p>
        )}
        <ul className="grid grid-cols-2 gap-4 px-1 pb-8">
          {photos?.map((p, i) => (
            <li key={p.id} style={{ rotate: `${i % 2 ? 2.5 : -2}deg` }}>
              <button type="button" onClick={() => setBig(p)} className="block w-full bg-[#FFFBF3] p-1.5 shadow-paper">
                <img src={photoSrc(p)} alt={p.caption} loading="lazy" className="w-full" />
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
      {big &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-4 bg-[#1a0f0b]/90 px-6 backdrop-blur" onClick={() => setBig(null)}>
            <motion.img
              initial={{ scale: 0.85, opacity: 0, rotate: -3 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              src={photoSrc(big)}
              alt={big.caption}
              className="max-h-[72dvh] max-w-full shadow-[0_20px_50px_rgb(0_0_0/0.5)]"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => share(big)} className="rounded-full bg-white px-5 py-2.5 font-bold text-ink">
                לשתף / לשמור
              </button>
              {canDelete && (
                <button type="button" onClick={() => remove(big)} className="rounded-full bg-white/15 px-5 py-2.5 font-bold text-white">
                  למחוק
                </button>
              )}
              <button type="button" onClick={() => setBig(null)} className="rounded-full bg-white/15 px-5 py-2.5 font-bold text-white">
                סגירה
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
