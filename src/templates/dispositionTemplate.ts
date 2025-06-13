const content: string = `
{-# LANGUAGE TemplateHaskell #-}
-- For deriving prairie types
{-# OPTIONS_GHC -fno-warn-unused-type-patterns #-}

module Mercury.Risk.UnifiedQueue.DispositionData.{{workflow_name}}Disposition where

import A.MercuryPrelude
import Model.Import
import Model.UnifiedQueue.ReasonKinds.{{workflow_name}}Reason
import Prairie.TH (mkRecord)

-- | The data structure encapsulating the disposition data for a {{readable_workflow_name}}.
data {{workflow_name}}Disposition
  = {{workflow_name}}DispositionDataV1 {{workflow_name}}DispositionV1Data
  deriving stock (Show, Eq)

-- | The data structure encapsulates the different versions of the disposition data for a {{readable_workflow_name}}.
{{disposition_goes_here}}

$( fold
     [ deriveJSONAndTypeScript mercuryDefaultOptions ''{{workflow_name}}DispositionV1Data
     , deriveJSONAndTypeScript mercuryDefaultOptions {tagSingleConstructors = True} ''{{workflow_name}}Disposition
     , mkRecord ''{{workflow_name}}DispositionV1Data
     ]
 )
`
;

export default content