import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const client = new MongoClient(process.env.MONGODB_URL);

try {
  await client.connect();
  console.log("Connected!");
} catch (e) {
  console.error(e);
}

await client.close();