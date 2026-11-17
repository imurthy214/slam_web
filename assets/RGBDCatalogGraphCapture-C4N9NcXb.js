const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Atomic proposal for the catalog and measured graph owners. Publication,\r
// estimator correlation, optimization and map updates remain outer owners.\r
package RGBDCatalogGraphCapture\r
\r
  record Result\r
    RGBDKeyframes.Catalog catalog;\r
    RGBDGraphMeasurements.State graph;\r
    Boolean accepted;\r
    Integer rejectionReason "1 idle; 2 retrieval; 3 store; 4 graph; 5 problem; 6 retention holds the slot due for eviction";\r
    Integer storedSlot; Integer evictedId;\r
    Integer retiredLoopFactors "Committed by this Capture only when accepted";\r
    RGBDCatalogLoopVerification.Batch loopDiagnostics;\r
    RGBDLoopVerification.Proposal sequentialDiagnostics;\r
    RGBDGraphMeasurements.Update graphDiagnostics;\r
    RGBDGraphMeasurements.Problem problem;\r
  end Result;\r
\r
  function Capture\r
    input RGBDKeyframes.Catalog previousCatalog;\r
    input RGBDKeyframes.Frame measurement;\r
    input Real vocabulary[RGBDKeyframes.wordCapacity,RGBDKeyframes.descriptorSize];\r
    input Real vocabularyEnabled[RGBDKeyframes.wordCapacity];\r
    input RGBDGraphMeasurements.State previousGraph;\r
    input Boolean requested;\r
    input Integer seeds[RGBDKeyframeRetrieval.proposalCapacity] = fill(7,RGBDKeyframeRetrieval.proposalCapacity);\r
    input Integer sequentialSeed = 7;\r
    input Real maximumWordDistanceSquared = 0.8; input Integer minimumAssignments = 8;\r
    input Real minimumSimilarity = 0.35; input Real minimumAge = 5.0;\r
    input Integer trials = 96; input Integer refinements = 4;\r
    input Integer minimumInliers = 12; input Real minimumFraction = 0.5;\r
    input Real inlierDistance = 0.08; input Real maximumRms = 0.03;\r
    input Real descriptorRatio = 0.8; input Real maximumDescriptorDistance = 0.8;\r
    input Real coordinateLimit = 100.0; input Real rankTolerance = 1e-8;\r
    input Real localizationSigma = 0.5; input Real depthInflation = 1.0; input Real minimumPivot = 1e-10;\r
    output Result result;\r
    input Boolean calibratedResiduals = true;\r
    input Real maximumNormalizedSquared = 9.0;\r
    input Boolean poseConsistentLoops = false;\r
    input Real loopMinimumSimilarity = minimumSimilarity;\r
    input Real loopMinimumAge = minimumAge;\r
    input Integer loopMinimumInliers = minimumInliers;\r
    input Real loopMinimumFraction = minimumFraction;\r
    input Real loopInlierDistance = inlierDistance;\r
    input Real loopMaximumRms = maximumRms;\r
    input Boolean loopCalibratedResiduals = calibratedResiduals;\r
    input Real loopMaximumNormalizedSquared = maximumNormalizedSquared;\r
    input Real loopMaximumPoseInnovation = 2.0;\r
    input Real loopPoseConsistencySquared = 9.0;\r
    input Boolean loopPoseConsistency = poseConsistentLoops;\r
  protected\r
    RGBDKeyframes.Catalog captured; RGBDKeyframes.Catalog storageCatalog;\r
    RGBDGraphMeasurements.State storageGraph;\r
    Integer plannedSlot; Integer retired; Boolean planAccepted;\r
    RGBDKeyframes.Frame latest;\r
    Boolean stored; Integer slot; Integer evicted; Boolean poseConsistent; Real poseSquared;\r
    Integer storeReason; Integer retention[RGBDKeyframes.keyframeCapacity];\r
    Integer children[RGBDKeyframes.keyframeCapacity]; Boolean loopReferenced[RGBDKeyframes.keyframeCapacity];\r
  algorithm\r
    result.catalog := previousCatalog; result.graph := previousGraph;\r
    result.accepted := false; result.rejectionReason := 1;\r
    result.storedSlot := 0; result.evictedId := 0; result.retiredLoopFactors := 0;\r
    storageCatalog := previousCatalog; storageGraph := previousGraph; retired := 0;\r
    result.loopDiagnostics := RGBDCatalogLoopVerification.ProposeCapture(previousCatalog,measurement,vocabulary,vocabularyEnabled,\r
      requested,seeds,maximumWordDistanceSquared,minimumAssignments,loopMinimumSimilarity,loopMinimumAge,trials,refinements,\r
      loopMinimumInliers,loopMinimumFraction,loopInlierDistance,loopMaximumRms,descriptorRatio,maximumDescriptorDistance,\r
      coordinateLimit,rankTolerance,localizationSigma,depthInflation,minimumPivot,\r
      calibratedResiduals=loopCalibratedResiduals,maximumNormalizedSquared=loopMaximumNormalizedSquared,\r
      poseConsistentLoops=loopPoseConsistency,maximumPoseInnovation=loopMaximumPoseInnovation,poseConsistencySquared=loopPoseConsistencySquared);\r
    result.sequentialDiagnostics := RGBDLoopVerification.EmptyProposal(sequentialSeed);\r
    if result.loopDiagnostics.retrievalAccepted and previousCatalog.nextId > 1 then\r
      latest := RGBDKeyframes.ReadSlot(previousCatalog,max(1,RGBDKeyframes.NewestSlot(previousCatalog)));\r
      result.sequentialDiagnostics := RGBDLoopVerification.Verify(latest,result.loopDiagnostics.prepared,true,\r
        sequentialSeed,trials,refinements,minimumInliers,minimumFraction,inlierDistance,maximumRms,0.0,\r
        descriptorRatio,maximumDescriptorDistance,coordinateLimit,rankTolerance,localizationSigma,depthInflation,minimumPivot,\r
        calibratedResiduals=calibratedResiduals,maximumNormalizedSquared=maximumNormalizedSquared);\r
      // The previous retained keyframe can also be a repeated warehouse bay\r
      // after a long capture gap. A false sequential edge is as damaging as\r
      // a false retrieved loop, so both use the same production motion screen.\r
      if result.sequentialDiagnostics.verified and poseConsistentLoops then\r
        (poseConsistent,poseSquared) := RGBDCatalogLoopVerification.PoseConsistent(\r
          latest.bodyPosition,measurement.bodyPosition,latest.bodyRotation,\r
          latest.poseCovariance,measurement.poseCovariance,\r
          result.sequentialDiagnostics.bodyTranslation,result.sequentialDiagnostics.covariance[1:3,1:3],minimumPivot=minimumPivot);\r
        if not poseConsistent then\r
          result.sequentialDiagnostics.verified := false;\r
          result.sequentialDiagnostics.rejectionReason := 11;\r
        end if;\r
      end if;\r
    end if;\r
    // The graph grants eviction tiers before Store; the catalog never reads\r
    // graph records. Pending proposals count, so this capture's references stay.\r
    (retention,children,loopReferenced) := RGBDGraphMeasurements.RetentionTiers(previousCatalog,previousGraph,\r
      result.sequentialDiagnostics,result.loopDiagnostics.proposals);\r
    if requested and result.loopDiagnostics.retrievalAccepted\r
        and previousCatalog.occupied[previousCatalog.nextSlot]\r
        and retention[previousCatalog.nextSlot] == RGBDKeyframes.retentionHeld then\r
      (plannedSlot,storageGraph,retired,planAccepted) := RGBDGraphMeasurements.PlanNodeCapacity(\r
        previousCatalog,previousGraph,result.sequentialDiagnostics,result.loopDiagnostics.proposals);\r
      if planAccepted then\r
        storageCatalog.nextSlot := plannedSlot;\r
        // The original admission tier for the actual victim is mandatory.\r
        (retention,children,loopReferenced) := RGBDGraphMeasurements.RetentionTiers(storageCatalog,storageGraph,\r
          result.sequentialDiagnostics,result.loopDiagnostics.proposals);\r
      end if;\r
    end if;\r
    (captured,stored,slot,evicted,storeReason) := RGBDKeyframes.Store(storageCatalog,result.loopDiagnostics.prepared,\r
      result.loopDiagnostics.retrievalAccepted,retention);\r
    result.graphDiagnostics := RGBDGraphMeasurements.Capture(storageCatalog,captured,storageGraph,\r
      result.sequentialDiagnostics,result.loopDiagnostics.proposals,stored,false,inlierDistance,maximumRms,\r
      calibratedResiduals=calibratedResiduals,maximumNormalizedSquared=maximumNormalizedSquared,\r
      localizationSigma=localizationSigma,depthInflation=depthInflation,minimumPivot=minimumPivot,\r
      loopInlierDistance=loopInlierDistance, loopMaximumRms=loopMaximumRms, loopCalibratedResiduals=loopCalibratedResiduals, loopMaximumNormalizedSquared=loopMaximumNormalizedSquared);\r
    result.problem := RGBDGraphMeasurements.EmptyProblem();\r
    if result.graphDiagnostics.accepted then\r
      result.problem := RGBDGraphMeasurements.PrepareProblem(captured,result.graphDiagnostics.state,true);\r
    end if;\r
    if requested then\r
      result.rejectionReason := if not result.loopDiagnostics.retrievalAccepted then 2\r
        else if not stored then (if storeReason == RGBDKeyframes.storeRetentionRefused then 6 else 3)\r
        else if not result.graphDiagnostics.accepted then 4 else if not result.problem.accepted then 5 else 0;\r
      if result.rejectionReason == 0 then\r
        result.catalog := captured; result.graph := result.graphDiagnostics.state;\r
        result.accepted := true; result.storedSlot := slot; result.evictedId := evicted;\r
        result.retiredLoopFactors := retired;\r
      end if;\r
    end if;\r
  end Capture;\r
end RGBDCatalogGraphCapture;\r
`;export{e as default};
