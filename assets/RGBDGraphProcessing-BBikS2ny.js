const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Source-owned graph correction and persistent session state. These functions\r
// compose the actual optimizer, selected bound, gauge transport and atomic\r
// filter/map commit; the host supplies neither a solved graph nor a proposal.\r
package RGBDGraphProcessing\r
\r
  constant Integer nodeCapacity = RGBDKeyframes.keyframeCapacity;\r
  constant Integer dimension = RGBDKeyframes.dimension;\r
  constant Integer identifierLimit = RGBDKeyframes.identifierLimit;\r
\r
  record State\r
    RGBDGraphEstimatorCommit.State estimator;\r
    RGBDVisualVocabulary.State vocabulary "Frozen appearance owner shared by every retained histogram";\r
    RGBDGraphCaptureLedger.State captures;\r
    SchmidtGraphPoseCorrection.Attempt attempt;\r
    RGBDGraphAnchorBound.Estimate anchor;\r
    GraphGaugeUncertainty.Estimate selected;\r
  end State;\r
\r
  record Policy\r
    SchmidtGraphPoseCorrection.Policy filter;\r
    Integer maximumIterations;\r
    Integer maximumPCG;\r
    Integer maximumBacktracks;\r
    Real initialDamping;\r
    Real maximumPositionStep;\r
    Real maximumAngleStep;\r
    Real pcgTolerance;\r
    Integer covariancePCG;\r
    Real covarianceTolerance;\r
    Real anchorWeight;\r
    Real anchorPositionLimit;\r
    Real anchorAngleLimit;\r
    Real transportWeight;\r
    Real consistencyTolerance;\r
    Real maximumConfidence;\r
  end Policy;\r
\r
  record Result\r
    State next;\r
    Boolean accepted;\r
    Integer reason "0 accepted;1 idle;2 owner/chronology;3 graph problem;4 optimizer;5 anchor;6 selection;7 commit;8 no visual path between current and reference;9 no fresh verified loop";\r
    Boolean attempted;\r
    Integer commitReason;\r
    Integer filterReason;\r
    Integer mapReason;\r
    Integer anchorReason;\r
    Integer selectionReason;\r
    Integer covarianceStatus;\r
    Real optimizerStatus;\r
    Real costBefore;\r
    Real costAfter;\r
    Real acceptedIterations;\r
    Real pcgIterations;\r
    Integer projectedCount;\r
    Integer prunedCount;\r
    Boolean roundoffCertified;\r
  end Result;\r
\r
  function DefaultPolicy\r
    output Policy result;\r
  algorithm\r
    result.filter := SchmidtGraphPoseCorrection.DefaultPolicy();\r
    result.maximumIterations := 8;\r
    result.maximumPCG := 48;\r
    result.maximumBacktracks := 8;\r
    result.initialDamping := 1e-3;\r
    result.maximumPositionStep := 0.5;\r
    result.maximumAngleStep := 0.15;\r
    result.pcgTolerance := 1e-6;\r
    result.covariancePCG := 48;\r
    result.covarianceTolerance := 1e-10;\r
    result.anchorWeight := 0.5;\r
    result.anchorPositionLimit := 5.0;\r
    result.anchorAngleLimit := 0.35;\r
    result.transportWeight := 0.5;\r
    result.consistencyTolerance := 1e-6;\r
    result.maximumConfidence := 8;\r
  end DefaultPolicy;\r
