import { FilePaths, ModulePaths, ReasonKindAlterCommand } from "../constants";
import BaseStep from "./baseStep";
import { Prompt, TPromptIndex } from "../types";
import prompts from "prompts";
import fs from 'fs';
import reasonKindTemplateContent from "../templates/reasonKindsTemplate"
import { addNullaryTypeToSumType, constructSumType, convertPascalCaseToSnakeCase, findIndexOfXAfterY, migrationFileAlreadyCreated, runMigrationCommand, tab, trimStringArr } from "../utils";

export default class ReasonKindsStep extends BaseStep {
  private fileContent: string[] = [];
  private reasonKindsData: Record<string, string> = {}
  private reasonOptions: Record<string, {name: string, comment: string}[]> = {}
  
  promptOne: TPromptIndex = {
    prompts: {
      id: 'reason-kinds',
      message: "Reason kinds for your vulcan workflow? (format: {ReasonName} {ReasonOptions (optional)})",
      type: "text",
    },
    recursive: true,
    handler: async () => await this.stepHandlers()
  }

  async stepHandlers() {
    this.parsePromptAnswers();
    await this.generateDataTypeForReasonOptions()

    if (this.reasonKindsAlreadyCreated()) return;
    
    this.generateFileContent();
    this.writeToFile()
    this.exportReasonKindsModule();
    this.createMigrationFile();
    this.updateUQReasonKindFile();
    this.logger().reasonKindCreated();
  }

  storeArtifacts() {
    this.artifacts.reasonKindsModuleName = this.moduleName;
    this.artifacts.reasonKindsData = this.reasonKindsData;
    this.artifacts.reasonOptions = this.reasonOptions;
    this.artifacts.reasonOptionsToBeDefined = this.reasonOptionsToBeDefined();
  }

  // All the methods below are private and used internally within this step.
  private get promptAnswers(): string[] {
    if (this.promptOne.recursive === true) {
      return this.promptOne.answer?.map(answer => answer['reason-kinds'].trim()) || [];
    } 
    return [];
  }

  private parsePromptAnswers() {
    const response = this.promptAnswers.map(item => item.trim().split(" "))

    if (!response || response.length === 0) {
      throw new Error("No reason kinds provided.");
    }

    this.reasonKindsData = response?.reduce((acc, item) => {
      if (item.length === 0) return acc;
      const [reasonName, reasonOptions] = item;

      if (reasonName) acc[reasonName] = reasonOptions || "";
      return acc;
    }, {} as Record<string, string>);
  }

  private async generateDataTypeForReasonOptions() {
    for (const reasonOption of this.reasonOptionsToBeDefined()) {
      await this.promptUserForReasonOptionsAndSaveResults(reasonOption)
    }
  }

  private async promptUserForReasonOptionsAndSaveResults(reasonOption: string) {
    const responses = await prompts([
      {
        type: 'text',
        name: reasonOption,
        message: `Please provide options for reason kind "${reasonOption}" `,
        validate: v => v.trim() ? true : 'Option cannot be empty.',
      },
      {
        type: 'text',
        name: 'description',
        message: `Please provide a description for reason kind (used for haddock comments):`,
        validate: v => v.trim() ? true : 'Description cannot be empty.',
      },
      {
        type: 'select',
        name: 'add-another',
        message: 'Do you want to add another option for this reason kind?',
        choices: [
          { title: 'Yes', value: true },
          { title: 'No', value: false }
        ],
        initial: 1,
      }
    ])
    
    this.reasonOptions[reasonOption] = [
      ...this.reasonOptions[reasonOption] || [],
      {name: responses[reasonOption].trim(), comment: responses.description.trim() || ""}
    ]

    if (responses['add-another'] === true) await this.promptUserForReasonOptionsAndSaveResults(reasonOption);
  }

  private generateFileContent() {
    this.fileContent = reasonKindTemplateContent.replaceAll('{{module_name}}', this.moduleName).split('\n');
    this.fileContent = [
      ...this.fileContent, 
      ...this.constructReasonKindsDataType(), 
      ...this.constructReasonOptionsDataType(),
      ...this.addTypescriptGenerationLine(),
    ];
  }

  private writeToFile() {
    const fileName = `${this.moduleName}.hs`;
    const filePath = `${FilePaths.ReasonKindsPath}/${fileName}`;
    fs.writeFileSync(filePath, this.fileContent.join('\n'), 'utf-8');
  }

  private exportReasonKindsModule() {
    const rawFileContent = fs.readFileSync(FilePaths.AllReasonKindsPath, 'utf-8');
    if (rawFileContent.includes(`import ${this.fullModuleName}`)) return

    const fileContent = trimStringArr(rawFileContent.split('\n'))
    const updatedContent = [...fileContent, `import ${this.fullModuleName}`]
    const targetIndex = findIndexOfXAfterY(updatedContent, ')', '(');
    if (targetIndex === -1) {
      throw new Error(`Could not find target index to insert import for ${this.fullModuleName}`);
    }
    updatedContent.splice(targetIndex, 0, `${tab(2)}${this.moduleName},`);
    fs.writeFileSync(FilePaths.AllReasonKindsPath, updatedContent.join('\n'), 'utf-8');
  }

