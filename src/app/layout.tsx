import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import type {Metadata} from 'next';
import { Inter, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { vt323 } from './fonts'; // Import the pixel font
import { ThemeProviderClient } from '@/components/ThemeProviderClient';
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const robotoMono = Roboto_Mono({
  variable: '--font-roboto-mono',
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
        <div className={`${inter.variable} ${robotoMono.variable} ${vt323.variable}`}> {/* Font variables applied to an inner wrapper */}
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
