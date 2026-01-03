# React Migration Guide

## Overview
The frontend has been migrated to React using Vite, with React Router handling client-side navigation. The Express backend continues to serve the API and now serves the production React build from `frontend/dist`.

## Prerequisites
- Node.js 18+ (recommended)
- MongoDB (local or remote instance)

## Environment Variables
Create a `.env` file in the project root (same level as `package.json`) with:

```
MONGODB_URI=mongodb://localhost:27017/todoapp
JWT_SECRET=your_secret_key
PORT=3000
```

`PORT` is optional (defaults to 3000).

## Install Dependencies
From the project root:

```bash
npm install
```

From the `frontend` directory:

```bash
cd frontend
npm install
```

## Run the Project (Development)
Start the backend API server:

```bash
npm run dev
```

In a separate terminal, start the React dev server:

```bash
cd frontend
npm run dev
```

- Backend API: `http://localhost:3000`
- Frontend (Vite): `http://localhost:5173`

The Vite dev server proxies `/api` requests to the backend so authentication cookies work as expected.

## Run the Project (Production)
Build the React app:

```bash
cd frontend
npm run build
```

Start the backend server to serve the built frontend:

```bash
npm start
```

Open `http://localhost:3000` in your browser.

## Directory Structure
```
backend/
  app.js                # Express API server
frontend/
  index.html            # Vite entry HTML
  vite.config.js        # Vite + proxy configuration
  src/
    App.jsx             # React Router configuration
    main.jsx            # React entry point
    pages/              # Route pages (Home, Login, Signup, Tasks, 403, 404)
    styles/             # Scoped CSS from the original UI
    utils/              # API helpers
```

## Routing
React Router manages navigation for:
- `/` (home)
- `/login`
- `/signup`
- `/tasks`
- `/403` (forbidden)
- catch-all for 404s

The backend serves `frontend/dist/index.html` for non-API routes so client-side routing works in production.
