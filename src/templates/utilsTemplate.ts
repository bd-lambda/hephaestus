export const dispositionAdapter = `UnifiedQueue{{workflow_name}}ItemKind subsystemItemKind -> runMatch subsystemItemKind match{{workflow_name}}Data`

export const matchFunction = `
    match{{workflow_name}}Data :: UnifiedQueueDispositionData -> Maybe {{workflow_name}}Disposition
    match{{workflow_name}}Data = \case
      UnifiedQueue{{workflow_name}}Disposition subsystemDisposition -> Just subsystemDisposition
      _ -> Nothing
`