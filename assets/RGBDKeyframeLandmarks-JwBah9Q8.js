const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Capture of a descriptor/calibration/pose/histogram record joins the map\r
// transaction. The enclosing estimator/reference/graph must join this commit.\r
function UpdateKeyframeLandmarks\r
\r
  extends RGBDLandmarkMapInterface;\r
  input RGBDKeyframes.Catalog previousCatalog;\r
  input RGBDKeyframes.Frame measurement;\r
  input Integer imageEpoch; input Integer generation;\r
  input Boolean captureRequested; input Boolean requested;\r
  input Real previousLocalPoint[size(previousOccupied,1),3];\r
  input Integer previousAnchorId[size(previousOccupied,1)]; input Integer previousAnchorSlot[size(previousOccupied,1)];\r
  input Integer previousGeneration; input Integer previousCatalogRevision;\r
  input Real consistencyTolerance;\r
  input Real previousNodePosition[RGBDKeyframes.keyframeCapacity,3] = previousCatalog.bodyPositions;\r
  input Real previousNodeRotation[RGBDKeyframes.keyframeCapacity,3,3] = previousCatalog.bodyRotations;\r
  input Integer previousPoseRevision = previousCatalogRevision;\r
  output RGBDKeyframes.Catalog nextCatalog;\r
  output Real localPoint[size(previousOccupied,1),3];\r
  output Integer anchorId[size(previousOccupied,1)]; output Integer anchorSlot[size(previousOccupied,1)];\r
  output Integer nextGeneration; output Integer nextCatalogRevision;\r
  output Boolean captureAccepted; output Integer storedSlot; output Integer evictedId;\r
  output Integer measurementRejectionReason; output Integer catalogRejectionReason; output Integer correctionReason;\r
  output Real catalogUpdateRejectionReason; output Real updateRejectionReason;\r
  output Real mapRejectionReason; output Integer anchorRejectionReason;\r
  output Integer projectedCount; output Integer evictedCount;\r
  output Integer assignedCount; output Integer retainedCount; output Integer clearedCount;\r
protected\r
  RGBDKeyframes.Catalog baseCatalog; RGBDKeyframes.Catalog proposedCatalog;\r
  Boolean configuration; Boolean valid; Boolean featureValid; Boolean resetAccepted;\r
  Boolean stored; Integer proposedSlot; Integer proposedEvicted; Integer revision;\r
  Integer selectedId; Integer selectedSlot; Real expectedWorld[3];\r
  Real proposedNodePosition[RGBDKeyframes.keyframeCapacity,3];\r
  Real proposedNodeRotation[RGBDKeyframes.keyframeCapacity,3,3]; Integer poseRevision;\r
