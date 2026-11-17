const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Review composition: full calibrated visual frontend plus its registration\r
// noise model. Compile together with RGBDVisualObservation, RGBDFeatureMatching,\r
// RigidPointRegistration, RGBDRelativePose and RGBDRegistrationUncertainty.\r
// This source has not yet passed a connected source-issued numerical gate.\r
model RGBDVisualRelativeObservation\r
\r
  extends RGBDVisualObservation;\r
  // Retain these with the reference image rather than substituting the current\r
  // image calibration. The noise model assumes a common stereo baseline and\r
  // disparity sigma for the pair; changing those requires a new noise model.\r
  input Real referenceRgbFocal[2];\r
  input Real referenceNoiseReferenceFx;\r
  parameter Real localizationSigma = 0.5;\r
  parameter Real depthInflation = 1.0;\r
  parameter Real uncertaintyCoordinateLimit = 100.0;\r
  parameter Real uncertaintyMinimumPivot = 1e-10;\r
  output Real currentFromReference[3,3];\r
  output Real currentFromReferenceTranslation[3];\r
  output Real relativeCovariance[6,6]\r
    "Optical translation and optical left-angle perturbation; use with Schmidt update";\r
  output Real conditionalObservationCovariance[6,6]\r
    "Conditional on retained reference pose; not independent absolute noise";\r
  output Real relativeValid;\r
  output Real uncertaintyRejectionReason;\r
  output Real uncertaintyValidCount;\r
  output Real uncertaintyInvalidCount;\r
protected\r
  // Registration and uncertainty consume exactly the same complete sparse\r
  // pair domain. matching.count is not a prefix extent.\r
  Real uncertaintyValid;\r
  Real normalMatrix[6,6];\r
  Real noiseMatrix[6,6];\r
  Real observationJacobian[6,6];\r
  Real minimumScaledPivot;\r
equation\r
  // Call the existing function so per-frame calibrated noise remains a runtime\r
  // input; it must not initialize a parameter from a varying input binding.\r
  (uncertaintyValid,uncertaintyRejectionReason,uncertaintyValidCount,\r
    uncertaintyInvalidCount,relativeCovariance,conditionalObservationCovariance,\r
    normalMatrix,noiseMatrix,observationJacobian,minimumScaledPivot) =\r
    RGBDRegistrationSandwich(matching.sourcePoint,matching.targetPoint,\r
      matching.pairEnabled,featureCapacity,valid,registration.rotation,\r
      registration.translation,referenceBodyRotation,opticalToBody,\r
      cameraOriginBody,referenceRgbFocal,{rgbCalibration[1],rgbCalibration[2]},\r
      referenceNoiseReferenceFx,noiseReferenceFx,baseline,localizationSigma,\r
      disparityNoise,depthInflation,uncertaintyCoordinateLimit,uncertaintyMinimumPivot);\r
  currentFromReference = registration.rotation;\r
  currentFromReferenceTranslation = registration.translation;\r
  relativeValid = if noEvent(valid > 0.5 and uncertaintyValid > 0.5) then 1.0 else 0.0;\r
