import { argv } from "process";
import NativeItemKindsStep from "./steps/nativeItemKindsStep";
import ReasonKindsStep from "./steps/reasonKindsStep";
import { Artifacts } from "./types";
import WorkflowIntroductionStep from "./steps/workflowIntroStep";
import { runCli } from "./utils";
import WorkflowDispositionStep from "./steps/workflowDispositionStep";
import GenerateTypescriptStep from "./steps/generateTypescriptStep";
import DetailsDataStep from "./steps/detailsDataStep";
import WorkflowInstantiationStep from "./steps/workflowInstantiationStep";

export async function runCreateVulcanWorkflow() {
  const data: {artifacts: Artifacts} = {artifacts: {}};
  const steps = [ 
    WorkflowIntroductionStep,
    NativeItemKindsStep,
    ReasonKindsStep,
    WorkflowDispositionStep,
    DetailsDataStep,
    WorkflowInstantiationStep,
    // GenerateTypescriptStep
  ]


  try {
    for (const stepClass of steps) {
      const step = new stepClass(data.artifacts);
      data.artifacts = await step.execute();
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("An error occurred during the workflow creation process:", error.message);
    } else {
      console.error("An unexpected error occurred:", error);
    }

    process.exit(1);
  }
}

// run the CLI or the create-vulcan-workflow function based on the command line arguments
const runProgram = () => {
  const [major, ,] = process.versions.node.split('.').map(Number);

  if (major < 18) {
    console.error('You need Node 18 or higher');
    process.exit(1);
  }

  argv.includes("--cli") ? runCli() : runCreateVulcanWorkflow()
}

runProgram();