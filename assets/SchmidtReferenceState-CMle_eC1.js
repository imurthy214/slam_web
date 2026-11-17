const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// MLS 3.5 permits exact Real equality inside functions. This helper preserves\r
// IEEE equality: signed zeros compare equal; NaN compares unequal to every value.\r
function SLAMExactRealEqual\r
  input Real left;\r
  input Real right;\r
  output Boolean equal;\r
algorithm\r
  equal := left == right;\r
end SLAMExactRealEqual;\r
\r
// An acquisition interval is a held measurement, not an integration substep.\r
// This bound covers the supported sensor rates without fabricating samples.\r
function ES15HeldIntervalValid\r
  input Real h;\r
  output Boolean valid;\r
algorithm\r
  valid := h > 0.0 and h <= 0.2;\r
end ES15HeldIntervalValid;\r
\r
function SchmidtPredictCovariance\r
\r
  input Real covariance[15,15];\r
  input Real crossCovariance[15,6];\r
  input Real referenceCovariance[6,6];\r
  input Real transition[15,15];\r
  input Real processCovariance[15,15];\r
  input Real referenceAvailable;\r
  input Real predictionEnabled;\r
  output Real accepted;\r
  output Real nextCovariance[15,15];\r
  output Real nextCrossCovariance[15,6];\r
  output Real nextReferenceCovariance[6,6];\r
protected\r
  Real raw[15,15]; Real proposed[15,15]; Real proposedCross[15,6];\r
  Real priorJoint[21,21]; Real proposedJoint[21,21];\r
  Real currentValid; Real processValid; Real proposedCurrentValid;\r
  Real priorJointValid; Real proposedJointValid;\r
  Real finiteTransition[15,15];\r
algorithm\r
  raw := transition*covariance*transpose(transition)+processCovariance;\r
  proposed := 0.5*(raw+transpose(raw));\r
  proposedCross := transition*crossCovariance;\r
  priorJoint := cat(1,cat(2,covariance,crossCovariance),\r
    cat(2,transpose(crossCovariance),referenceCovariance));\r
  proposedJoint := cat(1,cat(2,proposed,proposedCross),\r
    cat(2,transpose(proposedCross),referenceCovariance));\r
  currentValid := SLAMCovariancePSDCheck(covariance,1e-12);\r
  processValid := SLAMCovariancePSDCheck(processCovariance,1e-12);\r
  proposedCurrentValid := SLAMCovariancePSDCheck(proposed,1e-12);\r
  priorJointValid := SLAMCovariancePSDCheck(priorJoint,1e-12);\r
  proposedJointValid := SLAMCovariancePSDCheck(proposedJoint,1e-12);\r
  for i in 1:15 loop\r
    for j in 1:15 loop\r
      finiteTransition[i,j] := if abs(transition[i,j]) <= 1e6 then 0.0 else 1.0;\r
    end for;\r
  end for;\r
  accepted := if SLAMExactRealEqual(predictionEnabled,1.0)\r
    and (SLAMExactRealEqual(referenceAvailable,0.0) or SLAMExactRealEqual(referenceAvailable,1.0))\r
    and currentValid > 0.5 and processValid > 0.5 and proposedCurrentValid > 0.5\r
    and sum(finiteTransition) < 0.5\r
    and (SLAMExactRealEqual(referenceAvailable,0.0) or (priorJointValid > 0.5 and proposedJointValid > 0.5))\r
    then 1.0 else 0.0;\r
  nextCovariance := if accepted > 0.5 then proposed else covariance;\r
  nextCrossCovariance := if accepted > 0.5 and SLAMExactRealEqual(referenceAvailable,1.0)\r
    then proposedCross else crossCovariance;\r
  nextReferenceCovariance := referenceCovariance;\r
end SchmidtPredictCovariance;\r
\r
// Modelica owns numerical subdivision of one unchanged held IMU measurement.\r
// Each substep uses the current midpoint rotation and propagates the full joint\r
// covariance. A failed substep rolls back the whole acquisition interval.\r
function ES15PredictHeldInterval\r
\r
  input Real position[3]; input Real velocity[3]; input Real rotation[3,3];\r
  input Real accelBias[3]; input Real gyroBias[3];\r
  input Real covariance[15,15]; input Real crossCovariance[15,6];\r
  input Real referenceCovariance[6,6]; input Real referencePosition[3];\r
  input Real referenceRotation[3,3]; input Real referenceAvailable;\r
  input Real accel[3]; input Real gyro[3]; input Real gravity[3];\r
  input Real h; input Real density[12];\r
  output Real accepted;\r
  output Real transition[15,15]; output Real processCovariance[15,15];\r
  output Real nextPosition[3]; output Real nextVelocity[3]; output Real nextRotation[3,3];\r
  output Real nextCovariance[15,15]; output Real nextCrossCovariance[15,6];\r
  output Integer substeps;\r
