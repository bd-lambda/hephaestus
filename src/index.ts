import { argv } from "process";
import NativeItemKindsStep from "./steps/nativeItemKindsStep";
import ReasonKindsStep from "./steps/reasonKindsStep";
import { Artifacts } from "./steps/stepInterface";
import WorkflowIntroductionStep from "./steps/workflowIntroStep";
import { runCli } from "./utils";

export async function runCreateVulcanWorkflow() {
  const data: {artifacts: Artifacts} = {artifacts: {}};
  const steps = [ 
    WorkflowIntroductionStep,
    NativeItemKindsStep,
    ReasonKindsStep
  ]
  
  for (const stepClass of steps) {
    const step = new stepClass(data.artifacts);
    data.artifacts = await step.execute();
  }
}

if (argv.includes("--cli")) {
  runCli()
} else {
  runCreateVulcanWorkflow()
}