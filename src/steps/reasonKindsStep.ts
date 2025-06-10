import BaseStep from "./baseStep";
import { Prompt } from "./stepInterface";

export default class ReasonKindsStep extends BaseStep {
  promptOne: Prompt = {
    id: 'reason-kinds',
    message: "Reason kinds for your vulcan workflow? (format: {ReasonName} {ReasonOptions (optional)}. enter 'q' to finish)",
    type: "text",
    recursive: true,
    required: true,
    handler: () => this.stepHandlers()
  }

  prompts: Prompt[] = [this.promptOne];

  private stepHandlers() {

  }
}