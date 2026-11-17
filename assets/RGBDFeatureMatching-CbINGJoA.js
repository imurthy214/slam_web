const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Pinhole intrinsics from image size and horizontal/vertical field of view.\r
function RGBDNominalCalibration\r
  input Integer imageSize[2] "Height, width";\r
  input Real fieldOfViewDegrees[2] "Horizontal, vertical";\r
  output Real calibration[4] "fx, fy, cx, cy";\r
algorithm\r
  calibration := {imageSize[2]/(2.0*tan(fieldOfViewDegrees[1]*3.141592653589793/360.0)),\r
    imageSize[1]/(2.0*tan(fieldOfViewDegrees[2]*3.141592653589793/360.0)),\r
    (imageSize[2]-1)/2.0,(imageSize[1]-1)/2.0};\r
end RGBDNominalCalibration;\r
\r
// Interpolate inverse depth between separate RGB and depth optical grids.\r
// Zero-weight neighbors are ignored, including invalid samples.\r
function RGBDCalibratedPoint\r
  input Real depth[:,:];\r
  input Real pixel[2];\r
  input Boolean enabled;\r
  input Real rgbCalibration[4];\r
  input Real depthCalibration[4];\r
  input Real nearDepth;\r
  input Real farDepth;\r
  input Real disparityNoise;\r
  input Real noiseReferenceFx;\r
  input Real baseline;\r
  output Real point[3] "Optical RDF: right, down, forward";\r
  output Boolean valid;\r
  input Real depthUnits = 1.0 "Meters per depth sample; 1 for metric depth, SDK scale for Z16";\r
protected\r
  Real mapped[2];\r
  Real bearing[2];\r
  Real nearest;\r
  Real low;\r
  Real part;\r
  Integer lower[2];\r
  Integer sampleX;\r
  Integer sampleY;\r
  Integer sampleIndex;\r
  Real fraction[2];\r
  Real weight[4];\r
  Real sample;\r
  Real inverseDepth;\r
  Real minimumDepth;\r
  Real maximumDepth;\r
  Real threshold;\r
  Real axialDepth;\r
  Boolean configuration;\r
  Boolean inside;\r
  Boolean usable;\r
