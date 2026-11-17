const n=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// A correlated, frozen reference pose is a Schmidt state, not pose truth.\r
// World-additive p/v; right-local body attitude; current state order p,v,theta,ba,bg.\r
// Registration maps reference optical points to current optical coordinates.\r
// Compile with RGBDRelativePose.mo, ES15PoseCorrection.mo and SPD6Solve.mo.\r
// These components are under numerical review; the production preset is unchanged.\r
// Sequential validation only: tolerance jitter never enters retained covariance.\r
// The function owns factor ordering instead of a cyclic equation-form factor graph.\r
function SLAMCovariancePSDCheck\r
  input Real covariance[:,:];\r
  input Real relativeTolerance;\r
  output Real valid;\r
protected\r
  Real scale;\r
  Real pivot;\r
  Real diagonalScale;\r
  Real diagonalSum;\r
  Real offDiagonalSum;\r
  Real lower[size(covariance,1),size(covariance,1)];\r
algorithm\r
  diagonalScale := 0.0;\r
  diagonalSum := 0.0;\r
  offDiagonalSum := 0.0;\r
  for i in 1:size(covariance,1) loop\r
    diagonalScale := diagonalScale+abs(covariance[i,i]);\r
  end for;\r
  scale := max(1.0,diagonalScale);\r
  lower := zeros(size(covariance,1),size(covariance,1));\r
  pivot := 0.0;\r
  valid := if size(covariance,1) == size(covariance,2) then 1.0 else 0.0;\r
  for i in 1:size(covariance,1) loop\r
    for j in 1:size(covariance,1) loop\r
      offDiagonalSum := 0.0;\r
      diagonalSum := 0.0;\r
      // Ordered finite accumulation; no array-valued comprehension temporary.\r
      for k in 1:size(covariance,1) loop\r
        offDiagonalSum := offDiagonalSum+(if k < j then lower[i,k]*lower[j,k] else 0.0);\r
        diagonalSum := diagonalSum+(if k < i then lower[i,k]^2 else 0.0);\r
      end for;\r
      if not (abs(covariance[i,j]) <= 1e12 and\r
          abs(covariance[i,j]-covariance[j,i]) <= relativeTolerance*scale) then\r
        valid := 0.0;\r
      end if;\r
      if j < i then\r
        lower[i,j] := (covariance[i,j]-offDiagonalSum)\r
          /max(lower[j,j],1e-150);\r
      elseif j == i then\r
        pivot := covariance[i,i]+relativeTolerance*scale\r
          -diagonalSum;\r
        if not (pivot > 0.0 and pivot <= 1e12) then valid := 0.0; end if;\r
        lower[i,j] := sqrt(if pivot > 0.0 then pivot else 1.0);\r
      end if;\r
    end for;\r
  end for;\r
end SLAMCovariancePSDCheck;\r
\r
model SLAMCovariancePSD\r
\r
  parameter Integer dimension = 21;\r
  parameter Real relativeTolerance = 1e-12;\r
  input Real covariance[dimension,dimension];\r
  output Real valid;\r
equation\r
  valid = SLAMCovariancePSDCheck(covariance,relativeTolerance);\r
end SLAMCovariancePSD;\r
\r
// Signed wxyz coordinates of the existing rotation logarithm. The raw-normalized\r
// quaternion remains observable even when valid is zero; callers own its fallback.\r
function SLAMRotationCoordinates\r
\r
  input Real rotation[3,3];\r
  output Real vector[3];\r
  output Real angle;\r
  output Real valid;\r
  output Real quaternion[4];\r
protected\r
  Real candidate[4];\r
  Real raw[4];\r
  Real norm;\r
  Real sine;\r
  Real scale;\r
algorithm\r
  candidate := {2.0*sqrt(max(0.0,1.0+rotation[1,1]+rotation[2,2]+rotation[3,3])),\r
    2.0*sqrt(max(0.0,1.0+rotation[1,1]-rotation[2,2]-rotation[3,3])),\r
    2.0*sqrt(max(0.0,1.0-rotation[1,1]+rotation[2,2]-rotation[3,3])),\r
    2.0*sqrt(max(0.0,1.0-rotation[1,1]-rotation[2,2]+rotation[3,3]))};\r
  raw := if noEvent(rotation[1,1]+rotation[2,2]+rotation[3,3] > 0.0) then\r
      {candidate[1]/4.0,(rotation[3,2]-rotation[2,3])/max(candidate[1],1e-12),\r
       (rotation[1,3]-rotation[3,1])/max(candidate[1],1e-12),\r
       (rotation[2,1]-rotation[1,2])/max(candidate[1],1e-12)}\r
    elseif noEvent(rotation[1,1] > rotation[2,2] and rotation[1,1] > rotation[3,3]) then\r
      {(rotation[3,2]-rotation[2,3])/max(candidate[2],1e-12),candidate[2]/4.0,\r
       (rotation[1,2]+rotation[2,1])/max(candidate[2],1e-12),\r
       (rotation[1,3]+rotation[3,1])/max(candidate[2],1e-12)}\r
    elseif noEvent(rotation[2,2] > rotation[3,3]) then\r
      {(rotation[1,3]-rotation[3,1])/max(candidate[3],1e-12),\r
       (rotation[1,2]+rotation[2,1])/max(candidate[3],1e-12),candidate[3]/4.0,\r
       (rotation[2,3]+rotation[3,2])/max(candidate[3],1e-12)}\r
    else {(rotation[2,1]-rotation[1,2])/max(candidate[4],1e-12),\r
       (rotation[1,3]+rotation[3,1])/max(candidate[4],1e-12),\r
       (rotation[2,3]+rotation[3,2])/max(candidate[4],1e-12),candidate[4]/4.0};\r
  norm := sqrt(sum(raw.^2));\r
  quaternion := (if noEvent(raw[1] < 0.0) then -1.0 else 1.0)*raw/max(norm,1e-12);\r
  sine := sqrt(sum(quaternion[i]^2 for i in 2:4));\r
  angle := 2.0*atan2(sine,quaternion[1]);\r
  scale := if noEvent(sine < 1e-8) then 2.0 else angle/max(sine,1e-12);\r
  valid := RGBDProperRotationValue(rotation);\r
  for i in 1:3 loop\r
    vector[i] := if noEvent(valid > 0.5) then scale*quaternion[i+1] else 0.0;\r
  end for;\r