protected\r
  constant Integer maximumSubsteps = 64;\r
  Real rate; Real requestedSteps; Real dt;\r
  Real force[3]; Real omega[3]; Real middleRotation[3,3];\r
  Real proposedPosition[3]; Real proposedVelocity[3]; Real proposedRotation[3,3];\r
  Real F[15,15]; Real G[15,12]; Real Phi[15,15]; Real Q[15,15];\r
  Real proposedCovariance[15,15]; Real proposedCross[15,6]; Real retainedReference[6,6];\r
  Real rawNoise[15,15]; Real nominalValid; Real jointAccepted;\r
  Boolean geometryValid; Boolean densityValid; Boolean running;\r
algorithm\r
  accepted := 0.0; substeps := 0;\r
  transition := identity(15); processCovariance := zeros(15,15);\r
  nextPosition := position; nextVelocity := velocity; nextRotation := rotation;\r
  nextCovariance := covariance; nextCrossCovariance := crossCovariance;\r
  rate := sqrt(sum((gyro-gyroBias).^2));\r
  requestedSteps := max(h/0.02,rate*h/0.1);\r
  running := ES15HeldIntervalValid(h) and requestedSteps >= 0.0\r
    and requestedSteps <= maximumSubsteps;\r
  if running then\r
    substeps := max(1,integer(ceil(requestedSteps)));\r
    // Division rounding must not place a substep just beyond either limit.\r
    if h/substeps > 0.02 or rate*(h/substeps) > 0.1 then substeps := substeps+1; end if;\r
    running := substeps <= maximumSubsteps;\r
    if running then\r
      dt := h/substeps;\r
      densityValid := true;\r
      for channel in 1:12 loop\r
        densityValid := densityValid and density[channel] >= 0.0 and density[channel] <= 1e6;\r
      end for;\r
      for step in 1:substeps loop\r
        if running then\r
          (force,omega,middleRotation,proposedRotation,proposedPosition,proposedVelocity,nominalValid)\r
            := ES15NominalPrediction.Predict(nextRotation,nextPosition,nextVelocity,\r
              accel,gyro,accelBias,gyroBias,gravity,dt);\r
          (F,G) := ES15Dynamics.Matrices(middleRotation,force,omega);\r
          // The joint propagator below owns Phi*P*Phi'; compute it only once.\r
          (Phi,Q) := ES15TransitionNoise(F,G,\r
            if nominalValid > 0.5 then dt else 0.0,density);\r
          geometryValid := RGBDProperRotationValue(nextRotation) > 0.5\r
            and RGBDProperRotationValue(proposedRotation) > 0.5;\r
          for axis in 1:3 loop\r
            geometryValid := geometryValid and abs(proposedPosition[axis]) <= 1e6\r
              and abs(proposedVelocity[axis]) <= 1e6 and abs(accelBias[axis]) <= 2.0\r
              and abs(gyroBias[axis]) <= 0.3 and abs(gravity[axis]) <= 1e3\r
              and (SLAMExactRealEqual(referenceAvailable,0.0) or abs(referencePosition[axis]) <= 1e6);\r
          end for;\r
          geometryValid := geometryValid and (SLAMExactRealEqual(referenceAvailable,0.0)\r
            or RGBDProperRotationValue(referenceRotation) > 0.5);\r
          (jointAccepted,proposedCovariance,proposedCross,retainedReference)\r
            := SchmidtPredictCovariance(nextCovariance,nextCrossCovariance,referenceCovariance,\r
              Phi,Q,referenceAvailable,if nominalValid > 0.5 and geometryValid and densityValid then 1.0 else 0.0);\r
          // The first step preserves the original one-step diagnostics exactly.\r
          if step == 1 then\r
            transition := Phi; processCovariance := Q;\r
          else\r
            transition := Phi*transition;\r
            rawNoise := Phi*processCovariance*transpose(Phi)+Q;\r
            processCovariance := 0.5*(rawNoise+transpose(rawNoise));\r
          end if;\r
          running := jointAccepted > 0.5;\r
          if running then\r
            nextPosition := proposedPosition; nextVelocity := proposedVelocity; nextRotation := proposedRotation;\r
            nextCovariance := proposedCovariance; nextCrossCovariance := proposedCross;\r
          end if;\r
        end if;\r
      end for;\r
    end if;\r
    if running then\r
      accepted := 1.0;\r
    else\r
      nextPosition := position; nextVelocity := velocity; nextRotation := rotation;\r
      nextCovariance := covariance; nextCrossCovariance := crossCovariance;\r
    end if;\r
  end if;\r