algorithm\r
  nearest := 0.0;\r
  low := 0.0;\r
  part := 0.0;\r
  inside := false;\r
  sampleX := 0;\r
  sampleY := 0;\r
  sampleIndex := 1;\r
  sample := 0.0;\r
  usable := false;\r
  configuration := enabled and depthUnits > 0.0 and depthUnits <= 1e6 and size(depth,1) > 1 and size(depth,2) > 1 and\r
    pixel[1] >= 0.0 and pixel[1] < size(depth,2) and pixel[2] >= 0.0 and pixel[2] < size(depth,1) and\r
    rgbCalibration[1] >= 1e-6 and rgbCalibration[1] <= 1e6 and rgbCalibration[2] >= 1e-6 and rgbCalibration[2] <= 1e6 and\r
    depthCalibration[1] >= 1e-6 and depthCalibration[1] <= 1e6 and depthCalibration[2] >= 1e-6 and depthCalibration[2] <= 1e6 and\r
    abs(rgbCalibration[3]) <= 1e6 and abs(rgbCalibration[4]) <= 1e6 and\r
    abs(depthCalibration[3]) <= 1e6 and abs(depthCalibration[4]) <= 1e6 and\r
    nearDepth > 0.0 and farDepth > nearDepth+0.05 and farDepth <= 1e6 and\r
    disparityNoise >= 0.0 and disparityNoise <= 1.0 and noiseReferenceFx >= 1e-6 and noiseReferenceFx <= 1e6 and\r
    baseline >= 1e-6 and baseline <= 10.0;\r
  mapped := zeros(2);\r
  bearing := zeros(2);\r
  lower := fill(0,2);\r
  fraction := zeros(2);\r
  for k in 1:2 loop\r
    mapped[k] := if configuration then (pixel[k]-rgbCalibration[k+2])*depthCalibration[k]/rgbCalibration[k]+depthCalibration[k+2] else 0.0;\r
    low := floor(mapped[k]);\r
    part := mapped[k]-low;\r
    nearest := if part < 0.5 then low else if part > 0.5 then low+1.0 else if floor(low/2.0)*2.0 == low then low else low+1.0;\r
    bearing[k] := if abs(mapped[k]-nearest) <= 1e-9 then nearest else mapped[k];\r
    inside := configuration and bearing[k] >= 0.0 and bearing[k] <= (if k == 1 then size(depth,2)-1 else size(depth,1)-1);\r
    lower[k] := if inside then integer(floor(bearing[k])) else 0;\r
    fraction[k] := if inside then bearing[k]-lower[k] else 0.0;\r
    configuration := configuration and inside;\r
  end for;\r
  weight := {(1.0-fraction[1])*(1.0-fraction[2]),fraction[1]*(1.0-fraction[2]),\r
    (1.0-fraction[1])*fraction[2],fraction[1]*fraction[2]};\r
  valid := configuration;\r
  inverseDepth := 0.0;\r
  minimumDepth := farDepth;\r
  maximumDepth := 0.0;\r
  for row in 0:1 loop\r
    for column in 0:1 loop\r
      sampleIndex := 2*row+column+1;\r
      sampleX := lower[1]+column;\r
      sampleY := lower[2]+row;\r
      sample := if configuration and weight[sampleIndex] > 0.0\r
        and sampleX < size(depth,2) and sampleY < size(depth,1)\r
        then depth[sampleY+1,sampleX+1]*depthUnits else 0.0;\r
      usable := weight[sampleIndex] <= 0.0 or (sample > nearDepth and sample < farDepth-0.05);\r
      valid := valid and usable;\r
      minimumDepth := if weight[sampleIndex] > 0.0 and usable then min(minimumDepth,sample) else minimumDepth;\r
      maximumDepth := if weight[sampleIndex] > 0.0 and usable then max(maximumDepth,sample) else maximumDepth;\r
      inverseDepth := inverseDepth+(if weight[sampleIndex] > 0.0 and usable\r
        then weight[sampleIndex]/max(sample,1e-12) else 0.0);\r
    end for;\r
  end for;\r
  threshold := if configuration then 0.03+0.025*minimumDepth+3.0*minimumDepth^2*disparityNoise/(noiseReferenceFx*baseline) else 0.0;\r
  valid := valid and maximumDepth-minimumDepth <= threshold and inverseDepth > 0.0;\r
  axialDepth := if valid then 1.0/max(inverseDepth,1e-12) else 0.0;\r
  point := zeros(3);\r
  point[1] := if valid then (pixel[1]-rgbCalibration[3])*axialDepth/rgbCalibration[1] else 0.0;\r
  point[2] := if valid then (pixel[2]-rgbCalibration[4])*axialDepth/rgbCalibration[2] else 0.0;\r
  point[3] := axialDepth;\r
end RGBDCalibratedPoint;\r
\r
// Reserve feature slots for pixels with valid calibrated depth.\r
function RGBDDepthQualifiedScores\r
\r
  input Real depth[:,:];\r
  input Real scores[size(depth,1)*size(depth,2)];\r
  input Real rgbCalibration[4];\r
  input Real depthCalibration[4];\r
  input Real nearDepth;\r
  input Real farDepth;\r
  input Real disparityNoise;\r
  input Real noiseReferenceFx;\r
  input Real baseline;\r
  input Boolean enabled = true;\r
  output Real qualified[size(scores,1)];\r
  input Real depthUnits = 1.0 "Meters per depth sample; 1 for metric depth, SDK scale for Z16";\r
protected\r
  Real point[3];\r
  Boolean valid;\r
  Integer index;\r
algorithm\r
  qualified := zeros(size(scores,1));\r
  if enabled then\r
    qualified := scores;\r
    for row in 1:size(depth,1) loop\r
      for column in 1:size(depth,2) loop\r
        index := (row-1)*size(depth,2)+column;\r
        // Leave invalid scores untouched for the selector to refuse. Zero\r
        // scores need no depth work; disabled acquisitions read no depth.\r
        if scores[index] > 0.0 and scores[index] <= 1e8 then\r
          (point,valid) := RGBDCalibratedPoint(depth,{column-1.0,row-1.0},true,\r
            rgbCalibration,depthCalibration,nearDepth,farDepth,\r
            disparityNoise,noiseReferenceFx,baseline,depthUnits=depthUnits);\r
          if not valid then\r
            qualified[index] := 0.0;\r
          end if;\r
        end if;\r
      end for;\r
    end for;\r
  end if;\r
end RGBDDepthQualifiedScores;\r
\r
// Shared patch admission and source-order normalization for gray and RGB inputs.\r
function RGBDDescriptorConfiguration\r
  input Integer imageSize[2];\r
  input Integer depthSize[2];\r
  input Real activeCount;\r
  input Integer capacity;\r
  input Real rgbCalibration[4];\r
  input Real nearDepth;\r
  input Real farDepth;\r
  input Real minimumContrast;\r
  output Boolean valid;\r
