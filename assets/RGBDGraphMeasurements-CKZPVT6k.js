const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// The keyframe catalog owns nodes. This owner retains measured body edges,\r
// never poses inferred from them. All results are proposals for an outer\r
// estimator/reference/catalog/map transaction; callers must publish together.\r
package RGBDGraphMeasurements\r
\r
  constant Integer nodeCapacity = RGBDKeyframes.keyframeCapacity;\r
  constant Integer edgeCapacity = 256;\r
  constant Integer proposalCapacity = RGBDKeyframeRetrieval.proposalCapacity;\r
  constant Integer dimension = RGBDKeyframes.dimension;\r
  constant Integer poseDimension = RGBDKeyframes.poseDimension;\r
  constant Integer identifierLimit = RGBDKeyframes.identifierLimit;\r
  // Loop-anchored capture (isolated comparison). When the consecutive\r
  // edge fails, agreeing verified loops may admit the capture without it, so a\r
  // refused capture can no longer pin the catalog to a receding keyframe.\r
  constant Boolean loopAnchoredCapture = true;\r
  constant Integer anchorMinimumLoops = 2 "Agreeing verified loops to distinct non-anchored references";\r
  // Place-keeping retention. A single-child keyframe with a consecutive\r
  // parent may be evicted after Bridge composes its two consecutive edges;\r
  // false restricts eviction to leaves and a single-child oldest keyframe.\r
  constant Boolean retentionBridging = true "Allow eviction of bridged single-child keyframes";\r
  constant Real anchorConsistencySquared = 9.0;\r
  constant Real anchorMaximumInnovation = 2.0;\r
  // Odometry bridge. When the consecutive visual edge fails\r
  // consensus (7) or the pose screen (11) and no loop anchor admits the\r
  // capture, the filter's own motion between the two captures admits it with\r
  // a structural temporal edge (kind 3). Bridges keep the catalog growing and\r
  // the retention tree whole; they never enter a solve, so only visual edges\r
  // (kinds 1 and 2) correct poses or the filter. Requires loopAnchoredCapture.\r
  constant Boolean odometryBridge = true;\r
  constant Real bridgeMinimumGap = 2.5 "s since the latest retained capture before a bridge: visual retries come first";\r
  constant Real bridgeMaximumGap = 6.0 "s";\r
  constant Real bridgeMaximumTranslation = 4.0 "m";\r
  constant Real bridgeMaximumAngle = 1.0 "rad";\r
  constant Real bridgePositionFloor = 0.02 "m, added in quadrature to the bridge covariance";\r
  constant Real bridgeAngleFloor = 0.005 "rad, added in quadrature to the bridge covariance";\r
  // A capture refused a bridge for continuity, bounds or covariance this long\r
  // after the latest retained capture starts a new graph component instead.\r
  constant Real restartGap = 6.0 "s";\r
  constant Integer rootCapacity = 8 "Retained restart roots; exhaustion is a bounded refusal (Capture reason 9)";\r
\r
  record Edge\r
    Boolean enabled;\r
    Integer id;\r
    Integer kind "1: consecutive capture; 2: verified loop; 3: odometry bridge (structural, never solved)";\r
    Integer referenceId; Integer currentId;\r
    Integer referenceSlot; Integer currentSlot;\r
    Integer referenceEpoch; Integer currentEpoch;\r
    Real rotation[dimension,dimension]; Real translation[dimension];\r
    Real covariance[poseDimension,poseDimension];\r
    Real information[poseDimension,poseDimension];\r
  end Edge;\r
\r
  record State\r
    Integer generation;\r
    Integer revision;\r
    Integer lastCaptureId;\r
    Integer nextEdgeId;\r
    Edge edges[edgeCapacity];\r
    // A retained keyframe newer than the oldest without a temporal parent is\r
    // legitimate only with a marker in its slot: the id and why it has none.\r
    Integer parentless[nodeCapacity] "Id admitted without a temporal parent, by catalog slot; 0 none";\r
    Integer parentlessKind[nodeCapacity] "1 restart root; 2 loop-anchored; 0 none";\r
  end State;\r
\r
  function EmptyEdge\r
    output Edge result;\r
  algorithm\r
    result.enabled := false; result.id := 0; result.kind := 0;\r
    result.referenceId := 0; result.currentId := 0;\r
    result.referenceSlot := 0; result.currentSlot := 0;\r
    result.referenceEpoch := -1; result.currentEpoch := -1;\r
    result.rotation := identity(dimension); result.translation := zeros(dimension);\r
    result.covariance := zeros(poseDimension,poseDimension);\r
    result.information := zeros(poseDimension,poseDimension);\r
  end EmptyEdge;\r
\r
  function Temporal "Tree edge to the keyframe's parent: visual capture or odometry bridge"\r
    input Integer kind;\r
    output Boolean temporal;\r
  algorithm\r
    temporal := kind == 1 or kind == 3;\r
  end Temporal;\r
\r
  function Visual "Edge carrying image evidence; the only kinds any solve, gauge or correction reads"\r
    input Integer kind;\r
    output Boolean visual;\r
  algorithm\r
    visual := kind == 1 or kind == 2;\r
  end Visual;\r
\r
  function RestartRoots "Retained restart roots"\r
    input State state;\r
    output Integer count;\r
  algorithm\r
    count := 0;\r
    for slot in 1:nodeCapacity loop\r
      count := count+(if state.parentless[slot] > 0 and state.parentlessKind[slot] == 1 then 1 else 0);\r
    end for;\r
  end RestartRoots;\r
\r
  function Empty\r
    input Integer generation = 1;\r
    output State result;\r
  protected\r
    Edge empty;\r
  algorithm\r
    result.generation := generation; result.revision := 0;\r
    result.lastCaptureId := 0; result.nextEdgeId := 1;\r
    empty := EmptyEdge();\r
    for slot in 1:edgeCapacity loop result.edges[slot] := empty; end for;\r
    result.parentless := fill(0,nodeCapacity); result.parentlessKind := fill(0,nodeCapacity);\r
  end Empty;\r
\r
  function Bound\r
    input RGBDKeyframes.Catalog catalog;\r
    input Integer id; input Integer slot; input Integer epoch;\r
    output Boolean valid;\r
  algorithm\r
    // Header certification belongs to the caller. Integer domains precede\r
    // all catalog subscripts. Retention assigns slots, so the slot is checked\r
    // against the stored id rather than derived from it.\r
    valid := catalog.nextId >= 1 and catalog.nextId <= identifierLimit\r
      and catalog.lastEpoch >= -1 and catalog.lastEpoch <= identifierLimit;\r
    if valid then\r
      valid := id >= 1 and id < catalog.nextId\r
        and slot >= 1 and slot <= nodeCapacity and epoch >= 0 and epoch <= catalog.lastEpoch;\r
    end if;\r
    if valid then\r
      valid := catalog.occupied[slot] and catalog.ids[slot] == id\r
        and catalog.generations[slot] == catalog.generation\r
        and catalog.epochs[slot] == epoch;\r
    end if;\r
  end Bound;\r
\r
  function ValidUncertainty\r
    input Real covariance[poseDimension,poseDimension];\r
    input Real information[poseDimension,poseDimension];\r
    output Boolean valid;\r
  protected\r
    Real inverseCovariance[poseDimension,poseDimension];\r
    Real inverseInformation[poseDimension,poseDimension];\r
    Real pivot; Boolean covarianceValid; Boolean informationValid;\r
  algorithm\r
    (inverseCovariance,covarianceValid,pivot) := RGBDUncertaintyInverse6(covariance,1e-10);\r
    (inverseInformation,informationValid,pivot) := RGBDUncertaintyInverse6(information,1e-10);\r
    valid := covarianceValid and informationValid;\r
    if valid then\r
      for row in 1:poseDimension loop\r
        for column in 1:poseDimension loop\r
          valid := valid and abs(inverseCovariance[row,column]-information[row,column])\r
            <= 1e-7*max(1.0,abs(inverseCovariance[row,column]))\r
            and abs(inverseInformation[row,column]-covariance[row,column])\r
            <= 1e-7*max(1.0,abs(inverseInformation[row,column]));\r
        end for;\r
      end for;\r
    end if;\r
  end ValidUncertainty;\r
