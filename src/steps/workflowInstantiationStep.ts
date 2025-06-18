import { FilePaths, ItemDispositionMarker } from "../constants";
import { dispositionAdapter, matchFunction, runWithAdapterLine } from "../templates/utilsTemplate";
import { TPromptIndex } from "../types";
import { addNullaryTypeToSumType, convertPascalCaseToSnakeCase, fetchRiskWorkflow, fetchSlackChannels, insertXIntoYAfterZ, runMigrationCommand, tab } from "../utils";
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

    
    await this.createOutcomesIfNecessary();
    await this.updateOutcomeActionHelpersFile();
    await this.updateOutcomeActionFile();
    await this.createOutcomeMigrationsIfNecessary();
    await this.createWorkflowInstanceFile();
    await this.updateUtilsFile();
    this.logger().workflowInstantiated();
  }

  private async registerWorkflowKind() {
    this.workflowKindFileContent = fs.readFileSync(FilePaths.UQWorkflowKindPath, 'utf-8');
    this.updatedWFKFileContent = addNullaryTypeToSumType(this.workflowKindFileContent.split('\n'), 'UnifiedQueueWorkflowKind', this.workflowKind).join('\n');
  }

  private async registerPermissions() {
    const content = this.updatedWFKFileContent.split('\n');
    insertXIntoYAfterZ(content, `${tab(1)}${this.workflowKind}->\n${tab(2)+this.permissionKind}`, '', 'permissionForWorkflowKind =')    
    this.updatedWFKFileContent = content.join('\n');
  } 

  private registerSlackChannel() {
    const content = this.updatedWFKFileContent.split('\n');
    insertXIntoYAfterZ(content, `${tab(1)}${this.workflowKind} ->\n${tab(2)}${this.slackName}`, '','alertChannelForWorkflowKind =' )
    this.updatedWFKFileContent = content.join('\n');
  }

  private async updateWorkflowKindFile() {
    if (this.workflowKindFileContent === this.updatedWFKFileContent) return;
    fs.writeFileSync(FilePaths.UQWorkflowKindPath, this.updatedWFKFileContent, 'utf-8');
  }

  private async updateUtilsFile() {
    const fileContent = fs.readFileSync(FilePaths.UQUtilsFile, 'utf-8').split('\n');
    insertXIntoYAfterZ(fileContent, `${tab(1)}${dispositionAdapter.replaceAll('{{workflow_name}}', this.workflowName)}`, 'where', ItemDispositionMarker)

    const matchFunctionText = matchFunction.replaceAll('{{workflow_name}}', this.workflowName) + '\n'
    insertXIntoYAfterZ(fileContent, matchFunctionText, 'where', ItemDispositionMarker, 1)

    const runWithAdapterText = runWithAdapterLine.replaceAll('{{workflow_name}}', this.workflowName)
    insertXIntoYAfterZ(fileContent, `${tab(1)}${runWithAdapterText}`, '', 'runWithAdapter itemKind action =')

    fs.writeFileSync(FilePaths.UQUtilsFile, fileContent.join('\n'), 'utf-8');
  }

  private async createOutcomesIfNecessary() {
    await this.runPromptForOutcomes()
    let outcomesFileContent = fs.readFileSync(FilePaths.UQOutcomeKindPath, 'utf-8').split('\n');

    this.outcomes.forEach(outcome => {
      outcomesFileContent = addNullaryTypeToSumType(outcomesFileContent, 'UnifiedQueueOutcomeKind', outcome.outcome, outcome.description);
      insertXIntoYAfterZ(outcomesFileContent, `${tab(1)}${outcome.outcome} -> ${outcome.isPending ? 'True' : 'False'}`, '', 'isPendingOutcome = ')
      insertXIntoYAfterZ(outcomesFileContent, `${tab(1)}${outcome.outcome} -> ${outcome.reactionable ? 'True' : 'False'}`, '', 'outcomeCanBeReActioned =')
    })

    fs.writeFileSync(FilePaths.UQOutcomeKindPath, outcomesFileContent.join('\n'), 'utf-8');
  }

  private async updateOutcomeActionHelpersFile() {
    if (this.outcomes.length === 0) return;
    let fileContent = fs.readFileSync(FilePaths.OutcomeActionHelpersPath, 'utf-8').split('\n');
    this.outcomes.forEach(outcome => insertXIntoYAfterZ(fileContent, `${tab(1)}${outcome.outcome} -> RaaOther`, '', 'unifiedQueueOutcomeToRiskAlertDecision = '))
    fs.writeFileSync(FilePaths.OutcomeActionHelpersPath, fileContent.join('\n'), 'utf-8');
  }

  private async updateOutcomeActionFile() {
    if (this.outcomes.length === 0) return;
    let fileContent = fs.readFileSync(FilePaths.OutcomeActionsFilePath, 'utf-8').split('\n');
    this.outcomes.forEach(o => insertXIntoYAfterZ(fileContent, `${tab(1)}${o.outcome} -> doNothing`, 'where', 'performOutcomeSideEffect presigner item '))
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
