import { easterEggs } from '../content/story';
import { useEgg } from '../hooks/useApp';
import { PigSvg } from '../pet/PigSvg';
import { species } from '../pet/species';

/** The pet, peeking from the bottom of the envelope. Tap for a line. */
export function GuineaPig({ className = 'absolute bottom-0 left-5' }: { className?: string }) {
  const say = useEgg(easterEggs.pet?.lines ?? [species.sound]);
  return (
    <button type="button" onClick={say} aria-label={`${species.small} מציץ`} className={`${className} translate-y-[42%] transition-transform hover:translate-y-[30%] active:translate-y-[20%]`}>
      <PigSvg skin="classic" mood="smile" className="h-[104px] w-[92px] rotate-[6deg]" />
    </button>
  );
}