\r
  function ValidState\r
    input RGBDKeyframes.Catalog catalog;\r
    input State state;\r
    output Boolean valid;\r
  protected\r
    Boolean chain[nodeCapacity]; Boolean edgeValid;\r
    Integer oldest;\r
  algorithm\r
    chain := fill(false,nodeCapacity); oldest := 1;\r
    valid := RGBDKeyframes.ValidHeader(catalog)\r
      and state.generation == catalog.generation\r
      and state.revision >= 0 and state.revision <= identifierLimit\r
      and state.nextEdgeId >= 1 and state.nextEdgeId <= identifierLimit;\r
    if valid then\r
      valid := state.lastCaptureId == catalog.nextId-1;\r
      oldest := RGBDKeyframes.OldestId(catalog);\r
      for slot in 1:edgeCapacity loop\r
        if state.edges[slot].enabled then\r
          edgeValid := state.edges[slot].id >= 1 and state.edges[slot].id < state.nextEdgeId\r
            and state.edges[slot].kind >= 1 and state.edges[slot].kind <= 3\r
            and state.edges[slot].referenceId < state.edges[slot].currentId\r
            and Bound(catalog,state.edges[slot].referenceId,state.edges[slot].referenceSlot,state.edges[slot].referenceEpoch)\r
            and Bound(catalog,state.edges[slot].currentId,state.edges[slot].currentSlot,state.edges[slot].currentEpoch)\r
            and RGBDUncertaintyProper(state.edges[slot].rotation)\r
            and ValidUncertainty(state.edges[slot].covariance,state.edges[slot].information);\r
          for axis in 1:dimension loop\r
            edgeValid := edgeValid and abs(state.edges[slot].translation[axis]) <= 1e6;\r
          end for;\r
          if Temporal(state.edges[slot].kind) and edgeValid then\r
            // Temporal edges form a tree: at most one parent per keyframe,\r
            // always older (referenceId < currentId above).\r
            edgeValid := not chain[state.edges[slot].currentSlot];\r
            chain[state.edges[slot].currentSlot] := true;\r
          end if;\r
          valid := valid and edgeValid;\r
          for earlier in 1:slot-1 loop\r
            if state.edges[earlier].enabled then\r
              valid := valid and state.edges[earlier].id <> state.edges[slot].id\r
                and (state.edges[earlier].referenceId <> state.edges[slot].referenceId\r
                  or state.edges[earlier].currentId <> state.edges[slot].currentId);\r
            end if;\r
          end for;\r
        end if;\r
      end for;\r
      // Every retained keyframe newer than the oldest has exactly one\r
      // consecutive edge to an older retained keyframe, so retention leaves a\r
      // tree rooted at the oldest surviving keyframe (RetentionTiers, Bridge).\r
      // Loop-anchored capture drops this: nodes cut off from the newest\r
      // keyframe's component stay stored but leave the solve (PrepareProblem).\r
      // A parentless keyframe needs its marker (restart root or loop-anchored);\r
      // a marker names a retained keyframe in its own slot with no parent.\r
      for node in 1:nodeCapacity loop\r
        if state.parentless[node] > 0 then\r
          valid := valid and catalog.occupied[node] and catalog.ids[node] == state.parentless[node]\r
            and (state.parentlessKind[node] == 1 or state.parentlessKind[node] == 2) and not chain[node];\r
        else valid := valid and state.parentless[node] == 0 and state.parentlessKind[node] == 0;\r
        end if;\r
        if catalog.occupied[node] and catalog.ids[node] > oldest then\r
          valid := valid and (chain[node] or state.parentless[node] == catalog.ids[node]);\r
        end if;\r
      end for;\r
      valid := valid and RestartRoots(state) <= rootCapacity;\r
    end if;\r
  end ValidState;\r
\r
  function Reachable\r
    "Slots connected to keyframe seed by enabled edges"\r
    // Slots outside the catalog are skipped; callers that need bound edges\r
    // check ValidState.\r
    input RGBDKeyframes.Catalog catalog;\r
    input State state;\r
    input Integer seed;\r
    output Boolean reach[nodeCapacity];\r
    input Boolean visualOnly = false "Follow only edges a solve may read (kinds 1 and 2)";\r
  protected\r
    Boolean changed; Integer a; Integer b;\r
  algorithm\r
    reach := fill(false,nodeCapacity);\r
    for node in 1:nodeCapacity loop\r
      reach[node] := catalog.occupied[node] and catalog.ids[node] == seed;\r
    end for;\r
    // Each sweep that changes anything reaches at least one more node.\r
    changed := true;\r
    for pass in 1:nodeCapacity loop\r
      if changed then\r
        changed := false;\r
        for slot in 1:edgeCapacity loop\r
          a := state.edges[slot].referenceSlot; b := state.edges[slot].currentSlot;\r
          if state.edges[slot].enabled and (not visualOnly or Visual(state.edges[slot].kind))\r
            and a >= 1 and a <= nodeCapacity and b >= 1 and b <= nodeCapacity then\r
            if reach[a] <> reach[b] then reach[a] := true; reach[b] := true; changed := true; end if;\r
          end if;\r
        end for;\r
      end if;\r
    end for;\r
  end Reachable;\r
\r
  function ActiveOldest\r
    "Gauge id: oldest keyframe in the newest keyframe's component"\r
    input RGBDKeyframes.Catalog catalog;\r
    input State state;\r
    output Integer id;\r
  protected\r
    Boolean reach[nodeCapacity];\r
  algorithm\r
    id := RGBDKeyframes.OldestId(catalog);\r
    if loopAnchoredCapture and catalog.nextId > 1 then\r
      reach := Reachable(catalog,state,catalog.nextId-1,visualOnly=true); id := catalog.nextId-1;\r
      for node in 1:nodeCapacity loop\r
        if reach[node] and catalog.ids[node] < id then id := catalog.ids[node]; end if;\r
      end for;\r
    end if;\r
  end ActiveOldest;\r
\r
  function Anchored\r
    "Retained keyframe admitted without a consecutive edge"\r
    input RGBDKeyframes.Catalog catalog;\r
    input State state;\r
    input Integer id;\r
    output Boolean anchored;\r
  algorithm\r
    anchored := id > RGBDKeyframes.OldestId(catalog);\r
    for slot in 1:edgeCapacity loop\r
      if state.edges[slot].enabled and Temporal(state.edges[slot].kind) and state.edges[slot].currentId == id then\r
        anchored := false;\r
      end if;\r
    end for;\r
  end Anchored;\r
\r
  function AnchorImplied\r
    "Motion screen and implied new keyframe position for one verified loop"\r
    input RGBDKeyframes.Catalog catalog;\r
    input Integer currentSlot;\r
    input RGBDLoopVerification.Proposal proposal;\r
    input Real minimumPivot;\r
    output Boolean consistent;\r
    output Real implied[dimension];\r
    output Real impliedCovariance[dimension,dimension];\r
  protected\r
    Integer slot; Real squared; Real arm[dimension,dimension];\r
  algorithm\r
    // Callers pass a bound proposal, so the reference is retained.\r
    slot := max(1,RGBDKeyframes.SlotOf(catalog,proposal.referenceId));\r
    (consistent,squared) := RGBDCatalogLoopVerification.PoseConsistent(catalog.bodyPositions[slot,:],\r
      catalog.bodyPositions[currentSlot,:],catalog.bodyRotations[slot,:,:],\r
      catalog.poseCovariances[slot,:,:],catalog.poseCovariances[currentSlot,:,:],\r
      proposal.bodyTranslation,proposal.covariance[1:3,1:3],\r
      maximumSquared=anchorConsistencySquared,minimumPivot=minimumPivot,\r
      maximumTranslationInnovation=anchorMaximumInnovation);\r
    implied := catalog.bodyPositions[slot,:]+catalog.bodyRotations[slot,:,:]*proposal.bodyTranslation;\r
    arm := catalog.bodyRotations[slot,:,:]*RGBDUncertaintySkew(proposal.bodyTranslation);\r
    impliedCovariance := catalog.poseCovariances[slot,1:3,1:3]\r
      +catalog.bodyRotations[slot,:,:]*proposal.covariance[1:3,1:3]*transpose(catalog.bodyRotations[slot,:,:])\r
      +arm*catalog.poseCovariances[slot,4:6,4:6]*transpose(arm);\r
  end AnchorImplied;\r
