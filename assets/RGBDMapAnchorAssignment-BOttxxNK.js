const n=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Consume private map insertion receipts. Anchor outputs are a proposal until\r
// the surrounding owner commits map geometry, metadata and anchors together.\r
function AssignLandmarkAnchors\r
\r
  input Real previousPoint[:,3];\r
  input Real previousOccupied[size(previousPoint,1)];\r
  input Real previousLocalPoint[size(previousPoint,1),3];\r
  input Integer previousAnchorId[size(previousPoint,1)];\r
  input Integer previousAnchorSlot[size(previousPoint,1)];\r
  input Integer previousGeneration;\r
  input Real nextPoint[size(previousPoint,1),3];\r
  input Real nextOccupied[size(previousPoint,1)];\r
  input Integer insertedFeature[size(previousPoint,1)];\r
  input Real candidatePoint[:,3];\r
  input Real candidateEnabled[size(candidatePoint,1)]; input Real candidateCount;\r
  input Boolean nodeEnabled[:]; input Integer nodeId[size(nodeEnabled,1)];\r
  input Real nodePosition[size(nodeEnabled,1),3]; input Real nodeRotation[size(nodeEnabled,1),3,3];\r
  input Integer catalogGeneration; input Integer generation;\r
  input Integer selectedAnchorId; input Integer selectedAnchorSlot;\r
  input Boolean mapAccepted; input Boolean requested; input Boolean reset;\r
  input Real coordinateLimit; input Real consistencyTolerance;\r
  output Real localPoint[size(previousPoint,1),3];\r
  output Integer anchorId[size(previousPoint,1)]; output Integer anchorSlot[size(previousPoint,1)];\r
  output Integer nextGeneration; output Boolean accepted; output Integer rejectionReason;\r
  output Integer assignedCount; output Integer retainedCount; output Integer clearedCount;\r
protected\r
  constant Integer featureCapacity = 350;\r
  Boolean configuration; Boolean valid; Boolean slotValid; Boolean selectedValid;\r
  Boolean seen[size(candidatePoint,1)];\r
  Integer feature; Integer owner; Real local[3]; Real reconstructed[3];\r
