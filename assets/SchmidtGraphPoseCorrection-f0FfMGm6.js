const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Unknown graph/filter cross-correlation fusion; not a fresh independent image.\r
// Source-owned first-order math. Not selected by the production browser runtime.\r
// Dependencies: GraphGaugeUncertainty, RGBDUncertaintyProper/Skew,\r
// SLAMCovariancePSDCheck. No optimizer damping is interpreted as covariance.\r
package SchmidtGraphPoseCorrection\r
\r
  constant Integer currentDimension = 15;\r
  constant Integer referenceDimension = 6;\r
  constant Integer jointDimension = currentDimension+referenceDimension;\r
  constant Integer observationDimension = 2*referenceDimension;\r
\r
  constant Integer poseIndices[6] = {1,2,3,7,8,9};\r
\r
  record State\r
    Real position[3]; Real velocity[3]; Real rotation[3,3];\r
    Real accelBias[3]; Real gyroBias[3];\r
    Real covariance[15,15]; Real crossCovariance[15,6]; Real referenceCovariance[6,6];\r
    Real referencePosition[3]; Real referenceRotation[3,3];\r
    Boolean referenceAvailable; Boolean referenceUsed;\r
    Integer generation; Integer sourceRevision;\r
    Integer currentId; Integer currentEpoch; Integer currentCaptureSequence;\r
    Integer referenceId; Integer referenceEpoch; Integer referenceCaptureSequence;\r
    Integer lastUsedEpoch;\r
    Real predictionTime; Real referenceTime;\r
  end State;\r
\r
  record Policy\r
    Real weight; Boolean constrainVelocityAndBias;\r
    Real maximumPositionInnovation; Real maximumAngularInnovation;\r
    Real maximumPositionCorrection; Real maximumAngularCorrection; Real maximumNis;\r
  end Policy;\r
\r
  record Attempt\r
    Integer generation; Integer graphRevision; Integer factorProvenance;\r
  end Attempt;\r
\r
  record Result\r
    State next;\r
    Boolean accepted; Integer reason;\r
    Boolean attempted; Attempt nextAttempt;\r
    Real innovation[12]; Real measurementJacobian[12,21]; Real noise[12,12];\r
    Real gain[21,12]; Real correction[21]; Real nis;\r
    Real covarianceBeforeReset[21,21]; Real resetJacobian[21,21];\r
  end Result;\r
\r
  function ExactClone\r
    input State state; output Boolean valid;\r
  algorithm\r
    valid := state.referenceAvailable;\r
    for i in 1:3 loop\r
      valid := valid and state.position[i] == state.referencePosition[i];\r
      for j in 1:3 loop valid := valid and state.rotation[i,j] == state.referenceRotation[i,j]; end for;\r
    end for;\r
    for i in 1:15 loop for j in 1:6 loop\r
      valid := valid and state.crossCovariance[i,j] == state.covariance[i,poseIndices[j]];\r
    end for; end for;\r
    for i in 1:6 loop for j in 1:6 loop\r
      valid := valid and state.referenceCovariance[i,j] == state.covariance[poseIndices[i],poseIndices[j]];\r
    end for; end for;\r
  end ExactClone;\r
\r
  function DefaultPolicy\r
    output Policy result;\r
  algorithm\r
    result.weight := 0.5; result.constrainVelocityAndBias := false;\r
    result.maximumPositionInnovation := 5; result.maximumAngularInnovation := 0.35;\r
    result.maximumPositionCorrection := 5; result.maximumAngularCorrection := 0.35;\r
    result.maximumNis := 36;\r
  end DefaultPolicy;\r
\r
  function Exp\r
    input Real vector[3]; output Real rotation[3,3];\r
  protected\r
    Real square; Real angle; Real a; Real b; Real skew[3,3];\r
  algorithm\r
    square := sum(vector.^2); angle := sqrt(square);\r
    a := if square < 1e-8 then 1-square/6+square^2/120 else sin(angle)/angle;\r
    b := if square < 1e-8 then 0.5-square/24+square^2/720 else (1-cos(angle))/square;\r
    skew := RGBDUncertaintySkew(vector);\r
    rotation := identity(3)+a*skew+b*(skew*skew);\r
  end Exp;\r