\r
  function AnchorAdmissible\r
    // The capture is already stored in catalog and graph holds no edge to it.\r
    // Each agreeing loop passes admission and the production motion screen\r
    // (forced on), and the loops imply the same new keyframe position.\r
    input RGBDKeyframes.Catalog catalog;\r
    input State graph;\r
    input RGBDLoopVerification.Proposal loops[proposalCapacity];\r
    input Real inlierDistance; input Real maximumRms;\r
    input Boolean calibratedResiduals; input Real maximumNormalizedSquared;\r
    input Real localizationSigma; input Real depthInflation; input Real minimumPivot;\r
    output Boolean admitted;\r
    output Boolean evictionRefused;\r
    output Boolean agreed[proposalCapacity] "Loops the anchor admits; no other loop is inserted";\r
  protected\r
    Boolean usable[proposalCapacity]; Boolean consistent; Boolean distinct;\r
    Integer currentSlot; Integer agreeing; Integer newest;\r
    Real implied[proposalCapacity,dimension]; Real impliedCovariance[proposalCapacity,dimension,dimension];\r
    Real squared; Boolean active[nodeCapacity];\r
    Real position[dimension]; Real positionCovariance[dimension,dimension];\r
  algorithm\r
    admitted := false; evictionRefused := false; agreed := fill(false,proposalCapacity);\r
    // A reference must be in the previous keyframe's component, so an\r
    // anchor never makes a detached part the active one.\r
    active := Reachable(catalog,graph,catalog.nextId-2);\r
    usable := fill(false,proposalCapacity);\r
    implied := zeros(proposalCapacity,dimension); impliedCovariance := zeros(proposalCapacity,dimension,dimension);\r
    currentSlot := max(1,RGBDKeyframes.NewestSlot(catalog));\r
    for rank in 1:proposalCapacity loop\r
      if loops[rank].verified then\r
        usable[rank] := ValidProposal(catalog,loops[rank],inlierDistance,maximumRms,\r
          calibratedResiduals=calibratedResiduals,maximumNormalizedSquared=maximumNormalizedSquared,\r
          localizationSigma=localizationSigma,depthInflation=depthInflation,minimumPivot=minimumPivot)\r
          and not Anchored(catalog,graph,loops[rank].referenceId)\r
          and active[max(1,RGBDKeyframes.SlotOf(catalog,loops[rank].referenceId))];\r
        for earlier in 1:rank-1 loop\r
          usable[rank] := usable[rank] and not (usable[earlier] and loops[earlier].referenceId == loops[rank].referenceId);\r
        end for;\r
        if usable[rank] then\r
          // The proposal goes in as an argument: one reference compiler cannot slice a\r
          // field of a record array element, and the exporter cannot copy one to a local.\r
          (consistent,position,positionCovariance) := AnchorImplied(catalog,currentSlot,loops[rank],minimumPivot);\r
          usable[rank] := consistent; implied[rank,:] := position; impliedCovariance[rank,:,:] := positionCovariance;\r
        end if;\r
      end if;\r
    end for;\r
    // Agreement is checked against each usable loop in turn: it and every\r
    // loop whose implied position matches it within the same gate (four\r
    // times the marginal sum, as in the motion screen).\r
    for rank in 1:proposalCapacity loop\r
      if usable[rank] and not admitted then\r
        agreeing := 0; newest := 0; agreed := fill(false,proposalCapacity);\r
        for other in 1:proposalCapacity loop\r
          if usable[other] then\r
            if other == rank then consistent := true;\r
            else\r
              (consistent,squared) := RegistrationWhitenedResidual3(implied[rank,:]-implied[other,:],\r
                4.0*(impliedCovariance[rank,:,:]+impliedCovariance[other,:,:]),minimumPivot);\r
              consistent := consistent and squared <= anchorConsistencySquared;\r
            end if;\r
            if consistent then agreeing := agreeing+1; newest := max(newest,loops[other].referenceId); end if;\r
            agreed[other] := consistent;\r
          end if;\r
        end for;\r
        if agreeing >= anchorMinimumLoops then\r
          // Retention holds every keyframe a verified loop references, so the\r
          // newest agreeing reference stays retained. Refuse only if it is the\r
          // slot the next Store overwrites, rather than orphan the anchor.\r
          if RGBDKeyframes.SlotOf(catalog,newest) <> catalog.nextSlot then admitted := true;\r
          else evictionRefused := true;\r
          end if;\r
        end if;\r
      end if;\r
    end for;\r
    if admitted then evictionRefused := false; else agreed := fill(false,proposalCapacity); end if;\r
  end AnchorAdmissible;\r
\r
  function ValidProposal\r
    input RGBDKeyframes.Catalog catalog;\r
    input RGBDLoopVerification.Proposal proposal;\r
    input Real inlierDistance = 0.08;\r
    input Real maximumRms = 0.03;\r
    output Boolean valid;\r
    input Boolean calibratedResiduals = true;\r
    input Real maximumNormalizedSquared = 9.0;\r
    input Real localizationSigma = 0.5; input Real depthInflation = 1.0; input Real minimumPivot = 1e-10;\r
  protected\r
    Integer referenceSlot; Integer currentSlot; Integer partner; Integer inliers;\r
    Boolean used[RGBDKeyframes.featureCapacity]; Boolean pairValid;\r
    Real A[dimension,dimension]; Real D[dimension,dimension]; Real u[dimension];\r
    Real residual[dimension]; Real cost;\r
    Real referencePoint[dimension]; Real currentPoint[dimension];\r
    Real referenceCovariance[dimension,dimension]; Real currentCovariance[dimension,dimension];\r
    Real squared; Boolean residualValid;\r
  algorithm\r
    referenceSlot := 1; currentSlot := 1; partner := 1; inliers := 0; cost := 0.0;\r
    used := fill(false,RGBDKeyframes.featureCapacity);\r
    valid := RGBDKeyframes.ValidHeader(catalog) and proposal.verified and proposal.rejectionReason == 0\r
      and proposal.generation == catalog.generation\r
      and proposal.referenceId >= 1 and proposal.referenceId < proposal.currentId\r
      and proposal.currentId < catalog.nextId\r
      and proposal.matchedCount >= proposal.inlierCount\r
      and proposal.matchedCount <= RGBDKeyframes.featureCapacity\r
      and proposal.inlierCount >= 3 and proposal.inlierCount <= RGBDKeyframes.featureCapacity\r
      and proposal.rms >= 0 and proposal.rms <= (if calibratedResiduals then 1e6 else maximumRms)\r
      and inlierDistance > 0 and inlierDistance <= 10\r
      and maximumRms >= 0 and maximumRms <= inlierDistance\r
      and RGBDUncertaintyProper(proposal.opticalRotation)\r
      and RGBDUncertaintyProper(proposal.bodyRotation)\r
      and ValidUncertainty(proposal.covariance,proposal.information);\r
    if calibratedResiduals then\r
      valid := valid and maximumNormalizedSquared > 0 and maximumNormalizedSquared <= 1e6\r
        and localizationSigma > 0 and localizationSigma <= 10\r
        and depthInflation >= 1 and depthInflation <= 100 and minimumPivot > 0 and minimumPivot < 1;\r
    end if;\r
    if valid then\r
      valid := proposal.currentId == catalog.nextId-1;\r
      // A missing id maps to slot 1, which Bound then refuses.\r
      referenceSlot := max(1,RGBDKeyframes.SlotOf(catalog,proposal.referenceId));\r
      currentSlot := max(1,RGBDKeyframes.SlotOf(catalog,proposal.currentId));\r
      valid := Bound(catalog,proposal.referenceId,referenceSlot,proposal.referenceEpoch)\r
        and Bound(catalog,proposal.currentId,currentSlot,proposal.currentEpoch);\r
      if valid and calibratedResiduals then\r
        // Admission owns its policy and recomputes every residual from the\r
        // retained calibrated points. A verifier's Boolean is not sufficient.\r
        valid := catalog.disparityNoises[referenceSlot] > 0 and catalog.disparityNoises[referenceSlot] <= 10\r
          and catalog.disparityNoises[referenceSlot] == catalog.disparityNoises[currentSlot]\r
          and catalog.baselines[referenceSlot] > 0 and catalog.baselines[referenceSlot] <= 1\r
          and catalog.baselines[referenceSlot] == catalog.baselines[currentSlot]\r
          and catalog.noiseReferenceFocals[referenceSlot] > 0 and catalog.noiseReferenceFocals[referenceSlot] <= 1e6\r
          and catalog.noiseReferenceFocals[currentSlot] > 0 and catalog.noiseReferenceFocals[currentSlot] <= 1e6;\r
        for axis in 1:2 loop\r
          valid := valid and catalog.rgbCalibrations[referenceSlot,axis] > 0 and catalog.rgbCalibrations[referenceSlot,axis] <= 1e6\r
            and catalog.rgbCalibrations[currentSlot,axis] > 0 and catalog.rgbCalibrations[currentSlot,axis] <= 1e6;\r
        end for;\r
      end if;\r
      if valid then\r
        A := catalog.opticalToBodyRotations[referenceSlot,:,:]*transpose(proposal.opticalRotation);\r
        D := A*transpose(catalog.opticalToBodyRotations[currentSlot,:,:]);\r
        u := catalog.cameraOriginsBody[referenceSlot,:]-A*(proposal.opticalTranslation\r
          +transpose(catalog.opticalToBodyRotations[currentSlot,:,:])*catalog.cameraOriginsBody[currentSlot,:]);\r
        valid := max(abs(D-proposal.bodyRotation)) <= 1e-7\r
          and max(abs(u-proposal.bodyTranslation)) <= 1e-7;\r
        for axis in 1:dimension loop\r
          valid := valid and abs(proposal.opticalTranslation[axis]) <= 1e6\r
            and abs(proposal.bodyTranslation[axis]) <= 1e6;\r
        end for;\r
        for feature in 1:RGBDKeyframes.featureCapacity loop\r
          if proposal.inliers[feature] then\r
            inliers := inliers+1;\r
            partner := proposal.partners[feature];\r
            pairValid := catalog.featureEnabled[referenceSlot,feature]\r
              and partner >= 1 and partner <= RGBDKeyframes.featureCapacity;\r
            if pairValid then\r
              pairValid := catalog.featureEnabled[currentSlot,partner] and not used[partner];\r
              used[partner] := true;\r
              referencePoint := catalog.opticalPoints[referenceSlot,feature,:];\r
              currentPoint := catalog.opticalPoints[currentSlot,partner,:];\r
              residual := proposal.opticalRotation*referencePoint+proposal.opticalTranslation-currentPoint;\r
              if calibratedResiduals then\r
                pairValid := pairValid and referencePoint[3] > 0 and currentPoint[3] > 0\r
                  and max(abs(referencePoint)) <= 1e6 and max(abs(currentPoint)) <= 1e6;\r
                if pairValid then\r
                  referenceCovariance := RGBDOpticalPointCovariance(referencePoint,\r
                    catalog.rgbCalibrations[referenceSlot,1],catalog.rgbCalibrations[referenceSlot,2],localizationSigma,\r
                    catalog.disparityNoises[referenceSlot],catalog.noiseReferenceFocals[referenceSlot],catalog.baselines[referenceSlot],depthInflation);\r
                  currentCovariance := RGBDOpticalPointCovariance(currentPoint,\r
                    catalog.rgbCalibrations[currentSlot,1],catalog.rgbCalibrations[currentSlot,2],localizationSigma,\r
                    catalog.disparityNoises[currentSlot],catalog.noiseReferenceFocals[currentSlot],catalog.baselines[currentSlot],depthInflation);\r
                  (residualValid,squared) := RegistrationPairResidual(referencePoint,currentPoint,\r
                    proposal.opticalRotation,proposal.opticalTranslation,true,referenceCovariance,currentCovariance,minimumPivot);\r
                  pairValid := residualValid and squared <= maximumNormalizedSquared;\r
                end if;\r
              else\r
                pairValid := pairValid and residual*residual <= inlierDistance^2;\r
              end if;\r
              cost := cost+residual*residual;\r
            end if;\r
            valid := valid and pairValid;\r
          else\r
            valid := valid and proposal.partners[feature] == 0;\r
          end if;\r
        end for;\r
        valid := valid and inliers == proposal.inlierCount;\r
        if inliers > 0 then valid := valid and abs(sqrt(cost/inliers)-proposal.rms) <= 1e-6; end if;\r
      end if;\r
    end if;\r
  end ValidProposal;\r
