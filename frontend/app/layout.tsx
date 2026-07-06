import type { Metadata } from 'next'
import { Nunito, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/lib/auth-context'
import './globals.css'
import 'katex/dist/katex.min.css'

const nunito = Nunito({ 
  subsets: ["latin"],
  variable: "--font-sans"
});
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'QEDU - Adaptive Learning Dashboard',
  description: 'Your personalized Linear Algebra learning journey with QEDU adaptive LMS',
  generator: 'v0.app',
  icons: {
    icon: '/earlyDesign/Gemini_Generated_Image_fvbx3efvbx3efvbx-removebg-preview.png',
    apple: '/earlyDesign/Gemini_Generated_Image_fvbx3efvbx3efvbx-removebg-preview.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <body className={`${nunito.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