algorithm\r
  valid := imageSize[1] == depthSize[1] and imageSize[2] == depthSize[2] and\r
    activeCount >= 0.0 and activeCount <= capacity and floor(activeCount) == activeCount and\r
    rgbCalibration[1] >= 1e-6 and rgbCalibration[1] <= 1e6 and rgbCalibration[2] >= 1e-6 and rgbCalibration[2] <= 1e6 and\r
    abs(rgbCalibration[3]) <= 1e6 and abs(rgbCalibration[4]) <= 1e6 and\r
    nearDepth > 0.0 and farDepth >= nearDepth and farDepth <= 1e6 and\r
    minimumContrast > 0.0 and minimumContrast <= 1.0;\r
end RGBDDescriptorConfiguration;\r
\r
function RGBDDescriptorPosition\r
  input Real pixel[2];\r
  input Integer imageSize[2];\r
  input Boolean requested;\r
  output Boolean valid;\r
  output Integer x;\r
  output Integer y;\r
algorithm\r
  valid := requested and pixel[1] >= 3.0 and pixel[1] <= imageSize[2]-4 and\r
    pixel[2] >= 3.0 and pixel[2] <= imageSize[1]-4 and\r
    floor(pixel[1]) == pixel[1] and floor(pixel[2]) == pixel[2];\r
  x := if valid then integer(pixel[1]) else 3;\r
  y := if valid then integer(pixel[2]) else 3;\r
end RGBDDescriptorPosition;\r
\r
function RGBDNormalizeDescriptor\r
  input Real samples[patchSize];\r
  input Boolean eligible;\r
  input Real contrastThreshold;\r
  output Real descriptor[patchSize];\r
  output Boolean valid;\r
protected\r
  constant Integer patchWidth = 7;\r
  constant Integer patchSize = patchWidth*patchWidth;\r
  Real patch[patchSize];\r
  Real mean;\r
  Real energy;\r
  Real scale;\r
algorithm\r
  valid := eligible;\r
  mean := 0.0;\r
  energy := 0.0;\r
  for k in 1:patchSize loop\r
    patch[k] := if samples[k] >= 0.0 and samples[k] <= 1.0 then samples[k] else 0.0;\r
    valid := valid and samples[k] >= 0.0 and samples[k] <= 1.0;\r
    mean := mean+patch[k];\r
  end for;\r
  mean := mean/patchSize;\r
  for k in 1:patchSize loop\r
    patch[k] := patch[k]-mean;\r
    energy := energy+patch[k]*patch[k];\r
  end for;\r
  valid := valid and energy >= contrastThreshold;\r
  scale := if valid then sqrt(energy) else 1.0;\r
  for k in 1:patchSize loop\r
    descriptor[k] := if valid then patch[k]/scale else 0.0;\r
  end for;\r
end RGBDNormalizeDescriptor;\r
\r
// Editable image-patch frontend. No pose truth or host matching enters here.\r
function DescribeRGBDFeatures\r
\r
  input Real gray[:,:] "Measured grayscale intensity in [0,1]";\r
  input Real depth[:,:] "Measured axial samples; depthUnits converts to meters";\r
  input Real pixels[:,2] "Zero-based, integer image coordinates";\r
  input Real activeCount;\r
  input Real rgbCalibration[4] "RGB fx,fy,cx,cy";\r
  input Real depthCalibration[4] "Depth fx,fy,cx,cy";\r
  input Real disparityNoise;\r
  input Real noiseReferenceFx;\r
  input Real baseline;\r
  input Real nearDepth;\r
  input Real farDepth;\r
  input Real minimumContrast;\r
  output Real descriptor[size(pixels,1),49];\r
  output Real point[size(pixels,1),3] "Camera frame: right, down, forward";\r
  output Real enabled[size(pixels,1)];\r
  output Real invalidCount;\r
  input Real depthUnits = 1.0 "Meters per depth sample; 1 for metric depth, SDK scale for Z16";\r
protected\r
  constant Integer patchWidth = 7;\r
  constant Integer patchSize = patchWidth*patchWidth;\r
  Real optical[3];\r
  Boolean depthValid;\r
  Real patch[patchSize];\r
  Real contrastThreshold;\r
  Integer x;\r
  Integer y;\r
  Integer patchIndex;\r
  Boolean configuration;\r
  Boolean positionValid;\r
  Boolean valid;\r
