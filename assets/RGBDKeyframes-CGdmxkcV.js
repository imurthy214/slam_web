const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Persistent keyframe ownership, independent of the current single-reference\r
// filter. A saved histogram and its calibrated geometry share one record/slot.\r
// These functions are not yet connected to the browser SLAM estimator.\r
package RGBDKeyframes\r
\r
  constant Integer imageHeight = 90;\r
  constant Integer imageWidth = 160;\r
  constant Integer featureCapacity = 350;\r
  constant Integer descriptorSize = 49;\r
  constant Integer wordCapacity = 256;\r
  constant Integer keyframeCapacity = 64;\r
  constant Integer dimension = 3;\r
  constant Integer poseDimension = 6;\r
  constant Integer identifierLimit = 1000000000;\r
  // Place-keeping retention. Slots are assigned by Store, never derived from\r
  // ids; every reader resolves an id through ids[slot] == id.\r
  constant Integer retainedNewest = 16 "Newest ids never chosen for eviction (local tracking window)";\r
  constant Integer retentionHeld = 0 "Retention tier: the graph needs this keyframe";\r
  constant Integer retentionFirst = 1 "Retention tier: evictable without changing any kept edge";\r
  constant Integer retentionBridged = 2 "Retention tier: evictable after its consecutive edges are composed";\r
  constant Integer storeRetentionRefused = 3 "Store reason: retention holds the slot due for eviction";\r
\r
  record Frame\r
    Integer generation "Reset/source/world ownership generation";\r
    Integer id "Monotone identity; never a reusable array slot";\r
    Integer epoch "Measured image identity, independent of wall time";\r
    Real imageTime "Simulation time of image acquisition";\r
    Integer count "Full feature domain, including disabled sparse slots";\r
    Boolean enabled[featureCapacity];\r
    Real descriptor[featureCapacity,descriptorSize];\r
    Real opticalPoint[featureCapacity,dimension];\r
    Integer pixels[featureCapacity,2] "Zero-based RGB pixels";\r
    Integer rgbSize[2] "Height, width";\r
    Integer depthSize[2];\r
    Real rgbCalibration[4] "fx, fy, cx, cy";\r
    Real depthCalibration[4];\r
    Real opticalToBody[dimension,dimension];\r
    Real cameraOriginBody[dimension];\r
    Real disparityNoise;\r
    Real noiseReferenceFx;\r
    Real baseline;\r
    Real bodyRotation[dimension,dimension];\r
    Real bodyPosition[dimension];\r
    Real poseCovariance[poseDimension,poseDimension];\r
    // Filter epoch of bodyPosition/bodyRotation: two captures share one\r
    // uncorrected filter frame only when both counters match (odometry bridge).\r
    Integer filterSourceRevision "Estimator source revision at capture";\r
    Integer filterCorrectionRevision "Accepted graph-to-filter commits before capture";\r
    Integer vocabularyVersion;\r
    Real histogram[wordCapacity];\r
  end Frame;\r
\r
  function EmptyFrame\r
    output Frame frame;\r
  algorithm\r
    frame.generation := 1;\r
    frame.id := 0;\r
    frame.epoch := -1;\r
    frame.imageTime := 0.0;\r
    frame.count := 0;\r
    frame.enabled := fill(false,featureCapacity);\r
    frame.descriptor := zeros(featureCapacity,descriptorSize);\r
    frame.opticalPoint := zeros(featureCapacity,dimension);\r
    frame.pixels := fill(0,featureCapacity,2);\r
    frame.rgbSize := {imageHeight,imageWidth};\r
    frame.depthSize := {imageHeight,imageWidth};\r
    frame.rgbCalibration := {116.4,116.4,79.5,44.5};\r
    frame.depthCalibration := {84.3,84.3,79.5,44.5};\r
    frame.opticalToBody := [0,0,1;-1,0,0;0,-1,0];\r
    frame.cameraOriginBody := {0.18,0,-0.04};\r
    frame.disparityNoise := 0.08;\r
    frame.noiseReferenceFx := 84.3;\r
    frame.baseline := 0.05;\r
    frame.bodyRotation := identity(dimension);\r
    frame.bodyPosition := zeros(dimension);\r
    frame.poseCovariance := identity(poseDimension);\r
    frame.filterSourceRevision := 0; frame.filterCorrectionRevision := 0;\r
    frame.vocabularyVersion := 1;\r
    frame.histogram := zeros(wordCapacity);\r
  end EmptyFrame;\r
