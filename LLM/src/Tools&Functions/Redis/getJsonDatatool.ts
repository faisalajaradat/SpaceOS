import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import getItemById from './getJsonData.js'; 
import * as engine from '../../../../SpatialComputingEngine/src/frontend-objects.js';



const getJsonDataByIdSchema = z.object({
  schemaType: z.enum([
    'ENTITY_SCHEMA',
    'PATH_SCHEMA',
    'SPACE_SCHEMA',
    'SPG_SCHEMA',
    'SPG_FACTORY_SCHEMA',
    'SEND_ENTITY_SCHEMA',
    'ENTER_SPACE_SCHEMA',
    'LOCATION_SCHEMA'
  ]).describe('The type of schema to retrieve the item from.'),
  id: z.string().describe('The ID of the item to retrieve from the Redis database, items in SpaceBase do not have the sameID as in the database.')
});

const getJsonDataByIdTool = new DynamicStructuredTool({
  name: "GetJsonDataById",
  description: 'Retrieve JSON data from a Redis database for a specified schema and ID.',
  schema: getJsonDataByIdSchema,
  func: async ({ schemaType, id }) => {
    const schemaMap = {
      ENTITY_SCHEMA: engine.ENTITY_SCHEMA,
      PATH_SCHEMA: engine.PATH_SCHEMA,
      SPACE_SCHEMA: engine.SPACE_SCHEMA,
      SPG_SCHEMA: engine.SPG_SCHEMA,
      SPG_FACTORY_SCHEMA: engine.SPG_FACTORY_SCHEMA,
      SEND_ENTITY_SCHEMA: engine.SEND_ENTITY_SCHEMA,
      ENTER_SPACE_SCHEMA: engine.ENTER_SPACE_SCHEMA,
      LOCATION_SCHEMA: engine.LOCATION_SCHEMA
    };
    
    const schema = schemaMap[schemaType];
    
    if (!schema) {
      return `Invalid schema type: ${schemaType}`;
    }
    
    const data = await getItemById(schema, id);
    return data ? JSON.stringify(data, null, 2) : `No data found for schema: ${schemaType} with ID: ${id}`;
  },
});

export default getJsonDataByIdTool;
