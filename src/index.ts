import { Artifacts } from "./steps/stepInterface";
import WorkflowIntroductionStep from "./steps/workflowIntroStep";

export function runCreateVulcanWorkflow() {
  const data: {artifacts: Artifacts} = {artifacts: {}};
  const steps = [ WorkflowIntroductionStep]

  steps.forEach(async (stepClass) => {
    const step = new stepClass(data.artifacts);
    data.artifacts = await step.execute()
  })
}

runCreateVulcanWorkflow();