\r
  record Catalog\r
    // Declaration bindings here would add equations to a whole-record model\r
    // output. Empty owns initialization of every field, including these.\r
    Integer generation;\r
    Integer vocabularyVersion "All retained histograms share one vocabulary";\r
    Integer nextId;\r
    Integer nextSlot;\r
    Integer lastEpoch;\r
    Real lastTime;\r
    Boolean occupied[keyframeCapacity];\r
    // Structure-of-arrays storage; Frame remains the public measurement API.\r
    Integer generations[keyframeCapacity];\r
    Integer ids[keyframeCapacity];\r
    Integer epochs[keyframeCapacity];\r
    Real imageTimes[keyframeCapacity];\r
    Integer counts[keyframeCapacity];\r
    Boolean featureEnabled[keyframeCapacity,featureCapacity];\r
    Real descriptors[keyframeCapacity,featureCapacity,descriptorSize];\r
    Real opticalPoints[keyframeCapacity,featureCapacity,dimension];\r
    Integer pixelCoordinates[keyframeCapacity,featureCapacity,2];\r
    Integer rgbSizes[keyframeCapacity,2];\r
    Integer depthSizes[keyframeCapacity,2];\r
    Real rgbCalibrations[keyframeCapacity,4];\r
    Real depthCalibrations[keyframeCapacity,4];\r
    Real opticalToBodyRotations[keyframeCapacity,dimension,dimension];\r
    Real cameraOriginsBody[keyframeCapacity,dimension];\r
    Real disparityNoises[keyframeCapacity];\r
    Real noiseReferenceFocals[keyframeCapacity];\r
    Real baselines[keyframeCapacity];\r
    Real bodyRotations[keyframeCapacity,dimension,dimension];\r
    Real bodyPositions[keyframeCapacity,dimension];\r
    Real poseCovariances[keyframeCapacity,poseDimension,poseDimension];\r
    Integer filterSourceRevisions[keyframeCapacity];\r
    Integer filterCorrectionRevisions[keyframeCapacity];\r
    Integer vocabularyVersions[keyframeCapacity];\r
    Real histograms[keyframeCapacity,wordCapacity];\r
  end Catalog;\r
