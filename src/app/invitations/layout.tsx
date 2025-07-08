import { ReactNode } from 'react';

interface InvitationsLayoutProps {
  children: ReactNode;
}

export default function InvitationsLayout({ children }: InvitationsLayoutProps) {
  return <>{children}</>;
} 