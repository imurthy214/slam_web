const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Geometric verification of a retrieved keyframe. A verified measurement is a\r
// proposal: graph identity/eviction and shared-image correlation policies must\r
// still admit it before any optimizer or estimator state can change.\r
package RGBDLoopVerification\r
\r
  constant Integer featureCapacity = RGBDKeyframes.featureCapacity;\r
  constant Integer dimension = 3;\r
  constant Integer poseDimension = 6;\r
  constant Integer maximumTrials = 256;\r
  constant Integer maximumRefinements = 8;\r
  constant Integer randomModulus = 2147483647;\r
\r
  // Park-Miller with Schrage decomposition. Every Integer intermediate fits\r
  // signed 32-bit storage; no large floating-point RNG product is required.\r
  function NextSample\r
    input Integer previous;\r
    output Integer next;\r
  protected\r
    Integer high; Integer low; Integer difference;\r
  algorithm\r
    next := 0;\r
    if previous >= 1 and previous < randomModulus then\r
      high := div(previous,127773);\r
      low := mod(previous,127773);\r
      difference := 16807*low-2836*high;\r
      next := if difference > 0 then difference else difference+randomModulus;\r
    end if;\r
  end NextSample;\r
\r
  function ScorePairs\r
    input Real sourcePoint[:,dimension];\r
    input Real targetPoint[size(sourcePoint,1),dimension];\r
    input Real pairEnabled[size(sourcePoint,1)];\r
    input Real rotation[dimension,dimension]; input Real translation[dimension];\r
    input Real distanceLimit;\r
    output Real mask[size(sourcePoint,1)];\r
    output Integer count;\r
    output Real cost;\r
    input Boolean calibratedResiduals = false;\r
    input Real sourceCovariance[size(sourcePoint,1),dimension,dimension] = zeros(size(sourcePoint,1),dimension,dimension);\r
    input Real targetCovariance[size(sourcePoint,1),dimension,dimension] = zeros(size(sourcePoint,1),dimension,dimension);\r
    input Real maximumNormalizedSquared = 9.0;\r
    input Real minimumPivot = 1e-10;\r
  protected\r
    Real residual[dimension]; Real squared; Boolean residualValid;\r
  algorithm\r
    mask := zeros(size(sourcePoint,1)); count := 0; cost := 0.0;\r
    for slot in 1:size(sourcePoint,1) loop\r
      if pairEnabled[slot] == 1.0 then\r
        if calibratedResiduals then\r
          (residualValid,squared) := RegistrationPairResidual(sourcePoint[slot,:],targetPoint[slot,:],\r
            rotation,translation,true,sourceCovariance[slot,:,:],targetCovariance[slot,:,:],minimumPivot);\r
        else\r
          residual := rotation*sourcePoint[slot,:]+translation-targetPoint[slot,:];\r
          squared := residual*residual; residualValid := squared >= 0.0;\r
        end if;\r
        if residualValid and squared <= (if calibratedResiduals then maximumNormalizedSquared else distanceLimit^2) then\r
          mask[slot] := 1.0; count := count+1; cost := cost+squared;\r
        end if;\r
      end if;\r
    end for;\r
  end ScorePairs;\r
