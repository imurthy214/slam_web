const n=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Conditional first-order uncertainty of the UNWEIGHTED point-to-point fit.\r
// Optical RDF perturbation: delta y = delta t - skew(R*p_ref)*delta theta.\r
// No correspondence changes, reference-pose uncertainty or cross-pair covariance\r
// are modeled.\r
function RGBDUncertaintySkew\r
  input Real v[3];\r
  output Real S[3,3];\r
algorithm\r
  S := {{0.0,-v[3],v[2]},{v[3],0.0,-v[1]},{-v[2],v[1],0.0}};\r
end RGBDUncertaintySkew;\r
\r
function RGBDUncertaintyProper\r
  input Real R[3,3];\r
  output Boolean valid;\r
protected\r
  Real gram[3,3]; Real determinant;\r
algorithm\r
  valid := true;\r
  for a in 1:3 loop\r
    for b in 1:3 loop\r
      valid := valid and abs(R[a,b]) <= 1.000001;\r
    end for;\r
  end for;\r
  if valid then\r
    gram := transpose(R)*R;\r
    for a in 1:3 loop\r
      for b in 1:3 loop\r
        valid := valid and abs(gram[a,b]-(if a == b then 1.0 else 0.0)) <= 1e-6;\r
      end for;\r
    end for;\r
    determinant := R[1,1]*(R[2,2]*R[3,3]-R[2,3]*R[3,2])\r
      -R[1,2]*(R[2,1]*R[3,3]-R[2,3]*R[3,1])\r
      +R[1,3]*(R[2,1]*R[3,2]-R[2,2]*R[3,1]);\r
    valid := valid and abs(determinant-1.0) <= 1e-6;\r
  end if;\r
end RGBDUncertaintyProper;\r
\r
// SPD solve with dimensionless diagonal equilibration, no damping/floor added\r
// to the matrix. A small or nonfinite pivot is a refusal, not invented noise.\r
function RGBDUncertaintyInverse6\r
  input Real A[6,6];\r
  input Real minimumPivot;\r
  output Real inverseA[6,6];\r
  output Boolean valid;\r
  output Real minimumScaledPivot;\r
protected\r
  Real scale[6]; Real L[6,6]; Real v; Real z[6]; Real x[6];\r
algorithm\r
  inverseA := zeros(6,6); L := zeros(6,6); scale := ones(6);\r
  minimumScaledPivot := 1.0; valid := true;\r
  for i in 1:6 loop\r
    valid := valid and A[i,i] > 0.0 and A[i,i] <= 1e100;\r
    scale[i] := sqrt(if A[i,i] > 0.0 and A[i,i] <= 1e100 then A[i,i] else 1.0);\r
    for j in 1:6 loop\r
      valid := valid and abs(A[i,j]) <= 1e100\r
        and abs(A[i,j]-A[j,i]) <= 1e-10*max(1.0,abs(A[i,j]));\r
    end for;\r
  end for;\r
  for i in 1:6 loop\r
    for j in 1:6 loop\r
      if j <= i then\r
        v := if valid then A[i,j]/scale[i]/scale[j] else 0.0;\r
        for k in 1:6 loop\r
          v := v-(if k < j then L[i,k]*L[j,k] else 0.0);\r
        end for;\r
        if j == i then\r
          minimumScaledPivot := min(minimumScaledPivot,v);\r
          valid := valid and v > minimumPivot and v <= 1e100;\r
          L[i,j] := sqrt(if valid then v else 1.0);\r
        else\r
          L[i,j] := if valid then v/L[j,j] else 0.0;\r
        end if;\r
      end if;\r
    end for;\r
  end for;\r
  for column in 1:6 loop\r
    z := zeros(6); x := zeros(6);\r
    for i in 1:6 loop\r
      v := if i == column then 1.0/scale[column] else 0.0;\r
      for k in 1:6 loop\r
        v := v-(if k < i then L[i,k]*z[k] else 0.0);\r
      end for;\r
      z[i] := if valid then v/L[i,i] else 0.0;\r
    end for;\r
    for index in 1:6 loop\r
      v := z[7-index];\r
      for k in 1:6 loop\r
        v := v-(if k > 7-index then L[k,7-index]*x[k] else 0.0);\r
      end for;\r
      x[7-index] := if valid then v/L[7-index,7-index] else 0.0;\r
    end for;\r
    for i in 1:6 loop\r
      inverseA[i,column] := if valid then x[i]/scale[i] else 0.0;\r
    end for;\r
  end for;\r
  inverseA := if valid then inverseA else zeros(6,6);\r