end ES15PredictHeldInterval;\r
\r
// Correlated reference lifecycle, composed with the existing ES15/Schmidt models.\r
// All numerical work is Modelica; the host only retains and copies returned state.\r
// Current errors: world dp,dv; right-local dtheta; body dba,dbg. Reference: dp,dtheta.\r
// This source is not yet compiler-admitted or integrated into the production node.\r
model SchmidtReferencePrediction\r
\r
  constant Integer currentDimension = 15;\r
  constant Integer referenceDimension = 6;\r
  input Real covariance[currentDimension,currentDimension];\r
  input Real crossCovariance[currentDimension,referenceDimension];\r
  input Real referenceCovariance[referenceDimension,referenceDimension];\r
  input Real transition[currentDimension,currentDimension] = identity(currentDimension);\r
  input Real processCovariance[currentDimension,currentDimension] = zeros(currentDimension,currentDimension);\r
  input Real referenceAvailable = 0.0;\r
  input Real predictionEnabled = 1.0;\r
  output Real accepted;\r
  output Real nextCovariance[currentDimension,currentDimension];\r
  output Real nextCrossCovariance[currentDimension,referenceDimension];\r
  output Real nextReferenceCovariance[referenceDimension,referenceDimension];\r
algorithm\r
  (accepted,nextCovariance,nextCrossCovariance,nextReferenceCovariance)\r
    := SchmidtPredictCovariance(covariance,crossCovariance,referenceCovariance,\r
      transition,processCovariance,referenceAvailable,predictionEnabled);\r
end SchmidtReferencePrediction;\r
\r
// Pure capture counterpart of the unchanged equation model below.\r
// Keep the shared rotation gates, PSD checks and selection contractions identical.\r
pure function SchmidtCaptureReference\r
\r
  input Real position[3] = zeros(3);\r
  input Real rotation[3,3] = identity(3);\r
  input Real covariance[currentDimension,currentDimension];\r
  input Real referencePosition[3] = zeros(3);\r
  input Real referenceRotation[3,3] = identity(3);\r
  input Real crossCovariance[currentDimension,referenceDimension];\r
  input Real referenceCovariance[referenceDimension,referenceDimension];\r
  input Real referenceAvailable = 0.0;\r
  input Real captureRequested = 0.0;\r
  input Real currentValid = 1.0;\r
  output Real accepted;\r
  output Real rejected;\r
  output Real nextReferenceAvailable;\r
  output Real nextReferencePosition[3];\r
  output Real nextReferenceRotation[3,3];\r
  output Real nextCovariance[currentDimension,currentDimension];\r
  output Real nextCrossCovariance[currentDimension,referenceDimension];\r
  output Real nextReferenceCovariance[referenceDimension,referenceDimension];\r
protected\r
  constant Integer currentDimension = 15;\r
  constant Integer referenceDimension = 6;\r
  Real currentRotationValid; Real referenceRotationValid;\r
  Real selection[referenceDimension,currentDimension];\r
  Real proposedCross[currentDimension,referenceDimension];\r
  Real proposedReference[referenceDimension,referenceDimension];\r
  Real priorJoint[21,21];\r
  Real proposedJoint[21,21];\r
  Real currentCovarianceValid;\r
  Real priorJointValid;\r
  Real proposedJointValid;\r
  Real currentPositionChecks[3];\r
  Real referencePositionChecks[3];\r