algorithm\r
  optical := zeros(3);\r
  depthValid := false;\r
  positionValid := false;\r
  valid := false;\r
  x := 3;\r
  y := 3;\r
  patchIndex := 1;\r
  patch := zeros(patchSize);\r
  descriptor := zeros(size(pixels,1),patchSize);\r
  point := zeros(size(pixels,1),3);\r
  enabled := zeros(size(pixels,1));\r
  invalidCount := 0.0;\r
  configuration := RGBDDescriptorConfiguration({size(gray,1),size(gray,2)},{size(depth,1),size(depth,2)},\r
    activeCount,size(pixels,1),rgbCalibration,nearDepth,farDepth,minimumContrast);\r
  contrastThreshold := if configuration then patchSize*minimumContrast*minimumContrast else 0.0;\r
  for i in 1:size(pixels,1) loop\r
    (positionValid,x,y) := RGBDDescriptorPosition(pixels[i,:],{size(gray,1),size(gray,2)},configuration and i <= activeCount);\r
    (optical,depthValid) := RGBDCalibratedPoint(depth,pixels[i,:],positionValid,\r
      rgbCalibration,depthCalibration,nearDepth,farDepth,\r
      disparityNoise,noiseReferenceFx,baseline,depthUnits=depthUnits);\r
    for row in 0:patchWidth-1 loop\r
      for column in 0:patchWidth-1 loop\r
        patchIndex := row*patchWidth+column+1;\r
        patch[patchIndex] := if positionValid then gray[y+row-2,x+column-2] else 0.0;\r
      end for;\r
    end for;\r
    (descriptor[i,:],valid) := RGBDNormalizeDescriptor(patch,positionValid and depthValid,contrastThreshold);\r
    point[i,1] := if valid then optical[1] else 0.0;\r
    point[i,2] := if valid then optical[2] else 0.0;\r
    point[i,3] := if valid then optical[3] else 0.0;\r
    enabled[i] := if valid then 1.0 else 0.0;\r
    invalidCount := invalidCount+(if i <= activeCount and not valid then 1.0 else 0.0);\r
  end for;\r
end DescribeRGBDFeatures;\r
\r
function RGBDDescriptorValid\r
  input Real descriptor[:];\r
  input Real point[3];\r
  input Boolean enabled;\r
  output Boolean valid;\r
protected\r
  Real energy;\r
algorithm\r
  valid := enabled;\r
  energy := 0.0;\r
  for k in 1:size(descriptor,1) loop\r
    valid := valid and abs(descriptor[k]) <= 1.0;\r
    energy := energy+(if enabled and abs(descriptor[k]) <= 1.0 then descriptor[k]*descriptor[k] else 0.0);\r
  end for;\r
  for k in 1:3 loop\r
    valid := valid and abs(point[k]) <= 1e6;\r
  end for;\r
  valid := valid and abs(energy-1.0) <= 1e-8;\r
end RGBDDescriptorValid;\r
\r
function RGBDDescriptorDistance\r
  input Real first[:];\r
  input Real second[size(first,1)];\r
  output Real distance;\r
protected\r
  Real delta;\r
algorithm\r
  distance := 0.0;\r
  for k in 1:size(first,1) loop\r
    delta := first[k]-second[k];\r
    distance := distance+delta*delta;\r
  end for;\r
end RGBDDescriptorDistance;\r
\r
function RGBDPredictedPoint\r
  input Real point[3];\r
  input Real rotation[3,3];\r
  input Real translation[3];\r
  input Boolean enabled;\r
  output Real predicted[3];\r
algorithm\r
  predicted := zeros(3);\r
  for a in 1:3 loop\r
    predicted[a] := if enabled then translation[a] else 0.0;\r
    for b in 1:3 loop\r
      predicted[a] := predicted[a]+(if enabled then rotation[a,b]*point[b] else 0.0);\r
    end for;\r
  end for;\r
end RGBDPredictedPoint;\r
\r
function RGBDGeometricDistance\r
  input Real first[3];\r
  input Real second[3];\r
  output Real distance;\r
protected\r
  Real delta;\r
algorithm\r
  distance := 0.0;\r
  for k in 1:3 loop\r
    delta := first[k]-second[k];\r
    distance := distance+delta*delta;\r
  end for;\r
