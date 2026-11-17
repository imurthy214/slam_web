const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Staged graph/map/filter publication. Raw captures and measured edges never\r
// change during correction. Graph pose means have a separate versioned owner.\r
// Geometry-only map outputs are not independent filter measurements.\r
package RGBDGraphEstimatorCommit\r
\r
  constant Integer nodeCapacity = RGBDKeyframes.keyframeCapacity;\r
  constant Integer dimension = RGBDKeyframes.dimension;\r
  constant Integer identifierLimit = RGBDKeyframes.identifierLimit;\r
\r
  record PoseView\r
    Integer generation; Integer sourceRevision; Integer revision; Integer catalogNextId;\r
    Boolean enabled[nodeCapacity]; Integer ids[nodeCapacity];\r
    Real positions[nodeCapacity,dimension]; Real rotations[nodeCapacity,dimension,dimension];\r
  end PoseView;\r
\r
  record State\r
    RGBDLocalizationCatalog.State localization;\r
    PoseView poses;\r
    Integer correctionRevision; Integer graphRevisionUsed;\r
  end State;\r
\r
  record Proposal\r
    PoseView poses;\r
    GraphGaugeUncertainty.Estimate selected;\r
    Integer graphRevision;\r
    Boolean optimizerAccepted;\r
  end Proposal;\r
\r
  record Result\r
    State next;\r
    Boolean accepted; Integer reason;\r
    Boolean attempted; SchmidtGraphPoseCorrection.Attempt nextAttempt;\r
    Boolean filterAccepted; Integer filterReason;\r
    Integer mapReason; Integer reprojectionReason;\r
    Integer projectedCount; Integer prunedCount;\r
  end Result;\r
\r
  function FromLocalization\r
    input RGBDLocalizationCatalog.State localization;\r
    output State result;\r
  algorithm\r
    // Bootstrap only. Reconstructing this view from raw captures after a graph\r
    // correction would erase accepted pose means and is not a restore operation.\r
    result.localization := localization;\r
    result.poses.generation := localization.generation;\r
    result.poses.sourceRevision := localization.sourceRevision;\r
    result.poses.revision := 0; result.poses.catalogNextId := localization.catalog.nextId;\r
    result.poses.enabled := localization.catalog.occupied; result.poses.ids := localization.catalog.ids;\r
    result.poses.positions := localization.catalog.bodyPositions;\r
    result.poses.rotations := localization.catalog.bodyRotations;\r
    result.correctionRevision := 0; result.graphRevisionUsed := 0;\r
  end FromLocalization;\r
\r
  function ValidView\r
    input RGBDKeyframes.Catalog catalog;\r
    input PoseView poses;\r
    input Integer sourceRevision;\r
    output Boolean valid;\r
  algorithm\r
    valid := RGBDKeyframes.ValidHeader(catalog)\r
      and poses.generation == catalog.generation and poses.sourceRevision == sourceRevision\r
      and sourceRevision >= 1 and sourceRevision <= identifierLimit\r
      and poses.revision >= 0 and poses.revision < identifierLimit\r
      and poses.catalogNextId == catalog.nextId;\r
    for slot in 1:nodeCapacity loop\r
      valid := valid and poses.enabled[slot] == catalog.occupied[slot];\r
      if poses.enabled[slot] then\r
        valid := valid and poses.ids[slot] == catalog.ids[slot]\r
          and RGBDUncertaintyProper(poses.rotations[slot,:,:]);\r
        for axis in 1:dimension loop valid := valid and abs(poses.positions[slot,axis]) <= 1e6; end for;\r
      end if;\r
    end for;\r
  end ValidView;\r
