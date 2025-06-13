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
}

export const ModulePaths = {
  ReasonKinds: 'Model.UnifiedQueue.ReasonKinds',
  Disposition: 'Mercury.Risk.UnifiedQueue.DispositionData'
}

export const NativeItemKindsSuffix = 'ItemType';

export const derivingStockMarker = 'deriving stock';

export const NativeItemKindsTargetMarker = 'deriving stock';

export const TabSize = 2;

export const NativeItemKindJSONMarker = '(deriveJSONAndTypeScript mercuryDefaultOptions'

export const ReasonKindTemplateFile = './src/templates/reasonKindsTemplate.bd';

export const NativeItemKindsAlterCommand = `ALTER TYPE "unified_queue_item_kind" ADD VALUE 'UQ{{workflow_name}}{{native_item_kind}}';`

export const ReasonKindAlterCommand = `ALTER TYPE "unified_queue_reason_kind" ADD VALUE 'UQ{{workflow_name}}{{reason_option}}{{reason_value}}';`

export const TSLineMarker = 'deriveJSONAndTypeScript mercuryDefaultOptions';

export const DetailsDataMarker = ''