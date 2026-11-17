const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// One source-owned publication of localization and optional catalog/map work.\r
// The enclosing model binds proposed to the actual localization outputs once.\r
// This is not graph correction, independent graph noise, or a complete SLAM preset.\r
package RGBDLocalizationCatalog\r
\r
  constant Integer dimension = RGBDKeyframes.dimension;\r
  constant Integer currentDimension = RGBDLocalizationFrame.currentDimension;\r
  constant Integer referenceDimension = RGBDKeyframes.poseDimension;\r
  constant Integer featureCapacity = RGBDKeyframes.featureCapacity;\r
  constant Integer descriptorSize = RGBDKeyframes.descriptorSize;\r
  constant Integer identifierLimit = RGBDKeyframes.identifierLimit;\r
\r
  record Estimator\r
    Real position[dimension]; Real velocity[dimension]; Real rotation[dimension,dimension];\r
    Real accelBias[dimension]; Real gyroBias[dimension];\r
    Real covariance[currentDimension,currentDimension];\r
    Real crossCovariance[currentDimension,referenceDimension];\r
    Real referenceCovariance[referenceDimension,referenceDimension];\r
    Real referencePosition[dimension]; Real referenceRotation[dimension,dimension];\r
    Real referenceAvailable; Real referenceEpoch; Real referenceUsed; Real lastUsedEpoch;\r
    Real referenceDescriptor[featureCapacity,descriptorSize];\r
    Real referencePoint[featureCapacity,dimension]; Real referenceEnabled[featureCapacity];\r
    Real referencePixels[featureCapacity,2]; Real referenceCount;\r
    Real referenceRgbCalibration[4]; Real referenceDepthCalibration[4];\r
    Real referenceNoiseReferenceFx; Real referenceDisparityNoise; Real referenceBaseline;\r
    Real referenceOpticalToBody[dimension,dimension]; Real referenceCameraOriginBody[dimension];\r
  end Estimator;\r
\r
  record ReferenceBirth\r
    Integer generation; Integer epoch;\r
    Integer sequence "Accepted processing-step identity at reference birth, not a replacement counter";\r
    Integer catalogId "0 means this local reference has no catalog capture binding";\r
  end ReferenceBirth;\r
\r
  record State\r
    Estimator estimator;\r
    RGBDKeyframes.Catalog catalog;\r
    RGBDGraphMeasurements.State graph;\r
    RGBDCatalogMapping.State map;\r
    Integer generation; Integer sourceRevision;\r
    Boolean initialized;\r
    Real predictionTime; Integer steps;\r
    Integer lastProcessedImageEpoch; Real lastProcessedImageTime;\r
    ReferenceBirth referenceBirth;\r
  end State;\r
\r
  record Result\r
    State next;\r
    Boolean accepted; Integer rejectionReason "0 accepted; 1 idle; 2 binding; 3 chronology; 4 producer; 5 estimator; 6 reference lifecycle";\r
    Boolean imageCompleted; Boolean mappingAccepted;\r
    Integer frameRejectionReason;\r
    RGBDKeyframePolicy.Decision decision;\r
    RGBDCatalogMapping.Diagnostics mapDiagnostics;\r
    RGBDGraphMeasurements.Problem problem;\r
  end Result;\r
\r
  function EmptyEstimator\r
    input Real position[dimension] = zeros(dimension);\r
    input Real velocity[dimension] = zeros(dimension);\r
    input Real rotation[dimension,dimension] = identity(dimension);\r
    input Real accelBias[dimension] = zeros(dimension);\r
    input Real gyroBias[dimension] = zeros(dimension);\r
    input Real covariance[currentDimension,currentDimension] = diagonal({0.25,0.25,0.25,\r
      0.04,0.04,0.04,0.01,0.01,0.01,0.0004,0.0004,0.0004,0.000025,0.000025,0.000025});\r
    output Estimator result;\r
  algorithm\r
    result.position := position; result.velocity := velocity; result.rotation := rotation;\r
    result.accelBias := accelBias; result.gyroBias := gyroBias; result.covariance := covariance;\r
    result.crossCovariance := zeros(currentDimension,referenceDimension);\r
    result.referenceCovariance := zeros(referenceDimension,referenceDimension);\r
    result.referencePosition := zeros(dimension); result.referenceRotation := identity(dimension);\r
    result.referenceAvailable := 0.0; result.referenceEpoch := 0.0;\r
    result.referenceUsed := 0.0; result.lastUsedEpoch := -1.0;\r
    result.referenceDescriptor := zeros(featureCapacity,descriptorSize);\r
    result.referencePoint := zeros(featureCapacity,dimension); result.referenceEnabled := zeros(featureCapacity);\r
    result.referencePixels := zeros(featureCapacity,2); result.referenceCount := 0.0;\r
    result.referenceRgbCalibration := {1.0,1.0,0.0,0.0};\r
    result.referenceDepthCalibration := {1.0,1.0,0.0,0.0};\r
    result.referenceNoiseReferenceFx := 1.0; result.referenceDisparityNoise := 0.08;\r
    result.referenceBaseline := 0.05; result.referenceOpticalToBody := identity(dimension);\r
    result.referenceCameraOriginBody := zeros(dimension);\r
  end EmptyEstimator;\r
