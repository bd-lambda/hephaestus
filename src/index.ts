import NativeItemKindsStep from "./steps/nativeItemKindsStep";
import { Artifacts } from "./steps/stepInterface";
import WorkflowIntroductionStep from "./steps/workflowIntroStep";

export async function runCreateVulcanWorkflow() {
  const data: {artifacts: Artifacts} = {artifacts: {}};
  const steps = [ 
    WorkflowIntroductionStep,
    NativeItemKindsStep
  ]
  
  for (const stepClass of steps) {
    const step = new stepClass(data.artifacts);
    data.artifacts = await step.execute();
  }
}

runCreateVulcanWorkflow();