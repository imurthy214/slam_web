const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Finite proper rotation gate shared by models and held-IMU functions.\r
function RGBDProperRotationValue\r
  input Real rotation[3,3] = identity(3);\r
  output Real valid;\r
protected\r
  constant Integer dimension = 3;\r
  constant Real tolerance = 1e-6;\r
  Real gram[dimension,dimension];\r
  Real checks[dimension,dimension];\r
  Real determinant;\r
algorithm\r
  gram := transpose(rotation)*rotation;\r
  determinant := rotation[1,1]*(rotation[2,2]*rotation[3,3]-rotation[2,3]*rotation[3,2])\r
    - rotation[1,2]*(rotation[2,1]*rotation[3,3]-rotation[2,3]*rotation[3,1])\r
    + rotation[1,3]*(rotation[2,1]*rotation[3,2]-rotation[2,2]*rotation[3,1]);\r
  for i in 1:dimension loop\r
    for j in 1:dimension loop\r
      checks[i,j] := if abs(rotation[i,j]) <= 1.0+tolerance\r
        and abs(gram[i,j]-(if i == j then 1.0 else 0.0)) <= tolerance then 0.0 else 1.0;\r
    end for;\r
  end for;\r
  valid := if sum(checks) < 0.5 and abs(determinant-1.0) <= tolerance then 1.0 else 0.0;\r
end RGBDProperRotationValue;\r
\r
model RGBDProperRotation\r
\r
  constant Integer dimension = 3;\r
  input Real rotation[dimension,dimension] = identity(dimension);\r
  constant Real tolerance = 1e-6;\r
  output Real valid;\r
equation\r
  valid = RGBDProperRotationValue(rotation);\r
end RGBDProperRotation;\r
\r
// Convert accepted camera-frame registration to a map-frame BODY observation.\r
// The reference pose is the retained estimator/keyframe pose, never truth.\r
// Registration convention: currentPoint = currentFromReference * referencePoint\r
// + currentFromReferenceTranslation. Both point clouds use optical RDF axes.\r
// Camera extrinsics map optical coordinates into body FLU coordinates.\r
// This component composes a measurement; it does not estimate covariance,\r
// persist keyframes, reject dynamic objects, or implement loop closure.\r
model RGBDRelativePose\r
\r
  constant Integer dimension = 3;\r
  input Real referenceBodyRotation[dimension,dimension] = identity(dimension);\r
  input Real referenceBodyPosition[dimension] = zeros(dimension);\r
  input Real currentFromReference[dimension,dimension] = identity(dimension);\r
  input Real currentFromReferenceTranslation[dimension] = zeros(dimension);\r
  input Real opticalToBody[dimension,dimension] = [0.0,0.0,1.0;-1.0,0.0,0.0;0.0,-1.0,0.0];\r
  input Real cameraOriginBody[dimension] = {0.18,0.0,-0.04};\r
  input Real registrationAccepted = 0.0;\r
  output Real valid;\r
  output Real observedBodyRotation[dimension,dimension];\r
  output Real observedBodyPosition[dimension];\r
protected\r
  parameter Real coordinateLimit = 1e6;\r
  RGBDProperRotation referenceCheck(rotation=referenceBodyRotation);\r
  RGBDProperRotation registrationCheck(rotation=currentFromReference);\r
  RGBDProperRotation extrinsicsCheck(rotation=opticalToBody);\r
  Real positionChecks[dimension];\r
  Real referenceCameraRotation[dimension,dimension];\r
  Real referenceCameraPosition[dimension];\r
  Real currentCameraRotation[dimension,dimension];\r
  Real currentCameraPosition[dimension];\r
  Real proposedBodyRotation[dimension,dimension];\r
  Real proposedBodyPosition[dimension];\r
