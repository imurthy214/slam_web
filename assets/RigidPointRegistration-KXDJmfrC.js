const n=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Horn absolute orientation for matched 3D point pairs. No pose truth enters\r
// this component. Correspondence production and temporal pose composition are\r
// separate frontend/backend responsibilities.\r
function RegistrationEigen4\r
  input Real matrix[4,4];\r
  output Real values[4];\r
  output Real dominant[4];\r
  output Real gap;\r
  output Real offDiagonal;\r
protected\r
  Real work[4,4];\r
  Real vectors[4,4];\r
  Real scale;\r
  Real tau; Real tangent; Real cosine; Real sine;\r
  Real first; Real second; Real entry; Real active;\r
  Real largest; Real runnerUp;\r
  Integer index;\r
algorithm\r
  scale := 0.0;\r
  for i in 1:4 loop\r
    for j in 1:4 loop\r
      scale := max(scale,abs(matrix[i,j]));\r
    end for;\r
  end for;\r
  work := matrix/(if scale > 0.0 then scale else 1.0);\r
  vectors := identity(4);\r
  for sweep in 1:24 loop\r
    for p in 1:3 loop\r
      for q in 1:4 loop\r
        entry := work[p,q];\r
        active := if q > p and abs(entry) > 1e-14 then 1.0 else 0.0;\r
        tau := (work[q,q]-work[p,p])/(if active > 0.0 then 2.0*entry else 1.0);\r
        tangent := if active <= 0.0 then 0.0 else if tau >= 0.0 then\r
          1.0/(tau+sqrt(1.0+tau*tau)) else -1.0/(-tau+sqrt(1.0+tau*tau));\r
        cosine := 1.0/sqrt(1.0+tangent*tangent);\r
        sine := tangent*cosine;\r
        work[p,p] := work[p,p]-tangent*entry;\r
        work[q,q] := work[q,q]+tangent*entry;\r
        work[p,q] := if active > 0.0 then 0.0 else entry;\r
        work[q,p] := work[p,q];\r
        for k in 1:4 loop\r
          first := work[k,p]; second := work[k,q];\r
          work[k,p] := if k <> p and k <> q then cosine*first-sine*second else first;\r
          work[p,k] := if k <> p and k <> q then work[k,p] else work[p,k];\r
          work[k,q] := if k <> p and k <> q then sine*first+cosine*second else second;\r
          work[q,k] := if k <> p and k <> q then work[k,q] else work[q,k];\r
          first := vectors[k,p]; second := vectors[k,q];\r
          vectors[k,p] := cosine*first-sine*second;\r
          vectors[k,q] := sine*first+cosine*second;\r
        end for;\r
      end for;\r
    end for;\r
  end for;\r
  largest := work[1,1]; runnerUp := -1e100; index := 1;\r
  for i in 2:4 loop\r
    if work[i,i] > largest then\r
      runnerUp := largest; largest := work[i,i]; index := i;\r
    else\r
      runnerUp := max(runnerUp,work[i,i]);\r
    end if;\r
  end for;\r
  offDiagonal := 0.0;\r
  for i in 1:4 loop\r
    values[i] := work[i,i]*scale;\r
    dominant[i] := vectors[i,index];\r
    for j in 1:4 loop\r
      offDiagonal := if i <> j then max(offDiagonal,abs(work[i,j])) else offDiagonal;\r
    end for;\r
  end for;\r
  gap := (largest-runnerUp)*scale;\r
end RegistrationEigen4;\r
\r
// Three ordered full-domain passes retain compact runtime loop ownership.\r
// Disabled or invalid pairs never enter multiplication, even with NaN inputs.\r
function FitRigidPointPairs\r
\r
  input Real sourcePoint[:,:];\r
  input Real targetPoint[:,:];\r
  input Real pairEnabled[:];\r
  input Real activeCount;\r
  input Real coordinateLimit;\r
  input Real rankTolerance;\r
  input Real maximumRms;\r
  output Real accepted;\r
  output Real rejectionReason;\r
  output Real rotation[3,3];\r
  output Real translation[3];\r
  output Real validCount;\r
  output Real invalidCount;\r
  output Real rank;\r
  output Real cost;\r
  output Real rms;\r
  output Real eigenGap;\r
  output Real sourceCentroid[3];\r
  output Real targetCentroid[3];\r
protected\r
  Boolean mask[size(pairEnabled,1)];\r
  Boolean domainValid;\r
  Real crossCovariance[3,3]; Real sourceCovariance[4,4];\r
  Real horn[4,4]; Real hornValues[4]; Real sourceValues[4];\r
  Real quaternion[4]; Real unusedVector[4];\r
  Real unusedGap; Real hornResidual; Real sourceResidual;\r
  Real sourceScale; Real hornScale;\r
  Real candidateRotation[3,3]; Real candidateTranslation[3];\r
  Real error;\r