end SLAMRotationCoordinates;\r
\r
model SLAMRotationLog\r
\r
  constant Integer spaceDimension = 3;\r
  constant Integer quaternionDimension = 4;\r
  input Real rotation[spaceDimension,spaceDimension] = identity(spaceDimension);\r
  output Real vector[spaceDimension];\r
  output Real angle;\r
  output Real valid;\r
protected\r
  RGBDProperRotation rotationCheck(rotation=rotation);\r
  Real candidate[quaternionDimension];\r
  Real raw[quaternionDimension];\r
  Real quaternion[quaternionDimension];\r
  Real norm;\r
  Real sine;\r
  Real scale;\r
equation\r
  candidate = {2.0*sqrt(max(0.0,1.0+rotation[1,1]+rotation[2,2]+rotation[3,3])),\r
    2.0*sqrt(max(0.0,1.0+rotation[1,1]-rotation[2,2]-rotation[3,3])),\r
    2.0*sqrt(max(0.0,1.0-rotation[1,1]+rotation[2,2]-rotation[3,3])),\r
    2.0*sqrt(max(0.0,1.0-rotation[1,1]-rotation[2,2]+rotation[3,3]))};\r
  raw = if noEvent(rotation[1,1]+rotation[2,2]+rotation[3,3] > 0.0) then\r
      {candidate[1]/4.0,(rotation[3,2]-rotation[2,3])/max(candidate[1],1e-12),\r
       (rotation[1,3]-rotation[3,1])/max(candidate[1],1e-12),\r
       (rotation[2,1]-rotation[1,2])/max(candidate[1],1e-12)}\r
    elseif noEvent(rotation[1,1] > rotation[2,2] and rotation[1,1] > rotation[3,3]) then\r
      {(rotation[3,2]-rotation[2,3])/max(candidate[2],1e-12),candidate[2]/4.0,\r
       (rotation[1,2]+rotation[2,1])/max(candidate[2],1e-12),\r
       (rotation[1,3]+rotation[3,1])/max(candidate[2],1e-12)}\r
    elseif noEvent(rotation[2,2] > rotation[3,3]) then\r
      {(rotation[1,3]-rotation[3,1])/max(candidate[3],1e-12),\r
       (rotation[1,2]+rotation[2,1])/max(candidate[3],1e-12),candidate[3]/4.0,\r
       (rotation[2,3]+rotation[3,2])/max(candidate[3],1e-12)}\r
    else {(rotation[2,1]-rotation[1,2])/max(candidate[4],1e-12),\r
       (rotation[1,3]+rotation[3,1])/max(candidate[4],1e-12),\r
       (rotation[2,3]+rotation[3,2])/max(candidate[4],1e-12),candidate[4]/4.0};\r
  norm = sqrt(sum(raw.^2));\r
  quaternion = (if noEvent(raw[1] < 0.0) then -1.0 else 1.0)*raw/max(norm,1e-12);\r
  sine = sqrt(sum(quaternion[i]^2 for i in 2:quaternionDimension));\r
  angle = 2.0*atan2(sine,quaternion[1]);\r
  scale = if noEvent(sine < 1e-8) then 2.0 else angle/max(sine,1e-12);\r
  valid = rotationCheck.valid;\r
  for i in 1:spaceDimension loop\r
    vector[i] = if noEvent(valid > 0.5) then scale*quaternion[i+1] else 0.0;\r
  end for;\r
end SLAMRotationLog;\r
\r
model SchmidtRelativePoseCorrection\r
\r
  constant Integer spaceDimension = 3;\r
  constant Integer errorDimension = 15;\r
  constant Integer poseDimension = 2*spaceDimension;\r
  constant Integer augmentedDimension = errorDimension+poseDimension;\r
  parameter Real maximumNis = 22.46;\r
  parameter Real maximumAngularInnovation = 0.35;\r
  input Real position[spaceDimension] = zeros(spaceDimension);\r
  input Real velocity[spaceDimension] = zeros(spaceDimension);\r
  input Real rotation[spaceDimension,spaceDimension] = identity(spaceDimension);\r
  input Real accelBias[spaceDimension] = zeros(spaceDimension);\r
  input Real gyroBias[spaceDimension] = zeros(spaceDimension);\r
  input Real covariance[errorDimension,errorDimension] = identity(errorDimension);\r
  input Real referencePosition[spaceDimension] = zeros(spaceDimension);\r
  input Real referenceRotation[spaceDimension,spaceDimension] = identity(spaceDimension);\r
  input Real referenceCovariance[poseDimension,poseDimension] = identity(poseDimension);\r
  input Real crossCovariance[errorDimension,poseDimension] = zeros(errorDimension,poseDimension);\r
  input Real opticalToBody[spaceDimension,spaceDimension] = [0.0,0.0,1.0;-1.0,0.0,0.0;0.0,-1.0,0.0];\r
  input Real cameraOriginBody[spaceDimension] = {0.18,0.0,-0.04};\r
  input Real measuredRotation[spaceDimension,spaceDimension] = identity(spaceDimension);\r
  input Real measuredTranslation[spaceDimension] = zeros(spaceDimension);\r
  // Covariance of independent translation / left-current-optical rotation errors.\r
  input Real relativeCovariance[poseDimension,poseDimension] = identity(poseDimension);\r
  input Real measurementEnabled = 0.0;\r
  output Real accepted;\r
  output Real nis;\r
  output Real innovation[poseDimension];\r
  output Real measurementJacobian[poseDimension,augmentedDimension];\r
  output Real innovationCovariance[poseDimension,poseDimension];\r
  output Real nextPosition[spaceDimension];\r
  output Real nextVelocity[spaceDimension];\r
  output Real nextRotation[spaceDimension,spaceDimension];\r
  output Real nextAccelBias[spaceDimension];\r
  output Real nextGyroBias[spaceDimension];\r
  output Real nextCovariance[errorDimension,errorDimension];\r
  output Real nextCrossCovariance[errorDimension,poseDimension];\r
  output Real nextReferenceCovariance[poseDimension,poseDimension];\r
