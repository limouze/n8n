module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        chart: {
          green: '#10b981',
          red: '#ef4444',
          blue: '#3b82f6',
          gray: '#6b7280',
        }
      }
    },
  },
  plugins: [],
}
