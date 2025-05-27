import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import type {Metadata} from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { vt323 } from './fonts'; // Import the pixel font
import { ThemeProviderClient } from '@/components/ThemeProviderClient';
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Pixel Notes',
  description: 'A simple note-taking app with a retro pixel theme.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased"> {/* Font variables removed from here */}
        <div className={`${geistSans.variable} ${geistMono.variable} ${vt323.variable}`}> {/* Font variables applied to an inner wrapper */}
          <ThemeProviderClient
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProviderClient>
        </div>
      </body>
    </html>
  );
}
