const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Public lifecycle adapter; Rumoca compiles the complete Modelica implementation.\r
model RGBDFastSLAMInitialize\r
\r
  extends RGBDFastSLAMInterface(h=0.0,intervalTime=0.0);\r
equation\r
  (next,accepted,imageCompleted,mappingAccepted,\r
    graphCorrectionAccepted,roundoffCertified,publicationReason,ledgerReason,\r
    vocabularyReason,graphReason,graphCommitReason,graphFilterReason,\r
    covarianceStatus,graphCostBefore,graphCostAfter,nextQuaternion,\r
    selectionValid,predictionAccepted,initializationAccepted,observationAccepted,\r
    captureAccepted,matchCount,features,featureEnabled,\r
    trackingCurrentPixel,trackingReferencePixel,trackingEnabled,\r
    keyframeDecisionReason,keyframeRejectionReason,sequentialRejectionReason,frameRejectionDiagnostic,\r
    loopAttempted,loopRetrievalReason,loopGraphReason,loopCandidateCount,loopCandidateReferenceId,loopCandidateCurrentId,loopCandidateScore,loopCandidateReason,loopCandidateMatchedCount,loopCandidateInliers,loopCandidateRms,loopCandidateVerified,retiredLoopFactors) =\r
    InitializeFastSLAM(\r
      previous=previous,\r
      rgb=rgb,\r
      depth=depth,\r
      rgbCalibration=rgbCalibration,\r
      depthCalibration=depthCalibration,\r
      disparityNoise=disparityNoise,\r
      noiseReferenceFx=noiseReferenceFx,\r
      baseline=baseline,\r
      opticalToBody=opticalToBody,\r
      cameraOriginBody=cameraOriginBody,\r
      accel=accel,\r
      gyro=gyro,\r
      gravity=gravity,\r
      density=density,\r
      h=h,\r
      intervalTime=intervalTime,\r
      imageEpoch=imageEpoch,\r
      imageRequested=imageRequested,\r
      localCaptureRequested=localCaptureRequested,\r
      requested=requested,\r
      minimumMeasuredDescriptors=minimumMeasuredDescriptors,\r
      minimumWordDistanceSquared=minimumWordDistanceSquared,\r
      selectedFeatureLimit=selectedFeatureLimit,\r
      absoluteThreshold=absoluteThreshold,\r
      depthQualifiedSelection=depthQualifiedSelection,\r
      minimumInterval=minimumInterval,\r
      maximumInterval=maximumInterval,\r
      translationThreshold=translationThreshold,\r
      rotationThreshold=rotationThreshold,\r
      minimumFeatures=minimumFeatures,\r
      voxelWidth=voxelWidth,\r
      mergeRadius=mergeRadius,\r
      maximumDistance=maximumDistance,\r
      tentativeLifetime=tentativeLifetime,\r
      confirmedLifetime=confirmedLifetime,\r
      confirmationObservations=confirmationObservations,\r
      maximumConfidence=maximumConfidence,\r
      maximumTentative=maximumTentative,\r
      graphCorrectionRequested=graphCorrectionRequested,\r
      graphPolicy=graphPolicy,depthUnits=depthUnits,\r
      loopMinimumSimilarity=loopMinimumSimilarity, loopMinimumAge=loopMinimumAge, loopMinimumInliers=loopMinimumInliers, loopMinimumFraction=loopMinimumFraction, loopInlierDistance=loopInlierDistance, loopMaximumRms=loopMaximumRms, loopCalibratedResiduals=loopCalibratedResiduals, loopMaximumNormalizedSquared=loopMaximumNormalizedSquared,\r
      loopMaximumPoseInnovation=loopMaximumPoseInnovation, loopPoseConsistencySquared=loopPoseConsistencySquared, loopPoseConsistency=loopPoseConsistency);\r
