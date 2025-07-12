import { connectToServer } from "./connect.js";
import express from "express";
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';
import users from "./routes/users.js";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? ['workstation-production.up.railway.app']
        : ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));

app.use(express.json());

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// API routes
app.use("/", users);

// Alternative approach: Handle SPA routing without wildcards
// Define specific routes that should serve the SPA
const spaRoutes = [
    '/',
    '/dashboard',
    '/settings',
    '/tasks',
    '/profile'
    // Add any other client-side routes your app uses
];

spaRoutes.forEach(route => {
    app.get(route, (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
});

// For any other routes, try to serve static files first, then fallback to index.html
app.use((req, res, next) => {
    // If it's not an API route and file doesn't exist, serve index.html
    if (!req.path.startsWith('/users') && !req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    } else {
        next();
    }
});

const startServer = async() => {
    try {
        await connectToServer();
        app.listen(PORT, () => {
            console.log(`Server is running on port: ${PORT}`);
        })
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();