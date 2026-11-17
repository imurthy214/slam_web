const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// A catalog proposal changes map geometry before the spatial index is built.\r
// Stable identities prevent an evicted anchor from merging into its successor.\r
package RGBDLandmarkCatalog\r
\r
  function Synchronize\r
    input Real previousPoint[:,3]; input Real previousOccupied[size(previousPoint,1)];\r
    input Real previousConfidence[size(previousPoint,1)]; input Real previousLastSeen[size(previousPoint,1)];\r
    input Real previousLastFrame[size(previousPoint,1)];\r
    input Real previousLocalPoint[size(previousPoint,1),3];\r
    input Integer previousAnchorId[size(previousPoint,1)]; input Integer previousAnchorSlot[size(previousPoint,1)];\r
    input Integer previousGeneration; input Integer previousRevision;\r
    input Boolean previousNodeEnabled[:]; input Integer previousNodeId[size(previousNodeEnabled,1)];\r
    input Real previousNodePosition[size(previousNodeEnabled,1),3];\r
    input Real previousNodeRotation[size(previousNodeEnabled,1),3,3];\r
    input Boolean nodeEnabled[size(previousNodeEnabled,1)]; input Integer nodeId[size(previousNodeEnabled,1)];\r
    input Real nodePosition[size(previousNodeEnabled,1),3]; input Real nodeRotation[size(previousNodeEnabled,1),3,3];\r
    input Integer generation; input Integer revision;\r
    input Boolean catalogAccepted; input Boolean requested; input Boolean reset;\r
    input Real previousTime; input Real previousFrame;\r
    input Real maximumConfidence; input Real coordinateLimit; input Real consistencyTolerance;\r
    output Real point[size(previousPoint,1),3]; output Real occupied[size(previousPoint,1)];\r
    output Real confidence[size(previousPoint,1)]; output Real lastSeen[size(previousPoint,1)];\r
    output Real lastFrame[size(previousPoint,1)]; output Real localPoint[size(previousPoint,1),3];\r
    output Integer anchorId[size(previousPoint,1)]; output Integer anchorSlot[size(previousPoint,1)];\r
    output Boolean accepted; output Integer rejectionReason; output Integer correctionReason;\r
    output Integer projectedCount; output Integer evictedCount;\r
  protected\r
    Boolean configuration; Boolean changed; Boolean valid; Boolean slotValid;\r
    Boolean correctionAccepted; Integer owner; Integer unusedRevision;\r
    Real reconstructed[3];\r
  algorithm\r
    point := previousPoint; occupied := previousOccupied; confidence := previousConfidence;\r
    lastSeen := previousLastSeen; lastFrame := previousLastFrame;\r
    localPoint := previousLocalPoint; anchorId := previousAnchorId; anchorSlot := previousAnchorSlot;\r
    accepted := false; rejectionReason := 1; correctionReason := 0;\r
    projectedCount := 0; evictedCount := 0;\r
    if requested then\r
      configuration := size(previousPoint,1) >= 1 and size(previousPoint,1) <= RGBDMapAnchors.mapCapacity\r
        and size(previousNodeEnabled,1) >= 1 and size(previousNodeEnabled,1) <= RGBDMapAnchors.keyframeCapacity\r
        and previousRevision >= 0 and previousRevision <= RGBDMapAnchors.identifierLimit\r
        and revision >= 0 and revision <= RGBDMapAnchors.identifierLimit\r
        and generation >= 1 and generation <= RGBDMapAnchors.identifierLimit\r
        and ((reset and previousGeneration >= 0 and previousGeneration < RGBDMapAnchors.identifierLimit\r
          and generation == previousGeneration+1 and revision == 0)\r
          or (not reset and generation == previousGeneration))\r
        and coordinateLimit > 0 and coordinateLimit <= 1e6\r
        and consistencyTolerance > 0 and consistencyTolerance <= 0.01\r
        and maximumConfidence >= 2 and maximumConfidence <= 100 and floor(maximumConfidence) == maximumConfidence\r
        and (reset or (previousTime >= 0 and previousTime <= 1e9 and previousFrame >= 0\r
          and previousFrame <= 1e9 and floor(previousFrame) == previousFrame));\r
      rejectionReason := 2;\r
      if configuration then\r
        rejectionReason := 3;\r
        if catalogAccepted then\r
          rejectionReason := 4;\r
          valid := RGBDMapAnchors.ValidNodes(nodeEnabled,nodeId,nodePosition,nodeRotation,coordinateLimit);\r
          if not reset then\r
            valid := valid and RGBDMapAnchors.ValidNodes(previousNodeEnabled,previousNodeId,\r
              previousNodePosition,previousNodeRotation,coordinateLimit);\r
          end if;\r
          if valid then\r
            changed := reset;\r
            if not reset then\r
              for node in 1:size(nodeEnabled,1) loop\r
                changed := changed or nodeEnabled[node] <> previousNodeEnabled[node];\r
                if nodeEnabled[node] and previousNodeEnabled[node] then\r
                  changed := changed or nodeId[node] <> previousNodeId[node];\r
                  for axis in 1:3 loop\r
                    changed := changed or nodePosition[node,axis] <> previousNodePosition[node,axis];\r
                    for column in 1:3 loop\r
                      changed := changed or nodeRotation[node,axis,column] <> previousNodeRotation[node,axis,column];\r
                    end for;\r
                  end for;\r
                end if;\r
              end for;\r
              valid := revision == previousRevision+(if changed then 1 else 0);\r
            end if;\r
            rejectionReason := 5;\r
            if valid then\r
              // Validate the old geometry against the old catalog before\r
              // reprojection can hide corruption or pruning can erase it.\r
              if not reset then\r
                for slot in 1:size(previousPoint,1) loop\r
                  if previousOccupied[slot] == 1 then\r
                    owner := previousAnchorSlot[slot];\r
                    slotValid := owner >= 1 and owner <= size(previousNodeEnabled,1)\r
                      and previousAnchorId[slot] >= 1 and previousAnchorId[slot] <= RGBDMapAnchors.identifierLimit\r
                      and previousConfidence[slot] >= 1 and previousConfidence[slot] <= maximumConfidence\r
                      and floor(previousConfidence[slot]) == previousConfidence[slot]\r
                      and previousLastSeen[slot] >= 0 and previousLastSeen[slot] <= previousTime\r
                      and previousLastFrame[slot] >= 1 and previousLastFrame[slot] <= previousFrame\r
                      and floor(previousLastFrame[slot]) == previousLastFrame[slot];\r
                    for axis in 1:3 loop\r
                      slotValid := slotValid and abs(previousPoint[slot,axis]) <= coordinateLimit\r
                        and abs(previousLocalPoint[slot,axis]) <= coordinateLimit;\r
                    end for;\r
                    if slotValid then\r
                      slotValid := previousNodeEnabled[owner] and previousNodeId[owner] == previousAnchorId[slot];\r
                      if slotValid then\r
                        reconstructed := previousNodeRotation[owner,:,:]*previousLocalPoint[slot,:]+previousNodePosition[owner,:];\r
                        for axis in 1:3 loop\r
                          slotValid := slotValid and abs(reconstructed[axis]-previousPoint[slot,axis]) <= consistencyTolerance;\r
                        end for;\r
                      end if;\r
                    end if;\r
                    valid := valid and slotValid;\r
                  else valid := valid and previousOccupied[slot] == 0; end if;\r
                end for;\r
              end if;\r
              rejectionReason := 6;\r
              if valid then\r
                if reset then\r
                  point := zeros(size(previousPoint,1),3); occupied := zeros(size(previousPoint,1));\r
                  confidence := zeros(size(previousPoint,1)); lastSeen := zeros(size(previousPoint,1));\r
                  lastFrame := zeros(size(previousPoint,1)); localPoint := zeros(size(previousPoint,1),3);\r
                  anchorId := fill(0,size(previousPoint,1)); anchorSlot := fill(0,size(previousPoint,1));\r
                  accepted := true;\r
                elseif changed then\r
                  (point,localPoint,occupied,anchorId,anchorSlot,unusedRevision,correctionAccepted,correctionReason,\r
                    projectedCount,evictedCount) := RGBDMapAnchors.Reproject(\r
                      previousPoint,previousLocalPoint,previousOccupied,previousAnchorId,previousAnchorSlot,\r
                      previousGeneration,previousRevision,nodeEnabled,nodeId,nodePosition,nodeRotation,\r
                      generation,revision,true,true,coordinateLimit);\r
                  accepted := correctionAccepted;\r
                  if accepted then\r
                    for slot in 1:size(previousPoint,1) loop\r
                      if occupied[slot] == 0 then\r
                        confidence[slot] := 0; lastSeen[slot] := 0; lastFrame[slot] := 0;\r
                      end if;\r
                    end for;\r
                  end if;\r
                else accepted := true; end if;\r
                rejectionReason := if accepted then 0 else 7;\r
              end if;\r
            end if;\r
          end if;\r
        end if;\r
      end if;\r
    end if;\r
    if not accepted then\r
      point := previousPoint; occupied := previousOccupied; confidence := previousConfidence;\r
      lastSeen := previousLastSeen; lastFrame := previousLastFrame;\r
      localPoint := previousLocalPoint; anchorId := previousAnchorId; anchorSlot := previousAnchorSlot;\r
      projectedCount := 0; evictedCount := 0;\r
    end if;\r
  end Synchronize;\r
