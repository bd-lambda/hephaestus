import { PromptObject } from "prompts";

export type Artifacts = {
    workflowName?: string
    unifiedQueueSubsystemName?: string
}

export type Prompt = {
    id: string;
    message: string;
    type: PromptObject['type']; // Type of the prompt, e.g., 'text', 'select', etc.
    handler?: () => void; // Optional handler function for custom processing
    answer?: string; // Optional field to store the answer
    recursive?: boolean; // Optional field to indicate if the prompt is recursive
}

export type Outcome<T> = (data: string) => Promise<T>;

export default interface StepInterface {
    execute(): Promise<Artifacts>;
    prompts: Prompt[]; 
    processPrompt: (prompt: Prompt) => void;
    artifacts: Artifacts
}