algorithm\r
  domainValid := activeCount >= 0.0 and activeCount <= size(pairEnabled,1) and floor(activeCount) >= activeCount and\r
    size(pairEnabled,1) >= 3 and size(sourcePoint,1) == size(pairEnabled,1) and size(targetPoint,1) == size(pairEnabled,1) and\r
    size(sourcePoint,2) == 3 and size(targetPoint,2) == 3 and\r
    coordinateLimit > 0.0 and coordinateLimit <= 1e6 and rankTolerance >= 1e-12 and rankTolerance <= 1e-2 and\r
    maximumRms >= 0.0 and maximumRms <= 1e6;\r
  mask := fill(false,size(pairEnabled,1));\r
  validCount := 0.0; invalidCount := 0.0;\r
  sourceCentroid := zeros(3); targetCentroid := zeros(3);\r
  for i in 1:size(pairEnabled,1) loop\r
    if domainValid and i <= activeCount then\r
      if pairEnabled[i] >= 1.0 and pairEnabled[i] <= 1.0 and\r
        abs(sourcePoint[i,1]) <= coordinateLimit and abs(sourcePoint[i,2]) <= coordinateLimit and abs(sourcePoint[i,3]) <= coordinateLimit and\r
        abs(targetPoint[i,1]) <= coordinateLimit and abs(targetPoint[i,2]) <= coordinateLimit and abs(targetPoint[i,3]) <= coordinateLimit then\r
        mask[i] := true;\r
        validCount := validCount+1.0;\r
        for a in 1:3 loop\r
          sourceCentroid[a] := sourceCentroid[a]+sourcePoint[i,a];\r
          targetCentroid[a] := targetCentroid[a]+targetPoint[i,a];\r
        end for;\r
      elseif not (pairEnabled[i] >= 0.0 and pairEnabled[i] <= 0.0) then\r
        invalidCount := invalidCount+1.0;\r
      end if;\r
    end if;\r
  end for;\r
  sourceCentroid := sourceCentroid/max(validCount,1.0);\r
  targetCentroid := targetCentroid/max(validCount,1.0);\r
  crossCovariance := zeros(3,3); sourceCovariance := zeros(4,4);\r
  for i in 1:size(pairEnabled,1) loop\r
    if mask[i] then\r
      for a in 1:3 loop\r
        for b in 1:3 loop\r
          crossCovariance[a,b] := crossCovariance[a,b]+(sourcePoint[i,a]-sourceCentroid[a])*(targetPoint[i,b]-targetCentroid[b]);\r
          sourceCovariance[a,b] := sourceCovariance[a,b]+(sourcePoint[i,a]-sourceCentroid[a])*(sourcePoint[i,b]-sourceCentroid[b]);\r
        end for;\r
      end for;\r
    end if;\r
  end for;\r
  crossCovariance := crossCovariance/max(validCount,1.0);\r
  sourceCovariance := sourceCovariance/max(validCount,1.0);\r
  horn := {{crossCovariance[1,1]+crossCovariance[2,2]+crossCovariance[3,3],crossCovariance[2,3]-crossCovariance[3,2],crossCovariance[3,1]-crossCovariance[1,3],crossCovariance[1,2]-crossCovariance[2,1]},\r
    {crossCovariance[2,3]-crossCovariance[3,2],crossCovariance[1,1]-crossCovariance[2,2]-crossCovariance[3,3],crossCovariance[1,2]+crossCovariance[2,1],crossCovariance[1,3]+crossCovariance[3,1]},\r
    {crossCovariance[3,1]-crossCovariance[1,3],crossCovariance[1,2]+crossCovariance[2,1],-crossCovariance[1,1]+crossCovariance[2,2]-crossCovariance[3,3],crossCovariance[2,3]+crossCovariance[3,2]},\r
    {crossCovariance[1,2]-crossCovariance[2,1],crossCovariance[1,3]+crossCovariance[3,1],crossCovariance[2,3]+crossCovariance[3,2],-crossCovariance[1,1]-crossCovariance[2,2]+crossCovariance[3,3]}};\r
  (hornValues,quaternion,eigenGap,hornResidual) := RegistrationEigen4(horn);\r
  (sourceValues,unusedVector,unusedGap,sourceResidual) := RegistrationEigen4(sourceCovariance);\r
  sourceScale := 0.0; hornScale := 0.0;\r
  for i in 1:4 loop\r
    sourceScale := max(sourceScale,abs(sourceValues[i]));\r
    hornScale := max(hornScale,abs(hornValues[i]));\r
  end for;\r
  rank := 0.0;\r
  for i in 1:4 loop\r
    rank := rank+(if sourceValues[i] > rankTolerance*sourceScale then 1.0 else 0.0);\r
  end for;\r
  candidateRotation := {{1.0-2.0*(quaternion[3]^2+quaternion[4]^2),2.0*(quaternion[2]*quaternion[3]-quaternion[1]*quaternion[4]),2.0*(quaternion[2]*quaternion[4]+quaternion[1]*quaternion[3])},\r
    {2.0*(quaternion[2]*quaternion[3]+quaternion[1]*quaternion[4]),1.0-2.0*(quaternion[2]^2+quaternion[4]^2),2.0*(quaternion[3]*quaternion[4]-quaternion[1]*quaternion[2])},\r
    {2.0*(quaternion[2]*quaternion[4]-quaternion[1]*quaternion[3]),2.0*(quaternion[3]*quaternion[4]+quaternion[1]*quaternion[2]),1.0-2.0*(quaternion[2]^2+quaternion[3]^2)}};\r
  candidateTranslation := zeros(3);\r
  for a in 1:3 loop\r
    candidateTranslation[a] := targetCentroid[a];\r
    for b in 1:3 loop\r
      candidateTranslation[a] := candidateTranslation[a]-candidateRotation[a,b]*sourceCentroid[b];\r
    end for;\r
  end for;\r
  cost := 0.0;\r
  for i in 1:size(pairEnabled,1) loop\r
    if mask[i] then\r
      for a in 1:3 loop\r
        error := candidateTranslation[a]-targetPoint[i,a];\r
        for b in 1:3 loop\r
          error := error+candidateRotation[a,b]*sourcePoint[i,b];\r
        end for;\r
        cost := cost+error*error;\r
      end for;\r
    end if;\r
  end for;\r
  rms := sqrt(max(cost,0.0)/max(validCount,1.0));\r
  rejectionReason := if not domainValid then 1.0 else if invalidCount > 0.0 then 2.0 else if validCount < 3.0 then 3.0\r
    else if rank < 2.0 or eigenGap <= rankTolerance*max(sourceScale,hornScale) then 4.0\r
    else if hornResidual > 1e-10 or sourceResidual > 1e-10 then 5.0\r
    else if not (rms >= 0.0 and rms <= maximumRms) then 6.0 else 0.0;\r
  accepted := if rejectionReason <= 0.0 then 1.0 else 0.0;\r
  rotation := if accepted > 0.0 then candidateRotation else identity(3);\r
  translation := if accepted > 0.0 then candidateTranslation else zeros(3);\r
