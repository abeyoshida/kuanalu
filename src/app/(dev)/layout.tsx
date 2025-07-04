import { ReactNode } from 'react';

interface DevLayoutProps {
  children: ReactNode;
}

export default function DevLayout({ children }: DevLayoutProps) {
  // Check if we're in development mode
  const isDev = process.env.NODE_ENV === 'development';

  // If not in development, show an error
  if (!isDev) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Development Tools</h1>
        <p className="text-red-500">
          These tools are only available in development mode.
        </p>
      </div>
    );
  }

  // In development, show the children
  return (
    <div>
      <div className="bg-yellow-100 p-4 text-center">
        <p className="text-yellow-800 font-medium">
          Development Tools - Not for Production Use
        </p>
      </div>
      {children}
    </div>
  );
} 