end RGBDVisualRelativeObservation;\r
\r
// Ordered full raw-camera composition. The equation models above retain the\r
// unweighted baseline; robustRegistration=false selects that same fit here.\r
// The bounded consensus fallback uses calibrated per-pair residuals by default.\r
// calibratedRegistration=false retains the fixed metric gate for comparisons.\r
// imageEnabled retains its existing meaning\r
// (only description is bypassed, matching/registration still report refusals).\r
function ObserveRGBDRelativeFrame\r
\r
  input Real rgb[:,:,:]; input Real depth[size(rgb,1),size(rgb,2)];\r
  input Real pixels[featureCapacity,2]; input Real activeCount;\r
  input Real rgbCalibration[4]; input Real depthCalibration[4]; input Real noiseReferenceFx;\r
  input Real referenceDescriptor[featureCapacity,descriptorSize]; input Real referencePoint[featureCapacity,3];\r
  input Real referenceEnabled[featureCapacity]; input Real referenceCount;\r
  input Real referenceRgbFocal[2]; input Real referenceNoiseReferenceFx;\r
  input Boolean imageEnabled = true;\r
  input Real disparityNoise = 0.08; input Real baseline = 0.05;\r
  input Real referenceBodyRotation[3,3] = identity(3);\r
  input Real referenceBodyPosition[3] = zeros(3);\r
  input Real opticalToBody[3,3] = [0.0,0.0,1.0;-1.0,0.0,0.0;0.0,-1.0,0.0];\r
  input Real cameraOriginBody[3] = {0.18,0.0,-0.04};\r
  input Real usePrediction = 0.0;\r
  input Real predictedRotation[3,3] = identity(3); input Real predictedTranslation[3] = zeros(3);\r
  input Real nearDepth = 0.28; input Real farDepth = 10.0; input Real minimumContrast = 1e-6;\r
  input Real ratio = 0.8; input Real maximumDescriptorDistance = 0.8; input Real maximumGeometricDistance = 0.5;\r
  input Real registrationCoordinateLimit = 1e6; input Real rankTolerance = 1e-8; input Real maximumRms = 0.02;\r
  input Real localizationSigma = 0.5; input Real depthInflation = 1.0;\r
  input Real uncertaintyCoordinateLimit = 100.0; input Real uncertaintyMinimumPivot = 1e-10;\r
  input Boolean robustRegistration = true;\r
  input Integer maximumRegistrationHypotheses = 64;\r
  input Real minimumRegistrationConsensusFraction = 0.5;\r
  output Real observedBodyRotation[3,3]; output Real observedBodyPosition[3];\r
  output Real valid; output Real matchCount; output Real registrationRms; output Real registrationRejectionReason;\r
  output Real currentIndex[featureCapacity]; output Real currentDescriptor[featureCapacity,descriptorSize];\r
  output Real currentPoint[featureCapacity,3]; output Real currentEnabled[featureCapacity];\r
  output Real currentFromReference[3,3]; output Real currentFromReferenceTranslation[3];\r
  output Real relativeCovariance[6,6] "Optical translation/left-angle runtime relative noise";\r
  output Real conditionalObservationCovariance[6,6] "Conditional on retained reference pose; not independent absolute noise";\r
  output Real relativeValid; output Real uncertaintyRejectionReason;\r
  output Real uncertaintyValidCount; output Real uncertaintyInvalidCount;\r
  output Real descriptionInvalidCount; output Real matchingConfigurationValid;\r
  output Real invalidReference; output Real invalidCurrent; output Real pairEnabled[featureCapacity];\r
  output Real registrationAccepted; output Real registrationValidCount; output Real registrationInvalidCount;\r
  output Real registrationRank; output Real uncertaintyValid;\r
  input Real depthUnits = 1.0 "Meters per depth sample; 1 for metric depth, SDK scale for Z16";\r
  input Boolean calibratedRegistration = true;\r
  input Real maximumNormalizedSquared = 9.0 "Squared whitened residual radius, not a metric RMS";\r
  input Boolean pairRequested = true "False keeps current image extraction but skips ineligible matching and registration";\r
protected\r
  constant Integer featureCapacity = 350;\r
  constant Integer descriptorWidth = 7; constant Integer descriptorSize = descriptorWidth*descriptorWidth;\r
  Real sourcePoint[featureCapacity,3]; Real targetPoint[featureCapacity,3];\r
  Real nearestDistance[featureCapacity]; Real secondDistance[featureCapacity];\r
  Real candidatePairEnabled[featureCapacity]; Real registrationInlierMask[featureCapacity];\r
  Real registrationRejectedCount;\r
  Real registrationCost; Real eigenGap; Real sourceCentroid[3]; Real targetCentroid[3];\r
  Real sourceCovariance[featureCapacity,3,3]; Real targetCovariance[featureCapacity,3,3];\r
  Boolean noiseConfiguration;\r
  Real poseValid; Real normalMatrix[6,6]; Real noiseMatrix[6,6]; Real observationJacobian[6,6]; Real minimumScaledPivot;\r
