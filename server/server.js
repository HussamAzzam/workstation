import { connectToServer } from "./connect.js";
import express from "express";
import cors from "cors";
import users from "./routes/users.js";

const app = express();
const PORT = process.env.PORT || 3000;
/*const frontendDomain = process.env.FRONTEND_DOMAIN || 'https://workstation-ten.vercel.app';*/

app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://workstation-ten.vercel.app',
        'https://workstation-git-master-hussams-projects-c841285a.vercel.app',
        'https://workstation-py04ryxkw-hussams-projects-c841285a.vercel.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));

app.use(express.json());


app.get('/', (req, res) => {
    res.json({ message: 'Backend is running!', status: 'OK' });
});

// API routes
app.use(users);

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