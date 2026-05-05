import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import BottomNav from "@/components/BottomNav";
import InstallPrompt from "@/components/InstallPrompt";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "AEW Fantasy",
  description: "Fantasy wrestling game built around All Elite Wrestling",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AEW Fantasy",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <head>
        <meta name="theme-color" content="#0d0d0d" />
      </head>
      <body className="min-h-full flex flex-col bg-[#0d0d0d] text-[#f5f5f5] antialiased">
        <ServiceWorkerRegistration />
        <Nav />
        {/* pb-16 offsets the fixed bottom nav on mobile */}
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <BottomNav />
        <InstallPrompt />
      </body>
    </html>
  );
}
