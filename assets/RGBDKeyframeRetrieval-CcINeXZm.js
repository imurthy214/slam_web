const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Appearance queries share the retained geometry catalog. Only its capture\r
// owner publishes history; retrieval never advances a second FIFO or clock.\r
package RGBDKeyframeRetrieval\r
\r
  constant Integer proposalCapacity = 4;\r
\r
  function PrepareCapture\r
    input RGBDKeyframes.Catalog catalog;\r
    input RGBDKeyframes.Frame measurement;\r
    input Real vocabulary[RGBDKeyframes.wordCapacity,RGBDKeyframes.descriptorSize];\r
    input Real vocabularyEnabled[RGBDKeyframes.wordCapacity];\r
    input Boolean requested;\r
    input Real maximumWordDistanceSquared = 0.8;\r
    input Integer minimumAssignments = 8;\r
    input Real minimumSimilarity = 0.35;\r
    input Real minimumAge = 5.0;\r
    output RGBDKeyframes.Frame prepared;\r
    output Boolean accepted;\r
    output Integer rejectionReason "0 accepted; 1 not requested; 2 metadata; 3 retrieval/history; 4 frame; 5 candidate binding";\r
    output Real wordIndex[RGBDKeyframes.featureCapacity];\r
    output Integer candidateId[proposalCapacity];\r
    output Integer candidateSlot[proposalCapacity];\r
    output Real candidateScore[proposalCapacity];\r
    output Integer candidateCount;\r
    output Real assignmentCount;\r
  protected\r
    Real featureMask[RGBDKeyframes.featureCapacity];\r
    Real historyMask[RGBDKeyframes.keyframeCapacity];\r
    Real histogram[RGBDKeyframes.wordCapacity];\r
    Real ids[proposalCapacity]; Real slots[proposalCapacity]; Real scores[proposalCapacity];\r
    Real unusedHistogram[RGBDKeyframes.keyframeCapacity,RGBDKeyframes.wordCapacity];\r
    Real unusedEnabled[RGBDKeyframes.keyframeCapacity];\r
    Real unusedIds[RGBDKeyframes.keyframeCapacity]; Real unusedTimes[RGBDKeyframes.keyframeCapacity];\r
    Real unusedVersion; Real unusedSlot; Real unusedTime; Real unusedStored;\r
    Real configurationValid; Real vocabularyCount; Real retrievalValid; Real count; Real invalidHistoryCount;\r
    Boolean valid; Integer slot;\r
  algorithm\r
    prepared := measurement; accepted := false; rejectionReason := 1;\r
    wordIndex := zeros(RGBDKeyframes.featureCapacity);\r
    candidateId := fill(0,proposalCapacity); candidateSlot := fill(0,proposalCapacity);\r
    candidateScore := zeros(proposalCapacity); candidateCount := 0; assignmentCount := 0;\r
    if requested then\r
      rejectionReason := 2;\r
      valid := RGBDKeyframes.ValidHeader(catalog)\r
        and catalog.nextId < RGBDKeyframes.identifierLimit\r
        and measurement.generation == catalog.generation\r
        and measurement.vocabularyVersion == catalog.vocabularyVersion\r
        and measurement.id == catalog.nextId and measurement.epoch > catalog.lastEpoch\r
        and (catalog.nextId == 1 or measurement.imageTime > catalog.lastTime);\r
      if valid then\r
        for feature in 1:RGBDKeyframes.featureCapacity loop\r
          featureMask[feature] := if measurement.enabled[feature] then 1.0 else 0.0;\r
        end for;\r
        for node in 1:RGBDKeyframes.keyframeCapacity loop\r
          // The capture will evict nextSlot. It cannot be a retained loop node\r
          // in the resulting transaction, so exclude it before query scoring.\r
          historyMask[node] := if catalog.occupied[node] and node <> catalog.nextSlot then 1.0 else 0.0;\r
        end for;\r
        (wordIndex,histogram,ids,slots,scores,unusedHistogram,unusedEnabled,unusedIds,unusedTimes,\r
          unusedVersion,unusedSlot,unusedTime,configurationValid,vocabularyCount,assignmentCount,\r
          retrievalValid,count,unusedStored,invalidHistoryCount) := RetrieveVisualWords(\r
            measurement.descriptor,featureMask,measurement.count,vocabulary,vocabularyEnabled,catalog.vocabularyVersion,\r
            catalog.histograms,historyMask,catalog.ids,catalog.imageTimes,catalog.vocabularyVersion,\r
            catalog.nextSlot,catalog.lastTime,measurement.id,measurement.imageTime,0.0,0.0,\r
            maximumWordDistanceSquared,minimumAssignments,minimumSimilarity,minimumAge);\r
        rejectionReason := 3;\r
        valid := configurationValid == 1.0 and retrievalValid == 1.0 and invalidHistoryCount == 0.0\r
          and count >= 0 and count <= proposalCapacity and floor(count) == count;\r
        if valid then\r
          prepared.histogram := histogram;\r
          rejectionReason := 4;\r
          valid := RGBDKeyframes.ValidFrame(prepared);\r
          if valid then\r
            rejectionReason := 5;\r
            for rank in 1:proposalCapacity loop\r
              if rank <= count then\r
                // Certify Real output domains before Integer conversion or indexing.\r
                valid := valid and slots[rank] >= 1 and slots[rank] <= RGBDKeyframes.keyframeCapacity\r
                  and floor(slots[rank]) == slots[rank] and ids[rank] >= 1\r
                  and ids[rank] < catalog.nextId and floor(ids[rank]) == ids[rank]\r
                  and scores[rank] >= minimumSimilarity and scores[rank] <= 1.0;\r
                if valid then\r
                  slot := integer(slots[rank]);\r
                  valid := catalog.occupied[slot] and slot <> catalog.nextSlot\r
                    and catalog.ids[slot] == ids[rank]\r
                    and catalog.generations[slot] == measurement.generation\r
                    and catalog.vocabularyVersions[slot] == measurement.vocabularyVersion\r
                    and measurement.imageTime-catalog.imageTimes[slot] >= minimumAge;\r
                  if valid then\r
                    candidateId[rank] := integer(ids[rank]); candidateSlot[rank] := slot;\r
                    candidateScore[rank] := scores[rank];\r
                  end if;\r
                end if;\r
              end if;\r
            end for;\r
            if valid then\r
              candidateCount := integer(count); accepted := true; rejectionReason := 0;\r
            end if;\r
          end if;\r
        end if;\r
      end if;\r
    end if;\r
    if not accepted then\r
      prepared := measurement; wordIndex := zeros(RGBDKeyframes.featureCapacity);\r
      candidateId := fill(0,proposalCapacity); candidateSlot := fill(0,proposalCapacity);\r
      candidateScore := zeros(proposalCapacity); candidateCount := 0; assignmentCount := 0;\r
    end if;\r
  end PrepareCapture;\r
end RGBDKeyframeRetrieval;\r
`;export{e as default};