end RGBDUncertaintyInverse6;\r
\r
function RGBDOpticalPointCovariance\r
  input Real p[3];\r
  input Real rgbFx; input Real rgbFy;\r
  input Real localizationSigma; input Real disparitySigma;\r
  input Real noiseReferenceFx; input Real baseline;\r
  input Real depthInflation;\r
  output Real covariance[3,3];\r
protected\r
  Real bearing[3]; Real depthSigma;\r
algorithm\r
  bearing := {p[1]/p[3],p[2]/p[3],1.0};\r
  // No reduction by interpolation neighbor count: correlated disparity bound.\r
  depthSigma := depthInflation*p[3]*p[3]*disparitySigma/noiseReferenceFx/baseline;\r
  for a in 1:3 loop\r
    for b in 1:3 loop\r
      covariance[a,b] := bearing[a]*bearing[b]*depthSigma*depthSigma;\r
    end for;\r
  end for;\r
  covariance[1,1] := covariance[1,1]+(p[3]*localizationSigma/rgbFx)^2;\r
  covariance[2,2] := covariance[2,2]+(p[3]*localizationSigma/rgbFy)^2;\r
end RGBDOpticalPointCovariance;\r
\r
function RGBDRegistrationSandwich\r
\r
  input Real referencePoint[:,:]; input Real currentPoint[:,:];\r
  input Real pairEnabled[:]; input Real activeCount; input Real registrationAccepted;\r
  input Real currentFromReference[3,3]; input Real translation[3];\r
  input Real referenceBodyRotation[3,3]; input Real opticalToBody[3,3];\r
  input Real cameraOriginBody[3];\r
  input Real referenceRgbFocal[2]; input Real currentRgbFocal[2];\r
  input Real referenceNoiseFx; input Real currentNoiseFx; input Real baseline;\r
  input Real localizationSigma; input Real disparitySigma; input Real depthInflation;\r
  input Real coordinateLimit; input Real minimumPivot;\r
  output Real valid; output Real rejectionReason;\r
  output Real validCount; output Real invalidCount;\r
  output Real relativeCovariance[6,6]; output Real observationCovariance[6,6];\r
  output Real normalMatrix[6,6]; output Real noiseMatrix[6,6];\r
  output Real observationJacobian[6,6]; output Real minimumScaledPivot;\r
  input Boolean weighted = false "Must match the registration estimator; legacy Euclidean sandwich remains explicit";\r
protected\r
  Boolean configuration; Boolean pose; Boolean pointValid; Boolean hValid; Boolean cValid;\r
  Boolean whiteningValid; Real wr[3]; Real wj[3,6];\r
  Real q[3]; Real J[3,6]; Real Sigma[3,3]; Real Cref[3,3]; Real Ccur[3,3];\r
  Real Hinv[6,6]; Real unusedInverse[6,6]; Real unusedPivot;\r
  Real cameraRotation[3,3]; Real arm[3]; Real skewArm[3,3]; Real rotationBlock[3,3];\r
  Real candidateRelative[6,6]; Real candidateObservation[6,6];\r