protected\r
  RGBDProperRotation currentCheck(rotation=rotation);\r
  RGBDProperRotation referenceCheck(rotation=referenceRotation);\r
  RGBDProperRotation extrinsicsCheck(rotation=opticalToBody);\r
  RGBDProperRotation measuredCheck(rotation=measuredRotation);\r
  Real currentCameraTranspose[spaceDimension,spaceDimension];\r
  Real displacementBody[spaceDimension];\r
  Real predictedRotation[spaceDimension,spaceDimension];\r
  Real predictedTranslation[spaceDimension];\r
  SLAMRotationLog logarithm(rotation=transpose(predictedRotation)*measuredRotation);\r
  Real skewDisplacement[spaceDimension,spaceDimension];\r
  Real skewOrigin[spaceDimension,spaceDimension];\r
  Real skewInnovation[spaceDimension,spaceDimension];\r
  Real inverseLeft[spaceDimension,spaceDimension];\r
  Real inverseRight[spaceDimension,spaceDimension];\r
  Real jacobianCoefficient;\r
  Real currentTranslationAngle[spaceDimension,spaceDimension];\r
  Real referenceTranslationAngle[spaceDimension,spaceDimension];\r
  Real currentRotationAngle[spaceDimension,spaceDimension];\r
  Real referenceRotationAngle[spaceDimension,spaceDimension];\r
  Real noiseMap[poseDimension,poseDimension];\r
  Real noiseRotation[spaceDimension,spaceDimension];\r
  Real noise[poseDimension,poseDimension];\r
  Real prior[augmentedDimension,augmentedDimension];\r
  // The component's default dimension is exactly21. Rebinding it to an equal\r
  // constant would introduce an unnecessary parameter-initialization owner.\r
  SLAMCovariancePSD priorCheck(covariance=prior);\r
  ES15CorrectionSolve noiseCheck(A=relativeCovariance,B=zeros(poseDimension,errorDimension+1));\r
  Real cross[augmentedDimension,poseDimension];\r
  Real rhs[poseDimension,errorDimension+1];\r
  ES15CorrectionSolve solve(A=innovationCovariance,B=rhs);\r
  Real gain[augmentedDimension,poseDimension];\r
  Real correction[errorDimension];\r
  Real residualMap[augmentedDimension,augmentedDimension];\r
  Real joseph[augmentedDimension,augmentedDimension];\r
  Real reset[augmentedDimension,augmentedDimension];\r
  Real resetCovariance[augmentedDimension,augmentedDimension];\r
  Real injectedRotation[spaceDimension,spaceDimension];\r
  Real increment[spaceDimension,spaceDimension];\r
  Real skewCorrection[spaceDimension,spaceDimension];\r
  Real correctionAngle;\r
  Real sineCoefficient;\r
  Real cosineCoefficient;\r
  Real resetCoefficient;\r
  Real skewCorrectionSquared[spaceDimension,spaceDimension];\r
  Real finiteChecks[augmentedDimension,augmentedDimension];\r
  Real geometryChecks[spaceDimension];\r
