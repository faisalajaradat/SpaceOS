import "dotenv/config";
import { Client } from "redis-om";
import { SpatialEntity, fetchEntity, saveEntity } from "./FrontendObjects.js";

export const client = new Client();

export async function connect() {
  if (!client.isOpen()) await client.open(process.env.REDIS_URL);
}
