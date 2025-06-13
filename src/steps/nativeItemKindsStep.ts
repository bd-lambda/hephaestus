import { Prompt } from "../types";
import fs from 'fs';
import { addStringArrayAfterString, capitalize, constructSumType, convertPascalCaseToSnakeCase, findIndexOfXAfterY, migrationFileAlreadyCreated, runMigrationCommand, tab } from "../utils";
import { FilePaths, NativeItemKindJSONMarker, NativeItemKindsAlterCommand, NativeItemKindsSuffix, NativeItemKindsTargetMarker } from "../constants";
import BaseStep from "./baseStep";

export default class NativeItemKindsStep extends BaseStep {
  private updatedContent: string[] = [];
  private fileContent: string = ''

  promptOne: Prompt = {
    id: 'native-item-kinds',
    message: "Native item kinds for your vulcan workflow? (format: name - description. enter 'q' to finish)",
    type: "text",
    handler: async () => await this.stepHandlers(),
    recursive: true
  };

  prompts = [this.promptOne];

  async stepHandlers() {
    this.loadFileContent()
    this.createNativeItemKinds()
    this.generateJSONAndTypescriptForNativeItemKinds();
    this.writeUpdatedContentToFile();
    this.createMigrationFile();
    this.logger().nativeItemKindsAdded();
  }

  storeArtifacts() {
    this.artifacts.nativeItemKindDataTypeName = this.dataTypeName;
    this.artifacts.nativeItemKinds = this.nativeItemKinds()
  }

  // All the methods below are private and used internally within this step.
  private generateJSONAndTypescriptForNativeItemKinds() {
    if (this.JSONAndTypescriptAlreadyGenerated()) return;

    const targetIndex = findIndexOfXAfterY(this.updatedContent, "]", NativeItemKindJSONMarker)
    if (targetIndex === -1) throw new Error(`Target marker "${NativeItemKindJSONMarker}" not found in file.`);
    this.updatedContent.splice(targetIndex, 0, `${tab(1)}, ''${this.dataTypeName}`);
  }

  private writeUpdatedContentToFile() {
    const updatedFileContent = this.updatedContent.join('\n');
    if (updatedFileContent === this.fileContent) return; 
    fs.writeFileSync(FilePaths.NativeItemKindsPath, this.updatedContent.join('\n'));
  }

  private createNativeItemKinds() {
    const nativeItemKindsData = this.promptOne.answer?.split("|||")
    
    if (!nativeItemKindsData || nativeItemKindsData.length === 0) {
      throw new Error("No native item kinds provided.");
    }

    if (this.nativeItemKindAlreadyCreated()) return

    const nativeItemKindsString = this.constructNativeItemKindsString(nativeItemKindsData);
    this.updatedContent = addStringArrayAfterString(this.fileContent, NativeItemKindsTargetMarker, nativeItemKindsString)
  }

  private get dataTypeName(): string {
    return this.workflowName + NativeItemKindsSuffix;
  }

  private constructNativeItemKindsString(nativeItemKindsData: string[]): string[] {
    return constructSumType({
      name: this.dataTypeName,
      deriving: ['Show', 'Eq', 'Ord'],
      fields: nativeItemKindsData.map(kind => {
        const [name, description] = kind.split(' - ').map(part => capitalize(part.trim()));
        if (!name || !description) {
          throw new Error(`Invalid format for native item kind: "${kind}". Expected format: "name - description".`);
        }
        return {name, description}
      })
    }).split('\n')
  }

  private nativeItemKindAlreadyCreated(): boolean {
    const searchString = `data ${this.dataTypeName}`;
    return this.fileContent.includes(searchString);
  }

  private loadFileContent() {
    this.fileContent = fs.readFileSync(FilePaths.NativeItemKindsPath, 'utf-8');
    this.updatedContent = this.fileContent.split('\n');
  }

  private JSONAndTypescriptAlreadyGenerated(): boolean {
    const searchString = `''${this.dataTypeName}`;
    return this.fileContent.includes(searchString);
  }

  private nativeItemKinds() {
    return this.promptOne.answer?.split("|||").map(kind => {
      const [name, _] = kind.split(' - ').map(part => part.trim());
      return capitalize(name || '')
    }) || []
  }

  private get migrationFileName() {
    return `add_${convertPascalCaseToSnakeCase(this.workflowName)}_native_item_kind`;
  }

  private createMigrationFile() {
    if (this.isMigrationFileAlreadyCreated()) return;
    const {migrationSqlFilePath} = runMigrationCommand(this.migrationFileName)
    const fileContentArray = this.nativeItemKinds().map(kind => this.createMigrationCommand(kind))
    if (!migrationSqlFilePath) {
      throw new Error(`Migration SQL file path not found for migration: ${this.migrationFileName}`);
    }
    fs.writeFileSync(migrationSqlFilePath, fileContentArray.join('\n'), 'utf-8');
  }

  private createMigrationCommand(nativeItemKind: string)  {
    return NativeItemKindsAlterCommand.replaceAll('{{workflow_name}}', this.workflowName)
      .replaceAll('{{native_item_kind}}', nativeItemKind);
  }

  private isMigrationFileAlreadyCreated(): boolean {
    return migrationFileAlreadyCreated(this.migrationFileName)
  }

  private logger() {
    return {
      nativeItemKindsAdded: () => console.log(`${tab(2)}🚀 Updated NativeItemKinds with new kinds in file ${FilePaths.NativeItemKindsPath}`)
    }
  }
}