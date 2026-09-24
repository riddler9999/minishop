import {createContext, useContext, type ReactNode} from 'react';
import {useLocation} from 'react-router-dom';

/** Isolated orange/amber visual language for the public /demo perfume template. */
export const DEMO_STORE = {
  bg: '#fff1e6',
  surface: '#fffaf5',
  surfaceSoft: '#fff4e8',
  product: '#ffd9b8',
  productStage: '#ffc789',
  primary: '#f05a00',
  primaryDark: '#8f2d00',
  text: '#25140b',
  muted: '#80695b',
  border: '#f3d5bd',
  shadow: '0 18px 48px rgba(151,63,10,0.14)',
  radius: '28px',
} as const;

const DemoStoreContext = createContext(false);

export function DemoStoreProvider({children}: {children: ReactNode}) {
  const {pathname} = useLocation();
  return <DemoStoreContext.Provider value={pathname === '/demo' || pathname.startsWith('/demo/')}>{children}</DemoStoreContext.Provider>;
}

export function useDemoStore(): boolean {
  return useContext(DemoStoreContext);
}