algorithm\r
  valid := 0.0; validCount := 0.0; invalidCount := 0.0;\r
  normalMatrix := zeros(6,6); noiseMatrix := zeros(6,6);\r
  relativeCovariance := zeros(6,6); observationCovariance := zeros(6,6);\r
  observationJacobian := zeros(6,6); minimumScaledPivot := 0.0;\r
  configuration := activeCount >= 0.0 and activeCount <= size(pairEnabled,1)\r
    and floor(activeCount) == activeCount and size(referencePoint,1) == size(pairEnabled,1)\r
    and size(currentPoint,1) == size(pairEnabled,1) and size(referencePoint,2) == 3 and size(currentPoint,2) == 3\r
    and baseline > 0.0 and baseline <= 1.0 and localizationSigma > 0.0 and localizationSigma <= 10.0\r
    and disparitySigma > 0.0 and disparitySigma <= 10.0 and depthInflation >= 1.0 and depthInflation <= 100.0\r
    and referenceNoiseFx > 0.0 and referenceNoiseFx <= 1e6 and currentNoiseFx > 0.0 and currentNoiseFx <= 1e6\r
    and coordinateLimit > 0.0 and coordinateLimit <= 1e4 and minimumPivot > 0.0 and minimumPivot < 1.0;\r
  for k in 1:2 loop\r
    configuration := configuration and referenceRgbFocal[k] > 0.0 and referenceRgbFocal[k] <= 1e6\r
      and currentRgbFocal[k] > 0.0 and currentRgbFocal[k] <= 1e6;\r
  end for;\r
  pose := registrationAccepted == 1.0 and RGBDUncertaintyProper(currentFromReference)\r
    and RGBDUncertaintyProper(referenceBodyRotation) and RGBDUncertaintyProper(opticalToBody);\r
  for k in 1:3 loop\r
    pose := pose and abs(translation[k]) <= coordinateLimit and abs(cameraOriginBody[k]) <= coordinateLimit;\r
  end for;\r
  for i in 1:size(pairEnabled,1) loop\r
    pointValid := configuration and i <= activeCount and pairEnabled[i] == 1.0;\r
    for k in 1:3 loop\r
      pointValid := pointValid and abs(referencePoint[i,k]) <= coordinateLimit and abs(currentPoint[i,k]) <= coordinateLimit;\r
    end for;\r
    pointValid := pointValid and referencePoint[i,3] > 0.0 and currentPoint[i,3] > 0.0;\r
    invalidCount := invalidCount+(if i <= activeCount and pairEnabled[i] <> 0.0 and not pointValid then 1.0 else 0.0);\r
    validCount := validCount+(if pointValid then 1.0 else 0.0);\r
    if pointValid and pose then\r
      q := currentFromReference*referencePoint[i,:];\r
      J := zeros(3,6);\r
      J[:,1:3] := identity(3); J[:,4:6] := -RGBDUncertaintySkew(q);\r
      Cref := RGBDOpticalPointCovariance(referencePoint[i,:],referenceRgbFocal[1],referenceRgbFocal[2],\r
        localizationSigma,disparitySigma,referenceNoiseFx,baseline,depthInflation);\r
      Ccur := RGBDOpticalPointCovariance(currentPoint[i,:],currentRgbFocal[1],currentRgbFocal[2],\r
        localizationSigma,disparitySigma,currentNoiseFx,baseline,depthInflation);\r
      Sigma := Ccur+currentFromReference*Cref*transpose(currentFromReference);\r
      if weighted then\r
        (whiteningValid,wr,wj) := RegistrationWeighted.WeightedWhiten(Sigma,zeros(3),J,minimumPivot);\r
        if not whiteningValid then invalidCount := invalidCount+1; end if;\r
        normalMatrix := normalMatrix+transpose(wj)*wj;\r
        noiseMatrix := normalMatrix;\r
      else\r
        normalMatrix := normalMatrix+transpose(J)*J;\r
        noiseMatrix := noiseMatrix+transpose(J)*Sigma*J;\r
      end if;\r
    end if;\r
  end for;\r
  (Hinv,hValid,minimumScaledPivot) := RGBDUncertaintyInverse6(normalMatrix,minimumPivot);\r
  candidateRelative := Hinv*noiseMatrix*transpose(Hinv);\r
  cameraRotation := if pose then referenceBodyRotation*opticalToBody*transpose(currentFromReference) else identity(3);\r
  arm := if pose then translation+transpose(opticalToBody)*cameraOriginBody else zeros(3);\r
  skewArm := RGBDUncertaintySkew(arm); rotationBlock := -cameraRotation*skewArm;\r
  for a in 1:3 loop\r
    for b in 1:3 loop\r
      observationJacobian[a,b] := -cameraRotation[a,b];\r
      observationJacobian[a,b+3] := rotationBlock[a,b];\r
      observationJacobian[a+3,b+3] := if pose then -opticalToBody[a,b] else 0.0;\r
    end for;\r
  end for;\r
  candidateObservation := observationJacobian*candidateRelative*transpose(observationJacobian);\r
  (unusedInverse,cValid,unusedPivot) := RGBDUncertaintyInverse6(candidateObservation,minimumPivot);\r
  rejectionReason := if not configuration then 1.0 else if not pose then 2.0 else if invalidCount > 0.0 then 3.0\r
    else if validCount < 3.0 then 4.0 else if not hValid then 5.0 else if not cValid then 6.0 else 0.0;\r
  valid := if rejectionReason == 0.0 then 1.0 else 0.0;\r
  relativeCovariance := if valid > 0.5 then candidateRelative else zeros(6,6);\r
  observationCovariance := if valid > 0.5 then candidateObservation else zeros(6,6);\r
