import StepInterface, { Artifacts, Prompt } from "./stepInterface";
import prompts from 'prompts';
import fs from 'fs';
import { addVariantToHaskellDataType, capitalize } from "../utils";
import { FilePaths } from "../constants";
import BaseStep from "./baseStep";

export default class NativeItemKindsStep extends BaseStep implements StepInterface {
  promptOne: Prompt = {
    id: 'native-item-kinds',
    message: "What are the native item kinds for your vulcan workflow? (comma separated)",
    type: "text",
    handler: () => this.stepHandlers(),
    recursive: true
  };

  prompts = [this.promptOne];

  private stepHandlers() {
    this.createNativeItemKinds()
  }

  private createNativeItemKinds() {
    const nativeItemKindsData = this.promptOne.answer?.split("|||")
    if (!nativeItemKindsData || nativeItemKindsData.length === 0) {
      throw new Error("No native item kinds provided.");
    }
    const nativeItemKindsString = this.constructNativeItemKindsString(nativeItemKindsData);
    const fileContent = fs.readFileSync(FilePaths.NativeItemKindsPath, 'utf-8');
  }

  private constructNativeItemKindsString(nativeItemKindsData: string[]): string {
    return ''
  }
}