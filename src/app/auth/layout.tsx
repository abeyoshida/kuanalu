import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

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
      {/* Left side - Auth form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
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
      
      {/* Right side - Image */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex h-full items-center justify-center p-12">
            <div className="relative w-full max-w-lg">
              <Image
                className="mx-auto rounded-lg shadow-xl"
                src="/image-v0-landing-page.png"
                alt="Kuanalu Dashboard Preview"
                width={800}
                height={600}
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 