\r
  function Empty\r
    input Estimator estimator;\r
    input Integer generation = 1;\r
    input Integer sourceRevision = 1;\r
    input Integer vocabularyVersion = 1;\r
    input Real worldFrame = 0.0;\r
    output State result;\r
  algorithm\r
    result.estimator := estimator;\r
    result.catalog := RGBDKeyframes.Empty(generation,vocabularyVersion);\r
    result.graph := RGBDGraphMeasurements.Empty(generation);\r
    result.map := RGBDCatalogMapping.Empty(generation,worldFrame);\r
    result.generation := generation; result.sourceRevision := sourceRevision;\r
    result.initialized := false; result.predictionTime := 0.0; result.steps := 0;\r
    result.lastProcessedImageEpoch := -1; result.lastProcessedImageTime := 0.0;\r
    result.referenceBirth.generation := generation; result.referenceBirth.epoch := -1;\r
    result.referenceBirth.sequence := 0; result.referenceBirth.catalogId := 0;\r
  end Empty;\r
\r
  function ValidEstimator\r
    input Estimator value;\r
    output Boolean valid;\r
  protected\r
    Real joint[currentDimension+referenceDimension,currentDimension+referenceDimension];\r
  algorithm\r
    valid := RGBDMapAnchors.ProperRotation(value.rotation)\r
      and SLAMCovariancePSDCheck(value.covariance,1e-12) == 1.0\r
      and (SLAMExactRealEqual(value.referenceAvailable,0.0) or SLAMExactRealEqual(value.referenceAvailable,1.0))\r
      and (SLAMExactRealEqual(value.referenceUsed,0.0) or SLAMExactRealEqual(value.referenceUsed,1.0))\r
      and value.lastUsedEpoch >= -1.0 and value.lastUsedEpoch <= identifierLimit\r
      and SLAMExactRealEqual(value.lastUsedEpoch,floor(value.lastUsedEpoch));\r
    for axis in 1:dimension loop\r
      valid := valid and abs(value.position[axis]) <= 1e6 and abs(value.velocity[axis]) <= 1e6\r
        and abs(value.accelBias[axis]) <= 2.0 and abs(value.gyroBias[axis]) <= 0.3;\r
    end for;\r
    // Unavailable reference buffers stay opaque, matching the propagation owner.\r
    if SLAMExactRealEqual(value.referenceAvailable,0.0) then\r
      valid := valid and SLAMExactRealEqual(value.referenceUsed,0.0);\r
    elseif SLAMExactRealEqual(value.referenceAvailable,1.0) then\r
      valid := valid and RGBDMapAnchors.ProperRotation(value.referenceRotation)\r
        and value.referenceEpoch >= 0.0 and value.referenceEpoch <= identifierLimit\r
        and SLAMExactRealEqual(value.referenceEpoch,floor(value.referenceEpoch))\r
        and ((SLAMExactRealEqual(value.referenceUsed,0.0) and value.referenceEpoch > value.lastUsedEpoch)\r
          or (SLAMExactRealEqual(value.referenceUsed,1.0) and value.referenceEpoch <= value.lastUsedEpoch));\r
      for axis in 1:dimension loop\r
        valid := valid and abs(value.referencePosition[axis]) <= 1e6;\r
      end for;\r
      joint := cat(1,cat(2,value.covariance,value.crossCovariance),\r
        cat(2,transpose(value.crossCovariance),value.referenceCovariance));\r
      valid := valid and SLAMCovariancePSDCheck(joint,1e-12) == 1.0;\r
    end if;\r
  end ValidEstimator;\r
