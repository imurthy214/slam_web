const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Concrete carried-state localization transaction. Persistence copies these\r
// inputs/outputs verbatim; all image, pose, covariance and commit math is Modelica.\r
// Image dimensions are structural parameters;350 selected slots remain bounded.\r
// Pixel selection is a source-owned\r
// upstream stage (see RGBDFastInertialLocalizationStep). No loop closure here.\r
partial model RGBDInertialLocalizationInterface\r
\r
  parameter Integer imageHeight(min=1) = 90;\r
  parameter Integer imageWidth(min=1) = 160;\r
  constant Integer featureCapacity = 350;\r
  constant Integer descriptorSize = 49;\r
  parameter Real initialPositionVariance = 0.25;\r
  parameter Real initialVelocityVariance = 0.04;\r
  parameter Real initialAttitudeVariance = 0.01;\r
  parameter Real initialAccelBiasVariance = 0.0004;\r
  parameter Real initialGyroBiasVariance = 0.000025;\r
  final parameter Real defaultRgbCalibration[4] = RGBDNominalCalibration({imageHeight,imageWidth},{69.0,42.0});\r
  final parameter Real defaultDepthCalibration[4] = RGBDNominalCalibration({imageHeight,imageWidth},{87.0,58.0});\r
  constant Real defaultNoiseReferenceFx = 848.0/(2.0*tan(87.0*3.141592653589793/360.0));\r
  parameter Integer channelCount(min=3,max=4) = 4 "RGB or historical RGBA storage";\r
  input Real rgb[imageHeight,imageWidth,channelCount];\r
  input Real depth[imageHeight,imageWidth];\r
  input Real depthUnits = 1.0 "Meters per depth sample";\r
  input Real rgbCalibration[4] = defaultRgbCalibration;\r
  input Real depthCalibration[4] = defaultDepthCalibration;\r
  input Real disparityNoise = 0.08;\r
  input Real noiseReferenceFx = defaultNoiseReferenceFx;\r
  input Real baseline = 0.05;\r
  input Real opticalToBody[3,3] = [0.0,0.0,1.0;-1.0,0.0,0.0;0.0,-1.0,0.0];\r
  input Real cameraOriginBody[3] = {0.18,0.0,-0.04};\r
  input Real frameEnabled = 0.0 "Exactly1 only on final held-IMU interval for this image";\r
  input Real imageCaptureRequested = 0.0;\r
  input Real position[3] = zeros(3);\r
  input Real velocity[3] = zeros(3);\r
  input Real rotation[3,3] = identity(3);\r
  input Real accelBias[3] = zeros(3);\r
  input Real gyroBias[3] = zeros(3);\r
  // Estimated level origin, zero velocity/bias, gravity as declared below.\r
  // These tunable prior variances are initialization hypotheses, not truth or\r
  // registration noise. Relative corrections use the actual sandwich output.\r
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
  input Real referenceRgbCalibration[4] = defaultRgbCalibration;\r
  input Real referenceDepthCalibration[4] = defaultDepthCalibration;\r
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
  output Real nextPosition[3]; output Real nextVelocity[3];\r
  output Real nextRotation[3,3]; output Real nextAccelBias[3]; output Real nextGyroBias[3];\r
  output Real nextCovariance[15,15]; output Real nextCrossCovariance[15,6];\r
  output Real nextReferenceCovariance[6,6]; output Real nextReferencePosition[3];\r
  output Real nextReferenceRotation[3,3]; output Real nextReferenceAvailable;\r
  output Real nextReferenceEpoch; output Real nextReferenceUsed; output Real nextLastUsedEpoch;\r
  output Real nextReferenceDescriptor[featureCapacity,descriptorSize];\r
  output Real nextReferencePoint[featureCapacity,3]; output Real nextReferenceEnabled[featureCapacity];\r
  output Real nextReferencePixels[featureCapacity,2];\r
  output Real nextReferenceCount; output Real nextReferenceRgbCalibration[4];\r
  output Real nextReferenceDepthCalibration[4]; output Real nextReferenceNoiseReferenceFx;\r
  output Real nextReferenceDisparityNoise; output Real nextReferenceBaseline;\r
  output Real nextReferenceOpticalToBody[3,3]; output Real nextReferenceCameraOriginBody[3];\r
  output Real predictionAccepted; output Real observationAccepted; output Real observationRejected;\r
  output Real captureAccepted; output Real captureRejected; output Real imageReuseRejected;\r
  output Real imagePairEligible; output Real frameValid; output Real referenceGeometryCompatible;\r
  output Real visualValid; output Real matchCount; output Real uncertaintyRejectionReason;\r
  output Real currentDescriptor[featureCapacity,descriptorSize];\r
  output Real currentPoint[featureCapacity,3]; output Real currentEnabled[featureCapacity];\r
  output Real currentCount "Selected feature domain extent, including disabled slots; not a valid-point count";\r
  output Real currentFromReference[3,3]; output Real currentFromReferenceTranslation[3];\r
  output Real relativeCovariance[6,6];\r
  output Real mapCandidatePoint[featureCapacity,3]; output Real mapCandidateEnabled[featureCapacity];\r
  output Real mapCandidateCount;\r
  output Real nextQuaternion[4] "Normalized w,x,y,z; body FLU to world ENU";\r
  output Real positionCovariance[3,3]; output Real attitudeCovariance[3,3];\r
  output Real confidence "Binary accepted relative correction indicator; not posterior probability";\r
  output Real features[featureCapacity,3]; output Real featureEnabled[featureCapacity];\r
  output Real trackingCurrentPixel[featureCapacity,2];\r
  output Real trackingReferencePixel[featureCapacity,2]; output Real trackingEnabled[featureCapacity];\r
