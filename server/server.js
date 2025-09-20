import { connectToServer } from "./connect.js";
import express from "express";
import cors from "cors";
import users from "./routes/users.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Add all your Vercel domains
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://workstation-ten.vercel.app',
    'https://workstation-git-master-hussams-projects-c841285a.vercel.app',
    'https://workstation-py04ryxkw-hussams-projects-c841285a.vercel.app',
    process.env.FRONTEND_DOMAIN
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        console.log('Blocked origin:', origin); // For debugging
        const msg = 'CORS policy does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Backend is running!', status: 'OK' });
});

app.use(users);

const startServer = async() => {
    try {
        await connectToServer();
        app.listen(PORT, () => {
            console.log(`Server is running on port: ${PORT}`);
            console.log(`Allowed origins:`, allowedOrigins);
        })
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();