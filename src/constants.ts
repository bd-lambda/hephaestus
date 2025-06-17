export const FilePaths = {
  VulcanAdapterInstance: './src/Mercury/Risk/UnifiedQueue/Adapter/Instance/',
  VulcanAdapterClass: './src/Mercury/Risk/UnifiedQueue/Adapter/Class.hs',
  NativeItemKindsPath: './src/Model/UnifiedQueue/NativeItemKinds.hs',
  ReasonKindsPath: './src/Model/UnifiedQueue/ReasonKinds',
  AllReasonKindsPath: './src/Model/UnifiedQueue/ReasonKinds/All.hs',
  MigrationFilesPath: './db/migrate/',
  DispositionDataDir: './src/Mercury/Risk/UnifiedQueue/DispositionData/',
  DispositionDataPath: './src/Mercury/Risk/UnifiedQueue/DispositionData.hs',
  DispositionVersionDir: './src/Model/UnifiedQueue/DispositionVersion/',
  AllDispositionDataPath: './src/Mercury/Risk/UnifiedQueue/DispositionData/All.hs',
  TypescriptModulesPath: './src/Mercury/TypeScript/Types/UnifiedQueue.hs',
  DetailsDataPath: './src/Mercury/Risk/UnifiedQueue/DetailsData.hs',
  UQItemKindPath: './src/Model/UnifiedQueue/UnifiedQueueItemKind.hs',
  UQWorkflowKindPath: './src/Model/UnifiedQueue/UnifiedQueueWorkflowKind.hs',
  RiskWorkflowPath: './src/Model/RiskWorkflow.hs',
  SlackChannelsPath: './src/Model/SlackChannel.hs',
  UQUtilsFile: './src/Mercury/Risk/UnifiedQueue/Adapter/Utils.hs',
  UQReasonKinds: './src/Model/UnifiedQueue/UnifiedQueueReasonKind.hs',
  UQDispositionVersionPath: './src/Model/UnifiedQueue/UnifiedQueueDispositionVersion.hs',
  UQOutcomeKindPath: './src/Model/UnifiedQueue/UnifiedQueueOutcomeKind.hs',
  OutcomeActionHelpersPath: './src/Mercury/Risk/UnifiedQueue/OutcomeActions/Helpers.hs',
  OutcomeActionsFilePath: './src/Mercury/Risk/UnifiedQueue/OutcomeActions.hs'
}

export const ModulePaths = {
  ReasonKinds: 'Model.UnifiedQueue.ReasonKinds',
  Disposition: 'Mercury.Risk.UnifiedQueue.DispositionData',
  DispositionVersion: 'Model.UnifiedQueue.DispositionVersion',
}

export const NativeItemKindsSuffix = 'ItemType';

export const ItemKindSuffix = 'ItemKind';

export const derivingStockMarker = 'deriving stock';

export const NativeItemKindsTargetMarker = 'deriving stock';

export const TabSize = 2;

export const NativeItemKindJSONMarker = '(deriveJSONAndTypeScript mercuryDefaultOptions'

export const ReasonKindTemplateFile = './src/templates/reasonKindsTemplate.bd';

export const NativeItemKindsAlterCommand = `ALTER TYPE "unified_queue_item_kind" ADD VALUE 'UQ{{workflow_name}}{{native_item_kind}}';`

export const ReasonKindAlterCommand = `ALTER TYPE "unified_queue_reason_kind" ADD VALUE 'UQ{{workflow_name}}{{reason_option}}{{reason_value}}';`

export const TSLineMarker = '$(deriveJSONAndTypeScript mercuryDefaultOptions';

export const DetailsDataDefinitionMarker = 'data UnifiedQueueItemDetailsData'

export const UQItemKindMarker = 'data UnifiedQueueItemKind';

export const ItemDispositionMarker = 'itemAndDispositionWithAdapter itemKind disposition action =';