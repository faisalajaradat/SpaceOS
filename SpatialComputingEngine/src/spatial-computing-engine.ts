import "dotenv/config";
import { EntityId, Repository, Schema } from "redis-om";
import * as engine from "./frontend-objects.js";
import { createClient } from "redis";

const client = await createClient({ url: process.env.REDIS_URL })
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

export async function connectAndGetRepo(schema: Schema): Promise<Repository> {
  const repo: Repository = new Repository(schema, client);
  await repo.createIndex();
  return repo;
}

export async function disconnect(): Promise<void> {
  if (client.isOpen) return await client.disconnect();
}

export async function saveData(
  schema: Schema,
  data: engine.EngineEntity,
): Promise<string> {
  const repo = await connectAndGetRepo(schema);
  return (await repo.save(data))[EntityId];
}

export async function fetchData(
  schema: Schema,
  id: string,
): Promise<engine.EngineEntity> {
  const repo = await connectAndGetRepo(schema);
  return (await repo.fetch(id)) as engine.EngineEntity;
}
