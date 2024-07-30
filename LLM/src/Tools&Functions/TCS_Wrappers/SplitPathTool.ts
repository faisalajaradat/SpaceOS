import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { splitPath } from "../../../../TCShell/src/core/spg-methods.js";

const tscSplitPathTool = new DynamicStructuredTool({
  name: "TSCSplitPath",
  description: '',
  schema: z.object({
    SPG_id: z.string().describe(''),
    path_to_split_id: z.string().describe('')
  }).describe('Parameters required for splitting the path.'),
  func: async ({ SPG_id, path_to_split_id }) => {
    const result = splitPath(SPG_id, path_to_split_id);
    return result ? JSON.stringify(result, null, 2) : 'Path could not be split.';
  },
});

export default tscSplitPathTool;