algorithm\r
  currentRotationValid := RGBDProperRotationValue(rotation);\r
  referenceRotationValid := RGBDProperRotationValue(referenceRotation);\r
  // Reference nominal equals current nominal at capture, so both right-local\r
  // attitude errors share exactly the same body tangent; no guessed heading.\r
  selection := cat(1,cat(2,identity(3),zeros(3,12)),\r
    cat(2,zeros(3,6),identity(3),zeros(3,6)));\r
  proposedCross := covariance*transpose(selection);\r
  proposedReference := selection*proposedCross;\r
  priorJoint := cat(1,cat(2,covariance,crossCovariance),\r
    cat(2,transpose(crossCovariance),referenceCovariance));\r
  proposedJoint := cat(1,cat(2,covariance,proposedCross),\r
    cat(2,transpose(proposedCross),proposedReference));\r
  currentCovarianceValid := SLAMCovariancePSDCheck(covariance,1e-12);\r
  priorJointValid := SLAMCovariancePSDCheck(priorJoint,1e-12);\r
  proposedJointValid := SLAMCovariancePSDCheck(proposedJoint,1e-12);\r
  for i in 1:3 loop\r
    currentPositionChecks[i] := if noEvent(abs(position[i]) <= 1e6) then 0.0 else 1.0;\r
    referencePositionChecks[i] := if noEvent(abs(referencePosition[i]) <= 1e6) then 0.0 else 1.0;\r
  end for;\r
  accepted := if noEvent(SLAMExactRealEqual(captureRequested,1.0) and SLAMExactRealEqual(currentValid,1.0)\r
    and (SLAMExactRealEqual(referenceAvailable,0.0) or SLAMExactRealEqual(referenceAvailable,1.0))\r
    and currentRotationValid > 0.5 and sum(currentPositionChecks) < 0.5\r
    and currentCovarianceValid > 0.5 and proposedJointValid > 0.5\r
    and (SLAMExactRealEqual(referenceAvailable,0.0) or (priorJointValid > 0.5\r
      and referenceRotationValid > 0.5 and sum(referencePositionChecks) < 0.5)))\r
    then 1.0 else 0.0;\r
  rejected := if noEvent(SLAMExactRealEqual(captureRequested,0.0) or accepted > 0.5) then 0.0 else 1.0;\r
  nextReferenceAvailable := if noEvent(accepted > 0.5) then 1.0 else referenceAvailable;\r
  nextReferencePosition := if noEvent(accepted > 0.5) then position else referencePosition;\r
  nextReferenceRotation := if noEvent(accepted > 0.5) then rotation else referenceRotation;\r
  nextCovariance := covariance;\r
  nextCrossCovariance := if noEvent(accepted > 0.5) then proposedCross else crossCovariance;\r
  nextReferenceCovariance := if noEvent(accepted > 0.5) then proposedReference else referenceCovariance;\r
end SchmidtCaptureReference;\r
\r
model SchmidtReferenceCapture\r
\r
  constant Integer currentDimension = 15;\r
  constant Integer referenceDimension = 6;\r
  input Real position[3] = zeros(3);\r
  input Real rotation[3,3] = identity(3);\r
  input Real covariance[currentDimension,currentDimension];\r
  input Real referencePosition[3] = zeros(3);\r
  input Real referenceRotation[3,3] = identity(3);\r
  input Real crossCovariance[currentDimension,referenceDimension];\r
  input Real referenceCovariance[referenceDimension,referenceDimension];\r
  input Real referenceAvailable = 0.0;\r
  input Real captureRequested = 0.0;\r
  input Real currentValid = 1.0;\r
  output Real accepted;\r
  output Real rejected;\r
  output Real nextReferenceAvailable;\r
  output Real nextReferencePosition[3];\r
  output Real nextReferenceRotation[3,3];\r
  output Real nextCovariance[currentDimension,currentDimension];\r
  output Real nextCrossCovariance[currentDimension,referenceDimension];\r
  output Real nextReferenceCovariance[referenceDimension,referenceDimension];\r
protected\r
  RGBDProperRotation currentRotationCheck(rotation=rotation);\r
  RGBDProperRotation referenceRotationCheck(rotation=referenceRotation);\r
  Real selection[referenceDimension,currentDimension];\r
  Real proposedCross[currentDimension,referenceDimension];\r
  Real proposedReference[referenceDimension,referenceDimension];\r
  Real priorJoint[21,21];\r
  Real proposedJoint[21,21];\r
  Real currentCovarianceValid;\r
  Real priorJointValid;\r
  Real proposedJointValid;\r
  Real currentPositionChecks[3];\r
  Real referencePositionChecks[3];\r
