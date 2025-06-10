const content =`
{-# LANGUAGE TemplateHaskell #-}

-- | Disposition tree types for the Card Case Filing workflow.
module Model.UnifiedQueue.ReasonKinds.{{module_name}} where

import Data.Aeson (tagSingleConstructors)
import Mercury.TypeScript (defaultOptions, deriveJSONAndTypeScript)
import Prelude

-- | Generated code goes below

`;

export default content;