end RGBDLandmarkCatalog;\r
\r
function UpdateCatalogLandmarkMap\r
\r
  extends RGBDLandmarkMapInterface;\r
  input Real previousLocalPoint[size(previousOccupied,1),3];\r
  input Integer previousAnchorId[size(previousOccupied,1)]; input Integer previousAnchorSlot[size(previousOccupied,1)];\r
  input Integer previousGeneration; input Integer previousCatalogRevision;\r
  input Boolean previousNodeEnabled[:]; input Integer previousNodeId[size(previousNodeEnabled,1)];\r
  input Real previousNodePosition[size(previousNodeEnabled,1),3];\r
  input Real previousNodeRotation[size(previousNodeEnabled,1),3,3];\r
  input Boolean nodeEnabled[size(previousNodeEnabled,1)]; input Integer nodeId[size(previousNodeEnabled,1)];\r
  input Real nodePosition[size(previousNodeEnabled,1),3]; input Real nodeRotation[size(previousNodeEnabled,1),3,3];\r
  input Integer catalogGeneration; input Integer catalogRevision;\r
  input Integer selectedAnchorId; input Integer selectedAnchorSlot;\r
  input Boolean catalogAccepted; input Boolean requested; input Real consistencyTolerance;\r
  input Integer previousPoseRevision = previousCatalogRevision;\r
  input Integer poseRevision = catalogRevision;\r
  output Real localPoint[size(previousOccupied,1),3];\r
  output Integer anchorId[size(previousOccupied,1)]; output Integer anchorSlot[size(previousOccupied,1)];\r
  output Integer nextGeneration; output Integer nextCatalogRevision;\r
  output Integer catalogRejectionReason; output Integer correctionReason;\r
  output Real updateRejectionReason; output Real mapRejectionReason; output Integer anchorRejectionReason;\r
  output Integer projectedCount; output Integer evictedCount;\r
  output Integer assignedCount; output Integer retainedCount; output Integer clearedCount;\r