end FitRigidPointPairs;\r
\r
model RigidPointRegistration\r
\r
  parameter Integer capacity = 14400;\r
  parameter Real coordinateLimit = 1e6;\r
  parameter Real rankTolerance = 1e-8;\r
  parameter Real maximumRms = 0.02;\r
  input Real activeCount = 0.0;\r
  input Real sourcePoint[capacity,3] = zeros(capacity,3);\r
  input Real targetPoint[capacity,3] = zeros(capacity,3);\r
  // Exactly 0 disables a pair; exactly 1 requests a finite matched pair.\r
  input Real pairEnabled[capacity] = ones(capacity);\r
  output Real accepted;\r
  // 0 accepted; 1 domain; 2 invalid pair; 3 insufficient; 4 degeneracy;\r
  // 5 eigensolver convergence; 6 fitted RMS gate. Rejection is identity/zero.\r
  output Real rejectionReason;\r
  output Real rotation[3,3];\r
  output Real translation[3];\r
  output Real validCount;\r
  output Real invalidCount;\r
  output Real rank;\r
  output Real cost;\r
  output Real rms;\r
  output Real eigenGap;\r
  output Real sourceCentroid[3];\r
  output Real targetCentroid[3];\r
equation\r
  (accepted,rejectionReason,rotation,translation,validCount,invalidCount,rank,cost,rms,eigenGap,sourceCentroid,targetCentroid) =\r
    FitRigidPointPairs(sourcePoint,targetPoint,pairEnabled,activeCount,coordinateLimit,rankTolerance,maximumRms);\r
end RigidPointRegistration;\r
\r
// Squared whitened residual from a diagonally equilibrated Cholesky solve.\r
// Invalid/singular covariance refuses: no invented noise floor or inverse.\r
function RegistrationWhitenedResidual3\r
  input Real residual[3]; input Real covariance[3,3];\r
  input Real minimumPivot = 1e-10;\r
  output Boolean valid; output Real squaredResidual;\r
protected\r
  Real scale[3]; Real normalized[3,3]; Real lower[3,3]; Real whitened[3];\r
  Real pivot;\r
algorithm\r
  valid := minimumPivot > 0.0 and minimumPivot < 1.0;\r
  scale := ones(3); normalized := zeros(3,3); lower := zeros(3,3); whitened := zeros(3);\r
  for axis in 1:3 loop\r
    valid := valid and covariance[axis,axis] > 0.0 and covariance[axis,axis] < 1e100\r
      and abs(residual[axis]) < 1e100;\r
    if valid then scale[axis] := sqrt(covariance[axis,axis]); end if;\r
  end for;\r
  for row in 1:3 loop\r
    for column in 1:3 loop\r
      normalized[row,column] := covariance[row,column]/scale[row]/scale[column];\r
      valid := valid and abs(normalized[row,column]) < 1e100\r
        and abs(normalized[row,column]-covariance[column,row]/scale[row]/scale[column]) <= 1e-10;\r
    end for;\r
  end for;\r
  for row in 1:3 loop\r
    for column in 1:row loop\r
      if valid then\r
        pivot := normalized[row,column];\r
        for previous in 1:column-1 loop\r
          pivot := pivot-lower[row,previous]*lower[column,previous];\r
        end for;\r
        if row == column then\r
          valid := pivot >= minimumPivot and pivot < 1e100;\r
          if valid then lower[row,column] := sqrt(pivot); end if;\r
        else\r
          lower[row,column] := pivot/lower[column,column];\r
        end if;\r
      end if;\r
    end for;\r
    if valid then\r
      pivot := residual[row]/scale[row];\r
      for previous in 1:row-1 loop pivot := pivot-lower[row,previous]*whitened[previous]; end for;\r
      whitened[row] := pivot/lower[row,row];\r
    end if;\r
  end for;\r
  squaredResidual := whitened*whitened;\r
  valid := valid and squaredResidual >= 0.0 and squaredResidual < 1e100;\r
  if not valid then squaredResidual := 0.0; end if;\r
