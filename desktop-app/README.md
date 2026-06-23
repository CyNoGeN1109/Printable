# PrintX Desktop

A desktop application for managing print orders using Electron, React, and Vite.

## Features

- Polls backend for new orders every 5 seconds
- Manages a print queue (max 15 orders)
- Downloads files from Cloudinary
- Integrates with pdf-to-printer for printing
- IPC communication between main and renderer processes

## Development

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Build for production: `npm run build`

## Backend

Ensure the PrintX backend is running on `http://localhost:3000`.

## Technologies

- Electron
- React
- Vite
- Tailwind CSS
- Axios
- pdf-to-printer