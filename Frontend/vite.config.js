import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Monaco editor is huge (~4MB) — put it in its own chunk
          'monaco-editor': ['@monaco-editor/react', 'monaco-editor'],
          // Syntax highlighter — large but only needed in SubmissionHistory/ChatAI
          'syntax-highlighter': ['react-syntax-highlighter'],
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router'],
          // Redux
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
        },
      },
    },
  },
})
