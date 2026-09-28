import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
/** 
 *  '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
      '/media': 'http://localhost:5000',
*/
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'https://flowstock-oh7l.onrender.com',
      '/uploads':'https://flowstock-oh7l.onrender.com',
      '/media': 'https://flowstock-oh7l.onrender.com',
    },
  },
})