\r
  // Three-point hypotheses are scored against the entire original sparse\r
  // domain. The slot list is only a sampling index, never a prefix extent.\r
  // A finite trial budget can miss a real loop; it does not certify recall.\r
  function Consensus\r
    input Real sourcePoint[:,dimension];\r
    input Real targetPoint[size(sourcePoint,1),dimension];\r
    input Real pairEnabled[size(sourcePoint,1)];\r
    input Boolean requested;\r
    input Integer seed; input Integer trials; input Integer refinements;\r
    input Integer minimumInliers; input Real minimumFraction;\r
    input Real inlierDistance; input Real maximumRms;\r
    input Real coordinateLimit; input Real rankTolerance;\r
    output Boolean valid;\r
    output Integer rejectionReason;\r
    output Real rotation[dimension,dimension]; output Real translation[dimension];\r
    output Real inlierMask[size(sourcePoint,1)];\r
    output Integer matchCount; output Integer inlierCount;\r
    output Real rms; output Integer nextSeed;\r
    input Boolean calibratedResiduals = false;\r
    input Real sourceCovariance[size(sourcePoint,1),dimension,dimension] = zeros(size(sourcePoint,1),dimension,dimension);\r
    input Real targetCovariance[size(sourcePoint,1),dimension,dimension] = zeros(size(sourcePoint,1),dimension,dimension);\r
    input Real maximumNormalizedSquared = 9.0;\r
    input Real minimumPivot = 1e-10;\r
  protected\r
    Boolean configuration; Boolean payload; Boolean eligible; Boolean stable; Boolean weightedValid;\r
    Boolean covarianceValid;\r
    Integer slots[size(sourcePoint,1)]; Integer first; Integer second; Integer third;\r
    Integer chosen[dimension]; Integer state; Integer count; Integer bestCount;\r
    Real sampleSource[dimension,dimension]; Real sampleTarget[dimension,dimension];\r
    Real candidateRotation[dimension,dimension]; Real candidateTranslation[dimension];\r
    Real candidateMask[size(sourcePoint,1)]; Real bestMask[size(sourcePoint,1)];\r
    Real workingMask[size(sourcePoint,1)]; Real cost; Real bestCost;\r
    Real fitAccepted; Real fitReason; Real fitCount; Real invalidCount; Real rank;\r
    Real fitCost; Real fitRms; Real gap; Real sourceCentroid[dimension]; Real targetCentroid[dimension];\r
    Real unusedScore;\r
  algorithm\r
    valid := false; rejectionReason := 1;\r
    rotation := identity(dimension); translation := zeros(dimension);\r
    inlierMask := zeros(size(sourcePoint,1)); matchCount := 0; inlierCount := 0;\r
    rms := 0.0; nextSeed := seed;\r
    if requested then\r
      configuration := size(sourcePoint,1) >= dimension and size(sourcePoint,1) <= featureCapacity\r
        and seed >= 1 and seed < randomModulus and trials >= 1 and trials <= maximumTrials\r
        and refinements >= 1 and refinements <= maximumRefinements\r
        and minimumInliers >= dimension and minimumInliers <= size(sourcePoint,1)\r
        and minimumFraction > 0.0 and minimumFraction <= 1.0\r
        and inlierDistance > 0.0 and inlierDistance <= 10.0\r
        and maximumRms >= 0.0 and maximumRms <= inlierDistance\r
        and coordinateLimit > 0.0 and coordinateLimit <= 1e4\r
        and rankTolerance >= 1e-12 and rankTolerance <= 1e-2;\r
      if calibratedResiduals then\r
        configuration := configuration and maximumNormalizedSquared > 0 and maximumNormalizedSquared <= 1e6\r
          and minimumPivot > 0 and minimumPivot < 1;\r
      end if;\r
      rejectionReason := 2;\r
      if configuration then\r
        slots := fill(0,size(sourcePoint,1)); payload := true;\r
        for slot in 1:size(sourcePoint,1) loop\r
          payload := payload and (pairEnabled[slot] == 0.0 or pairEnabled[slot] == 1.0);\r
          if pairEnabled[slot] == 1.0 then\r
            matchCount := matchCount+1; slots[matchCount] := slot;\r
            for axis in 1:dimension loop\r
              payload := payload and abs(sourcePoint[slot,axis]) <= coordinateLimit\r
                and abs(targetPoint[slot,axis]) <= coordinateLimit;\r
            end for;\r
            if calibratedResiduals then\r
              (covarianceValid,unusedScore) := RegistrationWhitenedResidual3(zeros(dimension),sourceCovariance[slot,:,:],minimumPivot);\r
              payload := payload and covarianceValid;\r
              (covarianceValid,unusedScore) := RegistrationWhitenedResidual3(zeros(dimension),targetCovariance[slot,:,:],minimumPivot);\r
              payload := payload and covarianceValid;\r
            end if;\r
          end if;\r
        end for;\r
        rejectionReason := 3;\r
        if payload then\r
          rejectionReason := 4;\r
          if matchCount >= minimumInliers then\r
            bestCount := 0; bestCost := 1e100; bestMask := zeros(size(sourcePoint,1)); state := seed;\r
            for hypothesis in 1:trials loop\r
              state := NextSample(state); first := mod(state,matchCount)+1;\r
              state := NextSample(state); second := mod(state,matchCount-1)+1;\r
              if second >= first then second := second+1; end if;\r
              state := NextSample(state); third := mod(state,matchCount-2)+1;\r
              if third >= min(first,second) then third := third+1; end if;\r
              if third >= max(first,second) then third := third+1; end if;\r
              chosen := {slots[first],slots[second],slots[third]};\r
              for point in 1:dimension loop\r
                sampleSource[point,:] := sourcePoint[chosen[point],:];\r
                sampleTarget[point,:] := targetPoint[chosen[point],:];\r
              end for;\r
              (fitAccepted,fitReason,candidateRotation,candidateTranslation,fitCount,invalidCount,\r
                rank,fitCost,fitRms,gap,sourceCentroid,targetCentroid) := FitRigidPointPairs(\r
                  sampleSource,sampleTarget,ones(dimension),dimension,coordinateLimit,rankTolerance,\r
                  if calibratedResiduals then 1e6 else inlierDistance);\r
              if fitAccepted == 1.0 then\r
                (candidateMask,count,cost) := ScorePairs(sourcePoint,targetPoint,pairEnabled,\r
                  candidateRotation,candidateTranslation,inlierDistance,calibratedResiduals=calibratedResiduals,\r
                  sourceCovariance=sourceCovariance,targetCovariance=targetCovariance,\r
                  maximumNormalizedSquared=maximumNormalizedSquared,minimumPivot=minimumPivot);\r
                if count > bestCount or (count == bestCount and cost < bestCost) then\r
                  bestCount := count; bestCost := cost; bestMask := candidateMask;\r
                end if;\r
              end if;\r
            end for;\r
            nextSeed := state;\r
            eligible := bestCount >= minimumInliers and bestCount >= minimumFraction*matchCount;\r
            stable := false; workingMask := bestMask; rejectionReason := 5;\r
            // Stop doing fits after stability/refusal, while keeping a bounded\r
            // compact loop. The final fit and covariance must use one mask.\r
            for refinement in 1:refinements loop\r
              if eligible and not stable then\r
                (fitAccepted,fitReason,candidateRotation,candidateTranslation,fitCount,invalidCount,\r
                  rank,fitCost,fitRms,gap,sourceCentroid,targetCentroid) := FitRigidPointPairs(\r
                    sourcePoint,targetPoint,workingMask,size(sourcePoint,1),coordinateLimit,rankTolerance,\r
                    if calibratedResiduals then 1e6 else maximumRms);\r
                if fitAccepted == 1.0 and calibratedResiduals then\r
                  (weightedValid,candidateRotation,candidateTranslation,fitRms) := RegistrationWeighted.WeightedRefine(\r
                    sourcePoint,targetPoint,workingMask,sourceCovariance,targetCovariance,\r
                    candidateRotation,candidateTranslation,minimumPivot);\r
                  if not weightedValid then fitAccepted := 0.0; end if;\r
                end if;\r
                eligible := fitAccepted == 1.0;\r
                if not eligible then rejectionReason := 5; end if;\r
                if eligible then\r
                  (candidateMask,count,cost) := ScorePairs(sourcePoint,targetPoint,pairEnabled,\r
                    candidateRotation,candidateTranslation,inlierDistance,calibratedResiduals=calibratedResiduals,\r
                    sourceCovariance=sourceCovariance,targetCovariance=targetCovariance,\r
                    maximumNormalizedSquared=maximumNormalizedSquared,minimumPivot=minimumPivot);\r
                  eligible := count >= minimumInliers and count >= minimumFraction*matchCount;\r
                  stable := true;\r
                  for slot in 1:size(sourcePoint,1) loop\r
                    stable := stable and candidateMask[slot] == workingMask[slot];\r
                  end for;\r
                  if eligible and stable then\r
                    rotation := candidateRotation; translation := candidateTranslation;\r
                    inlierMask := workingMask; inlierCount := count; rms := fitRms;\r
                    valid := true; rejectionReason := 0;\r
                  else\r
                    workingMask := candidateMask;\r
                    rejectionReason := if eligible then 6 else 5;\r
                  end if;\r
                end if;\r
              end if;\r
            end for;\r
          end if;\r
        end if;\r
      end if;\r
    end if;\r
  end Consensus;\r