equation\r
  // Reference nominal equals current nominal at capture, so both right-local\r
  // attitude errors share exactly the same body tangent; no guessed heading.\r
  selection = cat(1,cat(2,identity(3),zeros(3,12)),\r
    cat(2,zeros(3,6),identity(3),zeros(3,6)));\r
  proposedCross = covariance*transpose(selection);\r
  proposedReference = selection*proposedCross;\r
  priorJoint = cat(1,cat(2,covariance,crossCovariance),\r
    cat(2,transpose(crossCovariance),referenceCovariance));\r
  proposedJoint = cat(1,cat(2,covariance,proposedCross),\r
    cat(2,transpose(proposedCross),proposedReference));\r
  currentCovarianceValid = SLAMCovariancePSDCheck(covariance,1e-12);\r
  priorJointValid = SLAMCovariancePSDCheck(priorJoint,1e-12);\r
  proposedJointValid = SLAMCovariancePSDCheck(proposedJoint,1e-12);\r
  for i in 1:3 loop\r
    currentPositionChecks[i] = if noEvent(abs(position[i]) <= 1e6) then 0.0 else 1.0;\r
    referencePositionChecks[i] = if noEvent(abs(referencePosition[i]) <= 1e6) then 0.0 else 1.0;\r
  end for;\r
  accepted = if noEvent(SLAMExactRealEqual(captureRequested,1.0) and SLAMExactRealEqual(currentValid,1.0)\r
    and (SLAMExactRealEqual(referenceAvailable,0.0) or SLAMExactRealEqual(referenceAvailable,1.0))\r
    and currentRotationCheck.valid > 0.5 and sum(currentPositionChecks) < 0.5\r
    and currentCovarianceValid > 0.5 and proposedJointValid > 0.5\r
    and (SLAMExactRealEqual(referenceAvailable,0.0) or (priorJointValid > 0.5\r
      and referenceRotationCheck.valid > 0.5 and sum(referencePositionChecks) < 0.5)))\r
    then 1.0 else 0.0;\r
  rejected = if noEvent(SLAMExactRealEqual(captureRequested,0.0) or accepted > 0.5) then 0.0 else 1.0;\r
  nextReferenceAvailable = if noEvent(accepted > 0.5) then 1.0 else referenceAvailable;\r
  nextReferencePosition = if noEvent(accepted > 0.5) then position else referencePosition;\r
  nextReferenceRotation = if noEvent(accepted > 0.5) then rotation else referenceRotation;\r
  nextCovariance = covariance;\r
  nextCrossCovariance = if noEvent(accepted > 0.5) then proposedCross else crossCovariance;\r
  nextReferenceCovariance = if noEvent(accepted > 0.5) then proposedReference else referenceCovariance;\r
end SchmidtReferenceCapture;\r
\r
// Predict a complete current/reference state using the actual ES15 transition.\r
model ES15SchmidtPrediction\r
\r
  input Real position[3] = zeros(3);\r
  input Real velocity[3] = zeros(3);\r
  input Real rotation[3,3] = identity(3);\r
  input Real accelBias[3] = zeros(3);\r
  input Real gyroBias[3] = zeros(3);\r
  input Real covariance[15,15];\r
  input Real crossCovariance[15,6];\r
  input Real referenceCovariance[6,6];\r
  input Real referencePosition[3] = zeros(3);\r
  input Real referenceRotation[3,3] = identity(3);\r
  input Real referenceAvailable = 0.0;\r
  input Real accel[3] = {0.0,0.0,9.81};\r
  input Real gyro[3] = zeros(3);\r
  input Real gravity[3] = {0.0,0.0,-9.81};\r
  input Real h = 1.0/90.0;\r
  input Real density[12] = {0.06,0.06,0.06,0.006,0.006,0.006,0.002,0.002,0.002,0.0002,0.0002,0.0002};\r
  output Real accepted;\r
  output Real transition[15,15];\r
  output Real processCovariance[15,15];\r
  output Real nextPosition[3];\r
  output Real nextVelocity[3];\r
  output Real nextRotation[3,3];\r
  output Real nextAccelBias[3];\r
  output Real nextGyroBias[3];\r
  output Real nextCovariance[15,15];\r
  output Real nextCrossCovariance[15,6];\r
  output Real nextReferenceCovariance[6,6];\r
  output Real nextReferencePosition[3];\r
  output Real nextReferenceRotation[3,3];\r
  output Real nextReferenceAvailable;\r
  output Integer substeps "Numerical substeps within this unchanged held measurement";\r
