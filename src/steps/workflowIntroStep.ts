import { Prompt } from "./stepInterface";
import fs from 'fs';
import { addVariantToHaskellDataType, capitalize } from "../utils";
import { FilePaths } from "../constants";
import BaseStep from "./baseStep";

export default class WorkflowIntroductionStep extends BaseStep {
  promptOne: Prompt = {
    id: 'workflow-name',
    message: "What is the name of your vulcan workflow?",
    type: "text",
    handler: () => this.stepHandlers()
  }

  prompts = [this.promptOne];

  private stepHandlers() {
    this.workflowNameRecieved()
    this.registerUnifiedQueueSubsystem();
  }

  private workflowNameRecieved() {
    this.createVulcanAdpaterInstanceFile()
    this.artifacts['workflowName'] = this.workflowName();
    this.logger().adapterFileCreated()
  }

  private registerUnifiedQueueSubsystem() {
    const fileContent = fs.readFileSync(FilePaths.VulcanAdapterClass, 'utf-8'),
          subsystemName = this.subsystemName();

    if (!fileContent.includes(subsystemName)) {
      const updatedContent = addVariantToHaskellDataType(fileContent, 'UnifiedQueueSubsystem', subsystemName);
      fs.writeFileSync(FilePaths.VulcanAdapterClass, updatedContent);
      this.artifacts['unifiedQueueSubsystemName'] = subsystemName;
    }

    this.logger().subsystemAdded()
  }

  private logger() {
    return {
      adapterFileCreated: () => console.log("🚀 Adpater instance file created at: ", FilePaths.VulcanAdapterInstance),
      subsystemAdded: () => console.log(`🚀 Updated UnifiedQueueSubsystem with new subsystem: UnifiedQueue${this.workflowName()}Subsystem in file ${FilePaths.VulcanAdapterClass}`)
    }
  }

  private subsystemName() {
    return `UnifiedQueue${this.workflowName()}Subsystem`;
  }

  private workflowName () {
    if (!this.promptOne.answer) {
      throw new Error("Workflow name has not been set.");
    }
    return capitalize(this.promptOne.answer);
  }

  private createVulcanAdpaterInstanceFile() {
    fs.writeFileSync(this.vulcanInstanceFilePath(), '', )
  }

  private vulcanInstanceFilePath() {
    return `${FilePaths.VulcanAdapterInstance}${this.workflowName()}.hs`
  }
}