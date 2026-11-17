const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Raw sensor data and the complete persistent Modelica session owner.\r
partial model RGBDFastSLAMInterface\r
\r
  parameter Integer imageHeight(min=1) = RGBDKeyframes.imageHeight;\r
  parameter Integer imageWidth(min=1) = RGBDKeyframes.imageWidth;\r
  constant Integer featureCapacity = RGBDKeyframes.featureCapacity;\r
  constant Integer descriptorSize = RGBDKeyframes.descriptorSize;\r
  final parameter Real defaultRgbCalibration[4] = RGBDNominalCalibration({imageHeight,imageWidth},{69.0,42.0});\r
  final parameter Real defaultDepthCalibration[4] = RGBDNominalCalibration({imageHeight,imageWidth},{87.0,58.0});\r
\r
  input RGBDGraphProcessing.State previous;\r
  parameter Integer channelCount(min=3,max=4) = 4 "RGB or historical RGBA storage";\r
  input Real rgb[imageHeight,imageWidth,channelCount];\r
  input Real depth[imageHeight,imageWidth];\r
  input Real depthUnits = 1.0 "Meters per depth sample";\r
  input Real rgbCalibration[4] = defaultRgbCalibration;\r
  input Real depthCalibration[4] = defaultDepthCalibration;\r
  input Real disparityNoise = 0.08;\r
  input Real noiseReferenceFx = 848.0/(2.0*tan(87.0*3.141592653589793/360.0));\r
  input Real baseline = 0.05;\r
  input Real opticalToBody[3,3] = [0.0,0.0,1.0;-1.0,0.0,0.0;0.0,-1.0,0.0];\r
  input Real cameraOriginBody[3] = {0.18,0.0,-0.04};\r
\r
  input Real accel[3] = {0.0,0.0,9.81};\r
  input Real gyro[3] = zeros(3);\r
  input Real gravity[3] = {0.0,0.0,-9.81} annotation(Dialog(tab="SLAM", group="Inertial prediction"));\r
  input Real density[12] = {0.06,0.06,0.06,0.006,0.006,0.006,0.002,0.002,0.002,0.0002,0.0002,0.0002} annotation(Dialog(tab="SLAM", group="Inertial prediction"));\r
  input Real h = 1.0/90.0;\r
  input Real intervalTime;\r
  input Integer imageEpoch;\r
  input Boolean imageRequested = true;\r
  input Boolean localCaptureRequested = true annotation(Dialog(tab="SLAM", group="Visual reference capture"));\r
  input Boolean requested = true;\r
\r
  input Integer minimumMeasuredDescriptors = 8 annotation(Dialog(tab="SLAM", group="Appearance vocabulary"));\r
  input Real minimumWordDistanceSquared = 0.04 annotation(Dialog(tab="SLAM", group="Appearance vocabulary"));\r
  input Real selectedFeatureLimit = featureCapacity annotation(Dialog(tab="SLAM", group="Feature selection"));\r
  input Real absoluteThreshold = max(8.0,18.0*min(1.0,imageWidth/848.0))\r
    "Retain lower-contrast corners in reduced rasters; keep the full-raster threshold" annotation(Dialog(tab="SLAM", group="Feature selection"));\r
  input Boolean depthQualifiedSelection = true annotation(Dialog(tab="SLAM", group="Feature selection"));\r
  input Real minimumInterval(unit="s") = 0.5 annotation(Dialog(tab="SLAM", group="Keyframe capture"));\r
  input Real maximumInterval(unit="s") = 2.0 annotation(Dialog(tab="SLAM", group="Keyframe capture"));\r
  input Real translationThreshold(unit="m") = 0.6 annotation(Dialog(tab="SLAM", group="Keyframe capture"));\r
  input Real rotationThreshold(unit="rad") = 0.25 annotation(Dialog(tab="SLAM", group="Keyframe capture"));\r
  input Integer minimumFeatures = 12 annotation(Dialog(tab="SLAM", group="Keyframe capture"));\r
  input Real voxelWidth = 0.25 annotation(Dialog(tab="SLAM", group="Map maintenance"));\r
  input Real mergeRadius = 0.15 annotation(Dialog(tab="SLAM", group="Map maintenance"));\r
  input Real maximumDistance = 80.0 annotation(Dialog(tab="SLAM", group="Map maintenance"));\r
  input Real tentativeLifetime = 0.5 annotation(Dialog(tab="SLAM", group="Map maintenance"));\r
  input Real confirmedLifetime = 5.0 annotation(Dialog(tab="SLAM", group="Map maintenance"));\r
  input Real confirmationObservations = 3.0 annotation(Dialog(tab="SLAM", group="Map maintenance"));\r
  input Real maximumConfidence = 8.0 annotation(Dialog(tab="SLAM", group="Map maintenance"));\r
  input Real maximumTentative = 700.0 annotation(Dialog(tab="SLAM", group="Map maintenance"));\r
  input Boolean graphCorrectionRequested = true annotation(Dialog(tab="SLAM", group="Graph optimization"));\r
  input RGBDGraphProcessing.Policy graphPolicy = RGBDGraphProcessing.DefaultPolicy() annotation(Dialog(tab="SLAM", group="Graph optimization"));\r
