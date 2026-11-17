const n=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Landmark coordinates stay local to stable keyframe identities. A graph\r
// correction is a proposal until every persistent owner commits it together.\r
package RGBDMapAnchors\r
  constant Integer imageHeight = 90;\r
  constant Integer imageWidth = 160;\r
  constant Integer mapCapacity = imageHeight*imageWidth;\r
  constant Integer keyframeCapacity = 64;\r
  constant Integer dimension = 3;\r
  constant Integer identifierLimit = 1000000000;\r
\r
  function ProperRotation\r
    input Real rotation[dimension,dimension];\r
    output Boolean valid;\r
  protected\r
    Real gram[dimension,dimension]; Real determinant;\r
  algorithm\r
    valid := true;\r
    for row in 1:dimension loop\r
      for column in 1:dimension loop\r
        valid := valid and abs(rotation[row,column]) <= 1.000001;\r
      end for;\r
    end for;\r
    if valid then\r
      gram := transpose(rotation)*rotation;\r
      for row in 1:dimension loop\r
        for column in 1:dimension loop\r
          valid := valid and abs(gram[row,column]-(if row == column then 1.0 else 0.0)) <= 1e-6;\r
        end for;\r
      end for;\r
      determinant := rotation[1,1]*(rotation[2,2]*rotation[3,3]-rotation[2,3]*rotation[3,2])\r
        -rotation[1,2]*(rotation[2,1]*rotation[3,3]-rotation[2,3]*rotation[3,1])\r
        +rotation[1,3]*(rotation[2,1]*rotation[3,2]-rotation[2,2]*rotation[3,1]);\r
      valid := valid and abs(determinant-1.0) <= 1e-6;\r
    end if;\r
  end ProperRotation;\r
\r
  // Catalog/graph slots never relocate within a generation. Reuse changes\r
  // the monotone identity; a cached slot alone cannot keep an anchor alive.\r
  function ValidNodes\r
    input Boolean enabled[:];\r
    input Integer ids[size(enabled,1)];\r
    input Real position[size(enabled,1),dimension];\r
    input Real rotation[size(enabled,1),dimension,dimension];\r
    input Real coordinateLimit;\r
    output Boolean valid;\r
  algorithm\r
    valid := true;\r
    for node in 1:size(enabled,1) loop\r
      if enabled[node] then\r
        valid := valid and ids[node] >= 1 and ids[node] <= identifierLimit\r
          and ProperRotation(rotation[node,:,:]);\r
        for axis in 1:dimension loop\r
          valid := valid and abs(position[node,axis]) <= coordinateLimit;\r
        end for;\r
        for other in 1:node-1 loop\r
          if enabled[other] then valid := valid and ids[node] <> ids[other]; end if;\r
        end for;\r
      end if;\r
    end for;\r
  end ValidNodes;\r
