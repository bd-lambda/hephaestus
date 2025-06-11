import { FilePaths } from "../constants";
import BaseStep from "./baseStep";
import { Prompt } from "./stepInterface";
import prompts from "prompts";
import fs from 'fs';
import reasonKindTemplateContent from "../templates/reasonKindsTemplate"
import { tab } from "../utils";

export default class ReasonKindsStep extends BaseStep {
  private fileContent: string[] = [];
  private reasonKindsData: Record<string, string> = {}
  private promptOne: Prompt = {
    id: 'reason-kinds',
    message: "Reason kinds for your vulcan workflow? (format: {ReasonName} {ReasonOptions (optional)}. enter 'q' to finish)",
    type: "text",
    recursive: true,
    required: true,
    handler: () => this.stepHandlers()
  }
  private reasonOptions: Record<string, {name: string, comment: string}[]> = {}

  prompts: Prompt[] = [this.promptOne];

  private async stepHandlers() {
    if (this.reasonKindsAlreadyCreated()) return;

    this.parsePromptAnswers();
    await this.generateDataTypeForReasonOptions()
    this.generateFileContent();
    this.writeToFile()
    this.logger().reasonKindCreated();
  }

  private parsePromptAnswers() {
    const response = this.promptOne.answer?.split("|||").map(item => item.trim().split(" "))

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

  private reasonOptionsToBeDefined() {
    return Object.values(this.reasonKindsData).filter(Boolean);
  }

  private async generateDataTypeForReasonOptions() {
    for (const reasonOption of this.reasonOptionsToBeDefined()) {
      await this.promptUserForReasonOptionsAndSaveResults(reasonOption)
    }
  }

  private async promptUserForReasonOptionsAndSaveResults(reasonOption: string) {
    const reasonOptionResponse = await prompts({
      type: 'text',
      name: reasonOption,
      message: `Please provide an option for reason kind "${reasonOption}" (or 'q' to quit):`,
    })

    const answer = reasonOptionResponse[reasonOption]?.trim();
    if (answer === 'q') return

    const reasonDescription = await prompts({
      type: 'text',
      name: 'description',
      message: `Please provide a description for reason kind option "${answer}":`,
    });

    this.reasonOptions[reasonOption] = [
      ...(this.reasonOptions[reasonOption] || []), 
      {name: answer, comment: reasonDescription.description.trim() || ""}
    ]
    
    await this.promptUserForReasonOptionsAndSaveResults(reasonOption);
  }

  private generateFileContent() {
    this.fileContent = reasonKindTemplateContent.replace('{{module_name}}', this.getModuleName()).split('\n');
    this.fileContent = [
      ...this.fileContent, 
      ...this.constructReasonKindsDataType(), 
      ...this.constructReasonOptionsDataType(),
      ...this.addTypescriptGenerationLine(),
    ];
  }

  private writeToFile() {
    const fileName = `${this.getModuleName()}.hs`;
    const filePath = `${FilePaths.ReasonKindsPath}/${fileName}`;
    fs.writeFileSync(filePath, this.fileContent.join('\n'), 'utf-8');
  }

  private getModuleName() {
    return this.getWorkflowName() + 'Reason';
  }

  private constructReasonKindsDataType(): string[] {
    return [
      `data ${this.getModuleName()}Reason`,
      ...Object.keys(this.reasonKindsData).map((reasonName, i) => {
        const reasonOptions = this.reasonKindsData[reasonName];
        const optionsString = reasonOptions ? ` ${reasonOptions}` : '';
        return `${tab(1)}${i === 0 ? '=' : '|'} ${reasonName}${optionsString}`;
      }),
      `${tab(1)}deriving stock (Show, Eq, Ord)`,
    ]
  }

  private constructReasonOptionsDataType(): string[] {
    const results: string[] = []
    Object.entries(this.reasonOptions).forEach(([reasonName, options]) => {
      if (options.length === 0) return;
      results.push(`\ndata ${reasonName}`);
      options.forEach((option, i) => {
        const optionString = option.comment ? ` -- | ${option.comment}` : '';
        results.push(`${tab(1)}${i === 0 ? '=' : '|'} ${optionString}`);
        results.push(`${tab(2)}${option.name}`);
      });
      results.push(`${tab(1)}deriving stock (Show, Eq, Ord)`);
    });

    return results;
  }

  private addTypescriptGenerationLine(): string[] {
    const generationString: string[] = [
      `''${this.getModuleName()}`,
      ...this.reasonOptionsToBeDefined().map(option => `''${option}`),
    ]

    return [
      `\n$(foldMap (deriveJSONAndTypeScript mercuryDefaultOptions) [${generationString.join(', ')}])`,
    ]
  }

  private reasonKindsAlreadyCreated(): boolean {
    const filePath = `${FilePaths.ReasonKindsPath}/${this.getModuleName()}.hs`;
    return fs.existsSync(filePath) && !!fs.readFileSync(filePath, 'utf-8').trim();
  }

  private logger() {
    return {
      reasonKindCreated: () => console.log(tab(2), `🚀 Reason kinds file created at: ${FilePaths.ReasonKindsPath}/${this.getModuleName()}.hs`),
    }
  }
}