\r
  function Empty\r
    input Integer generation = 1;\r
    input Integer vocabularyVersion = 1;\r
    output Catalog state;\r
  protected\r
    Frame emptyFrame;\r
  algorithm\r
    state.generation := generation;\r
    state.vocabularyVersion := vocabularyVersion;\r
    state.nextId := 1;\r
    state.nextSlot := 1;\r
    state.lastEpoch := -1;\r
    state.lastTime := 0.0;\r
    // Copy one canonical frame into each array slice. This initializes every\r
    // field once, including inactive payload, without a separate catalog-sized\r
    // zero initializer followed by overwriting each frame's metadata.\r
    emptyFrame := EmptyFrame();\r
    for slot in 1:keyframeCapacity loop\r
      state.occupied[slot] := false;\r
      state.generations[slot] := emptyFrame.generation;\r
      state.ids[slot] := emptyFrame.id;\r
      state.epochs[slot] := emptyFrame.epoch;\r
      state.imageTimes[slot] := emptyFrame.imageTime;\r
      state.counts[slot] := emptyFrame.count;\r
      state.featureEnabled[slot,:] := emptyFrame.enabled;\r
      state.descriptors[slot,:,:] := emptyFrame.descriptor;\r
      state.opticalPoints[slot,:,:] := emptyFrame.opticalPoint;\r
      state.pixelCoordinates[slot,:,:] := emptyFrame.pixels;\r
      state.rgbSizes[slot,:] := emptyFrame.rgbSize;\r
      state.depthSizes[slot,:] := emptyFrame.depthSize;\r
      state.rgbCalibrations[slot,:] := emptyFrame.rgbCalibration;\r
      state.depthCalibrations[slot,:] := emptyFrame.depthCalibration;\r
      state.opticalToBodyRotations[slot,:,:] := emptyFrame.opticalToBody;\r
      state.cameraOriginsBody[slot,:] := emptyFrame.cameraOriginBody;\r
      state.disparityNoises[slot] := emptyFrame.disparityNoise;\r
      state.noiseReferenceFocals[slot] := emptyFrame.noiseReferenceFx;\r
      state.baselines[slot] := emptyFrame.baseline;\r
      state.bodyRotations[slot,:,:] := emptyFrame.bodyRotation;\r
      state.bodyPositions[slot,:] := emptyFrame.bodyPosition;\r
      state.poseCovariances[slot,:,:] := emptyFrame.poseCovariance;\r
      state.filterSourceRevisions[slot] := emptyFrame.filterSourceRevision;\r
      state.filterCorrectionRevisions[slot] := emptyFrame.filterCorrectionRevision;\r
      state.vocabularyVersions[slot] := emptyFrame.vocabularyVersion;\r
      state.histograms[slot,:] := emptyFrame.histogram;\r
    end for;\r
  end Empty;\r
\r
\r
  // Internal slot extraction. Array domains are certified before reads.\r
  function ReadSlot\r
    input Catalog state;\r
    input Integer slot;\r
    output Frame frame;\r
  algorithm\r
    frame := EmptyFrame();\r
    if slot >= 1 and slot <= keyframeCapacity then\r
      frame.generation := state.generations[slot];\r
      frame.id := state.ids[slot];\r
      frame.epoch := state.epochs[slot];\r
      frame.imageTime := state.imageTimes[slot];\r
      frame.count := state.counts[slot];\r
      frame.enabled := state.featureEnabled[slot,:];\r
      frame.descriptor := state.descriptors[slot,:,:];\r
      frame.opticalPoint := state.opticalPoints[slot,:,:];\r
      frame.pixels := state.pixelCoordinates[slot,:,:];\r
      frame.rgbSize := state.rgbSizes[slot,:];\r
      frame.depthSize := state.depthSizes[slot,:];\r
      frame.rgbCalibration := state.rgbCalibrations[slot,:];\r
      frame.depthCalibration := state.depthCalibrations[slot,:];\r
      frame.opticalToBody := state.opticalToBodyRotations[slot,:,:];\r
      frame.cameraOriginBody := state.cameraOriginsBody[slot,:];\r
      frame.disparityNoise := state.disparityNoises[slot];\r
      frame.noiseReferenceFx := state.noiseReferenceFocals[slot];\r
      frame.baseline := state.baselines[slot];\r
      frame.bodyRotation := state.bodyRotations[slot,:,:];\r
      frame.bodyPosition := state.bodyPositions[slot,:];\r
      frame.poseCovariance := state.poseCovariances[slot,:,:];\r
      frame.filterSourceRevision := state.filterSourceRevisions[slot];\r
      frame.filterCorrectionRevision := state.filterCorrectionRevisions[slot];\r
      frame.vocabularyVersion := state.vocabularyVersions[slot];\r
      frame.histogram := state.histograms[slot,:];\r
    end if;\r
  end ReadSlot;\r
\r
  function ValidCalibration\r
    input Real calibration[4];\r
    input Integer imageSize[2];\r
    output Boolean valid;\r
  algorithm\r
    valid := imageSize[1] > 0 and imageSize[1] <= 8192\r
      and imageSize[2] > 0 and imageSize[2] <= 8192\r
      and calibration[1] > 0 and calibration[1] <= 1e6\r
      and calibration[2] > 0 and calibration[2] <= 1e6\r
      and abs(calibration[3]) <= 8192 and abs(calibration[4]) <= 8192;\r
  end ValidCalibration;\r