end RegistrationWhitenedResidual3;\r
\r
function RegistrationPairResidual\r
\r
  input Real source[3]; input Real target[3];\r
  input Real rotation[3,3]; input Real translation[3];\r
  input Boolean useCovariance;\r
  input Real sourceCovariance[3,3]; input Real targetCovariance[3,3];\r
  input Real minimumPivot;\r
  output Boolean valid; output Real squaredResidual;\r
protected\r
  Real residual[3]; Real covariance[3,3];\r
algorithm\r
  residual := rotation*source+translation-target;\r
  if useCovariance then\r
    covariance := rotation*sourceCovariance*transpose(rotation)+targetCovariance;\r
    (valid,squaredResidual) := RegistrationWhitenedResidual3(residual,covariance,minimumPivot);\r
  else\r
    squaredResidual := residual*residual;\r
    valid := squaredResidual >= 0.0 and squaredResidual < 1e100;\r
  end if;\r
end RegistrationPairResidual;\r
\r
// Deterministic bounded consensus is considered only after the original fit's\r
// strict residual refusal. Domain, invalid-pair, rank and eigensolver refusals\r
// are never rescued. Clean fits retain the exact original fit and operation order.\r
// Added configuration: hypotheses1..1024 and consensus fraction in(0,1].\r
// Reason7 means no admissible stable consensus within the declared work bounds.\r
function FitRigidPointPairsRobust\r
\r
  input Real sourcePoint[:,:];\r
  input Real targetPoint[:,:];\r
  input Real pairEnabled[:];\r
  input Real activeCount;\r
  input Real coordinateLimit;\r
  input Real rankTolerance;\r
  input Real maximumRms;\r
  input Integer maximumHypotheses = 64;\r
  input Real minimumConsensusFraction = 0.5;\r
  output Real accepted;\r
  output Real rejectionReason;\r
  output Real rotation[3,3];\r
  output Real translation[3];\r
  output Real validCount;\r
  output Real invalidCount;\r
  output Real rank;\r
  output Real cost;\r
  output Real rms;\r
  output Real eigenGap;\r
  output Real sourceCentroid[3];\r
  output Real targetCentroid[3];\r
  output Real finalInlierMask[size(pairEnabled,1)];\r
  output Real rejectedCount;\r
  input Boolean useCovariance = false;\r
  input Real sourceCovariance[size(pairEnabled,1),3,3] = zeros(size(pairEnabled,1),3,3);\r
  input Real targetCovariance[size(pairEnabled,1),3,3] = zeros(size(pairEnabled,1),3,3);\r
  input Real maximumNormalizedSquared = 9.0 "Squared radius in whitened 3D residual space";\r
  input Real covarianceMinimumPivot = 1e-10;\r
protected\r
  constant Integer dimension = 3;\r
  constant Integer maximumRefinements = 4;\r
  constant Integer stateModulus = 2147483647;\r
  constant Integer stateMultiplier = 16807;\r
  constant Integer stateQuotient = 127773;\r
  constant Integer stateRemainder = 2836;\r
  Boolean configurationValid; Boolean searching; Boolean stable;\r
  Boolean residualValid; Boolean covarianceValid; Boolean allInliers;\r
  Integer enabledIndices[size(pairEnabled,1)]; Integer enabledCount;\r
  Integer sampleIndices[dimension]; Integer lowIndex; Integer highIndex;\r
  Integer state; Integer candidateCount; Integer bestCount; Integer retainedCount;\r
  Integer minimumConsensus; Integer index;\r
  Real originalValidCount; Real squaredLimit; Real residual; Real squaredResidual;\r
  Real candidateCost; Real bestCost;\r
  Boolean weightedValid;\r
  Real fitMaximumRms; Real unusedScore;\r
  Real candidateMask[size(pairEnabled,1)]; Real bestMask[size(pairEnabled,1)];\r
  Real sampleSource[dimension,dimension]; Real sampleTarget[dimension,dimension];\r
  Real fitAccepted; Real fitReason; Real fitRotation[dimension,dimension]; Real fitTranslation[dimension];\r
  Real fitValidCount; Real fitInvalidCount; Real fitRank; Real fitCost; Real fitRms; Real fitEigenGap;\r
  Real fitSourceCentroid[dimension]; Real fitTargetCentroid[dimension];\r
