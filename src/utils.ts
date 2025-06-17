import { derivingStockMarker, FilePaths, TabSize } from "./constants";
import { execSync } from "child_process";
import fs from "fs";
import prompts from "prompts";
import repl from "repl";

export const capitalize = (str: string): string => {
  if (typeof str !== 'string' || str.length === 0) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const lastIndexOf = (arr: string[], predicate: (value: string) => boolean): number => {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) {
      return i;
    }
  }
  return -1;
}

export const findIndexOfXAfterY = (arr: string[], x: string, y: string): number => {
  const yIndex = arr.findIndex(line => line.trim().startsWith(y));
  if (yIndex === -1) return yIndex; // Return -1 if y is not found

  for (let i = yIndex + 1; i < arr.length; i++) {
    if (arr[i].trim().startsWith(x)) return i;
  }

  return -1; // Return -1 if x is not found after y
}

export const addVariantToHaskellDataType = (fileContent: string, dataTypeName: string, newVariant: string): string => {
  const lines = fileContent.split('\n');
  const startIndex = lines.findIndex(line => line.trim().startsWith(`data ${dataTypeName}`));

  if (startIndex === -1) {
    throw Error(`❌ Could not find data type: ${dataTypeName}`);
  }

  let endIndex = startIndex + 1;
    
  while (endIndex < lines.length && (lines[endIndex].trim().startsWith('|') || lines[endIndex].trim().startsWith('=') )) {
    endIndex++;
  }

  // Insert the new variant right before the line that is not a variant
  lines.splice(endIndex, 0, `  | ${newVariant}`);

  return lines.join('\n');
}

export const addStringArrayAfterString = (fileContent: string, targetString: string, newArray: string[]): string[] => {
  const lines = fileContent.split('\n');
  const targetIndex = lastIndexOf(lines, line => line.trim().startsWith(targetString));

  if (targetIndex === -1) {
    throw Error(`❌ Could not find target string: ${targetString}`);
  }


  // Insert the new array right after the target string line
  lines.splice(targetIndex + 1, 0, ...newArray);

  return lines;
}

export const tab = (amount: number = 1) => (new Array(TabSize * amount).fill(' ')).join('');

export const convertPascalCaseToSnakeCase = (str: string): string => {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2')
            .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
            .toLowerCase();
}

type TMigrationResult = {
  migrationSqlFilePath: string | undefined;
  migrationClassFilePath: string | undefined;
}

export const runMigrationCommand = (migrationName: string): TMigrationResult => {
  const cleanCapturedPath = (rawOutput?: string) => rawOutput?.match(/\sdb\/migrate.*/)?.[0]?.trim();

  try {
    const command = `make db-new-migration name=${migrationName}`;
    const result = execSync(command, { encoding: 'utf-8' }).split('\n');
    const migrationSqlFilePath = './' + cleanCapturedPath(result.find(line => line.includes(`${migrationName}/up.sql`)));
    const migrationClassFilePath = './' + cleanCapturedPath(result.find(line => line.includes(`${migrationName}.rb`)));
    return { migrationSqlFilePath, migrationClassFilePath };
  } catch (error) {
    console.error(`❌ Error creating migration file: ${migrationName}`);
    throw error;
  }
}

export const migrationFileAlreadyCreated = (migrationName: string): boolean => {
  const files = fs.readdirSync(FilePaths.MigrationFilesPath);
  return files.some(f => f.includes(migrationName));
} 

export const trimStringArr = (arr: string[]): string[] => {
  let firstIndexOfAnOccurrence: null | number = null,
      lastIndexOfAnOccurrence = 0;
    
  for (let i = 0; i < arr.length; i++) {
    if (Boolean(arr[i]?.trim())) {
      if (firstIndexOfAnOccurrence === null) firstIndexOfAnOccurrence = i
      lastIndexOfAnOccurrence = i;
    }
  }

  return arr.slice(firstIndexOfAnOccurrence || 0, lastIndexOfAnOccurrence + 1)
}

export const lowerFirstLetter = (str: string): string => {
  if (typeof str !== 'string' || str.length === 0) {
    return str;
  }
  return str.charAt(0).toLowerCase() + str.slice(1);
}

export const pascalCaseToReadable = (str: string): string => {
  return str.replace(/([a-z])([A-Z])/g, '$1 $2')
}

export const addImport = (fileContentArr: string[], modulePath: string): string[] => {
  let targetIndex = lastIndexOf(fileContentArr, l => l.trim().startsWith('import '));
  targetIndex = targetIndex === -1 ? 0 : targetIndex;
  fileContentArr.splice(targetIndex + 1, 0, `import ${modulePath}`);
  return fileContentArr;
}

type TRecordTypeArgs = {
  name: string;
  fields: Array<{ name: string; type: string; description?: string }>;
  deriving?: string[];
  comment?: string;
}

