import './globals.css'

export const metadata = {
  title: 'FishBro Capital - Performance Dashboard',
  description: 'Trading Strategy Performance Dashboard',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  )
}

