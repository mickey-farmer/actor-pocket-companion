'use client';

import { usePathname } from 'next/navigation';
import DesktopSidebar from './DesktopSidebar';
import MobileTabBar from './MobileTabBar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The login screen has nothing to navigate to yet — keep it chrome-free.
  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <DesktopSidebar />
      <MobileTabBar />
      {/*
        pl-64 clears the fixed desktop sidebar; pb-20 clears the fixed mobile
        tab bar (plus the iPhone home indicator, via the safe-area padding on
        the bar itself). Page content centres inside THIS column rather than
        inside the viewport — previously `mx-auto max-w-3xl` centred against
        the full window while the sidebar pushed everything right, which is
        what left the content stranded off-centre on wide screens.
      */}
      <div className="pb-20 md:pb-0 md:pl-64">{children}</div>
    </div>
  );
}
