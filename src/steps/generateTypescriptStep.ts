import { TPromptIndex } from "../types";
import fs from 'fs';
import BaseStep from "./baseStep";
import { execSync } from "child_process";
import { FilePaths, ModulePaths } from "../constants";
import { addImport, insertXIntoYAfterZ, tab } from "../utils";

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
    await this.exportModulesToBeGenerated()
    if (this.promptAnswer === 'n') return this.logger().skipTypescriptGeneration();

    await this.runMakeCommandToGenerateTypescript();
    this.logger().typescriptFileGenerated();
  }

  private async runMakeCommandToGenerateTypescript() {
    execSync('make generate-my-web-types pathToFrontendRepo=../mercury-web')
  }

  private async exportModulesToBeGenerated() {
    const fileContent = fs.readFileSync(FilePaths.TSGenerationFilePath, 'utf-8').split('\n');
    const modulesToImport = [
      ModulePaths.Disposition + `.${this.workflowName}Disposition`,
      ModulePaths.DispositionVersion + `.${this.workflowName}DispositionVersion`,
      ModulePaths.ReasonKinds + `.${this.workflowName}Reason`,
    ]
    modulesToImport.forEach(module => addImport(fileContent, module))
    insertXIntoYAfterZ(fileContent, `${tab(1)}writeCore @${this.workflowName}ItemType`, '', '-- subsystem items')
    insertXIntoYAfterZ(fileContent, `${tab(1)}writeCore @${this.workflowName}Version`, '', '-- subsystem disposition versions')
    insertXIntoYAfterZ(fileContent, `${tab(1)}writeCore @${this.workflowName}Reason`, '', '-- subsystem item kind.')
    insertXIntoYAfterZ(fileContent, `${tab(1)}writeCore @${this.workflowName}Disposition`, '', '-- disposition api types')
    insertXIntoYAfterZ(fileContent, `${tab(1)}writeCore @${this.workflowName}DispositionV1Data`, '', '-- disposition api types')
    insertXIntoYAfterZ(fileContent, `${tab(1)}writeCore @UnifiedQueue${this.workflowName}DetailsData`, '', '-- details data')
    this.reasonOptions.forEach(o => insertXIntoYAfterZ(fileContent, `${tab(1)}writeCore @${o}`, '', '-- subsystem reason enums'))
    
    fs.writeFileSync(FilePaths.TSGenerationFilePath, fileContent.join('\n'));
  }

  private get reasonOptions(): string[] {
    return this.artifacts.reasonOptionsToBeDefined || [];
  }

  private logger() {
    return {
      skipTypescriptGeneration: () => console.log("🚀 Skipping typescript generation."),
      typescriptFileGenerated: () => console.log("🚀 Typescript file generated successfully.")
    }
  }
}