algorithm\r
  // In calibrated mode the geometric solver estimates an unweighted rigid\r
  // transform; per-pair covariance certifies its residuals below. A fixed\r
  // metric RMS must not reject a noisy hypothesis before that test can run.\r
  fitMaximumRms := if useCovariance then 1e6 else maximumRms;\r
  (accepted,rejectionReason,rotation,translation,validCount,invalidCount,rank,cost,rms,\r
    eigenGap,sourceCentroid,targetCentroid) := FitRigidPointPairs(\r
      sourcePoint,targetPoint,pairEnabled,activeCount,coordinateLimit,rankTolerance,fitMaximumRms);\r
  finalInlierMask := zeros(size(pairEnabled,1)); rejectedCount := 0.0;\r
  configurationValid := maximumHypotheses >= 1 and maximumHypotheses <= 1024\r
    and minimumConsensusFraction > 0.0 and minimumConsensusFraction <= 1.0\r
    and maximumRms >= 0.0 and maximumRms <= 1e6;\r
  if useCovariance then\r
    configurationValid := configurationValid and maximumNormalizedSquared > 0.0\r
      and maximumNormalizedSquared <= 1e6 and covarianceMinimumPivot > 0.0 and covarianceMinimumPivot < 1.0;\r
    for pair in 1:size(pairEnabled,1) loop\r
      if pair <= activeCount and pairEnabled[pair] == 1.0 then\r
        (covarianceValid,unusedScore) := RegistrationWhitenedResidual3(zeros(3),sourceCovariance[pair,:,:],covarianceMinimumPivot);\r
        configurationValid := configurationValid and covarianceValid;\r
        (covarianceValid,unusedScore) := RegistrationWhitenedResidual3(zeros(3),targetCovariance[pair,:,:],covarianceMinimumPivot);\r
        configurationValid := configurationValid and covarianceValid;\r
      end if;\r
    end for;\r
    if accepted > 0.5 then\r
      // Preserve the exact geometric fast path when there is no residual to\r
      // refine; numerical roundoff must not change an already exact seed.\r
      weightedValid := true;\r
      if rms > 1e-12 then\r
        (weightedValid,rotation,translation,rms) := RegistrationWeighted.WeightedRefine(sourcePoint,targetPoint,pairEnabled,\r
          sourceCovariance,targetCovariance,rotation,translation,covarianceMinimumPivot);\r
      end if;\r
      if not weightedValid then accepted := 0.0; rejectionReason := 7.0; end if;\r
      allInliers := weightedValid;\r
      for pair in 1:size(pairEnabled,1) loop\r
        if pair <= activeCount and pairEnabled[pair] == 1.0 then\r
          (residualValid,squaredResidual) := RegistrationPairResidual(sourcePoint[pair,:],targetPoint[pair,:],\r
            rotation,translation,true,sourceCovariance[pair,:,:],targetCovariance[pair,:,:],covarianceMinimumPivot);\r
          allInliers := allInliers and residualValid and squaredResidual <= maximumNormalizedSquared;\r
        end if;\r
      end for;\r
      if not allInliers then\r
        accepted := 0.0; rejectionReason := 6.0; rotation := identity(dimension); translation := zeros(dimension);\r
      end if;\r
    end if;\r
  end if;\r
  if not configurationValid then\r
    accepted := 0.0; rejectionReason := 1.0; rotation := identity(dimension); translation := zeros(dimension);\r
  elseif accepted > 0.5 then\r
    for pair in 1:size(pairEnabled,1) loop\r
      finalInlierMask[pair] := if pair <= activeCount and pairEnabled[pair] >= 1.0 and pairEnabled[pair] <= 1.0 then 1.0 else 0.0;\r
    end for;\r
  elseif rejectionReason >= 6.0 and rejectionReason <= 6.0 then\r
    // The original reason6 proves all active requested pairs valid and finite.\r
    originalValidCount := validCount; enabledCount := 0;\r
    enabledIndices := fill(0,size(pairEnabled,1));\r
    for pair in 1:size(pairEnabled,1) loop\r
      if pair <= activeCount and pairEnabled[pair] >= 1.0 and pairEnabled[pair] <= 1.0 then\r
        enabledCount := enabledCount+1; enabledIndices[enabledCount] := pair;\r
      end if;\r
    end for;\r
    minimumConsensus := max(dimension,integer(ceil(minimumConsensusFraction*originalValidCount)));\r
    squaredLimit := if useCovariance then maximumNormalizedSquared else maximumRms*maximumRms;\r
    candidateMask := zeros(size(pairEnabled,1)); bestMask := zeros(size(pairEnabled,1));\r
    bestCount := 0; bestCost := 0.0; state := 1;\r
    sampleSource := zeros(dimension,dimension); sampleTarget := zeros(dimension,dimension);\r
    for hypothesis in 1:maximumHypotheses loop\r
      // Schrage's form of the31-bit Park-Miller state keeps every intermediate\r
      // inside signed32-bit range; no host RNG or unbounded duplicate retry.\r
      state := stateMultiplier*mod(state,stateQuotient)-stateRemainder*div(state,stateQuotient);\r
      if state <= 0 then state := state+stateModulus; end if;\r
      sampleIndices[1] := 1+mod(state,enabledCount);\r
      state := stateMultiplier*mod(state,stateQuotient)-stateRemainder*div(state,stateQuotient);\r
      if state <= 0 then state := state+stateModulus; end if;\r
      sampleIndices[2] := 1+mod(state,enabledCount-1);\r
      if sampleIndices[2] >= sampleIndices[1] then sampleIndices[2] := sampleIndices[2]+1; end if;\r
      lowIndex := min(sampleIndices[1],sampleIndices[2]); highIndex := max(sampleIndices[1],sampleIndices[2]);\r
      state := stateMultiplier*mod(state,stateQuotient)-stateRemainder*div(state,stateQuotient);\r
      if state <= 0 then state := state+stateModulus; end if;\r
      sampleIndices[3] := 1+mod(state,enabledCount-2);\r
      if sampleIndices[3] >= lowIndex then sampleIndices[3] := sampleIndices[3]+1; end if;\r
      if sampleIndices[3] >= highIndex then sampleIndices[3] := sampleIndices[3]+1; end if;\r
      for sample in 1:dimension loop\r
        index := enabledIndices[sampleIndices[sample]];\r
        for axis in 1:dimension loop\r
          sampleSource[sample,axis] := sourcePoint[index,axis];\r
          sampleTarget[sample,axis] := targetPoint[index,axis];\r
        end for;\r
      end for;\r
      (fitAccepted,fitReason,fitRotation,fitTranslation,fitValidCount,fitInvalidCount,fitRank,\r
        fitCost,fitRms,fitEigenGap,fitSourceCentroid,fitTargetCentroid) := FitRigidPointPairs(\r
          sampleSource,sampleTarget,ones(dimension),dimension,coordinateLimit,rankTolerance,fitMaximumRms);\r
      if fitAccepted > 0.5 then\r
        candidateCount := 0; candidateCost := 0.0;\r
        for compact in 1:enabledCount loop\r
          index := enabledIndices[compact];\r
          if useCovariance then\r
            (residualValid,squaredResidual) := RegistrationPairResidual(sourcePoint[index,:],targetPoint[index,:],\r
              fitRotation,fitTranslation,true,sourceCovariance[index,:,:],targetCovariance[index,:,:],covarianceMinimumPivot);\r
          else\r
            // Preserve the original clean/Euclidean operation order.\r
            residualValid := true; squaredResidual := 0.0;\r
            for axis in 1:dimension loop\r
              residual := fitTranslation[axis]-targetPoint[index,axis];\r
              for column in 1:dimension loop residual := residual+fitRotation[axis,column]*sourcePoint[index,column]; end for;\r
              squaredResidual := squaredResidual+residual*residual;\r
            end for;\r
          end if;\r
          candidateMask[index] := if residualValid and squaredResidual >= 0.0 and squaredResidual <= squaredLimit then 1.0 else 0.0;\r
          if candidateMask[index] > 0.5 then\r
            candidateCount := candidateCount+1; candidateCost := candidateCost+squaredResidual;\r
          end if;\r
        end for;\r
        if candidateCount > bestCount or (candidateCount == bestCount and candidateCost < bestCost) then\r
          bestCount := candidateCount; bestCost := candidateCost; bestMask := candidateMask;\r
        end if;\r
      end if;\r
    end for;\r
    searching := bestCount >= minimumConsensus; stable := false;\r
    for refinement in 1:maximumRefinements loop\r
      if searching then\r
        (fitAccepted,fitReason,fitRotation,fitTranslation,fitValidCount,fitInvalidCount,fitRank,\r
          fitCost,fitRms,fitEigenGap,fitSourceCentroid,fitTargetCentroid) := FitRigidPointPairs(\r
            sourcePoint,targetPoint,bestMask,activeCount,coordinateLimit,rankTolerance,fitMaximumRms);\r
        if fitAccepted > 0.5 and useCovariance then\r
          (weightedValid,fitRotation,fitTranslation,fitRms) := RegistrationWeighted.WeightedRefine(sourcePoint,targetPoint,bestMask,\r
            sourceCovariance,targetCovariance,fitRotation,fitTranslation,covarianceMinimumPivot);\r
          if not weightedValid then fitAccepted := 0.0; end if;\r
        end if;\r
        if fitAccepted > 0.5 then\r
          retainedCount := 0;\r
          for compact in 1:enabledCount loop\r
            index := enabledIndices[compact]; candidateMask[index] := 0.0;\r
            if bestMask[index] > 0.5 then\r
              if useCovariance then\r
                (residualValid,squaredResidual) := RegistrationPairResidual(sourcePoint[index,:],targetPoint[index,:],\r
                  fitRotation,fitTranslation,true,sourceCovariance[index,:,:],targetCovariance[index,:,:],covarianceMinimumPivot);\r
              else\r
                residualValid := true; squaredResidual := 0.0;\r
                for axis in 1:dimension loop\r
                  residual := fitTranslation[axis]-targetPoint[index,axis];\r
                  for column in 1:dimension loop residual := residual+fitRotation[axis,column]*sourcePoint[index,column]; end for;\r
                  squaredResidual := squaredResidual+residual*residual;\r
                end for;\r
              end if;\r
              if residualValid and squaredResidual >= 0.0 and squaredResidual <= squaredLimit then\r
                candidateMask[index] := 1.0; retainedCount := retainedCount+1;\r
              end if;\r
            end if;\r
          end for;\r
          stable := retainedCount == bestCount and retainedCount >= minimumConsensus;\r
          if stable then\r
            accepted := fitAccepted; rejectionReason := fitReason;\r
            rotation := fitRotation; translation := fitTranslation;\r
            validCount := fitValidCount; invalidCount := fitInvalidCount; rank := fitRank;\r
            cost := fitCost; rms := fitRms; eigenGap := fitEigenGap;\r
            sourceCentroid := fitSourceCentroid; targetCentroid := fitTargetCentroid;\r
            finalInlierMask := bestMask; rejectedCount := originalValidCount-fitValidCount;\r
            searching := false;\r
          else\r
            bestMask := candidateMask; bestCount := retainedCount;\r
            searching := retainedCount >= minimumConsensus;\r
          end if;\r
        else\r
          searching := false;\r
        end if;\r
      end if;\r
    end for;\r
    if not stable then\r
      accepted := 0.0; rejectionReason := 7.0;\r
      rotation := identity(dimension); translation := zeros(dimension);\r
      // Retain original full-fit diagnostics, but never publish an unproved mask.\r
      finalInlierMask := zeros(size(pairEnabled,1)); rejectedCount := 0.0;\r
    end if;\r
  end if;\r
