const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Complete time-zero raw RGB-D transaction; no positive-duration prediction.\r
// Ordered array math stays in this reusable function, with unchanged model I/O.\r
function InitializeRGBDLocalization\r
\r
  input Real rgb[:,:,:];\r
  input Real depth[size(rgb,1),size(rgb,2)];\r
  input Real rgbCalibration[4];\r
  input Real depthCalibration[4];\r
  input Real disparityNoise;\r
  input Real noiseReferenceFx;\r
  input Real baseline;\r
  input Real opticalToBody[3,3];\r
  input Real cameraOriginBody[3];\r
  input Real frameEnabled;\r
  input Real imageCaptureRequested;\r
  input Real position[3];\r
  input Real velocity[3];\r
  input Real rotation[3,3];\r
  input Real accelBias[3];\r
  input Real gyroBias[3];\r
  input Real covariance[15,15];\r
  input Real crossCovariance[15,6];\r
  input Real referenceCovariance[6,6];\r
  input Real referencePosition[3];\r
  input Real referenceRotation[3,3];\r
  input Real referenceAvailable;\r
  input Real referenceEpoch;\r
  input Real currentEpoch;\r
  input Real referenceUsed;\r
  input Real lastUsedEpoch;\r
  input Real referenceDescriptor[featureCapacity,descriptorSize];\r
  input Real referencePoint[featureCapacity,3];\r
  input Real referenceEnabled[featureCapacity];\r
  input Real referencePixels[featureCapacity,2];\r
  input Real referenceCount;\r
  input Real referenceRgbCalibration[4];\r
  input Real referenceDepthCalibration[4];\r
  input Real referenceNoiseReferenceFx;\r
  input Real referenceDisparityNoise;\r
  input Real referenceBaseline;\r
  input Real referenceOpticalToBody[3,3];\r
  input Real referenceCameraOriginBody[3];\r
  input Real accel[3];\r
  input Real gyro[3];\r
  input Real gravity[3];\r
  input Real h;\r
  input Real density[12];\r
  input Real pixels[featureCapacity,2];\r
  input Real activeCount;\r
  input Real featureScore[featureCapacity];\r
  input Real imageTime;\r
  input Real initializationRequested;\r
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
  output Real nextReferenceDescriptor[featureCapacity,descriptorSize];\r
  output Real nextReferencePoint[featureCapacity,3];\r
  output Real nextReferenceEnabled[featureCapacity];\r
  output Real nextReferencePixels[featureCapacity,2];\r
  output Real nextReferenceCount;\r
  output Real nextReferenceRgbCalibration[4];\r
  output Real nextReferenceDepthCalibration[4];\r
  output Real nextReferenceNoiseReferenceFx;\r
  output Real nextReferenceDisparityNoise;\r
  output Real nextReferenceBaseline;\r
  output Real nextReferenceOpticalToBody[3,3];\r
  output Real nextReferenceCameraOriginBody[3];\r
  output Real predictionAccepted;\r
  output Real observationAccepted;\r
  output Real observationRejected;\r
  output Real captureAccepted;\r
  output Real captureRejected;\r
  output Real imageReuseRejected;\r
  output Real imagePairEligible;\r
  output Real frameValid;\r
  output Real referenceGeometryCompatible;\r
  output Real visualValid;\r
  output Real matchCount;\r
  output Real uncertaintyRejectionReason;\r
  output Real currentDescriptor[featureCapacity,descriptorSize];\r
  output Real currentPoint[featureCapacity,3];\r
  output Real currentEnabled[featureCapacity];\r
  output Real currentCount;\r
  output Real currentFromReference[3,3];\r
  output Real currentFromReferenceTranslation[3];\r
  output Real relativeCovariance[6,6];\r
  output Real mapCandidatePoint[featureCapacity,3];\r
  output Real mapCandidateEnabled[featureCapacity];\r
  output Real mapCandidateCount;\r
  output Real nextQuaternion[4];\r
  output Real positionCovariance[3,3];\r
  output Real attitudeCovariance[3,3];\r
  output Real confidence;\r
  output Real features[featureCapacity,3];\r
  output Real featureEnabled[featureCapacity];\r
  output Real trackingCurrentPixel[featureCapacity,2];\r
  output Real trackingReferencePixel[featureCapacity,2];\r
  output Real trackingEnabled[featureCapacity];\r
  output Real initializationAccepted;\r
  output Real initializationRejected;\r
  input Real minimumContrast = 1e-6;\r
  input Real nearDepth = 0.28;\r
  input Real farDepth = 10.0;\r
  input Real depthUnits = 1.0 "Meters per depth sample; 1 for metric depth, SDK scale for Z16";\r
