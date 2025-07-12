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
    origin: ['http://localhost:5173', process.env.FRONTEND_URL || 'https://your-railway-app.up.railway.app'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));

app.use(express.json());

// Serve static files from the client build folder
app.use(express.static(path.join(__dirname, '../client/dist')));

// API routes
app.use(users);

// Catch all handler - send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const startServer = async() => {
    try {
        await connectToServer();
        app.listen(PORT, () => {
            console.log(`server is running on port: ${PORT}`);
        })
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();