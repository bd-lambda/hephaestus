const content = `
{-# OPTIONS_GHC -fno-warn-orphans #-}

module Mercury.Risk.UnifiedQueue.Adapter.Instance.{{workflow_name}} where

import A.MercuryPrelude
import Mercury.Database.Monad (runDB)
import Mercury.Risk.UnifiedQueue.Adapter.Class (UnifiedQueueAdapter (..), UnifiedQueueSubsystem (..))
import Mercury.Risk.UnifiedQueue.DetailsData
  ( UnifiedQueueDetailsError (..),
    UnifiedQueueItemDetailsData (..),
    UnifiedQueue{{workflow_name}}DetailsData (..),
  )
import Mercury.Risk.UnifiedQueue.DispositionData (UnifiedQueueDispositionData (..))
import Mercury.Risk.UnifiedQueue.DispositionData.{{workflow_name}}Disposition
import Model.Prose (literalProse)
import Model.UnifiedQueue.DispositionVersion.{{workflow_name}}DispositionVersion ({{workflow_name}}Version (..), toNullaryEnum)
import Model.UnifiedQueue.NativeItemKinds ({{workflow_name}}ItemType (..))
import Model.UnifiedQueue.ReasonKinds.{{workflow_name}}Reason ({{workflow_name}}Reason (..))
import Model.UnifiedQueue.UnifiedQueueAdapterSpecificError (UnifiedQueueAdapterSpecificError (..))
import Model.UnifiedQueue.UnifiedQueueDispositionVersion (UnifiedQueueDispositionVersion (..))
import Model.UnifiedQueue.UnifiedQueueItemKind (UnifiedQueueItemKind (..))
import Model.UnifiedQueue.UnifiedQueueItemPriority (clampToUnifiedQueueItemPriority)
import Model.UnifiedQueue.UnifiedQueueReasonKind (UnifiedQueueReasonKind (..))
import Model.UnifiedQueue.UnifiedQueueWorkflowKind (UnifiedQueueWorkflowKind (..))
import PersistentModels.Organization (OrganizationId)
import PersistentModels.UnifiedQueueAlertItem (UnifiedQueueAlertItem (..))
import PersistentModels.Alert (Alert)

instance UnifiedQueueAdapter 'UnifiedQueue{{workflow_name}}Subsystem where
  type SubsystemItemKind 'UnifiedQueue{{workflow_name}}Subsystem = {{workflow_name}}ItemType
  makeUnifiedQueueItemKind = UnifiedQueue{{workflow_name}}ItemKind
  itemToWorkflowKind = const MoneyMovementErrorWorkflow

  type SubsystemReasonKind 'UnifiedQueue{{workflow_name}}Subsystem = {{workflow_name}}Reason
  makeUnifiedQueueReasonKind = UnifiedQueue{{workflow_name}}ReasonKind

  validateDisposition _ _ = pure ()

  -- no outcomes for now.
  validateOutcome _ _ _ = pure ()

  validateOutcomes _ _ _ = pure ()

  type SubsystemApiDispositionData 'UnifiedQueue{{workflow_name}}Subsystem = {{workflow_name}}Disposition
  type SubsystemLatestApiDispositionData 'UnifiedQueue{{workflow_name}}Subsystem = {{workflow_name}}DispositionV1Data
  makeApiDispositionData = UnifiedQueue{{workflow_name}}Disposition
  toApiDispositionData _ _ _ = Left $ literalProse @"Not yet implemented"
  fromApiDispositionData _ _ = Left $ literalProse @"Not yet implemented"

  ensureLatestApiDispositionData _ _ = Left $ literalProse @"Not yet implemented"

  type SubsystemApiDispositionVersion 'UnifiedQueue{{workflow_name}}Subsystem = {{workflow_name}}Version
  makeUnifiedQueueVersion = UnifiedQueue{{workflow_name}}Version
  getCurrentVersion = const {{workflow_name}}VersionV1
  getVersionFromDispositionData = toNullaryEnum

  type UnifiedQueueCreationData 'UnifiedQueue{{workflow_name}}Subsystem = OrganizationId
  getItemPriority = const $ clampToUnifiedQueueItemPriority 50
  getOrganizationId orgId = orgId

  getReviewDeadline _ _ _ = Nothing

  notifyOnCreate _ _ _ = pure Nothing

  type SubsystemItemModel 'UnifiedQueue{{workflow_name}}Subsystem = Alert
  type SubsystemItemLinkModel 'UnifiedQueue{{workflow_name}}Subsystem = UnifiedQueueAlertItem
  buildSubsystemLink itemId alertId _ = UnifiedQueueAlertItem itemId alertId

  type SubsystemDetailsData 'UnifiedQueue{{workflow_name}}Subsystem = UnifiedQueue{{workflow_name}}DetailsData
  makeUnifiedQueueItemDetailsData = UnifiedQueue{{workflow_name}}Details
  getSubsystemDetailsData _ = pure $ Left (DetailsAdapterError $ UnifiedQueueAdapterSpecificError $ literalProse @"Not yet implemented")

  -- INFORMATION REQUESTS
  buildInformationRequestCreationData _ _ _ = pure Nothing

  -- SCORECARD INTEGRATION
  getScorecardIntegration = const Nothing

  -- HOOKS
  applyUnifiedQueueDisposition _params callback = runDB callback

`

export default content;