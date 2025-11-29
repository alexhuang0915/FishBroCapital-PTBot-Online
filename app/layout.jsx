import './globals.css'

export const metadata = {
  title: 'FishBro Capital - Performance Dashboard',
  description: 'Trading Strategy Performance Dashboard',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  )
}

