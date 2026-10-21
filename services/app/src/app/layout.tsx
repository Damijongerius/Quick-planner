import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import "@/components/ui/Button.css";

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: "Planner",
  description: "Plan projects, sprints and work in one place.",
};

const THEME_SCRIPT = `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Apply the saved theme before first paint to avoid a flash */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