\r
  function FromProposal\r
    input RGBDKeyframes.Catalog catalog "Catalog the proposal is bound to";\r
    input RGBDLoopVerification.Proposal proposal;\r
    input Integer id; input Integer kind;\r
    output Edge result;\r
  algorithm\r
    result := EmptyEdge(); result.enabled := true; result.id := id; result.kind := kind;\r
    result.referenceId := proposal.referenceId; result.currentId := proposal.currentId;\r
    result.referenceSlot := RGBDKeyframes.SlotOf(catalog,proposal.referenceId);\r
    result.currentSlot := RGBDKeyframes.SlotOf(catalog,proposal.currentId);\r
    result.referenceEpoch := proposal.referenceEpoch; result.currentEpoch := proposal.currentEpoch;\r
    result.rotation := proposal.bodyRotation; result.translation := proposal.bodyTranslation;\r
    result.covariance := proposal.covariance; result.information := proposal.information;\r
  end FromProposal;\r
\r
  record Insertion\r
    State state;\r
    Boolean accepted; Boolean duplicate;\r
    Integer replacedLoops;\r
  end Insertion;\r
\r
  function Insert\r
    // Internal primitive: Capture certifies the graph, proposal and kind\r
    // before calling. Direct callers must satisfy the same preconditions.\r
    input State previous;\r
    input RGBDKeyframes.Catalog catalog "Catalog the proposal is bound to";\r
    input RGBDLoopVerification.Proposal proposal;\r
    input Integer kind;\r
    output Insertion result;\r
  protected\r
    Integer freeSlot; Integer oldestLoop; Integer oldestId;\r
  algorithm\r
    result.state := previous; result.accepted := false; result.duplicate := false; result.replacedLoops := 0;\r
    freeSlot := 0; oldestLoop := 0; oldestId := identifierLimit;\r
    for slot in 1:edgeCapacity loop\r
      if previous.edges[slot].enabled then\r
        result.duplicate := result.duplicate or (previous.edges[slot].referenceId == proposal.referenceId\r
          and previous.edges[slot].currentId == proposal.currentId);\r
        if previous.edges[slot].kind == 2 and previous.edges[slot].id < oldestId then\r
          oldestLoop := slot; oldestId := previous.edges[slot].id;\r
        end if;\r
      elseif freeSlot == 0 then freeSlot := slot;\r
      end if;\r
    end for;\r
    if result.duplicate then\r
      result.accepted := true;\r
    elseif previous.nextEdgeId < identifierLimit then\r
      if freeSlot == 0 then freeSlot := oldestLoop; result.replacedLoops := if oldestLoop > 0 then 1 else 0; end if;\r
      if freeSlot > 0 then\r
        result.state.edges[freeSlot] := FromProposal(catalog,proposal,previous.nextEdgeId,kind);\r
        result.state.nextEdgeId := previous.nextEdgeId+1;\r
        result.accepted := true;\r
      end if;\r
    end if;\r
  end Insert;\r
\r
  function InsertEdge\r
    "Store a prepared edge (an odometry bridge) under Insert's slot and loop-replacement rules"\r
    // Internal primitive: Capture certifies the graph and the edge first; the\r
    // edge's id is assigned here.\r
    input State previous;\r
    input Edge edge;\r
    output Insertion result;\r
  protected\r
    Integer freeSlot; Integer oldestLoop; Integer oldestId;\r
  algorithm\r
    result.state := previous; result.accepted := false; result.duplicate := false; result.replacedLoops := 0;\r
    freeSlot := 0; oldestLoop := 0; oldestId := identifierLimit;\r
    for slot in 1:edgeCapacity loop\r
      if previous.edges[slot].enabled then\r
        result.duplicate := result.duplicate or (previous.edges[slot].referenceId == edge.referenceId\r
          and previous.edges[slot].currentId == edge.currentId);\r
        if previous.edges[slot].kind == 2 and previous.edges[slot].id < oldestId then\r
          oldestLoop := slot; oldestId := previous.edges[slot].id;\r
        end if;\r
      elseif freeSlot == 0 then freeSlot := slot;\r
      end if;\r
    end for;\r
    if not result.duplicate and previous.nextEdgeId < identifierLimit then\r
      if freeSlot == 0 then freeSlot := oldestLoop; result.replacedLoops := if oldestLoop > 0 then 1 else 0; end if;\r
      if freeSlot > 0 then\r
        result.state.edges[freeSlot] := edge;\r
        result.state.edges[freeSlot].id := previous.nextEdgeId;\r
        result.state.nextEdgeId := previous.nextEdgeId+1;\r
        result.accepted := true;\r
      end if;\r
    end if;\r
  end InsertEdge;\r
