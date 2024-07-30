import { createClient } from 'redis';

import 'dotenv/config';
import * as engine from '../../../../SpatialComputingEngine/src/frontend-objects.js';
import  * as redis from '../../../../SpatialComputingEngine/src/spatial-computing-engine.js';



type Schemas = 
  typeof engine.ENTITY_SCHEMA 
| typeof engine.PATH_SCHEMA
| typeof engine.SPACE_SCHEMA
| typeof engine.SPG_SCHEMA
| typeof engine.SPG_FACTORY_SCHEMA
| typeof engine.SEND_ENTITY_SCHEMA
| typeof engine.ENTER_SPACE_SCHEMA
| typeof engine.LOCATION_SCHEMA
;


const getItemById = async (schema: Schemas, id: string): Promise<any> => {
  try { 
    let repo = await redis.connectAndGetRepo(schema);
    console.log(repo)
    const item = await repo.fetch(id);
    return item;
  } catch (error) {
    console.error('Error getting JSON data:', error);
  } 
};

getItemById(engine.ENTITY_SCHEMA, "01J33858AKNQWWEEVXB2PYTXFS");

export default getItemById;


/* 
const client = createClient({ url: process.env.REDIS_URL });

client.on('error', (err) => console.log('Redis Client Error', err));

const getJsonData = async (key: string, path: string = '$'): Promise<any> => {
  try {
    await client.connect();
    const data = await client.json.get(key, { path });
    console.log(`JSON data for key: ${key}`, data);
    return data;
  } catch (error) {
    console.error('Error getting JSON data:', error);
  } finally {
    await client.disconnect();
  }
};
*/
