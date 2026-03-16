export const metadata = {
  title: 'ListPure — Clean Your Email List',
  description: 'Remove invalid emails, spam traps, and duplicates in 2 minutes.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#0a0a0f', fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