equation\r
  currentCameraTranspose = transpose(opticalToBody)*transpose(rotation);\r
  displacementBody = transpose(rotation)*(referencePosition-position+referenceRotation*cameraOriginBody);\r
  predictedRotation = currentCameraTranspose*referenceRotation*opticalToBody;\r
  predictedTranslation = transpose(opticalToBody)*(displacementBody-cameraOriginBody);\r
  innovation = cat(1,measuredTranslation-predictedTranslation,logarithm.vector);\r
  skewDisplacement = [0.0,-displacementBody[3],displacementBody[2];displacementBody[3],0.0,-displacementBody[1];-displacementBody[2],displacementBody[1],0.0];\r
  skewOrigin = [0.0,-cameraOriginBody[3],cameraOriginBody[2];cameraOriginBody[3],0.0,-cameraOriginBody[1];-cameraOriginBody[2],cameraOriginBody[1],0.0];\r
  skewInnovation = [0.0,-innovation[6],innovation[5];innovation[6],0.0,-innovation[4];-innovation[5],innovation[4],0.0];\r
  jacobianCoefficient = if noEvent(logarithm.angle < 1e-4) then\r
      1.0/12.0+logarithm.angle^2/720.0\r
    else (1.0-0.5*logarithm.angle*cos(0.5*logarithm.angle)/max(sin(0.5*logarithm.angle),1e-12))/max(logarithm.angle^2,1e-12);\r
  inverseLeft = identity(spaceDimension)-0.5*skewInnovation+jacobianCoefficient*(skewInnovation*skewInnovation);\r
  inverseRight = identity(spaceDimension)+0.5*skewInnovation+jacobianCoefficient*(skewInnovation*skewInnovation);\r
  currentTranslationAngle = transpose(opticalToBody)*skewDisplacement;\r
  referenceTranslationAngle = -currentCameraTranspose*referenceRotation*skewOrigin;\r
  currentRotationAngle = -inverseLeft*transpose(predictedRotation)*transpose(opticalToBody);\r
  referenceRotationAngle = inverseLeft*transpose(opticalToBody);\r
  noiseRotation = inverseRight*transpose(measuredRotation);\r
  // Explicit blocks keep every coordinate valid even during structural projection.\r
  // H = -d(innovation)/d(error); columns are p,v,theta,ba,bg,p_ref,theta_ref.\r
  measurementJacobian = cat(1,\r
    cat(2,-currentCameraTranspose,zeros(3,3),currentTranslationAngle,\r
      zeros(3,6),currentCameraTranspose,referenceTranslationAngle),\r
    cat(2,zeros(3,6),currentRotationAngle,zeros(3,9),referenceRotationAngle));\r
  noiseMap = cat(1,cat(2,identity(3),zeros(3,3)),\r
    cat(2,zeros(3,3),noiseRotation));\r
  prior = cat(1,cat(2,covariance,crossCovariance),cat(2,transpose(crossCovariance),referenceCovariance));\r
  cross = prior*transpose(measurementJacobian);\r
  noise = noiseMap*relativeCovariance*transpose(noiseMap);\r
  innovationCovariance = measurementJacobian*cross+noise;\r
  for i in 1:poseDimension loop\r
    for j in 1:errorDimension loop\r
      rhs[i,j] = cross[j,i];\r
    end for;\r
    rhs[i,errorDimension+1] = innovation[i];\r
  end for;\r
  // Schmidt gain: reference uncertainty enters S, but reference gain is zero.\r
  gain = cat(1,transpose(solve.X[:,1:errorDimension]),zeros(poseDimension,poseDimension));\r
  correction = gain[1:errorDimension,:]*innovation;\r
  nis = sum(innovation[i]*solve.X[i,errorDimension+1] for i in 1:poseDimension);\r
  residualMap = identity(augmentedDimension)-gain*measurementJacobian;\r
  joseph = residualMap*prior*transpose(residualMap)+gain*noise*transpose(gain);\r
  skewCorrection = [0.0,-correction[9],correction[8];correction[9],0.0,-correction[7];-correction[8],correction[7],0.0];\r
  correctionAngle = sqrt(sum(correction[i]^2 for i in 7:9));\r
  sineCoefficient = if noEvent(correctionAngle < 1e-7) then 1.0 else sin(correctionAngle)/max(correctionAngle,1e-12);\r
  cosineCoefficient = if noEvent(correctionAngle < 1e-7) then 0.5 else (1.0-cos(correctionAngle))/max(correctionAngle^2,1e-12);\r
  resetCoefficient = if noEvent(correctionAngle < 1e-6) then 1.0/6.0 else (correctionAngle-sin(correctionAngle))/max(correctionAngle^3,1e-18);\r
  skewCorrectionSquared = skewCorrection*skewCorrection;\r
  increment = identity(spaceDimension)+sineCoefficient*skewCorrection+cosineCoefficient*skewCorrectionSquared;\r
  injectedRotation = rotation*increment;\r
  // Only current right-local attitude is reset; frozen reference tangent is unchanged.\r
  reset = cat(1,\r
    cat(2,identity(6),zeros(6,15)),\r
    cat(2,zeros(3,6),identity(3)-cosineCoefficient*skewCorrection\r
      +resetCoefficient*skewCorrectionSquared,zeros(3,12)),\r
    cat(2,zeros(12,9),identity(12)));\r
  resetCovariance = reset*joseph*transpose(reset);\r
  for i in 1:augmentedDimension loop\r
    for j in 1:augmentedDimension loop\r
      finiteChecks[i,j] = if noEvent(abs(resetCovariance[i,j]) <= 1e12) then 0.0 else 1.0;\r
    end for;\r
  end for;\r
  for i in 1:spaceDimension loop\r
    geometryChecks[i] = if noEvent(abs(position[i]) <= 1e6 and abs(referencePosition[i]) <= 1e6\r
      and abs(velocity[i]) <= 1e6 and abs(cameraOriginBody[i]) <= 10.0\r
      and abs(measuredTranslation[i]) <= 1e6 and abs(correction[i]) <= 1e6\r
      and abs(correction[i+3]) <= 1e6\r
      and abs(accelBias[i]+correction[i+9]) <= 2.0\r
      and abs(gyroBias[i]+correction[i+12]) <= 0.3) then 0.0 else 1.0;\r
  end for;\r
  accepted = if noEvent(measurementEnabled >= 1.0 and measurementEnabled <= 1.0\r
    and maximumNis > 0.0 and maximumNis <= 1e6\r
    and maximumAngularInnovation > 0.0 and maximumAngularInnovation <= 1.0\r
    and currentCheck.valid > 0.5 and referenceCheck.valid > 0.5\r
    and extrinsicsCheck.valid > 0.5 and measuredCheck.valid > 0.5 and logarithm.valid > 0.5\r
    and priorCheck.valid > 0.5 and noiseCheck.valid > 0.5 and solve.valid > 0.5\r
    and nis >= 0.0 and nis <= maximumNis and logarithm.angle <= maximumAngularInnovation\r
    and sum(finiteChecks) < 0.5 and sum(geometryChecks) < 0.5) then 1.0 else 0.0;\r
  nextPosition = if noEvent(accepted > 0.5) then position+correction[1:3] else position;\r
  nextVelocity = if noEvent(accepted > 0.5) then velocity+correction[4:6] else velocity;\r
  nextRotation = if noEvent(accepted > 0.5) then injectedRotation else rotation;\r
  nextAccelBias = if noEvent(accepted > 0.5) then accelBias+correction[10:12] else accelBias;\r
  nextGyroBias = if noEvent(accepted > 0.5) then gyroBias+correction[13:15] else gyroBias;\r
  for i in 1:errorDimension loop\r
    for j in 1:errorDimension loop\r
      nextCovariance[i,j] = if noEvent(accepted > 0.5) then\r
        0.5*(resetCovariance[i,j]+resetCovariance[j,i]) else covariance[i,j];\r
    end for;\r
    for j in 1:poseDimension loop\r
      nextCrossCovariance[i,j] = if noEvent(accepted > 0.5) then\r
        resetCovariance[i,errorDimension+j] else crossCovariance[i,j];\r
    end for;\r
  end for;\r
  // Schmidt gain/reset leave this block and the retained reference pose unchanged.\r
  nextReferenceCovariance = referenceCovariance;\r
