import express  from "express";
import { getDb } from "../connect.js";
import { ObjectId } from "mongodb";

const userRoutes = express.Router();

//#1: Retrieve All
userRoutes.route("/users").get(async (req, res) => {
    try {
        const db = getDb();
        const data = await db.collection("users").find({}).toArray();
        if(data.length > 0) {
            res.json(data);
        } else {
            res.status(404).json({message: "no user found"})
        }
    } catch(e) {
        res.status(500).json({message: "Database error"})
    }
});

//#2: Retrieve One by Custom ID (now using _id directly)
userRoutes.route("/users/:id").get(async (req, res) => {
    try {
        const db = getDb();
        // Use the custom ID as the _id directly
        const data = await db.collection("users").findOne({_id: req.params.id});
        if(data) {
            res.json(data);
        } else {
            res.status(404).json({message: "user not found"})
        }
    } catch (e) {
        res.status(500).json({message: "Database error"});
    }
});

//#3: Create One
userRoutes.route("/users").post(async (req, res) => {
    try {
        const db = getDb();
        const newUser = {
            _id: req.body._id, // Use custom ID as _id
            createdAt: req.body.createdAt || Date.now(),
            lastActive: req.body.lastActive || Date.now(),
            settings: req.body.settings || {
                workTime: 25,
                shortBreakTime: 5,
                longBreakTime: 15,
                sessionsUntilLongBreak: 4,
                autoStart: false
            },
            panels: req.body.panels || [
                {name: "Pomodoro", sessions: 0},
                {name: "Rest", sessions: 0},
                {name: "Long Rest", sessions: 0}
            ],
            tasks: req.body.tasks || []
        }
        const createdUser = await db.collection("users").insertOne(newUser);
        if(createdUser.acknowledged) {
            // Return the created user
            const userData = await db.collection("users").findOne({_id: req.body._id});
            res.json(userData);
        } else {
            res.status(500).json({message: "Failed to create user"});
        }
    } catch (e) {
        console.error("Create user error:", e);
        if (e.code === 11000) {
            // Duplicate key error
            res.status(409).json({message: "User already exists"});
        } else {
            res.status(500).json({message: "Database error"});
        }
    }
});

//#4: Update One
userRoutes.route("/users/:id").patch(async (req, res) => {
    try {
        const db = getDb();
        const updateData = {
            lastActive: Date.now(),
            ...req.body // This will include settings, panels, tasks, etc.
        };

        // Use $set operator for proper MongoDB update
        const result = await db.collection("users").updateOne(
            {_id: req.params.id},
            {$set: updateData}
        );

        if(result.modifiedCount > 0) {
            // Return the updated user
            const updatedUserData = await db.collection("users").findOne({_id: req.params.id});
            res.json(updatedUserData);
        } else {
            res.status(404).json({message: "User not found or no changes made"});
        }
    } catch (e) {
        console.error("Update user error:", e);
        res.status(500).json({message: "Database error"});
    }
});

//#5: Delete One
userRoutes.route("/users/:id").delete(async (req, res) => {
    try {
        const db = getDb();
        const result = await db.collection("users").deleteOne({_id: req.params.id});
        if(result.deletedCount > 0) {
            res.json({message: "User deleted successfully"});
        } else {
            res.status(404).json({message: "User not found"});
        }
    } catch (e) {
        res.status(500).json({message: "Database error"});
    }
});

export default userRoutes;