end RGBDRegistrationSandwich;\r
\r
model RGBDRegistrationUncertainty\r
\r
  parameter Integer capacity = 350;\r
  parameter Real coordinateLimit = 100.0;\r
  parameter Real minimumPivot = 1e-10;\r
  parameter Real localizationSigma = 0.5;\r
  parameter Real disparitySigma = 0.1;\r
  parameter Real depthInflation = 1.0;\r
  input Real referencePoint[capacity,3] = zeros(capacity,3);\r
  input Real currentPoint[capacity,3] = zeros(capacity,3);\r
  input Real pairEnabled[capacity] = zeros(capacity);\r
  input Real activeCount = 0.0;\r
  input Real registrationAccepted = 0.0;\r
  input Real currentFromReference[3,3] = identity(3);\r
  input Real translation[3] = zeros(3);\r
  input Real referenceBodyRotation[3,3] = identity(3);\r
  input Real opticalToBody[3,3] = [0.0,0.0,1.0;-1.0,0.0,0.0;0.0,-1.0,0.0];\r
  input Real cameraOriginBody[3] = {0.18,0.0,-0.04};\r
  input Real referenceRgbFocal[2] = {116.4,116.4};\r
  input Real currentRgbFocal[2] = {116.4,116.4};\r
  input Real referenceNoiseFx = 848.0/(2.0*tan(87.0*3.141592653589793/360.0));\r
  input Real currentNoiseFx = 848.0/(2.0*tan(87.0*3.141592653589793/360.0));\r
  input Real baseline = 0.05;\r
  output Real valid; output Real rejectionReason; output Real validCount; output Real invalidCount;\r
  output Real relativeCovariance[6,6]; output Real observationCovariance[6,6];\r
  output Real normalMatrix[6,6]; output Real noiseMatrix[6,6];\r
  output Real observationJacobian[6,6]; output Real minimumScaledPivot;\r
equation\r
  (valid,rejectionReason,validCount,invalidCount,relativeCovariance,observationCovariance,\r
    normalMatrix,noiseMatrix,observationJacobian,minimumScaledPivot) = RGBDRegistrationSandwich(\r
    referencePoint,currentPoint,pairEnabled,activeCount,registrationAccepted,currentFromReference,translation,\r
    referenceBodyRotation,opticalToBody,cameraOriginBody,referenceRgbFocal,currentRgbFocal,\r
    referenceNoiseFx,currentNoiseFx,baseline,localizationSigma,disparitySigma,depthInflation,coordinateLimit,minimumPivot);\r
end RGBDRegistrationUncertainty;\r
`;export{n as default};