export const constructRecordType = ({name, fields, deriving=["Show", "Eq"], comment}: TRecordTypeArgs) => {
  let content = ''

  if (comment) content += `-- | ${comment}\n`
  content += `data ${name} = ${name}\n`
  content += fields.map((field, i) => {
    return `${tab(1)}${i === 0 ? '{' : ','} ${field.name} :: ${field.type}\n${tab(1)}-- ^ ${field.description}`;
  }).join('\n');
  content += `\n${tab(1)}}\n`
  content += `${tab(1)}deriving stock (${deriving.join(', ')})\n`

  return content
}

type TNullaryTypeArgs = {
  name: string;
  fields: Array<{name: string; optionTypes?: string[]; description?: string}>;
  deriving?: string[];
  comment?: string;
}

export const constructSumType = ({name, fields, deriving, comment}: TNullaryTypeArgs) => {
  let content = '\n';

  if (comment) content += `-- | ${comment}\n`;
  content += `data ${name}\n`;
  
  fields.forEach((field, i) => {
    const options = field.optionTypes ? field.optionTypes.join(' ') : '';
    if (field.description) content += `${tab(1)}${i === 0 ? '=' : '|'} -- | ${field.description}\n`;
    content += `${tab(2)}${field.name} ${options}\n`;
  });

  content += `${tab(1)}deriving stock (${deriving?.join(', ') || 'Show, Eq, Ord'})\n`;

  return content;
}

export const extractSumTypesFromFile = (fileContent: string[], dataTypeName: string): string[] => {
  const startIndex = fileContent.findIndex(line => line.trim().startsWith(`data ${dataTypeName}`));
  
  if (startIndex === -1) throw new Error(`Data type ${dataTypeName} not found in the file.`);
  const endIndex = findIndexOfXAfterY(fileContent, derivingStockMarker, `data ${dataTypeName}`);
  if (endIndex === -1) throw new Error(`Deriving stock marker not found after data type ${dataTypeName}.`);

  return fileContent
          .slice(startIndex + 1, endIndex)
          .filter(line => !line.includes('--') && line.trim().length > 0)
          .map(line => line.replaceAll("\t", '').replaceAll(/\|?\=?/g, '').trim())
}

export const fetchRiskWorkflow = (): string[] => {
  const fileContent = fs.readFileSync(FilePaths.RiskWorkflowPath, 'utf-8').split('\n');
  return extractSumTypesFromFile(fileContent, 'RiskWorkflow');
}

export const fetchSlackChannels = (): string[] => {
  const fileContent = fs.readFileSync(FilePaths.SlackChannelsPath, 'utf-8').split('\n');
  return extractSumTypesFromFile(fileContent, 'SlackChannel');
}

export const addNullaryTypeToSumType = (fileContent: string[], dataTypeName: string, newVariant: string, comment?: string): string[] => {
  const startIndex = fileContent.findIndex(line => line.trim().startsWith(`data ${dataTypeName}`));
  if (startIndex === -1) throw new Error(`Data type ${dataTypeName} not found in the file.`);
  const endIndex = findIndexOfXAfterY(fileContent, derivingStockMarker, `data ${dataTypeName}`);
  if (endIndex === -1) throw new Error(`Deriving stock marker not found after data type ${dataTypeName}.`);

  // Insert the new variant right before the line that is not a variant
  const newLine = comment ? `${tab(1)}| -- | ${comment}\n${tab(2)+newVariant}` : `${tab(1)}| ${newVariant}`;
  fileContent.splice(endIndex, 0, newLine);

  return fileContent;
}

export const runCli = () => {
  const r = repl.start({
    prompt: 'vulcan> ',
  })
  
  r.context.capitalize = capitalize;
  r.context.lastIndexOf = lastIndexOf;
  r.context.findIndexOfXAfterY = findIndexOfXAfterY;
  r.context.addVariantToHaskellDataType = addVariantToHaskellDataType;
  r.context.addStringArrayAfterString = addStringArrayAfterString;
  r.context.tab = tab;
  r.context.convertPascalCaseToSnakeCase = convertPascalCaseToSnakeCase;
  r.context.runMigrationCommand = runMigrationCommand;  
  r.context.trimStringArr = trimStringArr;
  r.context.lowerFirstLetter = lowerFirstLetter;
  r.context.prompts = prompts;
  r.context.pascalCaseToReadable = pascalCaseToReadable;
  r.context.addImport = addImport;
  r.context.constructRecordType = constructRecordType;
  r.context.constructSumType = constructSumType;
  r.context.fetchRiskWorkflow = fetchRiskWorkflow;
  r.context.fetchSlackChannels = fetchSlackChannels;
  r.context.extractSumTypesFromFile = extractSumTypesFromFile;
  r.context.addNullaryTypeToSumType = addNullaryTypeToSumType;
}