import { FilePaths, ItemDispositionMarker } from "../constants";
import { dispositionAdapter, matchFunction, runWithAdapterLine } from "../templates/utilsTemplate";
import { TPromptIndex } from "../types";
import { addNullaryTypeToSumType, convertPascalCaseToSnakeCase, fetchRiskWorkflow, fetchSlackChannels, findIndexOfXAfterY, runMigrationCommand, tab } from "../utils";
import BaseStep from "./baseStep";
import fs from 'fs';
import workflowInstanceTemplate from '../templates/workflowInstanceTemplate';
import prompts from "prompts";

export default class WorkflowInstantiationStep extends BaseStep {
  workflowKindFileContent: string = '';
  updatedWFKFileContent: string = '';
  outcomes: Array<{ outcome: string, description: string, isPending: boolean, reactionable: boolean }> = [];


  promptOne: TPromptIndex = {
    prompts: [
      {
        id: 'permission-kind',
        message: 'select a permission kind for this workflow',
        type: 'select',
        choices: fetchRiskWorkflow().map(w => ({title: w, value: w})),
        initial: 0,
      },
      {
        id: 'slack-channel',
        message: 'select a slack channel for this workflow (used for notifications)',
        type: 'select',
        choices: fetchSlackChannels().map(channel => ({title: channel, value: channel})),
        initial: 0,
      }
    ],
    recursive: false,
    handler: async () => await this.stepHandlers()
  }
  
  storeArtifacts() {}

  async stepHandlers() {
    await this.registerWorkflowKind()
    await this.registerPermissions()
    await this.registerSlackChannel();
    await this.updateWorkflowKindFile();

    await this.updateUtilsFile();

    await this.createOutcomesIfNecessary();
    await this.updateOutcomeActionHelpersFile();
    await this.updateOutcomeActionFile();
    await this.createOutcomeMigrationsIfNecessary();
    await this.createWorkflowInstanceFile();
    this.logger().workflowInstantiated();
  }

  private async registerWorkflowKind() {
    this.workflowKindFileContent = fs.readFileSync(FilePaths.UQWorkflowKindPath, 'utf-8');
    this.updatedWFKFileContent = addNullaryTypeToSumType(this.workflowKindFileContent.split('\n'), 'UnifiedQueueWorkflowKind', this.workflowKind).join('\n');
  }

  private async registerPermissions() {
    const content = this.updatedWFKFileContent.split('\n');
    const targetIndex = findIndexOfXAfterY(content, '', 'permissionForWorkflowKind =')
    if (targetIndex === -1) throw new Error(`Could not find the target index for permissionForWorkflowKind in ${FilePaths.UQWorkflowKindPath}`);
    content.splice(targetIndex, 0, `${tab(1)}${this.workflowKind}->\n${tab(2)+this.permissionKind}`);
    this.updatedWFKFileContent = content.join('\n');
  } 

  private registerSlackChannel() {
    const content = this.updatedWFKFileContent.split('\n');
    const targetIndex = findIndexOfXAfterY(content, '', 'alertChannelForWorkflowKind =')
    if (targetIndex === -1) throw new Error(`Could not find the target index for alertChannelForWorkflowKind in ${FilePaths.UQWorkflowKindPath}`);
    content.splice(targetIndex, 0, `${tab(1)}${this.workflowKind} ->\n${tab(2)}${this.slackName}`);
    this.updatedWFKFileContent = content.join('\n');
  }

  private async updateWorkflowKindFile() {
    if (this.workflowKindFileContent === this.updatedWFKFileContent) return;
    fs.writeFileSync(FilePaths.UQWorkflowKindPath, this.updatedWFKFileContent, 'utf-8');
  }