\r
  function OdometryEdge\r
    "Kind-3 temporal edge from the filter's own motion between two retained captures"\r
    // D = Ri'Rj, u = Ri'(pj-pi) from the raw capture poses (never graph-corrected).\r
    // Residual [Ri'(pj-pi)-u; Log(D'Ri'Rj)] under p+dp (world), R*Exp(dth):\r
    //   Ji = [-Ri', skew(u); 0, -D'], Jj = [Ri', 0; 0, I].\r
    // Covariance 2(Ji Si Ji' + Jj Sj Jj') + floors bounds every correlation\r
    // between the two filter epochs (first order). No solver reads it (Visual).\r
    input RGBDKeyframes.Catalog catalog "Holds both captures";\r
    input Integer referenceId;\r
    input Integer currentId;\r
    output Edge result;\r
    output Integer reason "0 eligible; 1 filter continuity; 2 hard bound; 3 edge covariance; 4 identity/timing";\r
  protected\r
    Integer i; Integer j; Boolean valid; Real dt; Real cosine; Real angle; Real pivot;\r
    Real Ri[dimension,dimension]; Real Rj[dimension,dimension]; Real D[dimension,dimension]; Real u[dimension];\r
    Real Ji[poseDimension,poseDimension]; Real Jj[poseDimension,poseDimension];\r
    Real covariance[poseDimension,poseDimension]; Real information[poseDimension,poseDimension];\r
  algorithm\r
    result := EmptyEdge(); reason := 4;\r
    i := RGBDKeyframes.SlotOf(catalog,referenceId); j := RGBDKeyframes.SlotOf(catalog,currentId);\r
    if i >= 1 and j >= 1 and referenceId < currentId then\r
      dt := catalog.imageTimes[j]-catalog.imageTimes[i];\r
      valid := catalog.generations[i] == catalog.generation and catalog.generations[j] == catalog.generation\r
        and catalog.epochs[i] < catalog.epochs[j] and dt >= bridgeMinimumGap;\r
      if valid then\r
        reason := 1;\r
        if catalog.filterSourceRevisions[i] == catalog.filterSourceRevisions[j]\r
          and catalog.filterCorrectionRevisions[i] == catalog.filterCorrectionRevisions[j] then\r
          reason := 2;\r
          Ri := catalog.bodyRotations[i,:,:]; Rj := catalog.bodyRotations[j,:,:];\r
          D := transpose(Ri)*Rj; u := transpose(Ri)*(catalog.bodyPositions[j,:]-catalog.bodyPositions[i,:]);\r
          cosine := min(1.0,max(-1.0,(D[1,1]+D[2,2]+D[3,3]-1.0)/2.0)); angle := acos(cosine);\r
          // Comparisons with NaN are false, so a non-finite value stays refused.\r
          if dt <= bridgeMaximumGap and sqrt(u*u) <= bridgeMaximumTranslation and angle <= bridgeMaximumAngle then\r
            reason := 3;\r
            Ji := zeros(poseDimension,poseDimension); Jj := zeros(poseDimension,poseDimension);\r
            Ji[1:3,1:3] := -transpose(Ri); Ji[1:3,4:6] := RGBDUncertaintySkew(u); Ji[4:6,4:6] := -transpose(D);\r
            Jj[1:3,1:3] := transpose(Ri); Jj[4:6,4:6] := identity(dimension);\r
            covariance := 2.0*(Ji*catalog.poseCovariances[i,:,:]*transpose(Ji)+Jj*catalog.poseCovariances[j,:,:]*transpose(Jj));\r
            for axis in 1:dimension loop\r
              covariance[axis,axis] := covariance[axis,axis]+bridgePositionFloor^2;\r
              covariance[axis+3,axis+3] := covariance[axis+3,axis+3]+bridgeAngleFloor^2;\r
            end for;\r
            covariance := 0.5*(covariance+transpose(covariance));\r
            (information,valid,pivot) := RGBDUncertaintyInverse6(covariance,1e-10);\r
            if valid then\r
              information := 0.5*(information+transpose(information));\r
              valid := ValidUncertainty(covariance,information);\r
            end if;\r
            if valid then\r
              reason := 0;\r
              result.enabled := true; result.kind := 3;\r
              result.referenceId := referenceId; result.currentId := currentId;\r
              result.referenceSlot := i; result.currentSlot := j;\r
              result.referenceEpoch := catalog.epochs[i]; result.currentEpoch := catalog.epochs[j];\r
              result.rotation := D; result.translation := u;\r
              result.covariance := covariance; result.information := information;\r
            end if;\r
          end if;\r
        end if;\r
      end if;\r
    end if;\r
  end OdometryEdge;\r
\r
  function RetentionTiers "Per-slot eviction tier the graph grants the keyframe catalog before Store"\r
    // The catalog never reads graph records; this mask is the whole interface.\r
    // Held: a verified loop (enabled edge or pending proposal) or the pending\r
    // consecutive proposal references the keyframe, or removing it would\r
    // split the consecutive tree. First: a leaf, or the oldest retained\r
    // keyframe with exactly one child. Bridged: one child and a consecutive\r
    // parent; Capture composes the two edges. Newest ids and id 1 are\r
    // protected by the catalog itself.\r
    // Store checks the tier of the slot due for eviction (nextSlot) and then\r
    // chooses the next victim with the same mask, so every other slot gets\r
    // its tier in the graph as it stands after that eviction: the parent of\r
    // an evicted leaf loses a child, and the only child of an evicted root\r
    // becomes the root. Evictions only remove children, so these tiers are\r
    // never less protective than the next capture's own mask.\r
    input RGBDKeyframes.Catalog catalog;\r
    input State state;\r
    input RGBDLoopVerification.Proposal sequential "Pending consecutive proposal; its reference gains a child";\r
    input RGBDLoopVerification.Proposal loops[proposalCapacity] "Pending loop proposals; their references are held";\r
    input Boolean bridge = retentionBridging;\r
    input Boolean projectAfterEviction = true "False is planning only; Store still checks the selected slot against the original tiers";\r
    output Integer tier[nodeCapacity];\r
    output Integer children[nodeCapacity] "Consecutive (kind-1) children per slot in the current graph";\r
    output Boolean loopReferenced[nodeCapacity];\r
  protected\r
    Boolean parent[nodeCapacity]; Boolean parentAfter[nodeCapacity];\r
    Integer parentSlot[nodeCapacity]; Integer childSlot[nodeCapacity]; Integer childrenAfter[nodeCapacity];\r
    Integer a; Integer b; Integer oldest; Integer oldestAfter; Integer slot; Integer victim; Integer referenceSlot;\r
    Integer count; Integer root; Boolean linked;\r
  algorithm\r
    children := fill(0,nodeCapacity); loopReferenced := fill(false,nodeCapacity); parent := fill(false,nodeCapacity);\r
    parentSlot := fill(0,nodeCapacity); childSlot := fill(0,nodeCapacity);\r
    for edge in 1:edgeCapacity loop\r
      a := state.edges[edge].referenceSlot; b := state.edges[edge].currentSlot;\r
      if state.edges[edge].enabled and a >= 1 and a <= nodeCapacity and b >= 1 and b <= nodeCapacity then\r
        if catalog.occupied[a] and catalog.ids[a] == state.edges[edge].referenceId\r
          and catalog.occupied[b] and catalog.ids[b] == state.edges[edge].currentId then\r
          if Temporal(state.edges[edge].kind) then\r
            children[a] := children[a]+1; childSlot[a] := b; parent[b] := true; parentSlot[b] := a;\r
          else\r
            loopReferenced[a] := true; loopReferenced[b] := true;\r
          end if;\r
        end if;\r
      end if;\r
    end for;\r
    referenceSlot := 0;\r
    if sequential.verified then\r
      referenceSlot := RGBDKeyframes.SlotOf(catalog,sequential.referenceId);\r
      if referenceSlot >= 1 then children[referenceSlot] := children[referenceSlot]+1; end if;\r
    end if;\r
    for rank in 1:proposalCapacity loop\r
      if loops[rank].verified then\r
        slot := RGBDKeyframes.SlotOf(catalog,loops[rank].referenceId);\r
        if slot >= 1 then loopReferenced[slot] := true; end if;\r
      end if;\r
    end for;\r
    oldest := RGBDKeyframes.OldestId(catalog);\r
    childrenAfter := children; parentAfter := parent; oldestAfter := oldest; victim := 0;\r
    if projectAfterEviction and catalog.nextSlot >= 1 and catalog.nextSlot <= nodeCapacity then\r
      if catalog.occupied[catalog.nextSlot] then victim := catalog.nextSlot; end if;\r
    end if;\r
    if victim >= 1 then\r
      if parentSlot[victim] >= 1 and children[victim] == 0 then\r
        childrenAfter[parentSlot[victim]] := childrenAfter[parentSlot[victim]]-1;\r
      end if;\r
      if parentSlot[victim] == 0 and children[victim] == 1 and childSlot[victim] >= 1 then\r
        parentAfter[childSlot[victim]] := false;\r
      end if;\r
      oldestAfter := catalog.nextId;\r
      for node in 1:nodeCapacity loop\r
        if node <> victim and catalog.occupied[node] and catalog.ids[node] < oldestAfter then oldestAfter := catalog.ids[node]; end if;\r
      end for;\r
    end if;\r
    for node in 1:nodeCapacity loop\r
      count := if node == victim then children[node] else childrenAfter[node];\r
      linked := if node == victim then parent[node] else parentAfter[node];\r
      root := if node == victim then oldest else oldestAfter;\r
      tier[node] := RGBDKeyframes.retentionHeld;\r
      if not catalog.occupied[node] then\r
        tier[node] := RGBDKeyframes.retentionFirst;\r
      elseif not loopReferenced[node] and node <> referenceSlot then\r
        if count == 0 or (count == 1 and catalog.ids[node] == root) then\r
          tier[node] := RGBDKeyframes.retentionFirst;\r
        elseif bridge and count == 1 and linked then\r
          tier[node] := RGBDKeyframes.retentionBridged;\r
        end if;\r
      end if;\r
    end for;\r
  end RetentionTiers;\r
