const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Source-owned held-IMU batching for the complete raw-camera SLAM lifecycle.\r
model RGBDFastSLAMIntervals\r
\r
  parameter Integer imageHeight(min=1) = RGBDKeyframes.imageHeight;\r
  parameter Integer imageWidth(min=1) = RGBDKeyframes.imageWidth;\r
  parameter Boolean depthQualifiedSelection = true;\r
  input RGBDGraphProcessing.State previous;\r
  input Real rgb[imageHeight,imageWidth,channelCount];\r
  input Real depth[imageHeight,imageWidth];\r
  input Real depthUnits = 1.0 "Meters per depth sample";\r
  input Real rgbCalibration[4] = defaultRgbCalibration;\r
  input Real depthCalibration[4] = defaultDepthCalibration;\r
  input Real disparityNoise = 0.08;\r
  input Real noiseReferenceFx = 848.0/(2.0*tan(87.0*3.141592653589793/360.0));\r
  input Real baseline = 0.05;\r
  input Real opticalToBody[spaceDimension,spaceDimension] = [0.0,0.0,1.0;-1.0,0.0,0.0;0.0,-1.0,0.0];\r
  input Real cameraOriginBody[spaceDimension] = {0.18,0.0,-0.04};\r
  input Real accel[maximumIntervals,spaceDimension] = {{0.0,0.0,9.81} for interval in 1:maximumIntervals};\r
  input Real gyro[maximumIntervals,spaceDimension] = zeros(maximumIntervals,spaceDimension);\r
  input Real gravity[spaceDimension] = {0.0,0.0,-9.81};\r
  input Real density[noiseDimension] = {0.06,0.06,0.06,0.006,0.006,0.006,0.002,0.002,0.002,0.0002,0.0002,0.0002};\r
  input Real durations[maximumIntervals] = fill(1.0/90.0,maximumIntervals);\r
  input Real intervalTimes[maximumIntervals];\r
  input Integer intervalCount;\r
  input Real frameTime;\r
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
  output Integer processedIntervals "Successfully accepted calls before success or whole-batch rollback";\r
  output Integer failedInterval "One-based failing call; zero for preflight refusal or no failure";\r
  output Integer batchReason "0 success, 1 idle, 2 count, 3 chronology, 4 stale image, 5 interval refusal, 6 previous state";\r
protected\r
  constant Integer maximumIntervals = 36;\r
  constant Integer featureCapacity = RGBDKeyframes.featureCapacity;\r
  constant Integer descriptorSize = RGBDKeyframes.descriptorSize;\r
  final parameter Real defaultRgbCalibration[4] = RGBDNominalCalibration({imageHeight,imageWidth},{69.0,42.0});\r
  final parameter Real defaultDepthCalibration[4] = RGBDNominalCalibration({imageHeight,imageWidth},{87.0,58.0});\r
  constant Integer spaceDimension = RGBDKeyframes.dimension;\r
  constant Integer errorDimension = 5*spaceDimension;\r
  constant Integer poseDimension = 2*spaceDimension;\r
  constant Integer noiseDimension = 4*spaceDimension;\r
  parameter Integer channelCount(min=3,max=4) = 4;\r
  constant Integer quaternionSize = 4;\r
equation\r
  (next,accepted,imageCompleted,mappingAccepted,\r
    graphCorrectionAccepted,roundoffCertified,publicationReason,ledgerReason,\r
    vocabularyReason,graphReason,graphCommitReason,graphFilterReason,\r
    covarianceStatus,graphCostBefore,graphCostAfter,nextQuaternion,\r
    selectionValid,predictionAccepted,initializationAccepted,observationAccepted,\r
    captureAccepted,matchCount,features,featureEnabled,\r
    trackingCurrentPixel,trackingReferencePixel,trackingEnabled,processedIntervals,\r
    failedInterval,batchReason) =\r
    AdvanceFastSLAMIntervals(\r
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
      durations=durations,\r
      intervalTimes=intervalTimes,\r
      intervalCount=intervalCount,\r
      frameTime=frameTime,\r
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
      graphPolicy=graphPolicy,depthUnits=depthUnits);\r