end RGBDGeometricDistance;\r
\r
function MatchRGBDDescriptors\r
\r
  input Real referenceDescriptor[:,49];\r
  input Real currentDescriptor[:,49];\r
  input Real referencePoint[:,3];\r
  input Real currentPoint[:,3];\r
  input Real referenceEnabled[:];\r
  input Real currentEnabled[:];\r
  input Real referenceCount;\r
  input Real currentCount;\r
  input Real ratio;\r
  input Real maximumDescriptorDistance;\r
  input Real usePrediction;\r
  input Real predictedRotation[3,3];\r
  input Real predictedTranslation[3];\r
  input Real maximumGeometricDistance;\r
  output Real currentIndex[size(referenceEnabled,1)] "One-based partner; zero means rejected";\r
  output Real pairEnabled[size(referenceEnabled,1)];\r
  output Real sourcePoint[size(referenceEnabled,1),3];\r
  output Real targetPoint[size(referenceEnabled,1),3];\r
  output Real count;\r
  output Real configurationValid;\r
  output Real invalidReference;\r
  output Real invalidCurrent;\r
  output Real nearestDistance[size(referenceEnabled,1)];\r
  output Real secondDistance[size(referenceEnabled,1)];\r
protected\r
  Boolean referenceValid[size(referenceEnabled,1)];\r
  Boolean currentValid[size(currentEnabled,1)];\r
  Integer activeReference[size(referenceEnabled,1)];\r
  Integer activeCurrent[size(currentEnabled,1)];\r
  Integer referenceSize;\r
  Integer currentSize;\r
  Integer i;\r
  Integer j;\r
  Integer descriptorSample;\r
  Integer nearest[size(referenceEnabled,1)];\r
  Integer reciprocal[size(currentEnabled,1)];\r
  Real reciprocalDistance[size(currentEnabled,1)];\r
  Real predicted[3];\r
  Real energy;\r
  Real distance;\r
  Real geometric;\r
  Real rotationCheck;\r
  Real determinant;\r
  Real geometricLimitSquared;\r
  Real distanceLimit;\r
  Real delta;\r
  Boolean configuration;\r
  Boolean predictionValid;\r
  Boolean eligible;\r
  Boolean accepted;\r
