const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Persistent state is explicit: callers retain only accepted next-state outputs.\r
// All coordinates are in one unchanged world ENU frame. Points come from\r
// RGBDLandmarkProjection and bodyPosition is estimated, never ground truth.\r
partial function RGBDLandmarkMapInterface\r
  input Real previousPoint[:,:];\r
  input Real previousOccupied[:];\r
  input Real previousConfidence[:];\r
  input Real previousLastSeen[:];\r
  input Real previousLastFrame[:];\r
  input Real candidatePoint[:,:];\r
  input Real candidateEnabled[:];\r
  input Real candidateCount;\r
  input Real bodyPosition[3];\r
  input Real poseAccepted;\r
  input Real previousTime;\r
  input Real timeNow;\r
  input Real previousFrame;\r
  input Real frameNow;\r
  input Real previousWorldFrame;\r
  input Real worldFrame;\r
  input Real resetRequested;\r
  input Real coordinateLimit;\r
  input Real voxelWidth;\r
  input Real mergeRadius;\r
  input Real maximumDistance;\r
  input Real tentativeLifetime;\r
  input Real confirmedLifetime;\r
  input Real confirmationObservations;\r
  input Real maximumConfidence;\r
  input Real maximumTentative;\r
  output Real point[size(previousOccupied,1),3];\r
  output Real occupied[size(previousOccupied,1)];\r
  output Real confidence[size(previousOccupied,1)];\r
  output Real lastSeen[size(previousOccupied,1)];\r
  output Real lastFrame[size(previousOccupied,1)];\r
  output Real confirmed[size(previousOccupied,1)];\r
  output Real accepted;\r
  output Real rejectionReason;\r
  output Real nextTime;\r
  output Real nextFrame;\r
  output Real nextWorldFrame;\r
  output Real occupiedCount;\r
  output Real confirmedCount;\r
  output Real tentativeCount;\r
  output Real insertedCount;\r
  output Real mergedCount;\r
  output Real prunedCount;\r
  output Real droppedCount;\r
  output Real invalidCandidateCount;\r
end RGBDLandmarkMapInterface;\r
\r
function UpdateLandmarkMapWithReceipts\r
\r
  extends RGBDLandmarkMapInterface;\r
  output Integer insertedFeature[size(previousOccupied,1)] "Original candidate slot, zero for retained/empty slots";\r
protected\r
  Boolean configurationValid;\r
  Boolean stateValid;\r
  Boolean slotValid;\r
  Boolean reset;\r
  Boolean initialObservation;\r
  Boolean present;\r
  Boolean keep;\r
  Boolean candidateValid;\r
  Boolean insert;\r
  Boolean merge;\r
  Real safeCandidate[3];\r
  Real difference[3];\r
  Real distanceSquared;\r
  Real lifetime;\r
  Integer spatialHead[RGBDSpatialIndex.defaultBucketCount];\r
  Integer spatialLink[size(previousOccupied,1)];\r
  Integer spatialCell[size(previousOccupied,1),3];\r
  Integer freeNext[size(previousOccupied,1)];\r
  Integer firstFree;\r
  Integer visited;\r
  Integer bucket;\r
  Boolean indexValid;\r
  Boolean queryValid;\r
  Boolean cellValid;\r
  Boolean linearSearch;\r
  Integer duplicate;\r
  Integer vacant;\r
  Integer destination;\r