\r
  function ValidFrame\r
    input Frame frame;\r
    output Boolean valid;\r
  protected\r
    Integer measured;\r
    Real mass;\r
    Real norm;\r
    Real mean;\r
    Real inverseCovariance[poseDimension,poseDimension];\r
    Real scaledPivot;\r
    Boolean covarianceValid;\r
  algorithm\r
    valid := frame.generation >= 1 and frame.generation <= identifierLimit\r
      and frame.id >= 1 and frame.id < identifierLimit\r
      and frame.epoch >= 0 and frame.epoch <= identifierLimit\r
      and frame.imageTime >= 0 and frame.imageTime <= 1e9\r
      and frame.count >= 0 and frame.count <= featureCapacity\r
      and frame.vocabularyVersion >= 1 and frame.vocabularyVersion <= identifierLimit\r
      and ValidCalibration(frame.rgbCalibration,frame.rgbSize)\r
      and ValidCalibration(frame.depthCalibration,frame.depthSize)\r
      and frame.disparityNoise > 0 and frame.disparityNoise <= 100\r
      and frame.noiseReferenceFx > 0 and frame.noiseReferenceFx <= 1e6\r
      and frame.baseline > 0 and frame.baseline <= 10\r
      and RGBDUncertaintyProper(frame.opticalToBody)\r
      and RGBDUncertaintyProper(frame.bodyRotation);\r
    for axis in 1:dimension loop\r
      valid := valid and abs(frame.bodyPosition[axis]) <= 1e6\r
        and abs(frame.cameraOriginBody[axis]) <= 1e6;\r
    end for;\r
    (inverseCovariance,covarianceValid,scaledPivot) :=\r
      RGBDUncertaintyInverse6(frame.poseCovariance,1e-10);\r
    valid := valid and covarianceValid\r
      and frame.filterSourceRevision >= 0 and frame.filterSourceRevision < identifierLimit\r
      and frame.filterCorrectionRevision >= 0 and frame.filterCorrectionRevision < identifierLimit;\r
    measured := 0;\r
    for feature in 1:featureCapacity loop\r
      if frame.enabled[feature] then\r
        measured := measured+1;\r
        valid := valid and feature <= frame.count\r
          and frame.pixels[feature,1] >= 0 and frame.pixels[feature,1] < frame.rgbSize[2]\r
          and frame.pixels[feature,2] >= 0 and frame.pixels[feature,2] < frame.rgbSize[1]\r
          and frame.opticalPoint[feature,3] > 0;\r
        for axis in 1:dimension loop\r
          valid := valid and abs(frame.opticalPoint[feature,axis]) <= 1e6;\r
        end for;\r
        norm := 0.0;\r
        mean := 0.0;\r
        for sample in 1:descriptorSize loop\r
          valid := valid and abs(frame.descriptor[feature,sample]) <= 1.000001;\r
          norm := norm+frame.descriptor[feature,sample]^2;\r
          mean := mean+frame.descriptor[feature,sample];\r
        end for;\r
        valid := valid and abs(norm-1.0) <= 1e-6 and abs(mean) <= 1e-6;\r
      end if;\r
    end for;\r
    valid := valid and measured >= 8;\r
    mass := 0.0;\r
    for word in 1:wordCapacity loop\r
      valid := valid and frame.histogram[word] >= 0 and frame.histogram[word] <= 1;\r
      mass := mass+frame.histogram[word];\r
    end for;\r
    valid := valid and abs(mass-1.0) <= 1e-6;\r
  end ValidFrame;\r