\r
  function ValidHeader\r
    input State state;\r
    output Boolean valid;\r
  algorithm\r
    valid := state.generation >= 1 and state.generation <= identifierLimit\r
      and state.sourceRevision >= 1 and state.sourceRevision <= identifierLimit\r
      and state.steps >= 0 and state.steps < identifierLimit\r
      and state.predictionTime >= 0.0 and state.predictionTime <= 1e9\r
      and state.lastProcessedImageEpoch >= -1 and state.lastProcessedImageEpoch <= identifierLimit\r
      and state.lastProcessedImageTime >= 0.0 and state.lastProcessedImageTime <= state.predictionTime\r
      and RGBDKeyframes.ValidHeader(state.catalog)\r
      and state.catalog.generation == state.generation and state.graph.generation == state.generation\r
      and state.map.generation == state.generation\r
      and state.graph.revision >= 0 and state.graph.revision < identifierLimit\r
      and state.graph.lastCaptureId == state.catalog.nextId-1\r
      and state.graph.nextEdgeId >= 1 and state.graph.nextEdgeId <= identifierLimit\r
      and state.map.catalogRevision >= 0 and state.map.catalogRevision <= state.graph.revision\r
      and state.catalog.lastEpoch <= state.lastProcessedImageEpoch\r
      and state.map.imageEpoch >= -1 and state.map.imageEpoch <= state.lastProcessedImageEpoch\r
      and state.catalog.lastTime <= state.predictionTime and state.map.imageTime >= 0.0 and state.map.imageTime <= state.predictionTime\r
      and state.map.frame >= 0.0 and state.map.frame < identifierLimit\r
      and SLAMExactRealEqual(state.map.frame,floor(state.map.frame))\r
      and abs(state.map.worldFrame) <= 1e9\r
      and state.referenceBirth.generation == state.generation;\r
    if state.initialized then\r
      valid := valid and state.steps >= 1;\r
    else\r
      valid := valid and state.steps == 0 and SLAMExactRealEqual(state.predictionTime,0.0)\r
        and state.lastProcessedImageEpoch == -1 and state.catalog.nextId == 1\r
        and state.graph.revision == 0 and SLAMExactRealEqual(state.map.frame,0.0)\r
        and SLAMExactRealEqual(state.estimator.referenceAvailable,0.0)\r
        and SLAMExactRealEqual(state.estimator.lastUsedEpoch,-1.0);\r
    end if;\r
    if SLAMExactRealEqual(state.estimator.referenceAvailable,1.0) then\r
      valid := valid and state.referenceBirth.sequence >= 1 and state.referenceBirth.sequence <= state.steps\r
        and state.referenceBirth.epoch >= 0 and state.referenceBirth.epoch <= state.lastProcessedImageEpoch\r
        and SLAMExactRealEqual(state.estimator.referenceEpoch,state.referenceBirth.epoch)\r
        and state.referenceBirth.catalogId >= 0 and state.referenceBirth.catalogId < state.catalog.nextId;\r
    else\r
      valid := valid and state.referenceBirth.sequence == 0 and state.referenceBirth.epoch == -1\r
        and state.referenceBirth.catalogId == 0;\r
    end if;\r
  end ValidHeader;\r
\r
  function FrameBound\r
    input State previous; input Estimator proposed; input RGBDKeyframes.Frame measurement;\r
    input Integer imageEpoch; input Real imageTime;\r
    input Real observationAccepted; input Real captureAccepted; input Boolean frameAccepted;\r
    output Boolean frameBound;\r
  algorithm\r
    frameBound := frameAccepted and measurement.generation == previous.generation\r
      and measurement.id == previous.catalog.nextId and measurement.epoch == imageEpoch\r
      and SLAMExactRealEqual(measurement.imageTime,imageTime)\r
      and measurement.vocabularyVersion == previous.catalog.vocabularyVersion\r
      and (SLAMExactRealEqual(observationAccepted,1.0) or SLAMExactRealEqual(captureAccepted,1.0));\r
    if frameBound then\r
      for axis in 1:dimension loop\r
        frameBound := frameBound and SLAMExactRealEqual(measurement.bodyPosition[axis],proposed.position[axis]);\r
        for column in 1:dimension loop\r
          frameBound := frameBound and SLAMExactRealEqual(measurement.bodyRotation[axis,column],proposed.rotation[axis,column]);\r
        end for;\r
      end for;\r
      for row in 1:referenceDimension loop\r
        for column in 1:referenceDimension loop\r
          frameBound := frameBound and SLAMExactRealEqual(measurement.poseCovariance[row,column],\r
            proposed.covariance[RGBDLocalizationFrame.poseIndices[row],RGBDLocalizationFrame.poseIndices[column]]);\r
        end for;\r
      end for;\r
    end if;\r
  end FrameBound;\r