\r
  function Log\r
    input Real rotation[3,3]; output Real vector[3]; output Boolean valid;\r
  protected\r
    Real cosine; Real angle; Real square; Real factor;\r
  algorithm\r
    vector := zeros(3); valid := RGBDUncertaintyProper(rotation);\r
    if valid then\r
      cosine := min(1.0,max(-1.0,(sum(rotation[i,i] for i in 1:3)-1)/2));\r
      angle := acos(cosine); square := angle^2;\r
      valid := angle < 3.140592653589793;\r
      if valid then\r
        factor := if square < 1e-8 then 0.5+square/12+7*square^2/720 else angle/(2*sin(angle));\r
        vector := factor*{rotation[3,2]-rotation[2,3],rotation[1,3]-rotation[3,1],rotation[2,1]-rotation[1,2]};\r
      end if;\r
    end if;\r
  end Log;\r
\r
  function InverseJacobian\r
    input Real vector[3]; input Boolean right; output Real jacobian[3,3];\r
  protected\r
    Real square; Real angle; Real coefficient; Real skew[3,3];\r
  algorithm\r
    square := sum(vector.^2); angle := sqrt(square);\r
    coefficient := if square < 1e-8 then 1.0/12+square/720+square^2/30240\r
      else (1-angle*cos(angle/2)/(2*sin(angle/2)))/square;\r
    skew := RGBDUncertaintySkew(vector);\r
    jacobian := identity(3)+(if right then 0.5 else -0.5)*skew+coefficient*(skew*skew);\r
  end InverseJacobian;\r
\r
  function RightJacobian\r
    input Real vector[3]; output Real jacobian[3,3];\r
  protected\r
    Real square; Real angle; Real a; Real b; Real skew[3,3];\r
  algorithm\r
    square := sum(vector.^2); angle := sqrt(square);\r
    a := if square < 1e-8 then 0.5-square/24+square^2/720 else (1-cos(angle))/square;\r
    b := if square < 1e-8 then 1.0/6-square/120+square^2/5040 else (angle-sin(angle))/(square*angle);\r
    skew := RGBDUncertaintySkew(vector);\r
    jacobian := identity(3)-a*skew+b*(skew*skew);\r
  end RightJacobian;\r
\r
  // SPD12,22 RHS, dimensionless equilibration. A strictly positive pivot is\r
  // required; no retained jitter, diagonal floor or inverse approximation.\r
  function Solve\r
    input Real A[12,12]; input Real B[12,22];\r
    output Real X[12,22]; output Boolean valid;\r
  protected\r
    Real scale[12]; Real lower[12,12]; Real forward[12]; Real backward[12];\r
    Real value; Real residual; Real magnitude;\r
  algorithm\r
    X := zeros(12,22); lower := zeros(12,12); scale := ones(12);\r
    forward := zeros(12); backward := zeros(12); valid := true;\r
    for i in 1:12 loop\r
      valid := valid and A[i,i] > 0 and A[i,i] <= 1e12;\r
      if A[i,i] > 0 and A[i,i] <= 1e12 then scale[i] := sqrt(A[i,i]); end if;\r
      for j in 1:12 loop\r
        valid := valid and abs(A[i,j]) <= 1e12\r
          and abs(A[i,j]-A[j,i]) <= 1e-12*max(1.0,abs(A[i,j])+abs(A[j,i]));\r
      end for;\r
      for rhs in 1:22 loop valid := valid and abs(B[i,rhs]) <= 1e12; end for;\r
    end for;\r
    if valid then\r
      for i in 1:12 loop\r
        for j in 1:i loop\r
          value := A[i,j]/scale[i]/scale[j];\r
          for k in 1:j-1 loop value := value-lower[i,k]*lower[j,k]; end for;\r
          if j == i then\r
            valid := valid and value > 0 and value <= 1e12;\r
            lower[i,i] := sqrt(if value > 0 and value <= 1e12 then value else 1.0);\r
          else\r
            lower[i,j] := value/lower[j,j];\r
          end if;\r
        end for;\r
      end for;\r
    end if;\r
    if valid then\r
      for rhs in 1:22 loop\r
        for i in 1:12 loop\r
          value := B[i,rhs]/scale[i];\r
          for j in 1:i-1 loop value := value-lower[i,j]*forward[j]; end for;\r
          forward[i] := value/lower[i,i];\r
        end for;\r
        for reverse in 1:12 loop\r
          value := forward[13-reverse];\r
          for j in 14-reverse:12 loop value := value-lower[j,13-reverse]*backward[j]; end for;\r
          backward[13-reverse] := value/lower[13-reverse,13-reverse];\r
        end for;\r
        for i in 1:12 loop X[i,rhs] := backward[i]/scale[i]; end for;\r
      end for;\r
      for i in 1:12 loop for rhs in 1:22 loop\r
        residual := -B[i,rhs]; magnitude := abs(B[i,rhs]);\r
        for j in 1:12 loop\r
          residual := residual+A[i,j]*X[j,rhs]; magnitude := magnitude+abs(A[i,j]*X[j,rhs]);\r
        end for;\r
        valid := valid and abs(X[i,rhs]) <= 1e12 and abs(residual) <= 1e-9*max(1.0,magnitude);\r
      end for; end for;\r
    end if;\r
    if not valid then X := zeros(12,22); end if;\r
  end Solve;\r
