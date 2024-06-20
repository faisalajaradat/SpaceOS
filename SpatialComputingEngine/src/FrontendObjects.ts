import { Schema, Repository, Entity } from "redis-om";
import { connect, client } from "./SpatialComputingEngine.js";

export interface SpatialEntity extends Entity {
  locality: string;
}

const entitySchema = new Schema(
  "SpatialEntity",
  {
    locality: { type: "string" },
  },
  { dataStructure: "JSON" },
);

export async function saveEntity(
  entity: SpatialEntity,
): Promise<SpatialEntity> {
  await connect();

  const repo = new Repository(entitySchema, client);

  const id: SpatialEntity = <SpatialEntity>await repo.save(entity);

  return id;
}

export async function fetchEntity(id: string): Promise<SpatialEntity> {
  await connect();

  const repo = new Repository(entitySchema, client);

  return <SpatialEntity>await repo.fetch(id);
}
