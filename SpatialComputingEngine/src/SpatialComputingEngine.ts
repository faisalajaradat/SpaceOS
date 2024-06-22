import "dotenv/config";
import { Client, EntityId, Repository, Schema } from "redis-om";
import { SpatialTypeEntity } from "./FrontendObjects.js";

const client = new Client();

async function connect(): Promise<Client> {
  if (!client.isOpen()) return await client.open(process.env.REDIS_URL);
}

async function connectAndGetRepo(schema: Schema): Promise<Repository> {
  const client = await connect();
  const repo: Repository = client.fetchRepository(schema);
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
