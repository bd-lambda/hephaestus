import { argv } from "process";
import NativeItemKindsStep from "./steps/nativeItemKindsStep";
import ReasonKindsStep from "./steps/reasonKindsStep";
import { Artifacts } from "./types";
import WorkflowIntroductionStep from "./steps/workflowIntroStep";
import { runCli } from "./utils";

export async function runCreateVulcanWorkflow() {
  const data: {artifacts: Artifacts} = {artifacts: {}};
  const steps = [ 
    WorkflowIntroductionStep,
    NativeItemKindsStep,
    ReasonKindsStep
  ]

  try {
    for (const stepClass of steps) {
      const step = new stepClass(data.artifacts);
      data.artifacts = await step.execute();
    }
  } catch (error) {
    console.error("An error occurred during the workflow creation process:", error);
    process.exit(1);
  }
}

if (argv.includes("--cli")) {
  runCli()
} else {
  runCreateVulcanWorkflow()
}