\r
  function EmptySelected\r
    input Integer generation;\r
    input Integer sourceRevision;\r
    output GraphGaugeUncertainty.Estimate result;\r
  algorithm\r
    result.binding.generation := generation;\r
    result.binding.sourceRevision := sourceRevision;\r
    result.binding.graphRevision := 0;\r
    result.binding.catalogPoseRevision := 0;\r
    result.binding.anchorId := 0;\r
    result.binding.anchorEpoch := -1;\r
    result.binding.anchorCaptureSequence := 0;\r
    result.binding.currentId := 0;\r
    result.binding.currentEpoch := -1;\r
    result.binding.currentCaptureSequence := 0;\r
    result.binding.referenceId := 0;\r
    result.binding.referenceEpoch := -1;\r
    result.binding.referenceCaptureSequence := 0;\r
    result.binding.chart := GraphGaugeUncertainty.chartENUPositionRightLocalAttitude;\r
    result.binding.anchorTime := 0;\r
    result.binding.currentTime := 0;\r
    result.binding.referenceTime := 0;\r
    result.binding.factorProvenance := 0;\r
    result.binding.anchorBoundProvenance := 0;\r
    result.positions := zeros(2,dimension);\r
    result.covariance := zeros(12,12);\r
    for node in 1:2 loop\r
      result.rotations[node,:,:] := identity(dimension);\r
    end for;\r
  end EmptySelected;\r
\r
  function Empty\r
    input RGBDLocalizationCatalog.State localization;\r
    output State result;\r
  algorithm\r
    // A fresh constructor is not a restore operation. Reload carries the\r
    // complete State, including corrected means and consumed attempts.\r
    assert(RGBDLocalizationCatalog.ValidHeader(localization)\r
      and RGBDLocalizationCatalog.ValidEstimator(localization.estimator) and not localization.initialized\r
      and localization.steps == 0 and localization.catalog.nextId == 1,\r
      "GraphProcessing.Empty requires a fresh empty localization owner");\r
    result.estimator := RGBDGraphEstimatorCommit.FromLocalization(localization);\r
    result.vocabulary := RGBDVisualVocabulary.Empty(localization.generation,\r
      localization.sourceRevision,localization.catalog.vocabularyVersion);\r
    result.captures := RGBDGraphCaptureLedger.Empty(localization.generation,localization.sourceRevision);\r
    result.attempt.generation := localization.generation;\r
    result.attempt.graphRevision := 0;\r
    result.attempt.factorProvenance := 0;\r
    result.anchor := RGBDGraphAnchorBound.Empty(localization.generation,localization.sourceRevision);\r
    result.selected := EmptySelected(localization.generation,localization.sourceRevision);\r
  end Empty;\r