protected\r
  Real preparedPoint[size(previousOccupied,1),3]; Real preparedOccupied[size(previousOccupied,1)];\r
  Real preparedConfidence[size(previousOccupied,1)]; Real preparedLastSeen[size(previousOccupied,1)];\r
  Real preparedLastFrame[size(previousOccupied,1)]; Real preparedLocal[size(previousOccupied,1),3];\r
  Integer preparedId[size(previousOccupied,1)]; Integer preparedSlot[size(previousOccupied,1)]; Boolean prepared;\r
algorithm\r
  point := previousPoint; occupied := previousOccupied; confidence := previousConfidence;\r
  lastSeen := previousLastSeen; lastFrame := previousLastFrame;\r
  localPoint := previousLocalPoint; anchorId := previousAnchorId; anchorSlot := previousAnchorSlot;\r
  nextTime := previousTime; nextFrame := previousFrame; nextWorldFrame := previousWorldFrame;\r
  nextGeneration := previousGeneration; nextCatalogRevision := previousCatalogRevision;\r
  accepted := 0; rejectionReason := 1; updateRejectionReason := 0; mapRejectionReason := 0; anchorRejectionReason := 0;\r
  projectedCount := 0; evictedCount := 0; assignedCount := 0; retainedCount := 0; clearedCount := 0;\r
  insertedCount := 0; mergedCount := 0; prunedCount := 0; droppedCount := 0; invalidCandidateCount := 0;\r
  (preparedPoint,preparedOccupied,preparedConfidence,preparedLastSeen,preparedLastFrame,\r
    preparedLocal,preparedId,preparedSlot,prepared,catalogRejectionReason,correctionReason,projectedCount,evictedCount) :=\r
    RGBDLandmarkCatalog.Synchronize(previousPoint,previousOccupied,previousConfidence,previousLastSeen,previousLastFrame,\r
      previousLocalPoint,previousAnchorId,previousAnchorSlot,previousGeneration,previousPoseRevision,\r
      previousNodeEnabled,previousNodeId,previousNodePosition,previousNodeRotation,\r
      nodeEnabled,nodeId,nodePosition,nodeRotation,catalogGeneration,poseRevision,catalogAccepted,requested,\r
      resetRequested == 1.0,previousTime,previousFrame,maximumConfidence,coordinateLimit,consistencyTolerance);\r
  if requested then\r
    rejectionReason := 2;\r
    if prepared then\r
      (point,occupied,confidence,lastSeen,lastFrame,confirmed,accepted,updateRejectionReason,nextTime,nextFrame,nextWorldFrame,\r
        occupiedCount,confirmedCount,tentativeCount,insertedCount,mergedCount,prunedCount,droppedCount,invalidCandidateCount,\r
        localPoint,anchorId,anchorSlot,nextGeneration,mapRejectionReason,anchorRejectionReason,assignedCount,retainedCount,clearedCount) :=\r
        UpdateAnchoredLandmarkMap(preparedPoint,preparedOccupied,preparedConfidence,preparedLastSeen,preparedLastFrame,\r
          candidatePoint,candidateEnabled,candidateCount,bodyPosition,poseAccepted,previousTime,timeNow,previousFrame,frameNow,\r
          previousWorldFrame,worldFrame,resetRequested,coordinateLimit,voxelWidth,mergeRadius,maximumDistance,\r
          tentativeLifetime,confirmedLifetime,confirmationObservations,maximumConfidence,maximumTentative,\r
          preparedLocal,preparedId,preparedSlot,previousGeneration,nodeEnabled,nodeId,nodePosition,nodeRotation,\r
          catalogGeneration,catalogGeneration,selectedAnchorId,selectedAnchorSlot,true,consistencyTolerance);\r
      rejectionReason := if accepted == 1.0 then 0 else 3;\r
      if accepted == 1.0 then\r
        nextCatalogRevision := catalogRevision;\r
        prunedCount := prunedCount+evictedCount;\r
      end if;\r
    end if;\r
  end if;\r
  if accepted <> 1.0 then\r
    // A later map/anchor failure must undo catalog eviction and reprojection,\r
    // not merely hold the already prepared geometry.\r
    point := previousPoint; occupied := previousOccupied; confidence := previousConfidence;\r
    lastSeen := previousLastSeen; lastFrame := previousLastFrame;\r
    localPoint := previousLocalPoint; anchorId := previousAnchorId; anchorSlot := previousAnchorSlot;\r
    nextTime := previousTime; nextFrame := previousFrame; nextWorldFrame := previousWorldFrame;\r
    nextGeneration := previousGeneration; nextCatalogRevision := previousCatalogRevision;\r
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
end UpdateCatalogLandmarkMap;\r
`;export{e as default};