algorithm\r
  currentIndex := zeros(size(referenceEnabled,1));\r
  pairEnabled := zeros(size(referenceEnabled,1));\r
  sourcePoint := zeros(size(referenceEnabled,1),3);\r
  targetPoint := zeros(size(referenceEnabled,1),3);\r
  nearestDistance := fill(1e30,size(referenceEnabled,1));\r
  secondDistance := fill(1e30,size(referenceEnabled,1));\r
  reciprocalDistance := fill(1e30,size(currentEnabled,1));\r
  nearest := fill(0,size(referenceEnabled,1));\r
  reciprocal := fill(0,size(currentEnabled,1));\r
  referenceValid := fill(false,size(referenceEnabled,1));\r
  currentValid := fill(false,size(currentEnabled,1));\r
  activeReference := fill(0,size(referenceEnabled,1));\r
  activeCurrent := fill(0,size(currentEnabled,1));\r
  referenceSize := 0;\r
  currentSize := 0;\r
  count := 0.0;\r
  invalidReference := 0.0;\r
  invalidCurrent := 0.0;\r
  configuration := size(referenceDescriptor,1) == size(referenceEnabled,1) and size(currentDescriptor,1) == size(currentEnabled,1) and\r
    size(referencePoint,1) == size(referenceEnabled,1) and size(currentPoint,1) == size(currentEnabled,1) and\r
    referenceCount >= 0.0 and referenceCount <= size(referenceEnabled,1) and floor(referenceCount) == referenceCount and\r
    currentCount >= 0.0 and currentCount <= size(currentEnabled,1) and floor(currentCount) == currentCount and\r
    ratio > 0.0 and ratio < 1.0 and maximumDescriptorDistance >= 0.0 and maximumDescriptorDistance <= 2.0 and\r
    (usePrediction == 0.0 or usePrediction == 1.0) and maximumGeometricDistance >= 0.0 and maximumGeometricDistance <= 1e6;\r
  rotationCheck := 0.0;\r
  predictionValid := true;\r
  for a in 1:3 loop\r
    predictionValid := predictionValid and abs(predictedTranslation[a]) <= 1e6;\r
    for b in 1:3 loop\r
      predictionValid := predictionValid and abs(predictedRotation[a,b]) <= 1.0;\r
      energy := 0.0;\r
      for k in 1:3 loop\r
        energy := energy+(if usePrediction == 1.0\r
          and abs(predictedRotation[k,a]) <= 1.0 and abs(predictedRotation[k,b]) <= 1.0\r
          then predictedRotation[k,a]*predictedRotation[k,b] else 0.0);\r
      end for;\r
      rotationCheck := rotationCheck+abs(energy-(if a == b then 1.0 else 0.0));\r
    end for;\r
  end for;\r
  determinant := if predictionValid and usePrediction == 1.0 then\r
    predictedRotation[1,1]*(predictedRotation[2,2]*predictedRotation[3,3]-predictedRotation[2,3]*predictedRotation[3,2])-\r
    predictedRotation[1,2]*(predictedRotation[2,1]*predictedRotation[3,3]-predictedRotation[2,3]*predictedRotation[3,1])+\r
    predictedRotation[1,3]*(predictedRotation[2,1]*predictedRotation[3,2]-predictedRotation[2,2]*predictedRotation[3,1]) else 1.0;\r
  configuration := configuration and (usePrediction == 0.0 or (predictionValid and rotationCheck <= 1e-8 and abs(determinant-1.0) <= 1e-8));\r
  configurationValid := if configuration then 1.0 else 0.0;\r
  geometricLimitSquared := if configuration then maximumGeometricDistance*maximumGeometricDistance else 0.0;\r
  for slot in 1:size(referenceEnabled,1) loop\r
    referenceValid[slot] := RGBDDescriptorValid(referenceDescriptor[slot,:],referencePoint[slot,:],\r
      configuration and slot <= referenceCount and referenceEnabled[slot] == 1.0);\r
    invalidReference := invalidReference+(if slot <= referenceCount and referenceEnabled[slot] <> 0.0 and not referenceValid[slot] then 1.0 else 0.0);\r
    if referenceValid[slot] then\r
      referenceSize := referenceSize+1;\r
      activeReference[referenceSize] := slot;\r
    end if;\r
  end for;\r
  for slot in 1:size(currentEnabled,1) loop\r
    currentValid[slot] := RGBDDescriptorValid(currentDescriptor[slot,:],currentPoint[slot,:],configuration and slot <= currentCount and currentEnabled[slot] == 1.0);\r
    invalidCurrent := invalidCurrent+(if slot <= currentCount and currentEnabled[slot] <> 0.0 and not currentValid[slot] then 1.0 else 0.0);\r
    if currentValid[slot] then\r
      currentSize := currentSize+1;\r
      activeCurrent[currentSize] := slot;\r
    end if;\r
  end for;\r
  // Visit valid slots in ascending order to preserve lowest-index ties.\r
  for referenceSlot in 1:referenceSize loop\r
    i := activeReference[referenceSlot];\r
    predicted := RGBDPredictedPoint(referencePoint[i,:],predictedRotation,predictedTranslation,usePrediction == 1.0);\r
    for currentSlot in 1:currentSize loop\r
      j := activeCurrent[currentSlot];\r
      eligible := true;\r
      geometric := if eligible and usePrediction == 1.0 then RGBDGeometricDistance(predicted,currentPoint[j,:]) else 0.0;\r
      eligible := eligible and (usePrediction == 0.0 or geometric <= geometricLimitSquared);\r
      distance := 1e30;\r
      if eligible then\r
        // Stop once neither nearest-neighbor search can improve.\r
        distanceLimit := max(secondDistance[i],reciprocalDistance[j]);\r
        distance := 0.0;\r
        descriptorSample := 1;\r
        while descriptorSample <= size(referenceDescriptor,2) and distance < distanceLimit loop\r
          delta := referenceDescriptor[i,descriptorSample]-currentDescriptor[j,descriptorSample];\r
          distance := distance+delta*delta;\r
          descriptorSample := descriptorSample+1;\r
        end while;\r
      end if;\r
      if distance < nearestDistance[i] then\r
        secondDistance[i] := nearestDistance[i];\r
        nearestDistance[i] := distance;\r
        nearest[i] := j;\r
      elseif distance < secondDistance[i] then\r
        secondDistance[i] := distance;\r
      end if;\r
      if distance < reciprocalDistance[j] then\r
        reciprocalDistance[j] := distance;\r
        reciprocal[j] := i;\r
      end if;\r
    end for;\r
  end for;\r
  for i in 1:size(referenceEnabled,1) loop\r
    accepted := if nearest[i] > 0 and secondDistance[i] < 1e30 then\r
      nearestDistance[i] <= maximumDescriptorDistance*maximumDescriptorDistance and\r
      nearestDistance[i] < ratio*ratio*secondDistance[i] and reciprocal[nearest[i]] == i else false;\r
    currentIndex[i] := if accepted then nearest[i] else 0.0;\r
    pairEnabled[i] := if accepted then 1.0 else 0.0;\r
    count := count+(if accepted then 1.0 else 0.0);\r
    for k in 1:3 loop\r
      sourcePoint[i,k] := if accepted then referencePoint[i,k] else 0.0;\r
      targetPoint[i,k] := if accepted then currentPoint[nearest[i],k] else 0.0;\r
    end for;\r
  end for;\r
