const content: string =`
{-# LANGUAGE TemplateHaskell #-}

-- | Disposition tree types for the Card Case Filing workflow.
module Model.UnifiedQueue.ReasonKinds.{{module_name}} where

import A.MercuryPrelude
import Mercury.AesonUtils (mercuryDefaultOptions)
import Mercury.TypeScript (deriveJSONAndTypeScript)

-- | Generated code goes below
`;

export default content;