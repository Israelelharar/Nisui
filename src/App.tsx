import { useEffect, useState } from 'react';
import { has } from './client';
import { createBrowserRouter, createHashRouter, Navigate, RouterProvider, useLocation } from 'react-router';
import { AppProvider } from './hooks/useApp';
import { Layout } from './components/Layout';
import { Welcome } from './components/Welcome';
import { Dedications } from './components/Dedications';
import { Toast } from './components/Toast';
import { HeartBurst, burstHeart } from './components/HeartBurst';
import { HomePage } from './pages/HomePage';
import { track } from './lib/events';
import { reloadForNewBuild } from './lib/staleBuild';
import type { ComponentType } from 'react';

/** Lazy page that reloads once onto the new build if its file is gone (see lib/staleBuild). */
const page =
  <M,>(load: () => Promise<M>, pick: (m: M) => ComponentType) =>
  async () => {
    try {
      return { Component: pick(await load()) };
    } catch (e) {
      if (reloadForNewBuild()) await new Promise(() => {});
      throw e;
    }
  };

function ToLettersTab() {
  const { hash } = useLocation();
  return <Navigate to={`/us?tab=letters${hash}`} replace />;
}

/** "אנחנו" is in the menu when it has at least one tab (pages/UsPage.tsx). */
const usOn = ['story', 'letters', 'surprises', 'openWhen', 'vouchers', 'gallery', 'places', 'music', 'future', 'words'].some((f) => has(f as Parameters<typeof has>[0]));

/** Instead of a blank error page: a kind note and a way out. */
function Stuck() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-8 text-center">
      <div aria-hidden className="text-[56px]">💌</div>
      <h1 className="font-serif text-[26px]">משהו קטן נתקע</h1>
      <p className="text-muted">כנראה יצאה גרסה חדשה של האתר בדיוק עכשיו.</p>
      <button type="button" onClick={() => window.location.assign('/')} className="h-12 rounded-full bg-accent px-7 font-bold text-white">
        לרענן ❤️
      </button>
    </div>
  );
}

const createRouter = import.meta.env.VITE_PREVIEW ? createHashRouter : createBrowserRouter;

/** Pages of modules this client doesn't have simply don't exist (and fall through to home). */
const ROUTE_ON: Record<string, boolean> = {
  '/us': usOn,
  '/letters': usOn,
  '/book': has('book'),
  '/book/print': has('book'),
  '/dates': has('dates'),
  '/surprise': has('surprises'),
  '/pet': has('pet'),
  '/night': has('night'),
};
const on = <R extends { path?: string }>(r: R) => ROUTE_ON[r.path ?? ''] ?? true;

const router = createRouter([
  {
    element: <Layout />,
    errorElement: <Stuck />,
    children: [
      { path: '/', element: <HomePage /> },
      {
        path: '/us',
        lazy: page(
          () => import('./pages/UsPage'),
          (m) => m.UsPage,
        ),
      },
      // The letters live inside "אנחנו"; short links still land there.
      { path: '/letters', element: <ToLettersTab /> },
      {
        path: '/book',
        lazy: page(
          () => import('./pages/BookPage'),
          (m) => m.BookPage,
        ),
      },
      {
        path: '/dates',
        lazy: page(
          () => import('./pages/DatesPage'),
          (m) => m.DatesPage,
        ),
      },
      { path: '/surprise', element: <Navigate to="/us?tab=letters#surprise" replace /> },
      {
        path: '/pet',
        lazy: page(
          () => import('./pages/PetPage'),
          (m) => m.PetPage,
        ),
      },
      {
        path: '/night',
        lazy: page(
          () => import('./pages/NightPage'),
          (m) => m.NightPage,
        ),
      },
      {
        path: '/admin',
        lazy: page(
          () => import('./pages/AdminPage'),
          (m) => m.AdminPage,
        ),
      },
      { path: '*', element: <HomePage /> },
    ].filter(on),
  },
  {
    // The printable book stands alone: no nav, no skin, just pages.
    path: '/book/print',
    errorElement: <Stuck />,
    lazy: page(
      () => import('./pages/BookPrintPage'),
      (m) => m.BookPrintPage,
    ),
  },
].filter(on));

const ENTERED = 'idw:entered';

const seenThisVisit = () => {
  try {
    return sessionStorage.getItem(ENTERED) === '1';
  } catch {
    return false;
  }
};

export function App() {
  // The envelope greets the partner once per visit (per browser session).
  // The admin page skips it: the envelope is addressed to the partner.
  const [entered, setEntered] = useState(() => !has('welcome') || seenThisVisit() || window.location.pathname.startsWith('/admin'));
  // Without the envelope, the visit still counts once per session.
  useEffect(() => {
    if (has('welcome') || seenThisVisit()) return;
    try {
      sessionStorage.setItem(ENTERED, '1');
    } catch {
      /* fine */
    }
    track('visit');
  }, []);

  const enter = () => {
    try {
      sessionStorage.setItem(ENTERED, '1');
    } catch {
      /* fine */
    }
    track('visit');
    setEntered(true);
    burstHeart();
  };

  return (
    <AppProvider>
      {entered ? <RouterProvider router={router} /> : <Welcome onEnter={enter} />}
      {entered && has('pet') && <Dedications />}
      <Toast />
      <HeartBurst />
    </AppProvider>
  );
}
