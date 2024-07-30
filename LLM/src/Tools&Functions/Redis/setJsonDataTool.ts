
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
    const item = await repo.fetch(id);
    return item;
  } catch (error) {
    console.error('Error getting JSON data:', error);
  } 
};



export default getItemById;