algorithm\r
  point := previousPoint; occupied := previousOccupied; confidence := previousConfidence;\r
  lastSeen := previousLastSeen; lastFrame := previousLastFrame;\r
  localPoint := previousLocalPoint; anchorId := previousAnchorId; anchorSlot := previousAnchorSlot;\r
  nextCatalog := previousCatalog; nextGeneration := previousGeneration; nextCatalogRevision := previousCatalogRevision;\r
  nextTime := previousTime; nextFrame := previousFrame; nextWorldFrame := previousWorldFrame;\r
  accepted := 0; rejectionReason := 1; measurementRejectionReason := 0; catalogRejectionReason := 0; correctionReason := 0;\r
  catalogUpdateRejectionReason := 0; updateRejectionReason := 0; mapRejectionReason := 0; anchorRejectionReason := 0;\r
  captureAccepted := false; storedSlot := 0; evictedId := 0;\r
  projectedCount := 0; evictedCount := 0; assignedCount := 0; retainedCount := 0; clearedCount := 0;\r
  insertedCount := 0; mergedCount := 0; prunedCount := 0; droppedCount := 0; invalidCandidateCount := 0;\r
  if requested then\r
    configuration := previousGeneration == previousCatalog.generation\r
      and generation >= 1 and generation <= RGBDKeyframes.identifierLimit\r
      and previousGeneration >= 1 and previousGeneration <= RGBDKeyframes.identifierLimit\r
      and previousCatalogRevision >= 0 and previousCatalogRevision <= RGBDKeyframes.identifierLimit\r
      and ((resetRequested == 1.0 and previousGeneration < RGBDKeyframes.identifierLimit and generation == previousGeneration+1)\r
        or (resetRequested == 0.0 and generation == previousGeneration))\r
      and size(candidatePoint,1) == RGBDKeyframes.featureCapacity and size(candidatePoint,2) == RGBDKeyframes.dimension\r
      and size(candidateEnabled,1) == RGBDKeyframes.featureCapacity\r
      and imageEpoch >= 0 and imageEpoch <= RGBDKeyframes.identifierLimit\r
      and consistencyTolerance > 0 and consistencyTolerance <= 0.01\r
      and coordinateLimit > 0 and coordinateLimit <= 1e6;\r
    rejectionReason := 2; measurementRejectionReason := 1;\r
    if configuration then\r
      baseCatalog := previousCatalog; resetAccepted := true;\r
      if resetRequested == 1.0 then\r
        (baseCatalog,resetAccepted) := RGBDKeyframes.Reset(previousCatalog,generation,measurement.vocabularyVersion);\r
      end if;\r
      valid := resetAccepted and RGBDKeyframes.ValidHeader(baseCatalog)\r
        and measurement.generation == generation and measurement.vocabularyVersion == baseCatalog.vocabularyVersion\r
        and measurement.epoch == imageEpoch and measurement.imageTime == timeNow\r
        and measurement.count >= 0 and measurement.count <= RGBDKeyframes.featureCapacity\r
        and candidateCount == measurement.count\r
        and RGBDMapAnchors.ProperRotation(measurement.bodyRotation)\r
        and RGBDMapAnchors.ProperRotation(measurement.opticalToBody);\r
      for axis in 1:RGBDKeyframes.dimension loop\r
        valid := valid and bodyPosition[axis] == measurement.bodyPosition[axis]\r
          and abs(measurement.bodyPosition[axis]) <= coordinateLimit\r
          and abs(measurement.cameraOriginBody[axis]) <= coordinateLimit;\r
      end for;\r
      // Check only enabled geometry; descriptors and calibration are admitted\r
      // by Store when capture is requested. Noncapture frames may have fewer\r
      // than eight features, including a zero-feature observation.\r
      if valid then\r
        for feature in 1:RGBDKeyframes.featureCapacity loop\r
          featureValid := candidateEnabled[feature] == 0.0 or candidateEnabled[feature] == 1.0;\r
          if candidateEnabled[feature] == 1.0 then\r
            featureValid := measurement.enabled[feature] and feature <= measurement.count\r
              and measurement.opticalPoint[feature,3] > 0;\r
            for axis in 1:RGBDKeyframes.dimension loop\r
              featureValid := featureValid and abs(measurement.opticalPoint[feature,axis]) <= coordinateLimit;\r
            end for;\r
            if featureValid then\r
              expectedWorld := measurement.bodyRotation*(measurement.opticalToBody*measurement.opticalPoint[feature,:]\r
                +measurement.cameraOriginBody)+measurement.bodyPosition;\r
              for axis in 1:RGBDKeyframes.dimension loop\r
                featureValid := featureValid and abs(expectedWorld[axis]) <= coordinateLimit\r
                  and abs(candidatePoint[feature,axis]-expectedWorld[axis]) <= consistencyTolerance;\r
              end for;\r
            end if;\r
          end if;\r
          valid := valid and featureValid;\r
        end for;\r
      end if;\r
      measurementRejectionReason := 2;\r
      if valid then\r
        proposedCatalog := baseCatalog; stored := false; proposedSlot := 0; proposedEvicted := 0;\r
        if captureRequested then\r
          (proposedCatalog,stored,proposedSlot,proposedEvicted) := RGBDKeyframes.Store(baseCatalog,measurement,true);\r
          valid := stored;\r
        end if;\r
        measurementRejectionReason := 3;\r
        if valid then\r
          revision := if resetRequested == 1.0 then 0 else previousCatalogRevision+(if stored then 1 else 0);\r
          proposedNodePosition := previousNodePosition; proposedNodeRotation := previousNodeRotation;\r
          if stored then\r
            proposedNodePosition[proposedSlot,:] := measurement.bodyPosition;\r
            proposedNodeRotation[proposedSlot,:,:] := measurement.bodyRotation;\r
          end if;\r
          poseRevision := if resetRequested == 1.0 then 0 else previousPoseRevision+(if stored then 1 else 0);\r
          selectedId := 0; selectedSlot := 0;\r
          if proposedCatalog.nextId > 1 then\r
            selectedSlot := max(1,RGBDKeyframes.NewestSlot(proposedCatalog));\r
            selectedId := proposedCatalog.ids[selectedSlot];\r
          end if;\r
          (point,occupied,confidence,lastSeen,lastFrame,confirmed,accepted,catalogUpdateRejectionReason,nextTime,nextFrame,nextWorldFrame,\r
            occupiedCount,confirmedCount,tentativeCount,insertedCount,mergedCount,prunedCount,droppedCount,invalidCandidateCount,\r
            localPoint,anchorId,anchorSlot,nextGeneration,nextCatalogRevision,catalogRejectionReason,correctionReason,\r
            updateRejectionReason,mapRejectionReason,anchorRejectionReason,projectedCount,evictedCount,\r
            assignedCount,retainedCount,clearedCount) := UpdateCatalogLandmarkMap(\r
              previousPoint,previousOccupied,previousConfidence,previousLastSeen,previousLastFrame,candidatePoint,candidateEnabled,\r
              candidateCount,bodyPosition,poseAccepted,previousTime,timeNow,previousFrame,frameNow,previousWorldFrame,worldFrame,resetRequested,\r
              coordinateLimit,voxelWidth,mergeRadius,maximumDistance,tentativeLifetime,confirmedLifetime,confirmationObservations,\r
              maximumConfidence,maximumTentative,previousLocalPoint,previousAnchorId,previousAnchorSlot,previousGeneration,\r
              previousCatalogRevision,previousCatalog.occupied,previousCatalog.ids,previousNodePosition,previousNodeRotation,\r
              proposedCatalog.occupied,proposedCatalog.ids,proposedNodePosition,proposedNodeRotation,\r
              generation,revision,selectedId,selectedSlot,true,true,consistencyTolerance,previousPoseRevision,poseRevision);\r
          rejectionReason := if accepted == 1.0 then 0 else 3;\r
          measurementRejectionReason := 0;\r
          if accepted == 1.0 then\r
            nextCatalog := proposedCatalog; captureAccepted := stored;\r
            storedSlot := proposedSlot; evictedId := proposedEvicted;\r
          end if;\r
        end if;\r
      end if;\r
    end if;\r
  end if;\r
  if accepted <> 1.0 then\r
    nextCatalog := previousCatalog; captureAccepted := false; storedSlot := 0; evictedId := 0;\r
    point := previousPoint; occupied := previousOccupied; confidence := previousConfidence;\r
    lastSeen := previousLastSeen; lastFrame := previousLastFrame;\r
    localPoint := previousLocalPoint; anchorId := previousAnchorId; anchorSlot := previousAnchorSlot;\r
    nextGeneration := previousGeneration; nextCatalogRevision := previousCatalogRevision;\r
    nextTime := previousTime; nextFrame := previousFrame; nextWorldFrame := previousWorldFrame;\r
    projectedCount := 0; evictedCount := 0; assignedCount := 0; retainedCount := 0; clearedCount := 0;\r
    insertedCount := 0; mergedCount := 0; prunedCount := 0; droppedCount := 0; invalidCandidateCount := 0;\r
    occupiedCount := 0; confirmedCount := 0; tentativeCount := 0;\r
    for slot in 1:size(previousOccupied,1) loop\r
      confirmed[slot] := if occupied[slot] == 1.0 and confidence[slot] >= confirmationObservations then 1.0 else 0.0;\r
      occupiedCount := occupiedCount+(if occupied[slot] == 1.0 then 1.0 else 0.0);\r
      confirmedCount := confirmedCount+confirmed[slot];\r
      tentativeCount := tentativeCount+(if occupied[slot] == 1.0 and confirmed[slot] == 0.0 then 1.0 else 0.0);\r
    end for;\r
  end if;\r
end UpdateKeyframeLandmarks;\r
`;export{e as default};