algorithm\r
  localPoint := previousLocalPoint; anchorId := previousAnchorId; anchorSlot := previousAnchorSlot;\r
  nextGeneration := previousGeneration; accepted := false; rejectionReason := 1;\r
  assignedCount := 0; retainedCount := 0; clearedCount := 0;\r
  if requested then\r
    configuration := size(previousPoint,1) >= 1 and size(previousPoint,1) <= RGBDMapAnchors.mapCapacity\r
      and size(candidatePoint,1) >= 1 and size(candidatePoint,1) <= featureCapacity\r
      and size(nodeEnabled,1) >= 1 and size(nodeEnabled,1) <= RGBDMapAnchors.keyframeCapacity\r
      and candidateCount >= 0.0 and candidateCount <= size(candidatePoint,1) and floor(candidateCount) == candidateCount\r
      and generation >= 1 and generation <= RGBDMapAnchors.identifierLimit and catalogGeneration == generation\r
      and ((reset and previousGeneration >= 0 and previousGeneration < RGBDMapAnchors.identifierLimit\r
        and generation == previousGeneration+1) or (not reset and previousGeneration == generation))\r
      and selectedAnchorSlot >= 0 and selectedAnchorSlot <= size(nodeEnabled,1)\r
      and selectedAnchorId >= 0 and selectedAnchorId <= RGBDMapAnchors.identifierLimit\r
      and coordinateLimit > 0.0 and coordinateLimit <= 1e6\r
      and consistencyTolerance > 0.0 and consistencyTolerance <= 0.01;\r
    rejectionReason := 2;\r
    if configuration then\r
      rejectionReason := 3;\r
      if mapAccepted then\r
        rejectionReason := 4;\r
        if RGBDMapAnchors.ValidNodes(nodeEnabled,nodeId,nodePosition,nodeRotation,coordinateLimit) then\r
          selectedValid := false;\r
          if selectedAnchorSlot >= 1 and selectedAnchorId >= 1 then\r
            selectedValid := nodeEnabled[selectedAnchorSlot] and nodeId[selectedAnchorSlot] == selectedAnchorId;\r
          end if;\r
          valid := true; seen := fill(false,size(candidatePoint,1));\r
          for slot in 1:size(previousPoint,1) loop\r
            feature := insertedFeature[slot];\r
            slotValid := feature >= 0 and feature <= size(candidatePoint,1)\r
              and (nextOccupied[slot] == 0.0 or nextOccupied[slot] == 1.0);\r
            if slotValid then\r
              if nextOccupied[slot] == 0.0 then\r
                slotValid := feature == 0;\r
                localPoint[slot,:] := zeros(3); anchorId[slot] := 0; anchorSlot[slot] := 0;\r
                clearedCount := clearedCount+1;\r
              elseif feature > 0 then\r
                slotValid := selectedValid and feature <= candidateCount and candidateEnabled[feature] == 1.0\r
                  and not seen[feature];\r
                seen[feature] := true;\r
                for axis in 1:3 loop\r
                  slotValid := slotValid and abs(nextPoint[slot,axis]) <= coordinateLimit\r
                    and nextPoint[slot,axis] == candidatePoint[feature,axis];\r
                end for;\r
                if slotValid then\r
                  local := transpose(nodeRotation[selectedAnchorSlot,:,:])*(nextPoint[slot,:]-nodePosition[selectedAnchorSlot,:]);\r
                  reconstructed := nodeRotation[selectedAnchorSlot,:,:]*local+nodePosition[selectedAnchorSlot,:];\r
                  for axis in 1:3 loop\r
                    slotValid := slotValid and abs(local[axis]) <= coordinateLimit\r
                      and abs(reconstructed[axis]-nextPoint[slot,axis]) <= consistencyTolerance;\r
                  end for;\r
                  localPoint[slot,:] := local;\r
                  anchorId[slot] := selectedAnchorId; anchorSlot[slot] := selectedAnchorSlot;\r
                  assignedCount := assignedCount+1;\r
                end if;\r
              else\r
                owner := previousAnchorSlot[slot];\r
                slotValid := not reset and previousOccupied[slot] == 1.0\r
                  and previousAnchorId[slot] >= 1 and previousAnchorId[slot] <= RGBDMapAnchors.identifierLimit\r
                  and owner >= 1 and owner <= size(nodeEnabled,1);\r
                for axis in 1:3 loop\r
                  slotValid := slotValid and abs(previousLocalPoint[slot,axis]) <= coordinateLimit\r
                    and abs(previousPoint[slot,axis]) <= coordinateLimit\r
                    and nextPoint[slot,axis] == previousPoint[slot,axis];\r
                end for;\r
                if slotValid then\r
                  slotValid := nodeEnabled[owner] and nodeId[owner] == previousAnchorId[slot];\r
                  if slotValid then\r
                    reconstructed := nodeRotation[owner,:,:]*previousLocalPoint[slot,:]+nodePosition[owner,:];\r
                    for axis in 1:3 loop\r
                      slotValid := slotValid and abs(reconstructed[axis]-previousPoint[slot,axis]) <= consistencyTolerance;\r
                    end for;\r
                    retainedCount := retainedCount+1;\r
                  end if;\r
                end if;\r
              end if;\r
            end if;\r
            valid := valid and slotValid;\r
          end for;\r
          accepted := valid; rejectionReason := if valid then 0 else 5;\r
          if accepted then nextGeneration := generation; end if;\r
        end if;\r
      end if;\r
    end if;\r
  end if;\r
  if not accepted then\r
    localPoint := previousLocalPoint; anchorId := previousAnchorId; anchorSlot := previousAnchorSlot;\r
    nextGeneration := previousGeneration; assignedCount := 0; retainedCount := 0; clearedCount := 0;\r
  end if;\r
end AssignLandmarkAnchors;\r
`;export{n as default};
