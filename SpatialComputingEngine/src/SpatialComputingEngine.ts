import "dotenv/config";
import { Client, Repository, Schema } from "redis-om";
import {
  DynamicEntity,
  SpatialObject,
  SpatialTypeEntity,
  dynamicEntitySchemaDef,
  spatialObjectSchemaDef,
  spatialTypeSchemaDef,
} from "./FrontendObjects.js";

const client = new Client();

async function connect() {
  if (!client.isOpen()) await client.open(process.env.REDIS_URL);
}

function connectAndGetRepo(data: SpatialTypeEntity): Promise<Repository> {
  return connect().then(() => {
    const schemaDef =
      data instanceof DynamicEntity
        ? dynamicEntitySchemaDef
        : data instanceof SpatialObject
          ? spatialObjectSchemaDef
          : spatialTypeSchemaDef;
    return new Repository(new Schema(data.constructor.name, schemaDef), client);
  });
}

export function saveData(data: SpatialTypeEntity): Promise<SpatialTypeEntity> {
  return connectAndGetRepo(data).then((repo) => {
    return repo
      .save(data)
      .then((enrichedEntity) => <SpatialTypeEntity>enrichedEntity);
  });
}

export function fetchData(
  defaultInstance: SpatialTypeEntity,
  id: string,
): Promise<SpatialTypeEntity> {
  return connectAndGetRepo(defaultInstance).then((repo) => {
    return repo.fetch(id).then((value) => <SpatialTypeEntity>value);
  });
}

/*const entity: SmartEntity = new SmartEntity("virtual", true, "mobile");

console.log(entity);

console.log(await saveData(entity));*/