\r
  // Header checks are cheap relative to payload validation; full payload\r
  // validation belongs to admission or restore. Store operates on an already\r
  // validated, Modelica-owned catalog. Slots are not a function of ids: ids\r
  // are unique, ordered like epochs and image times, and the slot due for\r
  // eviction (nextSlot) is free while filling and outside the newest\r
  // retainedNewest ids once full.\r
  function ValidHeader "Header and identity invariants of a keyframe catalog"\r
    input Catalog state;\r
    output Boolean valid;\r
  protected\r
    Integer expectedOccupied;\r
    Integer actualOccupied;\r
    Integer newestSlot;\r
    Integer recentCount;\r
    Boolean identityValid;\r
  algorithm\r
    expectedOccupied := 0; actualOccupied := 0;\r
    newestSlot := 0; recentCount := 0; identityValid := false;\r
    valid := state.generation >= 1 and state.generation <= identifierLimit\r
      and state.vocabularyVersion >= 1 and state.vocabularyVersion <= identifierLimit\r
      and state.nextId >= 1 and state.nextId <= identifierLimit\r
      and state.nextSlot >= 1 and state.nextSlot <= keyframeCapacity\r
      and state.lastEpoch >= -1 and state.lastEpoch <= identifierLimit\r
      and state.lastTime >= 0 and state.lastTime <= 1e9;\r
    // Certify Integer domains before subtraction or computing array indices.\r
    if valid then\r
      expectedOccupied := min(state.nextId-1,keyframeCapacity);\r
      for slot in 1:keyframeCapacity loop\r
        if state.occupied[slot] then\r
          actualOccupied := actualOccupied+1;\r
          identityValid := state.ids[slot] >= 1 and state.ids[slot] < state.nextId;\r
          valid := valid and identityValid\r
            and state.generations[slot] == state.generation\r
            and state.vocabularyVersions[slot] == state.vocabularyVersion\r
            and state.epochs[slot] >= 0 and state.epochs[slot] <= state.lastEpoch\r
            and state.imageTimes[slot] >= 0 and state.imageTimes[slot] <= state.lastTime;\r
          if identityValid then\r
            if state.ids[slot] == state.nextId-1 then newestSlot := slot; end if;\r
            if state.ids[slot] >= state.nextId-retainedNewest then recentCount := recentCount+1; end if;\r
          end if;\r
          // Unique ids; a smaller id is an older capture. Replaces the former\r
          // contiguity chain, which no longer holds once places are thinned.\r
          for other in 1:slot-1 loop\r
            if state.occupied[other] then\r
              valid := valid and state.ids[other] <> state.ids[slot]\r
                and (if state.ids[other] < state.ids[slot]\r
                  then state.epochs[other] < state.epochs[slot] and state.imageTimes[other] < state.imageTimes[slot]\r
                  else state.epochs[other] > state.epochs[slot] and state.imageTimes[other] > state.imageTimes[slot]);\r
            end if;\r
          end for;\r
        end if;\r
      end for;\r
      valid := valid and actualOccupied == expectedOccupied\r
        and recentCount == min(state.nextId-1,retainedNewest)\r
        and ((state.nextId == 1 and state.lastEpoch == -1 and state.lastTime == 0)\r
          or (state.nextId > 1 and state.lastEpoch >= 0));\r
      if state.nextId > 1 then\r
        valid := valid and newestSlot >= 1;\r
        if newestSlot >= 1 then\r
          valid := valid and state.epochs[newestSlot] == state.lastEpoch\r
            and state.imageTimes[newestSlot] == state.lastTime;\r
        end if;\r
      end if;\r
      if actualOccupied < keyframeCapacity then\r
        valid := valid and not state.occupied[state.nextSlot];\r
      else\r
        valid := valid and state.occupied[state.nextSlot]\r
          and state.ids[state.nextSlot] < state.nextId-retainedNewest;\r
      end if;\r
    end if;\r
  end ValidHeader;\r
\r
  function ValidCatalog\r
    input Catalog state;\r
    output Boolean valid;\r
  algorithm\r
    valid := ValidHeader(state);\r
    for slot in 1:keyframeCapacity loop\r
      if state.occupied[slot] then\r
        valid := valid and ValidFrame(ReadSlot(state,slot));\r
      end if;\r
    end for;\r
  end ValidCatalog;\r