end FitRigidPointPairsRobust;\r
\r
// Covariance-weighted refinement in the optical translation/left-angle chart.\r
// Depth uncertainty is anisotropic: equal-weight Horn fits are only seeds.\r
package RegistrationWeighted\r
  function WeightedSkew\r
    input Real v[3]; output Real result[3,3];\r
  algorithm\r
    result := [0,-v[3],v[2];v[3],0,-v[1];-v[2],v[1],0];\r
  end WeightedSkew;\r
\r
  function WeightedExp\r
    input Real v[3]; output Real result[3,3];\r
  protected\r
    Real square; Real angle; Real a; Real b; Real K[3,3];\r
  algorithm\r
    square := v*v; angle := sqrt(square);\r
    a := if square < 1e-8 then 1-square/6+square^2/120 else sin(angle)/angle;\r
    b := if square < 1e-8 then 0.5-square/24+square^2/720 else (1-cos(angle))/square;\r
    K := WeightedSkew(v); result := identity(3)+a*K+b*K*K;\r
  end WeightedExp;\r
\r
// SPD solve with dimensionless diagonal equilibration, no damping/floor added\r
// to the matrix. A small or nonfinite pivot is a refusal, not invented noise.\r
function WeightedInverse6\r
  input Real A[6,6];\r
  input Real minimumPivot;\r
  output Real inverseA[6,6];\r
  output Boolean valid;\r
  output Real minimumScaledPivot;\r
