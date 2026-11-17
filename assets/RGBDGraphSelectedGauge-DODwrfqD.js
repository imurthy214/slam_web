const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Numerical first-order adapter. ContextFromLedger binds capture identities to\r
// their durable owner; anchor-bound provenance remains an explicit input.\r
package RGBDGraphSelectedGauge\r
\r
  constant Integer nodeCapacity = RGBDKeyframes.keyframeCapacity;\r
  constant Integer edgeCapacity = RGBDGraphMeasurements.edgeCapacity;\r
  constant Integer identifierLimit = RGBDKeyframes.identifierLimit;\r
\r
  record Context\r
    Integer generation; Integer sourceRevision; Integer graphRevision; Integer catalogPoseRevision;\r
    Integer captureIds[nodeCapacity];\r
    Integer captureSequences[nodeCapacity] "Accepted processing-step birth, indexed by catalog slot";\r
  end Context;\r
\r
  record Result\r
    GraphGaugeUncertainty.Estimate estimate;\r
    Boolean accepted;\r
    Integer rejectionReason "0 accepted;1 idle;2 context/graph/ledger;3 selection/binding;4 final pose/anchor;5 covariance;6 transport;7 typed anchor binding/mean";\r
    Integer covarianceStatus; Integer transportReason;\r
    Boolean roundoffCertified;\r
  end Result;\r
\r
  function ContextFromLedger\r
    input Context previous;\r
    input RGBDGraphCaptureLedger.State ledger;\r
    input RGBDKeyframes.Catalog catalog;\r
    input RGBDGraphMeasurements.State graph;\r
    input Integer sourceRevision; input Integer step; input Integer catalogPoseRevision;\r
    input Boolean requested = true;\r
    output Context context; output Boolean accepted; output Integer reason;\r
  protected Boolean valid;\r
  algorithm\r
    context := previous; accepted := false; reason := 1;\r
    if requested then\r
      reason := 2;\r
      valid := RGBDGraphCaptureLedger.Valid(ledger,catalog,sourceRevision,step);\r
      if valid then\r
        reason := 3;\r
        valid := graph.generation == catalog.generation\r
          and graph.revision > 0 and graph.revision <= identifierLimit\r
          and catalogPoseRevision >= 0 and catalogPoseRevision < identifierLimit;\r
      end if;\r
      if valid then\r
        context.generation := catalog.generation; context.sourceRevision := sourceRevision;\r
        context.graphRevision := graph.revision; context.catalogPoseRevision := catalogPoseRevision;\r
        context.captureIds := ledger.ids; context.captureSequences := ledger.sequences;\r
        accepted := true; reason := 0;\r
      end if;\r
    end if;\r
  end ContextFromLedger;\r
\r
  function SelectFromAnchor\r
    input GraphGaugeUncertainty.Estimate previous;\r
    input RGBDKeyframes.Catalog catalog;\r
    input RGBDGraphMeasurements.State graph;\r
    input Context context;\r
    input Real finalPositionsBySlot[nodeCapacity,3]; input Real finalRotationsBySlot[nodeCapacity,3,3];\r
    input Integer currentNode; input Integer referenceNode;\r
    input GraphGaugeUncertainty.Binding binding;\r
    input RGBDGraphAnchorBound.Estimate anchor;\r
    input Integer factorProvenance; input Real beta; input Boolean requested = true;\r
    input Integer maximumPCG = 48; input Real tolerance = 1e-10;\r
    output Result result;\r
  protected Boolean valid; Integer id; Integer slot;\r
  algorithm\r
    result.estimate := previous; result.accepted := false; result.rejectionReason := 1;\r
    result.covarianceStatus := 0; result.transportReason := 0; result.roundoffCertified := false;\r
    if requested then\r
      result.rejectionReason := 7;\r
      valid := RGBDKeyframes.ValidHeader(catalog) and catalog.nextId > 1\r
        and GraphGaugeUncertainty.ValidBinding(binding);\r
      if valid then\r
        id := RGBDKeyframes.OldestId(catalog);\r
        if RGBDGraphMeasurements.loopAnchoredCapture then\r
          id := RGBDGraphMeasurements.ActiveOldest(catalog,graph);\r
        end if;\r
        slot := max(1,RGBDKeyframes.SlotOf(catalog,id));\r
        valid := anchor.binding.generation == catalog.generation\r
          and anchor.binding.generation == context.generation and anchor.binding.generation == binding.generation\r
          and anchor.binding.sourceRevision == context.sourceRevision and anchor.binding.sourceRevision == binding.sourceRevision\r
          and anchor.binding.id == id and anchor.binding.id == binding.anchorId\r
          and anchor.binding.slot == slot and catalog.occupied[slot] and catalog.ids[slot] == id\r
          and context.captureIds[slot] == id\r
          and anchor.binding.epoch == catalog.epochs[slot] and anchor.binding.epoch == binding.anchorEpoch\r
          and anchor.binding.sequence == context.captureSequences[slot]\r
          and anchor.binding.sequence == binding.anchorCaptureSequence\r
          and anchor.binding.catalogPoseRevision == context.catalogPoseRevision\r
          and anchor.binding.catalogPoseRevision == binding.catalogPoseRevision\r
          and anchor.binding.imageTime == catalog.imageTimes[slot] and anchor.binding.imageTime == binding.anchorTime\r
          and anchor.binding.provenance >= 1 and anchor.binding.provenance <= identifierLimit\r
          and anchor.binding.provenance == binding.anchorBoundProvenance\r
          and max(abs(anchor.position-finalPositionsBySlot[slot,:])) == 0\r
          and max(abs(anchor.rotation-finalRotationsBySlot[slot,:,:])) == 0;\r
      end if;\r
      if valid then\r
        // The typed owner supplies a local ERROR SECOND-MOMENT bound about\r
        // this exact mean; it is not a centered/global covariance certificate.\r
        result := SelectAndTransport(previous,catalog,graph,context,finalPositionsBySlot,finalRotationsBySlot,\r
          currentNode,referenceNode,binding,anchor.position,anchor.rotation,anchor.bound,\r
          anchor.binding.provenance,factorProvenance,beta,true,maximumPCG,tolerance);\r
      end if;\r
    end if;\r
  end SelectFromAnchor;\r
