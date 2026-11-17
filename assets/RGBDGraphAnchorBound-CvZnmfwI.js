const n=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Local first-order ERROR SECOND-MOMENT bound about a graph anchor mean.\r
// Raw capture means/bounds stay immutable; changing gauge never creates a zero\r
// absolute bound. Input capture covariance is assumed a valid local error bound.\r
package RGBDGraphAnchorBound\r
\r
  constant Integer dimension = RGBDKeyframes.dimension;\r
  constant Integer poseDimension = RGBDKeyframes.poseDimension;\r
  constant Integer capacity = RGBDKeyframes.keyframeCapacity;\r
  constant Integer identifierLimit = RGBDKeyframes.identifierLimit;\r
\r
  record Binding\r
    Integer generation; Integer sourceRevision; Integer id; Integer slot;\r
    Integer epoch; Integer sequence; Integer catalogPoseRevision; Integer provenance;\r
    Real imageTime;\r
  end Binding;\r
  record Estimate\r
    Binding binding;\r
    Real position[dimension]; Real rotation[dimension,dimension];\r
    Real bound[poseDimension,poseDimension];\r
  end Estimate;\r
\r
  function Empty\r
    input Integer generation; input Integer sourceRevision;\r
    output Estimate result;\r
  algorithm\r
    result.binding.generation := generation; result.binding.sourceRevision := sourceRevision;\r
    result.binding.id := 0; result.binding.slot := 0; result.binding.epoch := -1;\r
    result.binding.sequence := 0; result.binding.catalogPoseRevision := 0;\r
    result.binding.provenance := 0; result.binding.imageTime := 0;\r
    result.position := zeros(dimension); result.rotation := identity(dimension);\r
    result.bound := zeros(poseDimension,poseDimension);\r
  end Empty;\r
\r
  function FromCapture\r
    input Estimate previous;\r
    input RGBDKeyframes.Catalog catalog;\r
    input RGBDGraphCaptureLedger.State ledger;\r
    input Integer sourceRevision; input Integer step; input Integer catalogPoseRevision;\r
    input Real anchorPosition[dimension]; input Real anchorRotation[dimension,dimension];\r
    input Integer provenance;\r
    input Real weight = 0.5;\r
    input Real maximumPositionShift = 5.0; input Real maximumAngleShift = 0.35;\r
    input Boolean requested = true;\r
    input Integer gaugeId = 0 "Loop-anchored capture: the solve's gauge id when it is not the oldest stored";\r
    output Estimate result; output Boolean accepted; output Integer reason;\r
  protected\r
    Boolean valid; Boolean chartValid; Boolean unchanged;\r
    Integer id; Integer slot;\r
    Real offset[poseDimension]; Real J[poseDimension,poseDimension];\r
    Real attitudeOffset[dimension]; Real angleJacobian[dimension,dimension];\r
    Real captureBound[poseDimension,poseDimension]; Real candidate[poseDimension,poseDimension];\r
  algorithm\r
    result := previous; accepted := false; reason := 1;\r
    if requested then\r
      reason := 2;\r
      valid := RGBDGraphCaptureLedger.Valid(ledger,catalog,sourceRevision,step)\r
        and catalog.nextId > 1\r
        and catalogPoseRevision >= 0 and catalogPoseRevision < identifierLimit\r
        and provenance >= 1 and provenance <= identifierLimit;\r
      id := 1; slot := 1; unchanged := false;\r
      if valid then\r
        id := RGBDKeyframes.OldestId(catalog);\r
        if gaugeId > 0 then id := gaugeId; end if;\r
        slot := max(1,RGBDKeyframes.SlotOf(catalog,id));\r
        valid := catalog.occupied[slot] and catalog.ids[slot] == id;\r
      end if;\r
      if valid then\r
        reason := 3;\r
        valid := weight > 0 and weight < 1\r
          and maximumPositionShift > 0 and maximumPositionShift <= 100\r
          and maximumAngleShift > 0 and maximumAngleShift <= 0.35;\r
      end if;\r
      if valid then\r
        reason := 4;\r
        valid := RGBDUncertaintyProper(anchorRotation)\r
          and RGBDUncertaintyProper(catalog.bodyRotations[slot,:,:]);\r
        unchanged := true;\r
        for axis in 1:dimension loop\r
          valid := valid and abs(anchorPosition[axis]) <= 1e6\r
            and abs(catalog.bodyPositions[slot,axis]) <= 1e6;\r
          unchanged := unchanged and anchorPosition[axis] == catalog.bodyPositions[slot,axis];\r
          for column in 1:dimension loop\r
            unchanged := unchanged and anchorRotation[axis,column] == catalog.bodyRotations[slot,axis,column];\r
          end for;\r
        end for;\r
        captureBound := catalog.poseCovariances[slot,:,:];\r
        valid := valid and SLAMCovariancePSDCheck(captureBound,1e-12) == 1;\r
      end if;\r
      if valid then\r
        candidate := captureBound;\r
        if not unchanged then\r
          reason := 5;\r
          offset := zeros(poseDimension);\r
          offset[1:dimension] := catalog.bodyPositions[slot,:]-anchorPosition;\r
          (attitudeOffset,chartValid) := SchmidtGraphPoseCorrection.Log(\r
            transpose(anchorRotation)*catalog.bodyRotations[slot,:,:]);\r
          valid := chartValid and sqrt(offset[1:dimension]*offset[1:dimension]) <= maximumPositionShift\r
            and sqrt(attitudeOffset*attitudeOffset) <= maximumAngleShift;\r
          if valid then\r
            offset[dimension+1:poseDimension] := attitudeOffset;\r
            J := identity(poseDimension);\r
            angleJacobian := SchmidtGraphPoseCorrection.InverseJacobian(attitudeOffset,true);\r
            J[dimension+1:poseDimension,dimension+1:poseDimension] := angleJacobian;\r
            // If e_new = offset+J*e_capture to first order and E[e e']<=P,\r
            // weighted Young bounds its SECOND MOMENT even for unknown mean.\r
            candidate := J*captureBound*transpose(J)/weight\r
              +outerProduct(offset,offset)/(1-weight);\r
          end if;\r
        end if;\r
        if valid then\r
          reason := 6; valid := SLAMCovariancePSDCheck(candidate,1e-12) == 1;\r
          if valid then\r
            result.binding.generation := catalog.generation;\r
            result.binding.sourceRevision := sourceRevision; result.binding.id := id; result.binding.slot := slot;\r
            result.binding.epoch := catalog.epochs[slot]; result.binding.sequence := ledger.sequences[slot];\r
            result.binding.catalogPoseRevision := catalogPoseRevision;\r
            result.binding.provenance := provenance; result.binding.imageTime := catalog.imageTimes[slot];\r
            result.position := anchorPosition; result.rotation := anchorRotation; result.bound := candidate;\r
            accepted := true; reason := 0;\r
          end if;\r
        end if;\r
      end if;\r
    end if;\r
  end FromCapture;\r
end RGBDGraphAnchorBound;\r
`;export{n as default};