\r
  function Store "Admit one keyframe into the slot chosen by the previous Store"\r
    input Catalog previous;\r
    input Frame candidate;\r
    input Boolean requested;\r
    input Integer retention[keyframeCapacity] = fill(retentionFirst,keyframeCapacity)\r
      "Graph-side eviction tier per slot (retentionHeld/First/Bridged); the default suits catalogs without a graph";\r
    output Catalog next;\r
    output Boolean accepted;\r
    output Integer storedSlot;\r
    output Integer evictedId "Invalidate this generation/id in graph and landmark owners";\r
    output Integer rejectionReason "0 stored; 1 idle; 2 header or candidate; 3 retention holds the slot due for eviction";\r
  protected\r
    Boolean evictable;\r
  algorithm\r
    next := previous;\r
    accepted := false;\r
    storedSlot := 0;\r
    evictedId := 0;\r
    rejectionReason := if requested then 2 else 1;\r
    if requested and ValidHeader(previous) and previous.nextId < identifierLimit then\r
      accepted := candidate.generation == previous.generation\r
        and candidate.vocabularyVersion == previous.vocabularyVersion\r
        and candidate.id == previous.nextId and candidate.epoch > previous.lastEpoch\r
        and (previous.nextId == 1 or candidate.imageTime > previous.lastTime)\r
        and ValidFrame(candidate);\r
      // The victim was chosen by the previous Store. Refuse, with a distinct\r
      // reason, when the graph now holds it instead of orphaning its edges.\r
      if accepted and previous.occupied[previous.nextSlot]\r
        and retention[previous.nextSlot] <> retentionFirst and retention[previous.nextSlot] <> retentionBridged then\r
        accepted := false; rejectionReason := storeRetentionRefused;\r
      end if;\r
      if accepted then\r
        rejectionReason := 0;\r
        storedSlot := previous.nextSlot;\r
        evictedId := if previous.occupied[storedSlot] then previous.ids[storedSlot] else 0;\r
        next.generations[storedSlot] := candidate.generation;\r
        next.ids[storedSlot] := candidate.id;\r
        next.epochs[storedSlot] := candidate.epoch;\r
        next.imageTimes[storedSlot] := candidate.imageTime;\r
        next.counts[storedSlot] := candidate.count;\r
        next.featureEnabled[storedSlot,:] := candidate.enabled;\r
        next.descriptors[storedSlot,:,:] := candidate.descriptor;\r
        next.opticalPoints[storedSlot,:,:] := candidate.opticalPoint;\r
        next.pixelCoordinates[storedSlot,:,:] := candidate.pixels;\r
        next.rgbSizes[storedSlot,:] := candidate.rgbSize;\r
        next.depthSizes[storedSlot,:] := candidate.depthSize;\r
        next.rgbCalibrations[storedSlot,:] := candidate.rgbCalibration;\r
        next.depthCalibrations[storedSlot,:] := candidate.depthCalibration;\r
        next.opticalToBodyRotations[storedSlot,:,:] := candidate.opticalToBody;\r
        next.cameraOriginsBody[storedSlot,:] := candidate.cameraOriginBody;\r
        next.disparityNoises[storedSlot] := candidate.disparityNoise;\r
        next.noiseReferenceFocals[storedSlot] := candidate.noiseReferenceFx;\r
        next.baselines[storedSlot] := candidate.baseline;\r
        next.bodyRotations[storedSlot,:,:] := candidate.bodyRotation;\r
        next.bodyPositions[storedSlot,:] := candidate.bodyPosition;\r
        next.poseCovariances[storedSlot,:,:] := candidate.poseCovariance;\r
        next.filterSourceRevisions[storedSlot] := candidate.filterSourceRevision;\r
        next.filterCorrectionRevisions[storedSlot] := candidate.filterCorrectionRevision;\r
        next.vocabularyVersions[storedSlot] := candidate.vocabularyVersion;\r
        next.histograms[storedSlot,:] := candidate.histogram;\r
        next.occupied[storedSlot] := true;\r
        next.nextId := previous.nextId+1;\r
        // Choose the next victim now, so retrieval, loop verification and the\r
        // graph owners keep excluding exactly the slot the next Store reuses.\r
        (next.nextSlot,evictable) := ChooseVictim(next,retention);\r
        next.lastEpoch := candidate.epoch;\r
        next.lastTime := candidate.imageTime;\r
      end if;\r
    end if;\r
  end Store;\r