protected\r
  constant Integer featureCapacity = 350;\r
  constant Integer descriptorSize = 49;\r
  Boolean imageOn;\r
  Real nominalChecks[3]; Real densityChecks[12];\r
  Real originChecks[3]; Real cameraChecks[3,3]; Real referenceOriginChecks[3];\r
  Real currentCovarianceValid; Real jointCovarianceValid;\r
  Real priorJoint[21,21]; Real priorValid;\r
  Real pairValid; Real pairEligible; Real captureFresh;\r
  Real descriptorInvalidCount; Real captureRejectedInternal;\r
  Real projectionInvalidCount; Real projectionConfigurationValid; Real projectionPoseValid;\r
  Real orientationVector[3]; Real orientationAngle; Real orientationValid; Real orientationQuaternion[4];\r
algorithm\r
  imageOn := SLAMExactRealEqual(frameEnabled,1.0);\r
  (pairValid,pairEligible,captureFresh) := SchmidtImagePairEligibility(referenceAvailable,\r
    referenceUsed,referenceEpoch,currentEpoch,lastUsedEpoch);\r
  priorJoint := cat(1,cat(2,covariance,crossCovariance),\r
    cat(2,transpose(crossCovariance),referenceCovariance));\r
  currentCovarianceValid := SLAMCovariancePSDCheck(covariance,1e-12);\r
  jointCovarianceValid := SLAMCovariancePSDCheck(priorJoint,1e-12);\r
  for axis in 1:3 loop\r
    nominalChecks[axis] := if noEvent(abs(position[axis]) <= 1e6\r
      and abs(velocity[axis]) <= 1e6 and abs(accelBias[axis]) <= 2.0\r
      and abs(gyroBias[axis]) <= 0.3 and abs(gravity[axis]) <= 1e3\r
      and abs(referencePosition[axis]) <= 1e6) then 0.0 else 1.0;\r
    originChecks[axis] := if noEvent(abs(cameraOriginBody[axis]) <= 10.0) then 0.0 else 1.0;\r
    referenceOriginChecks[axis] := if noEvent(SLAMExactRealEqual(referenceCameraOriginBody[axis],cameraOriginBody[axis]))\r
      then 0.0 else 1.0;\r
    for column in 1:3 loop\r
      cameraChecks[axis,column] := if noEvent(SLAMExactRealEqual(referenceOpticalToBody[axis,column],opticalToBody[axis,column]))\r
        then 0.0 else 1.0;\r
    end for;\r
  end for;\r
  for channel in 1:12 loop\r
    densityChecks[channel] := if noEvent(density[channel] >= 0.0 and density[channel] <= 1e6) then 0.0 else 1.0;\r
  end for;\r
  // Complete prior validation includes unavailable cross/reference buffers;\r
  // initialization never erases a malformed prior to manufacture a cold clone.\r
  priorValid := if noEvent(RGBDProperRotationValue(rotation) > 0.5 and RGBDProperRotationValue(referenceRotation) > 0.5\r
    and sum(nominalChecks)+sum(densityChecks) < 0.5\r
    and currentCovarianceValid > 0.5 and jointCovarianceValid > 0.5\r
    and pairValid > 0.5) then 1.0 else 0.0;\r
  initializationAccepted := if noEvent(SLAMExactRealEqual(initializationRequested,1.0)\r
    and SLAMExactRealEqual(imageTime,0.0) and priorValid > 0.5\r
    and (SLAMExactRealEqual(frameEnabled,0.0) or imageOn)) then 1.0 else 0.0;\r
  initializationRejected := if noEvent(SLAMExactRealEqual(initializationRequested,0.0)\r
    or initializationAccepted > 0.5) then 0.0 else 1.0;\r
  // Raw image reads stay inside the existing acquisition guard. Alpha is ignored.\r
  (currentDescriptor,currentPoint,currentEnabled,descriptorInvalidCount) := DescribeRGBDFrame(\r
    rgb,depth,pixels,if imageOn and initializationAccepted > 0.5 then activeCount else 0.0,\r
    rgbCalibration,depthCalibration,disparityNoise,noiseReferenceFx,baseline,\r
    nearDepth,farDepth,minimumContrast,imageOn and initializationAccepted > 0.5,depthUnits=depthUnits);\r
  frameValid := if noEvent(imageOn and initializationAccepted > 0.5\r
    and activeCount >= 0.0 and activeCount <= featureCapacity\r
    and SLAMExactRealEqual(activeCount,floor(activeCount)) and sum(currentEnabled) >= 3.0\r
    and disparityNoise > 0.0 and disparityNoise <= 1.0\r
    and noiseReferenceFx >= 1e-6 and noiseReferenceFx <= 1e6\r
    and baseline >= 1e-6 and baseline <= 1.0 and RGBDProperRotationValue(opticalToBody) > 0.5\r
    and sum(originChecks) < 0.5) then 1.0 else 0.0;\r
  referenceGeometryCompatible := if noEvent(sum(cameraChecks)+sum(referenceOriginChecks) < 0.5\r
    and SLAMExactRealEqual(referenceBaseline,baseline)\r
    and SLAMExactRealEqual(referenceDisparityNoise,disparityNoise)) then 1.0 else 0.0;\r
  (captureAccepted,captureRejectedInternal,nextReferenceAvailable,nextReferencePosition,\r
    nextReferenceRotation,nextCovariance,nextCrossCovariance,nextReferenceCovariance)\r
    := SchmidtCaptureReference(position,rotation,covariance,referencePosition,referenceRotation,\r
      crossCovariance,referenceCovariance,referenceAvailable,\r
      if initializationAccepted > 0.5 and frameValid > 0.5 then imageCaptureRequested else 0.0,\r
      if initializationAccepted > 0.5 and frameValid > 0.5 and captureFresh > 0.5 then 1.0 else 0.0);\r
  (mapCandidatePoint,mapCandidateEnabled,mapCandidateCount,projectionInvalidCount,\r
    projectionConfigurationValid,projectionPoseValid) := RGBDProjectLandmarks(\r
      currentPoint,currentEnabled,if imageOn then activeCount else 0.0,captureAccepted,\r
      rotation,position,opticalToBody,cameraOriginBody);\r
  // No positive-duration component is instantiated. These unused inherited\r
  // inputs (h,accel,gyro) cannot trigger prediction or alter any current mean/P.\r
  predictionAccepted := 0.0; observationAccepted := 0.0; observationRejected := 0.0;\r
  captureRejected := if noEvent(imageOn and SLAMExactRealEqual(imageCaptureRequested,1.0)\r
    and (initializationAccepted < 0.5 or frameValid < 0.5)) then 1.0 else captureRejectedInternal;\r
  imagePairEligible := 0.0; imageReuseRejected := 0.0;\r
  nextPosition := position; nextVelocity := velocity; nextRotation := rotation;\r
  nextAccelBias := accelBias; nextGyroBias := gyroBias;\r
  nextReferenceEpoch := if noEvent(captureAccepted > 0.5) then currentEpoch else referenceEpoch;\r
  nextReferenceUsed := if noEvent(captureAccepted > 0.5) then 0.0 else referenceUsed;\r
  nextLastUsedEpoch := lastUsedEpoch;\r
  nextReferenceDescriptor := if noEvent(captureAccepted > 0.5) then currentDescriptor else referenceDescriptor;\r
  nextReferencePoint := if noEvent(captureAccepted > 0.5) then currentPoint else referencePoint;\r
  nextReferenceEnabled := if noEvent(captureAccepted > 0.5) then currentEnabled else referenceEnabled;\r
  nextReferencePixels := if noEvent(captureAccepted > 0.5) then pixels else referencePixels;\r
  nextReferenceCount := if noEvent(captureAccepted > 0.5) then activeCount else referenceCount;\r
  nextReferenceRgbCalibration := if noEvent(captureAccepted > 0.5) then rgbCalibration else referenceRgbCalibration;\r
  nextReferenceDepthCalibration := if noEvent(captureAccepted > 0.5) then depthCalibration else referenceDepthCalibration;\r
  nextReferenceNoiseReferenceFx := if noEvent(captureAccepted > 0.5) then noiseReferenceFx else referenceNoiseReferenceFx;\r
  nextReferenceDisparityNoise := if noEvent(captureAccepted > 0.5) then disparityNoise else referenceDisparityNoise;\r
  nextReferenceBaseline := if noEvent(captureAccepted > 0.5) then baseline else referenceBaseline;\r
  nextReferenceOpticalToBody := if noEvent(captureAccepted > 0.5) then opticalToBody else referenceOpticalToBody;\r
  nextReferenceCameraOriginBody := if noEvent(captureAccepted > 0.5) then cameraOriginBody else referenceCameraOriginBody;\r
  currentCount := if noEvent(imageOn) then activeCount else 0.0;\r
  visualValid := 0.0; matchCount := 0.0; uncertaintyRejectionReason := 0.0;\r
  currentFromReference := identity(3); currentFromReferenceTranslation := zeros(3);\r
  relativeCovariance := zeros(6,6);\r
  (orientationVector,orientationAngle,orientationValid,orientationQuaternion) := SLAMRotationCoordinates(rotation);\r
  nextQuaternion := if orientationValid > 0.5 then orientationQuaternion else {1.0,0.0,0.0,0.0};\r
  positionCovariance := covariance[1:3,1:3]; attitudeCovariance := covariance[7:9,7:9];\r
  confidence := 0.0;\r
  featureEnabled := currentEnabled;\r
  for feature in 1:featureCapacity loop\r
    features[feature,1] := if noEvent(currentEnabled[feature] > 0.5) then pixels[feature,1] else 0.0;\r
    features[feature,2] := if noEvent(currentEnabled[feature] > 0.5) then pixels[feature,2] else 0.0;\r
    features[feature,3] := if noEvent(currentEnabled[feature] > 0.5 and abs(featureScore[feature]) <= 1e30)\r
      then featureScore[feature] else 0.0;\r
  end for;\r
  trackingCurrentPixel := zeros(featureCapacity,2); trackingReferencePixel := zeros(featureCapacity,2);\r
  trackingEnabled := zeros(featureCapacity);\r
