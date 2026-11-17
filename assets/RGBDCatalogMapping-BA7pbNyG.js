const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Mapping consumes an admitted visual/catalog/graph proposal. Publication is\r
// still local until estimator/reference and any graph correction also accept.\r
package RGBDCatalogMapping\r
\r
  constant Integer mapCapacity = RGBDMapAnchors.mapCapacity;\r
  constant Integer featureCapacity = RGBDKeyframes.featureCapacity;\r
  constant Integer dimension = RGBDKeyframes.dimension;\r
\r
  record State\r
    Real point[mapCapacity,dimension]; Real occupied[mapCapacity];\r
    Real confidence[mapCapacity]; Real lastSeen[mapCapacity]; Real lastFrame[mapCapacity];\r
    Real localPoint[mapCapacity,dimension];\r
    Integer anchorId[mapCapacity]; Integer anchorSlot[mapCapacity];\r
    Integer generation; Integer catalogRevision;\r
    Real imageTime; Integer imageEpoch;\r
    Real frame "Consecutive accepted map-observation counter, not camera epoch";\r
    Real worldFrame;\r
  end State;\r
\r
  function Empty\r
    input Integer generation = 1;\r
    input Real worldFrame = 0.0;\r
    output State result;\r
  algorithm\r
    result.point := zeros(mapCapacity,dimension); result.occupied := zeros(mapCapacity);\r
    result.confidence := zeros(mapCapacity); result.lastSeen := zeros(mapCapacity); result.lastFrame := zeros(mapCapacity);\r
    result.localPoint := zeros(mapCapacity,dimension);\r
    result.anchorId := fill(0,mapCapacity); result.anchorSlot := fill(0,mapCapacity);\r
    result.generation := generation; result.catalogRevision := 0;\r
    result.imageTime := 0.0; result.imageEpoch := -1; result.frame := 0.0; result.worldFrame := worldFrame;\r
  end Empty;\r
\r
  record Diagnostics\r
    Real mapAccepted; Real catalogUpdateRejectionReason;\r
    Integer keyframeRejectionReason; Integer sequentialRejectionReason;\r
    Integer retiredLoopFactors "Actual node-budget factor retirement, gated by outer publication";\r
    Integer catalogRejectionReason; Integer correctionReason;\r
    Real updateRejectionReason; Real mapRejectionReason; Integer anchorRejectionReason;\r
    Real occupiedCount; Real confirmedCount; Real tentativeCount;\r
    Real insertedCount; Real mergedCount; Real prunedCount; Real droppedCount; Real invalidCandidateCount;\r
    Integer projectedCount; Integer evictedCount; Integer assignedCount; Integer retainedCount; Integer clearedCount;\r
    Boolean loopAttempted;\r
    Integer loopRetrievalReason;\r
    Integer loopGraphReason;\r
    Integer loopCandidateCount;\r
    Integer loopCandidateReferenceId[RGBDKeyframeRetrieval.proposalCapacity];\r
    Integer loopCandidateCurrentId[RGBDKeyframeRetrieval.proposalCapacity];\r
    Real loopCandidateScore[RGBDKeyframeRetrieval.proposalCapacity];\r
    Integer loopCandidateReason[RGBDKeyframeRetrieval.proposalCapacity];\r
    Integer loopCandidateMatchedCount[RGBDKeyframeRetrieval.proposalCapacity];\r
    Integer loopCandidateInliers[RGBDKeyframeRetrieval.proposalCapacity];\r
    Real loopCandidateRms[RGBDKeyframeRetrieval.proposalCapacity];\r
    Boolean loopCandidateVerified[RGBDKeyframeRetrieval.proposalCapacity];\r
  end Diagnostics;\r
\r
  function EmptyDiagnostics\r
    output Diagnostics result;\r
  algorithm\r
    result.mapAccepted := 0.0; result.catalogUpdateRejectionReason := 0.0;\r
    result.keyframeRejectionReason := 0; result.sequentialRejectionReason := 0;\r
    result.retiredLoopFactors := 0;\r
    result.catalogRejectionReason := 0; result.correctionReason := 0;\r
    result.updateRejectionReason := 0.0; result.mapRejectionReason := 0.0; result.anchorRejectionReason := 0;\r
    result.occupiedCount := 0.0; result.confirmedCount := 0.0; result.tentativeCount := 0.0;\r
    result.insertedCount := 0.0; result.mergedCount := 0.0; result.prunedCount := 0.0;\r
    result.droppedCount := 0.0; result.invalidCandidateCount := 0.0;\r
    result.projectedCount := 0; result.evictedCount := 0; result.assignedCount := 0;\r
    result.retainedCount := 0; result.clearedCount := 0;\r
    result.loopAttempted := false;\r
    result.loopRetrievalReason := 0;\r
    result.loopGraphReason := 0;\r
    result.loopCandidateCount := 0;\r
    result.loopCandidateReferenceId := fill(0,RGBDKeyframeRetrieval.proposalCapacity);\r
    result.loopCandidateCurrentId := fill(0,RGBDKeyframeRetrieval.proposalCapacity);\r
    result.loopCandidateScore := fill(0.0,RGBDKeyframeRetrieval.proposalCapacity);\r
    result.loopCandidateReason := fill(0,RGBDKeyframeRetrieval.proposalCapacity);\r
    result.loopCandidateMatchedCount := fill(0,RGBDKeyframeRetrieval.proposalCapacity);\r
    result.loopCandidateInliers := fill(0,RGBDKeyframeRetrieval.proposalCapacity);\r
    result.loopCandidateRms := fill(0.0,RGBDKeyframeRetrieval.proposalCapacity);\r
    result.loopCandidateVerified := fill(false,RGBDKeyframeRetrieval.proposalCapacity);\r
  end EmptyDiagnostics;\r
