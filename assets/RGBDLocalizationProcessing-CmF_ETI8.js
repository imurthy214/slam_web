const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Ordinary acquisition publication retains the authoritative corrected pose view.\r
// This owner never reconstructs a post-correction state from raw captures.\r
package RGBDLocalizationProcessing\r
\r
  constant Integer capacity = RGBDKeyframes.keyframeCapacity;\r
  constant Integer dimension = RGBDKeyframes.dimension;\r
  constant Integer identifierLimit = RGBDKeyframes.identifierLimit;\r
  record Result\r
    RGBDGraphProcessing.State next;\r
    RGBDLocalizationCatalog.Result publication;\r
    Boolean accepted;\r
    Integer reason;\r
    Integer ledgerReason;\r
    Integer vocabularyReason;\r
  end Result;\r
  function Publish\r
    input RGBDGraphProcessing.State previous;\r
    input RGBDLocalizationCatalog.Estimator proposed "Same compiled localization invocation; no host reconstruction";\r
    input RGBDKeyframes.Frame measurement;\r
    input Real producerAccepted "Prediction accepted, or explicit initialization accepted";\r
    input Real observationAccepted;\r
    input Real captureAccepted;\r
    input Boolean imageOn;\r
    input Integer imageEpoch;\r
    input Real imageTime;\r
    input Real h;\r
    input Boolean initializing;\r
    input Boolean frameAccepted;\r
    input Integer frameRejectionReason;\r
    input Boolean requested;\r
    input Real candidatePoint[RGBDKeyframes.featureCapacity,dimension];\r
    input Real candidateEnabled[RGBDKeyframes.featureCapacity];\r
    input Real minimumInterval = 0.5;\r
    input Real maximumInterval = 2.0;\r
    input Real translationThreshold = 0.6;\r
    input Real rotationThreshold = 0.25;\r
    input Integer minimumFeatures = 12;\r
    input Real voxelWidth = 0.25;\r
    input Real mergeRadius = 0.15;\r
    input Real maximumDistance = 80.0;\r
    input Real tentativeLifetime = 0.5;\r
    input Real confirmedLifetime = 5.0;\r
    input Real confirmationObservations = 3.0;\r
    input Real maximumConfidence = 8.0;\r
    input Real maximumTentative = 700.0;\r
\r
    input Integer minimumMeasuredDescriptors = 8;\r
    input Real minimumWordDistanceSquared = 0.04;\r