\r
  input Real loopMinimumSimilarity = 0.35 annotation(Dialog(tab="SLAM", group="Loop retrieval"));\r
  input Real loopMinimumAge(unit="s") = 5.0 annotation(Dialog(tab="SLAM", group="Loop retrieval"));\r
  input Integer loopMinimumInliers = 12 annotation(Dialog(tab="SLAM", group="Loop verification"));\r
  input Real loopMinimumFraction = 0.5 annotation(Dialog(tab="SLAM", group="Loop verification"));\r
  input Real loopInlierDistance(unit="m") = 0.08 annotation(Dialog(tab="SLAM", group="Loop verification"));\r
  input Real loopMaximumRms(unit="m") = 0.03 annotation(Dialog(tab="SLAM", group="Loop verification"));\r
  input Boolean loopCalibratedResiduals = true annotation(Dialog(tab="SLAM", group="Loop verification"));\r
  input Real loopMaximumNormalizedSquared = 9.0 annotation(Dialog(tab="SLAM", group="Loop verification"));\r
  input Real loopMaximumPoseInnovation(unit="m") = 2.0 annotation(Dialog(tab="SLAM", group="Loop pose consistency"));\r
  input Real loopPoseConsistencySquared = 9.0 annotation(Dialog(tab="SLAM", group="Loop pose consistency"));\r
  input Boolean loopPoseConsistency = true annotation(Dialog(tab="SLAM", group="Loop pose consistency"));\r
\r
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
  output Real nextQuaternion[4];\r
  output Real selectionValid;\r
  output Real predictionAccepted;\r
  output Real initializationAccepted;\r
  output Real observationAccepted;\r
  output Real captureAccepted;\r
  output Real matchCount;\r
  output Real features[featureCapacity,3];\r
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
  annotation(Documentation(info = "<html>\r
    <h4>Runtime loop tuning</h4>\r
<p>The loopMinimumSimilarity, loopMinimumAge, loopMinimumInliers, loopMinimumFraction, loopInlierDistance, loopMaximumRms, loopCalibratedResiduals and loopMaximumNormalizedSquared inputs tune retrieved-loop verification. The loopMaximumPoseInnovation, loopPoseConsistencySquared and loopPoseConsistency controls tune retained-pose screening. All loop controls preserve the separate consecutive-frame odometry settings. Calibrated residuals use the squared uncertainty-normalized gate; metric distance and RMS limits apply in metric mode. Keyframe interval, translation and rotation inputs tune capture cadence. Defaults retain the existing behavior.</p>\r
<p>loopAttempted marks capture attempts. Per-rank loopCandidate outputs describe the retrieved references and their actual verification outcomes, including rejected proposals. A verified proposal is not a committed loop: inspect graph admission and the published graph separately.</p>\r
    <h4>Session lifecycle</h4>\r
<p>This boundary owns the complete persistent visual session. Supply the prior\r
session as <code>previous</code>; initialization and step adapters produce\r
<code>next</code>. Keep frame epochs, interval time, calibration and requested\r
operations consistent with the supplied image and IMU data.</p>\r
<p>Use <a href=\\"modelica://SLAM.RGBDFastSLAMInitialize\\">RGBDFastSLAMInitialize</a>\r
for initialization, <a href=\\"modelica://SLAM.RGBDFastSLAMStep\\">RGBDFastSLAMStep</a>\r
for advancement, and <a href=\\"modelica://SLAM.RGBDFastSLAMReset\\">RGBDFastSLAMReset</a>\r
for an explicit reset. Inspect operation-specific acceptance and reason outputs;\r
a produced array alone does not mean its update was accepted.</p>\r
<p>The browser application handles transport and rendering. Modelica owns image\r
processing, geometry, estimator and map state. Export/compiler support of the\r
complete graph must be validated separately from the smaller fixed-map visual\r
fusion replays.</p>\r
    </html>"));\r
end RGBDFastSLAMInterface;\r
`;export{e as default};
