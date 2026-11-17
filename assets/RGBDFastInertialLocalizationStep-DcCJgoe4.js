const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Full-raster source-owned FAST selection composed with the qualified core.\r
// The host transports the complete state and does no selection or filter math.\r
pure function AdvanceFastRGBDLocalization\r
\r
  input Real rgb[:,:,:];\r
  input Real depth[size(rgb,1),size(rgb,2)];\r
  input Real rgbCalibration[4] = RGBDNominalCalibration({size(rgb,1),size(rgb,2)},{69.0,42.0});\r
  input Real depthCalibration[4] = RGBDNominalCalibration({size(rgb,1),size(rgb,2)},{87.0,58.0});\r
  input Real disparityNoise = 0.08;\r
  input Real noiseReferenceFx = defaultNoiseReferenceFx;\r
  input Real baseline = 0.05;\r
  input Real opticalToBody[3,3] = [0.0,0.0,1.0;-1.0,0.0,0.0;0.0,-1.0,0.0];\r
  input Real cameraOriginBody[3] = {0.18,0.0,-0.04};\r
  input Real frameEnabled = 0.0;\r
  input Real imageCaptureRequested = 0.0;\r
  input Real position[3] = zeros(3);\r
  input Real velocity[3] = zeros(3);\r
  input Real rotation[3,3] = identity(3);\r
  input Real accelBias[3] = zeros(3);\r
  input Real gyroBias[3] = zeros(3);\r
  input Real covariance[15,15] = diagonal({initialPositionVariance,initialPositionVariance,initialPositionVariance,\r
    initialVelocityVariance,initialVelocityVariance,initialVelocityVariance,\r
    initialAttitudeVariance,initialAttitudeVariance,initialAttitudeVariance,\r
    initialAccelBiasVariance,initialAccelBiasVariance,initialAccelBiasVariance,\r
    initialGyroBiasVariance,initialGyroBiasVariance,initialGyroBiasVariance});\r
  input Real crossCovariance[15,6] = zeros(15,6);\r
  input Real referenceCovariance[6,6] = zeros(6,6);\r
  input Real referencePosition[3] = zeros(3);\r
  input Real referenceRotation[3,3] = identity(3);\r
  input Real referenceAvailable = 0.0;\r
  input Real referenceEpoch = 0.0;\r
  input Real currentEpoch = 0.0;\r
  input Real referenceUsed = 0.0;\r
  input Real lastUsedEpoch = -1.0;\r
  input Real referenceDescriptor[featureCapacity,descriptorSize] = zeros(featureCapacity,descriptorSize);\r
  input Real referencePoint[featureCapacity,3] = zeros(featureCapacity,3);\r
  input Real referenceEnabled[featureCapacity] = zeros(featureCapacity);\r
  input Real referencePixels[featureCapacity,2] = zeros(featureCapacity,2);\r
  input Real referenceCount = 0.0;\r
  input Real referenceRgbCalibration[4] = RGBDNominalCalibration({size(rgb,1),size(rgb,2)},{69.0,42.0});\r
  input Real referenceDepthCalibration[4] = RGBDNominalCalibration({size(rgb,1),size(rgb,2)},{87.0,58.0});\r
  input Real referenceNoiseReferenceFx = defaultNoiseReferenceFx;\r
  input Real referenceDisparityNoise = 0.08;\r
  input Real referenceBaseline = 0.05;\r
  input Real referenceOpticalToBody[3,3] = [0.0,0.0,1.0;-1.0,0.0,0.0;0.0,-1.0,0.0];\r
  input Real referenceCameraOriginBody[3] = {0.18,0.0,-0.04};\r
  input Real accel[3] = {0.0,0.0,9.81};\r
  input Real gyro[3] = zeros(3);\r
  input Real gravity[3] = {0.0,0.0,-9.81};\r
  input Real h = 1.0/90.0;\r
  input Real density[12] = {0.06,0.06,0.06,0.006,0.006,0.006,0.002,0.002,0.002,0.0002,0.0002,0.0002};\r
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
  output Real selectionValid;\r
  input Boolean depthQualifiedSelection = false "Reserve the RGB-D budget for valid calibrated depth";\r
  input Real depthUnits = 1.0 "Meters per depth sample; 1 for metric depth, SDK scale for Z16";\r
