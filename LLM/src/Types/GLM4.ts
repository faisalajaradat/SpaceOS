import { ChatOpenAI } from "@langchain/openai";


export interface GLM4Input {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  baseURL: string;
}

export class ChatGLM4 extends ChatOpenAI {
  baseURL: string;
  temperature: number;
  topP: number;
  maxTokens: number;


  static lc_name() {
    return "GLM4";
  }

  _llmType() {
    return "GLM4";
  }

  lc_serializable = true;

  constructor(fields: GLM4Input) {
    super({
      ...fields,
      openAIApiKey: "dummy",
      configuration: {
        baseURL: fields.baseURL,
      },
    });
    this.baseURL = fields.baseURL;
    this.temperature = fields.temperature ?? 0.7;
    this.topP = fields.topP ?? 1.0;
    this.maxTokens = fields.maxTokens ?? 256;
  }
}