end RGBDFastSLAMInitialize;\r
\r
// Ordered raw-camera lifecycle. Reference qualification is separate from\r
// compiler issuance and complete browser/runtime admission.\r
function InitializeFastSLAM\r
\r
  input RGBDGraphProcessing.State previous;\r
  input Real rgb[:,:,:];\r
  input Real depth[size(rgb,1),size(rgb,2)];\r
  input Real rgbCalibration[4] = RGBDNominalCalibration({size(rgb,1),size(rgb,2)},{69.0,42.0});\r
  input Real depthCalibration[4] = RGBDNominalCalibration({size(rgb,1),size(rgb,2)},{87.0,58.0});\r
  input Real disparityNoise = 0.08;\r
  input Real noiseReferenceFx = 848.0/(2.0*tan(87.0*3.141592653589793/360.0));\r
  input Real baseline = 0.05;\r
  input Real opticalToBody[spaceDimension,spaceDimension] = [0.0,0.0,1.0;-1.0,0.0,0.0;0.0,-1.0,0.0];\r
  input Real cameraOriginBody[spaceDimension] = {0.18,0.0,-0.04};\r
  input Real accel[spaceDimension] = {0.0,0.0,9.81};\r
  input Real gyro[spaceDimension] = zeros(spaceDimension);\r
  input Real gravity[spaceDimension] = {0.0,0.0,-9.81};\r
  input Real density[noiseDimension] = {0.06,0.06,0.06,0.006,0.006,0.006,0.002,0.002,0.002,0.0002,0.0002,0.0002};\r
  input Real h = 0.0;\r
  input Real intervalTime = 0.0;\r
  input Integer imageEpoch;\r
  input Boolean imageRequested = true;\r
  input Boolean localCaptureRequested = true;\r
  input Boolean requested = true;\r
  input Integer minimumMeasuredDescriptors = 8;\r
  input Real minimumWordDistanceSquared = 0.04;\r
  input Real selectedFeatureLimit = featureCapacity;\r
  input Real absoluteThreshold = 18.0;\r
  input Real minimumInterval = 0.5;\r
  input Real maximumInterval = 2.0;\r
  input Real translationThreshold = 0.6;\r
  input Real rotationThreshold = 0.25;\r
  input Integer minimumFeatures = 12;\r
  input Real voxelWidth = 0.25;\r
  input Real mergeRadius = 0.15;\r
  input Real maximumDistance = 80.0;\r
  input Real tentativeLifetime = 0.5;\r
  input Real confirmedLifetime = 5.0;\r
  input Real confirmationObservations = 3.0;\r
  input Real maximumConfidence = 8.0;\r
  input Real maximumTentative = 700.0;\r
  input Boolean graphCorrectionRequested = true;\r
  input RGBDGraphProcessing.Policy graphPolicy = RGBDGraphProcessing.DefaultPolicy();\r
  output RGBDGraphProcessing.State next;\r
  output Boolean accepted;\r
  output Boolean imageCompleted;\r
  output Boolean mappingAccepted;\r
  output Boolean graphCorrectionAccepted;\r
  output Boolean roundoffCertified;\r
  output Integer publicationReason;\r
  output Integer ledgerReason;\r
  output Integer vocabularyReason;\r
  output Integer graphReason;\r
  output Integer graphCommitReason;\r
  output Integer graphFilterReason;\r
  output Integer covarianceStatus;\r
  output Real graphCostBefore;\r
  output Real graphCostAfter;\r
  output Real nextQuaternion[quaternionSize];\r
  output Real selectionValid;\r
  output Real predictionAccepted;\r
  output Real initializationAccepted;\r
  output Real observationAccepted;\r
  output Real captureAccepted;\r
  output Real matchCount;\r
  output Real features[featureCapacity,spaceDimension];\r
  output Real featureEnabled[featureCapacity];\r
  output Real trackingCurrentPixel[featureCapacity,2];\r
  output Real trackingReferencePixel[featureCapacity,2];\r
  output Real trackingEnabled[featureCapacity];\r
  output Integer keyframeDecisionReason;\r
  output Integer keyframeRejectionReason;\r
  output Integer sequentialRejectionReason;\r
  output Integer frameRejectionDiagnostic;\r
  output Boolean loopAttempted;\r
  output Integer loopRetrievalReason;\r
  output Integer loopGraphReason;\r
  output Integer loopCandidateCount;\r
  output Integer loopCandidateReferenceId[RGBDKeyframeRetrieval.proposalCapacity];\r
  output Integer loopCandidateCurrentId[RGBDKeyframeRetrieval.proposalCapacity];\r
  output Real loopCandidateScore[RGBDKeyframeRetrieval.proposalCapacity];\r
  output Integer loopCandidateReason[RGBDKeyframeRetrieval.proposalCapacity];\r
  output Integer loopCandidateMatchedCount[RGBDKeyframeRetrieval.proposalCapacity];\r
  output Integer loopCandidateInliers[RGBDKeyframeRetrieval.proposalCapacity];\r
  output Real loopCandidateRms[RGBDKeyframeRetrieval.proposalCapacity];\r
  output Boolean loopCandidateVerified[RGBDKeyframeRetrieval.proposalCapacity];\r
  output Integer retiredLoopFactors;\r
  input Boolean depthQualifiedSelection = true;\r
  input Real depthUnits = 1.0 "Meters per depth sample; 1 for metric depth, SDK scale for Z16";\r
  input Real loopMinimumSimilarity = 0.35;\r
  input Real loopMinimumAge = 5.0;\r
  input Integer loopMinimumInliers = 12;\r
  input Real loopMinimumFraction = 0.5;\r
  input Real loopInlierDistance = 0.08;\r
  input Real loopMaximumRms = 0.03;\r
  input Boolean loopCalibratedResiduals = true;\r
  input Real loopMaximumNormalizedSquared = 9.0;\r
  input Real loopMaximumPoseInnovation = 2.0;\r
  input Real loopPoseConsistencySquared = 9.0;\r
  input Boolean loopPoseConsistency = true;\r
