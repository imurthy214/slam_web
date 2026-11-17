const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Geometry, observation metadata and keyframe-local anchors share one commit.\r
// This owner consumes a coherent catalog proposal; catalog/filter/graph commits\r
// must still be coordinated by the enclosing SLAM transaction.\r
function UpdateAnchoredLandmarkMap\r
\r
  extends RGBDLandmarkMapInterface;\r
  input Real previousLocalPoint[size(previousOccupied,1),3];\r
  input Integer previousAnchorId[size(previousOccupied,1)];\r
  input Integer previousAnchorSlot[size(previousOccupied,1)];\r
  input Integer previousGeneration;\r
  input Boolean nodeEnabled[:]; input Integer nodeId[size(nodeEnabled,1)];\r
  input Real nodePosition[size(nodeEnabled,1),3]; input Real nodeRotation[size(nodeEnabled,1),3,3];\r
  input Integer catalogGeneration; input Integer generation;\r
  input Integer selectedAnchorId; input Integer selectedAnchorSlot;\r
  input Boolean requested; input Real consistencyTolerance;\r
  output Real localPoint[size(previousOccupied,1),3];\r
  output Integer anchorId[size(previousOccupied,1)]; output Integer anchorSlot[size(previousOccupied,1)];\r
  output Integer nextGeneration;\r
  output Real mapRejectionReason; output Integer anchorRejectionReason;\r
  output Integer assignedCount; output Integer retainedCount; output Integer clearedCount;\r
protected\r
  Integer insertedFeature[size(previousOccupied,1)];\r
  Boolean anchorsAccepted;\r
algorithm\r
  point := previousPoint; occupied := previousOccupied; confidence := previousConfidence;\r
  lastSeen := previousLastSeen; lastFrame := previousLastFrame;\r
  nextTime := previousTime; nextFrame := previousFrame; nextWorldFrame := previousWorldFrame;\r
  localPoint := previousLocalPoint; anchorId := previousAnchorId; anchorSlot := previousAnchorSlot;\r
  nextGeneration := previousGeneration;\r
  accepted := 0.0; rejectionReason := 1.0; mapRejectionReason := 0.0; anchorRejectionReason := 0;\r
  assignedCount := 0; retainedCount := 0; clearedCount := 0;\r
  insertedCount := 0.0; mergedCount := 0.0; prunedCount := 0.0;\r
  droppedCount := 0.0; invalidCandidateCount := 0.0;\r
  if requested then\r
    (point,occupied,confidence,lastSeen,lastFrame,confirmed,accepted,mapRejectionReason,nextTime,nextFrame,nextWorldFrame,\r
      occupiedCount,confirmedCount,tentativeCount,insertedCount,mergedCount,prunedCount,droppedCount,invalidCandidateCount,\r
      insertedFeature) := UpdateLandmarkMapWithReceipts(\r
        previousPoint,previousOccupied,previousConfidence,previousLastSeen,previousLastFrame,candidatePoint,candidateEnabled,\r
        candidateCount,bodyPosition,poseAccepted,previousTime,timeNow,previousFrame,frameNow,previousWorldFrame,worldFrame,resetRequested,\r
        coordinateLimit,voxelWidth,mergeRadius,maximumDistance,tentativeLifetime,confirmedLifetime,confirmationObservations,\r
        maximumConfidence,maximumTentative);\r
    rejectionReason := 2.0;\r
    if accepted == 1.0 then\r
      (localPoint,anchorId,anchorSlot,nextGeneration,anchorsAccepted,anchorRejectionReason,\r
        assignedCount,retainedCount,clearedCount) := AssignLandmarkAnchors(\r
          previousPoint,previousOccupied,previousLocalPoint,previousAnchorId,previousAnchorSlot,previousGeneration,\r
          point,occupied,insertedFeature,candidatePoint,candidateEnabled,candidateCount,\r
          nodeEnabled,nodeId,nodePosition,nodeRotation,catalogGeneration,generation,selectedAnchorId,selectedAnchorSlot,\r
          true,true,resetRequested == 1.0,coordinateLimit,consistencyTolerance);\r
      accepted := if anchorsAccepted then 1.0 else 0.0;\r
      rejectionReason := if anchorsAccepted then 0.0 else 3.0;\r
    end if;\r
  end if;\r
  if accepted <> 1.0 then\r
    // Even a failure discovered at the final landmark rolls back the map's\r
    // merges, pruning, insertion and clocks, as well as every anchor field.\r
    point := previousPoint; occupied := previousOccupied; confidence := previousConfidence;\r
    lastSeen := previousLastSeen; lastFrame := previousLastFrame;\r
    nextTime := previousTime; nextFrame := previousFrame; nextWorldFrame := previousWorldFrame;\r
    localPoint := previousLocalPoint; anchorId := previousAnchorId; anchorSlot := previousAnchorSlot;\r
    nextGeneration := previousGeneration;\r
    insertedCount := 0.0; mergedCount := 0.0; prunedCount := 0.0;\r
    droppedCount := 0.0; invalidCandidateCount := 0.0;\r
    assignedCount := 0; retainedCount := 0; clearedCount := 0;\r
    // Accepted counts come directly from the map kernel. Recompute only on\r
    // rollback so diagnostics cannot describe its discarded tentative state.\r
    occupiedCount := 0.0; confirmedCount := 0.0; tentativeCount := 0.0;\r
    for slot in 1:size(previousOccupied,1) loop\r
      confirmed[slot] := if occupied[slot] == 1.0 and confidence[slot] >= confirmationObservations then 1.0 else 0.0;\r
      occupiedCount := occupiedCount+(if occupied[slot] == 1.0 then 1.0 else 0.0);\r
      confirmedCount := confirmedCount+confirmed[slot];\r
      tentativeCount := tentativeCount+(if occupied[slot] == 1.0 and confirmed[slot] == 0.0 then 1.0 else 0.0);\r
    end for;\r
  end if;\r
