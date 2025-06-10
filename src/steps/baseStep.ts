import StepInterface, { Artifacts, Prompt } from "./stepInterface";
import prompts from 'prompts';

export default class BaseStep implements StepInterface {
  prompts: Prompt[] = [];
  artifacts: Artifacts = {};

  constructor(artifacts?: Artifacts) {
    this.artifacts = artifacts || {};
  }

  async execute() {
    for (const prompt of this.prompts) {
      await this.processPrompt(prompt);
      prompt.handler?.();
    }
    return this.artifacts
  }

  async processPrompt(prompt: Prompt) {
    const response = await prompts({
      type: prompt.type,
      name: prompt.id,
      message: prompt.message,
    })
    
    if (response[prompt.id] === undefined) {
      throw new Error(`No response provided for prompt: ${prompt.id}`);
    }

    if (typeof response[prompt.id] !== 'string') {
      throw new Error(`Response for prompt ${prompt.id} is not a string: ${typeof response[prompt.id]}`);
    }

    prompt.answer = (!!prompt.answer ? "|||" : "") + response[prompt.id] as string;

    if (prompt.recursive && response[prompt.id] !== "q") {
      this.processPrompt(prompt)
    }
  }

  protected getWorkflowName(): string {
    return this.artifacts.workflowName || '';
  }
}