protected\r
  Real scale[6]; Real L[6,6]; Real v; Real z[6]; Real x[6];\r
algorithm\r
  inverseA := zeros(6,6); L := zeros(6,6); scale := ones(6);\r
  minimumScaledPivot := 1.0; valid := true;\r
  for i in 1:6 loop\r
    valid := valid and A[i,i] > 0.0 and A[i,i] <= 1e100;\r
    scale[i] := sqrt(if A[i,i] > 0.0 and A[i,i] <= 1e100 then A[i,i] else 1.0);\r
    for j in 1:6 loop\r
      valid := valid and abs(A[i,j]) <= 1e100\r
        and abs(A[i,j]-A[j,i]) <= 1e-10*max(1.0,abs(A[i,j]));\r
    end for;\r
  end for;\r
  for i in 1:6 loop\r
    for j in 1:6 loop\r
      v := if valid then A[i,j]/scale[i]/scale[j] else 0.0;\r
      for k in 1:6 loop\r
        v := v-(if k < j then L[i,k]*L[j,k] else 0.0);\r
      end for;\r
      if j <= i then\r
        if j == i then\r
          minimumScaledPivot := min(minimumScaledPivot,v);\r
          valid := valid and v > minimumPivot and v <= 1e100;\r
          L[i,j] := sqrt(if valid then v else 1.0);\r
        else\r
          L[i,j] := if valid then v/L[j,j] else 0.0;\r
        end if;\r
      end if;\r
    end for;\r
  end for;\r
  for column in 1:6 loop\r
    z := zeros(6); x := zeros(6);\r
    for i in 1:6 loop\r
      v := if i == column then 1.0/scale[column] else 0.0;\r
      for k in 1:6 loop\r
        v := v-(if k < i then L[i,k]*z[k] else 0.0);\r
      end for;\r
      z[i] := if valid then v/L[i,i] else 0.0;\r
    end for;\r
    for index in 1:6 loop\r
      v := z[7-index];\r
      for k in 1:6 loop\r
        v := v-(if k > 7-index then L[k,7-index]*x[k] else 0.0);\r
      end for;\r
      x[7-index] := if valid then v/L[7-index,7-index] else 0.0;\r
    end for;\r
    for i in 1:6 loop\r
      inverseA[i,column] := if valid then x[i]/scale[i] else 0.0;\r
    end for;\r
  end for;\r
  inverseA := if valid then inverseA else zeros(6,6);\r
end WeightedInverse6;\r
\r
  function WeightedWhiten\r
    input Real covariance[3,3]; input Real residual[3]; input Real jacobian[3,6];\r
    input Real minimumPivot;\r
    output Boolean valid; output Real wr[3]; output Real wj[3,6];\r
  protected\r
    Real scale[3]; Real L[3,3]; Real v;\r
  algorithm\r
    valid := minimumPivot > 0 and minimumPivot < 1;\r
    scale := ones(3); L := zeros(3,3); wr := zeros(3); wj := zeros(3,6);\r
    for row in 1:3 loop\r
      valid := valid and covariance[row,row] > 0 and covariance[row,row] < 1e100;\r
      if valid then scale[row] := sqrt(covariance[row,row]); end if;\r
    end for;\r
    for row in 1:3 loop\r
      for column in 1:row loop\r
        v := covariance[row,column]/scale[row]/scale[column];\r
        valid := valid and abs(v) < 1e100\r
          and abs(covariance[row,column]-covariance[column,row]) <= 1e-10*max(1.0,abs(covariance[row,column]));\r
        for k in 1:column-1 loop v := v-L[row,k]*L[column,k]; end for;\r
        if row == column then\r
          valid := valid and v > minimumPivot and v < 1e100;\r
          if valid then L[row,column] := sqrt(v); end if;\r
        elseif valid then L[row,column] := v/L[column,column]; end if;\r
      end for;\r
      v := if valid then residual[row]/scale[row] else 0.0;\r
      for k in 1:row-1 loop v := v-L[row,k]*wr[k]; end for;\r
      if valid then wr[row] := v/L[row,row]; end if;\r
      for column in 1:6 loop\r
        v := if valid then jacobian[row,column]/scale[row] else 0.0;\r
        for k in 1:row-1 loop v := v-L[row,k]*wj[k,column]; end for;\r
        if valid then wj[row,column] := v/L[row,row]; end if;\r
      end for;\r
    end for;\r
  end WeightedWhiten;\r