equation\r
  referenceCameraRotation = referenceBodyRotation*opticalToBody;\r
  referenceCameraPosition = referenceBodyPosition+referenceBodyRotation*cameraOriginBody;\r
  currentCameraRotation = referenceCameraRotation*transpose(currentFromReference);\r
  currentCameraPosition = referenceCameraPosition-currentCameraRotation*currentFromReferenceTranslation;\r
  proposedBodyRotation = currentCameraRotation*transpose(opticalToBody);\r
  proposedBodyPosition = currentCameraPosition-proposedBodyRotation*cameraOriginBody;\r
  for i in 1:dimension loop\r
    positionChecks[i] = if noEvent(abs(referenceBodyPosition[i]) <= coordinateLimit\r
      and abs(currentFromReferenceTranslation[i]) <= coordinateLimit\r
      and abs(cameraOriginBody[i]) <= coordinateLimit\r
      and abs(proposedBodyPosition[i]) <= coordinateLimit) then 0.0 else 1.0;\r
  end for;\r
  valid = if noEvent(registrationAccepted >= 1.0 and registrationAccepted <= 1.0\r
    and referenceCheck.valid > 0.5 and registrationCheck.valid > 0.5\r
    and extrinsicsCheck.valid > 0.5 and sum(positionChecks) < 0.5) then 1.0 else 0.0;\r
  observedBodyRotation = if noEvent(valid > 0.5) then proposedBodyRotation else identity(dimension);\r
  observedBodyPosition = if noEvent(valid > 0.5) then proposedBodyPosition else zeros(dimension);\r
end RGBDRelativePose;\r
\r
// Ordered callable equivalent of the unchanged equation model above.\r
// This preserves its optical reference->current transform and covariance chart.\r
function RGBDRelativeBodyPose\r
\r
  input Real referenceBodyRotation[3,3] = identity(3);\r
  input Real referenceBodyPosition[3] = zeros(3);\r
  input Real currentFromReference[3,3] = identity(3);\r
  input Real currentFromReferenceTranslation[3] = zeros(3);\r
  input Real opticalToBody[3,3] = [0.0,0.0,1.0;-1.0,0.0,0.0;0.0,-1.0,0.0];\r
  input Real cameraOriginBody[3] = {0.18,0.0,-0.04};\r
  input Real registrationAccepted = 0.0;\r
  output Real valid;\r
  output Real observedBodyRotation[3,3];\r
  output Real observedBodyPosition[3];\r
protected\r
  constant Real coordinateLimit = 1e6;\r
  Real referenceCameraRotation[3,3]; Real referenceCameraPosition[3];\r
  Real currentCameraRotation[3,3]; Real currentCameraPosition[3];\r
  Real proposedBodyRotation[3,3]; Real proposedBodyPosition[3];\r
  Real positionChecks;\r
algorithm\r
  referenceCameraRotation := referenceBodyRotation*opticalToBody;\r
  referenceCameraPosition := referenceBodyPosition+referenceBodyRotation*cameraOriginBody;\r
  currentCameraRotation := referenceCameraRotation*transpose(currentFromReference);\r
  currentCameraPosition := referenceCameraPosition-currentCameraRotation*currentFromReferenceTranslation;\r
  proposedBodyRotation := currentCameraRotation*transpose(opticalToBody);\r
  proposedBodyPosition := currentCameraPosition-proposedBodyRotation*cameraOriginBody;\r
  positionChecks := 0.0;\r
  for i in 1:3 loop\r
    if not (abs(referenceBodyPosition[i]) <= coordinateLimit\r
      and abs(currentFromReferenceTranslation[i]) <= coordinateLimit\r
      and abs(cameraOriginBody[i]) <= coordinateLimit\r
      and abs(proposedBodyPosition[i]) <= coordinateLimit) then\r
      positionChecks := positionChecks+1.0;\r
    end if;\r
  end for;\r
  valid := if registrationAccepted >= 1.0 and registrationAccepted <= 1.0\r
    and RGBDProperRotationValue(referenceBodyRotation) > 0.5\r
    and RGBDProperRotationValue(currentFromReference) > 0.5\r
    and RGBDProperRotationValue(opticalToBody) > 0.5 and positionChecks < 0.5 then 1.0 else 0.0;\r
  observedBodyRotation := if valid > 0.5 then proposedBodyRotation else identity(3);\r
  observedBodyPosition := if valid > 0.5 then proposedBodyPosition else zeros(3);\r
end RGBDRelativeBodyPose;\r
`;export{e as default};