algorithm\r
  (accepted,transition,processCovariance,nextPosition,nextVelocity,nextRotation,\r
    nextCovariance,nextCrossCovariance,substeps) := ES15PredictHeldInterval(\r
      position,velocity,rotation,accelBias,gyroBias,covariance,crossCovariance,\r
      referenceCovariance,referencePosition,referenceRotation,referenceAvailable,\r
      accel,gyro,gravity,h,density);\r
  nextAccelBias := accelBias;\r
  nextGyroBias := gyroBias;\r
  nextReferenceCovariance := referenceCovariance;\r
  nextReferencePosition := referencePosition;\r
  nextReferenceRotation := referenceRotation;\r
  nextReferenceAvailable := referenceAvailable;\r
end ES15SchmidtPrediction;\r
\r
// Raw-image reuse policy: no image may participate in two visual updates.\r
// Epochs are exact nonnegative integer-valued Real IDs, <=2^53-1; -1 is the\r
// last-used sentinel. This gate caches no measurement or numerical result.\r
// Pure image-ledger eligibility counterpart of the unchanged equation model below.\r
pure function SchmidtImagePairEligibility\r
\r
  input Real referenceAvailable = 0.0;\r
  input Real referenceUsed = 0.0;\r
  input Real referenceEpoch = 0.0;\r
  input Real currentEpoch = 0.0;\r
  input Real lastUsedEpoch = -1.0;\r
  output Real valid;\r
  output Real eligible;\r
  output Real captureFresh;\r
algorithm\r
  valid := if noEvent((SLAMExactRealEqual(referenceAvailable,0.0) or SLAMExactRealEqual(referenceAvailable,1.0))\r
    and (SLAMExactRealEqual(referenceUsed,0.0) or SLAMExactRealEqual(referenceUsed,1.0))\r
    and currentEpoch >= 0.0 and currentEpoch <= 9007199254740991.0\r
    and SLAMExactRealEqual(currentEpoch,floor(currentEpoch))\r
    and lastUsedEpoch >= -1.0 and lastUsedEpoch <= 9007199254740991.0\r
    and SLAMExactRealEqual(lastUsedEpoch,floor(lastUsedEpoch))\r
    and (SLAMExactRealEqual(referenceAvailable,0.0) and SLAMExactRealEqual(referenceUsed,0.0)\r
      or SLAMExactRealEqual(referenceAvailable,1.0) and referenceEpoch >= 0.0\r
        and referenceEpoch <= 9007199254740991.0 and SLAMExactRealEqual(referenceEpoch,floor(referenceEpoch))\r
        and (SLAMExactRealEqual(referenceUsed,0.0) and referenceEpoch > lastUsedEpoch\r
          or SLAMExactRealEqual(referenceUsed,1.0) and referenceEpoch <= lastUsedEpoch))) then 1.0 else 0.0;\r
  eligible := if noEvent(valid > 0.5 and SLAMExactRealEqual(referenceAvailable,1.0)\r
    and SLAMExactRealEqual(referenceUsed,0.0) and currentEpoch > referenceEpoch) then 1.0 else 0.0;\r
  captureFresh := if noEvent(valid > 0.5 and currentEpoch > lastUsedEpoch\r
    and (SLAMExactRealEqual(referenceAvailable,0.0) or currentEpoch > referenceEpoch)) then 1.0 else 0.0;\r
end SchmidtImagePairEligibility;\r
\r
model SchmidtImagePairGate\r
\r
  input Real referenceAvailable = 0.0;\r
  input Real referenceUsed = 0.0;\r
  input Real referenceEpoch = 0.0;\r
  input Real currentEpoch = 0.0;\r
  input Real lastUsedEpoch = -1.0;\r
  output Real valid;\r
  output Real eligible;\r
  output Real captureFresh;\r