\r
  function Valid\r
    input State state;\r
    output Boolean valid;\r
  algorithm\r
    valid := RGBDLocalizationCatalog.ValidHeader(state.estimator.localization)\r
      and RGBDLocalizationCatalog.ValidEstimator(state.estimator.localization.estimator)\r
      and RGBDVisualVocabulary.Valid(state.vocabulary)\r
      and state.vocabulary.generation == state.estimator.localization.generation\r
      and state.vocabulary.sourceRevision == state.estimator.localization.sourceRevision\r
      and state.vocabulary.version == state.estimator.localization.catalog.vocabularyVersion\r
      and (state.estimator.localization.catalog.nextId == 1 or state.vocabulary.ready)\r
      and RGBDGraphEstimatorCommit.ValidView(state.estimator.localization.catalog,\r
        state.estimator.poses,state.estimator.localization.sourceRevision)\r
      and RGBDGraphCaptureLedger.Valid(state.captures,state.estimator.localization.catalog,\r
        state.estimator.localization.sourceRevision,state.estimator.localization.steps)\r
      and state.estimator.correctionRevision >= 0 and state.estimator.correctionRevision < identifierLimit\r
      and state.estimator.graphRevisionUsed >= 0\r
      and state.estimator.graphRevisionUsed <= state.estimator.localization.graph.revision\r
      and state.estimator.correctionRevision <= state.estimator.graphRevisionUsed\r
      and ((state.estimator.correctionRevision == 0) == (state.estimator.graphRevisionUsed == 0))\r
      and state.attempt.generation == state.estimator.localization.generation\r
      and state.attempt.graphRevision >= state.estimator.graphRevisionUsed\r
      and state.attempt.graphRevision <= state.estimator.localization.graph.revision\r
      and state.attempt.factorProvenance == state.attempt.graphRevision\r
      and state.anchor.binding.generation == state.estimator.localization.generation\r
      and state.anchor.binding.sourceRevision == state.estimator.localization.sourceRevision\r
      and state.selected.binding.generation == state.estimator.localization.generation\r
      and state.selected.binding.sourceRevision == state.estimator.localization.sourceRevision;\r
    // These are receipts of the last ACCEPTED correction. Ordinary capture\r
    // may advance graph/pose revisions or evict their anchor. Never treat a\r
    // historical receipt as a bound on today's graph: Correct regenerates it.\r
    if state.estimator.correctionRevision == 0 then\r
      valid := valid and state.anchor.binding.provenance == 0\r
        and state.selected.binding.graphRevision == 0;\r
    else\r
      valid := valid and GraphGaugeUncertainty.ValidBinding(state.selected.binding)\r
        and state.selected.binding.graphRevision == state.estimator.graphRevisionUsed\r
        and state.selected.binding.factorProvenance == state.estimator.graphRevisionUsed\r
        and state.selected.binding.anchorBoundProvenance == state.anchor.binding.provenance\r
        and state.anchor.binding.provenance == state.estimator.graphRevisionUsed\r
        and state.anchor.binding.id == state.selected.binding.anchorId\r
        and state.anchor.binding.id <= identifierLimit\r
        and state.anchor.binding.slot >= 1 and state.anchor.binding.slot <= nodeCapacity\r
        // Retention assigns slots: a retained anchor id must sit in its bound\r
        // slot; an evicted one is refused later by the catalog Bound checks.\r
        and (RGBDKeyframes.SlotOf(state.estimator.localization.catalog,state.anchor.binding.id) == 0\r
          or RGBDKeyframes.SlotOf(state.estimator.localization.catalog,state.anchor.binding.id) == state.anchor.binding.slot)\r
        and state.anchor.binding.epoch == state.selected.binding.anchorEpoch\r
        and state.anchor.binding.sequence == state.selected.binding.anchorCaptureSequence\r
        and state.anchor.binding.imageTime == state.selected.binding.anchorTime\r
        and state.anchor.binding.catalogPoseRevision == state.selected.binding.catalogPoseRevision\r
        and state.anchor.binding.catalogPoseRevision <= state.estimator.poses.revision;\r
    end if;\r
  end Valid;\r
