import { derivingStockMarker, FilePaths, ModulePaths } from "../constants";
import { TPromptIndex } from "../types";
import { addImport, addNullaryTypeToSumType, constructRecordType, convertPascalCaseToSnakeCase, findIndexOfXAfterY, insertXIntoYAfterZ, lowerFirstLetter, migrationFileAlreadyCreated, pascalCaseToReadable, runMigrationCommand, tab, trimStringArr } from "../utils";
import BaseStep from "./baseStep";
import fs from 'fs';
import workflowDispositionTemplate from '../templates/dispositionTemplate'
import workflowDispositionVersionTemplate from '../templates/dispositionVersionTemplate'

export default class WorkflowDispositionStep extends BaseStep {
  dispositionDataFileContent: string = '';
  promptOne: TPromptIndex = {
    prompts: {
      id: 'workflow-disposition',
      message: "Would you like to create the disposition data for your vulcan workflow? (yes/no)",
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

  async stepHandlers() {
    if (this.promptAnswer === 'n') return this.logger().skipDispositionCreation();

    this.registerWorkflowDisposition();
    this.createWorkflowDispositionModule();
    this.exportWorkflowDispositionModule();
    this.createDispositionVersionModule();
    this.createMigrationFile();
    this.updateUQDispositionVersionFile();
    this.logger().dispositionDataRegistered();
  }

  storeArtifacts(): void {}

  // All the methods below are private and used internally within this step.
  private get promptAnswer(): string | undefined {
    return this.promptOne.recursive === false ? this.promptOne.answer?.['workflow-disposition'].trim() : undefined;
  }

  private registerWorkflowDisposition() {
    this.dispositionDataFileContent = fs.readFileSync(FilePaths.DispositionDataPath, 'utf-8');
    if (this.dispositionDataFileContent.includes(this.dispositionDataTypeAndValue)) return
    const contentArr = this.dispositionDataFileContent.split('\n')

    insertXIntoYAfterZ(contentArr, `${tab(1)}| ${this.dispositionDataTypeAndValue}`, derivingStockMarker, 'data UnifiedQueueDispositionData')
    fs.writeFileSync(FilePaths.DispositionDataPath, contentArr.join('\n'));
  }

  private createWorkflowDispositionModule() {
    const fileName = FilePaths.DispositionDataDir + this.workflowName + 'Disposition.hs';
    if (this.fileExists(fileName)) return;

    const fileContent = workflowDispositionTemplate
      .replaceAll('{{workflow_name}}', this.workflowName)
      .replaceAll('{{readable_workflow_name}}', this.readableWorkflowName)
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

    insertXIntoYAfterZ(fileArr, `${tab(2)}${this.dispositionDataValue},`, ')', '(');
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

  private updateUQDispositionVersionFile() {
    const uqName = `UnifiedQueue${this.workflowName}Version ${this.workflowName}Version`
    const fileContent = fs.readFileSync(FilePaths.UQDispositionVersionPath, 'utf-8').split('\n');
    let updatedFileContent = addImport(
      fileContent, 
      ModulePaths.DispositionVersion + '.' + this.workflowName + 'DispositionVersion' + `(${this.workflowName}Version)`
    );
    updatedFileContent = addNullaryTypeToSumType(
      fileContent, 
      'UnifiedQueueDispositionVersion', 
      uqName,
      `Represents the different disposition versions for all ${this.readableWorkflowName} workflows.`
    )
    fs.writeFileSync(FilePaths.UQDispositionVersionPath, updatedFileContent.join('\n'), 'utf-8');
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