\r
  function WeightedNormal\r
    input Real sourcePoint[:,3]; input Real targetPoint[size(sourcePoint,1),3];\r
    input Real enabled[size(sourcePoint,1)];\r
    input Real sourceCovariance[size(sourcePoint,1),3,3]; input Real targetCovariance[size(sourcePoint,1),3,3];\r
    input Real rotation[3,3]; input Real translation[3]; input Real minimumPivot;\r
    output Boolean valid; output Real cost; output Real H[6,6]; output Real gradient[6]; output Real rms;\r
  protected\r
    Boolean pointValid; Real q[3]; Real r[3]; Real J[3,6]; Real wr[3]; Real wj[3,6];\r
    Real covariance[3,3]; Real squared; Integer count;\r
  algorithm\r
    valid := true; cost := 0; H := zeros(6,6); gradient := zeros(6); squared := 0; count := 0;\r
    for point in 1:size(sourcePoint,1) loop\r
      if enabled[point] == 1.0 then\r
        q := rotation*sourcePoint[point,:]; r := q+translation-targetPoint[point,:];\r
        J := cat(2,identity(3),-WeightedSkew(q));\r
        covariance := targetCovariance[point,:,:]+rotation*sourceCovariance[point,:,:]*transpose(rotation);\r
        (pointValid,wr,wj) := WeightedWhiten(covariance,r,J,minimumPivot);\r
        valid := valid and pointValid;\r
        H := H+transpose(wj)*wj; gradient := gradient+transpose(wj)*wr;\r
        cost := cost+wr*wr; squared := squared+r*r; count := count+1;\r
      end if;\r
    end for;\r
    rms := if count > 0 then sqrt(squared/count) else 0;\r
    valid := valid and count >= 3 and cost >= 0 and cost < 1e100;\r
  end WeightedNormal;\r
\r
  function WeightedRefine\r
    input Real sourcePoint[:,3]; input Real targetPoint[size(sourcePoint,1),3];\r
    input Real enabled[size(sourcePoint,1)];\r
    input Real sourceCovariance[size(sourcePoint,1),3,3]; input Real targetCovariance[size(sourcePoint,1),3,3];\r
    input Real initialRotation[3,3]; input Real initialTranslation[3]; input Real minimumPivot = 1e-10;\r
    output Boolean valid; output Real rotation[3,3]; output Real translation[3]; output Real rms;\r
  protected\r
    Real H[6,6]; Real inverseH[6,6]; Real gradient[6]; Real step[6]; Real cost; Real pivot;\r
    Real trialH[6,6]; Real trialGradient[6]; Real trialCost; Real trialRms; Real scale;\r
    Real trialRotation[3,3]; Real trialTranslation[3]; Boolean normalValid; Boolean inverseValid;\r
    Boolean trialValid; Boolean accepted; Boolean running;\r
  algorithm\r
    rotation := initialRotation; translation := initialTranslation;\r
    (normalValid,cost,H,gradient,rms) := WeightedNormal(sourcePoint,targetPoint,enabled,sourceCovariance,targetCovariance,rotation,translation,minimumPivot);\r
    (inverseH,inverseValid,pivot) := WeightedInverse6(H,minimumPivot);\r
    valid := normalValid and inverseValid; running := valid;\r
    step := zeros(6); scale := 1.0; accepted := false;\r
    for iteration in 1:8 loop\r
      if running then\r
        step := -inverseH*gradient;\r
        scale := min(1.0,min(0.5/max(1e-12,sqrt(step[1:3]*step[1:3])),0.1/max(1e-12,sqrt(step[4:6]*step[4:6]))));\r
        accepted := false;\r
      end if;\r
      // Keep the bounded loop outside the conditional so the pinned Rumoca\r
      // release can lower this function; guarded updates preserve early stop.\r
      for backtrack in 1:8 loop\r
          if running and not accepted then\r
            trialRotation := WeightedExp(scale*step[4:6])*rotation; trialTranslation := translation+scale*step[1:3];\r
            (trialValid,trialCost,trialH,trialGradient,trialRms) := WeightedNormal(sourcePoint,targetPoint,enabled,sourceCovariance,targetCovariance,trialRotation,trialTranslation,minimumPivot);\r
            if trialValid and trialCost <= cost then\r
              rotation := trialRotation; translation := trialTranslation; cost := trialCost;\r
              H := trialH; gradient := trialGradient; rms := trialRms; accepted := true;\r
            else scale := scale*0.5; end if;\r
          end if;\r
      end for;\r
      if running then\r
        running := accepted and scale*sqrt(step*step) > 1e-7;\r
        (inverseH,inverseValid,pivot) := WeightedInverse6(H,minimumPivot);\r
        valid := valid and inverseValid; running := running and valid;\r
      end if;\r
    end for;\r
  end WeightedRefine;\r
end RegistrationWeighted;\r
`;export{n as default};
