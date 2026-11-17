const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Durable capture birth identities. Catalog ID, camera epoch and accepted\r
// processing-step sequence are separate clocks; none is inferred from another.\r
package RGBDGraphCaptureLedger\r
\r
  constant Integer capacity = RGBDKeyframes.keyframeCapacity;\r
  constant Integer identifierLimit = RGBDKeyframes.identifierLimit;\r
\r
  record State\r
    Integer generation; Integer sourceRevision; Integer catalogNextId; Integer lastStep;\r
    Integer ids[capacity]; Integer epochs[capacity]; Integer sequences[capacity];\r
    Real times[capacity];\r
  end State;\r
\r
  function Empty\r
    input Integer generation; input Integer sourceRevision;\r
    output State result;\r
  algorithm\r
    result.generation := generation; result.sourceRevision := sourceRevision;\r
    result.catalogNextId := 1; result.lastStep := 0;\r
    result.ids := fill(0,capacity); result.epochs := fill(-1,capacity);\r
    result.sequences := fill(0,capacity); result.times := zeros(capacity);\r
  end Empty;\r
\r
  function Valid\r
    input State ledger; input RGBDKeyframes.Catalog catalog;\r
    input Integer sourceRevision; input Integer step;\r
    output Boolean valid;\r
  protected Integer slot; Integer previousSequence; Integer order[capacity]; Integer count;\r
  algorithm\r
    valid := RGBDKeyframes.ValidHeader(catalog)\r
      and ledger.generation == catalog.generation\r
      and sourceRevision >= 1 and sourceRevision <= identifierLimit\r
      and ledger.sourceRevision == sourceRevision\r
      and step >= 0 and step < identifierLimit and ledger.lastStep == step\r
      and ledger.catalogNextId == catalog.nextId;\r
    slot := 1; previousSequence := 0; order := fill(0,capacity); count := 0;\r
    if valid then\r
      // Retained ids need not be contiguous; walk them in ascending id order.\r
      (order,count) := RGBDKeyframes.IdOrder(catalog);\r
      for node in 1:capacity loop\r
        if node <= count then\r
          slot := order[node];\r
          valid := valid and ledger.ids[slot] == catalog.ids[slot]\r
            and ledger.epochs[slot] == catalog.epochs[slot]\r
            and ledger.times[slot] == catalog.imageTimes[slot]\r
            and ledger.sequences[slot] > previousSequence\r
            and ledger.sequences[slot] <= step;\r
          previousSequence := ledger.sequences[slot];\r
        end if;\r
      end for;\r
    end if;\r
  end Valid;\r
\r
  function Advance\r
    input State previous;\r
    input RGBDKeyframes.Catalog previousCatalog;\r
    input RGBDKeyframes.Catalog nextCatalog;\r
    input Integer sourceRevision;\r
    input Integer nextStep "Accepted localization publication's actual next.steps";\r
    input Boolean publicationAccepted;\r
    input Boolean requested;\r
    output State result; output Boolean accepted; output Integer reason;\r
  protected\r
    State candidate; Boolean valid; Boolean captured; Integer storedSlot;\r
  algorithm\r
    result := previous; accepted := false; reason := 1;\r
    if requested then\r
      reason := 2;\r
      valid := publicationAccepted and Valid(previous,previousCatalog,sourceRevision,previous.lastStep)\r
        and previous.lastStep < identifierLimit-1 and nextStep == previous.lastStep+1\r
        and RGBDKeyframes.ValidHeader(nextCatalog)\r
        and nextCatalog.generation == previousCatalog.generation\r
        and nextCatalog.vocabularyVersion == previousCatalog.vocabularyVersion;\r
      captured := false; storedSlot := 1;\r
      if valid then\r
        reason := 3;\r
        valid := nextCatalog.nextId == previousCatalog.nextId\r
          or (previousCatalog.nextId < identifierLimit and nextCatalog.nextId == previousCatalog.nextId+1);\r
        captured := nextCatalog.nextId == previousCatalog.nextId+1;\r
        // The committed new identity owns its slot; a capacity plan may\r
        // select another slot after retrieval. Never infer it from a counter.\r
        storedSlot := if captured then max(1,RGBDKeyframes.SlotOf(nextCatalog,previousCatalog.nextId)) else previousCatalog.nextSlot;\r
        if not captured then\r
          valid := valid and nextCatalog.lastEpoch == previousCatalog.lastEpoch\r
            and nextCatalog.lastTime == previousCatalog.lastTime;\r
        else\r
          valid := valid and RGBDKeyframes.SlotOf(nextCatalog,previousCatalog.nextId) >= 1\r
            and nextCatalog.ids[storedSlot] == previousCatalog.nextId\r
            and nextCatalog.epochs[storedSlot] > previousCatalog.lastEpoch\r
            and (previousCatalog.nextId == 1 or nextCatalog.imageTimes[storedSlot] > previousCatalog.lastTime);\r
        end if;\r
        for slot in 1:capacity loop\r
          if not captured or slot <> storedSlot then\r
            valid := valid and nextCatalog.occupied[slot] == previousCatalog.occupied[slot];\r
            if previousCatalog.occupied[slot] then\r
              valid := valid and nextCatalog.ids[slot] == previousCatalog.ids[slot]\r
                and nextCatalog.epochs[slot] == previousCatalog.epochs[slot]\r
                and nextCatalog.imageTimes[slot] == previousCatalog.imageTimes[slot];\r
            end if;\r
          end if;\r
        end for;\r
      end if;\r
      if valid then\r
        candidate := previous; candidate.lastStep := nextStep;\r
        candidate.catalogNextId := nextCatalog.nextId;\r
        if captured then\r
          candidate.ids[storedSlot] := nextCatalog.ids[storedSlot];\r
          candidate.epochs[storedSlot] := nextCatalog.epochs[storedSlot];\r
          candidate.times[storedSlot] := nextCatalog.imageTimes[storedSlot];\r
          candidate.sequences[storedSlot] := nextStep;\r
        end if;\r
        reason := 4; valid := Valid(candidate,nextCatalog,sourceRevision,nextStep);\r
        if valid then result := candidate; accepted := true; reason := 0; end if;\r
      end if;\r
    end if;\r
  end Advance;\r
end RGBDGraphCaptureLedger;\r
`;export{e as default};
