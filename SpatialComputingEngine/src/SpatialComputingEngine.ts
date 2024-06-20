import "dotenv/config";
import { Client, EntityId, Repository, Schema } from "redis-om";
import {
  DynamicEntity,
  SpatialObject,
  SpatialType,
  dynamicEntitySchemaDef,
  spatialObjectSchemaDef,
  spatialTypeSchemaDef,
} from "./FrontendObjects.js";

const client = new Client();

async function connect() {
  if (!client.isOpen()) await client.open(process.env.REDIS_URL);
}

function getRepo(data: SpatialType): Repository {
  const schemaDef =
    data instanceof DynamicEntity
      ? dynamicEntitySchemaDef
      : data instanceof SpatialObject
        ? spatialObjectSchemaDef
        : spatialTypeSchemaDef;
  return new Repository(new Schema(data.constructor.name, schemaDef), client);
}

export async function saveData(data: SpatialType): Promise<string> {
  await connect();

  const repo = getRepo(data);

  const enrichedEntity = await repo.save(data);

  return enrichedEntity[EntityId];
}

/*const entity: SmartEntity = new SmartEntity("virtual", true, "mobile");

console.log(entity);

console.log(await saveData(entity));*/
await connect();

console.log(
  await new Repository(
    new Schema("SmartEntity", dynamicEntitySchemaDef),
    client,
  ).fetch("01J0VN5NSB8QJEV1V0T4HP1NJ8"),
);