\r
  record Proposal\r
    Boolean verified;\r
    Integer rejectionReason;\r
    Integer generation; Integer referenceId; Integer currentId;\r
    Integer referenceEpoch; Integer currentEpoch;\r
    Integer matchedCount; Integer inlierCount;\r
    Real rms; Integer nextSeed;\r
    Boolean inliers[featureCapacity];\r
    Integer partners[featureCapacity];\r
    Real opticalRotation[dimension,dimension]; Real opticalTranslation[dimension];\r
    Real bodyRotation[dimension,dimension]; Real bodyTranslation[dimension];\r
    Real covariance[poseDimension,poseDimension]; Real information[poseDimension,poseDimension];\r
  end Proposal;\r
\r
  function EmptyProposal\r
    input Integer seed;\r
    output Proposal result;\r
  algorithm\r
    result.verified := false; result.rejectionReason := 1;\r
    result.generation := 0; result.referenceId := 0; result.currentId := 0;\r
    result.referenceEpoch := -1; result.currentEpoch := -1;\r
    result.matchedCount := 0; result.inlierCount := 0; result.rms := 0.0; result.nextSeed := seed;\r
    result.inliers := fill(false,featureCapacity); result.partners := fill(0,featureCapacity);\r
    result.opticalRotation := identity(dimension); result.opticalTranslation := zeros(dimension);\r
    result.bodyRotation := identity(dimension); result.bodyTranslation := zeros(dimension);\r
    result.covariance := zeros(poseDimension,poseDimension); result.information := zeros(poseDimension,poseDimension);\r
  end EmptyProposal;\r