\r
  function SelectAndTransport\r
    input GraphGaugeUncertainty.Estimate previous;\r
    input RGBDKeyframes.Catalog catalog;\r
    input RGBDGraphMeasurements.State graph;\r
    input Context context;\r
    input Real finalPositionsBySlot[nodeCapacity,3];\r
    input Real finalRotationsBySlot[nodeCapacity,3,3];\r
    input Integer currentNode; input Integer referenceNode;\r
    input GraphGaugeUncertainty.Binding binding;\r
    input Real anchorPosition[3]; input Real anchorRotation[3,3]; input Real anchorBound[6,6];\r
    input Integer anchorBoundProvenance; input Integer factorProvenance;\r
    input Real beta; input Boolean requested = true;\r
    input Integer maximumPCG = 48; input Real tolerance = 1e-10;\r
    output Result result;\r
  protected\r
    RGBDGraphMeasurements.Problem problem;\r
    ModelicaPoseGraphCovariance.Result selected;\r
    GraphGaugeUncertainty.Binding expected;\r
    GraphGaugeUncertainty.Estimate transported;\r
    Boolean valid; Boolean transportAccepted;\r
    Integer slot; Integer previousSequence; Integer anchorSlot; Integer currentSlot; Integer referenceSlot;\r
    Integer nodes[2]; Integer offset;\r
    Real relativePositions[2,3]; Real relativeRotations[2,3,3];\r
    Real D[12,12]; Real relativeBound[12,12];\r
  algorithm\r
    result.estimate := previous; result.accepted := false; result.rejectionReason := 1;\r
    result.covarianceStatus := 0; result.transportReason := 0; result.roundoffCertified := false;\r
    if requested then\r
      result.rejectionReason := 2;\r
      valid := RGBDKeyframes.ValidHeader(catalog)\r
        and context.generation == catalog.generation and graph.generation == catalog.generation\r
        and context.sourceRevision >= 1 and context.sourceRevision <= identifierLimit\r
        and context.graphRevision == graph.revision and graph.revision > 0\r
        and context.catalogPoseRevision >= 0 and context.catalogPoseRevision < identifierLimit\r
        and anchorBoundProvenance > 0 and anchorBoundProvenance <= identifierLimit\r
        and factorProvenance > 0 and factorProvenance <= identifierLimit;\r
      if valid then\r
        // Prepare the actual graph once; no caller-constructed Problem can\r
        // substitute endpoints, information scale or a different factor set.\r
        problem := RGBDGraphMeasurements.PrepareProblem(catalog,graph,true);\r
        valid := problem.accepted;\r
      end if;\r
      if valid then\r
        previousSequence := 0;\r
        for node in 1:nodeCapacity loop\r
          if node <= problem.nodeCount then\r
            slot := problem.catalogSlot[node];\r
            valid := valid and context.captureIds[slot] == problem.nodeId[node]\r
              and context.captureSequences[slot] > previousSequence\r
              and context.captureSequences[slot] <= identifierLimit;\r
            previousSequence := context.captureSequences[slot];\r
          end if;\r
        end for;\r
      end if;\r
      if valid then\r
        result.rejectionReason := 3;\r
        valid := currentNode >= 1 and currentNode <= problem.nodeCount\r
          and referenceNode >= 1 and referenceNode <= problem.nodeCount\r
          and (currentNode <> referenceNode or GraphGaugeUncertainty.SameCapture(binding));\r
        if valid then\r
          anchorSlot := problem.catalogSlot[1]; currentSlot := problem.catalogSlot[currentNode];\r
          referenceSlot := problem.catalogSlot[referenceNode];\r
          expected.generation := catalog.generation; expected.sourceRevision := context.sourceRevision;\r
          expected.graphRevision := graph.revision; expected.catalogPoseRevision := context.catalogPoseRevision;\r
          expected.anchorId := problem.nodeId[1]; expected.anchorEpoch := catalog.epochs[anchorSlot];\r
          expected.anchorTime := catalog.imageTimes[anchorSlot];\r
          expected.anchorCaptureSequence := context.captureSequences[anchorSlot];\r
          expected.currentId := problem.nodeId[currentNode]; expected.currentEpoch := catalog.epochs[currentSlot];\r
          expected.currentTime := catalog.imageTimes[currentSlot];\r
          expected.currentCaptureSequence := context.captureSequences[currentSlot];\r
          expected.referenceId := problem.nodeId[referenceNode]; expected.referenceEpoch := catalog.epochs[referenceSlot];\r
          expected.referenceTime := catalog.imageTimes[referenceSlot];\r
          expected.referenceCaptureSequence := context.captureSequences[referenceSlot];\r
          expected.chart := GraphGaugeUncertainty.chartENUPositionRightLocalAttitude;\r
          expected.factorProvenance := factorProvenance; expected.anchorBoundProvenance := anchorBoundProvenance;\r
          valid := GraphGaugeUncertainty.ValidBinding(expected) and GraphGaugeUncertainty.SameBinding(binding,expected);\r
        end if;\r
      end if;\r
      if valid then\r
        result.rejectionReason := 4;\r
        for node in 1:nodeCapacity loop\r
          if node <= problem.nodeCount then\r
            slot := problem.catalogSlot[node];\r
            valid := valid and RGBDUncertaintyProper(finalRotationsBySlot[slot,:,:]);\r
            for axis in 1:3 loop valid := valid and abs(finalPositionsBySlot[slot,axis]) <= 1e6; end for;\r
            problem.positions[node,:] := finalPositionsBySlot[slot,:];\r
            problem.rotations[node,:,:] := finalRotationsBySlot[slot,:,:];\r
          end if;\r
        end for;\r
        valid := valid and max(abs(anchorPosition-problem.positions[1,:])) == 0\r
          and max(abs(anchorRotation-problem.rotations[1,:,:])) == 0;\r
      end if;\r
      if valid then\r
        result.rejectionReason := 5;\r
        selected := ModelicaPoseGraphCovariance.Select(problem.positions,problem.rotations,problem.nodeMask,\r
          problem.edgeMask,problem.fromNode,problem.toNode,problem.measuredTranslation,problem.measuredRotation,\r
          problem.information,currentNode,referenceNode,maximumPCG,tolerance,true);\r
        result.covarianceStatus := selected.status;\r
        valid := selected.accepted;\r
      end if;\r
      if valid then\r
        nodes := {currentNode,referenceNode}; D := zeros(12,12);\r
        for node in 1:2 loop\r
          offset := 6*(node-1);\r
          // The gauge endpoint is an exact identity/zero, including the\r
          // selected solver's exact-zero covariance rows and columns.\r
          if nodes[node] == 1 then\r
            relativePositions[node,:] := zeros(3); relativeRotations[node,:,:] := identity(3);\r
          else\r
            relativePositions[node,:] := transpose(anchorRotation)*(problem.positions[nodes[node],:]-anchorPosition);\r
            relativeRotations[node,:,:] := transpose(anchorRotation)*problem.rotations[nodes[node],:,:];\r
          end if;\r
          for row in 1:3 loop for column in 1:3 loop\r
            D[offset+row,offset+column] := anchorRotation[column,row];\r
            D[offset+row+3,offset+column+3] := if row == column then 1 else 0;\r
          end for; end for;\r
        end for;\r
        // Rotate every position-position, position-angle and cross-pose cell.\r
        relativeBound := D*selected.upper*transpose(D);\r
        result.rejectionReason := 6;\r
        (transported,transportAccepted,result.transportReason) := GraphGaugeUncertainty.Transport(\r
          previous,binding,expected,anchorPosition,anchorRotation,anchorBound,\r
          relativePositions,relativeRotations,relativeBound,beta,true);\r
        if transportAccepted then\r
          result.estimate := transported; result.accepted := true; result.rejectionReason := 0;\r
          result.roundoffCertified := selected.roundoffCertified;\r
        end if;\r
      end if;\r
    end if;\r
  end SelectAndTransport;\r
end RGBDGraphSelectedGauge;\r
`;export{e as default};