protected\r
  constant Integer featureCapacity = 350;\r
  constant Integer descriptorSize = 49;\r
  constant Real initialPositionVariance = 0.25;\r
  constant Real initialVelocityVariance = 0.04;\r
  constant Real initialAttitudeVariance = 0.01;\r
  constant Real initialAccelBiasVariance = 0.0004;\r
  constant Real initialGyroBiasVariance = 0.000025;\r
  constant Real defaultNoiseReferenceFx = 848.0/(2.0*tan(87.0*3.141592653589793/360.0));\r
  constant Integer errorDimension = 15;\r
  constant Integer poseDimension = 6;\r
  Boolean imageOn; Boolean selectionConfiguration;\r
  Real scores[size(rgb,1)*size(rgb,2)]; Real selectedFeatures[featureCapacity,3];\r
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
  (nextPosition,\r
    nextVelocity,\r
    nextRotation,\r
    nextAccelBias,\r
    nextGyroBias,\r
    nextCovariance,\r
    nextCrossCovariance,\r
    nextReferenceCovariance,\r
    nextReferencePosition,\r
    nextReferenceRotation,\r
    nextReferenceAvailable,\r
    nextReferenceEpoch,\r
    nextReferenceUsed,\r
    nextLastUsedEpoch,\r
    nextReferenceDescriptor,\r
    nextReferencePoint,\r
    nextReferenceEnabled,\r
    nextReferencePixels,\r
    nextReferenceCount,\r
    nextReferenceRgbCalibration,\r
    nextReferenceDepthCalibration,\r
    nextReferenceNoiseReferenceFx,\r
    nextReferenceDisparityNoise,\r
    nextReferenceBaseline,\r
    nextReferenceOpticalToBody,\r
    nextReferenceCameraOriginBody,\r
    predictionAccepted,\r
    observationAccepted,\r
    observationRejected,\r
    captureAccepted,\r
    captureRejected,\r
    imageReuseRejected,\r
    imagePairEligible,\r
    frameValid,\r
    referenceGeometryCompatible,\r
    visualValid,\r
    matchCount,\r
    uncertaintyRejectionReason,\r
    currentDescriptor,\r
    currentPoint,\r
    currentEnabled,\r
    currentCount,\r
    currentFromReference,\r
    currentFromReferenceTranslation,\r
    relativeCovariance,\r
    mapCandidatePoint,\r
    mapCandidateEnabled,\r
    mapCandidateCount,\r
    nextQuaternion,\r
    positionCovariance,\r
    attitudeCovariance,\r
    confidence,\r
    features,\r
    featureEnabled,\r
    trackingCurrentPixel,\r
    trackingReferencePixel,\r
    trackingEnabled) := AdvanceRGBDLocalization(\r
    rgb=rgb,\r
    depth=depth,\r
    rgbCalibration=rgbCalibration,\r
    depthCalibration=depthCalibration,\r
    disparityNoise=disparityNoise,\r
    noiseReferenceFx=noiseReferenceFx,\r
    baseline=baseline,\r
    opticalToBody=opticalToBody,\r
    cameraOriginBody=cameraOriginBody,\r
    frameEnabled=frameEnabled,\r
    imageCaptureRequested=imageCaptureRequested,\r
    position=position,\r
    velocity=velocity,\r
    rotation=rotation,\r
    accelBias=accelBias,\r
    gyroBias=gyroBias,\r
    covariance=covariance,\r
    crossCovariance=crossCovariance,\r
    referenceCovariance=referenceCovariance,\r
    referencePosition=referencePosition,\r
    referenceRotation=referenceRotation,\r
    referenceAvailable=referenceAvailable,\r
    referenceEpoch=referenceEpoch,\r
    currentEpoch=currentEpoch,\r
    referenceUsed=referenceUsed,\r
    lastUsedEpoch=lastUsedEpoch,\r
    referenceDescriptor=referenceDescriptor,\r
    referencePoint=referencePoint,\r
    referenceEnabled=referenceEnabled,\r
    referencePixels=referencePixels,\r
    referenceCount=referenceCount,\r
    referenceRgbCalibration=referenceRgbCalibration,\r
    referenceDepthCalibration=referenceDepthCalibration,\r
    referenceNoiseReferenceFx=referenceNoiseReferenceFx,\r
    referenceDisparityNoise=referenceDisparityNoise,\r
    referenceBaseline=referenceBaseline,\r
    referenceOpticalToBody=referenceOpticalToBody,\r
    referenceCameraOriginBody=referenceCameraOriginBody,\r
    accel=accel,\r
    gyro=gyro,\r
    gravity=gravity,\r
    h=h,\r
    density=density,\r
    pixels=selectedFeatures[1:featureCapacity,1:2],activeCount=selectedCount,\r
    featureScore=selectedFeatures[1:featureCapacity,3],depthUnits=depthUnits);\r