  private createMigrationFile() {
    if (this.isMigrationFileAlreadyCreated()) return;
    const { migrationSqlFilePath } = runMigrationCommand(this.migrationFileName);
    const fileContentArray = this.constructMigrationFileContent();
    if (!migrationSqlFilePath) {
      throw new Error(`Migration SQL file path not found for migration: ${this.migrationFileName}`);
    }
    fs.writeFileSync(migrationSqlFilePath, fileContentArray.join('\n'), 'utf-8');
  }

  private updateUQReasonKindFile() {
    const uqName = `UnifiedQueue${this.workflowName}ReasonKind`;
    let fileContent = fs.readFileSync(FilePaths.UQReasonKinds, 'utf-8').split('\n');
    fileContent = addNullaryTypeToSumType(
      fileContent, 
      'UnifiedQueueReasonKind', 
      `${uqName} ${this.workflowName}Reason`, 
      `This represents the full disposition reason tree for ${this.readableWorkflowName} workflow.`
    );

    const targetIndex = findIndexOfXAfterY(fileContent, '\n', 'isConfirmedLargeFraud =');
    fileContent.splice(targetIndex, 0, `${tab(1)}${uqName} _ -> False`);

    const targetIndex2 = findIndexOfXAfterY(fileContent, '\n', 'isSuspectedLargeFraud =');
    fileContent.splice(targetIndex2, 0, `${tab(1)}${uqName} _ -> False`);

    fs.writeFileSync(FilePaths.UQReasonKinds, fileContent.join('\n'), 'utf-8');
  }

  private reasonOptionsToBeDefined() {
    return Object.values(this.reasonKindsData).filter(Boolean);
  }

  private get moduleName() {
    return this.workflowName + 'Reason';
  }

  private constructReasonKindsDataType(): string[] {
    return [
      `data ${this.moduleName}`,
      ...Object.keys(this.reasonKindsData).map((reasonName, i) => {
        const reasonOptions = this.reasonKindsData[reasonName];
        const optionsString = reasonOptions ? ` ${reasonOptions}` : '';
        return `${tab(1)}${i === 0 ? '=' : '|'} ${reasonName}${optionsString}`;
      }),
      `${tab(1)}deriving stock (Show, Eq, Ord)`,
    ]
  }

  private constructReasonOptionsDataType(): string[] {
    return Object.entries(this.reasonOptions).map(([reasonName, options]) => {
      return constructSumType({
        name: reasonName,
        deriving: ['Show', 'Eq', 'Ord'],
        fields: options.map(({name, comment}) => ({name, description: comment}))
      })
    })
  }

  private addTypescriptGenerationLine(): string[] {
    const generationString: string[] = [
      `''${this.moduleName}`,
      ...this.reasonOptionsToBeDefined().map(option => `''${option}`),
    ]

    return [
      `\n$(foldMap (deriveJSONAndTypeScript mercuryDefaultOptions) [${generationString.join(', ')}])`,
    ]
  }

  private reasonKindsAlreadyCreated(): boolean {
    const filePath = `${FilePaths.ReasonKindsPath}/${this.moduleName}.hs`;
    return fs.existsSync(filePath) && !!fs.readFileSync(filePath, 'utf-8').trim();
  }

  private get migrationFileName() {
    return `add_${convertPascalCaseToSnakeCase(this.workflowName)}_reason_kind`
  }

  private constructMigrationFileContent(): string[] {
    let fileContentArray: string[] = [];
    this.reasonOptionsToBeDefined().forEach(reasonOption => {
      this.reasonOptions[reasonOption].forEach(option => {
        fileContentArray.push(this.createMigrationCommand(reasonOption, option.name));
      }) 
    })
    return fileContentArray;
  }

  private isMigrationFileAlreadyCreated(): boolean {
    return migrationFileAlreadyCreated(this.migrationFileName);
  }

  private createMigrationCommand(reasonOption: string, reasonValue: string): string {
    return ReasonKindAlterCommand.replaceAll('{{workflow_name}}', this.workflowName)
      .replaceAll('{{reason_option}}', reasonOption)
      .replaceAll('{{reason_value}}', reasonValue);
  }

  private get fullModuleName() {
    return ModulePaths.ReasonKinds + '.' + this.moduleName;
  }

  private logger() {
    return {
      reasonKindCreated: () => console.log(tab(2), `🚀 Reason kinds file created at: ${FilePaths.ReasonKindsPath}/${this.moduleName}.hs`),
    }
  }
}