import StepInterface, { Artifacts, Prompt, TPromptIndex } from "../types";
import prompts, { PromptObject } from 'prompts';

export default abstract class BaseStep implements StepInterface {
  artifacts: Artifacts = {};

  constructor(artifacts?: Artifacts) {
    this.artifacts = artifacts || {};
  }

  async execute() {
    await this.processPrompt(this.promptOne);
    await this.promptOne.handler?.();
    this.storeArtifacts();
    return this.artifacts
  }

  private parsePrompt(prompt: TPromptIndex): PromptObject | PromptObject[] {
    const allPrompts = prompt.prompts;
    const toPromptObject = (p: Prompt): PromptObject => ({
      type: p.type,
      name: p.id,
      message: p.message,
      initial: p.initial,
      choices: p.choices,
      active: p.active,
      inactive: p.inactive,
      validate: p.validate
    })
    
    return Array.isArray(allPrompts) ? allPrompts.map(toPromptObject) : toPromptObject(allPrompts);
  }

  async processPrompt(prompt: TPromptIndex, firstAttempt=true) {
    const parsedPrompts = this.parsePrompt(prompt);
    const isList = Array.isArray(parsedPrompts);

    if (!firstAttempt && prompt.recursive) {
      if (isList) { 
        parsedPrompts[0].message = parsedPrompts[0].message + " - press 'q' to finish";
      } else {
        parsedPrompts.message = parsedPrompts.message + " - press 'q' to finish";
      }
    }

    const response = await prompts(parsedPrompts) 
    
    if (Object.values(response).some(value => value === 'q')) return

    if (prompt.recursive === true) {
      prompt.answer = (prompt.answer || []) as Array<Record<string, string>>;
      prompt.answer.push(response);
    } else {
      prompt.answer = response as Record<string, string>;
    }

    if (prompt.recursive) await this.processPrompt(prompt, false)
  }

  protected get workflowName(): string {
    return this.artifacts.workflowName || '';
  }

  protected get readableWorkflowName(): string {
    return this.workflowName.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  abstract storeArtifacts(): void;

  abstract stepHandlers(): void;

  abstract promptOne: TPromptIndex;
}