\r
  function Reproject\r
    input Real previousPoint[:,dimension];\r
    input Real previousLocalPoint[size(previousPoint,1),dimension];\r
    input Real previousOccupied[size(previousPoint,1)];\r
    input Integer previousAnchorId[size(previousPoint,1)];\r
    input Integer previousAnchorSlot[size(previousPoint,1)];\r
    input Integer mapGeneration; input Integer previousRevision;\r
    input Boolean nodeEnabled[:];\r
    input Integer nodeId[size(nodeEnabled,1)];\r
    input Real nodePosition[size(nodeEnabled,1),dimension];\r
    input Real nodeRotation[size(nodeEnabled,1),dimension,dimension];\r
    input Integer graphGeneration; input Integer graphRevision;\r
    input Boolean graphAccepted; input Boolean requested;\r
    input Real coordinateLimit;\r
    output Real point[size(previousPoint,1),dimension];\r
    output Real localPoint[size(previousPoint,1),dimension];\r
    output Real occupied[size(previousPoint,1)];\r
    output Integer anchorId[size(previousPoint,1)];\r
    output Integer anchorSlot[size(previousPoint,1)];\r
    output Integer nextRevision;\r
    output Boolean accepted;\r
    output Integer rejectionReason;\r
    output Integer projectedCount; output Integer prunedCount;\r
  protected\r
    Boolean configuration; Boolean stateValid; Boolean slotValid;\r
    Boolean coordinatesValid; Boolean retained;\r
    Integer owner; Real candidate[dimension];\r
  algorithm\r
    point := previousPoint; localPoint := previousLocalPoint;\r
    occupied := previousOccupied; anchorId := previousAnchorId; anchorSlot := previousAnchorSlot;\r
    nextRevision := previousRevision; accepted := false; rejectionReason := 1;\r
    projectedCount := 0; prunedCount := 0;\r
    if requested then\r
      configuration := size(previousPoint,1) >= 1 and size(previousPoint,1) <= mapCapacity\r
        and size(nodeEnabled,1) >= 1 and size(nodeEnabled,1) <= keyframeCapacity\r
        and coordinateLimit > 0.0 and coordinateLimit <= 1e6\r
        and mapGeneration >= 1 and mapGeneration <= identifierLimit and graphGeneration == mapGeneration\r
        and previousRevision >= 0 and previousRevision < identifierLimit and graphRevision == previousRevision+1;\r
      rejectionReason := 2;\r
      if configuration then\r
        rejectionReason := 3;\r
        if graphAccepted then\r
          rejectionReason := 4;\r
          if ValidNodes(nodeEnabled,nodeId,nodePosition,nodeRotation,coordinateLimit) then\r
            stateValid := true; coordinatesValid := true;\r
            for slot in 1:size(previousPoint,1) loop\r
              if previousOccupied[slot] == 0.0 then\r
                point[slot,:] := zeros(dimension); localPoint[slot,:] := zeros(dimension);\r
                occupied[slot] := 0.0; anchorId[slot] := 0; anchorSlot[slot] := 0;\r
              elseif previousOccupied[slot] == 1.0 then\r
                owner := previousAnchorSlot[slot];\r
                slotValid := previousAnchorId[slot] >= 1 and previousAnchorId[slot] <= identifierLimit\r
                  and owner >= 1 and owner <= size(nodeEnabled,1);\r
                for axis in 1:dimension loop\r
                  slotValid := slotValid and abs(previousPoint[slot,axis]) <= coordinateLimit\r
                    and abs(previousLocalPoint[slot,axis]) <= coordinateLimit;\r
                end for;\r
                stateValid := stateValid and slotValid;\r
                if slotValid then\r
                  retained := nodeEnabled[owner] and nodeId[owner] == previousAnchorId[slot];\r
                  if retained then\r
                    candidate := nodeRotation[owner,:,:]*previousLocalPoint[slot,:]+nodePosition[owner,:];\r
                    for axis in 1:dimension loop\r
                      coordinatesValid := coordinatesValid and abs(candidate[axis]) <= coordinateLimit;\r
                    end for;\r
                    point[slot,:] := candidate; projectedCount := projectedCount+1;\r
                  else\r
                    // Eviction or slot reuse cannot transfer a landmark to a\r
                    // new keyframe that happens to occupy the same array slot.\r
                    point[slot,:] := zeros(dimension); localPoint[slot,:] := zeros(dimension);\r
                    occupied[slot] := 0.0; anchorId[slot] := 0; anchorSlot[slot] := 0;\r
                    prunedCount := prunedCount+1;\r
                  end if;\r
                end if;\r
              else\r
                stateValid := false;\r
              end if;\r
            end for;\r
            accepted := stateValid and coordinatesValid;\r
            rejectionReason := if not stateValid then 5 else if not coordinatesValid then 6 else 0;\r
            if accepted then nextRevision := graphRevision; end if;\r
          end if;\r
        end if;\r
      end if;\r
    end if;\r
    // Late failures preserve all previous fields, including poisoned disabled\r
    // payload. Canonicalization, pruning and version advancement commit together.\r
    if not accepted then\r
      point := previousPoint; localPoint := previousLocalPoint; occupied := previousOccupied;\r
      anchorId := previousAnchorId; anchorSlot := previousAnchorSlot;\r
      nextRevision := previousRevision; projectedCount := 0; prunedCount := 0;\r
    end if;\r
  end Reproject;\r
end RGBDMapAnchors;\r
\r
model RGBDAnchoredMapCorrection\r
\r
  constant Integer mapCapacity = RGBDMapAnchors.mapCapacity;\r
  constant Integer keyframeCapacity = RGBDMapAnchors.keyframeCapacity;\r
  constant Integer dimension = RGBDMapAnchors.dimension;\r
  parameter Real coordinateLimit = 1e6;\r
  input Real previousPoint[mapCapacity,dimension] = zeros(mapCapacity,dimension);\r
  input Real previousLocalPoint[mapCapacity,dimension] = zeros(mapCapacity,dimension);\r
  input Real previousOccupied[mapCapacity] = zeros(mapCapacity);\r
  input Integer previousAnchorId[mapCapacity] = fill(0,mapCapacity);\r
  input Integer previousAnchorSlot[mapCapacity] = fill(0,mapCapacity);\r
  input Integer mapGeneration = 1; input Integer previousRevision = 0;\r
  input Boolean nodeEnabled[keyframeCapacity] = fill(false,keyframeCapacity);\r
  input Integer nodeId[keyframeCapacity] = fill(0,keyframeCapacity);\r
  input Real nodePosition[keyframeCapacity,dimension] = zeros(keyframeCapacity,dimension);\r
  input Real nodeRotation[keyframeCapacity,dimension,dimension] = zeros(keyframeCapacity,dimension,dimension);\r
  input Integer graphGeneration = 1; input Integer graphRevision = 1;\r
  input Boolean graphAccepted = false; input Boolean requested = false;\r
  output Real point[mapCapacity,dimension]; output Real localPoint[mapCapacity,dimension];\r
  output Real occupied[mapCapacity];\r
  output Integer anchorId[mapCapacity]; output Integer anchorSlot[mapCapacity];\r
  output Integer nextRevision; output Boolean accepted;\r
  output Integer rejectionReason; output Integer projectedCount; output Integer prunedCount;\r
equation\r
  (point,localPoint,occupied,anchorId,anchorSlot,nextRevision,accepted,rejectionReason,projectedCount,prunedCount) =\r
    RGBDMapAnchors.Reproject(previousPoint,previousLocalPoint,previousOccupied,previousAnchorId,previousAnchorSlot,\r
      mapGeneration,previousRevision,nodeEnabled,nodeId,nodePosition,nodeRotation,graphGeneration,graphRevision,\r
      graphAccepted,requested,coordinateLimit);\r
end RGBDAnchoredMapCorrection;\r
`;export{n as default};