protected\r
  constant Integer featureCapacity = RGBDKeyframes.featureCapacity;\r
  constant Integer descriptorSize = RGBDKeyframes.descriptorSize;\r
  constant Integer spaceDimension = RGBDKeyframes.dimension;\r
  constant Integer errorDimension = 5*spaceDimension;\r
  constant Integer poseDimension = 2*spaceDimension;\r
  constant Integer noiseDimension = 4*spaceDimension;\r
  constant Integer channelCount = 4;\r
  constant Integer quaternionSize = 4;\r
  Boolean transactionAllowed;\r
  Boolean imageOn;\r
  RGBDLocalizationCatalog.Estimator proposed;\r
  RGBDLocalizationProcessing.Result publication;\r
  RGBDKeyframes.Frame measurement;\r
  Boolean frameAccepted;\r
  Integer frameRejectionReason;\r
  Real orientationVector[spaceDimension];\r
  Real orientationAngle;\r
  Real orientationValid;\r
  Real orientationQuaternion[quaternionSize];\r
  Real producerNextPosition[spaceDimension];\r
  Real producerNextVelocity[spaceDimension];\r
  Real producerNextRotation[spaceDimension,spaceDimension];\r
  Real producerNextAccelBias[spaceDimension];\r
  Real producerNextGyroBias[spaceDimension];\r
  Real producerNextCovariance[errorDimension,errorDimension];\r
  Real producerNextCrossCovariance[errorDimension,poseDimension];\r
  Real producerNextReferenceCovariance[poseDimension,poseDimension];\r
  Real producerNextReferencePosition[spaceDimension];\r
  Real producerNextReferenceRotation[spaceDimension,spaceDimension];\r
  Real producerNextReferenceAvailable;\r
  Real producerNextReferenceEpoch;\r
  Real producerNextReferenceUsed;\r
  Real producerNextLastUsedEpoch;\r
  Real producerNextReferenceDescriptor[featureCapacity,descriptorSize];\r
  Real producerNextReferencePoint[featureCapacity,spaceDimension];\r
  Real producerNextReferenceEnabled[featureCapacity];\r
  Real producerNextReferencePixels[featureCapacity,2];\r
  Real producerNextReferenceCount;\r
  Real producerNextReferenceRgbCalibration[4];\r
  Real producerNextReferenceDepthCalibration[4];\r
  Real producerNextReferenceNoiseReferenceFx;\r
  Real producerNextReferenceDisparityNoise;\r
  Real producerNextReferenceBaseline;\r
  Real producerNextReferenceOpticalToBody[spaceDimension,spaceDimension];\r
  Real producerNextReferenceCameraOriginBody[spaceDimension];\r
  Real producerPredictionAccepted;\r
  Real producerObservationAccepted;\r
  Real producerObservationRejected;\r
  Real producerCaptureAccepted;\r
  Real producerCaptureRejected;\r
  Real producerImageReuseRejected;\r
  Real producerImagePairEligible;\r
  Real producerFrameValid;\r
  Real producerReferenceGeometryCompatible;\r
  Real producerVisualValid;\r
  Real producerMatchCount;\r
  Real producerUncertaintyRejectionReason;\r
  Real producerCurrentDescriptor[featureCapacity,descriptorSize];\r
  Real producerCurrentPoint[featureCapacity,spaceDimension];\r
  Real producerCurrentEnabled[featureCapacity];\r
  Real producerCurrentCount;\r
  Real producerCurrentFromReference[spaceDimension,spaceDimension];\r
  Real producerCurrentFromReferenceTranslation[spaceDimension];\r
  Real producerRelativeCovariance[poseDimension,poseDimension];\r
  Real producerMapCandidatePoint[featureCapacity,spaceDimension];\r
  Real producerMapCandidateEnabled[featureCapacity];\r
  Real producerMapCandidateCount;\r
  Real producerNextQuaternion[quaternionSize];\r
  Real producerPositionCovariance[spaceDimension,spaceDimension];\r
  Real producerAttitudeCovariance[spaceDimension,spaceDimension];\r
  Real producerConfidence;\r
  Real producerFeatures[featureCapacity,spaceDimension];\r
  Real producerFeatureEnabled[featureCapacity];\r
  Real producerTrackingCurrentPixel[featureCapacity,2];\r
  Real producerTrackingReferencePixel[featureCapacity,2];\r
  Real producerTrackingEnabled[featureCapacity];\r
  Real producerInitializationAccepted;\r
  Real producerInitializationRejected;\r
  Real producerSelectionValid;\r
