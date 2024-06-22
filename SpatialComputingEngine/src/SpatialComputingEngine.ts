import "dotenv/config";
import { EntityId, Repository, Schema } from "redis-om";
import { SpatialTypeEntity } from "./FrontendObjects.js";
import { createClient } from "redis";

const client = await createClient({ url: process.env.REDIS_URL })
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

async function connectAndGetRepo(schema: Schema): Promise<Repository> {
  const repo: Repository = new Repository(schema, client);
  await repo.createIndex();
  return repo;
}

export async function saveData(
  schema: Schema,
  data: SpatialTypeEntity,
): Promise<string> {
  const repo = await connectAndGetRepo(schema);
  return (await repo.save(data))[EntityId];
}

export async function fetchData(
  schema: Schema,
  id: string,
): Promise<SpatialTypeEntity> {
  const repo = await connectAndGetRepo(schema);
  return (await repo.fetch(id)) as SpatialTypeEntity;
}

/*const entity: SmartEntity = new SmartEntity("virtual", true, "mobile");

console.log(entity);

console.log(await saveData(entity));*/
