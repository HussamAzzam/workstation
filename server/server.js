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
        ? ['https://your-production-domain.com']
        : ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Fix: Remove the redundant "/routes" prefix since your routes already define "/users"
app.use("/", users);

// Catch-all handler for SPA routing (should be last)
// Express 5 requires explicit parameter naming for wildcards
app.get('/:path(.*)', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
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