end SchmidtRelativePoseCorrection;\r
\r
// Exact ES15CorrectionSolve (SPD6Solve with pivot_floor=0) algorithm form.\r
// All original row formulas and RHS solve association are retained.\r
function SchmidtCorrectionSolve\r
  input Real pivot_floor = 0.0;\r
  input Real symmetry_absolute = 1e-12;\r
  input Real symmetry_relative = 1e-8;\r
  input Real A[poseDimension,poseDimension] = identity(poseDimension);\r
  input Real B[poseDimension,rhsDimension] = fill(0.0,poseDimension,rhsDimension);\r
  output Real X[poseDimension,rhsDimension];\r
  output Real valid;\r
protected\r
  constant Integer poseDimension = 6;\r
  constant Integer rhsDimension = 16;\r
  Real L[poseDimension,poseDimension]; Real pivot[poseDimension]; Real Z[poseDimension,rhsDimension]; Real solution[poseDimension,rhsDimension];\r
  Real symmetryChecks[poseDimension,poseDimension]; Real symmetry_errors;\r
algorithm\r
  for i in 1:poseDimension loop\r
    for j in 1:poseDimension loop\r
      symmetryChecks[i,j] := if noEvent(abs(A[i,j]-A[j,i]) <=\r
        symmetry_absolute+symmetry_relative*abs(A[j,i])) then 0.0 else 1.0;\r
    end for;\r
  end for;\r
  symmetry_errors := sum(symmetryChecks[i,j] for i in 1:poseDimension, j in 1:poseDimension);\r
  pivot[1] := A[1,1]-(0.0);\r
  L[1,1] := sqrt(if noEvent(pivot[1] > pivot_floor) then pivot[1] else 1.0);\r
  L[1,2] := 0.0;\r
  L[1,3] := 0.0;\r
  L[1,4] := 0.0;\r
  L[1,5] := 0.0;\r
  L[1,6] := 0.0;\r
  L[2,1] := (A[2,1]-(0.0))/L[1,1];\r
  pivot[2] := A[2,2]-(L[2,1]*L[2,1]);\r
  L[2,2] := sqrt(if noEvent(pivot[2] > pivot_floor) then pivot[2] else 1.0);\r
  L[2,3] := 0.0;\r
  L[2,4] := 0.0;\r
  L[2,5] := 0.0;\r
  L[2,6] := 0.0;\r
  L[3,1] := (A[3,1]-(0.0))/L[1,1];\r
  L[3,2] := (A[3,2]-(L[3,1]*L[2,1]))/L[2,2];\r
  pivot[3] := A[3,3]-(L[3,1]*L[3,1]+L[3,2]*L[3,2]);\r
  L[3,3] := sqrt(if noEvent(pivot[3] > pivot_floor) then pivot[3] else 1.0);\r
  L[3,4] := 0.0;\r
  L[3,5] := 0.0;\r
  L[3,6] := 0.0;\r
  L[4,1] := (A[4,1]-(0.0))/L[1,1];\r
  L[4,2] := (A[4,2]-(L[4,1]*L[2,1]))/L[2,2];\r
  L[4,3] := (A[4,3]-(L[4,1]*L[3,1]+L[4,2]*L[3,2]))/L[3,3];\r
  pivot[4] := A[4,4]-(L[4,1]*L[4,1]+L[4,2]*L[4,2]+L[4,3]*L[4,3]);\r
  L[4,4] := sqrt(if noEvent(pivot[4] > pivot_floor) then pivot[4] else 1.0);\r
  L[4,5] := 0.0;\r
  L[4,6] := 0.0;\r
  L[5,1] := (A[5,1]-(0.0))/L[1,1];\r
  L[5,2] := (A[5,2]-(L[5,1]*L[2,1]))/L[2,2];\r
  L[5,3] := (A[5,3]-(L[5,1]*L[3,1]+L[5,2]*L[3,2]))/L[3,3];\r
  L[5,4] := (A[5,4]-(L[5,1]*L[4,1]+L[5,2]*L[4,2]+L[5,3]*L[4,3]))/L[4,4];\r
  pivot[5] := A[5,5]-(L[5,1]*L[5,1]+L[5,2]*L[5,2]+L[5,3]*L[5,3]+L[5,4]*L[5,4]);\r
  L[5,5] := sqrt(if noEvent(pivot[5] > pivot_floor) then pivot[5] else 1.0);\r
  L[5,6] := 0.0;\r
  L[6,1] := (A[6,1]-(0.0))/L[1,1];\r
  L[6,2] := (A[6,2]-(L[6,1]*L[2,1]))/L[2,2];\r
  L[6,3] := (A[6,3]-(L[6,1]*L[3,1]+L[6,2]*L[3,2]))/L[3,3];\r
  L[6,4] := (A[6,4]-(L[6,1]*L[4,1]+L[6,2]*L[4,2]+L[6,3]*L[4,3]))/L[4,4];\r
  L[6,5] := (A[6,5]-(L[6,1]*L[5,1]+L[6,2]*L[5,2]+L[6,3]*L[5,3]+L[6,4]*L[5,4]))/L[5,5];\r
  pivot[6] := A[6,6]-(L[6,1]*L[6,1]+L[6,2]*L[6,2]+L[6,3]*L[6,3]+L[6,4]*L[6,4]+L[6,5]*L[6,5]);\r
  L[6,6] := sqrt(if noEvent(pivot[6] > pivot_floor) then pivot[6] else 1.0);\r
  valid := if noEvent(symmetry_errors < 0.5 and\r
    pivot[1] > pivot_floor and pivot[2] > pivot_floor and pivot[3] > pivot_floor and pivot[4] > pivot_floor and pivot[5] > pivot_floor and pivot[6] > pivot_floor) then 1.0 else 0.0;\r
  for column in 1:rhsDimension loop\r
    Z[1,column] := (B[1,column]-(0.0))/L[1,1];\r
    Z[2,column] := (B[2,column]-(L[2,1]*Z[1,column]))/L[2,2];\r
    Z[3,column] := (B[3,column]-(L[3,1]*Z[1,column]+L[3,2]*Z[2,column]))/L[3,3];\r
    Z[4,column] := (B[4,column]-(L[4,1]*Z[1,column]+L[4,2]*Z[2,column]+L[4,3]*Z[3,column]))/L[4,4];\r
    Z[5,column] := (B[5,column]-(L[5,1]*Z[1,column]+L[5,2]*Z[2,column]+L[5,3]*Z[3,column]+L[5,4]*Z[4,column]))/L[5,5];\r
    Z[6,column] := (B[6,column]-(L[6,1]*Z[1,column]+L[6,2]*Z[2,column]+L[6,3]*Z[3,column]+L[6,4]*Z[4,column]+L[6,5]*Z[5,column]))/L[6,6];\r
    solution[6,column] := (Z[6,column]-(0.0))/L[6,6];\r
    solution[5,column] := (Z[5,column]-(L[6,5]*solution[6,column]))/L[5,5];\r
    solution[4,column] := (Z[4,column]-(L[5,4]*solution[5,column]+L[6,4]*solution[6,column]))/L[4,4];\r
    solution[3,column] := (Z[3,column]-(L[4,3]*solution[4,column]+L[5,3]*solution[5,column]+L[6,3]*solution[6,column]))/L[3,3];\r
    solution[2,column] := (Z[2,column]-(L[3,2]*solution[3,column]+L[4,2]*solution[4,column]+L[5,2]*solution[5,column]+L[6,2]*solution[6,column]))/L[2,2];\r
    solution[1,column] := (Z[1,column]-(L[2,1]*solution[2,column]+L[3,1]*solution[3,column]+L[4,1]*solution[4,column]+L[5,1]*solution[5,column]+L[6,1]*solution[6,column]))/L[1,1];\r
    for i in 1:poseDimension loop\r
      X[i,column] := if noEvent(valid > 0.5) then solution[i,column] else 0.0;\r
    end for;\r
  end for;\r