\r
  function EstimatorState\r
    input RGBDLocalizationCatalog.State localization;\r
    output SchmidtGraphPoseCorrection.State result;\r
  protected\r
    Integer slot;\r
  algorithm\r
    // Caller validates headers, exact Real integer domains and reference birth\r
    // before this conversion; no projection, registration or host algebra.\r
    result.position := localization.estimator.position; result.velocity := localization.estimator.velocity;\r
    result.rotation := localization.estimator.rotation;\r
    result.accelBias := localization.estimator.accelBias; result.gyroBias := localization.estimator.gyroBias;\r
    result.covariance := localization.estimator.covariance;\r
    result.crossCovariance := localization.estimator.crossCovariance;\r
    result.referenceCovariance := localization.estimator.referenceCovariance;\r
    result.referencePosition := localization.estimator.referencePosition;\r
    result.referenceRotation := localization.estimator.referenceRotation;\r
    result.referenceAvailable := localization.estimator.referenceAvailable == 1;\r
    result.referenceUsed := localization.estimator.referenceUsed == 1;\r
    result.generation := localization.generation; result.sourceRevision := localization.sourceRevision;\r
    result.currentId := localization.catalog.nextId-1;\r
    result.currentEpoch := localization.lastProcessedImageEpoch;\r
    result.currentCaptureSequence := localization.steps;\r
    result.referenceId := localization.referenceBirth.catalogId;\r
    result.referenceEpoch := localization.referenceBirth.epoch;\r
    result.referenceCaptureSequence := localization.referenceBirth.sequence;\r
    result.lastUsedEpoch := integer(localization.estimator.lastUsedEpoch);\r
    result.predictionTime := localization.predictionTime; result.referenceTime := 0;\r
    if result.referenceAvailable then\r
      // Retention assigns slots; an evicted reference reads no time.\r
      slot := RGBDKeyframes.SlotOf(localization.catalog,result.referenceId);\r
      if slot >= 1 then result.referenceTime := localization.catalog.imageTimes[slot]; end if;\r
    end if;\r
  end EstimatorState;\r
