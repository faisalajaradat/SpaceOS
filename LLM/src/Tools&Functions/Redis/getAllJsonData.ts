import 'dotenv/config';
import * as engine from '../../../../SpatialComputingEngine/src/frontend-objects.js';
import * as redis from '../../../../SpatialComputingEngine/src/spatial-computing-engine.js';


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
const schemas: Schemas[] = [
  engine.ENTITY_SCHEMA,
  engine.PATH_SCHEMA,
  engine.SPACE_SCHEMA,
  engine.SPG_SCHEMA,
  engine.SPG_FACTORY_SCHEMA,
  engine.SEND_ENTITY_SCHEMA,
  engine.ENTER_SPACE_SCHEMA,
  engine.LOCATION_SCHEMA,
];



  const getAllItemsFromAllSchemas = async (): Promise<any[]> => {
    const allItems = [];
    for (const schema of schemas) {
      try {
        const repo = await redis.connectAndGetRepo(schema);
        const items = await repo.search().returnAll();
        allItems.push(...items);
      } catch (error) {
        console.error(`Error getting items for schema ${schema}:`, error);
      }
    }
    return allItems;
  };

export default getAllItemsFromAllSchemas;




// const client = createClient({ url: process.env.REDIS_URL });

// client.on('error', (err) => console.log('Redis Client Error', err));

// const getAllJsonData = async (): Promise<any> => {
//     try {
//       await client.connect();
  

//       const keys = await client.keys('*');

  
//       const allData = {};
  

//       for (const key of keys) {
//         try {

//           const jsonData = await client.json.get(key, { path: '$' });
//           if (jsonData !== null) {
//             allData[key] = jsonData;
//             continue;
//           }
//         } catch (jsonError) {
//             //regular get if errors out
//         }
  
//         try {
//           const data = await client.get(key);
//           allData[key] = data;
//         } catch (getError) {
//           console.error(`Error getting data for key: ${key}`, getError);
//         }
//       }
  
//       return allData;
//     } catch (error) {
//       console.error('Error getting all data:', error);
//     } finally {
//       await client.disconnect();
//     }
//   };