end SchmidtCorrectionSolve;\r
\r
// Pure full15+6 Schmidt correction. Rejection preserves the complete input state;\r
// diagnostic arithmetic and all original gates remain observable on rejection.\r
function SchmidtCorrectRelativePose\r
\r
  input Real position[spaceDimension] = zeros(spaceDimension);\r
  input Real velocity[spaceDimension] = zeros(spaceDimension);\r
  input Real rotation[spaceDimension,spaceDimension] = identity(spaceDimension);\r
  input Real accelBias[spaceDimension] = zeros(spaceDimension);\r
  input Real gyroBias[spaceDimension] = zeros(spaceDimension);\r
  input Real covariance[errorDimension,errorDimension] = identity(errorDimension);\r
  input Real referencePosition[spaceDimension] = zeros(spaceDimension);\r
  input Real referenceRotation[spaceDimension,spaceDimension] = identity(spaceDimension);\r
  input Real referenceCovariance[poseDimension,poseDimension] = identity(poseDimension);\r
  input Real crossCovariance[errorDimension,poseDimension] = zeros(errorDimension,poseDimension);\r
  input Real opticalToBody[spaceDimension,spaceDimension] = [0.0,0.0,1.0;-1.0,0.0,0.0;0.0,-1.0,0.0];\r
  input Real cameraOriginBody[spaceDimension] = {0.18,0.0,-0.04};\r
  input Real measuredRotation[spaceDimension,spaceDimension] = identity(spaceDimension);\r
  input Real measuredTranslation[spaceDimension] = zeros(spaceDimension);\r
  input Real relativeCovariance[poseDimension,poseDimension] = identity(poseDimension);\r
  input Real measurementEnabled = 0.0;\r
  input Real maximumNis = 22.46;\r
  input Real maximumAngularInnovation = 0.35;\r
  output Real accepted;\r
  output Real nis;\r
  output Real innovation[poseDimension];\r
  output Real measurementJacobian[poseDimension,augmentedDimension];\r
  output Real innovationCovariance[poseDimension,poseDimension];\r
  output Real nextPosition[spaceDimension];\r
  output Real nextVelocity[spaceDimension];\r
  output Real nextRotation[spaceDimension,spaceDimension];\r
  output Real nextAccelBias[spaceDimension];\r
  output Real nextGyroBias[spaceDimension];\r
  output Real nextCovariance[errorDimension,errorDimension];\r
  output Real nextCrossCovariance[errorDimension,poseDimension];\r
  output Real nextReferenceCovariance[poseDimension,poseDimension];\r