\r
  function Commit\r
    input State previous;\r
    input Proposal proposal;\r
    input GraphGaugeUncertainty.Binding expectedBinding;\r
    input SchmidtGraphPoseCorrection.Attempt previousAttempt;\r
    input SchmidtGraphPoseCorrection.Policy policy;\r
    input Boolean requested;\r
    input Real consistencyTolerance = 1e-6;\r
    input Real maximumConfidence = 8;\r
    output Result result;\r
  protected\r
    Boolean valid; Boolean changed; Boolean mapAccepted;\r
    Integer currentSlot; Integer referenceSlot; Integer anchorSlot;\r
    SchmidtGraphPoseCorrection.State filterState;\r
    SchmidtGraphPoseCorrection.Result filterResult;\r
    State candidate;\r
  algorithm\r
    result.next := previous; result.accepted := false; result.reason := 1;\r
    result.attempted := false; result.nextAttempt := previousAttempt;\r
    result.filterAccepted := false; result.filterReason := 0;\r
    result.mapReason := 0; result.reprojectionReason := 0;\r
    result.projectedCount := 0; result.prunedCount := 0;\r
    if requested then\r
      result.reason := 2;\r
      valid := RGBDLocalizationCatalog.ValidHeader(previous.localization)\r
        and previous.localization.initialized\r
        and RGBDLocalizationCatalog.ValidEstimator(previous.localization.estimator)\r
        and ValidView(previous.localization.catalog,previous.poses,previous.localization.sourceRevision)\r
        and previous.correctionRevision >= 0 and previous.correctionRevision < identifierLimit\r
        and previous.graphRevisionUsed >= 0 and previous.graphRevisionUsed <= previous.localization.graph.revision\r
        and previous.correctionRevision <= previous.graphRevisionUsed\r
        and ((previous.correctionRevision == 0) == (previous.graphRevisionUsed == 0))\r
        and previous.localization.catalog.nextId > 2\r
        and previous.localization.lastProcessedImageEpoch == previous.localization.catalog.lastEpoch\r
        and previous.localization.lastProcessedImageTime == previous.localization.catalog.lastTime\r
        and previous.localization.predictionTime == previous.localization.catalog.lastTime\r
        and GraphGaugeUncertainty.ValidBinding(proposal.selected.binding)\r
        and GraphGaugeUncertainty.SameBinding(proposal.selected.binding,expectedBinding)\r
        and proposal.graphRevision == previous.localization.graph.revision\r
        and expectedBinding.graphRevision == proposal.graphRevision\r
        and expectedBinding.catalogPoseRevision == previous.poses.revision\r
        and expectedBinding.generation == previous.localization.generation\r
        and expectedBinding.sourceRevision == previous.localization.sourceRevision\r
        and expectedBinding.currentId == previous.localization.catalog.nextId-1\r
        and expectedBinding.currentEpoch == previous.localization.lastProcessedImageEpoch\r
        and expectedBinding.currentTime == previous.localization.predictionTime\r
        and expectedBinding.currentCaptureSequence == previous.localization.steps\r
        and (RGBDGraphMeasurements.loopAnchoredCapture\r
          or expectedBinding.anchorId == RGBDKeyframes.OldestId(previous.localization.catalog))\r
        and previousAttempt.generation == previous.localization.generation\r
        and previousAttempt.graphRevision >= previous.graphRevisionUsed\r
        and (if previousAttempt.graphRevision == 0 then previousAttempt.factorProvenance == 0\r
          else previousAttempt.factorProvenance > 0)\r
        and proposal.graphRevision > previousAttempt.graphRevision\r
        and proposal.selected.binding.factorProvenance <> previousAttempt.factorProvenance;\r
      if valid and RGBDGraphMeasurements.loopAnchoredCapture then\r
        // The gauge is the oldest node connected to the newest keyframe.\r
        valid := expectedBinding.anchorId == RGBDGraphMeasurements.ActiveOldest(previous.localization.catalog,\r
          previous.localization.graph);\r
      end if;\r
      if valid then\r
        // A missing id maps to slot 1, which Bound refuses.\r
        currentSlot := max(1,RGBDKeyframes.SlotOf(previous.localization.catalog,expectedBinding.currentId));\r
        referenceSlot := max(1,RGBDKeyframes.SlotOf(previous.localization.catalog,expectedBinding.referenceId));\r
        anchorSlot := max(1,RGBDKeyframes.SlotOf(previous.localization.catalog,expectedBinding.anchorId));\r
        valid := RGBDGraphMeasurements.Bound(previous.localization.catalog,expectedBinding.referenceId,\r
            referenceSlot,expectedBinding.referenceEpoch)\r
          and RGBDGraphMeasurements.Bound(previous.localization.catalog,expectedBinding.anchorId,\r
            anchorSlot,expectedBinding.anchorEpoch)\r
          and expectedBinding.referenceTime == previous.localization.catalog.imageTimes[referenceSlot]\r
          and expectedBinding.anchorTime == previous.localization.catalog.imageTimes[anchorSlot];\r
        if previous.localization.estimator.referenceAvailable == 1 then\r
          valid := valid and previous.localization.referenceBirth.catalogId == expectedBinding.referenceId\r
            and previous.localization.referenceBirth.epoch == expectedBinding.referenceEpoch\r
            and previous.localization.referenceBirth.sequence == expectedBinding.referenceCaptureSequence;\r
        end if;\r
      end if;\r
      if valid then\r
        result.attempted := true;\r
        result.nextAttempt.generation := previous.localization.generation;\r
        result.nextAttempt.graphRevision := proposal.graphRevision;\r
        result.nextAttempt.factorProvenance := proposal.selected.binding.factorProvenance;\r
        result.reason := 3;\r
        valid := proposal.optimizerAccepted\r
          and RGBDGraphMeasurements.ValidState(previous.localization.catalog,previous.localization.graph)\r
          and ValidView(previous.localization.catalog,proposal.poses,previous.localization.sourceRevision)\r
          and consistencyTolerance > 0 and consistencyTolerance <= 1e-6\r
          and maximumConfidence >= 2 and maximumConfidence <= 100 and floor(maximumConfidence) == maximumConfidence;\r
      end if;\r
      if valid then\r
        result.reason := 4; changed := false;\r
        for slot in 1:nodeCapacity loop\r
          if previous.poses.enabled[slot] then\r
            for axis in 1:dimension loop\r
              changed := changed or proposal.poses.positions[slot,axis] <> previous.poses.positions[slot,axis];\r
              for column in 1:dimension loop\r
                changed := changed or proposal.poses.rotations[slot,axis,column] <> previous.poses.rotations[slot,axis,column];\r
              end for;\r
            end for;\r
          end if;\r
        end for;\r
        valid := proposal.poses.revision == previous.poses.revision+(if changed then 1 else 0);\r
        // The optimizer fixes the chronological first row in the same ENU gauge.\r
        for axis in 1:dimension loop\r
          valid := valid and proposal.poses.positions[anchorSlot,axis] == previous.poses.positions[anchorSlot,axis];\r
          for column in 1:dimension loop\r
            valid := valid and proposal.poses.rotations[anchorSlot,axis,column] == previous.poses.rotations[anchorSlot,axis,column];\r
          end for;\r
        end for;\r
        for node in 1:2 loop\r
          for axis in 1:dimension loop\r
            valid := valid and abs(proposal.selected.positions[node,axis]\r
              -proposal.poses.positions[if node == 1 then currentSlot else referenceSlot,axis]) <= consistencyTolerance;\r
            for column in 1:dimension loop\r
              valid := valid and abs(proposal.selected.rotations[node,axis,column]\r
                -proposal.poses.rotations[if node == 1 then currentSlot else referenceSlot,axis,column]) <= consistencyTolerance;\r
            end for;\r
          end for;\r
        end for;\r
      end if;\r
      if valid then\r
        filterState := EstimatorState(previous.localization);\r
        filterResult := SchmidtGraphPoseCorrection.Correct(filterState,proposal.selected,expectedBinding,\r
          previousAttempt,policy,true);\r
        result.filterAccepted := filterResult.accepted; result.filterReason := filterResult.reason;\r
        result.reason := 5; valid := filterResult.accepted;\r
      end if;\r
      if valid then\r
        candidate := previous; candidate.poses.revision := proposal.poses.revision;\r
        for slot in 1:nodeCapacity loop\r
          if previous.poses.enabled[slot] then\r
            candidate.poses.positions[slot,:] := proposal.poses.positions[slot,:];\r
            candidate.poses.rotations[slot,:,:] := proposal.poses.rotations[slot,:,:];\r
          end if;\r
        end for;\r
        candidate.localization.estimator.position := filterResult.next.position;\r
        candidate.localization.estimator.velocity := filterResult.next.velocity;\r
        candidate.localization.estimator.rotation := filterResult.next.rotation;\r
        candidate.localization.estimator.accelBias := filterResult.next.accelBias;\r
        candidate.localization.estimator.gyroBias := filterResult.next.gyroBias;\r
        candidate.localization.estimator.covariance := filterResult.next.covariance;\r
        candidate.localization.estimator.crossCovariance := filterResult.next.crossCovariance;\r
        candidate.localization.estimator.referenceCovariance := filterResult.next.referenceCovariance;\r
        candidate.localization.estimator.referencePosition := filterResult.next.referencePosition;\r
        candidate.localization.estimator.referenceRotation := filterResult.next.referenceRotation;\r
        // Preserve acquisition clocks, raw capture poses/noise/calibration,\r
        // every descriptor, all measured edges and the consumed-image ledger.\r
        (candidate.localization.map.point,candidate.localization.map.occupied,candidate.localization.map.confidence,\r
          candidate.localization.map.lastSeen,candidate.localization.map.lastFrame,candidate.localization.map.localPoint,\r
          candidate.localization.map.anchorId,candidate.localization.map.anchorSlot,\r
          mapAccepted,result.mapReason,result.reprojectionReason,result.projectedCount,result.prunedCount) :=\r
          RGBDLandmarkCatalog.Synchronize(\r
            previous.localization.map.point,previous.localization.map.occupied,previous.localization.map.confidence,\r
            previous.localization.map.lastSeen,previous.localization.map.lastFrame,previous.localization.map.localPoint,\r
            previous.localization.map.anchorId,previous.localization.map.anchorSlot,\r
            previous.localization.map.generation,previous.poses.revision,\r
            previous.poses.enabled,previous.poses.ids,previous.poses.positions,previous.poses.rotations,\r
            proposal.poses.enabled,proposal.poses.ids,proposal.poses.positions,proposal.poses.rotations,\r
            previous.localization.generation,proposal.poses.revision,true,true,false,\r
            previous.localization.map.imageTime,previous.localization.map.frame,maximumConfidence,1e6,consistencyTolerance);\r
        result.reason := 6; valid := mapAccepted;\r
        if valid then\r
          candidate.correctionRevision := previous.correctionRevision+1;\r
          candidate.graphRevisionUsed := proposal.graphRevision;\r
          result.reason := 7;\r
          valid := RGBDLocalizationCatalog.ValidHeader(candidate.localization)\r
            and RGBDLocalizationCatalog.ValidEstimator(candidate.localization.estimator);\r
          if valid then result.next := candidate; result.accepted := true; result.reason := 0; end if;\r
        end if;\r
      end if;\r
    end if;\r
    if not result.accepted then result.projectedCount := 0; result.prunedCount := 0; end if;\r
  end Commit;\r
end RGBDGraphEstimatorCommit;\r
`;export{e as default};
