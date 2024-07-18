import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import getJsonData from './getJsonData.js';

const getJsonDataSchema = z.object({
  key: z.string().describe('The Redis key to retrieve the JSON data from.'),
  path: z.string().optional().describe('The JSON path to retrieve specific data from the JSON object.')
});

const getJsonDataTool = new DynamicStructuredTool({
  name: "GetJsonData",
  description: 'Retrieve JSON data from a Redis database for a specified key and path.',
  schema: getJsonDataSchema,
  func: async ({ key, path = '$' }) => {
    const data = await getJsonData(key, path);
    return data ? JSON.stringify(data, null, 2) : `No data found for key: ${key} at path: ${path}`;
  },
});

export default getJsonDataTool;