end RGBDInertialLocalizationInterface;\r
\r
model RGBDLocalizationOrientation\r
\r
  extends SLAMRotationLog;\r
  output Real unitQuaternion[4];\r
equation\r
  unitQuaternion = if noEvent(valid > 0.5) then quaternion else {1.0,0.0,0.0,0.0};\r
end RGBDLocalizationOrientation;\r
\r
function RGBDLocalizationTracking\r
\r
  input Real index[:]; input Real currentPixels[:,2]; input Real oldPixels[size(index,1),2];\r
  input Real oldEnabled[size(index,1)]; input Real currentEnabled[size(currentPixels,1)];\r
  input Integer imageSize[2] "Shared reference/current RGB grid: height, width";\r
  output Real currentPixel[size(index,1),2]; output Real referencePixel[size(index,1),2];\r
  output Real enabled[size(index,1)];\r
protected\r
  Integer partner;\r
  Boolean valid;\r
algorithm\r
  currentPixel := zeros(size(index,1),2); referencePixel := zeros(size(index,1),2);\r
  enabled := zeros(size(index,1)); partner := 1; valid := false;\r
  for i in 1:size(index,1) loop\r
    valid := imageSize[1] > 0 and imageSize[2] > 0\r
      and index[i] >= 1.0 and index[i] <= size(currentPixels,1)\r
      and SLAMExactRealEqual(index[i],floor(index[i])) and SLAMExactRealEqual(oldEnabled[i],1.0);\r
    partner := if valid then integer(index[i]) else 1;\r
    if valid then\r
      valid := SLAMExactRealEqual(currentEnabled[partner],1.0);\r
      for coordinate in 1:2 loop\r
        valid := valid and oldPixels[i,coordinate] >= 0.0\r
          and oldPixels[i,coordinate] <= imageSize[3-coordinate]-1\r
          and SLAMExactRealEqual(oldPixels[i,coordinate],floor(oldPixels[i,coordinate]))\r
          and currentPixels[partner,coordinate] >= 0.0\r
          and currentPixels[partner,coordinate] <= imageSize[3-coordinate]-1\r
          and SLAMExactRealEqual(currentPixels[partner,coordinate],floor(currentPixels[partner,coordinate]));\r
      end for;\r
      if valid then\r
        currentPixel[i,:] := currentPixels[partner,:];\r
        referencePixel[i,:] := oldPixels[i,:]; enabled[i] := 1.0;\r
      end if;\r
    end if;\r
  end for;\r
end RGBDLocalizationTracking;\r
\r
model RGBDInertialLocalizationStep\r
\r
  extends RGBDInertialLocalizationInterface;\r
  input Real pixels[featureCapacity,2];\r
  input Real activeCount;\r
  input Real featureScore[featureCapacity] = zeros(featureCapacity);\r
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
    pixels=pixels,\r
    activeCount=activeCount,\r
    featureScore=featureScore,depthUnits=depthUnits);\r
