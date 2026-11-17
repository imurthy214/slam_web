const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Corrected pose metadata is explicit; immutable raw catalog poses stay raw.\r
// This package does not import RGBDGraphEstimatorCommit (no cyclic dependency).\r
package RGBDCatalogPoseMapping\r
\r
  constant Integer nodeCapacity = RGBDKeyframes.keyframeCapacity;\r
  constant Integer dimension = RGBDKeyframes.dimension;\r
  record PoseView\r
    Integer generation; Integer sourceRevision; Integer revision; Integer catalogNextId;\r
    Boolean enabled[nodeCapacity]; Integer ids[nodeCapacity]; Real positions[nodeCapacity,dimension]; Real rotations[nodeCapacity,dimension,dimension];\r
  end PoseView;\r
  record Result\r
    RGBDCatalogMapping.Result mapping; PoseView poses; RGBDKeyframePolicy.Decision decision;\r
    Boolean accepted; Integer rejectionReason;\r
  end Result;\r
  function FromCatalog\r
    input RGBDKeyframes.Catalog catalog; input Integer sourceRevision; output PoseView poses;\r
  algorithm\r
    poses.generation := catalog.generation; poses.sourceRevision := sourceRevision; poses.revision := 0;\r
    poses.catalogNextId := catalog.nextId; poses.enabled := catalog.occupied; poses.ids := catalog.ids;\r
    poses.positions := catalog.bodyPositions; poses.rotations := catalog.bodyRotations;\r
  end FromCatalog;\r
  function ValidView\r
    input RGBDKeyframes.Catalog catalog; input PoseView poses; input Integer sourceRevision; output Boolean valid;\r
  algorithm\r
    valid := RGBDKeyframes.ValidHeader(catalog) and poses.generation == catalog.generation\r
      and sourceRevision > 0 and sourceRevision <= RGBDKeyframes.identifierLimit and poses.sourceRevision == sourceRevision\r
      and poses.revision >= 0 and poses.revision < RGBDKeyframes.identifierLimit-1 and poses.catalogNextId == catalog.nextId;\r
    for slot in 1:nodeCapacity loop\r
      valid := valid and poses.enabled[slot] == catalog.occupied[slot];\r
      if poses.enabled[slot] then\r
        valid := valid and poses.ids[slot] == catalog.ids[slot] and RGBDUncertaintyProper(poses.rotations[slot,:,:]);\r
        for axis in 1:dimension loop valid := valid and abs(poses.positions[slot,axis]) <= 1e6; end for;\r
      end if;\r
    end for;\r
  end ValidView;\r
  function Advance\r
    input RGBDKeyframes.Catalog catalog;\r
    input RGBDGraphMeasurements.State graph;\r
    input RGBDCatalogMapping.State map;\r
    input PoseView poses; input Integer sourceRevision;\r
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
    output Result result;\r
  protected Integer slot;\r
  algorithm\r
    result.poses := poses; result.accepted := false; result.rejectionReason := 1;\r
    result.mapping.catalog := catalog; result.mapping.graph := graph; result.mapping.map := map;\r
    result.mapping.accepted := false; result.mapping.rejectionReason := 1;\r
    result.mapping.diagnostics := RGBDCatalogMapping.EmptyDiagnostics(); result.mapping.problem := RGBDGraphMeasurements.EmptyProblem();\r
    result.decision.valid := false; result.decision.captureRequested := false; result.decision.reason := 1;\r
    result.decision.enabledCount := 0; result.decision.elapsed := 0; result.decision.translationSquared := 0; result.decision.rotationCosine := 1;\r
    if requested then\r
      result.rejectionReason := 2;\r
      if ValidView(catalog,poses,sourceRevision) then\r
        (result.mapping,result.decision) := RGBDCatalogFrame.Advance(\r
          catalog,graph,map,measurement,vocabulary,vocabularyEnabled,candidatePoint,candidateEnabled,imageFresh,poseAccepted,requested,minimumInterval,maximumInterval,translationThreshold,rotationThreshold,minimumFeatures,seeds,sequentialSeed,maximumWordDistanceSquared,minimumAssignments,minimumSimilarity,minimumAge,trials,refinements,minimumInliers,minimumFraction,inlierDistance,maximumRms,descriptorRatio,maximumDescriptorDistance,registrationCoordinateLimit,rankTolerance,localizationSigma,depthInflation,minimumPivot,coordinateLimit,voxelWidth,mergeRadius,maximumDistance,tentativeLifetime,confirmedLifetime,confirmationObservations,maximumConfidence,maximumTentative,consistencyTolerance,poses.positions,poses.rotations,poses.revision);\r
        result.rejectionReason := 3;\r
        if result.mapping.accepted then\r
          if result.mapping.catalog.nextId == catalog.nextId+1 then\r
            slot := catalog.nextSlot;\r
            result.poses.revision := poses.revision+1; result.poses.catalogNextId := result.mapping.catalog.nextId;\r
            result.poses.enabled[slot] := true; result.poses.ids[slot] := result.mapping.catalog.ids[slot];\r
            result.poses.positions[slot,:] := result.mapping.catalog.bodyPositions[slot,:];\r
            result.poses.rotations[slot,:,:] := result.mapping.catalog.bodyRotations[slot,:,:];\r
          end if;\r
          result.accepted := true; result.rejectionReason := 0;\r
        end if;\r
      end if;\r
    end if;\r
  end Advance;\r
end RGBDCatalogPoseMapping;\r
`;export{e as default};
