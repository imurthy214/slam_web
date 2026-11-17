const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Complete raw FAST -> selection -> time-zero RGB-D initialization transaction.\r
// All image/ranking/pose/covariance math is Modelica; no host intermediate stage.\r
function InitializeFastRGBDLocalization\r
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
  input Real imageTime;\r
  input Real initializationRequested;\r
  input Real selectedFeatureLimit = 350.0;\r
  input Real absoluteThreshold = 18.0;\r
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
  output Real selectionValid;\r
  input Boolean depthQualifiedSelection = false "Reserve the RGB-D budget for valid calibrated depth";\r
  input Real depthUnits = 1.0 "Meters per depth sample; 1 for metric depth, SDK scale for Z16";\r
protected\r
  constant Integer featureCapacity = 350; constant Integer descriptorSize = 49;\r
  Boolean imageOn; Boolean selectionConfiguration;\r
  Real scores[size(rgb,1)*size(rgb,2)];\r
  Real selectedFeatures[featureCapacity,3];\r
  Real selectionCount; Real selectionStatus; Real selectedCount;\r
algorithm\r
  imageOn := SLAMExactRealEqual(frameEnabled,1.0);\r
  scores := FastFrameScores(rgb,imageOn,FastSelectionScoreFloor(absoluteThreshold,1e8));\r
  if depthQualifiedSelection then\r
    scores := RGBDDepthQualifiedScores(depth,scores,rgbCalibration,depthCalibration,\r
      0.28,10.0,disparityNoise,noiseReferenceFx,baseline,imageOn,depthUnits=depthUnits);\r
  end if;\r
  (selectedFeatures,selectionCount,selectionStatus) := SelectRasterFeatures(scores,\r
    size(rgb,2),size(rgb,1),featureCapacity,3,\r
    {absoluteThreshold,0.0,1e8,3.0,selectedFeatureLimit,1.0,3.0,3.0},false,imageOn);\r
  selectionConfiguration := selectedFeatureLimit >= 1.0 and selectedFeatureLimit <= featureCapacity\r
    and SLAMExactRealEqual(selectedFeatureLimit,floor(selectedFeatureLimit));\r
  selectionValid := if selectionConfiguration and selectionStatus > 0.5\r
    and selectionCount >= 0.0 and selectionCount <= featureCapacity then 1.0 else 0.0;\r
  selectedCount := if selectionValid > 0.5 then selectionCount else 0.0;\r
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
    density,selectedFeatures[1:featureCapacity,1:2],selectedCount,\r
    selectedFeatures[1:featureCapacity,3],imageTime,initializationRequested,depthUnits=depthUnits);\r
end InitializeFastRGBDLocalization;\r
\r
// Time-zero source initialization with the full original raster and selection.\r
// No h/IMU prediction component is instantiated; the outer owner schedules once.\r
model RGBDFastInertialLocalizationInitialize\r
\r
  extends RGBDInertialLocalizationInterface;\r
  parameter Real selectedFeatureLimit = 350.0;\r
  parameter Real absoluteThreshold = 18.0;\r
  input Real imageTime = 0.0;\r
  input Real initializationRequested = 1.0;\r
  output Real initializationAccepted;\r
  output Real initializationRejected;\r
  output Real selectionValid;\r
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
    initializationAccepted,initializationRejected,selectionValid) := InitializeFastRGBDLocalization(\r
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
    density,imageTime,initializationRequested,\r
    selectedFeatureLimit,absoluteThreshold,depthUnits=depthUnits);\r
end RGBDFastInertialLocalizationInitialize;\r
`;export{e as default};