algorithm\r
  reset := resetRequested >= 1.0 and resetRequested <= 1.0;\r
  // Only the first observation may share the empty map's zero timestamp.\r
  // State validation below rules out every occupied slot at previousFrame=0.\r
  // Later observations still require strictly increasing acquisition time.\r
  initialObservation := previousFrame == 0.0 and previousTime == 0.0 and timeNow == 0.0;\r
  slotValid := false; present := false; keep := false;\r
  candidateValid := false; insert := false; merge := false;\r
  safeCandidate := zeros(3); difference := zeros(3);\r
  distanceSquared := 0.0; lifetime := 0.0;\r
  duplicate := 0; vacant := 0; destination := 1;\r
  spatialHead := fill(0,RGBDSpatialIndex.defaultBucketCount);\r
  spatialLink := fill(0,size(previousOccupied,1));\r
  spatialCell := fill(0,size(previousOccupied,1),3);\r
  freeNext := fill(0,size(previousOccupied,1));\r
  firstFree := 0; visited := 0; bucket := 1;\r
  indexValid := true; queryValid := false; cellValid := false; linearSearch := false;\r
  confirmed := zeros(size(previousOccupied,1));\r
  insertedFeature := fill(0,size(previousOccupied,1));\r
  configurationValid := size(previousPoint,1) == size(previousOccupied,1) and size(previousPoint,2) == 3\r
    and size(previousConfidence,1) == size(previousOccupied,1) and size(previousLastSeen,1) == size(previousOccupied,1)\r
    and size(previousLastFrame,1) == size(previousOccupied,1) and size(candidatePoint,1) == size(candidateEnabled,1)\r
    and size(candidatePoint,2) == 3 and size(previousOccupied,1) > 0\r
    and size(previousOccupied,1) <= RGBDSpatialIndex.maximumSlotCount\r
    and coordinateLimit > 0.0 and coordinateLimit <= 1e6 and voxelWidth >= 0.001 and voxelWidth <= 10.0\r
    and mergeRadius >= 0.0 and mergeRadius <= 10.0 and maximumDistance > 0.0 and maximumDistance <= 1e4\r
    and tentativeLifetime > 0.0 and tentativeLifetime <= 1e4 and confirmedLifetime >= tentativeLifetime and confirmedLifetime <= 1e4\r
    and confirmationObservations >= 2.0 and confirmationObservations <= maximumConfidence and floor(confirmationObservations) == confirmationObservations\r
    and maximumConfidence <= 100.0 and floor(maximumConfidence) == maximumConfidence\r
    and maximumTentative >= 0.0 and maximumTentative <= size(previousOccupied,1) and floor(maximumTentative) == maximumTentative\r
    and candidateCount >= 0.0 and candidateCount <= size(candidateEnabled,1) and floor(candidateCount) == candidateCount\r
    and poseAccepted >= 1.0 and poseAccepted <= 1.0\r
    and abs(bodyPosition[1]) <= coordinateLimit and abs(bodyPosition[2]) <= coordinateLimit and abs(bodyPosition[3]) <= coordinateLimit\r
    and timeNow >= 0.0 and timeNow <= 1e9\r
    and worldFrame >= 0.0 and worldFrame <= 1e9 and floor(worldFrame) == worldFrame\r
    and ((reset and frameNow == 1.0) or (resetRequested >= 0.0 and resetRequested <= 0.0\r
      and previousTime >= 0.0 and previousTime <= 1e9 and (previousTime < timeNow or initialObservation)\r
      and previousFrame >= 0.0 and previousFrame < 1e9 and floor(previousFrame) == previousFrame and frameNow == previousFrame+1.0\r
      and previousWorldFrame == worldFrame));\r
  stateValid := true;\r
  for slot in 1:size(previousOccupied,1) loop\r
    slotValid := previousOccupied[slot] >= 0.0 and previousOccupied[slot] <= 0.0\r
      or (previousOccupied[slot] >= 1.0 and previousOccupied[slot] <= 1.0\r
        and abs(previousPoint[slot,1]) <= coordinateLimit and abs(previousPoint[slot,2]) <= coordinateLimit and abs(previousPoint[slot,3]) <= coordinateLimit\r
        and previousConfidence[slot] >= 1.0 and previousConfidence[slot] <= maximumConfidence and floor(previousConfidence[slot]) == previousConfidence[slot]\r
        and previousLastSeen[slot] >= 0.0 and previousLastSeen[slot] <= previousTime\r
        and previousLastFrame[slot] >= 1.0 and previousLastFrame[slot] <= previousFrame and floor(previousLastFrame[slot]) == previousLastFrame[slot]);\r
    stateValid := stateValid and (reset or slotValid);\r
  end for;\r
  accepted := if configurationValid and stateValid then 1.0 else 0.0;\r
  rejectionReason := if not configurationValid then 1.0 else if not stateValid then 2.0 else 0.0;\r
  point := previousPoint; occupied := previousOccupied; confidence := previousConfidence;\r
  lastSeen := previousLastSeen; lastFrame := previousLastFrame;\r
  nextTime := if accepted > 0.5 then timeNow else previousTime;\r
  nextFrame := if accepted > 0.5 then frameNow else previousFrame;\r
  nextWorldFrame := if accepted > 0.5 then worldFrame else previousWorldFrame;\r
  insertedCount := 0.0; mergedCount := 0.0; prunedCount := 0.0; droppedCount := 0.0; invalidCandidateCount := 0.0;\r
  tentativeCount := 0.0;\r
  // Prune before insertion. Empty storage is canonicalized only on acceptance.\r
  for slot in 1:size(previousOccupied,1) loop\r
    present := accepted > 0.5 and not reset and previousOccupied[slot] > 0.5;\r
    difference := if present then previousPoint[slot,:]-bodyPosition else zeros(3);\r
    distanceSquared := difference[1]*difference[1]+difference[2]*difference[2]+difference[3]*difference[3];\r
    lifetime := if present and previousConfidence[slot] >= confirmationObservations then confirmedLifetime else tentativeLifetime;\r
    keep := present and timeNow-previousLastSeen[slot] <= lifetime and distanceSquared <= maximumDistance*maximumDistance;\r
    prunedCount := prunedCount+(if present and not keep then 1.0 else 0.0);\r
    point[slot,:] := if accepted > 0.5 and not keep then zeros(3) else point[slot,:];\r
    occupied[slot] := if accepted > 0.5 then (if keep then 1.0 else 0.0) else occupied[slot];\r
    confidence[slot] := if accepted > 0.5 and not keep then 0.0 else confidence[slot];\r
    lastSeen[slot] := if accepted > 0.5 and not keep then 0.0 else lastSeen[slot];\r
    lastFrame[slot] := if accepted > 0.5 and not keep then 0.0 else lastFrame[slot];\r
    tentativeCount := tentativeCount+(if keep and confidence[slot] < confirmationObservations then 1.0 else 0.0);\r
  end for;\r
  // Build once after pruning. The index is local to this transaction, so it\r
  // cannot become stale across a reset, accepted pose or retained map update.\r
  if accepted > 0.5 then\r
    (spatialHead,spatialLink,spatialCell,freeNext,firstFree,indexValid) :=\r
      RGBDSpatialIndex.Build(point,occupied,voxelWidth);\r
  end if;\r
  // Raster candidate order is stable, including sparse final slots. Repeated\r
  // candidates in one frame never count as independent confirmation evidence.\r
  for feature in 1:size(candidateEnabled,1) loop\r
    candidateValid := accepted > 0.5 and indexValid and feature <= candidateCount and candidateEnabled[feature] >= 1.0 and candidateEnabled[feature] <= 1.0\r
      and abs(candidatePoint[feature,1]) <= coordinateLimit and abs(candidatePoint[feature,2]) <= coordinateLimit and abs(candidatePoint[feature,3]) <= coordinateLimit;\r
    invalidCandidateCount := invalidCandidateCount+(if accepted > 0.5 and feature <= candidateCount\r
      and not (candidateEnabled[feature] >= 0.0 and candidateEnabled[feature] <= 0.0) and not candidateValid then 1.0 else 0.0);\r
    safeCandidate := if candidateValid then candidatePoint[feature,:] else zeros(3);\r
    difference := if candidateValid then safeCandidate-bodyPosition else zeros(3);\r
    distanceSquared := difference[1]*difference[1]+difference[2]*difference[2]+difference[3]*difference[3];\r
    candidateValid := candidateValid and distanceSquared <= maximumDistance*maximumDistance;\r
    duplicate := 0; vacant := 0;\r
    if candidateValid then\r
      (duplicate,queryValid,visited,linearSearch) := RGBDSpatialIndex.Find(\r
        point,occupied,spatialHead,spatialLink,spatialCell,safeCandidate,voxelWidth,mergeRadius,true);\r
      indexValid := indexValid and queryValid;\r
      candidateValid := candidateValid and queryValid;\r
      vacant := if queryValid then firstFree else 0;\r
    end if;\r
    merge := candidateValid and duplicate > 0;\r
    insert := candidateValid and duplicate == 0 and vacant > 0 and tentativeCount < maximumTentative;\r
    destination := if duplicate > 0 then duplicate else if vacant > 0 then vacant else 1;\r
    tentativeCount := tentativeCount+(if insert then 1.0 else if merge and lastFrame[destination] < frameNow\r
      and confidence[destination] < confirmationObservations and confidence[destination]+1.0 >= confirmationObservations then -1.0 else 0.0);\r
    point[destination,:] := if insert then safeCandidate else point[destination,:];\r
    occupied[destination] := if insert then 1.0 else occupied[destination];\r
    confidence[destination] := if insert then 1.0 else if merge and lastFrame[destination] < frameNow\r
      then min(maximumConfidence,confidence[destination]+1.0) else confidence[destination];\r
    lastSeen[destination] := if insert or merge then timeNow else lastSeen[destination];\r
    lastFrame[destination] := if insert or merge then frameNow else lastFrame[destination];\r
    insertedFeature[destination] := if insert then feature else insertedFeature[destination];\r
    insertedCount := insertedCount+(if insert then 1.0 else 0.0);\r
    mergedCount := mergedCount+(if merge then 1.0 else 0.0);\r
    droppedCount := droppedCount+(if candidateValid and not insert and not merge then 1.0 else 0.0);\r
    if insert then\r
      // A merge keeps the original anchor; only insertions change the index.\r
      // Update local arrays instead of returning/copying a table per feature.\r
      (spatialCell[destination,:],cellValid) := RGBDSpatialIndex.Cell(safeCandidate,voxelWidth);\r
      indexValid := indexValid and cellValid;\r
      if cellValid then\r
        bucket := RGBDSpatialIndex.Bucket(spatialCell[destination,:],size(spatialHead,1));\r
        spatialLink[destination] := spatialHead[bucket];\r
        spatialHead[bucket] := destination;\r
        firstFree := freeNext[destination];\r
        freeNext[destination] := 0;\r
      end if;\r
    end if;\r
  end for;\r
  // Refuse an invalid private index atomically, just like invalid public state.\r
  if accepted > 0.5 and not indexValid then\r
    accepted := 0.0; rejectionReason := 3.0;\r
    point := previousPoint; occupied := previousOccupied; confidence := previousConfidence;\r
    lastSeen := previousLastSeen; lastFrame := previousLastFrame;\r
    nextTime := previousTime; nextFrame := previousFrame; nextWorldFrame := previousWorldFrame;\r
    insertedCount := 0.0; mergedCount := 0.0; prunedCount := 0.0;\r
    droppedCount := 0.0; invalidCandidateCount := 0.0;\r
    insertedFeature := fill(0,size(previousOccupied,1));\r
  end if;\r
  occupiedCount := 0.0; confirmedCount := 0.0; tentativeCount := 0.0;\r
  for slot in 1:size(previousOccupied,1) loop\r
    confirmed[slot] := if occupied[slot] >= 1.0 and occupied[slot] <= 1.0 and confidence[slot] >= confirmationObservations then 1.0 else 0.0;\r
    occupiedCount := occupiedCount+(if occupied[slot] >= 1.0 and occupied[slot] <= 1.0 then 1.0 else 0.0);\r
    confirmedCount := confirmedCount+confirmed[slot];\r
    tentativeCount := tentativeCount+(if occupied[slot] >= 1.0 and occupied[slot] <= 1.0 and confirmed[slot] < 0.5 then 1.0 else 0.0);\r
  end for;\r
