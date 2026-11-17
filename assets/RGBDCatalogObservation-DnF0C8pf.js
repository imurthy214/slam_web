const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Mapping between captures: the retained catalog and raw measured graph hold.\r
// Reuses the capture/map owner's noncapture validation and insertion receipts.\r
package RGBDCatalogObservation\r
\r
  function Update\r
    input RGBDKeyframes.Catalog previousCatalog;\r
    input RGBDGraphMeasurements.State previousGraph;\r
    input RGBDCatalogMapping.State previous;\r
    input RGBDKeyframes.Frame measurement;\r
    input Real candidatePoint[RGBDKeyframes.featureCapacity,RGBDKeyframes.dimension];\r
    input Real candidateEnabled[RGBDKeyframes.featureCapacity];\r
    input Real poseAccepted;\r
    input Boolean requested;\r
    input Real coordinateLimit = 1e6; input Real voxelWidth = 0.25;\r
    input Real mergeRadius = 0.15; input Real maximumDistance = 80.0;\r
    input Real tentativeLifetime = 0.5; input Real confirmedLifetime = 5.0;\r
    input Real confirmationObservations = 3.0; input Real maximumConfidence = 8.0;\r
    input Real maximumTentative = 700.0; input Real consistencyTolerance = 1e-6;\r
    input Real nodePosition[RGBDKeyframes.keyframeCapacity,3] = previousCatalog.bodyPositions;\r
    input Real nodeRotation[RGBDKeyframes.keyframeCapacity,3,3] = previousCatalog.bodyRotations;\r
    input Integer poseRevision = previous.catalogRevision;\r
    output RGBDCatalogMapping.Result result;\r
  protected\r
    RGBDCatalogMapping.State proposed;\r
    RGBDCatalogMapping.Diagnostics diagnostics;\r
    RGBDKeyframes.Catalog unchangedCatalog;\r
    Real confirmed[RGBDCatalogMapping.mapCapacity]; Real updateAccepted; Real updateReason;\r
    Boolean valid; Boolean captured; Integer storedSlot; Integer evictedId; Integer measurementReason;\r
  algorithm\r
    result.catalog := previousCatalog; result.graph := previousGraph; result.map := previous;\r
    result.accepted := false; result.rejectionReason := 1;\r
    result.diagnostics := RGBDCatalogMapping.EmptyDiagnostics();\r
    result.problem := RGBDGraphMeasurements.EmptyProblem();\r
    if requested then\r
      result.rejectionReason := 3;\r
      valid := RGBDKeyframes.ValidHeader(previousCatalog)\r
        and previous.generation == previousCatalog.generation\r
        and previousGraph.generation == previousCatalog.generation\r
        and previousGraph.revision >= 0 and previousGraph.revision <= RGBDKeyframes.identifierLimit\r
        and previous.catalogRevision >= 0 and previous.catalogRevision <= RGBDKeyframes.identifierLimit\r
        and previous.frame >= 0 and previous.frame < RGBDKeyframes.identifierLimit\r
        and floor(previous.frame) == previous.frame\r
        and previous.imageEpoch >= -1 and previous.imageEpoch <= RGBDKeyframes.identifierLimit\r
        and ((previous.frame == 0 and previous.imageEpoch == -1)\r
          or (previous.frame > 0 and previous.imageEpoch >= 0))\r
        and measurement.id == previousCatalog.nextId\r
        and measurement.epoch > previous.imageEpoch\r
        and measurement.epoch > previousCatalog.lastEpoch\r
        and measurement.imageTime >= previousCatalog.lastTime\r
        and poseAccepted == 1.0;\r
      if valid then\r
        valid := previousGraph.lastCaptureId == previousCatalog.nextId-1;\r
      end if;\r
      if valid then\r
        proposed := previous; diagnostics := RGBDCatalogMapping.EmptyDiagnostics();\r
        (proposed.point,proposed.occupied,proposed.confidence,proposed.lastSeen,proposed.lastFrame,confirmed,\r
          updateAccepted,updateReason,proposed.imageTime,proposed.frame,proposed.worldFrame,\r
          diagnostics.occupiedCount,diagnostics.confirmedCount,diagnostics.tentativeCount,\r
          diagnostics.insertedCount,diagnostics.mergedCount,diagnostics.prunedCount,diagnostics.droppedCount,diagnostics.invalidCandidateCount,\r
          unchangedCatalog,proposed.localPoint,proposed.anchorId,proposed.anchorSlot,proposed.generation,proposed.catalogRevision,\r
          captured,storedSlot,evictedId,measurementReason,diagnostics.catalogRejectionReason,diagnostics.correctionReason,\r
          diagnostics.catalogUpdateRejectionReason,diagnostics.updateRejectionReason,\r
          diagnostics.mapRejectionReason,diagnostics.anchorRejectionReason,diagnostics.projectedCount,\r
          diagnostics.evictedCount,diagnostics.assignedCount,diagnostics.retainedCount,diagnostics.clearedCount) := UpdateKeyframeLandmarks(\r
            previous.point,previous.occupied,previous.confidence,previous.lastSeen,previous.lastFrame,\r
            candidatePoint,candidateEnabled,measurement.count,measurement.bodyPosition,poseAccepted,\r
            previous.imageTime,measurement.imageTime,previous.frame,previous.frame+1,previous.worldFrame,previous.worldFrame,0.0,\r
            coordinateLimit,voxelWidth,mergeRadius,maximumDistance,tentativeLifetime,confirmedLifetime,\r
            confirmationObservations,maximumConfidence,maximumTentative,\r
            previousCatalog,measurement,measurement.epoch,previousCatalog.generation,false,true,\r
            previous.localPoint,previous.anchorId,previous.anchorSlot,previous.generation,previous.catalogRevision,consistencyTolerance,\r
            nodePosition,nodeRotation,poseRevision);\r
        diagnostics.mapAccepted := updateAccepted;\r
        result.diagnostics := diagnostics;\r
        result.rejectionReason := if measurementReason <> 0 then 4 else 5;\r
        if updateAccepted == 1.0 and not captured and storedSlot == 0 and evictedId == 0 then\r
          proposed.imageEpoch := measurement.epoch;\r
          result.map := proposed; result.accepted := true; result.rejectionReason := 0;\r
        end if;\r
      end if;\r
    end if;\r
  end Update;\r
end RGBDCatalogObservation;\r
`;export{e as default};