  private async updateUtilsFile() {
    const fileContent = fs.readFileSync(FilePaths.UQUtilsFile, 'utf-8').split('\n');
    const targetIndex = findIndexOfXAfterY(fileContent, 'where', ItemDispositionMarker);
    if (targetIndex === -1) throw new Error(`Could not properly parse ${FilePaths.UQUtilsFile} file`);
    fileContent.splice(targetIndex, 0, `${tab(1)}${dispositionAdapter.replaceAll('{{workflow_name}}', this.workflowName)}`);

    const matchFunctionText = matchFunction.replaceAll('{{workflow_name}}', this.workflowName) + '\n'
    const targetIndex2 = findIndexOfXAfterY(fileContent, 'where', ItemDispositionMarker);
    if (targetIndex2 === -1) throw new Error(`Could not properly parse ${FilePaths.UQUtilsFile} file`);
    fileContent.splice(targetIndex2 + 1, 0, `${matchFunctionText}`);

    const runWithAdapterText = runWithAdapterLine.replaceAll('{{workflow_name}}', this.workflowName)
    const targetIndex3 = findIndexOfXAfterY(fileContent, '', 'runWithAdapter itemKind action =');
    if (targetIndex3 === -1) throw new Error(`Could not properly parse ${FilePaths.UQUtilsFile} file`);
    fileContent.splice(targetIndex3, 0, `${tab(1)}${runWithAdapterText}`);

    fs.writeFileSync(FilePaths.UQUtilsFile, fileContent.join('\n'), 'utf-8');
  }

  private async createOutcomesIfNecessary() {
    await this.runPromptForOutcomes()
    let outcomesFileContent = fs.readFileSync(FilePaths.UQOutcomeKindPath, 'utf-8').split('\n');

    this.outcomes.forEach(outcome => {
      outcomesFileContent = addNullaryTypeToSumType(outcomesFileContent, 'UnifiedQueueOutcomeKind', outcome.outcome, outcome.description);
      
      const targetIndex = findIndexOfXAfterY(outcomesFileContent, '', 'isPendingOutcome = ');
      if (targetIndex === -1) throw new Error(`Could not find the target index for isPendingOutcome in ${FilePaths.UQOutcomeKindPath}`);
      outcomesFileContent.splice(targetIndex, 0, `${tab(1)}${outcome.outcome} -> ${outcome.isPending ? 'True' : 'False'}`);

      const targetIndex2 = findIndexOfXAfterY(outcomesFileContent, '', 'outcomeCanBeReActioned =');
      if (targetIndex2 === -1) throw new Error(`Could not find the target index for outcomeCanBeReActioned in ${FilePaths.UQOutcomeKindPath}`);
      outcomesFileContent.splice(targetIndex2, 0, `${tab(1)}${outcome.outcome} -> ${outcome.reactionable ? 'True' : 'False'}`);
    })

    fs.writeFileSync(FilePaths.UQOutcomeKindPath, outcomesFileContent.join('\n'), 'utf-8');
  }

  private async updateOutcomeActionHelpersFile() {
    if (this.outcomes.length === 0) return;
    let fileContent = fs.readFileSync(FilePaths.OutcomeActionHelpersPath, 'utf-8').split('\n');

    this.outcomes.forEach(outcome => {
      const targetIndex = findIndexOfXAfterY(fileContent, '', 'unifiedQueueOutcomeToRiskAlertDecision = ');
      if (targetIndex === -1) throw new Error(`Could not find the target index for unifiedQueueOutcomeToRiskAlertDecision in ${FilePaths.OutcomeActionHelpersPath}`);
      fileContent.splice(targetIndex, 0, `${tab(1)}${outcome.outcome} -> RaaOther`);
    })

    fs.writeFileSync(FilePaths.OutcomeActionHelpersPath, fileContent.join('\n'), 'utf-8');
  }