\r
  function Correct\r
    input State previous;\r
    input GraphGaugeUncertainty.Estimate graph;\r
    input GraphGaugeUncertainty.Binding expectedBinding;\r
    input Attempt previousAttempt;\r
    input Policy policy;\r
    input Boolean requested;\r
    output Result result;\r
  protected\r
    Boolean valid; Boolean logValid; Boolean solveValid; Boolean sameCapture;\r
    Integer count; Integer offset; Integer stateOffset;\r
    Real prior[21,21]; Real weightedPrior[21,21]; Real Q[12,12]; Real noiseMap[12,12];\r
    Real H[12,21]; Real innovation[12]; Real graphRotation[3,3]; Real priorRotation[3,3];\r
    Real logVector[3]; Real leftInverse[3,3]; Real rightInverse[3,3];\r
    Real cross[21,12]; Real S[12,12]; Real rhs[12,22]; Real solved[12,22];\r
    Real K[21,12]; Real delta[21]; Real A[21,21]; Real beforeReset[21,21];\r
    Real reset[21,21]; Real proposedCovariance[21,21]; State candidate;\r
  algorithm\r
    result.next := previous; result.accepted := false; result.reason := 1;\r
    result.attempted := false; result.nextAttempt := previousAttempt;\r
    result.innovation := zeros(12); result.measurementJacobian := zeros(12,21);\r
    result.noise := zeros(12,12); result.gain := zeros(21,12); result.correction := zeros(21);\r
    result.nis := 0; result.covarianceBeforeReset := zeros(21,21); result.resetJacobian := identity(21);\r
    if requested then\r
      sameCapture := GraphGaugeUncertainty.SameCapture(graph.binding);\r
      result.reason := 2;\r
      valid := GraphGaugeUncertainty.ValidBinding(graph.binding)\r
        and GraphGaugeUncertainty.SameBinding(graph.binding,expectedBinding)\r
        and previous.generation == graph.binding.generation\r
        and previous.sourceRevision == graph.binding.sourceRevision\r
        and previous.currentId == graph.binding.currentId and previous.currentEpoch == graph.binding.currentEpoch\r
        and previous.currentCaptureSequence == graph.binding.currentCaptureSequence\r
        and previous.predictionTime == graph.binding.currentTime\r
        and (previous.referenceAvailable or not previous.referenceUsed)\r
        and previousAttempt.generation == previous.generation and previousAttempt.graphRevision >= 0\r
        and (if previousAttempt.graphRevision == 0 then previousAttempt.factorProvenance == 0\r
          else previousAttempt.factorProvenance > 0)\r
        and graph.binding.graphRevision > previousAttempt.graphRevision\r
        and graph.binding.factorProvenance <> previousAttempt.factorProvenance;\r
      if previous.referenceAvailable then\r
        valid := valid and previous.referenceId == graph.binding.referenceId\r
          and previous.referenceEpoch == graph.binding.referenceEpoch\r
          and previous.referenceCaptureSequence == graph.binding.referenceCaptureSequence\r
          and previous.referenceTime == graph.binding.referenceTime\r
          and previous.lastUsedEpoch >= -1 and previous.lastUsedEpoch <= previous.currentEpoch\r
          and (if previous.referenceUsed then previous.referenceEpoch <= previous.lastUsedEpoch\r
            else previous.referenceEpoch > previous.lastUsedEpoch);\r
      end if;\r
      if sameCapture then valid := valid and previous.referenceAvailable; end if;\r
      if valid then\r
        // Attempt metadata survives numerical refusal. The enclosing owner must\r
        // persist it separately from the rolled-back numerical tuple.\r
        result.attempted := true;\r
        result.nextAttempt.generation := previous.generation;\r
        result.nextAttempt.graphRevision := graph.binding.graphRevision;\r
        result.nextAttempt.factorProvenance := graph.binding.factorProvenance;\r
        result.reason := 3;\r
        valid := policy.weight > 0 and policy.weight < 1\r
          and policy.maximumPositionInnovation > 0 and policy.maximumPositionInnovation <= 1e6\r
          and policy.maximumAngularInnovation > 0 and policy.maximumAngularInnovation < 3.140592653589793\r
          and policy.maximumPositionCorrection > 0 and policy.maximumPositionCorrection <= 1e6\r
          and policy.maximumAngularCorrection > 0 and policy.maximumAngularCorrection < 3.140592653589793\r
          and policy.maximumNis > 0 and policy.maximumNis <= 1e12;\r
      end if;\r
      if valid then\r
        result.reason := 4;\r
        valid := RGBDUncertaintyProper(previous.rotation) and RGBDUncertaintyProper(graph.rotations[1,:,:]);\r
        for i in 1:3 loop\r
          valid := valid and abs(previous.position[i]) <= 1e6 and abs(previous.velocity[i]) <= 1e6\r
            and abs(previous.accelBias[i]) <= 2 and abs(previous.gyroBias[i]) <= 0.3\r
            and abs(graph.positions[1,i]) <= 1e6;\r
        end for;\r
        if previous.referenceAvailable then\r
          valid := valid and RGBDUncertaintyProper(previous.referenceRotation)\r
            and RGBDUncertaintyProper(graph.rotations[2,:,:]);\r
          for i in 1:3 loop\r
            valid := valid and abs(previous.referencePosition[i]) <= 1e6 and abs(graph.positions[2,i]) <= 1e6;\r
          end for;\r
        end if;\r
      end if;\r
      if valid then\r
        result.reason := 5; prior := zeros(21,21);\r
        prior[1:15,1:15] := previous.covariance;\r
        if previous.referenceAvailable then\r
          prior[1:15,16:21] := previous.crossCovariance;\r
          prior[16:21,1:15] := transpose(previous.crossCovariance);\r
          prior[16:21,16:21] := previous.referenceCovariance;\r
          valid := SLAMCovariancePSDCheck(prior,1e-12) == 1\r
            and SLAMCovariancePSDCheck(graph.covariance,1e-12) == 1;\r
        else\r
          valid := SLAMCovariancePSDCheck(previous.covariance,1e-12) == 1\r
            and SLAMCovariancePSDCheck(graph.covariance[1:6,1:6],1e-12) == 1;\r
        end if;\r
      end if;\r
      if valid and sameCapture then\r
        result.reason := 5;\r
        valid := ExactClone(previous) and GraphGaugeUncertainty.CloneEstimate(graph);\r
      end if;\r
      if valid then\r
        result.reason := 6; H := zeros(12,21); noiseMap := zeros(12,12); innovation := zeros(12);\r
        count := if previous.referenceAvailable and not sameCapture then 2 else 1;\r
        for node in 1:count loop\r
          offset := 6*(node-1); stateOffset := if node == 1 then 0 else 15;\r
          priorRotation := if node == 1 then previous.rotation else previous.referenceRotation;\r
          graphRotation := graph.rotations[node,:,:];\r
          (logVector,logValid) := Log(transpose(priorRotation)*graphRotation);\r
          valid := valid and logValid and sum(logVector.^2) <= policy.maximumAngularInnovation^2;\r
          innovation[offset+1:offset+3] := graph.positions[node,:]\r
            -(if node == 1 then previous.position else previous.referencePosition);\r
          innovation[offset+4:offset+6] := logVector;\r
          valid := valid and sum(innovation[offset+1:offset+3].^2) <= policy.maximumPositionInnovation^2;\r
          leftInverse := InverseJacobian(logVector,false); rightInverse := InverseJacobian(logVector,true);\r
          H[offset+1:offset+3,stateOffset+1:stateOffset+3] := identity(3);\r
          H[offset+4:offset+6,stateOffset+(if node == 1 then 7 else 4):stateOffset+(if node == 1 then 9 else 6)] := leftInverse;\r
          noiseMap[offset+1:offset+3,offset+1:offset+3] := identity(3);\r
          noiseMap[offset+4:offset+6,offset+4:offset+6] := rightInverse;\r
        end for;\r
      end if;\r
      if valid then\r
        Q := zeros(12,12);\r
        if previous.referenceAvailable and not sameCapture then\r
          Q := noiseMap*graph.covariance*transpose(noiseMap);\r
        else\r
          Q[1:6,1:6] := noiseMap[1:6,1:6]*graph.covariance[1:6,1:6]*transpose(noiseMap[1:6,1:6]);\r
          // Neutral solver padding for current-only or one same-capture pose,\r
          // neither an extra reference observation nor retained\r
          // covariance. Zero H/K rows make this identical to the six-row solve.\r
          Q[7:12,7:12] := identity(6);\r
        end if;\r
        weightedPrior := prior/policy.weight; cross := weightedPrior*transpose(H);\r
        S := H*cross+Q/(1-policy.weight);\r
        rhs[:,1:21] := transpose(cross); rhs[:,22] := innovation;\r
        (solved,solveValid) := Solve(S,rhs);\r
        result.reason := 7; valid := solveValid;\r
      end if;\r
      if valid then\r
        K := transpose(solved[:,1:21]);\r
        if policy.constrainVelocityAndBias then\r
          K[4:6,:] := zeros(3,12); K[10:15,:] := zeros(6,12);\r
        end if;\r
        delta := K*innovation;\r
        result.innovation := innovation; result.measurementJacobian := H; result.noise := Q;\r
        result.gain := K; result.correction := delta; result.nis := sum(innovation.*solved[:,22]);\r
        result.reason := 8;\r
        valid := result.nis >= 0 and result.nis <= policy.maximumNis;\r
        for i in 1:21 loop valid := valid and abs(delta[i]) <= 1e6; end for;\r
        valid := valid and sum(delta[1:3].^2) <= policy.maximumPositionCorrection^2\r
          and sum(delta[7:9].^2) <= policy.maximumAngularCorrection^2;\r
        if previous.referenceAvailable then\r
          valid := valid and sum(delta[16:18].^2) <= policy.maximumPositionCorrection^2\r
            and sum(delta[19:21].^2) <= policy.maximumAngularCorrection^2;\r
        end if;\r
      end if;\r
      if valid then\r
        candidate := previous;\r
        candidate.position := previous.position+delta[1:3]; candidate.velocity := previous.velocity+delta[4:6];\r
        candidate.rotation := previous.rotation*Exp(delta[7:9]);\r
        candidate.accelBias := previous.accelBias+delta[10:12]; candidate.gyroBias := previous.gyroBias+delta[13:15];\r
        if previous.referenceAvailable then\r
          candidate.referencePosition := previous.referencePosition+delta[16:18];\r
          candidate.referenceRotation := previous.referenceRotation*Exp(delta[19:21]);\r
        end if;\r
        result.reason := 9; valid := RGBDUncertaintyProper(candidate.rotation);\r
        for i in 1:3 loop\r
          valid := valid and abs(candidate.position[i]) <= 1e6 and abs(candidate.velocity[i]) <= 1e6\r
            and abs(candidate.accelBias[i]) <= 2 and abs(candidate.gyroBias[i]) <= 0.3;\r
        end for;\r
        if previous.referenceAvailable then\r
          valid := valid and RGBDUncertaintyProper(candidate.referenceRotation);\r
          for i in 1:3 loop valid := valid and abs(candidate.referencePosition[i]) <= 1e6; end for;\r
        end if;\r
      end if;\r
      if valid then\r
        A := identity(21)-K*H;\r
        beforeReset := A*weightedPrior*transpose(A)+K*(Q/(1-policy.weight))*transpose(K);\r
        reset := identity(21); reset[7:9,7:9] := RightJacobian(delta[7:9]);\r
        if previous.referenceAvailable then reset[19:21,19:21] := RightJacobian(delta[19:21]); end if;\r
        proposedCovariance := reset*beforeReset*transpose(reset);\r
        proposedCovariance := (proposedCovariance+transpose(proposedCovariance))/2;\r
        result.covarianceBeforeReset := beforeReset; result.resetJacobian := reset;\r
        result.reason := 10;\r
        valid := SLAMCovariancePSDCheck(proposedCovariance,1e-12) == 1;\r
        if valid and sameCapture then\r
          // Validate full21 result closure before the structural clone map\r
          // C=[I15; selected6]. Only NEW corrected Pcc/means are retained.\r
          for i in 1:3 loop\r
            valid := valid and abs(candidate.referencePosition[i]-candidate.position[i])\r
              <= 1e-11*(1+max(abs(candidate.referencePosition[i]),abs(candidate.position[i])));\r
            for j in 1:3 loop valid := valid and abs(candidate.referenceRotation[i,j]-candidate.rotation[i,j]) <= 1e-11; end for;\r
          end for;\r
          for i in 1:15 loop for j in 1:6 loop\r
            valid := valid and abs(proposedCovariance[i,j+15]-proposedCovariance[i,poseIndices[j]])\r
              <= 1e-11*(1+max(abs(proposedCovariance[i,j+15]),abs(proposedCovariance[i,poseIndices[j]])));\r
          end for; end for;\r
          for i in 1:6 loop for j in 1:6 loop\r
            valid := valid and abs(proposedCovariance[i+15,j+15]-proposedCovariance[poseIndices[i],poseIndices[j]])\r
              <= 1e-11*(1+max(abs(proposedCovariance[i+15,j+15]),abs(proposedCovariance[poseIndices[i],poseIndices[j]])));\r
          end for; end for;\r
          if valid then\r
            candidate.referencePosition := candidate.position; candidate.referenceRotation := candidate.rotation;\r
            for i in 1:15 loop for j in 1:6 loop\r
              proposedCovariance[i,j+15] := proposedCovariance[i,poseIndices[j]];\r
              proposedCovariance[j+15,i] := proposedCovariance[poseIndices[j],i];\r
            end for; end for;\r
            for i in 1:6 loop for j in 1:6 loop\r
              proposedCovariance[i+15,j+15] := proposedCovariance[poseIndices[i],poseIndices[j]];\r
            end for; end for;\r
            valid := SLAMCovariancePSDCheck(proposedCovariance,1e-12) == 1;\r
          end if;\r
        end if;\r
        if valid then\r
          candidate.covariance := proposedCovariance[1:15,1:15];\r
          if previous.referenceAvailable then\r
            candidate.crossCovariance := proposedCovariance[1:15,16:21];\r
            candidate.referenceCovariance := proposedCovariance[16:21,16:21];\r
          end if;\r
          result.next := candidate; result.accepted := true; result.reason := 0;\r
        end if;\r
      end if;\r
    end if;\r
  end Correct;\r
end SchmidtGraphPoseCorrection;\r
`;export{e as default};
