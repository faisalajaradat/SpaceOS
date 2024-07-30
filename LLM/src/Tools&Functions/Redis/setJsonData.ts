import { Entity, EntityId, Schema } from "redis-om";
import 'dotenv/config';
import { createClient } from "redis";
import { connectAndGetRepo } from "../../../../SpatialComputingEngine/src/spatial-computing-engine.js";
import { MAPPED_ENTITIES_SCHEMA, MappedEntities } from "../../Types/MappedEntities.js";

const client = await createClient({ url: process.env.REDIS_URL })
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();


async function setJsonData(
  schema: Schema,
  data: MappedEntities,
): Promise<string> {
  const repo = await connectAndGetRepo(schema);
  return ((await repo.save(data)) as Entity)[EntityId];
}
setJsonData(MAPPED_ENTITIES_SCHEMA, new MappedEntities())
export default setJsonData;
