const n=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Finite proper rotation gate. Invalid entries never enter matrix arithmetic.\r
model RGBDLandmarkRotationCheck\r
  constant Integer dimension = 3;\r
  constant Real tolerance = 1e-6;\r
  input Real rotation[dimension,dimension] = identity(dimension);\r
  output Real valid;\r
protected\r
  Real safeRotation[dimension,dimension];\r
  Real entryChecks[dimension,dimension];\r
  Real gram[dimension,dimension];\r
  Real gramChecks[dimension,dimension];\r
  Real determinant;\r
equation\r
  for i in 1:dimension loop\r
    for j in 1:dimension loop\r
      entryChecks[i,j] = if noEvent(abs(rotation[i,j]) <= 1.0+tolerance) then 0.0 else 1.0;\r
      safeRotation[i,j] = if noEvent(entryChecks[i,j] < 0.5) then rotation[i,j] else 0.0;\r
      gramChecks[i,j] = if noEvent(abs(gram[i,j]-(if i == j then 1.0 else 0.0)) <= tolerance) then 0.0 else 1.0;\r
    end for;\r
  end for;\r
  gram = transpose(safeRotation)*safeRotation;\r
  determinant = safeRotation[1,1]*(safeRotation[2,2]*safeRotation[3,3]-safeRotation[2,3]*safeRotation[3,2])\r
    -safeRotation[1,2]*(safeRotation[2,1]*safeRotation[3,3]-safeRotation[2,3]*safeRotation[3,1])\r
    +safeRotation[1,3]*(safeRotation[2,1]*safeRotation[3,2]-safeRotation[2,2]*safeRotation[3,1]);\r
  valid = if noEvent(sum(entryChecks)+sum(gramChecks) < 0.5 and abs(determinant-1.0) <= tolerance) then 1.0 else 0.0;\r
end RGBDLandmarkRotationCheck;\r
\r
// Candidate coordinates only: no map persistence, pruning or SLAM lifecycle.\r
// Points are already calibrated optical RDF (right/down/forward). The supplied\r
// estimated body pose maps body FLU into world ENU; there is no truth input.\r
model RGBDLandmarkProjection\r
\r
  constant Integer featureCapacity = 350;\r
  constant Integer dimension = 3;\r
  parameter Real coordinateLimit = 1e6;\r
  input Real opticalPoint[featureCapacity,dimension];\r
  input Real enabled[featureCapacity];\r
  input Real activeCount = 0.0;\r
  input Real poseAccepted = 0.0;\r
  input Real bodyRotation[dimension,dimension] = identity(dimension);\r
  input Real bodyPosition[dimension] = zeros(dimension);\r
  input Real opticalToBody[dimension,dimension] = [0.0,0.0,1.0;-1.0,0.0,0.0;0.0,-1.0,0.0];\r
  input Real cameraOriginBody[dimension] = {0.18,0.0,-0.04};\r
  output Real worldPoint[featureCapacity,dimension];\r
  output Real landmarkEnabled[featureCapacity];\r
  output Real validCount;\r
  output Real invalidCount;\r
  output Real configurationValid;\r
  output Real poseValid;\r
protected\r
  RGBDLandmarkRotationCheck bodyCheck(rotation=bodyRotation);\r
  RGBDLandmarkRotationCheck cameraCheck(rotation=opticalToBody);\r
  Real poseChecks[dimension];\r
  Real pointChecks[featureCapacity,dimension];\r
  Real pointValid[featureCapacity];\r
  Real invalidChecks[featureCapacity];\r
  Real safeOptical[featureCapacity,dimension];\r
  Real safeBodyRotation[dimension,dimension];\r
  Real safeOpticalToBody[dimension,dimension];\r
  Real safeBodyPosition[dimension];\r
  Real safeCameraOrigin[dimension];\r
  Real cameraInBody[featureCapacity,dimension];\r
  Real proposedWorld[featureCapacity,dimension];\r
  Real outputChecks[featureCapacity,dimension];\r
