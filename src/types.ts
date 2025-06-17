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

export type Prompt = {
  id: string;
  message: string;
  type: PromptObject['type']; // Type of the prompt, e.g., 'text', 'select', etc.
  choices?: PromptObject["choices"]; 
  required?: boolean
  active?: PromptObject["active"]; 
  validate?: PromptObject["validate"]; 
  inactive?: PromptObject["inactive"];
  initial?: PromptObject["initial"]; // Initial value for the prompt
}

export type Outcome<T> = (data: string) => Promise<T>;
export type PromptAnswer<T=string> = Record<string, T> | Array<Record<string, T>>;

export type TPromptIndex<T=string> = {
  prompts: Prompt | Prompt[]; // The main prompt or prompts to be displayed to the user,
  recursive: true;
  answer?: Array<Record<string, T>>; // The answer to the prompt, can be a string or a record of strings
  handler?: () => Promise<void>
} | {
  prompts: Prompt | Prompt[]; // The main prompt or prompts to be displayed to the user,
  recursive: false;
  answer?: Record<string, T>; // The answer to the prompt, can be a string or a record of strings
  handler?: () => Promise<void>
}

export default interface StepInterface<T=string> {
  execute(): Promise<Artifacts>; // run command to execute the step
  promptOne: TPromptIndex<T>
  processPrompt: (prompt: TPromptIndex, firstAttempt?:boolean) => void; // Processes a single prompt. This would be used by the execute method to handle user input.
  artifacts: Artifacts // Artifacts to be stored after the step execution
  storeArtifacts: () => void; // Method to store artifacts after the step execution
}