end RGBDInertialLocalizationStep;\r
\r
// Ordered reusable full-domain step. Both original equation models above/in\r
// SchmidtReferenceState remain unchanged reference owners. Explicit covariance\r
// inputs carry tuned priors; these defaults match the existing public interface.\r
pure function AdvanceRGBDLocalization\r
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
  input Real pixels[featureCapacity,2];\r
  input Real activeCount;\r
  input Real featureScore[featureCapacity] = zeros(featureCapacity);\r
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
  Boolean imageOn; Boolean sameGeometry; Boolean currentOriginValid;\r
  Real usableReferenceCount; Real pairValid; Real pairEligible; Real captureFresh;\r
  Real predictedPosition[3]; Real predictedVelocity[3]; Real predictedRotation[3,3];\r
  Real predictedCovariance[errorDimension,errorDimension]; Real predictedCross[errorDimension,poseDimension];\r
  Real transition[errorDimension,errorDimension]; Real processCovariance[errorDimension,errorDimension];\r
  Integer substeps;\r
  Real correctedCovariance[errorDimension,errorDimension]; Real correctedCross[errorDimension,poseDimension];\r
  Real correctedReferenceCovariance[poseDimension,poseDimension];\r
  Real correctionNis; Real correctionInnovation[poseDimension];\r
  Real correctionJacobian[poseDimension,errorDimension+poseDimension]; Real innovationCovariance[poseDimension,poseDimension];\r
  Real measurementEnabled; Real captureRequest; Real pairAttempted; Real usedEpochAfterAttempt;\r
  Real projectionInvalidCount; Real projectionConfigurationValid; Real projectionPoseValid;\r
  Real orientationVector[3]; Real orientationAngle; Real orientationValid; Real orientationQuaternion[4];\r
  Real visual_observedBodyRotation[3,3];\r
  Real visual_observedBodyPosition[3];\r
  Real visual_valid;\r
  Real visual_registrationRms;\r
  Real visual_registrationRejectionReason;\r
  Real visual_currentIndex[featureCapacity];\r
  Real visual_conditionalObservationCovariance[6,6];\r
  Real visual_uncertaintyValidCount;\r
  Real visual_uncertaintyInvalidCount;\r
  Real visual_descriptionInvalidCount;\r
  Real visual_matchingConfigurationValid;\r
  Real visual_invalidReference;\r
  Real visual_invalidCurrent;\r
  Real visual_pairEnabled[featureCapacity];\r
  Real visual_registrationAccepted;\r
  Real visual_registrationValidCount;\r
  Real visual_registrationInvalidCount;\r
  Real visual_registrationRank;\r
  Real visual_uncertaintyValid;\r