equation\r
  configurationValid = if noEvent(activeCount >= 0.0 and activeCount <= featureCapacity\r
    and floor(activeCount) <= activeCount and floor(activeCount) >= activeCount\r
    and coordinateLimit > 0.0 and coordinateLimit <= 1e6) then 1.0 else 0.0;\r
  for k in 1:dimension loop\r
    poseChecks[k] = if noEvent(abs(bodyPosition[k]) <= coordinateLimit\r
      and abs(cameraOriginBody[k]) <= coordinateLimit) then 0.0 else 1.0;\r
  end for;\r
  poseValid = if noEvent(configurationValid > 0.5 and poseAccepted >= 1.0 and poseAccepted <= 1.0\r
    and bodyCheck.valid > 0.5 and cameraCheck.valid > 0.5 and sum(poseChecks) < 0.5) then 1.0 else 0.0;\r
  safeBodyRotation = if noEvent(poseValid > 0.5) then bodyRotation else identity(dimension);\r
  safeOpticalToBody = if noEvent(poseValid > 0.5) then opticalToBody else identity(dimension);\r
  safeBodyPosition = if noEvent(poseValid > 0.5) then bodyPosition else zeros(dimension);\r
  safeCameraOrigin = if noEvent(poseValid > 0.5) then cameraOriginBody else zeros(dimension);\r
  for i in 1:featureCapacity loop\r
    for k in 1:dimension loop\r
      pointChecks[i,k] = if noEvent(abs(opticalPoint[i,k]) <= coordinateLimit) then 0.0 else 1.0;\r
      safeOptical[i,k] = if noEvent(poseValid > 0.5 and pointValid[i] > 0.5) then opticalPoint[i,k] else 0.0;\r
      outputChecks[i,k] = if noEvent(abs(proposedWorld[i,k]) <= coordinateLimit) then 0.0 else 1.0;\r
      worldPoint[i,k] = if noEvent(landmarkEnabled[i] > 0.5) then proposedWorld[i,k] else 0.0;\r
    end for;\r
    pointValid[i] = if noEvent(configurationValid > 0.5 and i <= activeCount\r
      and enabled[i] >= 1.0 and enabled[i] <= 1.0 and sum(pointChecks[i,:]) < 0.5\r
      and opticalPoint[i,3] > 0.0) then 1.0 else 0.0;\r
    cameraInBody[i,:] = safeOpticalToBody*safeOptical[i,:]+safeCameraOrigin;\r
    proposedWorld[i,:] = safeBodyRotation*cameraInBody[i,:]+safeBodyPosition;\r
    landmarkEnabled[i] = if noEvent(poseValid > 0.5 and pointValid[i] > 0.5\r
      and sum(outputChecks[i,:]) < 0.5) then 1.0 else 0.0;\r
    invalidChecks[i] = if noEvent(i <= activeCount and not (enabled[i] >= 0.0 and enabled[i] <= 0.0)\r
      and pointValid[i] < 0.5) then 1.0 else 0.0;\r
  end for;\r
  validCount = sum(landmarkEnabled);\r
  invalidCount = sum(invalidChecks);\r
end RGBDLandmarkProjection;\r
\r
// Pure ordered equivalent of the equation rotation gate above. Invalid entries\r
// are replaced before Gram/determinant arithmetic; its tolerance is unchanged.\r
function RGBDLandmarkRotationValid\r
  input Real rotation[3,3];\r
  output Real valid;\r
protected\r
  constant Real tolerance = 1e-6;\r
  Real safeRotation[3,3]; Real gram[3,3]; Real determinant;\r
  Real entryCount; Real gramCount;\r
algorithm\r
  safeRotation := zeros(3,3); entryCount := 0.0; gramCount := 0.0;\r
  for i in 1:3 loop\r
    for j in 1:3 loop\r
      if abs(rotation[i,j]) <= 1.0+tolerance then\r
        safeRotation[i,j] := rotation[i,j];\r
      else\r
        entryCount := entryCount+1.0;\r
      end if;\r
    end for;\r
  end for;\r
  gram := transpose(safeRotation)*safeRotation;\r
  for i in 1:3 loop\r
    for j in 1:3 loop\r
      if not (abs(gram[i,j]-(if i == j then 1.0 else 0.0)) <= tolerance) then\r
        gramCount := gramCount+1.0;\r
      end if;\r
    end for;\r
  end for;\r
  determinant := safeRotation[1,1]*(safeRotation[2,2]*safeRotation[3,3]-safeRotation[2,3]*safeRotation[3,2])\r
    -safeRotation[1,2]*(safeRotation[2,1]*safeRotation[3,3]-safeRotation[2,3]*safeRotation[3,1])\r
    +safeRotation[1,3]*(safeRotation[2,1]*safeRotation[3,2]-safeRotation[2,2]*safeRotation[3,1]);\r
  valid := if entryCount+gramCount < 0.5 and abs(determinant-1.0) <= tolerance then 1.0 else 0.0;\r