\r
  function ImageFresh\r
    input State previous; input Integer imageEpoch; input Real imageTime;\r
    output Boolean fresh;\r
  algorithm\r
    fresh := imageEpoch >= 0 and imageEpoch <= identifierLimit\r
      and imageEpoch > previous.lastProcessedImageEpoch\r
      and imageEpoch > previous.catalog.lastEpoch and imageEpoch > previous.map.imageEpoch\r
      and imageTime >= 0.0 and imageTime <= 1e9\r
      and (previous.lastProcessedImageEpoch == -1 or imageTime > previous.lastProcessedImageTime);\r
  end ImageFresh;\r
\r
  function CanAdvance\r
    input State previous; input Real intervalTime; input Real h;\r
    input Boolean initializing; input Boolean requested;\r
    output Boolean allowed;\r
  algorithm\r
    allowed := false;\r
    if requested then\r
      allowed := ValidHeader(previous) and intervalTime >= 0.0 and intervalTime <= 1e9;\r
      if initializing then\r
        allowed := allowed and not previous.initialized\r
          and SLAMExactRealEqual(intervalTime,0.0) and SLAMExactRealEqual(h,0.0);\r
      else\r
        allowed := allowed and previous.initialized and ES15HeldIntervalValid(h)\r
          and intervalTime > previous.predictionTime\r
          and abs(intervalTime-previous.predictionTime-h) <= 1e-12*max(1.0,abs(intervalTime));\r
      end if;\r
    end if;\r
  end CanAdvance;\r
\r
  function ReferenceHeld\r
    input Estimator previous; input Estimator proposed;\r
    output Boolean held;\r
  algorithm\r
    held := SLAMExactRealEqual(previous.referenceAvailable,proposed.referenceAvailable)\r
      and SLAMExactRealEqual(previous.referenceEpoch,proposed.referenceEpoch);\r
    if SLAMExactRealEqual(previous.referenceAvailable,1.0) then\r
      held := held and SLAMExactRealEqual(previous.referenceCount,proposed.referenceCount)\r
        and SLAMExactRealEqual(previous.referenceNoiseReferenceFx,proposed.referenceNoiseReferenceFx)\r
        and SLAMExactRealEqual(previous.referenceDisparityNoise,proposed.referenceDisparityNoise)\r
        and SLAMExactRealEqual(previous.referenceBaseline,proposed.referenceBaseline);\r
      for axis in 1:dimension loop\r
        held := held and SLAMExactRealEqual(previous.referencePosition[axis],proposed.referencePosition[axis])\r
          and SLAMExactRealEqual(previous.referenceCameraOriginBody[axis],proposed.referenceCameraOriginBody[axis]);\r
        for column in 1:dimension loop\r
          held := held and SLAMExactRealEqual(previous.referenceRotation[axis,column],proposed.referenceRotation[axis,column])\r
            and SLAMExactRealEqual(previous.referenceOpticalToBody[axis,column],proposed.referenceOpticalToBody[axis,column]);\r
        end for;\r
      end for;\r
      for coordinate in 1:4 loop\r
        held := held and SLAMExactRealEqual(previous.referenceRgbCalibration[coordinate],proposed.referenceRgbCalibration[coordinate])\r
          and SLAMExactRealEqual(previous.referenceDepthCalibration[coordinate],proposed.referenceDepthCalibration[coordinate]);\r
      end for;\r
      for row in 1:referenceDimension loop\r
        for column in 1:referenceDimension loop\r
          held := held and SLAMExactRealEqual(previous.referenceCovariance[row,column],proposed.referenceCovariance[row,column]);\r
        end for;\r
      end for;\r
      for feature in 1:featureCapacity loop\r
        held := held and SLAMExactRealEqual(previous.referenceEnabled[feature],proposed.referenceEnabled[feature]);\r
        if SLAMExactRealEqual(previous.referenceEnabled[feature],1.0) then\r
          for axis in 1:dimension loop\r
            held := held and SLAMExactRealEqual(previous.referencePoint[feature,axis],proposed.referencePoint[feature,axis]);\r
          end for;\r
          for coordinate in 1:2 loop\r
            held := held and SLAMExactRealEqual(previous.referencePixels[feature,coordinate],proposed.referencePixels[feature,coordinate]);\r
          end for;\r
          for coordinate in 1:descriptorSize loop\r
            held := held and SLAMExactRealEqual(previous.referenceDescriptor[feature,coordinate],proposed.referenceDescriptor[feature,coordinate]);\r
          end for;\r
        end if;\r
      end for;\r
    end if;\r
  end ReferenceHeld;\r
