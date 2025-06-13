import { Prompt } from "../types";
import BaseStep from "./baseStep";

export default class GenerateTypescriptStep extends BaseStep {
  prompOne: Prompt = {
    id: 'generate-typescript',
    message: "Would you like to generate the typescript for your new workflow (yes/no)",
    type: "select",
    initial: 1,
    choices: [
      { title: "No", value: 'n' },
      { title: "Yes", value: 'y' },
    ],
    handler: async () => await this.stepHandlers()
  }

  prompts: Prompt[] = [this.prompOne];

  storeArtifacts(): void {}

  async stepHandlers() {
    if (this.prompOne.answer === 'n') return this.logger().skipTypescriptGeneration();

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