end RGBDLandmarkRotationValid;\r
\r
// Source-owned reusable projection; the unchanged equation model is its oracle.\r
// Counts and masks retain the model's exact Real-domain checks. Disabled or\r
// unavailable point payloads never enter transforms. World-output overflow is\r
// excluded from validCount but is not an optical-input invalidCount event.\r
function RGBDProjectLandmarks\r
\r
  input Real opticalPoint[:,3];\r
  input Real enabled[size(opticalPoint,1)];\r
  input Real activeCount = 0.0;\r
  input Real poseAccepted = 0.0;\r
  input Real bodyRotation[3,3] = identity(3);\r
  input Real bodyPosition[3] = zeros(3);\r
  input Real opticalToBody[3,3] = [0.0,0.0,1.0;-1.0,0.0,0.0;0.0,-1.0,0.0];\r
  input Real cameraOriginBody[3] = {0.18,0.0,-0.04};\r
  input Real coordinateLimit = 1e6;\r
  output Real worldPoint[size(opticalPoint,1),3];\r
  output Real landmarkEnabled[size(opticalPoint,1)];\r
  output Real validCount;\r
  output Real invalidCount;\r
  output Real configurationValid;\r
  output Real poseValid;\r
protected\r
  Real bodyValid; Real cameraValid; Real poseChecks;\r
  Real pointChecks; Real pointValid; Real outputChecks;\r
  Real cameraInBody[3]; Real proposedWorld[3];\r
algorithm\r
  worldPoint := zeros(size(opticalPoint,1),3);\r
  landmarkEnabled := zeros(size(opticalPoint,1)); validCount := 0.0; invalidCount := 0.0;\r
  configurationValid := if activeCount >= 0.0 and activeCount <= size(opticalPoint,1)\r
    and floor(activeCount) <= activeCount and floor(activeCount) >= activeCount\r
    and coordinateLimit > 0.0 and coordinateLimit <= 1e6 then 1.0 else 0.0;\r
  bodyValid := RGBDLandmarkRotationValid(bodyRotation);\r
  cameraValid := RGBDLandmarkRotationValid(opticalToBody);\r
  poseChecks := 0.0;\r
  for k in 1:3 loop\r
    if not (abs(bodyPosition[k]) <= coordinateLimit and abs(cameraOriginBody[k]) <= coordinateLimit) then\r
      poseChecks := poseChecks+1.0;\r
    end if;\r
  end for;\r
  poseValid := if configurationValid > 0.5 and poseAccepted >= 1.0 and poseAccepted <= 1.0\r
    and bodyValid > 0.5 and cameraValid > 0.5 and poseChecks < 0.5 then 1.0 else 0.0;\r
  pointChecks := 0.0; pointValid := 0.0; outputChecks := 0.0;\r
  cameraInBody := zeros(3); proposedWorld := zeros(3);\r
  for i in 1:size(opticalPoint,1) loop\r
    pointChecks := 0.0;\r
    for k in 1:3 loop\r
      if not (abs(opticalPoint[i,k]) <= coordinateLimit) then pointChecks := pointChecks+1.0; end if;\r
    end for;\r
    pointValid := if configurationValid > 0.5 and i <= activeCount\r
      and enabled[i] >= 1.0 and enabled[i] <= 1.0 and pointChecks < 0.5\r
      and opticalPoint[i,3] > 0.0 then 1.0 else 0.0;\r
    if i <= activeCount and not (enabled[i] >= 0.0 and enabled[i] <= 0.0)\r
      and pointValid < 0.5 then invalidCount := invalidCount+1.0; end if;\r
    if poseValid > 0.5 and pointValid > 0.5 then\r
      cameraInBody := opticalToBody*opticalPoint[i,:]+cameraOriginBody;\r
      proposedWorld := bodyRotation*cameraInBody+bodyPosition;\r
      outputChecks := 0.0;\r
      for k in 1:3 loop\r
        if not (abs(proposedWorld[k]) <= coordinateLimit) then outputChecks := outputChecks+1.0; end if;\r
      end for;\r
      if outputChecks < 0.5 then\r
        worldPoint[i,:] := proposedWorld; landmarkEnabled[i] := 1.0; validCount := validCount+1.0;\r
      end if;\r
    end if;\r
  end for;\r
end RGBDProjectLandmarks;\r
`;export{n as default};
