import type { Metadata } from 'next';
import {
  DM_Sans,
  JetBrains_Mono,
  Plus_Jakarta_Sans,
} from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/AppShell';
import { GEMINI_VISION_MODEL } from '@/lib/server-config';
import { getStorageMode } from '@/lib/store';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Inspectra AI — Visual Quality Inspection',
  description:
    'Automated vision AI quality control inspection for manufacturing and workshop parts with defect detection and traceability.',
  openGraph: {
    title: 'Inspectra AI — Visual Quality Inspection',
    description:
      'Automated vision AI quality control inspection for manufacturing and workshop parts with defect detection and traceability.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const storageMode = getStorageMode();

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${plusJakarta.variable} ${jetBrainsMono.variable}`}
    >
      <body>
        <AppShell storageMode={storageMode} model={GEMINI_VISION_MODEL}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