\r
\r
  function PlanNodeCapacity "Bounded source proposal; never an instruction to evict a held node"\r
    input RGBDKeyframes.Catalog catalog;\r
    input State previous;\r
    input RGBDLoopVerification.Proposal sequential;\r
    input RGBDLoopVerification.Proposal loops[proposalCapacity];\r
    output Integer slot;\r
    output State proposed;\r
    output Integer retiredLoopFactors;\r
    output Boolean accepted;\r
  protected\r
    State topology;\r
    Integer tier[nodeCapacity]; Integer children[nodeCapacity];\r
    Boolean referenced[nodeCapacity]; Boolean evictable;\r
    Integer candidate;\r
  algorithm\r
    slot := catalog.nextSlot; proposed := previous; retiredLoopFactors := 0; accepted := false;\r
    if RGBDKeyframes.ValidHeader(catalog) and ValidState(catalog,previous) then\r
      // First prefer an already eligible node. This can repair an obsolete\r
      // planned slot without losing any graph information.\r
      (tier,children,referenced) := RetentionTiers(catalog,previous,sequential,loops,\r
        projectAfterEviction=false);\r
      (candidate,evictable) := RGBDKeyframes.ChooseVictim(catalog,tier);\r
      if not evictable then\r
        // A fixed node budget cannot make every historical loop endpoint\r
        // immortal. Plan on temporal topology, retaining all pending matches.\r
        // This shadow is never published: only loops incident to the one\r
        // selected victim are retired from the actual source proposal below.\r
        topology := previous;\r
        for edge in 1:edgeCapacity loop\r
          if topology.edges[edge].enabled and topology.edges[edge].kind == 2 then\r
            topology.edges[edge] := EmptyEdge();\r
          end if;\r
        end for;\r
        (tier,children,referenced) := RetentionTiers(catalog,topology,sequential,loops,\r
          projectAfterEviction=false);\r
        (candidate,evictable) := RGBDKeyframes.ChooseVictim(catalog,tier);\r
        if evictable then\r
          for edge in 1:edgeCapacity loop\r
            if proposed.edges[edge].enabled and proposed.edges[edge].kind == 2\r
                and (proposed.edges[edge].referenceSlot == candidate\r
                  or proposed.edges[edge].currentSlot == candidate) then\r
              proposed.edges[edge] := EmptyEdge();\r
              retiredLoopFactors := retiredLoopFactors+1;\r
            end if;\r
          end for;\r
        end if;\r
      end if;\r
      if evictable then\r
        // No temporal measurement, covariance, identity, root marker or cap\r
        // changes here. Bridge and Capture still validate the actual removal.\r
        (tier,children,referenced) := RetentionTiers(catalog,proposed,sequential,loops,\r
          projectAfterEviction=false);\r
        accepted := (tier[candidate] == RGBDKeyframes.retentionFirst\r
            or tier[candidate] == RGBDKeyframes.retentionBridged)\r
          and ValidState(catalog,proposed);\r
        if accepted then slot := candidate; end if;\r
      end if;\r
      if not accepted then proposed := previous; retiredLoopFactors := 0; end if;\r
    end if;\r
  end PlanNodeCapacity;\r
\r
  function Bridge "Compose the consecutive edges through an evicted single-child keyframe"\r
    // First-order composition of parent->evicted and evicted->child into one\r
    // parent->child edge, ordered [translation; rotation] like PGEdge:\r
    //   R = R1*R2, t = t1+R1*t2,\r
    //   J1 = [I, -R1*skew(t2); 0, R2'], J2 = [R1, 0; 0, I],\r
    //   C = J1*C1*J1'+J2*C2*J2'.\r
    // The composed edge takes a fresh id and the child edge's storage slot;\r
    // the parent edge is left for the Bound sweep in Capture to remove. A loop\r
    // edge on the same pair is disabled (a kind-1 edge must carry the tree).\r
    // Without a parent edge, with no or several children, or on a singular\r
    // composition nothing changes, and ValidState then rejects the capture.\r
    input RGBDKeyframes.Catalog previousCatalog;\r
    input RGBDKeyframes.Catalog capturedCatalog;\r
    input State previous;\r
    output State result;\r
  protected\r
    Integer victim; Integer evicted; Integer parentEdge; Integer childEdge; Integer children;\r
    Real R1[dimension,dimension]; Real R2[dimension,dimension];\r
    Real t1[dimension]; Real t2[dimension];\r
    Real J1[poseDimension,poseDimension]; Real J2[poseDimension,poseDimension];\r
    Real C1[poseDimension,poseDimension]; Real C2[poseDimension,poseDimension];\r
    Real covariance[poseDimension,poseDimension]; Real information[poseDimension,poseDimension];\r
    Real pivot; Boolean valid; Edge composed; Integer promoted;\r
  algorithm\r
    result := previous; evicted := 0; parentEdge := 0; childEdge := 0; children := 0; promoted := 0;\r
    victim := previousCatalog.nextSlot;\r
    if victim >= 1 and victim <= nodeCapacity then\r
      if previousCatalog.occupied[victim] and not (capturedCatalog.occupied[victim]\r
        and capturedCatalog.ids[victim] == previousCatalog.ids[victim]) then\r
        evicted := previousCatalog.ids[victim];\r
      end if;\r
    end if;\r
    if evicted > 0 then\r
      for slot in 1:edgeCapacity loop\r
        if previous.edges[slot].enabled and Temporal(previous.edges[slot].kind) then\r
          if previous.edges[slot].currentId == evicted then parentEdge := slot; end if;\r
          if previous.edges[slot].referenceId == evicted then childEdge := slot; children := children+1; end if;\r
        end if;\r
      end for;\r
    end if;\r
    if parentEdge > 0 and children == 1 and previous.nextEdgeId < identifierLimit then\r
      R1 := previous.edges[parentEdge].rotation; t1 := previous.edges[parentEdge].translation;\r
      R2 := previous.edges[childEdge].rotation; t2 := previous.edges[childEdge].translation;\r
      J1 := zeros(poseDimension,poseDimension); J2 := zeros(poseDimension,poseDimension);\r
      J1[1:3,1:3] := identity(dimension); J1[1:3,4:6] := -R1*RGBDUncertaintySkew(t2);\r
      J1[4:6,4:6] := transpose(R2);\r
      J2[1:3,1:3] := R1; J2[4:6,4:6] := identity(dimension);\r
      C1 := previous.edges[parentEdge].covariance; C2 := previous.edges[childEdge].covariance;\r
      // The two edges share the evicted keyframe's image or filter epoch, so\r
      // their correlation is unknown: 2(A+B) bounds Cov(a+b) for any.\r
      covariance := 2.0*(J1*C1*transpose(J1)+J2*C2*transpose(J2));\r
      covariance := 0.5*(covariance+transpose(covariance));\r
      (information,valid,pivot) := RGBDUncertaintyInverse6(covariance,1e-10);\r
      if valid then\r
        information := 0.5*(information+transpose(information));\r
        valid := ValidUncertainty(covariance,information);\r
      end if;\r
      if valid then\r
        // Field by field: the exporter cannot copy a record array element.\r
        // Provenance: the weakest link decides (odometry if either part is).\r
        composed := EmptyEdge(); composed.enabled := true;\r
        composed.kind := if previous.edges[parentEdge].kind == 3 or previous.edges[childEdge].kind == 3 then 3 else 1;\r
        composed.id := previous.nextEdgeId;\r
        composed.referenceId := previous.edges[parentEdge].referenceId;\r
        composed.referenceSlot := previous.edges[parentEdge].referenceSlot;\r
        composed.referenceEpoch := previous.edges[parentEdge].referenceEpoch;\r
        composed.currentId := previous.edges[childEdge].currentId;\r
        composed.currentSlot := previous.edges[childEdge].currentSlot;\r
        composed.currentEpoch := previous.edges[childEdge].currentEpoch;\r
        composed.rotation := R1*R2; composed.translation := t1+R1*t2;\r
        composed.covariance := covariance; composed.information := information;\r
        promoted := 0;\r
        for slot in 1:edgeCapacity loop\r
          if previous.edges[slot].enabled and previous.edges[slot].kind == 2\r
            and previous.edges[slot].referenceId == composed.referenceId\r
            and previous.edges[slot].currentId == composed.currentId then\r
            // A verified loop on the pair outranks an odometry composite: it\r
            // becomes the visual tree edge. A visual composite keeps D2's rule.\r
            if composed.kind == 3 then promoted := slot; else result.edges[slot] := EmptyEdge(); end if;\r
          end if;\r
        end for;\r
        if promoted > 0 then\r
          result.edges[promoted].kind := 1; result.edges[childEdge] := EmptyEdge();\r
        else\r
          result.edges[childEdge] := composed;\r
          result.nextEdgeId := previous.nextEdgeId+1;\r
        end if;\r
      end if;\r
    end if;\r
  end Bridge;\r
\r
  record Update\r
    State state;\r
    Boolean accepted;\r
    Integer rejectionReason "1 idle; 2 catalog/config; 3 prior graph; 4 chain; 5 loop; 6 capacity/identity; 7 invariant; 8 anchor reference due for eviction; 9 restart root capacity";\r
    Integer removedEdges; Integer admittedSequential; Integer admittedLoops; Integer duplicateLoops;\r
    Integer admittedLoopAnchored;\r
    Integer admittedOdometry; Integer admittedRestart;\r
    Integer bridgeRefusalReason "OdometryEdge reason when a bridge was tried; 0 otherwise";\r
  end Update;\r
