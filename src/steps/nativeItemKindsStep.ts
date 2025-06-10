import StepInterface, { Prompt } from "./stepInterface";
import fs from 'fs';
import { addStringArrayAfterString, capitalize, findIndexOfXAfterY, tab } from "../utils";
import { FilePaths, NativeItemKindJSONMarker, NativeItemKindsSuffix, NativeItemKindsTargetMarker } from "../constants";
import BaseStep from "./baseStep";

export default class NativeItemKindsStep extends BaseStep implements StepInterface {
  private updatedContent: string[] = [];
  private fileContent: string = ''

  promptOne: Prompt = {
    id: 'native-item-kinds',
    message: "Native item kinds for your vulcan workflow? (format: name - description. enter 'q' to finish)",
    type: "text",
    handler: () => this.stepHandlers(),
    recursive: true
  };

  prompts = [this.promptOne];

  private stepHandlers() {
    this.loadFileContent()
    this.createNativeItemKinds()
    this.generateJSONAndTypescriptForNativeItemKinds();
    this.writeUpdatedContentToFile();
    this.logger().nativeItemKindsAdded();
  }

  private generateJSONAndTypescriptForNativeItemKinds() {
    if (this.JSONAndTypescriptAlreadyGenerated()) return;

    const targetIndex = findIndexOfXAfterY(this.updatedContent, "]", NativeItemKindJSONMarker)
    if (targetIndex === -1) throw new Error(`Target marker "${NativeItemKindJSONMarker}" not found in file.`);
    this.updatedContent.splice(targetIndex, 0, `${tab(1)}, ''${this.getDataTypeName()}`);
  }

  private writeUpdatedContentToFile() {
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

  private getDataTypeName(): string {
    return this.getWorkflowName() + NativeItemKindsSuffix;
  }

  private constructNativeItemKindsString(nativeItemKindsData: string[]): string[] {
    const stringArray = [`\ndata ${this.getDataTypeName()}`];
    let counter = 0;
    
    for (const kind of nativeItemKindsData) {
      const [name, description] = kind.split(' - ').map(part => capitalize(part.trim()));
      if (!name || !description) {
        throw new Error(`Invalid format for native item kind: "${kind}". Expected format: "name - description".`);
      }
      stringArray.push(`${tab(1)}${counter === 0 ? '=' : '|'} -- | ${description}`);
      stringArray.push(`${tab(2)}${name}`);
      stringArray.push(`${tab(1)}deriving stock (Show, Eq, Ord)`)
      counter++;
    }
    
    return stringArray;
  }

  private nativeItemKindAlreadyCreated(): boolean {
    const searchString = `data ${this.getDataTypeName()}`;
    return this.fileContent.includes(searchString);
  }

  private loadFileContent() {
    this.fileContent = fs.readFileSync(FilePaths.NativeItemKindsPath, 'utf-8');
    this.updatedContent = this.fileContent.split('\n');
  }

  private JSONAndTypescriptAlreadyGenerated(): boolean {
    const searchString = `''${this.getDataTypeName()}`;
    return this.fileContent.includes(searchString);
  }

  private logger() {
    return {
      nativeItemKindsAdded: () => console.log(`🚀 Updated NativeItemKinds with new kinds in file ${FilePaths.NativeItemKindsPath}`)
    }
  }
}