\r
  record Result\r
    RGBDKeyframes.Catalog catalog;\r
    RGBDGraphMeasurements.State graph;\r
    State map;\r
    Boolean accepted;\r
    Integer rejectionReason "1 idle; 2 visual; 3 binding; 4 projection; 5 map";\r
    Diagnostics diagnostics "Map-stage diagnostics are proposals, not committed counts";\r
    RGBDGraphMeasurements.Problem problem;\r
  end Result;\r
\r
  function Capture\r
    input RGBDKeyframes.Catalog previousCatalog;\r
    input RGBDGraphMeasurements.State previousGraph;\r
    input State previous;\r
    input RGBDCatalogGraphCapture.Result visual "From the same old catalog/graph owners";\r
    input Real candidatePoint[featureCapacity,dimension];\r
    input Real candidateEnabled[featureCapacity];\r
    input Real poseAccepted;\r
    input Boolean requested;\r
    input Real coordinateLimit = 1e6; input Real voxelWidth = 0.25;\r
    input Real mergeRadius = 0.15; input Real maximumDistance = 80.0;\r
    input Real tentativeLifetime = 0.5; input Real confirmedLifetime = 5.0;\r
    input Real confirmationObservations = 3.0; input Real maximumConfidence = 8.0;\r
    input Real maximumTentative = 700.0; input Real consistencyTolerance = 1e-6;\r
    input Real previousNodePosition[RGBDKeyframes.keyframeCapacity,3] = previousCatalog.bodyPositions;\r
    input Real previousNodeRotation[RGBDKeyframes.keyframeCapacity,3,3] = previousCatalog.bodyRotations;\r
    input Integer previousPoseRevision = previous.catalogRevision;\r
    output Result result;\r
  protected\r
    State proposed;\r
    RGBDKeyframes.Frame measurement;\r
    Diagnostics diagnostics;\r
    Real confirmed[mapCapacity];\r
    Integer slot; Boolean valid; Boolean candidateValid; Real expectedWorld[dimension];\r
    Real nodePosition[RGBDKeyframes.keyframeCapacity,3]; Real nodeRotation[RGBDKeyframes.keyframeCapacity,3,3];\r
  algorithm\r
    result.catalog := previousCatalog; result.graph := previousGraph; result.map := previous;\r
    result.accepted := false; result.rejectionReason := 1;\r
    result.diagnostics := EmptyDiagnostics(); result.problem := RGBDGraphMeasurements.EmptyProblem();\r
    if requested then\r
      result.rejectionReason := 2;\r
      if visual.accepted then\r
        result.rejectionReason := 3;\r
        valid := RGBDKeyframes.ValidHeader(previousCatalog) and RGBDKeyframes.ValidHeader(visual.catalog)\r
          and previous.generation == previousCatalog.generation\r
          and visual.catalog.generation == previousCatalog.generation\r
          and previousCatalog.nextId < RGBDKeyframes.identifierLimit\r
          and visual.catalog.nextId >= 2\r
          and previous.catalogRevision >= 0 and previous.catalogRevision < RGBDKeyframes.identifierLimit\r
          and previous.frame >= 0 and previous.frame < RGBDKeyframes.identifierLimit\r
          and floor(previous.frame) == previous.frame\r
          and previous.imageEpoch >= -1 and previous.imageEpoch <= RGBDKeyframes.identifierLimit\r
          and ((previous.frame == 0 and previous.imageEpoch == -1)\r
            or (previous.frame > 0 and previous.imageEpoch >= 0))\r
          and visual.graph.generation == previousGraph.generation\r
          and previousGraph.revision >= 0 and previousGraph.revision < RGBDKeyframes.identifierLimit\r
          and coordinateLimit > 0 and coordinateLimit <= 1e6\r
          and consistencyTolerance > 0 and consistencyTolerance <= 0.01\r
          and visual.storedSlot >= 1 and visual.storedSlot <= RGBDKeyframes.keyframeCapacity\r
          and visual.problem.accepted;\r
        if valid then\r
          valid := visual.catalog.nextId == previousCatalog.nextId+1\r
            and visual.graph.revision == previousGraph.revision+1\r
            and visual.graph.lastCaptureId == visual.catalog.nextId-1\r
            and visual.storedSlot == RGBDKeyframes.SlotOf(visual.catalog,previousCatalog.nextId);\r
          if valid then\r
            slot := visual.storedSlot;\r
            measurement := RGBDKeyframes.ReadSlot(visual.catalog,slot);\r
            valid := measurement.id == previousCatalog.nextId\r
              and measurement.epoch == visual.catalog.lastEpoch\r
              and measurement.epoch > previous.imageEpoch\r
              and measurement.imageTime == visual.catalog.lastTime\r
              and RGBDKeyframes.ValidFrame(measurement)\r
              and poseAccepted == 1.0;\r
            result.rejectionReason := 4;\r
            if valid then\r
              for feature in 1:featureCapacity loop\r
                candidateValid := candidateEnabled[feature] == 0.0 or candidateEnabled[feature] == 1.0;\r
                if candidateEnabled[feature] == 1.0 then\r
                  candidateValid := measurement.enabled[feature] and feature <= measurement.count;\r
                  if candidateValid then\r
                    expectedWorld := measurement.bodyRotation*(measurement.opticalToBody*measurement.opticalPoint[feature,:]\r
                      +measurement.cameraOriginBody)+measurement.bodyPosition;\r
                    for axis in 1:dimension loop\r
                      candidateValid := candidateValid and abs(expectedWorld[axis]) <= coordinateLimit\r
                        and abs(candidatePoint[feature,axis]-expectedWorld[axis]) <= consistencyTolerance;\r
                    end for;\r
                  end if;\r
                end if;\r
                valid := valid and candidateValid;\r
              end for;\r
            end if;\r
            if valid then\r
              proposed := previous; diagnostics := EmptyDiagnostics();\r
              nodePosition := previousNodePosition; nodeRotation := previousNodeRotation;\r
              nodePosition[slot,:] := measurement.bodyPosition; nodeRotation[slot,:,:] := measurement.bodyRotation;\r
              (proposed.point,proposed.occupied,proposed.confidence,proposed.lastSeen,proposed.lastFrame,confirmed,\r
                diagnostics.mapAccepted,diagnostics.catalogUpdateRejectionReason,proposed.imageTime,proposed.frame,proposed.worldFrame,\r
                diagnostics.occupiedCount,diagnostics.confirmedCount,diagnostics.tentativeCount,\r
                diagnostics.insertedCount,diagnostics.mergedCount,diagnostics.prunedCount,diagnostics.droppedCount,diagnostics.invalidCandidateCount,\r
                proposed.localPoint,proposed.anchorId,proposed.anchorSlot,proposed.generation,proposed.catalogRevision,\r
                diagnostics.catalogRejectionReason,diagnostics.correctionReason,diagnostics.updateRejectionReason,\r
                diagnostics.mapRejectionReason,diagnostics.anchorRejectionReason,diagnostics.projectedCount,\r
                diagnostics.evictedCount,diagnostics.assignedCount,diagnostics.retainedCount,diagnostics.clearedCount) := UpdateCatalogLandmarkMap(\r
                  previous.point,previous.occupied,previous.confidence,previous.lastSeen,previous.lastFrame,\r
                  candidatePoint,candidateEnabled,measurement.count,measurement.bodyPosition,poseAccepted,\r
                  previous.imageTime,measurement.imageTime,previous.frame,previous.frame+1,previous.worldFrame,previous.worldFrame,0.0,\r
                  coordinateLimit,voxelWidth,mergeRadius,maximumDistance,tentativeLifetime,confirmedLifetime,\r
                  confirmationObservations,maximumConfidence,maximumTentative,\r
                  previous.localPoint,previous.anchorId,previous.anchorSlot,previous.generation,previous.catalogRevision,\r
                  previousCatalog.occupied,previousCatalog.ids,previousNodePosition,previousNodeRotation,\r
                  visual.catalog.occupied,visual.catalog.ids,nodePosition,nodeRotation,\r
                  visual.catalog.generation,previous.catalogRevision+1,measurement.id,slot,true,true,consistencyTolerance,\r
                  previousPoseRevision,previousPoseRevision+1);\r
              result.diagnostics := diagnostics; result.rejectionReason := 5;\r
              if diagnostics.mapAccepted == 1.0 then\r
                proposed.imageEpoch := measurement.epoch;\r
                result.catalog := visual.catalog; result.graph := visual.graph; result.map := proposed;\r
                result.problem := visual.problem; result.accepted := true; result.rejectionReason := 0;\r
              end if;\r
            end if;\r
          end if;\r
        end if;\r
      end if;\r
    end if;\r
  end Capture;\r
end RGBDCatalogMapping;\r
`;export{e as default};
