import { Prompt, TPromptIndex } from "../types";
import prompts from "prompts";
import fs from 'fs';
import BaseStep from "./baseStep";
import { derivingStockMarker, DetailsDataDefinitionMarker, FilePaths, TSLineMarker } from "../constants";
import { addImport, constructRecordType, findIndexOfXAfterY, lastIndexOf, tab } from "../utils";

export default class DetailsDataStep extends BaseStep {
  fileContent: string = ''
  fileContentArr: string[] = [];
  detailsDataField: Array<{ name: string, type: string, description: string, importPath?: string }> = [];
  promptOne: TPromptIndex = {
    prompts: {
      id: 'details-data',
      message: "Do you want to add details data to your workflow? (yes/no)",
      type: "select",
      initial: 1,
      choices: [
        { title: "No", value: 'n' },
        { title: "Yes", value: 'y' },
      ],
    },
    recursive: false,
    handler: async () => await this.stepHandlers()
  }

  storeArtifacts(): void {}

  private get promptAnswer(): string | undefined {
    if (this.promptOne.recursive === false) return this.promptOne.answer?.['details-data'].trim();
  }

  async stepHandlers() {
    if (this.promptAnswer === 'n') return this.logger().skipDetailsDataCreation();

    await this.createDetailsDataModule();
    this.logger().detailsDataModuleCreated();
  }
  
  private async createDetailsDataModule() {
    await this.promptUsersForDetailsDataAndType();
    this.loadFileContent();
    this.exportDetailsDataModule();
    this.addModuleToDetailsDataDefinition()
    this.addDataTypeImports();
    this.addDetailsModuleDataType();
    this.addGenerateTsLine();
    this.writeUpdatedContentToFile();
  }

  private loadFileContent() {
    this.fileContent = fs.readFileSync(FilePaths.DetailsDataPath, 'utf-8');
    this.fileContentArr = this.fileContent.split('\n');
  }

  private exportDetailsDataModule() {
    const targetIndex = findIndexOfXAfterY(this.fileContentArr, ')', '(')
    if (targetIndex === -1) {
      throw new Error(`Could not correct parse file: ${FilePaths.DetailsDataPath}`);
    }

    this.fileContentArr.splice(targetIndex, 0, `${tab(2) + this.dataTypeName} (..),`);
  }

  private addModuleToDetailsDataDefinition() {
    const targetIndex = findIndexOfXAfterY(this.fileContentArr, derivingStockMarker, DetailsDataDefinitionMarker);
    if (targetIndex === -1) {
      throw new Error(`Could not find target marker "${derivingStockMarker}" in file: ${FilePaths.DetailsDataPath}`);
    }

    this.fileContentArr.splice(targetIndex, 0, `${tab(1)}| ${this.dataTypeName.replace('Data', '')} ${this.dataTypeName}`);
  }

  private addDetailsModuleDataType() {
    let targetIndex = findIndexOfXAfterY(this.fileContentArr, TSLineMarker, derivingStockMarker);
    targetIndex = targetIndex === -1 ? this.fileContentArr.length : targetIndex;
    this.fileContentArr.splice(targetIndex, 0, this.generateDetailsDataModule())
  }

  private addGenerateTsLine() {
    const targetIndex = lastIndexOf(this.fileContentArr, v => v.includes(TSLineMarker))
    this.fileContentArr.splice(targetIndex + 1, 0, this.tsGenerationLine);
  }

  private writeUpdatedContentToFile() {
    const updatedFileContent = this.fileContentArr.join('\n');
    if (updatedFileContent === this.fileContent) return; 
    fs.writeFileSync(FilePaths.DetailsDataPath, updatedFileContent);
  }

  private async promptUsersForDetailsDataAndType() {
    const responses = await prompts([
      {
        type: 'text',
        name: 'details-data-field-name',
        message: `Please provide a field name for the details data for ${this.workflowName} workflow (i.e "detailsData")`,
        validate: value => value.trim() ? true : 'Details data cannot be empty.'
      },
      {
        type: 'text',
        name: 'details-data-field-type',
        message: `Please provide the data type for the field (i.e "Text" or "[OrganizationID]")`,
        validate: value => value.trim() ? true : 'Details data type cannot be empty.'
      },
      {
        type: 'text',
        name: 'details-data-field-description',
        message: `Please provide a description for the field (this is used for required haddock comments)`,
        validate: value => value.trim() ? true : 'Details data field description cannot be empty.'
      },
      {
        type: 'text',
        name: 'details-field-type-path',
        message: `Please provide the import path for the data type (i.e for OrganizationID it would be "PersistentModels.Organization"), leave blank if not applicable.`,
      },
      {
        type: 'select',
        name: 'add-another',
        message: 'Do you want to add another field to the details data?',
        choices: [
          { title: 'No', value: 'n' },
          { title: 'Yes', value: 'y' },
        ],
        initial: 1,
      }
    ])
    
    this.detailsDataField.push({
      name: responses['details-data-field-name'].trim(),
      type: responses['details-data-field-type'].trim(),
      description: responses['details-data-field-description'].trim(),
      importPath: responses['details-field-type-path'].trim() || undefined
    })

    if (responses['add-another'] === 'y') {
      await this.promptUsersForDetailsDataAndType();
    }
  }

  private generateDetailsDataModule() {
    if (this.detailsDataField.length === 0) {
      throw new Error("No details data fields provided.");
    }

    return constructRecordType({
      name: this.dataTypeName,
      comment: `Details data for ${this.readableWorkflowName}`,
      deriving: ['Show', 'Eq'],
      fields: this.detailsDataField.map(({name, type, description}) => ({name, type, description})),
    })
  }

  private addDataTypeImports() {
    const allImportPaths = this.detailsDataField.map(field => field.importPath).filter(i => i !== undefined)
    allImportPaths.forEach(importPath => addImport(this.fileContentArr, importPath))
  }

  private get dataTypeName() {
    return `UnifiedQueue${this.workflowName}DetailsData`;
  }

  private get tsGenerationLine() {
    return `$(deriveJSONAndTypeScript mercuryDefaultOptions {tagSingleConstructors = True} ''UnifiedQueue${this.workflowName}DetailsData)`
  }

  private logger() {
    return {
      skipDetailsDataCreation: () => console.log("🚀 Skipping details data creation."),
      detailsDataModuleCreated: () => console.log("🚀 Details data module created successfully.")
    }
  }
}