\r
  function Verify\r
    input RGBDKeyframes.Frame reference;\r
    input RGBDKeyframes.Frame current;\r
    input Boolean requested;\r
    input Integer seed = 7; input Integer trials = 96; input Integer refinements = 4;\r
    input Integer minimumInliers = 12; input Real minimumFraction = 0.5;\r
    input Real inlierDistance = 0.08; input Real maximumRms = 0.03;\r
    input Real minimumAge = 5.0; input Real descriptorRatio = 0.8;\r
    input Real maximumDescriptorDistance = 0.8;\r
    input Real coordinateLimit = 100.0; input Real rankTolerance = 1e-8;\r
    input Real localizationSigma = 0.5; input Real depthInflation = 1.0; input Real minimumPivot = 1e-10;\r
    output Proposal result;\r
    input Boolean calibratedResiduals = true;\r
    input Real maximumNormalizedSquared = 9.0;\r
  protected\r
    Boolean configuration; Boolean identityValid; Boolean consensusValid; Boolean edgeValid;\r
    Integer consensusReason; Integer edgeReason; Integer matches; Integer inliers; Integer nextSeed;\r
    Real referenceMask[featureCapacity]; Real currentMask[featureCapacity];\r
    Real partners[featureCapacity]; Real pairEnabled[featureCapacity];\r
    Real sourcePoint[featureCapacity,dimension]; Real targetPoint[featureCapacity,dimension];\r
    Real nearest[featureCapacity]; Real second[featureCapacity]; Real count; Real matchValid;\r
    Real invalidReference; Real invalidCurrent; Real mask[featureCapacity];\r
    Real C[dimension,dimension]; Real t[dimension]; Real rms;\r
    Real uncertaintyValid; Real uncertaintyReason; Real uncertaintyCount; Real uncertaintyInvalid;\r
    Real relativeCovariance[poseDimension,poseDimension]; Real unusedCovariance[poseDimension,poseDimension];\r
    Real normal[poseDimension,poseDimension]; Real noise[poseDimension,poseDimension]; Real J[poseDimension,poseDimension];\r
    Real pivot; Real D[dimension,dimension]; Real u[dimension];\r
    Real edgeCovariance[poseDimension,poseDimension]; Real information[poseDimension,poseDimension];\r
    Real sourceCovariance[featureCapacity,dimension,dimension]; Real targetCovariance[featureCapacity,dimension,dimension];\r
  algorithm\r
    result := EmptyProposal(seed);\r
    if requested then\r
      configuration := minimumAge >= 0.0 and minimumAge <= 1e6\r
        and seed >= 1 and seed < randomModulus and trials >= 1 and trials <= maximumTrials\r
        and refinements >= 1 and refinements <= maximumRefinements\r
        and minimumInliers >= dimension and minimumInliers <= featureCapacity\r
        and minimumFraction > 0.0 and minimumFraction <= 1.0\r
        and inlierDistance > 0.0 and inlierDistance <= 10.0\r
        and maximumRms >= 0.0 and maximumRms <= inlierDistance\r
        and coordinateLimit > 0.0 and coordinateLimit <= 1e4\r
        and rankTolerance >= 1e-12 and rankTolerance <= 1e-2\r
        and descriptorRatio > 0.0 and descriptorRatio < 1.0\r
        and maximumDescriptorDistance >= 0.0 and maximumDescriptorDistance <= 2.0\r
        and localizationSigma > 0.0 and localizationSigma <= 10.0\r
        and depthInflation >= 1.0 and depthInflation <= 100.0\r
        and minimumPivot > 0.0 and minimumPivot < 1.0;\r
      if calibratedResiduals then\r
        configuration := configuration and maximumNormalizedSquared > 0 and maximumNormalizedSquared <= 1e6;\r
      end if;\r
      result.rejectionReason := 2;\r
      if configuration then\r
        identityValid := reference.generation == current.generation and reference.id < current.id\r
          and reference.epoch < current.epoch and reference.imageTime < current.imageTime\r
          and current.imageTime-reference.imageTime >= minimumAge\r
          and reference.vocabularyVersion == current.vocabularyVersion;\r
        result.rejectionReason := 3;\r
        if identityValid then\r
          result.rejectionReason := 4;\r
          if RGBDKeyframes.ValidFrame(reference) and RGBDKeyframes.ValidFrame(current) then\r
            // The current sandwich model assumes a common disparity noise and\r
            // stereo baseline. Refuse incompatible snapshots rather than reuse\r
            // current calibration for the retained reference image.\r
            result.rejectionReason := 5;\r
            if reference.disparityNoise == current.disparityNoise and reference.baseline == current.baseline then\r
              for slot in 1:featureCapacity loop\r
                referenceMask[slot] := if reference.enabled[slot] then 1.0 else 0.0;\r
                currentMask[slot] := if current.enabled[slot] then 1.0 else 0.0;\r
              end for;\r
              (partners,pairEnabled,sourcePoint,targetPoint,count,matchValid,invalidReference,invalidCurrent,nearest,second) :=\r
                MatchRGBDDescriptors(reference.descriptor,current.descriptor,reference.opticalPoint,current.opticalPoint,\r
                  referenceMask,currentMask,reference.count,current.count,descriptorRatio,maximumDescriptorDistance,\r
                  0.0,identity(dimension),zeros(dimension),0.0);\r
              result.matchedCount := integer(count); result.rejectionReason := 6;\r
              if matchValid == 1.0 and invalidReference == 0.0 and invalidCurrent == 0.0 then\r
                sourceCovariance := zeros(featureCapacity,dimension,dimension);\r
                targetCovariance := zeros(featureCapacity,dimension,dimension);\r
                if calibratedResiduals then\r
                  for slot in 1:featureCapacity loop\r
                    if pairEnabled[slot] == 1.0 then\r
                      sourceCovariance[slot,:,:] := RGBDOpticalPointCovariance(sourcePoint[slot,:],\r
                        reference.rgbCalibration[1],reference.rgbCalibration[2],localizationSigma,\r
                        reference.disparityNoise,reference.noiseReferenceFx,reference.baseline,depthInflation);\r
                      targetCovariance[slot,:,:] := RGBDOpticalPointCovariance(targetPoint[slot,:],\r
                        current.rgbCalibration[1],current.rgbCalibration[2],localizationSigma,\r
                        current.disparityNoise,current.noiseReferenceFx,current.baseline,depthInflation);\r
                    end if;\r
                  end for;\r
                end if;\r
                (consensusValid,consensusReason,C,t,mask,matches,inliers,rms,nextSeed) := Consensus(\r
                  sourcePoint,targetPoint,pairEnabled,true,seed,trials,refinements,minimumInliers,minimumFraction,\r
                  inlierDistance,maximumRms,coordinateLimit,rankTolerance,\r
                  calibratedResiduals=calibratedResiduals,sourceCovariance=sourceCovariance,targetCovariance=targetCovariance,\r
                  maximumNormalizedSquared=maximumNormalizedSquared,minimumPivot=minimumPivot);\r
                result.nextSeed := nextSeed; result.rejectionReason := 7;\r
                if consensusValid then\r
                  // Preserve measured fit diagnostics even if uncertainty or edge validation rejects it.\r
                  result.inlierCount := inliers; result.rms := rms;\r
                  (uncertaintyValid,uncertaintyReason,uncertaintyCount,uncertaintyInvalid,relativeCovariance,\r
                    unusedCovariance,normal,noise,J,pivot) := RGBDRegistrationSandwich(sourcePoint,targetPoint,\r
                      mask,featureCapacity,1.0,C,t,reference.bodyRotation,reference.opticalToBody,\r
                      reference.cameraOriginBody,reference.rgbCalibration[1:2],current.rgbCalibration[1:2],\r
                      reference.noiseReferenceFx,current.noiseReferenceFx,reference.baseline,localizationSigma,\r
                      reference.disparityNoise,depthInflation,coordinateLimit,minimumPivot,weighted=calibratedResiduals);\r
                  result.rejectionReason := 8;\r
                  if uncertaintyValid == 1.0 then\r
                    (D,u,J,edgeCovariance,information,edgeValid,edgeReason,pivot) := RGBDOpticalToBodyEdge(C,t,\r
                      relativeCovariance,reference.opticalToBody,current.opticalToBody,\r
                      reference.cameraOriginBody,current.cameraOriginBody,true,coordinateLimit,minimumPivot);\r
                    result.rejectionReason := 9;\r
                    if edgeValid then\r
                      result.verified := true; result.rejectionReason := 0;\r
                      result.generation := current.generation;\r
                      result.referenceId := reference.id; result.currentId := current.id;\r
                      result.referenceEpoch := reference.epoch; result.currentEpoch := current.epoch;\r
                      result.inlierCount := inliers; result.rms := rms;\r
                      result.opticalRotation := C; result.opticalTranslation := t;\r
                      result.bodyRotation := D; result.bodyTranslation := u;\r
                      result.covariance := edgeCovariance; result.information := information;\r
                      for slot in 1:featureCapacity loop\r
                        result.inliers[slot] := mask[slot] == 1.0;\r
                        result.partners[slot] := if mask[slot] == 1.0 then integer(partners[slot]) else 0;\r
                      end for;\r
                    end if;\r
                  end if;\r
                end if;\r
              end if;\r
            end if;\r
          end if;\r
        end if;\r
      end if;\r
    end if;\r
  end Verify;\r
end RGBDLoopVerification;\r
`;export{e as default};