\r
  function Capture\r
    input RGBDKeyframes.Catalog previousCatalog;\r
    input RGBDKeyframes.Catalog capturedCatalog "Already admitted capture; immutable old payload is trusted";\r
    input State previous;\r
    input RGBDLoopVerification.Proposal sequential;\r
    input RGBDLoopVerification.Proposal loops[proposalCapacity];\r
    input Boolean requested;\r
    input Boolean reset = false;\r
    input Real inlierDistance = 0.08; input Real maximumRms = 0.03;\r
    output Update result;\r
    input Boolean calibratedResiduals = true;\r
    input Real maximumNormalizedSquared = 9.0;\r
    input Real localizationSigma = 0.5; input Real depthInflation = 1.0; input Real minimumPivot = 1e-10;\r
    input Real loopInlierDistance = inlierDistance;\r
    input Real loopMaximumRms = maximumRms;\r
    input Boolean loopCalibratedResiduals = calibratedResiduals;\r
    input Real loopMaximumNormalizedSquared = maximumNormalizedSquared;\r
  protected\r
    State working; Insertion insertion;\r
    Boolean valid; Integer reason; Integer removed; Integer sequentialCount; Integer loopCount; Integer duplicates;\r
    Boolean evictionRefused; Integer anchoredCount; Boolean sequentialValid; Boolean admit[proposalCapacity];\r
    Edge bridgeEdge; Integer bridgeReason; Integer odometryCount; Integer restartCount; Integer currentSlot;\r
  algorithm\r
    result.state := previous; result.accepted := false; result.rejectionReason := 1;\r
    result.removedEdges := 0; result.admittedSequential := 0; result.admittedLoops := 0; result.duplicateLoops := 0;\r
    result.admittedLoopAnchored := 0; result.admittedOdometry := 0; result.admittedRestart := 0; result.bridgeRefusalReason := 0;\r
    bridgeReason := 0; odometryCount := 0; restartCount := 0; currentSlot := 0;\r
    removed := 0; sequentialCount := 0; loopCount := 0; duplicates := 0; anchoredCount := 0; evictionRefused := false; sequentialValid := false;\r
    admit := fill(true,proposalCapacity);\r
    if requested then\r
      reason := 2;\r
      valid := RGBDKeyframes.ValidHeader(capturedCatalog) and capturedCatalog.nextId >= 2\r
        and inlierDistance > 0 and inlierDistance <= 10 and maximumRms >= 0 and maximumRms <= inlierDistance;\r
      if calibratedResiduals then\r
        valid := valid and maximumNormalizedSquared > 0 and maximumNormalizedSquared <= 1e6\r
          and localizationSigma > 0 and localizationSigma <= 10\r
          and depthInflation >= 1 and depthInflation <= 100 and minimumPivot > 0 and minimumPivot < 1;\r
      end if;\r
      if reset then\r
        // A deliberate new generation can recover a damaged old payload.\r
        valid := valid and previous.generation >= 1 and previous.generation < identifierLimit\r
          and capturedCatalog.generation > previous.generation and capturedCatalog.nextId == 2;\r
        working := Empty(capturedCatalog.generation);\r
      else\r
        working := previous;\r
        valid := valid and RGBDKeyframes.ValidHeader(previousCatalog)\r
          and previousCatalog.nextId < identifierLimit\r
          and capturedCatalog.generation == previousCatalog.generation\r
          and capturedCatalog.vocabularyVersion == previousCatalog.vocabularyVersion\r
          and capturedCatalog.nextId == previousCatalog.nextId+1\r
          and capturedCatalog.lastEpoch > previousCatalog.lastEpoch\r
          and (previousCatalog.nextId == 1 or capturedCatalog.lastTime > previousCatalog.lastTime);\r
        if valid then\r
          for node in 1:nodeCapacity loop\r
            if previousCatalog.occupied[node] and node <> previousCatalog.nextSlot then\r
              valid := valid and capturedCatalog.occupied[node]\r
                and capturedCatalog.ids[node] == previousCatalog.ids[node]\r
                and capturedCatalog.epochs[node] == previousCatalog.epochs[node]\r
                and capturedCatalog.imageTimes[node] == previousCatalog.imageTimes[node];\r
            end if;\r
          end for;\r
          if valid then reason := 3; valid := ValidState(previousCatalog,previous) and previous.revision < identifierLimit; end if;\r
        end if;\r
      end if;\r
      if valid then\r
        // Keep the consecutive tree connected across the retention eviction.\r
        if not reset then working := Bridge(previousCatalog,capturedCatalog,working); end if;\r
        for slot in 1:edgeCapacity loop\r
          if working.edges[slot].enabled then\r
            if not Bound(capturedCatalog,working.edges[slot].referenceId,working.edges[slot].referenceSlot,working.edges[slot].referenceEpoch)\r
              or not Bound(capturedCatalog,working.edges[slot].currentId,working.edges[slot].currentSlot,working.edges[slot].currentEpoch) then\r
              working.edges[slot] := EmptyEdge(); removed := removed+1;\r
            end if;\r
          end if;\r
        end for;\r
        // Markers follow their keyframe: an evicted or reused slot loses it.\r
        for slot in 1:nodeCapacity loop\r
          if working.parentless[slot] > 0 and not (capturedCatalog.occupied[slot]\r
              and capturedCatalog.ids[slot] == working.parentless[slot]) then\r
            working.parentless[slot] := 0; working.parentlessKind[slot] := 0;\r
          end if;\r
        end for;\r
        currentSlot := RGBDKeyframes.SlotOf(capturedCatalog,capturedCatalog.nextId-1);\r
        reason := 4;\r
        if not reset and previousCatalog.nextId > 1 then\r
          valid := sequential.referenceId == previousCatalog.nextId-1\r
            and ValidProposal(capturedCatalog,sequential,inlierDistance,maximumRms,\r
              calibratedResiduals=calibratedResiduals,maximumNormalizedSquared=maximumNormalizedSquared,\r
              localizationSigma=localizationSigma,depthInflation=depthInflation,minimumPivot=minimumPivot);\r
          sequentialValid := valid;\r
          if valid then\r
            insertion := Insert(working,capturedCatalog,sequential,1); working := insertion.state;\r
            valid := insertion.accepted and not insertion.duplicate;\r
            removed := removed+insertion.replacedLoops; sequentialCount := if valid then 1 else 0;\r
            if not valid then reason := 6; end if;\r
          end if;\r
          // A separate branch: this exporter rejects a function call under elseif.\r
          if loopAnchoredCapture and not sequentialValid then\r
            (valid,evictionRefused,admit) := AnchorAdmissible(capturedCatalog,working,loops,loopInlierDistance,loopMaximumRms,\r
              loopCalibratedResiduals,loopMaximumNormalizedSquared,localizationSigma,depthInflation,minimumPivot);\r
            anchoredCount := if valid then 1 else 0;\r
            if evictionRefused then reason := 8; end if;\r
            if valid and currentSlot >= 1 then\r
              working.parentless[currentSlot] := capturedCatalog.nextId-1; working.parentlessKind[currentSlot] := 2;\r
            end if;\r
          end if;\r
          // Odometry bridge, then restart. Only consensus (7) or the\r
          // pose screen (11) may fall back; every other refusal stands.\r
          if odometryBridge and loopAnchoredCapture and not sequentialValid and not valid and not evictionRefused\r
            and (sequential.rejectionReason == 7 or sequential.rejectionReason == 11) and currentSlot >= 1 then\r
            (bridgeEdge,bridgeReason) := OdometryEdge(capturedCatalog,previousCatalog.nextId-1,capturedCatalog.nextId-1);\r
            if bridgeReason == 0 then\r
              insertion := InsertEdge(working,bridgeEdge); working := insertion.state;\r
              valid := insertion.accepted and not insertion.duplicate;\r
              removed := removed+insertion.replacedLoops; odometryCount := if valid then 1 else 0;\r
              if not valid then reason := 6; end if;\r
              admit := fill(true,proposalCapacity);\r
            elseif bridgeReason >= 1 and bridgeReason <= 3\r
              and capturedCatalog.lastTime-previousCatalog.lastTime >= restartGap then\r
              if RestartRoots(working) < rootCapacity then\r
                working.parentless[currentSlot] := capturedCatalog.nextId-1; working.parentlessKind[currentSlot] := 1;\r
                valid := true; restartCount := 1; admit := fill(true,proposalCapacity);\r
              else reason := 9;\r
              end if;\r
            end if;\r
          end if;\r
        else valid := not sequential.verified;\r
        end if;\r
        for rank in 1:proposalCapacity loop\r
          if valid and loops[rank].verified and admit[rank] then\r
            reason := 5; valid := ValidProposal(capturedCatalog,loops[rank],loopInlierDistance,loopMaximumRms,\r
              calibratedResiduals=loopCalibratedResiduals,maximumNormalizedSquared=loopMaximumNormalizedSquared,\r
              localizationSigma=localizationSigma,depthInflation=depthInflation,minimumPivot=minimumPivot);\r
            if valid then\r
              insertion := Insert(working,capturedCatalog,loops[rank],2); working := insertion.state; valid := insertion.accepted;\r
              removed := removed+insertion.replacedLoops;\r
              duplicates := duplicates+(if insertion.duplicate then 1 else 0);\r
              loopCount := loopCount+(if insertion.accepted and not insertion.duplicate then 1 else 0);\r
              if not valid then reason := 6; end if;\r
            end if;\r
          end if;\r
        end for;\r
        if valid then\r
          working.lastCaptureId := capturedCatalog.nextId-1;\r
          working.revision := if reset then 1 else previous.revision+1;\r
          reason := 7; valid := ValidState(capturedCatalog,working);\r
        end if;\r
        if valid then\r
          result.state := working; result.accepted := true; result.rejectionReason := 0;\r
          result.removedEdges := removed; result.admittedSequential := sequentialCount;\r
          result.admittedLoops := loopCount; result.duplicateLoops := duplicates;\r
          result.admittedLoopAnchored := anchoredCount;\r
          result.admittedOdometry := odometryCount; result.admittedRestart := restartCount;\r
          result.bridgeRefusalReason := bridgeReason;\r
        else result.rejectionReason := reason;\r
        end if;\r
      else result.rejectionReason := reason;\r
      end if;\r
    end if;\r
  end Capture;\r