end UpdateLandmarkMapWithReceipts;\r
\r
// Existing public numerical interface delegates to the same kernel. Receipts\r
// are consumed by anchored composition; old callers retain their exact outputs.\r
function UpdateLandmarkMap\r
\r
  extends RGBDLandmarkMapInterface;\r
protected\r
  Integer unusedReceipt[size(previousOccupied,1)];\r
algorithm\r
  (point,occupied,confidence,lastSeen,lastFrame,confirmed,accepted,rejectionReason,nextTime,nextFrame,nextWorldFrame,\r
    occupiedCount,confirmedCount,tentativeCount,insertedCount,mergedCount,prunedCount,droppedCount,invalidCandidateCount,\r
    unusedReceipt) := UpdateLandmarkMapWithReceipts(\r
      previousPoint,previousOccupied,previousConfidence,previousLastSeen,previousLastFrame,candidatePoint,candidateEnabled,\r
      candidateCount,bodyPosition,poseAccepted,previousTime,timeNow,previousFrame,frameNow,previousWorldFrame,worldFrame,resetRequested,\r
      coordinateLimit,voxelWidth,mergeRadius,maximumDistance,tentativeLifetime,confirmedLifetime,confirmationObservations,\r
      maximumConfidence,maximumTentative);\r
end UpdateLandmarkMap;\r
\r
model RGBDLandmarkMap\r
\r
  constant Integer imageHeight = 90;\r
  constant Integer imageWidth = 160;\r
  constant Integer mapCapacity = imageHeight*imageWidth;\r
  constant Integer featureCapacity = 350;\r
  constant Integer dimension = 3;\r
  parameter Real coordinateLimit = 1e6;\r
  parameter Real voxelWidth = 0.25;\r
  parameter Real mergeRadius = 0.15;\r
  parameter Real maximumDistance = 80.0;\r
  parameter Real tentativeLifetime = 0.5;\r
  parameter Real confirmedLifetime = 5.0;\r
  parameter Real confirmationObservations = 3.0;\r
  parameter Real maximumConfidence = 8.0;\r
  parameter Real maximumTentative = 700.0;\r
  input Real previousPoint[mapCapacity,dimension] = zeros(mapCapacity,dimension);\r
  input Real previousOccupied[mapCapacity] = zeros(mapCapacity);\r
  input Real previousConfidence[mapCapacity] = zeros(mapCapacity);\r
  input Real previousLastSeen[mapCapacity] = zeros(mapCapacity);\r
  input Real previousLastFrame[mapCapacity] = zeros(mapCapacity);\r
  input Real candidatePoint[featureCapacity,dimension] = zeros(featureCapacity,dimension);\r
  input Real candidateEnabled[featureCapacity] = zeros(featureCapacity);\r
  input Real candidateCount = 0.0;\r
  input Real bodyPosition[dimension] = zeros(dimension);\r
  input Real poseAccepted = 1.0;\r
  input Real previousTime = 0.0;\r
  input Real timeNow = 0.0;\r
  input Real previousFrame = 0.0;\r
  input Real frameNow = 1.0;\r
  input Real previousWorldFrame = 0.0;\r
  input Real worldFrame = 0.0;\r
  input Real resetRequested = 0.0;\r
  output Real point[mapCapacity,dimension];\r
  output Real occupied[mapCapacity];\r
  output Real confidence[mapCapacity];\r
  output Real lastSeen[mapCapacity];\r
  output Real lastFrame[mapCapacity];\r
  output Real confirmed[mapCapacity];\r
  output Real accepted; output Real rejectionReason;\r
  output Real nextTime; output Real nextFrame; output Real nextWorldFrame;\r
  output Real occupiedCount; output Real confirmedCount; output Real tentativeCount;\r
  output Real insertedCount; output Real mergedCount; output Real prunedCount;\r
  output Real droppedCount; output Real invalidCandidateCount;\r
equation\r
  (point,occupied,confidence,lastSeen,lastFrame,confirmed,accepted,rejectionReason,nextTime,nextFrame,nextWorldFrame,\r
    occupiedCount,confirmedCount,tentativeCount,insertedCount,mergedCount,prunedCount,droppedCount,invalidCandidateCount) =\r
    UpdateLandmarkMap(previousPoint,previousOccupied,previousConfidence,previousLastSeen,previousLastFrame,candidatePoint,candidateEnabled,\r
      candidateCount,bodyPosition,poseAccepted,previousTime,timeNow,previousFrame,frameNow,previousWorldFrame,worldFrame,resetRequested,\r
      coordinateLimit,voxelWidth,mergeRadius,maximumDistance,tentativeLifetime,confirmedLifetime,confirmationObservations,maximumConfidence,maximumTentative);\r
end RGBDLandmarkMap;\r
`;export{e as default};
