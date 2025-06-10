export const capitalize = (str: string): string => {
  if (typeof str !== 'string' || str.length === 0) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
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