equation\r
  valid = if noEvent((SLAMExactRealEqual(referenceAvailable,0.0) or SLAMExactRealEqual(referenceAvailable,1.0))\r
    and (SLAMExactRealEqual(referenceUsed,0.0) or SLAMExactRealEqual(referenceUsed,1.0))\r
    and currentEpoch >= 0.0 and currentEpoch <= 9007199254740991.0\r
    and SLAMExactRealEqual(currentEpoch,floor(currentEpoch))\r
    and lastUsedEpoch >= -1.0 and lastUsedEpoch <= 9007199254740991.0\r
    and SLAMExactRealEqual(lastUsedEpoch,floor(lastUsedEpoch))\r
    and (SLAMExactRealEqual(referenceAvailable,0.0) and SLAMExactRealEqual(referenceUsed,0.0)\r
      or SLAMExactRealEqual(referenceAvailable,1.0) and referenceEpoch >= 0.0\r
        and referenceEpoch <= 9007199254740991.0 and SLAMExactRealEqual(referenceEpoch,floor(referenceEpoch))\r
        and (SLAMExactRealEqual(referenceUsed,0.0) and referenceEpoch > lastUsedEpoch\r
          or SLAMExactRealEqual(referenceUsed,1.0) and referenceEpoch <= lastUsedEpoch))) then 1.0 else 0.0;\r
  eligible = if noEvent(valid > 0.5 and SLAMExactRealEqual(referenceAvailable,1.0)\r
    and SLAMExactRealEqual(referenceUsed,0.0) and currentEpoch > referenceEpoch) then 1.0 else 0.0;\r
  captureFresh = if noEvent(valid > 0.5 and currentEpoch > lastUsedEpoch\r
    and (SLAMExactRealEqual(referenceAvailable,0.0) or currentEpoch > referenceEpoch)) then 1.0 else 0.0;\r
end SchmidtImagePairGate;\r
\r
// One complete ordering transaction: IMU -> relative correction -> reference capture.\r
// Each rejected substep preserves its incoming state. A valid IMU prediction\r
// still advances when a visual observation or reference replacement is rejected.\r
// The host persists these outputs together; it never rebuilds covariance blocks.\r
model ES15SchmidtReferenceStep\r
\r
  input Real position[3] = zeros(3);\r
  input Real velocity[3] = zeros(3);\r
  input Real rotation[3,3] = identity(3);\r
  input Real accelBias[3] = zeros(3);\r
  input Real gyroBias[3] = zeros(3);\r
  input Real covariance[15,15];\r
  input Real crossCovariance[15,6];\r
  input Real referenceCovariance[6,6];\r
  input Real referencePosition[3] = zeros(3);\r
  input Real referenceRotation[3,3] = identity(3);\r
  input Real referenceAvailable = 0.0;\r
  input Real accel[3] = {0.0,0.0,9.81};\r
  input Real gyro[3] = zeros(3);\r
  input Real gravity[3] = {0.0,0.0,-9.81};\r
  input Real h = 1.0/90.0;\r
  input Real density[12] = {0.06,0.06,0.06,0.006,0.006,0.006,0.002,0.002,0.002,0.0002,0.0002,0.0002};\r
  input Real opticalToBody[3,3] = [0.0,0.0,1.0;-1.0,0.0,0.0;0.0,-1.0,0.0];\r
  input Real cameraOriginBody[3] = {0.18,0.0,-0.04};\r
  input Real measuredRotation[3,3] = identity(3);\r
  input Real measuredTranslation[3] = zeros(3);\r
  input Real relativeCovariance[6,6] = identity(6);\r
  input Real measurementEnabled = 0.0;\r
  input Real captureRequested = 0.0;\r
  input Real referenceEpoch = 0.0;\r
  input Real currentEpoch = 0.0;\r
  input Real referenceUsed = 0.0;\r
  input Real lastUsedEpoch = -1.0;\r
  output Real predictionAccepted;\r
  output Real observationAccepted;\r
  output Real observationRejected;\r
  output Real captureAccepted;\r
  output Real captureRejected;\r
  output Real nextPosition[3];\r
  output Real nextVelocity[3];\r
  output Real nextRotation[3,3];\r
  output Real nextAccelBias[3];\r
  output Real nextGyroBias[3];\r
  output Real nextCovariance[15,15];\r
  output Real nextCrossCovariance[15,6];\r
  output Real nextReferenceCovariance[6,6];\r
  output Real nextReferencePosition[3];\r
  output Real nextReferenceRotation[3,3];\r
  output Real nextReferenceAvailable;\r
  output Real nextReferenceEpoch;\r
  output Real nextReferenceUsed;\r
  output Real nextLastUsedEpoch;\r
  output Real imagePairEligible;\r
  output Real imageReuseRejected;\r
