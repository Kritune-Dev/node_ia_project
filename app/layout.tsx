import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Metadata } from 'next'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: {
    default: 'IA Médicale Ostéopathie | Analyse des données cliniques',
    template: '%s | IA Médicale Ostéopathie'
  },
  description: 'Plateforme d\'analyse IA pour données cliniques ostéopathiques - Évaluation des LLM pour la prise en charge et les tests orthopédiques',
  keywords: [
    'ostéopathie',
    'intelligence artificielle',
    'LLM',
    'données cliniques',
    'tests orthopédiques',
    'médecine',
    'analyse',
    'mémoire'
  ],
  authors: [
    {
      name: 'Corentin',
      url: 'https://github.com/votre-username',
    }
  ],
  creator: 'Corentin',
  publisher: 'Université/École d\'Ostéopathie',
  metadataBase: new URL('https://votre-domaine.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://votre-domaine.vercel.app',
    title: 'IA Médicale Ostéopathie',
    description: 'Plateforme d\'analyse IA pour données cliniques ostéopathiques',
    siteName: 'IA Médicale Ostéopathie',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IA Médicale Ostéopathie',
    description: 'Plateforme d\'analyse IA pour données cliniques ostéopathiques',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  )
}