\r
  record Problem\r
    Boolean accepted;\r
    Integer nodeCount; Integer edgeCount; Integer correlationInflation;\r
    Integer detachedNodes "Stored keyframes cut off from the newest one, out of the solve";\r
    Integer nodeId[nodeCapacity]; Integer catalogSlot[nodeCapacity];\r
    Real nodeMask[nodeCapacity]; Real positions[nodeCapacity,dimension];\r
    Real rotations[nodeCapacity,dimension,dimension];\r
    Real edgeMask[edgeCapacity]; Real fromNode[edgeCapacity]; Real toNode[edgeCapacity];\r
    Real measuredRotation[edgeCapacity,dimension,dimension]; Real measuredTranslation[edgeCapacity,dimension];\r
    Real information[edgeCapacity,poseDimension,poseDimension];\r
  end Problem;\r
\r
  function EmptyProblem\r
    output Problem result;\r
  algorithm\r
    result.accepted := false; result.nodeCount := 0; result.edgeCount := 0; result.correlationInflation := 1;\r
    result.detachedNodes := 0;\r
    result.nodeId := fill(0,nodeCapacity); result.catalogSlot := fill(0,nodeCapacity);\r
    result.nodeMask := zeros(nodeCapacity); result.positions := zeros(nodeCapacity,dimension);\r
    result.edgeMask := zeros(edgeCapacity); result.fromNode := zeros(edgeCapacity); result.toNode := zeros(edgeCapacity);\r
    result.measuredTranslation := zeros(edgeCapacity,dimension); result.information := zeros(edgeCapacity,poseDimension,poseDimension);\r
    for node in 1:nodeCapacity loop result.rotations[node,:,:] := identity(dimension); end for;\r
    for edge in 1:edgeCapacity loop result.measuredRotation[edge,:,:] := identity(dimension); end for;\r
  end EmptyProblem;\r
\r
  function PrepareProblem\r
    input RGBDKeyframes.Catalog catalog;\r
    input State state;\r
    input Boolean requested = true;\r
    output Problem result;\r
  protected\r
    Integer slot; Boolean valid; Integer order[nodeCapacity]; Integer count;\r
    Boolean reach[nodeCapacity]; Integer row[nodeCapacity]; Boolean active[edgeCapacity];\r
  algorithm\r
    result := EmptyProblem(); valid := false; order := fill(0,nodeCapacity); count := 0;\r
    row := fill(0,nodeCapacity);\r
    if requested then valid := ValidState(catalog,state) and catalog.nextId > 1; end if;\r
    if valid then\r
      // Rows follow ascending id; retained ids need not be contiguous.\r
      (order,count) := RGBDKeyframes.IdOrder(catalog);\r
      for node in 1:nodeCapacity loop\r
        if catalog.occupied[node] then\r
          valid := valid and RGBDUncertaintyProper(catalog.bodyRotations[node,:,:]);\r
          for axis in 1:dimension loop valid := valid and abs(catalog.bodyPositions[node,axis]) <= 1e6; end for;\r
        end if;\r
      end for;\r
    end if;\r
    if valid and loopAnchoredCapture then\r
      // Rows follow id order within the newest keyframe's component, so\r
      // row 1, the exact gauge, is its oldest node. Detached nodes and the\r
      // edges among them stay stored and leave the solve.\r
      reach := Reachable(catalog,state,catalog.nextId-1,visualOnly=true);\r
      // Rows fill in id order; filling row node after node at a fixed range\r
      // keeps every index a translation-time loop variable.\r
      for node in 1:nodeCapacity loop\r
        if node <= count then\r
          slot := order[node];\r
          if reach[slot] then\r
            result.nodeCount := result.nodeCount+1; row[slot] := result.nodeCount;\r
          else\r
            result.detachedNodes := result.detachedNodes+1;\r
          end if;\r
        end if;\r
      end for;\r
      for node in 1:nodeCapacity loop\r
        if node <= result.nodeCount then\r
          // Row node holds the node-th reachable id.\r
          slot := 0;\r
          for other in 1:nodeCapacity loop\r
            if row[other] == node then slot := other; end if;\r
          end for;\r
          result.nodeId[node] := catalog.ids[slot]; result.catalogSlot[node] := slot;\r
          result.nodeMask[node] := 1.0;\r
          result.positions[node,:] := catalog.bodyPositions[slot,:];\r
          result.rotations[node,:,:] := catalog.bodyRotations[slot,:,:];\r
        end if;\r
      end for;\r
      // ValidState bound every enabled edge's slots; a disabled edge's are\r
      // never read.\r
      active := fill(false,edgeCapacity);\r
      for edge in 1:edgeCapacity loop\r
        if state.edges[edge].enabled and Visual(state.edges[edge].kind) then\r
          active[edge] := reach[state.edges[edge].referenceSlot];\r
        end if;\r
        result.edgeCount := result.edgeCount+(if active[edge] then 1 else 0);\r
      end for;\r
      result.correlationInflation := max(1,result.edgeCount);\r
      for edge in 1:edgeCapacity loop\r
        if active[edge] then\r
          result.edgeMask[edge] := 1.0;\r
          result.fromNode[edge] := row[state.edges[edge].referenceSlot];\r
          result.toNode[edge] := row[state.edges[edge].currentSlot];\r
          result.measuredRotation[edge,:,:] := state.edges[edge].rotation;\r
          result.measuredTranslation[edge,:] := state.edges[edge].translation;\r
          result.information[edge,:,:] := state.edges[edge].information/result.correlationInflation;\r
        end if;\r
      end for;\r
      result.accepted := true;\r
    end if;\r
    if valid and not loopAnchoredCapture then\r
      result.nodeCount := count;\r
      // A fixed range keeps the loop bounded when the flag folds this branch away.\r
      for node in 1:nodeCapacity loop\r
        if node <= result.nodeCount then\r
          slot := order[node]; row[slot] := node;\r
          result.nodeId[node] := catalog.ids[slot]; result.catalogSlot[node] := slot; result.nodeMask[node] := 1.0;\r
          result.positions[node,:] := catalog.bodyPositions[slot,:]; result.rotations[node,:,:] := catalog.bodyRotations[slot,:,:];\r
        end if;\r
      end for;\r
      for edge in 1:edgeCapacity loop\r
        result.edgeCount := result.edgeCount+(if state.edges[edge].enabled and Visual(state.edges[edge].kind) then 1 else 0);\r
      end for;\r
      // No edge independence is presumed. For E arbitrarily correlated\r
      // errors with bounded marginal covariance R_e, C <= E*diag(R_e).\r
      // This changes the information scale, never the stored measurement.\r
      // It does not establish independence from the inertial/filter prior.\r
      result.correlationInflation := max(1,result.edgeCount);\r
      for edge in 1:edgeCapacity loop\r
        if state.edges[edge].enabled and Visual(state.edges[edge].kind) then\r
          result.edgeMask[edge] := 1.0;\r
          result.fromNode[edge] := row[state.edges[edge].referenceSlot];\r
          result.toNode[edge] := row[state.edges[edge].currentSlot];\r
          result.measuredRotation[edge,:,:] := state.edges[edge].rotation;\r
          result.measuredTranslation[edge,:] := state.edges[edge].translation;\r
          result.information[edge,:,:] := state.edges[edge].information/result.correlationInflation;\r
        end if;\r
      end for;\r
      result.accepted := true;\r
    end if;\r
  end PrepareProblem;\r
end RGBDGraphMeasurements;\r
`;export{e as default};