end RGBDFastSLAMIntervals;\r
\r
// All active clocks are preflighted before evaluation. Only the last held\r
// interval can consume an image, capture a reference or attempt graph correction.\r
// A failed call rolls back the complete State, including graph attempt receipts.\r
function AdvanceFastSLAMIntervals\r
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
  input Real accel[maximumIntervals,spaceDimension] = {{0.0,0.0,9.81} for interval in 1:maximumIntervals};\r
  input Real gyro[maximumIntervals,spaceDimension] = zeros(maximumIntervals,spaceDimension);\r
  input Real gravity[spaceDimension] = {0.0,0.0,-9.81};\r
  input Real density[noiseDimension] = {0.06,0.06,0.06,0.006,0.006,0.006,0.002,0.002,0.002,0.0002,0.0002,0.0002};\r
  input Real durations[maximumIntervals] = fill(1.0/90.0,maximumIntervals);\r
  input Real intervalTimes[maximumIntervals];\r
  input Integer intervalCount;\r
  input Real frameTime;\r
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
  output Integer processedIntervals "Successfully accepted calls before success or whole-batch rollback";\r
  output Integer failedInterval "One-based failing call; zero for preflight refusal or no failure";\r
  output Integer batchReason "0 success, 1 idle, 2 count, 3 chronology, 4 stale image, 5 interval refusal, 6 previous state";\r
  input Boolean depthQualifiedSelection = true;\r
  input Real depthUnits = 1.0 "Meters per depth sample; 1 for metric depth, SDK scale for Z16";\r
protected\r
  constant Integer maximumIntervals = 36;\r
  constant Integer featureCapacity = RGBDKeyframes.featureCapacity;\r
  constant Integer descriptorSize = RGBDKeyframes.descriptorSize;\r
  constant Integer spaceDimension = RGBDKeyframes.dimension;\r
  constant Integer errorDimension = 5*spaceDimension;\r
  constant Integer poseDimension = 2*spaceDimension;\r
  constant Integer noiseDimension = 4*spaceDimension;\r
  constant Integer channelCount = 4;\r
  constant Integer quaternionSize = 4;\r
  Boolean chronologyValid;\r
  Boolean continueBatch;\r
  Real previousEndpoint;\r
