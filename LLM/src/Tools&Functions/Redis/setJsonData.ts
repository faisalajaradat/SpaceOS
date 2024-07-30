import { Entity, EntityId, Schema } from "redis-om";
import * as engine from '../../../../SpatialComputingEngine/src/frontend-objects.js';
import 'dotenv/config';

async function setJsonData(
  schema: Schema,
  data: engine.EngineEntity,
): Promise<string> {
  //const repo = await connectAndGetRepo(schema);
  //return ((await repo.save(data)) as Entity)[EntityId];
  return;
}

export default setJsonData;
