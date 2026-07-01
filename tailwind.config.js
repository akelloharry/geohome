module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'lake-blue': '#1E6FDF',
        'sunset-orange': '#F59E0B',
        'acacia-green': '#10B981',
        'savannah-red': '#EF4444',
        'midnight-soil': '#1F2937',
        'baobab-bark': '#6B7280',
        'cloud-fluff': '#F9FAFB',
        'geohome-gold': '#FBBF24',
        'trust-teal': '#14B8A6'
      },
      fontFamily: {
        heading: ['Merriweather', 'serif'],
        body: ['Open Sans', 'sans-serif']
      }
    }
  },
  plugins: []
}