\r
  function Lookup "Retained keyframe by generation and id"\r
    input Catalog state;\r
    input Integer generation;\r
    input Integer id;\r
    output Frame frame;\r
    output Boolean found;\r
    output Integer slot;\r
  algorithm\r
    frame := EmptyFrame();\r
    found := false;\r
    slot := 0;\r
    if generation == state.generation and id >= 1 and id < state.nextId and ValidHeader(state) then\r
      slot := SlotOf(state,id);\r
      if slot >= 1 then\r
        frame := ReadSlot(state,slot);\r
        found := true;\r
      end if;\r
    end if;\r
  end Lookup;\r
\r
  function SlotOf "Slot holding a retained id, or 0 when the id is not retained"\r
    input Catalog state;\r
    input Integer id;\r
    output Integer slot;\r
  algorithm\r
    slot := 0;\r
    for candidate in 1:keyframeCapacity loop\r
      if slot == 0 and state.occupied[candidate] and state.ids[candidate] == id then\r
        slot := candidate;\r
      end if;\r
    end for;\r
  end SlotOf;\r
\r
  function NewestSlot "Slot of the newest keyframe (id nextId-1), or 0 when empty"\r
    input Catalog state;\r
    output Integer slot;\r
  algorithm\r
    slot := if state.nextId > 1 then SlotOf(state,state.nextId-1) else 0;\r
  end NewestSlot;\r
\r
  function OldestId "Smallest retained id, or nextId when the catalog is empty"\r
    input Catalog state;\r
    output Integer id;\r
  algorithm\r
    id := state.nextId;\r
    for slot in 1:keyframeCapacity loop\r
      if state.occupied[slot] and state.ids[slot] < id then id := state.ids[slot]; end if;\r
    end for;\r
  end OldestId;\r
\r
  function IdOrder "Occupied slots in ascending id order"\r
    input Catalog state;\r
    output Integer order[keyframeCapacity] "order[rank] is the slot of the rank-th oldest retained id; 0 past count";\r
    output Integer count;\r
  protected\r
    Integer rank;\r
  algorithm\r
    // Pairwise ranks: O(keyframeCapacity^2) integer comparisons, no state.\r
    // Ids are unique in a valid header, so ranks form a permutation.\r
    order := fill(0,keyframeCapacity); count := 0;\r
    for slot in 1:keyframeCapacity loop\r
      if state.occupied[slot] then\r
        count := count+1; rank := 1;\r
        for other in 1:keyframeCapacity loop\r
          if state.occupied[other] and state.ids[other] < state.ids[slot] then rank := rank+1; end if;\r
        end for;\r
        if rank <= keyframeCapacity then order[rank] := slot; end if;\r
      end if;\r
    end for;\r
  end IdOrder;\r