\r
  function CloneConsumedImage\r
    input Estimator previous;\r
    input RGBDKeyframes.Frame measurement "Same already-admitted frame, never a host reconstruction";\r
    output Estimator next;\r
    output Boolean accepted;\r
  protected\r
    Estimator candidate;\r
    Real cloneAccepted; Real cloneRejected;\r
  algorithm\r
    next := previous; accepted := false;\r
    // This image has already supplied its one localization observation. Clone\r
    // its pose into the graph reference without making its raw noise eligible\r
    // again. The next camera frame must capture a fresh tracking reference.\r
    if SLAMExactRealEqual(previous.referenceUsed,1.0)\r
        and SLAMExactRealEqual(previous.lastUsedEpoch,measurement.epoch) then\r
      candidate := previous;\r
      (cloneAccepted,cloneRejected,candidate.referenceAvailable,\r
        candidate.referencePosition,candidate.referenceRotation,candidate.covariance,\r
        candidate.crossCovariance,candidate.referenceCovariance) := SchmidtCaptureReference(\r
          previous.position,previous.rotation,previous.covariance,\r
          previous.referencePosition,previous.referenceRotation,previous.crossCovariance,\r
          previous.referenceCovariance,previous.referenceAvailable,1.0,1.0);\r
      if SLAMExactRealEqual(cloneAccepted,1.0) then\r
        candidate.referenceEpoch := measurement.epoch;\r
        candidate.referenceUsed := 1.0;\r
        candidate.referenceCount := measurement.count;\r
        candidate.referenceDescriptor := measurement.descriptor;\r
        candidate.referencePoint := measurement.opticalPoint;\r
        candidate.referenceRgbCalibration := measurement.rgbCalibration;\r
        candidate.referenceDepthCalibration := measurement.depthCalibration;\r
        candidate.referenceNoiseReferenceFx := measurement.noiseReferenceFx;\r
        candidate.referenceDisparityNoise := measurement.disparityNoise;\r
        candidate.referenceBaseline := measurement.baseline;\r
        candidate.referenceOpticalToBody := measurement.opticalToBody;\r
        candidate.referenceCameraOriginBody := measurement.cameraOriginBody;\r
        for feature in 1:featureCapacity loop\r
          candidate.referenceEnabled[feature] := if measurement.enabled[feature] then 1.0 else 0.0;\r
          for axis in 1:2 loop candidate.referencePixels[feature,axis] := measurement.pixels[feature,axis]; end for;\r
        end for;\r
        if ValidEstimator(candidate) then next := candidate; accepted := true; end if;\r
      end if;\r
    end if;\r
  end CloneConsumedImage;\r