protected\r
  SchmidtImagePairGate imageGate(referenceAvailable=referenceAvailable,referenceUsed=referenceUsed,\r
    referenceEpoch=referenceEpoch,currentEpoch=currentEpoch,lastUsedEpoch=lastUsedEpoch);\r
  Real pairAttempted;\r
  Real usedEpochAfterAttempt;\r
  ES15SchmidtPrediction prediction(position=position,velocity=velocity,rotation=rotation,\r
    accelBias=accelBias,gyroBias=gyroBias,covariance=covariance,crossCovariance=crossCovariance,\r
    referenceCovariance=referenceCovariance,referencePosition=referencePosition,\r
    referenceRotation=referenceRotation,referenceAvailable=referenceAvailable,\r
    accel=accel,gyro=gyro,gravity=gravity,h=h,density=density);\r
  SchmidtRelativePoseCorrection correction(position=prediction.nextPosition,\r
    velocity=prediction.nextVelocity,rotation=prediction.nextRotation,\r
    accelBias=accelBias,gyroBias=gyroBias,covariance=prediction.nextCovariance,\r
    crossCovariance=prediction.nextCrossCovariance,referenceCovariance=referenceCovariance,\r
    referencePosition=referencePosition,referenceRotation=referenceRotation,\r
    opticalToBody=opticalToBody,cameraOriginBody=cameraOriginBody,\r
    measuredRotation=measuredRotation,measuredTranslation=measuredTranslation,\r
    relativeCovariance=relativeCovariance,\r
    measurementEnabled=if noEvent(prediction.accepted > 0.5 and imageGate.eligible > 0.5)\r
      then measurementEnabled else 0.0);\r
  SchmidtReferenceCapture capture(position=correction.nextPosition,rotation=correction.nextRotation,\r
    covariance=correction.nextCovariance,crossCovariance=correction.nextCrossCovariance,\r
    referenceCovariance=correction.nextReferenceCovariance,\r
    referencePosition=referencePosition,referenceRotation=referenceRotation,\r
    referenceAvailable=referenceAvailable,captureRequested=captureRequested,\r
    currentValid=if noEvent(prediction.accepted > 0.5 and imageGate.captureFresh > 0.5\r
      and currentEpoch > usedEpochAfterAttempt) then 1.0 else 0.0);\r
equation\r
  // Consume an eligible evaluated pair even when its innovation is rejected.\r
  // This prevents conditioning on repeated trials of the same raw sensor noise.\r
  pairAttempted = if noEvent(prediction.accepted > 0.5 and imageGate.eligible > 0.5\r
    and SLAMExactRealEqual(measurementEnabled,1.0)) then 1.0 else 0.0;\r
  usedEpochAfterAttempt = if noEvent(pairAttempted > 0.5) then currentEpoch else lastUsedEpoch;\r
  imagePairEligible = imageGate.eligible;\r
  imageReuseRejected = if noEvent(prediction.accepted > 0.5 and SLAMExactRealEqual(measurementEnabled,1.0)\r
    and imageGate.eligible < 0.5) then 1.0 else 0.0;\r
  nextReferenceEpoch = if noEvent(capture.accepted > 0.5) then currentEpoch else referenceEpoch;\r
  nextReferenceUsed = if noEvent(capture.accepted > 0.5) then 0.0\r
    else if noEvent(pairAttempted > 0.5) then 1.0 else referenceUsed;\r
  nextLastUsedEpoch = usedEpochAfterAttempt;\r
  predictionAccepted = prediction.accepted;\r
  observationAccepted = correction.accepted;\r
  observationRejected = if noEvent(prediction.accepted > 0.5\r
    and not (SLAMExactRealEqual(measurementEnabled,0.0)) and correction.accepted < 0.5) then 1.0 else 0.0;\r
  captureAccepted = capture.accepted;\r
  captureRejected = capture.rejected;\r
  nextPosition = correction.nextPosition;\r
  nextVelocity = correction.nextVelocity;\r
  nextRotation = correction.nextRotation;\r
  nextAccelBias = correction.nextAccelBias;\r
  nextGyroBias = correction.nextGyroBias;\r
  nextCovariance = capture.nextCovariance;\r
  nextCrossCovariance = capture.nextCrossCovariance;\r
  nextReferenceCovariance = capture.nextReferenceCovariance;\r
  nextReferencePosition = capture.nextReferencePosition;\r
  nextReferenceRotation = capture.nextReferenceRotation;\r
  nextReferenceAvailable = capture.nextReferenceAvailable;\r
end ES15SchmidtReferenceStep;\r
`;export{e as default};
