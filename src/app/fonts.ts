import { VT323, Inter } from 'next/font/google'; // Keep Inter or Geist as fallback

export const vt323 = VT323({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-vt323',
  display: 'swap',
});

// Assuming Geist is preferred from initial scaffold, keep it.
// If Inter was used before, it can be kept too.
// The main body will use Geist, specific elements will use VT323.
