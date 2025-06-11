import { TabSize } from "./constants";
import { execSync } from "child_process";
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
  lines.splice(targetIndex + 1, 0, ...newArray.map(item => `  ${item}`));

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
}