algorithm\r
  next := previous;\r
  accepted := false;\r
  imageCompleted := false;\r
  mappingAccepted := false;\r
  graphCorrectionAccepted := false;\r
  roundoffCertified := false;\r
  graphCostBefore := 0.0;\r
  graphCostAfter := 0.0;\r
  nextQuaternion := {1.0,0.0,0.0,0.0};\r
  selectionValid := 0.0;\r
  predictionAccepted := 0.0;\r
  initializationAccepted := 0.0;\r
  observationAccepted := 0.0;\r
  captureAccepted := 0.0;\r
  matchCount := 0.0;\r
  features := zeros(featureCapacity,spaceDimension);\r
  featureEnabled := zeros(featureCapacity);\r
  trackingCurrentPixel := zeros(featureCapacity,2);\r
  trackingReferencePixel := zeros(featureCapacity,2);\r
  trackingEnabled := zeros(featureCapacity);\r
  publicationReason := 1;\r
  ledgerReason := 1;\r
  vocabularyReason := 0;\r
  graphReason := 1;\r
  graphCommitReason := 0;\r
  graphFilterReason := 0;\r
  covarianceStatus := 0;\r
  processedIntervals := 0;\r
  failedInterval := 0;\r
  batchReason := 1;\r
  chronologyValid := false;\r
  continueBatch := false;\r
  previousEndpoint := 0.0;\r
  if requested then\r
    batchReason := 2;\r
    if intervalCount >= 1 and intervalCount <= maximumIntervals then\r
      batchReason := 6;\r
      if RGBDGraphProcessing.Valid(previous) and previous.estimator.localization.initialized then\r
        batchReason := 3;\r
        chronologyValid := frameTime >= 0.0 and frameTime <= 1e9;\r
        previousEndpoint := previous.estimator.localization.predictionTime;\r
        for interval in 1:intervalCount loop\r
          if chronologyValid then\r
            chronologyValid := ES15HeldIntervalValid(durations[interval])\r
              and intervalTimes[interval] >= 0.0 and intervalTimes[interval] <= 1e9\r
              and intervalTimes[interval] > previousEndpoint\r
              and abs(intervalTimes[interval]-previousEndpoint-durations[interval])\r
                <= 1e-12*max(1.0,abs(intervalTimes[interval]));\r
            if chronologyValid then\r
              previousEndpoint := intervalTimes[interval];\r
            end if;\r
          end if;\r
        end for;\r
        if chronologyValid then\r
          chronologyValid := abs(previousEndpoint-frameTime) <= 1e-12*max(1.0,abs(frameTime));\r
        end if;\r
        if chronologyValid then\r
          batchReason := 4;\r
          // Image identity is checked against the original pre-batch ledger.\r
          // No intermediate prediction can turn a stale image into a fresh one.\r
          continueBatch := if imageRequested then\r
            RGBDLocalizationCatalog.ImageFresh(previous.estimator.localization,imageEpoch,frameTime) else true;\r
          if continueBatch then\r
            batchReason := 0;\r
            for interval in 1:intervalCount loop\r
              if continueBatch then\r
                (next,accepted,imageCompleted,mappingAccepted,\r
                  graphCorrectionAccepted,roundoffCertified,publicationReason,ledgerReason,\r
                  vocabularyReason,graphReason,graphCommitReason,graphFilterReason,\r
                  covarianceStatus,graphCostBefore,graphCostAfter,nextQuaternion,\r
                  selectionValid,predictionAccepted,initializationAccepted,observationAccepted,\r
                  captureAccepted,matchCount,features,featureEnabled,\r
                  trackingCurrentPixel,trackingReferencePixel,trackingEnabled) := AdvanceFastSLAM(\r
                  previous=next,\r
                  rgb=rgb,\r
                  depth=depth,\r
                  rgbCalibration=rgbCalibration,\r
                  depthCalibration=depthCalibration,\r
                  disparityNoise=disparityNoise,\r
                  noiseReferenceFx=noiseReferenceFx,\r
                  baseline=baseline,\r
                  opticalToBody=opticalToBody,\r
                  cameraOriginBody=cameraOriginBody,\r
                  accel=accel[interval,:],\r
                  gyro=gyro[interval,:],\r
                  gravity=gravity,\r
                  density=density,\r
                  h=durations[interval],\r
                  intervalTime=intervalTimes[interval],\r
                  imageEpoch=imageEpoch,\r
                  imageRequested=imageRequested and interval == intervalCount,\r
                  localCaptureRequested=localCaptureRequested and interval == intervalCount,\r
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
                  graphCorrectionRequested=graphCorrectionRequested and interval == intervalCount,\r
                  graphPolicy=graphPolicy,depthUnits=depthUnits);\r
                if accepted and SLAMExactRealEqual(predictionAccepted,1.0) then\r
                  processedIntervals := processedIntervals+1;\r
                else\r
                  failedInterval := interval;\r
                  batchReason := 5;\r
                  continueBatch := false;\r
                end if;\r
              end if;\r
            end for;\r
          end if;\r
        end if;\r
      end if;\r
    end if;\r
  end if;\r
  if batchReason == 5 then\r
    // Keep only the failing call's rejection codes and batch diagnostics.\r
    // Neither a partial State nor an earlier image/producer/display result escapes.\r
    next := previous;\r
    accepted := false;\r
    imageCompleted := false;\r
    mappingAccepted := false;\r
    graphCorrectionAccepted := false;\r
    roundoffCertified := false;\r
    graphCostBefore := 0.0;\r
    graphCostAfter := 0.0;\r
    nextQuaternion := {1.0,0.0,0.0,0.0};\r
    selectionValid := 0.0;\r
    predictionAccepted := 0.0;\r
    initializationAccepted := 0.0;\r
    observationAccepted := 0.0;\r
    captureAccepted := 0.0;\r
    matchCount := 0.0;\r
    features := zeros(featureCapacity,spaceDimension);\r
    featureEnabled := zeros(featureCapacity);\r
    trackingCurrentPixel := zeros(featureCapacity,2);\r
    trackingReferencePixel := zeros(featureCapacity,2);\r
    trackingEnabled := zeros(featureCapacity);\r
  end if;\r
end AdvanceFastSLAMIntervals;\r
`;export{e as default};
