import { NavLink } from 'react-router';
import { BookHeart, CalendarHeart, Heart, House, Moon, PawPrint } from 'lucide-react';
import { tap } from '../lib/haptics';
import { has } from '../client';
import { species } from '../pet/species';

const US = ['story', 'letters', 'surprises', 'openWhen', 'vouchers', 'gallery', 'places', 'music', 'future', 'words'] as const;

/** Only the pages this client has. With a single page there's no menu at all. */
const items = [
  { to: '/', label: 'בית', Icon: House, on: true },
  { to: '/us', label: has('gallery') && US.filter((f) => has(f)).length === 1 ? 'גלריה' : 'אנחנו', Icon: Heart, on: US.some((f) => has(f)) },
  { to: '/book', label: 'הספר שלנו', Icon: BookHeart, on: has('book') },
  { to: '/dates', label: 'פגישות', Icon: CalendarHeart, on: has('dates') },
  { to: '/pet', label: species.name, Icon: PawPrint, on: has('pet') },
  { to: '/night', label: 'לילה', Icon: Moon, on: has('night') },
].filter((i) => i.on);

export function BottomNav({ dark, glass }: { dark?: boolean; glass?: boolean }) {
  if (items.length < 2) return null;
  return (
    <nav aria-label="ניווט ראשי" className={`fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] px-3.5 pb-safe ${dark ? '' : ''}`}>
      <ul
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        className={`grid h-[68px] items-center rounded-3xl ${
          glass
            ? 'border border-white/20 bg-[#F3E2CC]/15 text-[#F6E9DA] shadow-[0_10px_30px_rgb(0_0_0/0.35),inset_0_1px_0_rgb(255_255_255/0.2)] backdrop-blur-xl'
            : dark
              ? 'bg-night-paper/95 text-white backdrop-blur'
              : 'skin-nav'
        }`}
      >
        {items.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              onClick={() => tap(6)}
              className={({ isActive }) =>
                `flex min-h-[56px] flex-col items-center justify-center gap-1 text-[11px] transition-colors ${
                  isActive ? 'font-bold skin-nav-on' : dark || glass ? 'text-white/65' : 'skin-nav-off'
                } ${isActive && dark ? '!text-[#F29AB0]' : ''} ${isActive && glass ? '!text-[#FFB765]' : ''}`
              }
            >
              <Icon size={22} strokeWidth={1.7} aria-hidden />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
