import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../config.env") });

const uri = process.env.ATLAS_URI || "";

const clientOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  serverSelectionTimeoutMS: 3000,
  connectTimeoutMS: 3000,
  socketTimeoutMS: 5000,
};

let db = null;
let client = null;
let connectPromise = null;

function withTimeout(promise, ms, label) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

async function resetConnection() {
  db = null;
  connectPromise = null;
  if (client) {
    try {
      await client.close();
    } catch {
      // ignore close errors during reset
    }
    client = null;
  }
}

async function establishConnection() {
  const nextClient = new MongoClient(uri, clientOptions);
  await withTimeout(nextClient.connect(), 12000, "MongoDB connect");
  const nextDb = nextClient.db("employees");
  await withTimeout(nextDb.command({ ping: 1 }), 8000, "MongoDB ping");

  if (client && client !== nextClient) {
    try {
      await client.close();
    } catch {
      // best-effort cleanup
    }
  }

  client = nextClient;
  db = nextDb;
  console.log("Pinged your deployment. You successfully connected to MongoDB!");
  return db;
}

export async function connectToDatabase() {
  if (db) return db;

  if (!connectPromise) {
    connectPromise = establishConnection().catch(async (err) => {
      await resetConnection();
      connectPromise = null;
      throw err;
    });
  }

  return connectPromise;
}

export async function getCollection(name) {
  const database = await connectToDatabase();
  return database.collection(name);
}

// Backwards-compatible lazy proxy so existing routes using
//   import db from "../db/connection.js"
//   const collection = db.collection("name")
// continue to work without modification.
function cursorProxy(resolve, args) {
  let _sort = null;
  const cursor = {
    sort: (s) => { _sort = s; return cursor; },
    toArray: () =>
      resolve().then((c) => {
        let q = c.find(...args);
        if (_sort) q = q.sort(_sort);
        return q.toArray();
      }),
  };
  return cursor;
}

function lazyCollection(name) {
  const resolve = () => getCollection(name);
  return {
    findOne:          (...a) => resolve().then((c) => c.findOne(...a)),
    find:             (...a) => cursorProxy(resolve, a),
    insertOne:        (...a) => resolve().then((c) => c.insertOne(...a)),
    updateOne:        (...a) => resolve().then((c) => c.updateOne(...a)),
    deleteOne:        (...a) => resolve().then((c) => c.deleteOne(...a)),
    findOneAndUpdate: (...a) => resolve().then((c) => c.findOneAndUpdate(...a)),
  };
}

export default {
  collection: (name) => lazyCollection(name),
};