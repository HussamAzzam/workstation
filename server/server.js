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
    origin: 'http://localhost:5173', // you could origin: ['http://localhost:5173', 'https://your-production-domain.com']
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], //Default: If omitted, only GET and POST are allowed
    allowedHeaders: ['Content-Type'], //For Authentication: Add Authorization if using JWT/tokens: allowedHeaders: ['Content-Type', 'Authorization']
    credentials: true // If you're using cookies/auth
}));
app.use(express.json());
//app.use(express.static(path.join(__dirname, 'dist')));
app.use(users);
//app.get('*', (req, res) => {
//    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
//});

/*
    Adds middleware to parse incoming JSON request bodies
    When clients send JSON data in POST/PUT requests, this middleware automatically parses it and makes it available in req.body
    Essential for APIs that receive JSON data
*/
const startServer = async() => {
    try {
        await connectToServer();
        app.listen(PORT, () => {
            console.log(`server is running on pont: ${PORT}`);
        })
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();

/*
CORS (Cross-Origin Resource Sharing) deals with web browser security. Let me explain what "different domains/origins" means and why it matters:
    What is an "Origin"?
    An origin consists of three parts:

    Protocol (http/https)
    Domain (localhost, google.com, mysite.com)
    Port (3000, 8000, 80, 443)

    These are different origins:

    http://localhost:3000
    http://localhost:8000 (different port)
    https://localhost:3000 (different protocol)
    http://mysite.com:3000 (different domain)

    The Browser Security Rule
    By default, browsers enforce the "Same-Origin Policy" - they block JavaScript requests between different origins. This means:

    -This would be BLOCKED without CORS

    // Frontend running on http://localhost:3000
    fetch('http://localhost:8000/api/users') // Different port = different origin

    -This would work (same origin):

    // Frontend running on http://localhost:3000
    fetch('http://localhost:3000/api/users') // Same origin

    Real-World Example
    Imagine you have:

    Frontend: React app running on http://localhost:3000
    Backend: Express API running on http://localhost:8000

    Without CORS, when your React app tries to fetch data from your API, the browser would show an error
 */