protected\r
  constant Integer spaceDimension = 3;\r
  constant Integer errorDimension = 15;\r
  constant Integer poseDimension = 2*spaceDimension;\r
  constant Integer augmentedDimension = errorDimension+poseDimension;\r
  Real currentCameraTranspose[spaceDimension,spaceDimension];\r
  Real displacementBody[spaceDimension];\r
  Real predictedRotation[spaceDimension,spaceDimension];\r
  Real predictedTranslation[spaceDimension];\r
  Real logarithmVector[spaceDimension]; Real logarithmAngle; Real logarithmValid; Real logarithmQuaternion[4];\r
  Real skewDisplacement[spaceDimension,spaceDimension];\r
  Real skewOrigin[spaceDimension,spaceDimension];\r
  Real skewInnovation[spaceDimension,spaceDimension];\r
  Real inverseLeft[spaceDimension,spaceDimension];\r
  Real inverseRight[spaceDimension,spaceDimension];\r
  Real jacobianCoefficient;\r
  Real currentTranslationAngle[spaceDimension,spaceDimension];\r
  Real referenceTranslationAngle[spaceDimension,spaceDimension];\r
  Real currentRotationAngle[spaceDimension,spaceDimension];\r
  Real referenceRotationAngle[spaceDimension,spaceDimension];\r
  Real noiseMap[poseDimension,poseDimension];\r
  Real noiseRotation[spaceDimension,spaceDimension];\r
  Real noise[poseDimension,poseDimension];\r
  Real prior[augmentedDimension,augmentedDimension];\r
  // The component's default dimension is exactly21. Rebinding it to an equal\r
  // constant would introduce an unnecessary parameter-initialization owner.\r
  Real priorCheckValid;\r
  Real noiseCheckValid; Real noiseSolution[poseDimension,errorDimension+1];\r
  Real cross[augmentedDimension,poseDimension];\r
  Real rhs[poseDimension,errorDimension+1];\r
  Real solveValid; Real solved[poseDimension,errorDimension+1];\r
  Real gain[augmentedDimension,poseDimension];\r
  Real correction[errorDimension];\r
  Real residualMap[augmentedDimension,augmentedDimension];\r
  Real joseph[augmentedDimension,augmentedDimension];\r
  Real reset[augmentedDimension,augmentedDimension];\r
  Real resetCovariance[augmentedDimension,augmentedDimension];\r
  Real injectedRotation[spaceDimension,spaceDimension];\r
  Real increment[spaceDimension,spaceDimension];\r
  Real skewCorrection[spaceDimension,spaceDimension];\r
  Real correctionAngle;\r
  Real sineCoefficient;\r
  Real cosineCoefficient;\r
  Real resetCoefficient;\r
  Real skewCorrectionSquared[spaceDimension,spaceDimension];\r
  Real finiteChecks[augmentedDimension,augmentedDimension];\r
  Real geometryChecks[spaceDimension];\r
  Real currentValid; Real referenceValid; Real extrinsicsValid; Real measuredValid;\r