\r
  function Publish\r
    input State previous;\r
    input Estimator proposed "Same compiled localization invocation; no host reconstruction";\r
    input RGBDKeyframes.Frame measurement;\r
    input Real producerAccepted "Prediction accepted, or explicit initialization accepted";\r
    input Real observationAccepted; input Real captureAccepted;\r
    input Boolean imageOn; input Integer imageEpoch; input Real imageTime; input Real h;\r
    input Boolean initializing;\r
    input Boolean frameAccepted; input Integer frameRejectionReason;\r
    input Boolean requested;\r
    input Real candidatePoint[featureCapacity,dimension]; input Real candidateEnabled[featureCapacity];\r
    input Real vocabulary[RGBDKeyframes.wordCapacity,descriptorSize];\r
    input Real vocabularyEnabled[RGBDKeyframes.wordCapacity];\r
    input Real minimumInterval = 0.5; input Real maximumInterval = 2.0;\r
    input Real translationThreshold = 0.6; input Real rotationThreshold = 0.25;\r
    input Integer minimumFeatures = 12;\r
    input Real voxelWidth = 0.25; input Real mergeRadius = 0.15;\r
    input Real maximumDistance = 80.0; input Real tentativeLifetime = 0.5;\r
    input Real confirmedLifetime = 5.0; input Real confirmationObservations = 3.0;\r
    input Real maximumConfidence = 8.0; input Real maximumTentative = 700.0;\r
    input Real posePositions[RGBDKeyframes.keyframeCapacity,dimension] = previous.catalog.bodyPositions;\r
    input Real poseRotations[RGBDKeyframes.keyframeCapacity,dimension,dimension] = previous.catalog.bodyRotations;\r
    input Integer poseRevision = previous.map.catalogRevision;\r
    output Result result;\r
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
    Boolean valid; Boolean frameBound;\r
    RGBDCatalogMapping.Result mapped;\r
    Estimator cloned;\r
    Boolean cloneAccepted;\r
  algorithm\r
    result.next := previous; result.accepted := false; result.rejectionReason := 1;\r
    result.imageCompleted := false; result.mappingAccepted := false;\r
    result.frameRejectionReason := frameRejectionReason;\r
    result.decision.valid := false; result.decision.captureRequested := false; result.decision.reason := 1;\r
    result.decision.enabledCount := 0; result.decision.elapsed := 0.0;\r
    result.decision.translationSquared := 0.0; result.decision.rotationCosine := 1.0;\r
    result.mapDiagnostics := RGBDCatalogMapping.EmptyDiagnostics();\r
    result.problem := RGBDGraphMeasurements.EmptyProblem();\r
    if requested then\r
      result.rejectionReason := 2;\r
      valid := ValidHeader(previous) and ValidEstimator(previous.estimator);\r
      if valid then\r
        result.rejectionReason := 3;\r
        valid := imageTime >= 0.0 and imageTime <= 1e9;\r
        if initializing then\r
          valid := valid and not previous.initialized and imageOn\r
            and SLAMExactRealEqual(imageTime,0.0) and SLAMExactRealEqual(h,0.0);\r
        else\r
          valid := valid and previous.initialized and ES15HeldIntervalValid(h)\r
            and imageTime > previous.predictionTime\r
            and abs(imageTime-previous.predictionTime-h) <= 1e-12*max(1.0,abs(imageTime));\r
        end if;\r
        if imageOn then valid := valid and ImageFresh(previous,imageEpoch,imageTime); end if;\r
        if valid then\r
          result.rejectionReason := 4;\r
          valid := SLAMExactRealEqual(producerAccepted,1.0)\r
            and (SLAMExactRealEqual(observationAccepted,0.0) or SLAMExactRealEqual(observationAccepted,1.0))\r
            and (SLAMExactRealEqual(captureAccepted,0.0) or SLAMExactRealEqual(captureAccepted,1.0))\r
            and (imageOn or (SLAMExactRealEqual(observationAccepted,0.0) and SLAMExactRealEqual(captureAccepted,0.0)))\r
            and (not initializing or SLAMExactRealEqual(observationAccepted,0.0));\r
          if valid then\r
            result.rejectionReason := 5; valid := ValidEstimator(proposed);\r
            if valid then\r
              result.rejectionReason := 6;\r
              valid := proposed.lastUsedEpoch >= previous.estimator.lastUsedEpoch\r
                and (not imageOn or proposed.lastUsedEpoch <= imageEpoch);\r
              if proposed.lastUsedEpoch > previous.estimator.lastUsedEpoch then\r
                valid := valid and imageOn and SLAMExactRealEqual(proposed.lastUsedEpoch,imageEpoch)\r
                  and SLAMExactRealEqual(proposed.referenceUsed,1.0);\r
              end if;\r
              if SLAMExactRealEqual(observationAccepted,1.0) then\r
                valid := valid and SLAMExactRealEqual(proposed.lastUsedEpoch,imageEpoch)\r
                  and SLAMExactRealEqual(proposed.referenceUsed,1.0)\r
                  and SLAMExactRealEqual(captureAccepted,0.0);\r
              end if;\r
              if SLAMExactRealEqual(captureAccepted,1.0) then\r
                valid := valid and previous.referenceBirth.sequence < identifierLimit\r
                  and SLAMExactRealEqual(proposed.referenceAvailable,1.0)\r
                  and SLAMExactRealEqual(proposed.referenceEpoch,imageEpoch)\r
                  and SLAMExactRealEqual(proposed.referenceUsed,0.0)\r
                  and imageEpoch > previous.estimator.lastUsedEpoch;\r
                for axis in 1:dimension loop\r
                  valid := valid and SLAMExactRealEqual(proposed.referencePosition[axis],proposed.position[axis]);\r
                  for column in 1:dimension loop\r
                    valid := valid and SLAMExactRealEqual(proposed.referenceRotation[axis,column],proposed.rotation[axis,column]);\r
                  end for;\r
                end for;\r
                for row in 1:currentDimension loop\r
                  for column in 1:referenceDimension loop\r
                    valid := valid and SLAMExactRealEqual(proposed.crossCovariance[row,column],\r
                      proposed.covariance[row,RGBDLocalizationFrame.poseIndices[column]]);\r
                  end for;\r
                end for;\r
                for row in 1:referenceDimension loop\r
                  for column in 1:referenceDimension loop\r
                    valid := valid and SLAMExactRealEqual(proposed.referenceCovariance[row,column],\r
                      proposed.covariance[RGBDLocalizationFrame.poseIndices[row],RGBDLocalizationFrame.poseIndices[column]]);\r
                  end for;\r
                end for;\r
              else\r
                valid := valid and ReferenceHeld(previous.estimator,proposed)\r
                  and proposed.referenceUsed >= previous.estimator.referenceUsed;\r
              end if;\r
              if not imageOn then\r
                valid := valid and SLAMExactRealEqual(proposed.lastUsedEpoch,previous.estimator.lastUsedEpoch)\r
                  and SLAMExactRealEqual(proposed.referenceUsed,previous.estimator.referenceUsed);\r
              end if;\r
              if valid then\r
                // Completed localization and its raw-noise ledger commit even\r
                // when optional Frame/BoW/registration/map admission refuses.\r
                result.next.estimator := proposed; result.next.initialized := true;\r
                if SLAMExactRealEqual(captureAccepted,0.0) then\r
                  // Retained image payload is immutable, including unavailable\r
                  // and disabled cells. Copy its owner rather than comparing NaN\r
                  // payload with numerical equality or inventing canonical data.\r
                  result.next.estimator.referenceDescriptor := previous.estimator.referenceDescriptor;\r
                  result.next.estimator.referencePoint := previous.estimator.referencePoint;\r
                  result.next.estimator.referenceEnabled := previous.estimator.referenceEnabled;\r
                  result.next.estimator.referencePixels := previous.estimator.referencePixels;\r
                  result.next.estimator.referenceCount := previous.estimator.referenceCount;\r
                  result.next.estimator.referenceRgbCalibration := previous.estimator.referenceRgbCalibration;\r
                  result.next.estimator.referenceDepthCalibration := previous.estimator.referenceDepthCalibration;\r
                  result.next.estimator.referenceNoiseReferenceFx := previous.estimator.referenceNoiseReferenceFx;\r
                  result.next.estimator.referenceDisparityNoise := previous.estimator.referenceDisparityNoise;\r
                  result.next.estimator.referenceBaseline := previous.estimator.referenceBaseline;\r
                  result.next.estimator.referenceOpticalToBody := previous.estimator.referenceOpticalToBody;\r
                  result.next.estimator.referenceCameraOriginBody := previous.estimator.referenceCameraOriginBody;\r
                  result.next.estimator.referencePosition := previous.estimator.referencePosition;\r
                  result.next.estimator.referenceRotation := previous.estimator.referenceRotation;\r
                  result.next.estimator.referenceCovariance := previous.estimator.referenceCovariance;\r
                  if SLAMExactRealEqual(previous.estimator.referenceAvailable,0.0) then\r
                    result.next.estimator.crossCovariance := previous.estimator.crossCovariance;\r
                  end if;\r
                end if;\r
                result.next.predictionTime := imageTime; result.next.steps := previous.steps+1;\r
                result.accepted := true; result.rejectionReason := 0;\r
                if SLAMExactRealEqual(captureAccepted,1.0) then\r
                  result.next.referenceBirth.generation := previous.generation;\r
                  result.next.referenceBirth.epoch := imageEpoch;\r
                  result.next.referenceBirth.sequence := previous.steps+1;\r
                  result.next.referenceBirth.catalogId := 0;\r
                end if;\r
                if imageOn then\r
                  result.imageCompleted := true;\r
                  result.next.lastProcessedImageEpoch := imageEpoch;\r
                  result.next.lastProcessedImageTime := imageTime;\r
                  // Check binding in addition to the builder's own certificate.\r
                  // Pose/covariance are from the same accepted localization.\r
                  frameBound := FrameBound(previous,proposed,measurement,imageEpoch,imageTime,\r
                    observationAccepted,captureAccepted,frameAccepted);\r
                  if frameAccepted and not frameBound then result.frameRejectionReason := 8; end if;\r
                  if frameBound then\r
                    (mapped,result.decision) := RGBDCatalogFrame.Advance(previous.catalog,previous.graph,previous.map,\r
                      measurement,vocabulary,vocabularyEnabled,candidatePoint,candidateEnabled,true,1.0,true,\r
                      minimumInterval=minimumInterval,maximumInterval=maximumInterval,\r
                      translationThreshold=translationThreshold,rotationThreshold=rotationThreshold,minimumFeatures=minimumFeatures,\r
                      voxelWidth=voxelWidth,mergeRadius=mergeRadius,maximumDistance=maximumDistance,\r
                      tentativeLifetime=tentativeLifetime,confirmedLifetime=confirmedLifetime,\r
                      confirmationObservations=confirmationObservations,maximumConfidence=maximumConfidence,maximumTentative=maximumTentative,\r
                      nodePosition=posePositions,nodeRotation=poseRotations,poseRevision=poseRevision,\r
                      loopMinimumSimilarity=loopMinimumSimilarity,\r
                      loopMinimumAge=loopMinimumAge,\r
                      loopMinimumInliers=loopMinimumInliers,\r
                      loopMinimumFraction=loopMinimumFraction,\r
                      loopInlierDistance=loopInlierDistance,\r
                      loopMaximumRms=loopMaximumRms,\r
                      loopCalibratedResiduals=loopCalibratedResiduals,\r
                      loopMaximumNormalizedSquared=loopMaximumNormalizedSquared,\r
      loopMaximumPoseInnovation=loopMaximumPoseInnovation, loopPoseConsistencySquared=loopPoseConsistencySquared, loopPoseConsistency=loopPoseConsistency);\r
                    result.mapDiagnostics := mapped.diagnostics; result.problem := mapped.problem;\r
                    if mapped.accepted then\r
                      result.next.catalog := mapped.catalog; result.next.graph := mapped.graph; result.next.map := mapped.map;\r
                      result.mappingAccepted := true;\r
                      if result.next.catalog.nextId == previous.catalog.nextId+1\r
                        and result.next.referenceBirth.epoch == imageEpoch\r
                        and result.next.referenceBirth.generation == previous.generation then\r
                        result.next.referenceBirth.catalogId := measurement.id;\r
                      end if;\r
                      if result.next.catalog.nextId == previous.catalog.nextId+1\r
                          and SLAMExactRealEqual(observationAccepted,1.0)\r
                          and result.next.referenceBirth.catalogId == 0 then\r
                        // FrameBound and actual graph admission precede this\r
                        // owner transition. ID, birth and covariance commit\r
                        // together; a refused clone leaves the old owner held.\r
                        (cloned,cloneAccepted) := CloneConsumedImage(result.next.estimator,measurement);\r
                        if cloneAccepted then\r
                          result.next.estimator := cloned;\r
                          result.next.referenceBirth.generation := previous.generation;\r
                          result.next.referenceBirth.epoch := imageEpoch;\r
                          result.next.referenceBirth.sequence := result.next.steps;\r
                          result.next.referenceBirth.catalogId := measurement.id;\r
                        end if;\r
                      end if;\r
                    end if;\r
                  end if;\r
                end if;\r
              end if;\r
            end if;\r
          end if;\r
        end if;\r
      end if;\r
    end if;\r
  end Publish;\r
end RGBDLocalizationCatalog;\r
`;export{e as default};