  private async updateOutcomeActionFile() {
    if (this.outcomes.length === 0) return;
    let fileContent = fs.readFileSync(FilePaths.OutcomeActionsFilePath, 'utf-8').split('\n');

    this.outcomes.forEach(outcome => {
      const targetIndex = findIndexOfXAfterY(fileContent, 'where', 'performOutcomeSideEffect presigner item ');
      if (targetIndex === -1) throw new Error(`Could not find the target index for unifiedQueueOutcomeToRiskAlertAction in ${FilePaths.OutcomeActionsFilePath}`);
      fileContent.splice(targetIndex, 0, `${tab(1)}${outcome.outcome} -> doNothing`);
    })

    fs.writeFileSync(FilePaths.OutcomeActionsFilePath, fileContent.join('\n'), 'utf-8');
  }

  private async createOutcomeMigrationsIfNecessary() {
    if (this.outcomes.length === 0) return;
    const {migrationSqlFilePath} = runMigrationCommand(`add_${convertPascalCaseToSnakeCase(this.workflowName)}_outcomes`);
    if (!migrationSqlFilePath) {
      throw new Error(`Migration SQL file path not found for workflow: ${this.workflowName}`);
    }
    const fileContent = fs.readFileSync(migrationSqlFilePath, 'utf-8').split('\n');
    this.outcomes.forEach(outcome => {
      const command = `ALTER TYPE "unified_queue_outcome_kind" ADD VALUE '${outcome.outcome}';`;
      fileContent.push(command);
    });
    fs.writeFileSync(migrationSqlFilePath, fileContent.join('\n'), 'utf-8');
  }

  private async createWorkflowInstanceFile() {
    const filePath = `${FilePaths.VulcanAdapterInstance}${this.workflowName}.hs`;
    if (fs.existsSync(filePath)) return;
    const fileContent = workflowInstanceTemplate.replaceAll('{{workflow_name}}', this.workflowName)
    fs.writeFileSync(filePath, fileContent, 'utf-8');
  }

  private logger() {
    return {
      workflowInstantiated: () => {
        console.log(`🚀 Workflow successfully instantiated.`);
      }
    }
  }

  private async runPromptForOutcomes() {
    const response = await prompts([
      {
        type: 'text',
        name: 'outcome',
        message: `Please provide the outcome for the workflow "${this.workflowName}" (or press enter to skip):`,
      },
      {
        type: prev => !prev?.trim() ? null : 'text',
        name: 'outcome-description',
        message: 'Enter a description for the outcome (used for haddock comments):',
        validate: v => v.trim() ? true : 'Description cannot be empty.',
      },
      {
        type: prev => !prev?.trim() ? null : 'select',
        name: 'is-pending',
        message: 'Does this outcome represent a pending state?',
        choices: [
          { title: 'Yes', value: 'y' },
          { title: 'No', value: 'n' }
        ],
        initial: 1,
      },
      {
        type: prev => !prev?.trim() ? null : 'select',
        name: 'can-be-reactioned',
        message: 'Can this outcome be re-actioned?',
        choices: [
          { title: 'Yes', value: 'y' },
          { title: 'No', value: 'n' }
        ],
        initial: 1,
      },
      {
        type: prev => !prev?.trim() ? null : 'select',
        name: 'add-another',
        message: 'Do you want to add another outcome?',
        choices: [
          { title: 'Yes', value: 'y' },
          { title: 'No', value: 'n' }
        ],
        initial: 1,
      }
    ])

    if (!response.outcome?.trim()) return;
    
    this.outcomes.push({
      outcome: response.outcome.trim(),
      description: response['outcome-description']?.trim() || '',
      isPending: response['is-pending'] === 'y',
      reactionable: response['can-be-reactioned'] === 'n'
    });

    if (response['add-another'] === 'y') await this.runPromptForOutcomes();
  }

  private get workflowKind(): string {
    return `${this.workflowName}Workflow`
  }

  private get permissionKind(): string {
    if (this.promptOne.recursive === false) return this.promptOne.answer?.['permission-kind']?.trim() || '';
    return ''
  }

  private get slackName(): string {
    if (this.promptOne.recursive === false) return this.promptOne.answer?.['slack-channel']?.trim() || '';
    return '';
  }
}