end MatchRGBDDescriptors;\r
\r
model RGBDFeatureMatching\r
\r
  constant Integer featureCapacity = 350;\r
  constant Integer descriptorWidth = 7;\r
  constant Integer descriptorSize = descriptorWidth*descriptorWidth;\r
  parameter Real ratio = 0.8;\r
  parameter Real maximumDescriptorDistance = 0.8;\r
  parameter Real maximumGeometricDistance = 0.5;\r
  input Real referenceDescriptor[featureCapacity,descriptorSize];\r
  input Real currentDescriptor[featureCapacity,descriptorSize];\r
  input Real referencePoint[featureCapacity,3];\r
  input Real currentPoint[featureCapacity,3];\r
  input Real referenceEnabled[featureCapacity];\r
  input Real currentEnabled[featureCapacity];\r
  input Real referenceCount;\r
  input Real currentCount;\r
  input Real usePrediction = 0.0;\r
  input Real predictedRotation[3,3] = identity(3);\r
  input Real predictedTranslation[3] = zeros(3);\r
  output Real currentIndex[featureCapacity];\r
  output Real pairEnabled[featureCapacity];\r
  output Real sourcePoint[featureCapacity,3];\r
  output Real targetPoint[featureCapacity,3];\r
  output Real count;\r
  output Real configurationValid;\r
  output Real invalidReference;\r
  output Real invalidCurrent;\r
  output Real nearestDistance[featureCapacity];\r
  output Real secondDistance[featureCapacity];\r
equation\r
  (currentIndex,pairEnabled,sourcePoint,targetPoint,count,configurationValid,invalidReference,invalidCurrent,nearestDistance,secondDistance) =\r
    MatchRGBDDescriptors(referenceDescriptor,currentDescriptor,referencePoint,currentPoint,referenceEnabled,currentEnabled,\r
      referenceCount,currentCount,ratio,maximumDescriptorDistance,usePrediction,predictedRotation,predictedTranslation,maximumGeometricDistance);\r
end RGBDFeatureMatching;\r
\r
// Held-IMU intervals return empty descriptors without reading either image.\r
function DescribeRGBDFrame\r
\r
  input Real rgb[:,:,:];\r
  input Real depth[size(rgb,1),size(rgb,2)];\r
  input Real pixels[:,2];\r
  input Real activeCount;\r
  input Real rgbCalibration[4];\r
  input Real depthCalibration[4];\r
  input Real disparityNoise;\r
  input Real noiseReferenceFx;\r
  input Real baseline;\r
  input Real nearDepth;\r
  input Real farDepth;\r
  input Real minimumContrast;\r
  input Boolean imageEnabled = true;\r
  output Real descriptor[size(pixels,1),49];\r
  output Real point[size(pixels,1),3];\r
  output Real enabled[size(pixels,1)];\r
  output Real invalidCount;\r
  input Real depthUnits = 1.0 "Meters per depth sample; 1 for metric depth, SDK scale for Z16";\r
protected\r
  constant Integer colorChannelCount = 3;\r
  constant Integer descriptorWidth = 7;\r
  constant Integer descriptorSize = descriptorWidth*descriptorWidth;\r
  Real patch[descriptorSize];\r
  Real color[colorChannelCount];\r
  Real optical[3];\r
  Real contrastThreshold;\r
  Integer x;\r
  Integer y;\r
  Integer patchIndex;\r
  Boolean configuration;\r
  Boolean positionValid;\r
  Boolean depthValid;\r
  Boolean valid;\r
