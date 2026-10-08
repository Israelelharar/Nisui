import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { useApp } from '../hooks/useApp';
import { motion, useReducedMotion } from 'motion/react';
import { BottomNav } from './BottomNav';
import { StrengthSheet } from './StrengthSheet';
import { ContactSheet } from './ContactSheet';
import { Sock } from './Sock';
import { HidingPig } from './HidingPig';
import { skinFor } from '../lib/skins';
import { NightSky } from './NightSky';
import { has } from '../client';

export function Layout() {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const night = pathname === '/night';
  // The pet lives in a warm, dark cocoa room of its own.
  const cocoa = pathname === '/pet';
  const { viewer, settings, clock, showToast } = useApp();

  // Quest news from anywhere (a hidden friend found, a step of the adventure done).
  useEffect(() => {
    const on = (e: Event) => showToast((e as CustomEvent<string>).detail);
    window.addEventListener('pet:notice', on);
    return () => window.removeEventListener('pet:notice', on);
  }, [showToast]);
  // Today's look (the admin can pin one). The pet room and the night page keep their own.
  const skin = skinFor(settings.skin, clock.dayIndex);
  const skinned = !night && !cocoa;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const html = document.documentElement;
    const on = skinned && skin.id !== 'rose';
    if (on) html.dataset.skin = skin.id;
    else delete html.dataset.skin;
    html.toggleAttribute('data-dark', on && skin.dark);
    html.toggleAttribute('data-glass', on);
    html.style.background = night ? 'var(--color-night)' : cocoa ? '#2B1D17' : skin.dark && skinned ? skin.theme : '';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', night ? '#1C1013' : cocoa ? '#3A2820' : skin.theme);
  }, [skinned, skin, night, cocoa]);

  return (
    <div
      className={`min-h-dvh ${night ? 'bg-night' : ''}`}
      style={cocoa ? { background: 'radial-gradient(120% 60% at 70% 0%, #5A3E30 0%, #3A2820 45%, #2B1D17 100%)' } : undefined}
    >
      {skinned && <div aria-hidden className="skin-ground pointer-events-none fixed inset-0" />}
      {night && <NightSky />}
      <motion.main
        key={pathname}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        className={`relative mx-auto max-w-[480px] ${cocoa ? '' : 'px-5 pt-7 pb-[120px]'}`}
      >
        <Outlet />
        {!night && !cocoa && has('sock') && <Sock />}
      </motion.main>
      {viewer.role === 'admin' && pathname !== '/admin' && (
        <Link to="/admin" className="fixed top-3 left-3 z-30 rounded-full bg-ink/85 px-3 py-1.5 text-xs font-bold text-white no-underline backdrop-blur">
          👀 מצב צפייה · ניהול
        </Link>
      )}
      {has('friends') && !night && pathname !== '/admin' && pathname !== '/pet' && <HidingPig />}
      {/* a whisper of film grain and a warm lamp glow: the room reads as a material, not a flat color */}
      {cocoa && <div aria-hidden className="cocoa-grain pointer-events-none fixed inset-0 z-[1]" />}
      <BottomNav dark={night} glass={cocoa} />
      {has('strength') && <StrengthSheet />}
      {has('contact') && <ContactSheet />}
    </div>
  );
}