algorithm\r
  transactionAllowed := if requested then RGBDGraphProcessing.Valid(previous) and RGBDLocalizationCatalog.CanAdvance(previous.estimator.localization,intervalTime,h,true,requested) else false;\r
  imageOn := transactionAllowed and imageRequested\r
    and RGBDLocalizationCatalog.ImageFresh(previous.estimator.localization,imageEpoch,intervalTime);\r
  (producerNextPosition,\r
    producerNextVelocity,\r
    producerNextRotation,\r
    producerNextAccelBias,\r
    producerNextGyroBias,\r
    producerNextCovariance,\r
    producerNextCrossCovariance,\r
    producerNextReferenceCovariance,\r
    producerNextReferencePosition,\r
    producerNextReferenceRotation,\r
    producerNextReferenceAvailable,\r
    producerNextReferenceEpoch,\r
    producerNextReferenceUsed,\r
    producerNextLastUsedEpoch,\r
    producerNextReferenceDescriptor,\r
    producerNextReferencePoint,\r
    producerNextReferenceEnabled,\r
    producerNextReferencePixels,\r
    producerNextReferenceCount,\r
    producerNextReferenceRgbCalibration,\r
    producerNextReferenceDepthCalibration,\r
    producerNextReferenceNoiseReferenceFx,\r
    producerNextReferenceDisparityNoise,\r
    producerNextReferenceBaseline,\r
    producerNextReferenceOpticalToBody,\r
    producerNextReferenceCameraOriginBody,\r
    producerPredictionAccepted,\r
    producerObservationAccepted,\r
    producerObservationRejected,\r
    producerCaptureAccepted,\r
    producerCaptureRejected,\r
    producerImageReuseRejected,\r
    producerImagePairEligible,\r
    producerFrameValid,\r
    producerReferenceGeometryCompatible,\r
    producerVisualValid,\r
    producerMatchCount,\r
    producerUncertaintyRejectionReason,\r
    producerCurrentDescriptor,\r
    producerCurrentPoint,\r
    producerCurrentEnabled,\r
    producerCurrentCount,\r
    producerCurrentFromReference,\r
    producerCurrentFromReferenceTranslation,\r
    producerRelativeCovariance,\r
    producerMapCandidatePoint,\r
    producerMapCandidateEnabled,\r
    producerMapCandidateCount,\r
    producerNextQuaternion,\r
    producerPositionCovariance,\r
    producerAttitudeCovariance,\r
    producerConfidence,\r
    producerFeatures,\r
    producerFeatureEnabled,\r
    producerTrackingCurrentPixel,\r
    producerTrackingReferencePixel,\r
    producerTrackingEnabled,\r
    producerInitializationAccepted,\r
    producerInitializationRejected,\r
    producerSelectionValid) := InitializeFastRGBDLocalization(\r
    imageTime=intervalTime,\r
    initializationRequested=if transactionAllowed then 1.0 else 0.0,\r
    selectedFeatureLimit=selectedFeatureLimit,\r
    absoluteThreshold=absoluteThreshold,\r
      depthQualifiedSelection=depthQualifiedSelection,\r
    rgb=rgb,\r
    depth=depth,\r
    rgbCalibration=rgbCalibration,\r
    depthCalibration=depthCalibration,\r
    disparityNoise=disparityNoise,\r
    noiseReferenceFx=noiseReferenceFx,\r
    baseline=baseline,\r
    opticalToBody=opticalToBody,\r
    cameraOriginBody=cameraOriginBody,\r
    accel=accel,\r
    gyro=gyro,\r
    gravity=gravity,\r
    density=density,\r
    position=previous.estimator.localization.estimator.position,\r
    velocity=previous.estimator.localization.estimator.velocity,\r
    rotation=previous.estimator.localization.estimator.rotation,\r
    accelBias=previous.estimator.localization.estimator.accelBias,\r
    gyroBias=previous.estimator.localization.estimator.gyroBias,\r
    covariance=previous.estimator.localization.estimator.covariance,\r
    crossCovariance=previous.estimator.localization.estimator.crossCovariance,\r
    referenceCovariance=previous.estimator.localization.estimator.referenceCovariance,\r
    referencePosition=previous.estimator.localization.estimator.referencePosition,\r
    referenceRotation=previous.estimator.localization.estimator.referenceRotation,\r
    referenceAvailable=previous.estimator.localization.estimator.referenceAvailable,\r
    referenceEpoch=previous.estimator.localization.estimator.referenceEpoch,\r
    referenceUsed=previous.estimator.localization.estimator.referenceUsed,\r
    lastUsedEpoch=previous.estimator.localization.estimator.lastUsedEpoch,\r
    referenceDescriptor=previous.estimator.localization.estimator.referenceDescriptor,\r
    referencePoint=previous.estimator.localization.estimator.referencePoint,\r
    referenceEnabled=previous.estimator.localization.estimator.referenceEnabled,\r
    referencePixels=previous.estimator.localization.estimator.referencePixels,\r
    referenceCount=previous.estimator.localization.estimator.referenceCount,\r
    referenceRgbCalibration=previous.estimator.localization.estimator.referenceRgbCalibration,\r
    referenceDepthCalibration=previous.estimator.localization.estimator.referenceDepthCalibration,\r
    referenceNoiseReferenceFx=previous.estimator.localization.estimator.referenceNoiseReferenceFx,\r
    referenceDisparityNoise=previous.estimator.localization.estimator.referenceDisparityNoise,\r
    referenceBaseline=previous.estimator.localization.estimator.referenceBaseline,\r
    referenceOpticalToBody=previous.estimator.localization.estimator.referenceOpticalToBody,\r
    referenceCameraOriginBody=previous.estimator.localization.estimator.referenceCameraOriginBody,\r
    currentEpoch=imageEpoch,\r
    h=h,\r
    frameEnabled=if imageOn then 1.0 else 0.0,\r
    imageCaptureRequested=if imageOn and localCaptureRequested then 1.0 else 0.0,depthUnits=depthUnits);\r
  proposed.position := producerNextPosition;\r
  proposed.velocity := producerNextVelocity;\r
  proposed.rotation := producerNextRotation;\r
  proposed.accelBias := producerNextAccelBias;\r
  proposed.gyroBias := producerNextGyroBias;\r
  proposed.covariance := producerNextCovariance;\r
  proposed.crossCovariance := producerNextCrossCovariance;\r
  proposed.referenceCovariance := producerNextReferenceCovariance;\r
  proposed.referencePosition := producerNextReferencePosition;\r
  proposed.referenceRotation := producerNextReferenceRotation;\r
  proposed.referenceAvailable := producerNextReferenceAvailable;\r
  proposed.referenceEpoch := producerNextReferenceEpoch;\r
  proposed.referenceUsed := producerNextReferenceUsed;\r
  proposed.lastUsedEpoch := producerNextLastUsedEpoch;\r
  proposed.referenceDescriptor := producerNextReferenceDescriptor;\r
  proposed.referencePoint := producerNextReferencePoint;\r
  proposed.referenceEnabled := producerNextReferenceEnabled;\r
  proposed.referencePixels := producerNextReferencePixels;\r
  proposed.referenceCount := producerNextReferenceCount;\r
  proposed.referenceRgbCalibration := producerNextReferenceRgbCalibration;\r
  proposed.referenceDepthCalibration := producerNextReferenceDepthCalibration;\r
  proposed.referenceNoiseReferenceFx := producerNextReferenceNoiseReferenceFx;\r
  proposed.referenceDisparityNoise := producerNextReferenceDisparityNoise;\r
  proposed.referenceBaseline := producerNextReferenceBaseline;\r
  proposed.referenceOpticalToBody := producerNextReferenceOpticalToBody;\r
  proposed.referenceCameraOriginBody := producerNextReferenceCameraOriginBody;\r
  (measurement,frameAccepted,frameRejectionReason) := RGBDLocalizationFrame.Build(\r
    previous.estimator.localization.generation,previous.estimator.localization.catalog.nextId,imageEpoch,imageEpoch,intervalTime,\r
    producerCurrentCount,producerCurrentDescriptor,producerCurrentPoint,\r
    producerCurrentEnabled,producerFeatures[:,1:2],{size(rgb,1),size(rgb,2)},{size(rgb,1),size(rgb,2)},\r
    rgbCalibration,depthCalibration,opticalToBody,cameraOriginBody,disparityNoise,noiseReferenceFx,baseline,\r
    proposed.position,proposed.rotation,proposed.covariance,previous.estimator.localization.catalog.vocabularyVersion,\r
    if producerFrameValid > 0.5 and (producerObservationAccepted > 0.5\r
      or producerCaptureAccepted > 0.5) then 1.0 else 0.0,\r
    imageOn and producerInitializationAccepted > 0.5,\r
    filterSourceRevision=previous.estimator.localization.sourceRevision,\r
    filterCorrectionRevision=previous.estimator.correctionRevision);\r
  publication := RGBDLocalizationProcessing.Publish(previous,proposed,measurement,\r
    producerInitializationAccepted,\r
    producerObservationAccepted,producerCaptureAccepted,imageOn,imageEpoch,intervalTime,h,\r
    true,frameAccepted,frameRejectionReason,transactionAllowed,\r
    producerMapCandidatePoint,producerMapCandidateEnabled,\r
    minimumInterval,maximumInterval,translationThreshold,rotationThreshold,minimumFeatures,\r
    voxelWidth,mergeRadius,maximumDistance,tentativeLifetime,confirmedLifetime,\r
    confirmationObservations,maximumConfidence,maximumTentative,\r
    minimumMeasuredDescriptors=minimumMeasuredDescriptors,minimumWordDistanceSquared=minimumWordDistanceSquared,\r
      loopMinimumSimilarity=loopMinimumSimilarity, loopMinimumAge=loopMinimumAge, loopMinimumInliers=loopMinimumInliers, loopMinimumFraction=loopMinimumFraction, loopInlierDistance=loopInlierDistance, loopMaximumRms=loopMaximumRms, loopCalibratedResiduals=loopCalibratedResiduals, loopMaximumNormalizedSquared=loopMaximumNormalizedSquared,\r
      loopMaximumPoseInnovation=loopMaximumPoseInnovation, loopPoseConsistencySquared=loopPoseConsistencySquared, loopPoseConsistency=loopPoseConsistency);\r
  keyframeDecisionReason := publication.publication.decision.reason;\r
  keyframeRejectionReason := publication.publication.mapDiagnostics.keyframeRejectionReason;\r
  sequentialRejectionReason := publication.publication.mapDiagnostics.sequentialRejectionReason;\r
  retiredLoopFactors := 0;\r
  frameRejectionDiagnostic := publication.publication.frameRejectionReason;\r
  accepted := publication.accepted;\r
  imageCompleted := publication.publication.imageCompleted;\r
  mappingAccepted := publication.publication.mappingAccepted;\r
  publicationReason := publication.reason;\r
  ledgerReason := publication.ledgerReason;\r
  vocabularyReason := publication.vocabularyReason;\r
  // One initialized capture cannot form a relative graph. The next Step\r
  // invokes correction only after a real admitted catalog capture.\r
  next := publication.next;\r
  graphCorrectionAccepted := false;\r
  graphReason := 1;\r
  graphCommitReason := 0;\r
  graphFilterReason := 0;\r
  covarianceStatus := 0;\r
  roundoffCertified := false;\r
  graphCostBefore := 0;\r
  graphCostAfter := 0;\r
  (orientationVector,orientationAngle,orientationValid,orientationQuaternion) :=\r
    SLAMRotationCoordinates(next.estimator.localization.estimator.rotation);\r
  nextQuaternion := if orientationValid > 0.5 then orientationQuaternion else {1.0,0.0,0.0,0.0};\r
  selectionValid := producerSelectionValid;\r
  predictionAccepted := 0.0;\r
  initializationAccepted := if publication.accepted then producerInitializationAccepted else 0.0;\r
  observationAccepted := if publication.accepted then producerObservationAccepted else 0.0;\r
  captureAccepted := if publication.accepted then producerCaptureAccepted else 0.0;\r
  matchCount := if publication.publication.imageCompleted then producerMatchCount else 0.0;\r
  features := if publication.publication.imageCompleted then producerFeatures else zeros(featureCapacity,3);\r
  featureEnabled := if publication.publication.imageCompleted then producerFeatureEnabled else zeros(featureCapacity);\r
  trackingCurrentPixel := if publication.publication.imageCompleted then producerTrackingCurrentPixel else zeros(featureCapacity,2);\r
  trackingReferencePixel := if publication.publication.imageCompleted then producerTrackingReferencePixel else zeros(featureCapacity,2);\r
  trackingEnabled := if publication.publication.imageCompleted then producerTrackingEnabled else zeros(featureCapacity);\r
  loopAttempted := publication.publication.mapDiagnostics.loopAttempted;\r
  loopRetrievalReason := publication.publication.mapDiagnostics.loopRetrievalReason;\r
  loopGraphReason := publication.publication.mapDiagnostics.loopGraphReason;\r
  loopCandidateCount := publication.publication.mapDiagnostics.loopCandidateCount;\r
  loopCandidateReferenceId := publication.publication.mapDiagnostics.loopCandidateReferenceId;\r
  loopCandidateCurrentId := publication.publication.mapDiagnostics.loopCandidateCurrentId;\r
  loopCandidateScore := publication.publication.mapDiagnostics.loopCandidateScore;\r
  loopCandidateReason := publication.publication.mapDiagnostics.loopCandidateReason;\r
  loopCandidateMatchedCount := publication.publication.mapDiagnostics.loopCandidateMatchedCount;\r
  loopCandidateInliers := publication.publication.mapDiagnostics.loopCandidateInliers;\r
  loopCandidateRms := publication.publication.mapDiagnostics.loopCandidateRms;\r
  loopCandidateVerified := publication.publication.mapDiagnostics.loopCandidateVerified;\r
end InitializeFastSLAM;\r
`;export{e as default};
