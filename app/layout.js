import '../styles/globals.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import { AuthProvider } from '../context/AuthContext'
import Navbar from '../components/Navbar'

export const metadata = {
  title: 'GeoHome Kenya',
  description: 'Find homes near you'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/placeholder.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@700;900&family=Open+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
        <style>{`:root { --lake-blue: #1E6FDF; --sunset-orange: #F59E0B; --acacia-green: #10B981; --savannah-red: #EF4444; --midnight-soil: #1F2937; --baobab-bark: #6B7280; --cloud-fluff: #F9FAFB; --geohome-gold: #FBBF24; --trust-teal: #14B8A6; }`}</style>
      </head>
      <body className="bg-cloud-fluff font-body text-midnight-soil">
        <AuthProvider>
          <Navbar />
          <main className="max-w-6xl mx-auto p-4">{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
