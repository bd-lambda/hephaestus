import { PromptObject } from "prompts";

export type Artifacts = {
  workflowName?: string
  unifiedQueueSubsystemName?: string
  nativeItemKindDataTypeName?: string
  nativeItemKinds?: string[]
  reasonKindsModuleName?: string
  reasonKindsData?: Record<string, string>;
  reasonOptions?: Record<string, {name: string, comment: string}[]>;
}

export type Prompt = {
  id: string;
  message: string;
  type: PromptObject['type']; // Type of the prompt, e.g., 'text', 'select', etc.
  handler?: () => void; // Optional handler function for custom processing
  answer?: string; // Optional field to store the answer
  recursive?: boolean; // Optional field to indicate if the prompt is recursive
  required?: boolean
}

export type Outcome<T> = (data: string) => Promise<T>;

export default interface StepInterface {
  execute(): Promise<Artifacts>; // run command to execute the step
  prompts: Prompt[]; // Prompts to be displayed to the user
  processPrompt: (prompt: Prompt) => void; // Processes a single prompt. This would be used by the execute method to handle user input.
  artifacts: Artifacts // Artifacts to be stored after the step execution
  storeArtifacts: () => void; // Method to store artifacts after the step execution
}