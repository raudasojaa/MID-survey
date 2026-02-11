export const metadata = {
  title: 'MID Panel Survey',
  description: 'Create and manage MID panel surveys',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
