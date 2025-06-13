import { PromptObject } from "prompts";

export type Artifacts = {
  workflowName?: string
  unifiedQueueSubsystemName?: string
  nativeItemKindDataTypeName?: string
  nativeItemKinds?: string[]
  reasonKindsModuleName?: string
  reasonKindsData?: Record<string, string>;
  reasonOptions?: Record<string, {name: string, comment: string}[]>;
  reasonOptionsToBeDefined?: string[];
}

export type Prompt<T=string> = {
  id: string;
  message: string;
  type: PromptObject['type']; // Type of the prompt, e.g., 'text', 'select', etc.
  choices?: PromptObject["choices"]; 
  handler?: () => Promise<void>; // Optional handler function for custom processing
  answer?: T; // Optional field to store the answer
  recursive?: boolean; // Optional field to indicate if the prompt is recursive
  required?: boolean
  active?: PromptObject["active"]; 
  inactive?: PromptObject["inactive"];
  initial?: PromptObject["initial"]; // Initial value for the prompt
}

export type Outcome<T> = (data: string) => Promise<T>;

export default interface StepInterface<T=string> {
  execute(): Promise<Artifacts>; // run command to execute the step
  prompts: Prompt<T>[]; // Prompts to be displayed to the user
  processPrompt: (prompt: Prompt) => void; // Processes a single prompt. This would be used by the execute method to handle user input.
  artifacts: Artifacts // Artifacts to be stored after the step execution
  storeArtifacts: () => void; // Method to store artifacts after the step execution
}