const content: string = `
{-# LANGUAGE TemplateHaskell #-}

module Model.UnifiedQueue.DispositionVersion.{{workflow_name}}DispositionVersion ({{workflow_name}}Version (..), toNullaryEnum, toUnifiedQueueItemVersions) where

import A.MercuryPrelude
import Mercury.Persistent.TH.DeriveNullarySumType
import Mercury.Risk.UnifiedQueue.DispositionData.{{workflow_name}}Disposition
import Model.Import

-- | Versions for the {{readable_workflow_name}}
$( deriveNullarySumType
     ''{{workflow_name}}Disposition
     $ defaultNullarySumTypeOptions
       { monomorpherName = Just "toUnifiedQueueItemVersions"
       , valueModifier = Just ("Disposition", "Version")
       , deriveNullaryInstances = True
       , toTypeName = Just "{{workflow_name}}Version"
       }
 )

$(deriveJSONAndTypeScript mercuryDefaultOptions {tagSingleConstructors = True} ''{{workflow_name}}Version)

`

export default content;