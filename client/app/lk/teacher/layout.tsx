
'use client';

import RoleGate from '../../../shared/auth/RoleGate';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RoleGate allowed={['teacher']}>{children}</RoleGate>;
}