\r
  function Correct\r
    input State previous;\r
    input Policy policy;\r
    input Boolean requested;\r
    output Result result;\r
  protected\r
    Boolean valid;\r
    Boolean anchorAccepted;\r
    Boolean contextAccepted;\r
    Boolean freshLoop;\r
    Boolean changed;\r
    Integer oldest;\r
    Integer currentId;\r
    Integer referenceId;\r
    Integer anchorSlot;\r
    Integer currentSlot;\r
    Integer referenceSlot;\r
    Integer currentNode;\r
    Integer referenceNode;\r
    Integer currentRow;\r
    Integer referenceRow;\r
    Integer contextReason;\r
    Integer slot;\r
    RGBDGraphMeasurements.Problem problem;\r
    RGBDGraphEstimatorCommit.Proposal proposal;\r
    RGBDGraphEstimatorCommit.Result committed;\r
    RGBDGraphSelectedGauge.Context context;\r
    RGBDGraphSelectedGauge.Result selected;\r
    RGBDGraphAnchorBound.Estimate anchor;\r
    GraphGaugeUncertainty.Binding binding;\r
    Real finalPosition[nodeCapacity,dimension];\r
    Real finalRotation[nodeCapacity,dimension,dimension];\r
    Real activeNodes;\r
    Real activeEdges;\r
  algorithm\r
    result.next := previous;\r
    result.accepted := false;\r
    result.reason := 1;\r
    result.attempted := false;\r
    result.commitReason := 0;\r
    result.filterReason := 0;\r
    result.mapReason := 0;\r
    result.anchorReason := 0;\r
    result.selectionReason := 0;\r
    result.covarianceStatus := 0;\r
    result.optimizerStatus := 0;\r
    result.costBefore := 0;\r
    result.costAfter := 0;\r
    result.acceptedIterations := 0;\r
    result.pcgIterations := 0;\r
    result.projectedCount := 0;\r
    result.prunedCount := 0;\r
    result.roundoffCertified := false;\r
    if requested then\r
      result.reason := 2;\r
      valid := Valid(previous) and previous.estimator.localization.initialized\r
        and previous.estimator.localization.catalog.nextId > 2\r
        and previous.estimator.localization.estimator.referenceAvailable == 1\r
        and previous.estimator.localization.referenceBirth.catalogId > 0\r
        and previous.estimator.localization.graph.revision > previous.attempt.graphRevision\r
        and previous.estimator.localization.lastProcessedImageEpoch == previous.estimator.localization.catalog.lastEpoch\r
        and previous.estimator.localization.lastProcessedImageTime == previous.estimator.localization.catalog.lastTime\r
        and previous.estimator.localization.predictionTime == previous.estimator.localization.catalog.lastTime\r
        and previous.estimator.poses.revision < identifierLimit-1;\r
      if valid then\r
        // Sequential image motion has already updated localization. A new\r
        // capture revision alone is not a new loop correction event. Require\r
        // a measured loop whose current identity is this newly admitted node;\r
        // retained historical loops and structural bridges do not qualify.\r
        freshLoop := false;\r
        for edge in 1:RGBDGraphMeasurements.edgeCapacity loop\r
          freshLoop := freshLoop or (previous.estimator.localization.graph.edges[edge].enabled\r
            and previous.estimator.localization.graph.edges[edge].kind == 2\r
            and previous.estimator.localization.graph.edges[edge].currentId\r
              == previous.estimator.localization.catalog.nextId-1);\r
        end for;\r
        result.reason := 9; valid := freshLoop;\r
      end if;\r
      if valid then\r
        oldest := RGBDKeyframes.OldestId(previous.estimator.localization.catalog);\r
        currentId := previous.estimator.localization.catalog.nextId-1;\r
        referenceId := previous.estimator.localization.referenceBirth.catalogId;\r
        // Slots come from the catalog; a missing id maps to slot 1 and the\r
        // Bound check below refuses it.\r
        anchorSlot := max(1,RGBDKeyframes.SlotOf(previous.estimator.localization.catalog,oldest));\r
        currentSlot := max(1,RGBDKeyframes.NewestSlot(previous.estimator.localization.catalog));\r
        referenceSlot := max(1,RGBDKeyframes.SlotOf(previous.estimator.localization.catalog,referenceId));\r
        valid := RGBDGraphMeasurements.Bound(previous.estimator.localization.catalog,referenceId,\r
            referenceSlot,previous.estimator.localization.referenceBirth.epoch)\r
          and previous.captures.sequences[currentSlot] == previous.estimator.localization.steps\r
          and previous.captures.sequences[referenceSlot] == previous.estimator.localization.referenceBirth.sequence;\r
      end if;\r
      if valid then\r
        result.reason := 3;\r
        problem := RGBDGraphMeasurements.PrepareProblem(previous.estimator.localization.catalog,\r
          previous.estimator.localization.graph,true);\r
        valid := problem.accepted;\r
      end if;\r
      if valid and RGBDGraphMeasurements.loopAnchoredCapture then\r
        // The gauge is row 1, the oldest node still connected to the newest.\r
        oldest := problem.nodeId[1]; anchorSlot := problem.catalogSlot[1];\r
      end if;\r
      if valid then\r
        // Warm-start from the durable corrected view, not immutable raw\r
        // captures. The chronological fixed row is mapped by catalogSlot.\r
        for node in 1:nodeCapacity loop\r
          if node <= problem.nodeCount then\r
            slot := problem.catalogSlot[node];\r
            problem.positions[node,:] := previous.estimator.poses.positions[slot,:];\r
            problem.rotations[node,:,:] := previous.estimator.poses.rotations[slot,:,:];\r
          end if;\r
        end for;\r
        result.reason := 4;\r
        (finalPosition,finalRotation,result.optimizerStatus,result.costBefore,result.costAfter,\r
          result.acceptedIterations,result.pcgIterations,activeNodes,activeEdges) :=\r
          OptimizeModelicaPoseGraph(problem.positions,problem.rotations,problem.nodeMask,\r
            problem.edgeMask,problem.fromNode,problem.toNode,problem.measuredTranslation,\r
            problem.measuredRotation,problem.information,policy.maximumIterations,policy.maximumPCG,\r
            policy.maximumBacktracks,policy.initialDamping,policy.maximumPositionStep,\r
            policy.maximumAngleStep,policy.pcgTolerance);\r
        valid := (result.optimizerStatus == 1 or result.optimizerStatus == 2)\r
          and result.costAfter >= 0 and result.costAfter <= result.costBefore\r
          and activeNodes == problem.nodeCount and activeEdges == problem.edgeCount;\r
        proposal.poses := previous.estimator.poses;\r
        changed := false;\r
        for node in 1:nodeCapacity loop\r
          if node <= problem.nodeCount then\r
            slot := problem.catalogSlot[node];\r
            valid := valid and RGBDUncertaintyProper(finalRotation[node,:,:]);\r
            for axis in 1:dimension loop\r
              valid := valid and abs(finalPosition[node,axis]) <= 1e6;\r
              changed := changed or finalPosition[node,axis] <> proposal.poses.positions[slot,axis];\r
              for column in 1:dimension loop\r
                changed := changed or finalRotation[node,axis,column] <> proposal.poses.rotations[slot,axis,column];\r
              end for;\r
            end for;\r
            proposal.poses.positions[slot,:] := finalPosition[node,:];\r
            proposal.poses.rotations[slot,:,:] := finalRotation[node,:,:];\r
          end if;\r
        end for;\r
        // The gauge is exact, not merely close after a numerical update.\r
        valid := valid and max(abs(proposal.poses.positions[anchorSlot,:]\r
          -previous.estimator.poses.positions[anchorSlot,:])) == 0\r
          and max(abs(proposal.poses.rotations[anchorSlot,:,:]\r
          -previous.estimator.poses.rotations[anchorSlot,:,:])) == 0;\r
        proposal.poses.revision := previous.estimator.poses.revision+(if changed then 1 else 0);\r
        proposal.graphRevision := previous.estimator.localization.graph.revision;\r
        proposal.optimizerAccepted := valid;\r
      end if;\r
      if valid then\r
        result.reason := 5;\r
        (anchor,anchorAccepted,result.anchorReason) := RGBDGraphAnchorBound.FromCapture(\r
          previous.anchor,previous.estimator.localization.catalog,previous.captures,\r
          previous.estimator.localization.sourceRevision,previous.estimator.localization.steps,\r
          previous.estimator.poses.revision,proposal.poses.positions[anchorSlot,:],\r
          proposal.poses.rotations[anchorSlot,:,:],proposal.graphRevision,\r
          policy.anchorWeight,policy.anchorPositionLimit,policy.anchorAngleLimit,true,\r
          gaugeId=if RGBDGraphMeasurements.loopAnchoredCapture then oldest else 0);\r
        valid := anchorAccepted;\r
      end if;\r
      if valid then\r
        // Context's revision binds the input pose owner. Proposal poses may\r
        // advance it only at atomic Commit, after all bound checks succeed.\r
        context.generation := previous.estimator.localization.generation;\r
        context.sourceRevision := previous.estimator.localization.sourceRevision;\r
        context.graphRevision := 0;\r
        context.catalogPoseRevision := 0;\r
        context.captureIds := fill(0,nodeCapacity);\r
        context.captureSequences := fill(0,nodeCapacity);\r
        (context,contextAccepted,contextReason) := RGBDGraphSelectedGauge.ContextFromLedger(\r
          context,previous.captures,previous.estimator.localization.catalog,\r
          previous.estimator.localization.graph,previous.estimator.localization.sourceRevision,\r
          previous.estimator.localization.steps,previous.estimator.poses.revision,true);\r
        result.reason := 6;\r
        valid := contextAccepted;\r
      end if;\r
      if valid then\r
        // Rows follow ascending retained id, so ids no longer give rows by\r
        // subtraction. Loop-anchored rows also skip detached nodes; a\r
        // reference outside the solve stays 0 and selection refuses it.\r
        currentRow := 0; referenceRow := 0;\r
        for node in 1:nodeCapacity loop\r
          if node <= problem.nodeCount then\r
            if problem.nodeId[node] == currentId then currentRow := node; end if;\r
            if problem.nodeId[node] == referenceId then referenceRow := node; end if;\r
          end if;\r
        end for;\r
        currentNode := currentRow; referenceNode := referenceRow;\r
        // Odometry bridges never enter the solve, so a reference\r
        // reachable only through one has no row and the filter is not corrected.\r
        if referenceRow == 0 or currentRow == 0 then result.reason := 8; end if;\r
        binding.generation := context.generation;\r
        binding.sourceRevision := context.sourceRevision;\r
        binding.graphRevision := context.graphRevision;\r
        binding.catalogPoseRevision := context.catalogPoseRevision;\r
        binding.anchorId := oldest;\r
        binding.anchorEpoch := previous.captures.epochs[anchorSlot];\r
        binding.anchorCaptureSequence := previous.captures.sequences[anchorSlot];\r
        binding.anchorTime := previous.captures.times[anchorSlot];\r
        binding.currentId := currentId;\r
        binding.currentEpoch := previous.captures.epochs[currentSlot];\r
        binding.currentCaptureSequence := previous.captures.sequences[currentSlot];\r
        binding.currentTime := previous.captures.times[currentSlot];\r
        binding.referenceId := referenceId;\r
        binding.referenceEpoch := previous.captures.epochs[referenceSlot];\r
        binding.referenceCaptureSequence := previous.captures.sequences[referenceSlot];\r
        binding.referenceTime := previous.captures.times[referenceSlot];\r
        binding.chart := GraphGaugeUncertainty.chartENUPositionRightLocalAttitude;\r
        // Revision-scoped provenance is generated here and cannot be a host\r
        // assertion of a successful optimizer or an arbitrary covariance.\r
        binding.factorProvenance := proposal.graphRevision;\r
        binding.anchorBoundProvenance := anchor.binding.provenance;\r
        selected := RGBDGraphSelectedGauge.SelectFromAnchor(previous.selected,\r
          previous.estimator.localization.catalog,previous.estimator.localization.graph,context,\r
          proposal.poses.positions,proposal.poses.rotations,currentNode,referenceNode,binding,\r
          anchor,proposal.graphRevision,policy.transportWeight,true,\r
          policy.covariancePCG,policy.covarianceTolerance);\r
        result.selectionReason := selected.rejectionReason;\r
        result.covarianceStatus := selected.covarianceStatus;\r
        result.roundoffCertified := selected.roundoffCertified;\r
        valid := selected.accepted;\r
      end if;\r
      if valid then\r
        result.reason := 7;\r
        proposal.selected := selected.estimate;\r
        committed := RGBDGraphEstimatorCommit.Commit(previous.estimator,proposal,binding,\r
          previous.attempt,policy.filter,true,policy.consistencyTolerance,policy.maximumConfidence);\r
        result.attempted := committed.attempted;\r
        result.commitReason := committed.reason;\r
        result.filterReason := committed.filterReason;\r
        result.mapReason := committed.mapReason;\r
        // An evaluated graph/filter factor is consumed even when the filter\r
        // or final map refuses. Preserve the whole numerical owner on refusal.\r
        if committed.attempted then\r
          result.next.attempt := committed.nextAttempt;\r
        end if;\r
        if committed.accepted then\r
          result.next.estimator := committed.next;\r
          result.next.anchor := anchor;\r
          result.next.selected := selected.estimate;\r
          result.projectedCount := committed.projectedCount;\r
          result.prunedCount := committed.prunedCount;\r
          result.accepted := true;\r
          result.reason := 0;\r
        end if;\r
      end if;\r
    end if;\r
  end Correct;\r
end RGBDGraphProcessing;\r
`;export{e as default};
