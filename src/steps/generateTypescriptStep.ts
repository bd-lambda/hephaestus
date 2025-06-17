import { Prompt, TPromptIndex } from "../types";
import BaseStep from "./baseStep";

export default class GenerateTypescriptStep extends BaseStep {
  promptOne: TPromptIndex = {
    prompts: {
      id: 'generate-typescript',
      message: "Would you like to generate the typescript for your new workflow (yes/no)",
      type: "select",
      initial: 1,
      choices: [
        { title: "No", value: 'n' },
        { title: "Yes", value: 'y' },
      ]
    },
    recursive: false,
    handler: async () => await this.stepHandlers()
  }

  storeArtifacts(): void {}

  private get promptAnswer(): string | undefined {
    if (this.promptOne.recursive === false) return this.promptOne.answer?.['generate-typescript'].trim();
  }

  async stepHandlers() {
    if (this.promptAnswer === 'n') return this.logger().skipTypescriptGeneration();

    this.generateTypescriptFile();
    this.logger().typescriptFileGenerated();
  }

  private generateTypescriptFile() {
    this.exportModulesToBeGenerated()
    this.runMakeCommandToGenerateTypescript();
    // implementation for generating typescript file
    // This is a placeholder for the actual typescript generation logic.
  }

  private runMakeCommandToGenerateTypescript() {}

  private exportModulesToBeGenerated() {
    // export all the modules that need to be generated to FilePaths.TypescriptModulesToBeGenerated
  }

  private logger() {
    return {
      skipTypescriptGeneration: () => console.log("🚀 Skipping typescript generation."),
      typescriptFileGenerated: () => console.log("🚀 Typescript file generated successfully.")
    }
  }
}