end UpdateAnchoredLandmarkMap;\r
\r
model RGBDAnchoredLandmarkMap\r
\r
  constant Integer imageHeight = 90; constant Integer imageWidth = 160;\r
  constant Integer mapCapacity = imageHeight*imageWidth;\r
  constant Integer featureCapacity = 350; constant Integer keyframeCapacity = 64;\r
  constant Integer dimension = 3;\r
  parameter Real coordinateLimit = 1e6; parameter Real voxelWidth = 0.25;\r
  parameter Real mergeRadius = 0.15; parameter Real maximumDistance = 80.0;\r
  parameter Real tentativeLifetime = 0.5; parameter Real confirmedLifetime = 5.0;\r
  parameter Real confirmationObservations = 3.0; parameter Real maximumConfidence = 8.0;\r
  parameter Real maximumTentative = 700.0; parameter Real consistencyTolerance = 1e-6;\r
  input Real previousPoint[mapCapacity,dimension] = zeros(mapCapacity,dimension);\r
  input Real previousOccupied[mapCapacity] = zeros(mapCapacity);\r
  input Real previousConfidence[mapCapacity] = zeros(mapCapacity);\r
  input Real previousLastSeen[mapCapacity] = zeros(mapCapacity);\r
  input Real previousLastFrame[mapCapacity] = zeros(mapCapacity);\r
  input Real candidatePoint[featureCapacity,dimension] = zeros(featureCapacity,dimension);\r
  input Real candidateEnabled[featureCapacity] = zeros(featureCapacity); input Real candidateCount = 0.0;\r
  input Real bodyPosition[dimension] = zeros(dimension); input Real poseAccepted = 1.0;\r
  input Real previousTime = 0.0; input Real timeNow = 0.0;\r
  input Real previousFrame = 0.0; input Real frameNow = 1.0;\r
  input Real previousWorldFrame = 0.0; input Real worldFrame = 0.0; input Real resetRequested = 0.0;\r
  input Real previousLocalPoint[mapCapacity,dimension] = zeros(mapCapacity,dimension);\r
  input Integer previousAnchorId[mapCapacity] = fill(0,mapCapacity);\r
  input Integer previousAnchorSlot[mapCapacity] = fill(0,mapCapacity); input Integer previousGeneration = 1;\r
  input Boolean nodeEnabled[keyframeCapacity] = fill(false,keyframeCapacity);\r
  input Integer nodeId[keyframeCapacity] = fill(0,keyframeCapacity);\r
  input Real nodePosition[keyframeCapacity,dimension] = zeros(keyframeCapacity,dimension);\r
  input Real nodeRotation[keyframeCapacity,dimension,dimension] = zeros(keyframeCapacity,dimension,dimension);\r
  input Integer catalogGeneration = 1; input Integer generation = 1;\r
  input Integer selectedAnchorId = 0; input Integer selectedAnchorSlot = 0; input Boolean requested = true;\r
  output Real point[mapCapacity,dimension]; output Real occupied[mapCapacity];\r
  output Real confidence[mapCapacity]; output Real lastSeen[mapCapacity]; output Real lastFrame[mapCapacity];\r
  output Real confirmed[mapCapacity]; output Real accepted; output Real rejectionReason;\r
  output Real nextTime; output Real nextFrame; output Real nextWorldFrame;\r
  output Real occupiedCount; output Real confirmedCount; output Real tentativeCount;\r
  output Real insertedCount; output Real mergedCount; output Real prunedCount;\r
  output Real droppedCount; output Real invalidCandidateCount;\r
  output Real localPoint[mapCapacity,dimension]; output Integer anchorId[mapCapacity];\r
  output Integer anchorSlot[mapCapacity]; output Integer nextGeneration;\r
  output Real mapRejectionReason; output Integer anchorRejectionReason;\r
  output Integer assignedCount; output Integer retainedCount; output Integer clearedCount;\r
equation\r
  (point,occupied,confidence,lastSeen,lastFrame,confirmed,accepted,rejectionReason,nextTime,nextFrame,nextWorldFrame,\r
    occupiedCount,confirmedCount,tentativeCount,insertedCount,mergedCount,prunedCount,droppedCount,invalidCandidateCount,\r
    localPoint,anchorId,anchorSlot,nextGeneration,mapRejectionReason,anchorRejectionReason,\r
    assignedCount,retainedCount,clearedCount) = UpdateAnchoredLandmarkMap(\r
      previousPoint,previousOccupied,previousConfidence,previousLastSeen,previousLastFrame,candidatePoint,candidateEnabled,\r
      candidateCount,bodyPosition,poseAccepted,previousTime,timeNow,previousFrame,frameNow,previousWorldFrame,worldFrame,resetRequested,\r
      coordinateLimit,voxelWidth,mergeRadius,maximumDistance,tentativeLifetime,confirmedLifetime,confirmationObservations,\r
      maximumConfidence,maximumTentative,previousLocalPoint,previousAnchorId,previousAnchorSlot,previousGeneration,\r
      nodeEnabled,nodeId,nodePosition,nodeRotation,catalogGeneration,generation,selectedAnchorId,selectedAnchorSlot,\r
      requested,consistencyTolerance);\r
end RGBDAnchoredLandmarkMap;\r
`;export{e as default};