algorithm\r
  (currentDescriptor,currentPoint,currentEnabled,descriptionInvalidCount) :=\r
    DescribeRGBDFrame(rgb,depth,pixels,activeCount,rgbCalibration,depthCalibration,\r
      disparityNoise,noiseReferenceFx,baseline,nearDepth,farDepth,minimumContrast,imageEnabled,depthUnits=depthUnits);\r
  if pairRequested then\r
    (currentIndex,candidatePairEnabled,sourcePoint,targetPoint,matchCount,matchingConfigurationValid,\r
      invalidReference,invalidCurrent,nearestDistance,secondDistance) :=\r
      MatchRGBDDescriptors(referenceDescriptor,currentDescriptor,referencePoint,currentPoint,\r
        referenceEnabled,currentEnabled,referenceCount,activeCount,ratio,maximumDescriptorDistance,\r
        usePrediction,predictedRotation,predictedTranslation,maximumGeometricDistance);\r
    // Sparse masks span the complete reference domain, never the match prefix.\r
    if robustRegistration then\r
      sourceCovariance := zeros(featureCapacity,3,3); targetCovariance := zeros(featureCapacity,3,3);\r
      noiseConfiguration := referenceRgbFocal[1] > 0 and referenceRgbFocal[2] > 0\r
        and rgbCalibration[1] > 0 and rgbCalibration[2] > 0\r
        and referenceNoiseReferenceFx > 0 and noiseReferenceFx > 0 and baseline > 0\r
        and localizationSigma > 0 and disparityNoise > 0 and depthInflation >= 1;\r
      if calibratedRegistration and noiseConfiguration then\r
        for pair in 1:featureCapacity loop\r
          if candidatePairEnabled[pair] == 1 and sourcePoint[pair,3] > 0 and targetPoint[pair,3] > 0 then\r
            sourceCovariance[pair,:,:] := RGBDOpticalPointCovariance(sourcePoint[pair,:],\r
              referenceRgbFocal[1],referenceRgbFocal[2],localizationSigma,disparityNoise,\r
              referenceNoiseReferenceFx,baseline,depthInflation);\r
            targetCovariance[pair,:,:] := RGBDOpticalPointCovariance(targetPoint[pair,:],\r
              rgbCalibration[1],rgbCalibration[2],localizationSigma,disparityNoise,\r
              noiseReferenceFx,baseline,depthInflation);\r
          end if;\r
        end for;\r
      end if;\r
      (registrationAccepted,registrationRejectionReason,currentFromReference,currentFromReferenceTranslation,\r
        registrationValidCount,registrationInvalidCount,registrationRank,registrationCost,registrationRms,\r
        eigenGap,sourceCentroid,targetCentroid,registrationInlierMask,registrationRejectedCount) :=\r
        FitRigidPointPairsRobust(sourcePoint,targetPoint,candidatePairEnabled,\r
          featureCapacity,registrationCoordinateLimit,rankTolerance,maximumRms,\r
          maximumRegistrationHypotheses,minimumRegistrationConsensusFraction,\r
          useCovariance=calibratedRegistration,sourceCovariance=sourceCovariance,targetCovariance=targetCovariance,\r
          maximumNormalizedSquared=maximumNormalizedSquared,covarianceMinimumPivot=uncertaintyMinimumPivot);\r
    else\r
      (registrationAccepted,registrationRejectionReason,currentFromReference,currentFromReferenceTranslation,\r
        registrationValidCount,registrationInvalidCount,registrationRank,registrationCost,registrationRms,\r
        eigenGap,sourceCentroid,targetCentroid) := FitRigidPointPairs(sourcePoint,targetPoint,candidatePairEnabled,\r
          featureCapacity,registrationCoordinateLimit,rankTolerance,maximumRms);\r
      registrationInlierMask := candidatePairEnabled; registrationRejectedCount := 0.0;\r
    end if;\r
    // Descriptor candidates remain observable in matchCount. Accepted registration,\r
    // uncertainty and tracking consume the same certified sparse inlier inventory.\r
    // On refusal retain candidate diagnostics; valid=0 prevents a filter update.\r
    pairEnabled := if registrationAccepted > 0.5 then registrationInlierMask else candidatePairEnabled;\r
    if registrationAccepted > 0.5 then\r
      for pair in 1:featureCapacity loop\r
        if registrationInlierMask[pair] < 0.5 then currentIndex[pair] := 0.0; end if;\r
      end for;\r
    end if;\r
    (poseValid,observedBodyRotation,observedBodyPosition) := RGBDRelativeBodyPose(referenceBodyRotation,\r
      referenceBodyPosition,currentFromReference,currentFromReferenceTranslation,opticalToBody,\r
      cameraOriginBody,registrationAccepted);\r
    valid := if matchingConfigurationValid > 0.5 then poseValid else 0.0;\r
    (uncertaintyValid,uncertaintyRejectionReason,uncertaintyValidCount,uncertaintyInvalidCount,\r
      relativeCovariance,conditionalObservationCovariance,normalMatrix,noiseMatrix,observationJacobian,minimumScaledPivot) :=\r
      RGBDRegistrationSandwich(sourcePoint,targetPoint,pairEnabled,featureCapacity,valid,currentFromReference,\r
        currentFromReferenceTranslation,referenceBodyRotation,opticalToBody,cameraOriginBody,\r
        referenceRgbFocal,{rgbCalibration[1],rgbCalibration[2]},referenceNoiseReferenceFx,noiseReferenceFx,\r
        baseline,localizationSigma,disparityNoise,depthInflation,uncertaintyCoordinateLimit,uncertaintyMinimumPivot,\r
        weighted=robustRegistration and calibratedRegistration);\r
    relativeValid := if valid > 0.5 and uncertaintyValid > 0.5 then 1.0 else 0.0;\r
  else\r
    // The image owner has already ruled out a visual update. Extraction above\r
    // is still required for a fresh reference and catalog/map observation.\r
    observedBodyRotation := identity(3); observedBodyPosition := zeros(3);\r
    valid := 0.0; matchCount := 0.0; registrationRms := 0.0; registrationRejectionReason := 1.0;\r
    currentIndex := zeros(featureCapacity); pairEnabled := zeros(featureCapacity);\r
    currentFromReference := identity(3); currentFromReferenceTranslation := zeros(3);\r
    relativeCovariance := zeros(6,6); conditionalObservationCovariance := zeros(6,6);\r
    relativeValid := 0.0; uncertaintyRejectionReason := 1.0;\r
    uncertaintyValidCount := 0.0; uncertaintyInvalidCount := 0.0;\r
    matchingConfigurationValid := 0.0; invalidReference := 0.0; invalidCurrent := 0.0;\r
    registrationAccepted := 0.0; registrationValidCount := 0.0; registrationInvalidCount := 0.0;\r
    registrationRank := 0.0; uncertaintyValid := 0.0;\r
  end if;\r
end ObserveRGBDRelativeFrame;\r
`;export{e as default};
