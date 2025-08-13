import type React from "react"
import type { Metadata } from "next"
import { Playfair_Display } from "next/font/google"
import "./globals.css"
import { Toaster } from "react-hot-toast"

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700", "800", "900"],
})

export const metadata: Metadata = {
  title: "Warehouse Space Optimizer",
  description: "Optimize your warehouse space with intelligent analysis",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} light`}>
      <head>
        <style>{`
html {
  font-family: ${playfairDisplay.style.fontFamily};
  --font-sans: ${playfairDisplay.style.fontFamily};
  --font-serif: ${playfairDisplay.style.fontFamily};
  font-size: 18px; /* Increased from default 16px */
}
        `}</style>
      </head>
      <body className={`antialiased ${playfairDisplay.className}`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