end AdvanceFastRGBDLocalization;\r
\r
model RGBDFastInertialLocalizationStep\r
\r
  extends RGBDInertialLocalizationInterface;\r
  parameter Real selectedFeatureLimit = 350.0;\r
  parameter Real absoluteThreshold = 18.0;\r
  output Real selectionValid;\r
algorithm\r
  (nextPosition,\r
    nextVelocity,\r
    nextRotation,\r
    nextAccelBias,\r
    nextGyroBias,\r
    nextCovariance,\r
    nextCrossCovariance,\r
    nextReferenceCovariance,\r
    nextReferencePosition,\r
    nextReferenceRotation,\r
    nextReferenceAvailable,\r
    nextReferenceEpoch,\r
    nextReferenceUsed,\r
    nextLastUsedEpoch,\r
    nextReferenceDescriptor,\r
    nextReferencePoint,\r
    nextReferenceEnabled,\r
    nextReferencePixels,\r
    nextReferenceCount,\r
    nextReferenceRgbCalibration,\r
    nextReferenceDepthCalibration,\r
    nextReferenceNoiseReferenceFx,\r
    nextReferenceDisparityNoise,\r
    nextReferenceBaseline,\r
    nextReferenceOpticalToBody,\r
    nextReferenceCameraOriginBody,\r
    predictionAccepted,\r
    observationAccepted,\r
    observationRejected,\r
    captureAccepted,\r
    captureRejected,\r
    imageReuseRejected,\r
    imagePairEligible,\r
    frameValid,\r
    referenceGeometryCompatible,\r
    visualValid,\r
    matchCount,\r
    uncertaintyRejectionReason,\r
    currentDescriptor,\r
    currentPoint,\r
    currentEnabled,\r
    currentCount,\r
    currentFromReference,\r
    currentFromReferenceTranslation,\r
    relativeCovariance,\r
    mapCandidatePoint,\r
    mapCandidateEnabled,\r
    mapCandidateCount,\r
    nextQuaternion,\r
    positionCovariance,\r
    attitudeCovariance,\r
    confidence,\r
    features,\r
    featureEnabled,\r
    trackingCurrentPixel,\r
    trackingReferencePixel,\r
    trackingEnabled,\r
    selectionValid) := AdvanceFastRGBDLocalization(\r
    rgb=rgb,\r
    depth=depth,\r
    rgbCalibration=rgbCalibration,\r
    depthCalibration=depthCalibration,\r
    disparityNoise=disparityNoise,\r
    noiseReferenceFx=noiseReferenceFx,\r
    baseline=baseline,\r
    opticalToBody=opticalToBody,\r
    cameraOriginBody=cameraOriginBody,\r
    frameEnabled=frameEnabled,\r
    imageCaptureRequested=imageCaptureRequested,\r
    position=position,\r
    velocity=velocity,\r
    rotation=rotation,\r
    accelBias=accelBias,\r
    gyroBias=gyroBias,\r
    covariance=covariance,\r
    crossCovariance=crossCovariance,\r
    referenceCovariance=referenceCovariance,\r
    referencePosition=referencePosition,\r
    referenceRotation=referenceRotation,\r
    referenceAvailable=referenceAvailable,\r
    referenceEpoch=referenceEpoch,\r
    currentEpoch=currentEpoch,\r
    referenceUsed=referenceUsed,\r
    lastUsedEpoch=lastUsedEpoch,\r
    referenceDescriptor=referenceDescriptor,\r
    referencePoint=referencePoint,\r
    referenceEnabled=referenceEnabled,\r
    referencePixels=referencePixels,\r
    referenceCount=referenceCount,\r
    referenceRgbCalibration=referenceRgbCalibration,\r
    referenceDepthCalibration=referenceDepthCalibration,\r
    referenceNoiseReferenceFx=referenceNoiseReferenceFx,\r
    referenceDisparityNoise=referenceDisparityNoise,\r
    referenceBaseline=referenceBaseline,\r
    referenceOpticalToBody=referenceOpticalToBody,\r
    referenceCameraOriginBody=referenceCameraOriginBody,\r
    accel=accel,\r
    gyro=gyro,\r
    gravity=gravity,\r
    h=h,\r
    density=density,\r
    selectedFeatureLimit=selectedFeatureLimit,absoluteThreshold=absoluteThreshold,depthUnits=depthUnits);\r
end RGBDFastInertialLocalizationStep;\r
`;export{e as default};
