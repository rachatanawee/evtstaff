import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav/bottom-nav";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { PageTransitionWrapper } from "@/components/page-transition-wrapper";
import Image from "next/image";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Event Staff",
  description: "Event Action for Staff",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}>) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-sky-200 to-[#041E42]`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <div className="flex flex-col min-h-screen items-center">
            <header className="p-4 bg-white shadow-md w-full">
              <div className="flex items-center justify-center max-w-md mx-auto">
                <Image src="/HOYA_LENS.png" alt="HOYA LENS" width={80} height={40} className="h-10 w-auto mr-4" />
                <h1 className="text-sm font-bold text-gray-800 text-center">
                  HOYA LENS THAILAND LTD. <br /> 51st Years Anniversary
                </h1>
              </div>
            </header>
            <main className="flex-grow pb-16 max-w-md mx-auto w-full px-4">
              <PageTransitionWrapper>
                {children}
              </PageTransitionWrapper>
            </main>
            <BottomNav />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}