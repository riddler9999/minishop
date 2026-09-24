import {createContext, useContext, type ReactNode} from 'react';
import {useLocation} from 'react-router-dom';

export const DEMO_STORE = {
  bg: '#eee6ff',
  surface: '#fbf8ff',
  surfaceSoft: '#f6f0ff',
  product: '#dac6ff',
  productStage: '#cdb7f7',
  primary: '#6d28d9',
  primaryDark: '#3a1268',
  text: '#21133f',
  muted: '#76698a',
  border: '#d9c8f2',
  shadow: '0 18px 48px rgba(76,29,149,0.14)',
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
