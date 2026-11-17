const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// One frame proposal. Expensive retrieval/registration runs only on capture.\r
// Both branches remain proposals for the enclosing estimator's atomic commit.\r
package RGBDCatalogFrame\r
\r
  function Advance\r
    input RGBDKeyframes.Catalog catalog;\r
    input RGBDGraphMeasurements.State graph;\r
    input RGBDCatalogMapping.State map;\r
    input RGBDKeyframes.Frame measurement;\r
    input Real vocabulary[RGBDKeyframes.wordCapacity,RGBDKeyframes.descriptorSize];\r
    input Real vocabularyEnabled[RGBDKeyframes.wordCapacity];\r
    input Real candidatePoint[RGBDKeyframes.featureCapacity,RGBDKeyframes.dimension];\r
    input Real candidateEnabled[RGBDKeyframes.featureCapacity];\r
    input Boolean imageFresh;\r
    input Real poseAccepted;\r
    input Boolean requested;\r
    input Real minimumInterval = 0.5; input Real maximumInterval = 2.0;\r
    input Real translationThreshold = 0.6; input Real rotationThreshold = 0.25;\r
    input Integer minimumFeatures = 12;\r
    input Integer seeds[RGBDKeyframeRetrieval.proposalCapacity] = fill(7,RGBDKeyframeRetrieval.proposalCapacity);\r
    input Integer sequentialSeed = 7;\r
    input Real maximumWordDistanceSquared = 0.8; input Integer minimumAssignments = 8;\r
    input Real minimumSimilarity = 0.35; input Real minimumAge = 5.0;\r
    input Integer trials = 96; input Integer refinements = 4;\r
    input Integer minimumInliers = 12; input Real minimumFraction = 0.5;\r
    input Real inlierDistance = 0.08; input Real maximumRms = 0.03;\r
    input Real descriptorRatio = 0.8; input Real maximumDescriptorDistance = 0.8;\r
    input Real registrationCoordinateLimit = 100.0; input Real rankTolerance = 1e-8;\r
    input Real localizationSigma = 0.5; input Real depthInflation = 1.0; input Real minimumPivot = 1e-10;\r
    input Real coordinateLimit = 1e6; input Real voxelWidth = 0.25;\r
    input Real mergeRadius = 0.15; input Real maximumDistance = 80.0;\r
    input Real tentativeLifetime = 0.5; input Real confirmedLifetime = 5.0;\r
    input Real confirmationObservations = 3.0; input Real maximumConfidence = 8.0;\r
    input Real maximumTentative = 700.0; input Real consistencyTolerance = 1e-6;\r
    input Real nodePosition[RGBDKeyframes.keyframeCapacity,3] = catalog.bodyPositions;\r
    input Real nodeRotation[RGBDKeyframes.keyframeCapacity,3,3] = catalog.bodyRotations;\r
    input Integer poseRevision = map.catalogRevision;\r
    input Boolean poseConsistentLoops = true "Screen repeated-place aliases against retained pose uncertainty";\r
    output RGBDCatalogMapping.Result result;\r
    output RGBDKeyframePolicy.Decision decision;\r
    input Real loopMinimumSimilarity = minimumSimilarity;\r
    input Real loopMinimumAge = minimumAge;\r
    input Integer loopMinimumInliers = minimumInliers;\r
    input Real loopMinimumFraction = minimumFraction;\r
    input Real loopInlierDistance = inlierDistance;\r
    input Real loopMaximumRms = maximumRms;\r
    input Boolean loopCalibratedResiduals = true;\r
    input Real loopMaximumNormalizedSquared = 9.0;\r
    input Real loopMaximumPoseInnovation = 2.0;\r
    input Real loopPoseConsistencySquared = 9.0;\r
    input Boolean loopPoseConsistency = poseConsistentLoops;\r
  protected\r
    RGBDCatalogGraphCapture.Result visual;\r
    RGBDKeyframes.Catalog policyCatalog;\r
  algorithm\r
    policyCatalog := catalog;\r
    policyCatalog.bodyPositions := nodePosition; policyCatalog.bodyRotations := nodeRotation;\r
    decision := RGBDKeyframePolicy.Select(policyCatalog,measurement,imageFresh,poseAccepted,requested,\r
      minimumInterval,maximumInterval,translationThreshold,rotationThreshold,minimumFeatures,coordinateLimit);\r
    if requested and decision.valid and decision.captureRequested then\r
      visual := RGBDCatalogGraphCapture.Capture(catalog,measurement,vocabulary,vocabularyEnabled,graph,\r
        true,seeds,sequentialSeed,maximumWordDistanceSquared,minimumAssignments,minimumSimilarity,minimumAge,\r
        trials,refinements,minimumInliers,minimumFraction,inlierDistance,maximumRms,descriptorRatio,\r
        maximumDescriptorDistance,registrationCoordinateLimit,rankTolerance,localizationSigma,depthInflation,minimumPivot,\r
        poseConsistentLoops=poseConsistentLoops,\r
        loopMinimumSimilarity=loopMinimumSimilarity, loopMinimumAge=loopMinimumAge, loopMinimumInliers=loopMinimumInliers, loopMinimumFraction=loopMinimumFraction, loopInlierDistance=loopInlierDistance, loopMaximumRms=loopMaximumRms, loopCalibratedResiduals=loopCalibratedResiduals, loopMaximumNormalizedSquared=loopMaximumNormalizedSquared,\r
        loopMaximumPoseInnovation=loopMaximumPoseInnovation, loopPoseConsistencySquared=loopPoseConsistencySquared, loopPoseConsistency=loopPoseConsistency);\r
      if visual.rejectionReason == 4 and visual.graphDiagnostics.rejectionReason == 4\r
          and (visual.sequentialDiagnostics.rejectionReason == 7\r
            or visual.sequentialDiagnostics.rejectionReason == 11) then\r
        // Failed geometric consensus adds no keyframe or edge. The admitted\r
        // observation can still update landmarks against the retained anchors.\r
        result := RGBDCatalogObservation.Update(catalog,graph,map,measurement,candidatePoint,candidateEnabled,\r
          poseAccepted,true,coordinateLimit,voxelWidth,mergeRadius,maximumDistance,\r
          tentativeLifetime,confirmedLifetime,confirmationObservations,maximumConfidence,maximumTentative,consistencyTolerance,\r
          nodePosition,nodeRotation,poseRevision);\r
      else\r
        result := RGBDCatalogMapping.Capture(catalog,graph,map,visual,candidatePoint,candidateEnabled,\r
          poseAccepted,true,coordinateLimit,voxelWidth,mergeRadius,maximumDistance,tentativeLifetime,confirmedLifetime,\r
          confirmationObservations,maximumConfidence,maximumTentative,consistencyTolerance,nodePosition,nodeRotation,poseRevision);\r
      end if;\r
      result.diagnostics.retiredLoopFactors := if result.accepted then visual.retiredLoopFactors else 0;\r
      result.diagnostics.keyframeRejectionReason := visual.rejectionReason;\r
      result.diagnostics.sequentialRejectionReason := visual.sequentialDiagnostics.rejectionReason;\r
      result.diagnostics.loopAttempted := true;\r
      result.diagnostics.loopGraphReason := visual.graphDiagnostics.rejectionReason;\r
      result.diagnostics.loopRetrievalReason := visual.loopDiagnostics.retrievalRejectionReason;\r
      result.diagnostics.loopCandidateCount := visual.loopDiagnostics.candidateCount;\r
      result.diagnostics.loopCandidateReferenceId := visual.loopDiagnostics.candidateId;\r
      result.diagnostics.loopCandidateScore := visual.loopDiagnostics.candidateScore;\r
      for rank in 1:RGBDKeyframeRetrieval.proposalCapacity loop\r
        result.diagnostics.loopCandidateCurrentId[rank] := if rank <= visual.loopDiagnostics.candidateCount then measurement.id else 0;\r
        result.diagnostics.loopCandidateReason[rank] := visual.loopDiagnostics.proposals[rank].rejectionReason;\r
        result.diagnostics.loopCandidateMatchedCount[rank] := visual.loopDiagnostics.proposals[rank].matchedCount;\r
        result.diagnostics.loopCandidateInliers[rank] := visual.loopDiagnostics.proposals[rank].inlierCount;\r
        result.diagnostics.loopCandidateRms[rank] := visual.loopDiagnostics.proposals[rank].rms;\r
        result.diagnostics.loopCandidateVerified[rank] := visual.loopDiagnostics.proposals[rank].verified;\r
      end for;\r
    else\r
      result := RGBDCatalogObservation.Update(catalog,graph,map,measurement,candidatePoint,candidateEnabled,\r
        poseAccepted,requested and decision.valid,coordinateLimit,voxelWidth,mergeRadius,maximumDistance,\r
        tentativeLifetime,confirmedLifetime,confirmationObservations,maximumConfidence,maximumTentative,consistencyTolerance,\r
        nodePosition,nodeRotation,poseRevision);\r
    end if;\r
  end Advance;\r
end RGBDCatalogFrame;\r
`;export{e as default};
