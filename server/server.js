/**
 * server/server.js
 * QRDine backend entry point.
 *
 * Express HTTP server + Socket.IO, mounted menu/order routes, static vendor
 * dashboard, and real-time order synchronization.
 */

import express from 'express';
import http from 'node:http';
import path from 'node:path';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';

import { buildMenuPayload } from './config/menuData.js';
import menuRoutes from './routes/menuRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import { setupSocketHandler } from './sockets/socketHandler.js';

dotenv.config();

// Resolve the views directory relative to the current working directory.
// The server is always launched from the `server/` folder, so this works for
// both direct `node server.js` runs and Jest test imports.
const VIEWS_DIR = path.join(process.cwd(), 'views');

export function createApp() {
  const PORT = Number(process.env.PORT) || 3000;
  const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:8080').replace(/\/+$/, '');

  const app = express();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 20000,
    pingInterval: 25000
  });

  // --- Middleware ---
  app.use(cors({ origin: CLIENT_URL, methods: ['GET', 'POST'] }));
  app.use(express.json({ limit: '1mb' }));

  // Expose the Socket.IO server on every request so controllers can emit events.
  app.use((req, res, next) => {
    req.io = io;
    next();
  });

  // --- Static views (vendor dashboard) ---
  app.use(express.static(VIEWS_DIR));

  // --- API routes ---
  app.use('/api/menu', menuRoutes);
  app.use('/api/order', orderRoutes);

  // Convenience: serve the authoritative menu at a root-ish path too.
  app.get('/api', (req, res) => {
    res.json(buildMenuPayload());
  });

  // --- Socket.IO ---
  setupSocketHandler(io);

  // --- Error handling ---
  app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Not found' });
  });

  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    console.error('[Server] Unhandled error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  });

  return { app, server, io, PORT };
}

// Only start listening when this file is run directly (not imported by tests).
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve('server.js');
if (isMain) {
  const { app, server, io, PORT } = createApp();

  server.listen(PORT, () => {
    console.log(`
  ============================================
   QRDine Backend
   ============================================
   Server running on: http://localhost:${PORT}
   Vendor dashboard:  http://localhost:${PORT}/vendor-dashboard.html
   API base:          http://localhost:${PORT}/api
   CORS origin:       ${process.env.CLIENT_URL || 'http://localhost:8080'}
  `);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Server] Port ${PORT} is already in use. Set PORT env to a free port.`);
    } else {
      console.error('[Server] Startup error:', err.message);
    }
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('[Server] Unhandled rejection:', reason);
  });
}