algorithm\r
  currentValid := RGBDProperRotationValue(rotation);\r
  referenceValid := RGBDProperRotationValue(referenceRotation);\r
  extrinsicsValid := RGBDProperRotationValue(opticalToBody);\r
  measuredValid := RGBDProperRotationValue(measuredRotation);\r
  (noiseSolution,noiseCheckValid) := SchmidtCorrectionSolve(A=relativeCovariance,B=zeros(poseDimension,errorDimension+1));\r
  currentCameraTranspose := transpose(opticalToBody)*transpose(rotation);\r
  displacementBody := transpose(rotation)*(referencePosition-position+referenceRotation*cameraOriginBody);\r
  predictedRotation := currentCameraTranspose*referenceRotation*opticalToBody;\r
  predictedTranslation := transpose(opticalToBody)*(displacementBody-cameraOriginBody);\r
  (logarithmVector,logarithmAngle,logarithmValid,logarithmQuaternion) := SLAMRotationCoordinates(transpose(predictedRotation)*measuredRotation);\r
  innovation := cat(1,measuredTranslation-predictedTranslation,logarithmVector);\r
  skewDisplacement := [0.0,-displacementBody[3],displacementBody[2];displacementBody[3],0.0,-displacementBody[1];-displacementBody[2],displacementBody[1],0.0];\r
  skewOrigin := [0.0,-cameraOriginBody[3],cameraOriginBody[2];cameraOriginBody[3],0.0,-cameraOriginBody[1];-cameraOriginBody[2],cameraOriginBody[1],0.0];\r
  skewInnovation := [0.0,-innovation[6],innovation[5];innovation[6],0.0,-innovation[4];-innovation[5],innovation[4],0.0];\r
  jacobianCoefficient := if noEvent(logarithmAngle < 1e-4) then\r
      1.0/12.0+logarithmAngle^2/720.0\r
    else (1.0-0.5*logarithmAngle*cos(0.5*logarithmAngle)/max(sin(0.5*logarithmAngle),1e-12))/max(logarithmAngle^2,1e-12);\r
  inverseLeft := identity(spaceDimension)-0.5*skewInnovation+jacobianCoefficient*(skewInnovation*skewInnovation);\r
  inverseRight := identity(spaceDimension)+0.5*skewInnovation+jacobianCoefficient*(skewInnovation*skewInnovation);\r
  currentTranslationAngle := transpose(opticalToBody)*skewDisplacement;\r
  referenceTranslationAngle := -currentCameraTranspose*referenceRotation*skewOrigin;\r
  currentRotationAngle := -inverseLeft*transpose(predictedRotation)*transpose(opticalToBody);\r
  referenceRotationAngle := inverseLeft*transpose(opticalToBody);\r
  noiseRotation := inverseRight*transpose(measuredRotation);\r
  // Explicit blocks keep every coordinate valid even during structural projection.\r
  // H := -d(innovation)/d(error); columns are p,v,theta,ba,bg,p_ref,theta_ref.\r
  measurementJacobian := cat(1,\r
    cat(2,-currentCameraTranspose,zeros(3,3),currentTranslationAngle,\r
      zeros(3,6),currentCameraTranspose,referenceTranslationAngle),\r
    cat(2,zeros(3,6),currentRotationAngle,zeros(3,9),referenceRotationAngle));\r
  noiseMap := cat(1,cat(2,identity(3),zeros(3,3)),\r
    cat(2,zeros(3,3),noiseRotation));\r
  prior := cat(1,cat(2,covariance,crossCovariance),cat(2,transpose(crossCovariance),referenceCovariance));\r
  priorCheckValid := SLAMCovariancePSDCheck(prior,1e-12);\r
  cross := prior*transpose(measurementJacobian);\r
  noise := noiseMap*relativeCovariance*transpose(noiseMap);\r
  innovationCovariance := measurementJacobian*cross+noise;\r
  for i in 1:poseDimension loop\r
    for j in 1:errorDimension loop\r
      rhs[i,j] := cross[j,i];\r
    end for;\r
    rhs[i,errorDimension+1] := innovation[i];\r
  end for;\r
  (solved,solveValid) := SchmidtCorrectionSolve(A=innovationCovariance,B=rhs);\r
  // Schmidt gain: reference uncertainty enters S, but reference gain is zero.\r
  gain := cat(1,transpose(solved[:,1:errorDimension]),zeros(poseDimension,poseDimension));\r
  correction := gain[1:errorDimension,:]*innovation;\r
  nis := sum(innovation[i]*solved[i,errorDimension+1] for i in 1:poseDimension);\r
  residualMap := identity(augmentedDimension)-gain*measurementJacobian;\r
  joseph := residualMap*prior*transpose(residualMap)+gain*noise*transpose(gain);\r
  skewCorrection := [0.0,-correction[9],correction[8];correction[9],0.0,-correction[7];-correction[8],correction[7],0.0];\r
  correctionAngle := sqrt(sum(correction[i]^2 for i in 7:9));\r
  sineCoefficient := if noEvent(correctionAngle < 1e-7) then 1.0 else sin(correctionAngle)/max(correctionAngle,1e-12);\r
  cosineCoefficient := if noEvent(correctionAngle < 1e-7) then 0.5 else (1.0-cos(correctionAngle))/max(correctionAngle^2,1e-12);\r
  resetCoefficient := if noEvent(correctionAngle < 1e-6) then 1.0/6.0 else (correctionAngle-sin(correctionAngle))/max(correctionAngle^3,1e-18);\r
  skewCorrectionSquared := skewCorrection*skewCorrection;\r
  increment := identity(spaceDimension)+sineCoefficient*skewCorrection+cosineCoefficient*skewCorrectionSquared;\r
  injectedRotation := rotation*increment;\r
  // Only current right-local attitude is reset; frozen reference tangent is unchanged.\r
  reset := cat(1,\r
    cat(2,identity(6),zeros(6,15)),\r
    cat(2,zeros(3,6),identity(3)-cosineCoefficient*skewCorrection\r
      +resetCoefficient*skewCorrectionSquared,zeros(3,12)),\r
    cat(2,zeros(12,9),identity(12)));\r
  resetCovariance := reset*joseph*transpose(reset);\r
  for i in 1:augmentedDimension loop\r
    for j in 1:augmentedDimension loop\r
      finiteChecks[i,j] := if noEvent(abs(resetCovariance[i,j]) <= 1e12) then 0.0 else 1.0;\r
    end for;\r
  end for;\r
  for i in 1:spaceDimension loop\r
    geometryChecks[i] := if noEvent(abs(position[i]) <= 1e6 and abs(referencePosition[i]) <= 1e6\r
      and abs(velocity[i]) <= 1e6 and abs(cameraOriginBody[i]) <= 10.0\r
      and abs(measuredTranslation[i]) <= 1e6 and abs(correction[i]) <= 1e6\r
      and abs(correction[i+3]) <= 1e6\r
      and abs(accelBias[i]+correction[i+9]) <= 2.0\r
      and abs(gyroBias[i]+correction[i+12]) <= 0.3) then 0.0 else 1.0;\r
  end for;\r
  accepted := if noEvent(measurementEnabled >= 1.0 and measurementEnabled <= 1.0\r
    and maximumNis > 0.0 and maximumNis <= 1e6\r
    and maximumAngularInnovation > 0.0 and maximumAngularInnovation <= 1.0\r
    and currentValid > 0.5 and referenceValid > 0.5\r
    and extrinsicsValid > 0.5 and measuredValid > 0.5 and logarithmValid > 0.5\r
    and priorCheckValid > 0.5 and noiseCheckValid > 0.5 and solveValid > 0.5\r
    and nis >= 0.0 and nis <= maximumNis and logarithmAngle <= maximumAngularInnovation\r
    and sum(finiteChecks) < 0.5 and sum(geometryChecks) < 0.5) then 1.0 else 0.0;\r
  nextPosition := if noEvent(accepted > 0.5) then position+correction[1:3] else position;\r
  nextVelocity := if noEvent(accepted > 0.5) then velocity+correction[4:6] else velocity;\r
  nextRotation := if noEvent(accepted > 0.5) then injectedRotation else rotation;\r
  nextAccelBias := if noEvent(accepted > 0.5) then accelBias+correction[10:12] else accelBias;\r
  nextGyroBias := if noEvent(accepted > 0.5) then gyroBias+correction[13:15] else gyroBias;\r
  for i in 1:errorDimension loop\r
    for j in 1:errorDimension loop\r
      nextCovariance[i,j] := if noEvent(accepted > 0.5) then\r
        0.5*(resetCovariance[i,j]+resetCovariance[j,i]) else covariance[i,j];\r
    end for;\r
    for j in 1:poseDimension loop\r
      nextCrossCovariance[i,j] := if noEvent(accepted > 0.5) then\r
        resetCovariance[i,errorDimension+j] else crossCovariance[i,j];\r
    end for;\r
  end for;\r
  // Schmidt gain/reset leave this block and the retained reference pose unchanged.\r
  nextReferenceCovariance := referenceCovariance;\r
end SchmidtCorrectRelativePose;\r
`;export{n as default};
