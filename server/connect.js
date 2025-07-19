import { MongoClient, ServerApiVersion } from "mongodb";

import dotenv from 'dotenv';
dotenv.config({path: "./config.env"});

const uri = process.env.ATLAS_URI || "";

let database;
let client;

export const connectToServer = async() => {
  try {
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });

    await client.connect();
    database = client.db("work-station");

    // Verify connection
    await database.command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");

    return database;
  } catch (error) {

  }
};
export const getDb = () => {
  if (!database) {
    throw new Error("Database not connected!");
  }
  return database;
};
//test
/*database = client.db("work-station");
let collection = database.collection("tasks").find({}).toArray()
    .then(collection => console.log(collection));*/





