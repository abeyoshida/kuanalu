import { ReactNode } from 'react';

interface AcceptInvitationLayoutProps {
  children: ReactNode;
}

export default function AcceptInvitationLayout({
  children,
}: AcceptInvitationLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
} 