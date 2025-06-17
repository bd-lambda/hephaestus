const content = `
{-# OPTIONS_GHC -fno-warn-orphans #-}

module Mercury.Risk.UnifiedQueue.Adapter.Instance.{{worklow_name}} where

import A.MercuryPrelude
import Mercury.Database.Monad (runDB)
import Mercury.Risk.UnifiedQueue.Adapter.Class (UnifiedQueueAdapter (..), UnifiedQueueSubsystem (..))
import Mercury.Risk.UnifiedQueue.DetailsData
  ( UnifiedQueueDetailsError (..),
    UnifiedQueueItemDetailsData (..),
    UnifiedQueue{{worklow_name}}DetailsData (..),
  )
import Mercury.Risk.UnifiedQueue.DispositionData (UnifiedQueueDispositionData (..))
import Mercury.Risk.UnifiedQueue.DispositionData.{{worklow_name}}Disposition
import Model.Prose (literalProse)
import Model.UnifiedQueue.DispositionVersion.{{worklow_name}}DispositionVersion ({{worklow_name}}Version (..), toNullaryEnum)
import Model.UnifiedQueue.NativeItemKinds ({{worklow_name}}ItemType (..))
import Model.UnifiedQueue.ReasonKinds.{{worklow_name}}Reason ({{worklow_name}}Reason (..))
import Model.UnifiedQueue.UnifiedQueueAdapterSpecificError (UnifiedQueueAdapterSpecificError (..))
import Model.UnifiedQueue.UnifiedQueueDispositionVersion (UnifiedQueueDispositionVersion (..))
import Model.UnifiedQueue.UnifiedQueueItemKind (UnifiedQueueItemKind (..))
import Model.UnifiedQueue.UnifiedQueueItemPriority (clampToUnifiedQueueItemPriority)
import Model.UnifiedQueue.UnifiedQueueReasonKind (UnifiedQueueReasonKind (..))
import Model.UnifiedQueue.UnifiedQueueWorkflowKind (UnifiedQueueWorkflowKind (..))
import PersistentModels.Organization (OrganizationId)
import PersistentModels.UnifiedQueueAlertItem (UnifiedQueueAlertItem (..))
import PersistentModels.Alert (Alert)

instance UnifiedQueueAdapter 'UnifiedQueue{{worklow_name}}Subsystem where
  type SubsystemItemKind 'UnifiedQueue{{worklow_name}}Subsystem = {{worklow_name}}ItemType
  makeUnifiedQueueItemKind = UnifiedQueue{{worklow_name}}ItemKind
  itemToWorkflowKind = const MoneyMovementErrorWorkflow

  type SubsystemReasonKind 'UnifiedQueue{{worklow_name}}Subsystem = {{worklow_name}}Reason
  makeUnifiedQueueReasonKind = UnifiedQueue{{worklow_name}}ReasonKind

  validateDisposition _ _ = pure ()

  -- no outcomes for now.
  validateOutcome _ _ _ = pure ()

  validateOutcomes _ _ _ = pure ()

  type SubsystemApiDispositionData 'UnifiedQueue{{worklow_name}}Subsystem = {{worklow_name}}Disposition
  type SubsystemLatestApiDispositionData 'UnifiedQueue{{worklow_name}}Subsystem = {{worklow_name}}DispositionV1Data
  makeApiDispositionData = UnifiedQueue{{worklow_name}}Disposition
  toApiDispositionData _ _ _ = Left $ literalProse @"Not yet implemented"
  fromApiDispositionData _ _ = Left $ literalProse @"Not yet implemented"

  ensureLatestApiDispositionData _ _ = Left $ literalProse @"Not yet implemented"

  type SubsystemApiDispositionVersion 'UnifiedQueue{{worklow_name}}Subsystem = {{worklow_name}}Version
  makeUnifiedQueueVersion = UnifiedQueue{{worklow_name}}Version
  getCurrentVersion = const {{worklow_name}}VersionV1
  getVersionFromDispositionData = toNullaryEnum

  type UnifiedQueueCreationData 'UnifiedQueue{{worklow_name}}Subsystem = OrganizationId
  getItemPriority = const $ clampToUnifiedQueueItemPriority 50
  getOrganizationId orgId = orgId

  getReviewDeadline _ _ _ = Nothing

  notifyOnCreate _ _ _ = pure Nothing

  type SubsystemItemModel 'UnifiedQueue{{worklow_name}}Subsystem = Alert
  type SubsystemItemLinkModel 'UnifiedQueue{{worklow_name}}Subsystem = UnifiedQueueAlertItem
  buildSubsystemLink itemId alertId _ = UnifiedQueueAlertItem itemId alertId

  type SubsystemDetailsData 'UnifiedQueue{{worklow_name}}Subsystem = UnifiedQueue{{worklow_name}}DetailsData
  makeUnifiedQueueItemDetailsData = UnifiedQueue{{worklow_name}}Details
  getSubsystemDetailsData _ = pure $ Left (DetailsAdapterError $ UnifiedQueueAdapterSpecificError $ literalProse @"Not yet implemented")

  -- INFORMATION REQUESTS
  buildInformationRequestCreationData _ _ _ = pure Nothing

  -- SCORECARD INTEGRATION
  getScorecardIntegration = const Nothing

  -- HOOKS
  applyUnifiedQueueDisposition _params callback = runDB callback

`

export default content;