const n=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Conditional first-order bound transport, not graph covariance certification.\r
// ENU additive position and body right-local attitude; selected order p,theta,p,theta.\r
// Anchor/relative cross-correlation is UNKNOWN, never silently set to zero.\r
// sourceRevision is a positive session identity token, not a verified hash here.\r
// Positive provenance tokens assert caller-provided bounds; they certify nothing.\r
package GraphGaugeUncertainty\r
\r
  constant Integer chartENUPositionRightLocalAttitude = 1;\r
  constant Integer selectedDimension = 12;\r
  constant Integer anchorDimension = 6;\r
  record Binding\r
    Integer generation; Integer graphRevision; Integer catalogPoseRevision;\r
    Integer anchorId; Integer anchorEpoch; Integer anchorCaptureSequence;\r
    Integer currentId; Integer currentEpoch; Integer currentCaptureSequence; Integer referenceId; Integer referenceEpoch;\r
    Integer referenceCaptureSequence; Integer chart;\r
    Real anchorTime; Real currentTime; Real referenceTime;\r
    Integer sourceRevision; Integer factorProvenance; Integer anchorBoundProvenance;\r
  end Binding;\r
  record Estimate\r
    Binding binding;\r
    Real positions[2,3]; Real rotations[2,3,3]; Real covariance[12,12];\r
  end Estimate;\r
  function SameBinding\r
    input Binding a; input Binding b; output Boolean same;\r
  algorithm\r
    same := a.generation == b.generation and a.graphRevision == b.graphRevision\r
      and a.catalogPoseRevision == b.catalogPoseRevision and a.anchorId == b.anchorId\r
      and a.anchorEpoch == b.anchorEpoch and a.anchorCaptureSequence == b.anchorCaptureSequence\r
      and a.currentId == b.currentId and a.currentEpoch == b.currentEpoch and a.currentCaptureSequence == b.currentCaptureSequence\r
      and a.referenceId == b.referenceId and a.referenceEpoch == b.referenceEpoch\r
      and a.referenceCaptureSequence == b.referenceCaptureSequence and a.chart == b.chart\r
      and a.anchorTime == b.anchorTime and a.currentTime == b.currentTime and a.referenceTime == b.referenceTime\r
      and a.sourceRevision == b.sourceRevision and a.factorProvenance == b.factorProvenance\r
      and a.anchorBoundProvenance == b.anchorBoundProvenance;\r
  end SameBinding;\r
  // A repeated selected ID is one random pose, never two observations.\r
  function SameCapture\r
    input Binding b; output Boolean same;\r
  algorithm\r
    same := b.currentId == b.referenceId and b.currentEpoch == b.referenceEpoch\r
      and b.currentTime == b.referenceTime and b.currentCaptureSequence == b.referenceCaptureSequence;\r
  end SameCapture;\r
  function CloneEstimate\r
    input Estimate estimate; output Boolean valid;\r
  algorithm\r
    valid := SameCapture(estimate.binding);\r
    for i in 1:3 loop\r
      valid := valid and estimate.positions[1,i] == estimate.positions[2,i];\r
      for j in 1:3 loop valid := valid and estimate.rotations[1,i,j] == estimate.rotations[2,i,j]; end for;\r
    end for;\r
    for i in 1:6 loop for j in 1:6 loop\r
      valid := valid and estimate.covariance[i,j] == estimate.covariance[i,j+6]\r
        and estimate.covariance[i,j] == estimate.covariance[i+6,j]\r
        and estimate.covariance[i,j] == estimate.covariance[i+6,j+6];\r
    end for; end for;\r
  end CloneEstimate;\r
  function ValidBinding\r
    input Binding b; output Boolean valid;\r
  algorithm\r
    valid := b.generation > 0 and b.graphRevision > 0 and b.catalogPoseRevision >= 0\r
      and b.anchorId > 0 and b.anchorEpoch >= 0 and b.anchorCaptureSequence > 0\r
      and b.currentId > 0 and b.currentCaptureSequence > 0 and b.referenceId > 0 and (b.currentId <> b.referenceId or SameCapture(b))\r
      and b.currentEpoch >= b.referenceEpoch and b.referenceEpoch >= b.anchorEpoch\r
      and b.referenceCaptureSequence > 0 and b.chart == chartENUPositionRightLocalAttitude\r
      and b.anchorTime >= 0 and b.anchorTime <= b.referenceTime and b.referenceTime <= b.currentTime\r
      and b.currentTime <= 1e12 and b.sourceRevision > 0 and b.factorProvenance > 0\r
      and b.anchorBoundProvenance > 0;\r
    if b.currentId == b.anchorId then\r
      valid := valid and b.currentEpoch == b.anchorEpoch and b.currentTime == b.anchorTime\r
        and b.currentCaptureSequence == b.anchorCaptureSequence;\r
    end if;\r
    if b.referenceId == b.anchorId then\r
      valid := valid and b.referenceEpoch == b.anchorEpoch and b.referenceTime == b.anchorTime\r
        and b.referenceCaptureSequence == b.anchorCaptureSequence;\r
    end if;\r
  end ValidBinding;\r
  function Transport\r
    input Estimate previous;\r
    input Binding binding; input Binding expectedBinding;\r
    input Real anchorPosition[3]; input Real anchorRotation[3,3]; input Real anchorBound[6,6];\r
    input Real relativePositions[2,3]; input Real relativeRotations[2,3,3];\r
    input Real relativeJointBound[12,12]; input Real beta; input Boolean requested;\r
    output Estimate result; output Boolean accepted; output Integer rejectionReason;\r
  protected\r
    Boolean valid; Boolean endpoint;\r
    Real B[12,6]; Real C[12,12]; Real candidate[12,12]; Real lever[3,3];\r
    Real candidatePositions[2,3]; Real candidateRotations[2,3,3];\r
    Integer offset;\r
  algorithm\r
    result := previous; accepted := false; rejectionReason := 1;\r
    if requested then\r
      rejectionReason := 2;\r
      valid := ValidBinding(binding) and SameBinding(binding,expectedBinding);\r
      if valid then\r
        rejectionReason := 3; valid := beta > 0 and beta < 1;\r
      end if;\r
      if valid then\r
        rejectionReason := 4; valid := RGBDUncertaintyProper(anchorRotation);\r
        for i in 1:3 loop valid := valid and abs(anchorPosition[i]) <= 1e6; end for;\r
        for node in 1:2 loop\r
          valid := valid and RGBDUncertaintyProper(relativeRotations[node,:,:]);\r
          for i in 1:3 loop valid := valid and abs(relativePositions[node,i]) <= 1e6; end for;\r
        end for;\r
      end if;\r
      if valid then\r
        rejectionReason := 5;\r
        valid := SLAMCovariancePSDCheck(anchorBound,1e-12) == 1\r
          and SLAMCovariancePSDCheck(relativeJointBound,1e-12) == 1;\r
      end if;\r
      if valid then\r
        rejectionReason := 6;\r
        for node in 1:2 loop\r
          endpoint := (if node == 1 then binding.currentId else binding.referenceId) == binding.anchorId;\r
          offset := 6*(node-1);\r
          if endpoint then\r
            for i in 1:3 loop\r
              valid := valid and relativePositions[node,i] == 0;\r
              for j in 1:3 loop valid := valid and relativeRotations[node,i,j] == (if i == j then 1 else 0); end for;\r
            end for;\r
            for i in 1:6 loop for j in 1:12 loop\r
              valid := valid and relativeJointBound[offset+i,j] == 0 and relativeJointBound[j,offset+i] == 0;\r
            end for; end for;\r
          end if;\r
        end for;\r
      end if;\r
      if valid and SameCapture(binding) then\r
        rejectionReason := 6;\r
        for i in 1:3 loop\r
          valid := valid and relativePositions[1,i] == relativePositions[2,i];\r
          for j in 1:3 loop valid := valid and relativeRotations[1,i,j] == relativeRotations[2,i,j]; end for;\r
        end for;\r
        for i in 1:6 loop for j in 1:6 loop\r
          valid := valid and relativeJointBound[i,j] == relativeJointBound[i,j+6]\r
            and relativeJointBound[i,j] == relativeJointBound[i+6,j]\r
            and relativeJointBound[i,j] == relativeJointBound[i+6,j+6];\r
        end for; end for;\r
      end if;\r
      if valid then\r
        B := zeros(12,6); C := zeros(12,12);\r
        for node in 1:2 loop\r
          offset := 6*(node-1); lever := -anchorRotation*RGBDUncertaintySkew(relativePositions[node,:]);\r
          for i in 1:3 loop for j in 1:3 loop\r
            B[offset+i,j] := if i == j then 1 else 0; B[offset+i,j+3] := lever[i,j];\r
            B[offset+i+3,j+3] := relativeRotations[node,j,i];\r
            C[offset+i,offset+j] := anchorRotation[i,j]; C[offset+i+3,offset+j+3] := if i == j then 1 else 0;\r
          end for; end for;\r
        end for;\r
        candidate := B*anchorBound*transpose(B)/beta+C*relativeJointBound*transpose(C)/(1-beta);\r
        rejectionReason := 7;\r
        valid := SLAMCovariancePSDCheck(candidate,1e-12) == 1;\r
        if valid then\r
          rejectionReason := 8;\r
          for node in 1:2 loop\r
            candidatePositions[node,:] := anchorPosition+anchorRotation*relativePositions[node,:];\r
            candidateRotations[node,:,:] := anchorRotation*relativeRotations[node,:,:];\r
            valid := valid and RGBDUncertaintyProper(candidateRotations[node,:,:]);\r
            for i in 1:3 loop valid := valid and abs(candidatePositions[node,i]) <= 1e6; end for;\r
          end for;\r
          if valid then\r
            result.binding := binding; result.covariance := candidate;\r
            result.positions := candidatePositions; result.rotations := candidateRotations;\r
            accepted := true; rejectionReason := 0;\r
          end if;\r
        end if;\r
      end if;\r
    end if;\r
  end Transport;\r
end GraphGaugeUncertainty;\r
`;export{n as default};