\r
    output Result result;\r
    input Real loopMinimumSimilarity = 0.35;\r
    input Real loopMinimumAge = 5.0;\r
    input Integer loopMinimumInliers = 12;\r
    input Real loopMinimumFraction = 0.5;\r
    input Real loopInlierDistance = 0.08;\r
    input Real loopMaximumRms = 0.03;\r
    input Boolean loopCalibratedResiduals = true;\r
    input Real loopMaximumNormalizedSquared = 9.0;\r
    input Real loopMaximumPoseInnovation = 2.0;\r
    input Real loopPoseConsistencySquared = 9.0;\r
    input Boolean loopPoseConsistency = true;\r
  protected\r
    RGBDGraphProcessing.State candidate;\r
    RGBDLocalizationCatalog.Result published;\r
    RGBDGraphCaptureLedger.State ledger;\r
    RGBDVisualVocabulary.State dictionary;\r
    Real descriptorEnabled[RGBDKeyframes.featureCapacity];\r
    Boolean learnAccepted;\r
    Boolean learnRequested;\r
    Integer mappingFrameReason;\r
    Boolean ledgerAccepted;\r
    Boolean valid;\r
    Boolean captured;\r
    Integer slot;\r
  algorithm\r
    result.next := previous;\r
    result.accepted := false;\r
    result.reason := 1;\r
    result.ledgerReason := 1;\r
    result.vocabularyReason := 0;\r
    dictionary := previous.vocabulary;\r
    descriptorEnabled := zeros(RGBDKeyframes.featureCapacity);\r
    learnAccepted := false;\r
    learnRequested := false;\r
    mappingFrameReason := frameRejectionReason;\r
    // Disabled call initializes only diagnostics and its held next; payload is opaque.\r
    result.publication := RGBDLocalizationCatalog.Publish(previous.estimator.localization,proposed,measurement,\r
      producerAccepted,observationAccepted,captureAccepted,imageOn,imageEpoch,imageTime,h,initializing,\r
      frameAccepted,frameRejectionReason,false,candidatePoint,candidateEnabled,dictionary.words,dictionary.enabled);\r
    if requested then\r
      result.reason := 2;\r
      valid := RGBDGraphProcessing.Valid(previous);\r
      if valid then\r
        // Frozen dictionaries are opaque to learning, including their padding.\r
        if not dictionary.ready then\r
          learnRequested := imageOn and frameAccepted and SLAMExactRealEqual(producerAccepted,1.0)\r
            and ((SLAMExactRealEqual(observationAccepted,1.0) and SLAMExactRealEqual(captureAccepted,0.0))\r
              or (SLAMExactRealEqual(observationAccepted,0.0) and SLAMExactRealEqual(captureAccepted,1.0)))\r
            and (not initializing or SLAMExactRealEqual(observationAccepted,0.0))\r
            and RGBDLocalizationCatalog.CanAdvance(previous.estimator.localization,imageTime,h,initializing,true)\r
            and RGBDLocalizationCatalog.ImageFresh(previous.estimator.localization,imageEpoch,imageTime)\r
            and RGBDLocalizationCatalog.ValidEstimator(proposed)\r
            and RGBDLocalizationCatalog.FrameBound(previous.estimator.localization,proposed,measurement,\r
              imageEpoch,imageTime,observationAccepted,captureAccepted,frameAccepted);\r
          if learnRequested then\r
            for feature in 1:RGBDKeyframes.featureCapacity loop\r
              descriptorEnabled[feature] := if measurement.enabled[feature] then 1.0 else 0.0;\r
            end for;\r
            (dictionary,learnAccepted,result.vocabularyReason) := RGBDVisualVocabulary.Learn(previous.vocabulary,\r
              measurement.descriptor,descriptorEnabled,measurement.count,previous.estimator.localization.generation,\r
              previous.estimator.localization.sourceRevision,measurement.vocabularyVersion,true,\r
              minimumMeasuredDescriptors,minimumWordDistanceSquared);\r
          end if;\r
        else\r
          result.vocabularyReason := 3;\r
        end if;\r
        if frameAccepted and not dictionary.ready then\r
          mappingFrameReason := if RGBDLocalizationCatalog.FrameBound(previous.estimator.localization,proposed,measurement,\r
            imageEpoch,imageTime,observationAccepted,captureAccepted,true) then 9 else 8;\r
        end if;\r
        result.reason := 3;\r
        published := RGBDLocalizationCatalog.Publish(previous.estimator.localization,proposed,measurement,\r
          producerAccepted,observationAccepted,captureAccepted,imageOn,imageEpoch,imageTime,h,initializing,\r
          frameAccepted and dictionary.ready,mappingFrameReason,true,candidatePoint,candidateEnabled,dictionary.words,dictionary.enabled,\r
          minimumInterval=minimumInterval,maximumInterval=maximumInterval,\r
          translationThreshold=translationThreshold,rotationThreshold=rotationThreshold,minimumFeatures=minimumFeatures,\r
          voxelWidth=voxelWidth,mergeRadius=mergeRadius,maximumDistance=maximumDistance,\r
          tentativeLifetime=tentativeLifetime,confirmedLifetime=confirmedLifetime,\r
          confirmationObservations=confirmationObservations,maximumConfidence=maximumConfidence,maximumTentative=maximumTentative,\r
          posePositions=previous.estimator.poses.positions,poseRotations=previous.estimator.poses.rotations,\r
          poseRevision=previous.estimator.poses.revision,\r
      loopMinimumSimilarity=loopMinimumSimilarity, loopMinimumAge=loopMinimumAge, loopMinimumInliers=loopMinimumInliers, loopMinimumFraction=loopMinimumFraction, loopInlierDistance=loopInlierDistance, loopMaximumRms=loopMaximumRms, loopCalibratedResiduals=loopCalibratedResiduals, loopMaximumNormalizedSquared=loopMaximumNormalizedSquared,\r
      loopMaximumPoseInnovation=loopMaximumPoseInnovation, loopPoseConsistencySquared=loopPoseConsistencySquared, loopPoseConsistency=loopPoseConsistency);\r
        result.publication := published;\r
        if published.accepted then\r
          result.reason := 4;\r
          (ledger,ledgerAccepted,result.ledgerReason) := RGBDGraphCaptureLedger.Advance(previous.captures,\r
            previous.estimator.localization.catalog,published.next.catalog,published.next.sourceRevision,published.next.steps,true,true);\r
          if ledgerAccepted then\r
            candidate := previous;\r
            candidate.estimator.localization := published.next;\r
            candidate.captures := ledger;\r
            candidate.vocabulary := dictionary;\r
            result.reason := 5;\r
            captured := published.next.catalog.nextId == previous.estimator.localization.catalog.nextId+1;\r
            valid := published.next.catalog.nextId == previous.estimator.localization.catalog.nextId or captured;\r
            if captured then\r
              valid := valid and previous.estimator.poses.revision < identifierLimit-1;\r
              if valid then\r
                slot := max(1,RGBDKeyframes.SlotOf(published.next.catalog,\r
                  previous.estimator.localization.catalog.nextId));\r
                valid := RGBDKeyframes.SlotOf(published.next.catalog,\r
                  previous.estimator.localization.catalog.nextId) >= 1;\r
                if valid then\r
                  candidate.estimator.poses.catalogNextId := published.next.catalog.nextId;\r
                  candidate.estimator.poses.revision := previous.estimator.poses.revision+1;\r
                  candidate.estimator.poses.enabled[slot] := published.next.catalog.occupied[slot];\r
                  candidate.estimator.poses.ids[slot] := published.next.catalog.ids[slot];\r
                  candidate.estimator.poses.positions[slot,:] := published.next.catalog.bodyPositions[slot,:];\r
                  candidate.estimator.poses.rotations[slot,:,:] := published.next.catalog.bodyRotations[slot,:,:];\r
                end if;\r
              end if;\r
            end if;\r
            if valid then\r
              valid := RGBDGraphEstimatorCommit.ValidView(candidate.estimator.localization.catalog,\r
                candidate.estimator.poses,candidate.estimator.localization.sourceRevision);\r
            end if;\r
            if valid then\r
              result.reason := 6;\r
              valid := RGBDGraphProcessing.Valid(candidate);\r
              if valid then\r
                result.next := candidate;\r
                result.accepted := true;\r
                result.reason := 0;\r
              end if;\r
            end if;\r
          end if;\r
        end if;\r
        if not result.accepted then\r
          // No uncommitted inner next may escape as an authoritative receipt.\r
          if published.accepted then\r
            result.publication.rejectionReason := 2;\r
          end if;\r
          result.publication.next := previous.estimator.localization;\r
          result.publication.accepted := false;\r
          result.publication.imageCompleted := false;\r
          result.publication.mappingAccepted := false;\r
        end if;\r
      end if;\r
    end if;\r
  end Publish;\r
end RGBDLocalizationProcessing;\r
`;export{e as default};