algorithm\r
  imageOn := SLAMExactRealEqual(frameEnabled,1.0);\r
  sameGeometry := SLAMExactRealEqual(referenceBaseline,baseline)\r
    and SLAMExactRealEqual(referenceDisparityNoise,disparityNoise);\r
  currentOriginValid := true;\r
  for axis in 1:3 loop\r
    currentOriginValid := currentOriginValid and abs(cameraOriginBody[axis]) <= 10.0;\r
    sameGeometry := sameGeometry and SLAMExactRealEqual(referenceCameraOriginBody[axis],cameraOriginBody[axis]);\r
    for column in 1:3 loop\r
      sameGeometry := sameGeometry and SLAMExactRealEqual(referenceOpticalToBody[axis,column],opticalToBody[axis,column]);\r
    end for;\r
  end for;\r
  referenceGeometryCompatible := if sameGeometry then 1.0 else 0.0;\r
  usableReferenceCount := if SLAMExactRealEqual(referenceAvailable,1.0) and sameGeometry then referenceCount else 0.0;\r
  (pairValid,pairEligible,captureFresh) := SchmidtImagePairEligibility(\r
    referenceAvailable,referenceUsed,referenceEpoch,currentEpoch,lastUsedEpoch);\r
  (predictionAccepted,transition,processCovariance,predictedPosition,predictedVelocity,predictedRotation,\r
    predictedCovariance,predictedCross,substeps) := ES15PredictHeldInterval(\r
      position,velocity,rotation,accelBias,gyroBias,covariance,crossCovariance,referenceCovariance,\r
      referencePosition,referenceRotation,referenceAvailable,accel,gyro,gravity,h,density);\r
  // Visual diagnostics stay observable even when prediction refuses this interval.\r
  (visual_observedBodyRotation,\r
    visual_observedBodyPosition,\r
    visual_valid,\r
    matchCount,\r
    visual_registrationRms,\r
    visual_registrationRejectionReason,\r
    visual_currentIndex,\r
    currentDescriptor,\r
    currentPoint,\r
    currentEnabled,\r
    currentFromReference,\r
    currentFromReferenceTranslation,\r
    relativeCovariance,\r
    visual_conditionalObservationCovariance,\r
    visualValid,\r
    uncertaintyRejectionReason,\r
    visual_uncertaintyValidCount,\r
    visual_uncertaintyInvalidCount,\r
    visual_descriptionInvalidCount,\r
    visual_matchingConfigurationValid,\r
    visual_invalidReference,\r
    visual_invalidCurrent,\r
    visual_pairEnabled,\r
    visual_registrationAccepted,\r
    visual_registrationValidCount,\r
    visual_registrationInvalidCount,\r
    visual_registrationRank,\r
    visual_uncertaintyValid) := ObserveRGBDRelativeFrame(\r
    rgb=rgb,depth=depth,pixels=pixels,activeCount=if imageOn then activeCount else 0.0,\r
    rgbCalibration=rgbCalibration,depthCalibration=depthCalibration,noiseReferenceFx=noiseReferenceFx,\r
    referenceDescriptor=referenceDescriptor,referencePoint=referencePoint,referenceEnabled=referenceEnabled,\r
    referenceCount=usableReferenceCount,referenceRgbFocal={referenceRgbCalibration[1],referenceRgbCalibration[2]},\r
    referenceNoiseReferenceFx=referenceNoiseReferenceFx,imageEnabled=imageOn,disparityNoise=disparityNoise,baseline=baseline,\r
    referenceBodyPosition=referencePosition,referenceBodyRotation=referenceRotation,\r
    opticalToBody=opticalToBody,cameraOriginBody=cameraOriginBody,depthUnits=depthUnits,\r
    pairRequested=imageOn and pairEligible > 0.5);\r
  frameValid := if imageOn and activeCount >= 0.0 and activeCount <= featureCapacity\r
    and SLAMExactRealEqual(activeCount,floor(activeCount)) and sum(currentEnabled) >= 3.0\r
    and disparityNoise > 0.0 and disparityNoise <= 1.0 and noiseReferenceFx >= 1e-6 and noiseReferenceFx <= 1e6\r
    and baseline >= 1e-6 and baseline <= 1.0 and RGBDProperRotationValue(opticalToBody) > 0.5\r
    and currentOriginValid then 1.0 else 0.0;\r
  measurementEnabled := if frameValid > 0.5 and sameGeometry and visualValid > 0.5 then 1.0 else 0.0;\r
  captureRequest := if frameValid > 0.5 then imageCaptureRequested else 0.0;\r
  (observationAccepted,correctionNis,correctionInnovation,correctionJacobian,innovationCovariance,\r
    nextPosition,nextVelocity,nextRotation,nextAccelBias,nextGyroBias,correctedCovariance,correctedCross,\r
    correctedReferenceCovariance) := SchmidtCorrectRelativePose(\r
      position=predictedPosition,velocity=predictedVelocity,rotation=predictedRotation,accelBias=accelBias,gyroBias=gyroBias,\r
      covariance=predictedCovariance,crossCovariance=predictedCross,referenceCovariance=referenceCovariance,\r
      referencePosition=referencePosition,referenceRotation=referenceRotation,opticalToBody=opticalToBody,\r
      cameraOriginBody=cameraOriginBody,measuredRotation=currentFromReference,measuredTranslation=currentFromReferenceTranslation,\r
      relativeCovariance=relativeCovariance,measurementEnabled=if predictionAccepted > 0.5 and pairEligible > 0.5 then measurementEnabled else 0.0);\r
  // An eligible attempted pair consumes its epoch even when correction rejects.\r
  pairAttempted := if predictionAccepted > 0.5 and pairEligible > 0.5\r
    and SLAMExactRealEqual(measurementEnabled,1.0) then 1.0 else 0.0;\r
  usedEpochAfterAttempt := if pairAttempted > 0.5 then currentEpoch else lastUsedEpoch;\r
  imagePairEligible := pairEligible;\r
  imageReuseRejected := if predictionAccepted > 0.5 and SLAMExactRealEqual(measurementEnabled,1.0)\r
    and pairEligible < 0.5 then 1.0 else 0.0;\r
  observationRejected := if predictionAccepted > 0.5 and not SLAMExactRealEqual(measurementEnabled,0.0)\r
    and observationAccepted < 0.5 then 1.0 else 0.0;\r
  (captureAccepted,captureRejected,nextReferenceAvailable,nextReferencePosition,nextReferenceRotation,\r
    nextCovariance,nextCrossCovariance,nextReferenceCovariance) := SchmidtCaptureReference(\r
      nextPosition,nextRotation,correctedCovariance,referencePosition,referenceRotation,\r
      correctedCross,correctedReferenceCovariance,referenceAvailable,captureRequest,\r
      if predictionAccepted > 0.5 and captureFresh > 0.5 and currentEpoch > usedEpochAfterAttempt then 1.0 else 0.0);\r
  if imageOn and SLAMExactRealEqual(imageCaptureRequested,1.0) and frameValid < 0.5 then captureRejected := 1.0; end if;\r
  nextReferenceEpoch := if captureAccepted > 0.5 then currentEpoch else referenceEpoch;\r
  nextReferenceUsed := if captureAccepted > 0.5 then 0.0 else if pairAttempted > 0.5 then 1.0 else referenceUsed;\r
  nextLastUsedEpoch := usedEpochAfterAttempt;\r
  nextReferenceDescriptor := if captureAccepted > 0.5 then currentDescriptor else referenceDescriptor;\r
  nextReferencePoint := if captureAccepted > 0.5 then currentPoint else referencePoint;\r
  nextReferenceEnabled := if captureAccepted > 0.5 then currentEnabled else referenceEnabled;\r
  nextReferencePixels := if captureAccepted > 0.5 then pixels else referencePixels;\r
  nextReferenceCount := if captureAccepted > 0.5 then activeCount else referenceCount;\r
  nextReferenceRgbCalibration := if captureAccepted > 0.5 then rgbCalibration else referenceRgbCalibration;\r
  nextReferenceDepthCalibration := if captureAccepted > 0.5 then depthCalibration else referenceDepthCalibration;\r
  nextReferenceNoiseReferenceFx := if captureAccepted > 0.5 then noiseReferenceFx else referenceNoiseReferenceFx;\r
  nextReferenceDisparityNoise := if captureAccepted > 0.5 then disparityNoise else referenceDisparityNoise;\r
  nextReferenceBaseline := if captureAccepted > 0.5 then baseline else referenceBaseline;\r
  nextReferenceOpticalToBody := if captureAccepted > 0.5 then opticalToBody else referenceOpticalToBody;\r
  nextReferenceCameraOriginBody := if captureAccepted > 0.5 then cameraOriginBody else referenceCameraOriginBody;\r
  (mapCandidatePoint,mapCandidateEnabled,mapCandidateCount,projectionInvalidCount,projectionConfigurationValid,projectionPoseValid)\r
    := RGBDProjectLandmarks(currentPoint,currentEnabled,if imageOn then activeCount else 0.0,\r
      if imageOn and (observationAccepted > 0.5 or captureAccepted > 0.5) then 1.0 else 0.0,\r
      nextRotation,nextPosition,opticalToBody,cameraOriginBody);\r
  (orientationVector,orientationAngle,orientationValid,orientationQuaternion) := SLAMRotationCoordinates(nextRotation);\r
  nextQuaternion := if orientationValid > 0.5 then orientationQuaternion else {1.0,0.0,0.0,0.0};\r
  positionCovariance := nextCovariance[1:3,1:3]; attitudeCovariance := nextCovariance[7:9,7:9];\r
  confidence := observationAccepted; featureEnabled := currentEnabled;\r
  currentCount := if imageOn then activeCount else 0.0;\r
  for feature in 1:featureCapacity loop\r
    features[feature,1] := if currentEnabled[feature] > 0.5 then pixels[feature,1] else 0.0;\r
    features[feature,2] := if currentEnabled[feature] > 0.5 then pixels[feature,2] else 0.0;\r
    features[feature,3] := if currentEnabled[feature] > 0.5 and abs(featureScore[feature]) <= 1e30 then featureScore[feature] else 0.0;\r
  end for;\r
  (trackingCurrentPixel,trackingReferencePixel,trackingEnabled) := RGBDLocalizationTracking(\r
    visual_currentIndex,pixels,referencePixels,referenceEnabled,currentEnabled,\r
    {size(rgb,1),size(rgb,2)});\r
end AdvanceRGBDLocalization;\r
`;export{e as default};
