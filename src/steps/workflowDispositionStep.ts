import { derivingStockMarker, FilePaths, ModulePaths } from "../constants";
import { Prompt } from "../types";
import { constructRecordType, convertPascalCaseToSnakeCase, findIndexOfXAfterY, lowerFirstLetter, migrationFileAlreadyCreated, pascalCaseToReadable, runMigrationCommand, tab, trimStringArr } from "../utils";
import BaseStep from "./baseStep";
import fs from 'fs';
import workflowDispositionTemplate from '../templates/dispositionTemplate'
import workflowDispositionVersionTemplate from '../templates/dispositionVersionTemplate'

export default class WorkflowDispositionStep extends BaseStep {
  dispositionDataFileContent: string = '';
  promptOne: Prompt = {
    id: 'workflow-disposition',
    message: "Would you like to create the disposition data for your vulcan workflow? (yes/no)",
    type: "select",
    initial: 1,
    choices: [
      { title: "No", value: 'n' },
      { title: "Yes", value: 'y' },
    ],
    handler: async () => await this.stepHandlers()
  }

  prompts: Prompt[] = [this.promptOne];

  async stepHandlers() {
    if (this.promptOne.answer === 'n') return this.logger().skipDispositionCreation();

    this.registerWorkflowDisposition();
    this.createWorkflowDispositionModule();
    this.exportWorkflowDispositionModule();
    this.createDispositionVersionModule();
    this.createMigrationFile();
    this.logger().dispositionDataRegistered();
  }

  storeArtifacts(): void {}

  // All the methods below are private and used internally within this step.
  private registerWorkflowDisposition() {
    this.dispositionDataFileContent = fs.readFileSync(FilePaths.DispositionDataPath, 'utf-8');
    if (this.dispositionDataFileContent.includes(this.dispositionDataTypeAndValue)) return
    const contentArr = this.dispositionDataFileContent.split('\n')
    const targetIndex = findIndexOfXAfterY(contentArr, derivingStockMarker, 'data UnifiedQueueDispositionData');
    
    if (targetIndex === -1) {
      throw new Error(`Could not properly parse the disposition data file: ${FilePaths.DispositionDataPath}`);
    }

    contentArr.splice(targetIndex, 0, `${tab(1)}| ${this.dispositionDataTypeAndValue}`);
    fs.writeFileSync(FilePaths.DispositionDataPath, contentArr.join('\n'));
  }

  private createWorkflowDispositionModule() {
    const fileName = FilePaths.DispositionDataDir + this.workflowName + 'Disposition.hs';
    if (this.fileExists(fileName)) return;

    const fileContent = workflowDispositionTemplate
      .replaceAll('{{workflow_name}}', this.workflowName)
      .replaceAll('{{readble_workflow_name}}', this.readableWorkflowName)
      .replaceAll('{{disposition_goes_here}}', this.defineDispositionV1DataType())

    fs.writeFileSync(fileName, fileContent, 'utf-8');
  }

  private defineDispositionV1DataType(): string {
    return constructRecordType({
      name: this.v1DataConstructor,
      deriving: ['Show', 'Eq'],
      fields: this.artifacts.reasonOptionsToBeDefined?.map(o => ({
        name: lowerFirstLetter(o),
        type: o,
        comment: pascalCaseToReadable(o)
      })) || []
    })
  }

  private exportWorkflowDispositionModule() {
    const fileContent = fs.readFileSync(FilePaths.AllDispositionDataPath, 'utf-8');
    const importLine = `import ${ModulePaths.Disposition}.${this.dispositionDataValue}`

    if (fileContent.includes(importLine)) return;

    const fileArr = trimStringArr(fileContent.split('\n'));
    fileArr.push(importLine);

    const targetIndex = findIndexOfXAfterY(fileArr, ')', '(');
    if (targetIndex === -1) {
      throw new Error(`could not properly parse the disposition data file: ${FilePaths.AllDispositionDataPath}`);
    }

    fileArr.splice(targetIndex, 0, `${tab(2)}${this.dispositionDataValue},`);
    fs.writeFileSync(FilePaths.AllDispositionDataPath, fileArr.join('\n'), 'utf-8');
  }

  private createDispositionVersionModule() {
    const fileName = FilePaths.DispositionVersionDir + this.workflowName + 'DispositionVersion.hs'
    if (this.fileExists(fileName)) return;

    const fileContent = workflowDispositionVersionTemplate
      .replaceAll('{{workflow_name}}', this.workflowName)
      .replaceAll('{{readable_workflow_name}}', this.readableWorkflowName)
    fs.writeFileSync(fileName, fileContent, 'utf-8');
  }

  private fileExists(filePath: string): boolean {
    return fs.existsSync(filePath) && !!fs.readFileSync(filePath, 'utf-8')?.trim();
  }

  private createMigrationFile() {
    const migrationName = `add_${convertPascalCaseToSnakeCase(this.workflowName)}_disposition_version_enums`;
    if (migrationFileAlreadyCreated(migrationName)) return;

    const {migrationSqlFilePath} = runMigrationCommand(migrationName);
    const migrationCommand = `ALTER TYPE "unified_queue_disposition_version" add VALUE 'UQ${this.workflowName}${this.workflowName}VersionV1';`

    if (!migrationSqlFilePath) {
      throw new Error(`Migration SQL file path not found for migration: ${migrationName}`);
    }

    fs.writeFileSync(migrationSqlFilePath, migrationCommand, 'utf-8');
  }

  private logger() {
    return {
      skipDispositionCreation: () => console.log(tab(2), "🚀 Skipping workflow disposition creation."),
      dispositionDataRegistered: () => console.log(tab(2), `🚀 Disposition step has been completed.`),
    }
  }

  private get dispositionDataValue() {
    return `${this.workflowName}Disposition`
  }

  private get dispositionDataConstructor() {
    return `UnifiedQueue${this.dispositionDataValue}`;
  }

  private get dispositionDataTypeAndValue() {
    return `${this.dispositionDataConstructor} ${this.dispositionDataValue}`;
  }

  private get v1DataConstructor() {
    return `${this.workflowName}DispositionV1Data`;
  }
}