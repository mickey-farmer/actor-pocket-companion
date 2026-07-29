'use client';

import { usePathname } from 'next/navigation';
import { NavProvider } from './NavContext';
import DesktopSidebar from './DesktopSidebar';
import MobileDrawer from './MobileDrawer';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The login screen has nothing to navigate to yet — keep it chrome-free.
  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <NavProvider>
      <DesktopSidebar />
      <MobileDrawer />
      <div className="md:pl-64">{children}</div>
    </NavProvider>
  );
}
