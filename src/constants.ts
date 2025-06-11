export const FilePaths = {
  VulcanAdapterInstance: './src/Mercury/Risk/UnifiedQueue/Adapter/Instance/',
  VulcanAdapterClass: './src/Mercury/Risk/UnifiedQueue/Adapter/Class.hs',
  NativeItemKindsPath: './src/Model/UnifiedQueue/NativeItemKinds.hs',
  ReasonKindsPath: './src/Model/UnifiedQueue/ReasonKinds',
  MigrationFilesPath: './db/migrate/'
}

export const NativeItemKindsSuffix = 'ItemType';

export const NativeItemKindsTargetMarker = 'deriving stock';

export const TabSize = 2;

export const NativeItemKindJSONMarker = '(deriveJSONAndTypeScript mercuryDefaultOptions'

export const ReasonKindTemplateFile = './src/templates/reasonKindsTemplate.bd';

export const NativeItemKindsAlterCommand = `ALTER TYPE "unified_queue_item_kind" ADD VALUE 'UQ{{workflow_name}}{{native_item_kind}}';`

export const ReasonKindAlterCommand = `ALTER TYPE "unified_queue_reason_kind" ADD VALUE 'UQ{{workflow_name}}{{reason_option}}{{reason_value}}';`