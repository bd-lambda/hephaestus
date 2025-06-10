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
    const answer = response[prompt.id].trim();

    if (answer === ':exit') return
    
    if (prompt.required && answer === undefined) {
      throw new Error(`No response provided for prompt: ${prompt.id}`);
    }

    if (typeof answer !== 'string') {
      throw new Error(`Response for prompt ${prompt.id} is not a string: ${typeof answer}`);
    }

    if (answer === 'q') return

    prompt.answer = (!!prompt.answer ? "|||" : "") + answer as string;
    if (prompt.recursive) await this.processPrompt(prompt)
  }

  protected getWorkflowName(): string {
    return this.artifacts.workflowName || '';
  }
}