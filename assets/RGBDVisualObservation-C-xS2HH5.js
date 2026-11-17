const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Review graph: raw RGB/depth -> descriptors -> matches -> rigid registration\r
// -> map-frame body pose. Compile with RGBDFeatureMatching,\r
// RigidPointRegistration and RGBDRelativePose source files.\r
// The reference descriptors, optical points and body pose are retained estimated\r
// keyframe data. No ground-truth pose or host feature matching enters this graph.\r
// This is a visual observation frontend, not a persistent SLAM estimator.\r
model RGBDVisualObservation\r
\r
  parameter Integer imageWidth(min=1) = 160;\r
  parameter Integer imageHeight(min=1) = 90;\r
  // RGB8 uses three channels; historical RGBA recordings may retain alpha.\r
  parameter Integer channelCount(min=3,max=4) = 4;\r
  constant Integer featureCapacity = 350;\r
  constant Integer descriptorWidth = 7;\r
  constant Integer descriptorSize = descriptorWidth*descriptorWidth;\r
  input Boolean imageEnabled = true;\r
  input Real rgb[imageHeight,imageWidth,channelCount];\r
  input Real depth[imageHeight,imageWidth];\r
  input Real depthUnits = 1.0 "Meters per depth sample";\r
  input Real pixels[featureCapacity,2];\r
  input Real activeCount;\r
  input Real rgbCalibration[4];\r
  input Real depthCalibration[4];\r
  input Real disparityNoise = 0.08;\r
  input Real noiseReferenceFx;\r
  input Real baseline = 0.05;\r
  input Real referenceDescriptor[featureCapacity,descriptorSize];\r
  input Real referencePoint[featureCapacity,3];\r
  input Real referenceEnabled[featureCapacity];\r
  input Real referenceCount;\r
  input Real referenceBodyRotation[3,3] = identity(3);\r
  input Real referenceBodyPosition[3] = zeros(3);\r
  input Real opticalToBody[3,3] = [0.0,0.0,1.0;-1.0,0.0,0.0;0.0,-1.0,0.0];\r
  input Real cameraOriginBody[3] = {0.18,0.0,-0.04};\r
  // Optional predicted optical reference->current transform for association.\r
  input Real usePrediction = 0.0;\r
  input Real predictedRotation[3,3] = identity(3);\r
  input Real predictedTranslation[3] = zeros(3);\r
  output Real observedBodyRotation[3,3];\r
  output Real observedBodyPosition[3];\r
  output Real valid;\r
  output Real matchCount;\r
  output Real registrationRms;\r
  output Real registrationRejectionReason;\r
  output Real currentIndex[featureCapacity];\r
  // Complete current frame data for retaining a future reference keyframe.\r
  output Real currentDescriptor[featureCapacity,descriptorSize];\r
  output Real currentPoint[featureCapacity,3];\r
  output Real currentEnabled[featureCapacity];\r
protected\r
  RGBDDescriptorFrame description(imageHeight=imageHeight,imageWidth=imageWidth,\r
    channelCount=channelCount,imageEnabled=imageEnabled,rgb=rgb,depth=depth,depthUnits=depthUnits,pixels=pixels,\r
    activeCount=activeCount,rgbCalibration=rgbCalibration,depthCalibration=depthCalibration,\r
    disparityNoise=disparityNoise,noiseReferenceFx=noiseReferenceFx,baseline=baseline);\r
  RGBDFeatureMatching matching(referenceDescriptor=referenceDescriptor,\r
    currentDescriptor=description.descriptor,referencePoint=referencePoint,\r
    currentPoint=description.point,referenceEnabled=referenceEnabled,\r
    currentEnabled=description.enabled,referenceCount=referenceCount,currentCount=activeCount,\r
    usePrediction=usePrediction,predictedRotation=predictedRotation,\r
    predictedTranslation=predictedTranslation);\r
  // Pair masks can have holes anywhere in the full reference domain. Using\r
  // matching.count as activeCount would silently discard matches in later slots.\r
  RigidPointRegistration registration(capacity=featureCapacity,\r
    activeCount=featureCapacity,sourcePoint=matching.sourcePoint,\r
    targetPoint=matching.targetPoint,pairEnabled=matching.pairEnabled);\r
  RGBDRelativePose pose(referenceBodyRotation=referenceBodyRotation,\r
    referenceBodyPosition=referenceBodyPosition,currentFromReference=registration.rotation,\r
    currentFromReferenceTranslation=registration.translation,opticalToBody=opticalToBody,\r
    cameraOriginBody=cameraOriginBody,registrationAccepted=registration.accepted);\r
equation\r
  observedBodyRotation = pose.observedBodyRotation;\r
  observedBodyPosition = pose.observedBodyPosition;\r
  valid = if noEvent(matching.configurationValid > 0.5) then pose.valid else 0.0;\r
  matchCount = matching.count;\r
  registrationRms = registration.rms;\r
  registrationRejectionReason = registration.rejectionReason;\r
  currentIndex = matching.currentIndex;\r
  currentDescriptor = description.descriptor;\r
  currentPoint = description.point;\r
  currentEnabled = description.enabled;\r
end RGBDVisualObservation;\r
`;export{e as default};
