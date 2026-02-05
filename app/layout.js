export const metadata = {
  title: 'Planck Kokoro',
  description: 'Sistema de gestão',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
