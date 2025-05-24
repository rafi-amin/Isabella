
import type { Metadata } from 'next';
import { Inter, Fira_Code, Playfair_Display, Lora, PT_Serif, Libre_Baskerville, IBM_Plex_Sans, Martian_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const firaCode = Fira_Code({
  variable: '--font-fira-code',
  subsets: ['latin'],
  weight: ['400', '700'],
});

const playfairDisplay = Playfair_Display({
  variable: '--font-playfair-display',
  subsets: ['latin'],
  weight: ['400', '700'], 
});

const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
  weight: ['400', '700'], 
});

const ptSerif = PT_Serif({
  variable: '--font-pt-serif',
  subsets: ['latin'],
  weight: ['400', '700'],
});

const libreBaskerville = Libre_Baskerville({
  variable: '--font-libre-baskerville',
  subsets: ['latin'],
  weight: ['400', '700'],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: '--font-ibm-plex-sans',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

const martianMono = Martian_Mono({
  variable: '--font-martian-mono',
  subsets: ['latin'],
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'Isabella AI Assistant',
  description: 'Your personal AI assistant.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${firaCode.variable} ${playfairDisplay.variable} ${lora.variable} ${ptSerif.variable} ${libreBaskerville.variable} ${ibmPlexSans.variable} ${martianMono.variable} antialiased`}>
        <div id="shooting-stars-overlay">
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
        </div>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
