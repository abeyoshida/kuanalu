import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kuanalu - Authentication",
  description: "Sign in or register for Kuanalu",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Auth form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">KB</span>
              </div>
              <Link href="/" className="text-xl font-semibold text-gray-900">
                Kuanalu
              </Link>
            </div>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
} 