\r
  function ChooseVictim "Slot the next Store overwrites: a free slot, else the retained place whose loss leaves the shortest gap"\r
    input Catalog state;\r
    input Integer retention[keyframeCapacity];\r
    output Integer slot;\r
    output Boolean evictable "False when retention holds every candidate; the next Store then refuses";\r
  protected\r
    Integer order[keyframeCapacity]; Integer count; Integer node; Integer before; Integer tier;\r
    Integer bestTier; Integer fallback; Real gap; Real bestGap; Real fallbackGap; Real nearest; Real distance;\r
    Real midpoint[dimension]; Real nearestMidpoint; Real midpointDistance;\r
  algorithm\r
    slot := 0; evictable := true;\r
    for candidate in 1:keyframeCapacity loop\r
      if slot == 0 and not state.occupied[candidate] then slot := candidate; end if;\r
    end for;\r
    if slot == 0 then\r
      // Candidates exclude id 1 and the newest retainedNewest ids. The key is\r
      // (retention tier, spacing, id): the lower tier first, then the smallest\r
      // spacing its eviction leaves, then the older id. That spacing is the\r
      // cover metric: the larger of the distance from the keyframe to the\r
      // nearest other retained keyframe (the place stays covered) and the\r
      // distance from the midpoint of its retained id-order neighbours to the\r
      // nearest other retained keyframe (the path hole stays covered). Measuring\r
      // the hole by coverage, not by the neighbours' separation, keeps a folded\r
      // path (out and back) from losing its far end. Ranks run in ascending id with strict\r
      // comparisons, so equal keys keep the older id; ids are unique, so the\r
      // final lower-slot rule never has to act. The oldest retained id (rank\r
      // 1, only once id 1 is gone, e.g. a catalog restored from a ring-era\r
      // store) has no older neighbour; its path term is the full spacing to\r
      // the next retained id. Cost: IdOrder's 64^2 integer comparisons plus\r
      // 2*64^2 squared distances.\r
      (order,count) := IdOrder(state);\r
      bestTier := 0; bestGap := 0.0; fallback := 0; fallbackGap := 0.0;\r
      for rank in 1:keyframeCapacity-1 loop\r
        if rank < count then\r
          node := order[rank]; before := if rank > 1 then order[max(rank-1,1)] else node;\r
          if state.ids[node] <> 1 and state.ids[node] < state.nextId-retainedNewest then\r
            // Squared cover metric; rank 1 has no older neighbour, so its hole\r
            // term is the keyframe itself.\r
            for axis in 1:dimension loop\r
              midpoint[axis] := if rank > 1 then 0.5*(state.bodyPositions[before,axis]+state.bodyPositions[order[rank+1],axis])\r
                else state.bodyPositions[node,axis];\r
            end for;\r
            nearest := -1.0; nearestMidpoint := -1.0;\r
            for other in 1:keyframeCapacity loop\r
              if other <> node and state.occupied[other] then\r
                distance := 0.0; midpointDistance := 0.0;\r
                for axis in 1:dimension loop\r
                  distance := distance+(state.bodyPositions[other,axis]-state.bodyPositions[node,axis])^2;\r
                  midpointDistance := midpointDistance+(state.bodyPositions[other,axis]-midpoint[axis])^2;\r
                end for;\r
                if nearest < 0.0 or distance < nearest then nearest := distance; end if;\r
                if nearestMidpoint < 0.0 or midpointDistance < nearestMidpoint then nearestMidpoint := midpointDistance; end if;\r
              end if;\r
            end for;\r
            gap := max(nearest,nearestMidpoint);\r
            tier := retention[node];\r
            if (tier == retentionFirst or tier == retentionBridged)\r
              and (bestTier == 0 or tier < bestTier or (tier == bestTier and gap < bestGap)) then\r
              slot := node; bestTier := tier; bestGap := gap;\r
            end if;\r
            if fallback == 0 or gap < fallbackGap then fallback := node; fallbackGap := gap; end if;\r
          end if;\r
        end if;\r
      end for;\r
      if slot == 0 then\r
        // Keep a valid header; Store refuses this slot while retention holds it.\r
        slot := max(1,fallback); evictable := false;\r
      end if;\r
    end if;\r
  end ChooseVictim;\r
\r
  function Reset\r
    input Catalog previous;\r
    input Integer generation;\r
    input Integer vocabularyVersion = 1;\r
    output Catalog next;\r
    output Boolean accepted;\r
  algorithm\r
    next := previous;\r
    accepted := generation >= 1 and generation > previous.generation and generation <= identifierLimit\r
      and vocabularyVersion >= 1 and vocabularyVersion <= identifierLimit;\r
    if accepted then\r
      next := Empty(generation,vocabularyVersion);\r
    end if;\r
  end Reset;\r
end RGBDKeyframes;\r
`;export{e as default};
