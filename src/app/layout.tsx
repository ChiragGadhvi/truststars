
import type { Metadata } from "next";
import { Inconsolata } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import DashboardButton from "@/components/dashboard-button";

const inconsolata = Inconsolata({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TrustStars",
  description: "Verified GitHub repositories and developer profiles.",
  icons: {
    icon: '/truststars.png',
    shortcut: '/truststars.png',
    apple: '/truststars.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inconsolata.className)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <DashboardButton />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