end InitializeRGBDLocalization;\r
\r
// Time-zero initialization is a separate source transaction, not h=0 prediction.\r
// The outer owner schedules it once and publishes the complete returned tuple.\r
model RGBDInertialLocalizationInitialize\r
\r
  extends RGBDInertialLocalizationInterface;\r
  input Real pixels[featureCapacity,2];\r
  input Real activeCount;\r
  input Real featureScore[featureCapacity] = zeros(featureCapacity);\r
  input Real imageTime = 0.0;\r
  input Real initializationRequested = 1.0;\r
  output Real initializationAccepted;\r
  output Real initializationRejected;\r
protected\r
  parameter Real minimumContrast = 1e-6;\r
  parameter Real nearDepth = 0.28;\r
  parameter Real farDepth = 10.0;\r
algorithm\r
  (nextPosition,nextVelocity,nextRotation,\r
    nextAccelBias,nextGyroBias,nextCovariance,\r
    nextCrossCovariance,nextReferenceCovariance,nextReferencePosition,\r
    nextReferenceRotation,nextReferenceAvailable,nextReferenceEpoch,\r
    nextReferenceUsed,nextLastUsedEpoch,nextReferenceDescriptor,\r
    nextReferencePoint,nextReferenceEnabled,nextReferencePixels,\r
    nextReferenceCount,nextReferenceRgbCalibration,nextReferenceDepthCalibration,\r
    nextReferenceNoiseReferenceFx,nextReferenceDisparityNoise,nextReferenceBaseline,\r
    nextReferenceOpticalToBody,nextReferenceCameraOriginBody,predictionAccepted,\r
    observationAccepted,observationRejected,captureAccepted,\r
    captureRejected,imageReuseRejected,imagePairEligible,\r
    frameValid,referenceGeometryCompatible,visualValid,\r
    matchCount,uncertaintyRejectionReason,currentDescriptor,\r
    currentPoint,currentEnabled,currentCount,\r
    currentFromReference,currentFromReferenceTranslation,relativeCovariance,\r
    mapCandidatePoint,mapCandidateEnabled,mapCandidateCount,\r
    nextQuaternion,positionCovariance,attitudeCovariance,\r
    confidence,features,featureEnabled,\r
    trackingCurrentPixel,trackingReferencePixel,trackingEnabled,\r
    initializationAccepted,initializationRejected) := InitializeRGBDLocalization(\r
    rgb,depth,rgbCalibration,\r
    depthCalibration,disparityNoise,noiseReferenceFx,\r
    baseline,opticalToBody,cameraOriginBody,\r
    frameEnabled,imageCaptureRequested,position,\r
    velocity,rotation,accelBias,\r
    gyroBias,covariance,crossCovariance,\r
    referenceCovariance,referencePosition,referenceRotation,\r
    referenceAvailable,referenceEpoch,currentEpoch,\r
    referenceUsed,lastUsedEpoch,referenceDescriptor,\r
    referencePoint,referenceEnabled,referencePixels,\r
    referenceCount,referenceRgbCalibration,referenceDepthCalibration,\r
    referenceNoiseReferenceFx,referenceDisparityNoise,referenceBaseline,\r
    referenceOpticalToBody,referenceCameraOriginBody,accel,\r
    gyro,gravity,h,\r
    density,pixels,activeCount,\r
    featureScore,imageTime,initializationRequested,\r
    minimumContrast,nearDepth,farDepth,depthUnits=depthUnits);\r
end RGBDInertialLocalizationInitialize;\r
`;export{e as default};
