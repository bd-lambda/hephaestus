import StepInterface, { Artifacts, Prompt } from "../types";
import prompts from 'prompts';

export default abstract class BaseStep implements StepInterface {
  prompts: Prompt[] = [];
  artifacts: Artifacts = {};

  constructor(artifacts?: Artifacts) {
    this.artifacts = artifacts || {};
  }

  async execute() {
    for (const prompt of this.prompts) {
      await this.processPrompt(prompt);
      await prompt.handler?.();
    }
    this.storeArtifacts();
    return this.artifacts
  }

  async processPrompt(prompt: Prompt) {
    const response = await prompts({
      type: prompt.type,
      name: prompt.id,
      message: prompt.message,
      initial: prompt.initial,
      choices: prompt.choices,
    })
    const answer = response[prompt.id]?.trim();

    if (answer === ':exit') return
    
    if (prompt.required && answer === undefined) {
      throw new Error(`No response provided for prompt: ${prompt.id}`);
    }

    if (answer === 'q') return

    prompt.answer = (!!prompt.answer ? "|||" : "") + answer as string;
    if (prompt.recursive) await this.processPrompt(prompt)
  }

  protected get workflowName(): string {
    return this.artifacts.workflowName || '';
  }

  protected get readableWorkflowName(): string {
    return this.workflowName.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  abstract storeArtifacts(): void;

  abstract stepHandlers(): void;
}