algorithm\r
  descriptor := zeros(size(pixels,1),descriptorSize);\r
  point := zeros(size(pixels,1),3);\r
  enabled := zeros(size(pixels,1));\r
  invalidCount := 0.0;\r
  if imageEnabled then\r
    assert(size(rgb,3) == 3 or size(rgb,3) == 4,"Descriptors expect RGB or RGBA channels");\r
    configuration := RGBDDescriptorConfiguration({size(rgb,1),size(rgb,2)},{size(depth,1),size(depth,2)},\r
      activeCount,size(pixels,1),rgbCalibration,nearDepth,farDepth,minimumContrast);\r
    contrastThreshold := if configuration then descriptorSize*minimumContrast*minimumContrast else 0.0;\r
    for i in 1:size(pixels,1) loop\r
      (positionValid,x,y) := RGBDDescriptorPosition(pixels[i,:],{size(rgb,1),size(rgb,2)},configuration and i <= activeCount);\r
      (optical,depthValid) := RGBDCalibratedPoint(depth,pixels[i,:],positionValid,rgbCalibration,\r
        depthCalibration,nearDepth,farDepth,disparityNoise,noiseReferenceFx,baseline,depthUnits=depthUnits);\r
      patch := zeros(descriptorSize);\r
      // Convert selected patches only; ignore alpha and the rest of the image.\r
      if positionValid then\r
        for row in 0:descriptorWidth-1 loop\r
          for column in 0:descriptorWidth-1 loop\r
            patchIndex := row*descriptorWidth+column+1;\r
            color := rgb[y+row-2,x+column-2,1:colorChannelCount];\r
            patch[patchIndex] := if color[1] >= 0.0 and color[1] <= 255.0\r
              and color[2] >= 0.0 and color[2] <= 255.0 and color[3] >= 0.0 and color[3] <= 255.0\r
              then (color[1]+color[2]+color[3])/(colorChannelCount*255.0) else -1.0;\r
          end for;\r
        end for;\r
      end if;\r
      (descriptor[i,:],valid) := RGBDNormalizeDescriptor(patch,positionValid and depthValid,contrastThreshold);\r
      point[i,:] := if valid then optical else zeros(3);\r
      enabled[i] := if valid then 1.0 else 0.0;\r
      invalidCount := invalidCount+(if i <= activeCount and not valid then 1.0 else 0.0);\r
    end for;\r
  end if;\r
end DescribeRGBDFrame;\r
\r
model RGBDDescriptorFrame\r
\r
  parameter Integer imageHeight(min=1) = 90;\r
  parameter Integer imageWidth(min=1) = 160;\r
  constant Integer featureCapacity = 350;\r
  constant Integer descriptorWidth = 7;\r
  constant Integer descriptorSize = descriptorWidth*descriptorWidth;\r
  parameter Real minimumContrast = 1e-6;\r
  parameter Real nearDepth = 0.28;\r
  parameter Real farDepth = 10.0;\r
  parameter Integer channelCount(min=3,max=4) = 4;\r
  constant Integer colorChannelCount = 3;\r
  input Boolean imageEnabled = true "Exactly the camera acquisition, not a held-IMU interval";\r
  input Real rgb[imageHeight,imageWidth,channelCount];\r
  input Real depth[imageHeight,imageWidth];\r
  input Real depthUnits = 1.0 "Meters per depth sample";\r
  input Real pixels[featureCapacity,2];\r
  input Real activeCount;\r
  input Real rgbCalibration[4] = {imageWidth/(2*tan(69*3.141592653589793/360)),imageHeight/(2*tan(42*3.141592653589793/360)),(imageWidth-1)/2.0,(imageHeight-1)/2.0};\r
  input Real depthCalibration[4] = {imageWidth/(2*tan(87*3.141592653589793/360)),imageHeight/(2*tan(58*3.141592653589793/360)),(imageWidth-1)/2.0,(imageHeight-1)/2.0};\r
  constant Integer noiseReferenceWidth = 848;\r
  input Real disparityNoise = 0.1;\r
  input Real noiseReferenceFx = noiseReferenceWidth/(2*tan(87*3.141592653589793/360));\r
  input Real baseline = 0.05;\r
  output Real descriptor[featureCapacity,descriptorSize];\r
  output Real point[featureCapacity,3];\r
  output Real enabled[featureCapacity];\r
  output Real invalidCount;\r
equation\r
  (descriptor,point,enabled,invalidCount) = DescribeRGBDFrame(rgb,depth,pixels,activeCount,\r
    rgbCalibration,depthCalibration,disparityNoise,noiseReferenceFx,baseline,\r
    nearDepth,farDepth,minimumContrast,imageEnabled,depthUnits=depthUnits);\r
end RGBDDescriptorFrame;\r
`;export{e as default};
