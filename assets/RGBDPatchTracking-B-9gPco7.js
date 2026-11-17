const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Staged photometric primitive: no production caller or source-manifest entry.\r
// Forward-additive translation only; no depth, correspondence independence,\r
// full-image forward/backward check, or uncertainty certificate is implied.\r
package RGBDPatchTracking\r
  constant Integer patchWidth = 7;\r
  constant Integer patchSize = patchWidth*patchWidth;\r
  constant Integer pixelDimension = 2;\r
\r
  record Settings\r
    Integer maximumIterations = 20;\r
    Integer maximumBacktracks = 8;\r
    Real searchRadius = 4.0 "Maximum distance from supplied seed, in pixels";\r
    Real maximumStep = 1.0;\r
    Real convergenceTolerance = 0.001;\r
    Real minimumContrast = 0.001 "Raw grayscale standard deviation; admitted range [1e-12,1]";\r
    Real minimumEigenvalue = 1e-6;\r
    Real minimumEigenvalueRatio = 0.001;\r
    Real maximumSsd = 0.04 "Sum of squared unit-normalized descriptor residuals";\r
    Integer interpolationMethod = 0 "0 bilinear; 1 C1 Catmull-Rom with complete4x4 raw support";\r
  end Settings;\r
\r
  record Diagnostics\r
    Integer stopDetail = 0 "0 disabled; 1 accepted; 2 config; 3 reference; 4 sample; 5 Hessian; 6 step; 7 backtracking; 8 search; 9 iterations; 10 SSD";\r
    Boolean evaluated = false;\r
    Real lastEvaluatedPixel[pixelDimension] = zeros(pixelDimension);\r
    Boolean acceptedTrial = false;\r
    Real lastAcceptedTrialPixel[pixelDimension] = zeros(pixelDimension);\r
    Real initialSsd = 0;\r
    Boolean stepValid = false;\r
    Real lastRawStep[pixelDimension] = zeros(pixelDimension);\r
    Real lastRawStepNorm = 0;\r
    Integer lastBacktrack = 0;\r
    Real lastTrialScale = 0;\r
    Real lastTrialPixel[pixelDimension] = zeros(pixelDimension);\r
    Boolean lastTrialInSearch = false;\r
    Boolean lastTrialValid = false;\r
    Real lastTrialSsd = 0;\r
    Integer windowRejects = 0;\r
    Integer sampleRejects = 0;\r
    Integer nonDecreaseRejects = 0;\r
    Real lastEnergy = 0;\r
    Real maximumEigenvalue = 0;\r
    Real lastGradient[pixelDimension] = zeros(pixelDimension);\r
  end Diagnostics;\r
\r
  function SmoothBinomial\r
    input Real gray[:,:];\r
    output Real filtered[size(gray,1),size(gray,2)] "-1 where complete valid support is unavailable";\r
    output Boolean valid[size(gray,1),size(gray,2)];\r
  protected\r
    constant Integer tapCount = 5;\r
    constant Real weights[tapCount] = {1,4,6,4,1};\r
    constant Real weightSum = 16;\r
    Real horizontal[size(gray,1),size(gray,2)]; Real values[tapCount]; Boolean supportValid;\r
  algorithm\r
    filtered := fill(-1.0,size(gray,1),size(gray,2));\r
    valid := fill(false,size(gray,1),size(gray,2));\r
    horizontal := fill(-1.0,size(gray,1),size(gray,2));\r
    // All taps have positive weight: invalid samples are never renormalized away.\r
    // The outer two-pixel border has no complete support; no padding is invented.\r
    if size(gray,1) < tapCount or size(gray,2) < tapCount then return; end if;\r
    for row in 1:size(gray,1) loop\r
      for column in 3:size(gray,2)-2 loop\r
        supportValid := true;\r
        for tap in 1:tapCount loop\r
          values[tap] := gray[row,column+tap-3];\r
          supportValid := supportValid and values[tap] >= 0 and values[tap] <= 1;\r
        end for;\r
        if supportValid then horizontal[row,column] := weights*values/weightSum; end if;\r
      end for;\r
    end for;\r
    for row in 3:size(gray,1)-2 loop\r
      for column in 3:size(gray,2)-2 loop\r
        supportValid := true;\r
        for tap in 1:tapCount loop\r
          values[tap] := horizontal[row+tap-3,column];\r
          supportValid := supportValid and values[tap] >= 0 and values[tap] <= 1;\r
        end for;\r
        if supportValid then\r
          filtered[row,column] := weights*values/weightSum; valid[row,column] := true;\r
        end if;\r
      end for;\r
    end for;\r
  end SmoothBinomial;\r
\r
  function CatmullRomWeights\r
    input Real fraction "Admitted sample fraction in [0,1)";\r
    output Real weights[4];\r
    output Real derivative[4];\r
  protected\r
    Real squared; Real cubed;\r
  algorithm\r
    squared := fraction*fraction; cubed := squared*fraction;\r
    weights := {-0.5*fraction+squared-0.5*cubed,1-2.5*squared+1.5*cubed,\r
      0.5*fraction+2*squared-1.5*cubed,-0.5*squared+0.5*cubed};\r
    derivative := {-0.5+2*fraction-1.5*squared,-5*fraction+4.5*squared,\r
      0.5+4*fraction-4.5*squared,-fraction+1.5*squared};\r
  end CatmullRomWeights;\r
\r
  function Sample\r
    input Real gray[:,:] "Raw samples use the existing [0,1] gray convention";\r
    input Real pixel[pixelDimension] "Zero-based RGB coordinates";\r
    input Real minimumContrast = 0.001;\r
    input Integer interpolationMethod = 0 "0 bilinear; 1 C1 Catmull-Rom";\r
    output Boolean valid;\r
    output Real descriptor[patchSize];\r
    output Real jacobian[patchSize,pixelDimension];\r
    output Real energy;\r
  protected\r
    Real samples[patchSize]; Real gradient[patchSize,pixelDimension];\r
    Real centered[patchSize]; Real meanSample; Real meanGradient[pixelDimension];\r
    Real projection[pixelDimension]; Real x; Real y; Real fx; Real fy;\r
    Real a; Real b; Real c; Real d; Real denominator;\r
    Real weightsX[4]; Real weightsY[4]; Real derivativeX[4]; Real derivativeY[4];\r
    Real support[4,4];\r
    Integer x0; Integer y0; Integer slot;\r
  algorithm\r
    valid := false; descriptor := zeros(patchSize);\r
    jacobian := zeros(patchSize,pixelDimension); energy := 0.0;\r
    // The upper bound leaves a complete derivative cell even at integer pixels.\r
    // Validate before floor/Integer conversion or any indexed read.\r
    if interpolationMethod == 0 then\r
      if not (size(gray,1) >= patchWidth+1 and size(gray,2) >= patchWidth+1\r
        and pixel[1] >= 3 and pixel[1] < size(gray,2)-4\r
        and pixel[2] >= 3 and pixel[2] < size(gray,1)-4\r
        and minimumContrast >= 1e-12 and minimumContrast <= 1) then return; end if;\r
    elseif interpolationMethod == 1 then\r
      // A cubic sample needs floor(x)-1..floor(x)+2 on each axis, including\r
      // zero-weight taps at knots. No padded or clamped boundary is invented.\r
      if not (size(gray,1) >= patchWidth+3 and size(gray,2) >= patchWidth+3\r
        and pixel[1] >= 4 and pixel[1] < size(gray,2)-5\r
        and pixel[2] >= 4 and pixel[2] < size(gray,1)-5\r
        and minimumContrast >= 1e-12 and minimumContrast <= 1) then return; end if;\r
    else return; end if;\r
    for row in 1:patchWidth loop\r
      for column in 1:patchWidth loop\r
        slot := (row-1)*patchWidth+column;\r
        x := pixel[1]+column-4; y := pixel[2]+row-4;\r
        x0 := integer(floor(x)); y0 := integer(floor(y));\r
        fx := x-x0; fy := y-y0;\r
        if interpolationMethod == 0 then\r
          a := gray[y0+1,x0+1]; b := gray[y0+1,x0+2];\r
          c := gray[y0+2,x0+1]; d := gray[y0+2,x0+2];\r
          if not (a >= 0 and a <= 1 and b >= 0 and b <= 1\r
            and c >= 0 and c <= 1 and d >= 0 and d <= 1) then return; end if;\r
          samples[slot] := (1-fy)*((1-fx)*a+fx*b)+fy*((1-fx)*c+fx*d);\r
          gradient[slot,1] := (1-fy)*(b-a)+fy*(d-c);\r
          gradient[slot,2] := (1-fx)*(c-a)+fx*(d-b);\r
        else\r
          (weightsX,derivativeX) := CatmullRomWeights(fx);\r
          (weightsY,derivativeY) := CatmullRomWeights(fy);\r
          for v in 1:4 loop\r
            for u in 1:4 loop\r
              support[v,u] := gray[y0+v-1,x0+u-1];\r
              if not (support[v,u] >= 0 and support[v,u] <= 1) then return; end if;\r
            end for;\r
          end for;\r
          // Cubic overshoot is retained. The centered-energy admission below\r
          // bounds the normalized result without clipping interpolated samples.\r
          samples[slot] := weightsY*support*weightsX;\r
          gradient[slot,1] := weightsY*support*derivativeX;\r
          gradient[slot,2] := derivativeY*support*weightsX;\r
        end if;\r
      end for;\r
    end for;\r
    meanSample := sum(samples)/patchSize;\r
    centered := samples-fill(meanSample,patchSize); energy := centered*centered;\r
    if not (energy > 0 and energy >= patchSize*minimumContrast*minimumContrast and energy <= patchSize) then return; end if;\r
    denominator := sqrt(energy); descriptor := centered/denominator;\r
    for axis in 1:pixelDimension loop\r
      meanGradient[axis] := sum(gradient[:,axis])/patchSize;\r
      projection[axis] := centered*gradient[:,axis]/energy;\r
      jacobian[:,axis] := (gradient[:,axis]-fill(meanGradient[axis],patchSize)\r
        -centered*projection[axis])/denominator;\r
    end for;\r
    valid := true;\r
  end Sample;\r
\r
  function TrackDetailed\r
    input Real gray[:,:];\r
    input Real referenceDescriptor[patchSize];\r
    input Real seed[pixelDimension];\r
    input Boolean enabled = true;\r
    input Settings settings = Settings();\r
    output Boolean accepted;\r
    output Real pixel[pixelDimension];\r
    output Integer reason "0 accepted/disabled; 1 config; 2 reference; 3 sample/window; 4 aperture; 5 search; 6 descent/iterations; 7 SSD";\r
    output Integer iterations;\r
    output Real ssd;\r
    output Real minimumEigenvalue;\r
    output Diagnostics diagnostics;\r
  protected\r
    Real descriptor[patchSize]; Real jacobian[patchSize,pixelDimension]; Real energy;\r
    Real trialDescriptor[patchSize]; Real trialJacobian[patchSize,pixelDimension]; Real trialEnergy;\r
    Real residual[patchSize]; Real normal[pixelDimension,pixelDimension]; Real rhs[pixelDimension];\r
    Real step[pixelDimension]; Real trial[pixelDimension]; Real current[pixelDimension];\r
    Real determinant; Real traceValue; Real discriminant; Real maximumEigenvalue;\r
    Real normStep; Real scale; Real trialCost; Real referenceEnergy;\r
    Boolean valid; Boolean trialValid; Boolean moved; Boolean converged;\r
  algorithm\r
    accepted := false; pixel := zeros(pixelDimension); reason := 0;\r
    iterations := 0; ssd := 0; minimumEigenvalue := 0;\r
    diagnostics := Diagnostics();\r
    // Disabled padding is opaque, including seed/template poison.\r
    if not enabled then return; end if;\r
    reason := 1; diagnostics.stopDetail := 2;\r
    if not (settings.maximumIterations >= 1 and settings.maximumIterations <= 40\r
      and (settings.interpolationMethod == 0 or settings.interpolationMethod == 1)\r
      and settings.maximumBacktracks >= 1 and settings.maximumBacktracks <= 12\r
      and settings.searchRadius > 0 and settings.searchRadius <= 16\r
      and settings.maximumStep > 0 and settings.maximumStep <= settings.searchRadius\r
      and settings.convergenceTolerance > 0 and settings.convergenceTolerance <= settings.maximumStep\r
      and settings.minimumContrast >= 1e-12 and settings.minimumContrast <= 1\r
      and settings.minimumEigenvalue > 0 and settings.minimumEigenvalue <= 1\r
      and settings.minimumEigenvalueRatio > 0 and settings.minimumEigenvalueRatio <= 1\r
      and settings.maximumSsd > 0 and settings.maximumSsd <= 4) then return; end if;\r
    reason := 2; diagnostics.stopDetail := 3;\r
    for slot in 1:patchSize loop\r
      if not (referenceDescriptor[slot] >= -1 and referenceDescriptor[slot] <= 1) then return; end if;\r
    end for;\r
    referenceEnergy := referenceDescriptor*referenceDescriptor;\r
    if not (abs(referenceEnergy-1) <= 1e-8 and abs(sum(referenceDescriptor)) <= 1e-8) then return; end if;\r
    current := seed; converged := false;\r
    for iteration in 1:settings.maximumIterations loop\r
      iterations := iteration; reason := 3; diagnostics.stopDetail := 4;\r
      (valid,descriptor,jacobian,energy) := Sample(gray,current,settings.minimumContrast,settings.interpolationMethod);\r
      if not valid then return; end if;\r
      diagnostics.evaluated := true; diagnostics.lastEvaluatedPixel := current;\r
      diagnostics.lastEnergy := energy;\r
      residual := descriptor-referenceDescriptor; ssd := residual*residual;\r
      if iteration == 1 then diagnostics.initialSsd := ssd; end if;\r
      normal := transpose(jacobian)*jacobian; rhs := transpose(jacobian)*residual;\r
      diagnostics.lastGradient := rhs;\r
      traceValue := normal[1,1]+normal[2,2];\r
      discriminant := sqrt(max(0,(normal[1,1]-normal[2,2])^2+4*normal[1,2]^2));\r
      minimumEigenvalue := (traceValue-discriminant)/2;\r
      maximumEigenvalue := (traceValue+discriminant)/2; reason := 4;\r
      diagnostics.maximumEigenvalue := maximumEigenvalue; diagnostics.stopDetail := 5;\r
      if not (minimumEigenvalue >= settings.minimumEigenvalue\r
        and minimumEigenvalue >= settings.minimumEigenvalueRatio*maximumEigenvalue) then return; end if;\r
      determinant := normal[1,1]*normal[2,2]-normal[1,2]*normal[2,1];\r
      if not (determinant > 0) then return; end if;\r
      step := {normal[1,2]*rhs[2]-normal[2,2]*rhs[1],\r
        normal[2,1]*rhs[1]-normal[1,1]*rhs[2]}/determinant;\r
      normStep := sqrt(step*step);\r
      if not (normStep >= 0 and normStep <= 1e6) then reason := 6; diagnostics.stopDetail := 6; return; end if;\r
      diagnostics.stepValid := true; diagnostics.lastRawStep := step; diagnostics.lastRawStepNorm := normStep;\r
      if normStep <= settings.convergenceTolerance then converged := true; break; end if;\r
      if normStep > settings.maximumStep then step := step*(settings.maximumStep/normStep); end if;\r
      scale := 1; moved := false; reason := 6;\r
      for backtrack in 1:settings.maximumBacktracks loop\r
        trial := current+scale*step;\r
        diagnostics.lastBacktrack := backtrack; diagnostics.lastTrialScale := scale;\r
        diagnostics.lastTrialPixel := trial; diagnostics.lastTrialInSearch := false;\r
        diagnostics.lastTrialValid := false; diagnostics.lastTrialSsd := 0;\r
        if (trial-seed)*(trial-seed) <= settings.searchRadius*settings.searchRadius then\r
          diagnostics.lastTrialInSearch := true;\r
          (trialValid,trialDescriptor,trialJacobian,trialEnergy) := Sample(gray,trial,settings.minimumContrast,settings.interpolationMethod);\r
          if trialValid then\r
            residual := trialDescriptor-referenceDescriptor; trialCost := residual*residual;\r
            diagnostics.lastTrialValid := true; diagnostics.lastTrialSsd := trialCost;\r
            if trialCost < ssd then\r
              diagnostics.acceptedTrial := true; diagnostics.lastAcceptedTrialPixel := trial;\r
              current := trial; moved := true; break;\r
            end if;\r
            diagnostics.nonDecreaseRejects := diagnostics.nonDecreaseRejects+1;\r
          else\r
            diagnostics.sampleRejects := diagnostics.sampleRejects+1;\r
          end if;\r
        else\r
          diagnostics.windowRejects := diagnostics.windowRejects+1;\r
        end if;\r
        scale := scale/2;\r
      end for;\r
      if not moved then\r
        diagnostics.stopDetail := 7;\r
        if (current+step-seed)*(current+step-seed) > settings.searchRadius*settings.searchRadius then reason := 5; diagnostics.stopDetail := 8; end if;\r
        return;\r
      end if;\r
    end for;\r
    reason := 6; diagnostics.stopDetail := 9; if not converged then return; end if;\r
    reason := 7; diagnostics.stopDetail := 10; if not (ssd <= settings.maximumSsd) then return; end if;\r
    accepted := true; pixel := current; reason := 0;\r
    diagnostics.stopDetail := 1;\r
  end TrackDetailed;\r
\r
  function Track\r
    input Real gray[:,:];\r
    input Real referenceDescriptor[patchSize];\r
    input Real seed[pixelDimension];\r
    input Boolean enabled = true;\r
    input Settings settings = Settings();\r
    output Boolean accepted;\r
    output Real pixel[pixelDimension];\r
    output Integer reason "0 accepted/disabled; 1 config; 2 reference; 3 sample/window; 4 aperture; 5 search; 6 descent/iterations; 7 SSD";\r
    output Integer iterations;\r
    output Real ssd;\r
    output Real minimumEigenvalue;\r
  protected\r
    Diagnostics diagnostics;\r
  algorithm\r
    (accepted,pixel,reason,iterations,ssd,minimumEigenvalue,diagnostics)\r
      := TrackDetailed(gray,referenceDescriptor,seed,enabled,settings);\r
  end Track;\r
\r
  function CheckReverse\r
    input Real referenceGray[:,:]; input Real currentGray[:,:];\r
    input Real referencePixel[pixelDimension]; input Real trackedPixel[pixelDimension];\r
    input Boolean forwardAccepted;\r
    input Settings settings = Settings();\r
    input Real maximumCycleError = 0.25 "Pixels; independent of photometric and registration limits";\r
    output Boolean accepted;\r
    output Integer reason "0 accepted/disabled; 1 configuration; 2 current template; 3 reverse tracking; 4 cycle";\r
    output Real returnedPixel[pixelDimension]; output Real cycleError;\r
    output Boolean reverseAccepted; output Integer reverseReason; output Integer reverseIterations;\r
    output Real reverseSsd; output Real reverseEigenvalue;\r
    output Diagnostics reverseDiagnostics;\r
  protected\r
    Real descriptor[patchSize]; Real jacobian[patchSize,pixelDimension]; Real energy;\r
    Real difference[pixelDimension]; Boolean valid;\r
  algorithm\r
    accepted := false; reason := 0; returnedPixel := zeros(pixelDimension); cycleError := 0;\r
    reverseAccepted := false; reverseReason := 0; reverseIterations := 0;\r
    reverseSsd := 0; reverseEigenvalue := 0; reverseDiagnostics := Diagnostics();\r
    // Failed/disabled forward slots are opaque, including image and setting poison.\r
    if not forwardAccepted then return; end if;\r
    reason := 1;\r
    if not (size(referenceGray,1) == size(currentGray,1)\r
      and size(referenceGray,2) == size(currentGray,2)\r
      and maximumCycleError > 0 and maximumCycleError <= 16\r
      and referencePixel[1] >= 0 and referencePixel[1] < size(referenceGray,2)\r
      and referencePixel[2] >= 0 and referencePixel[2] < size(referenceGray,1)) then return; end if;\r
    reason := 2;\r
    (valid,descriptor,jacobian,energy) := Sample(currentGray,trackedPixel,\r
      settings.minimumContrast,settings.interpolationMethod);\r
    if not valid then return; end if;\r
    reason := 3;\r
    (reverseAccepted,returnedPixel,reverseReason,reverseIterations,reverseSsd,reverseEigenvalue,reverseDiagnostics)\r
      := TrackDetailed(referenceGray,descriptor,referencePixel,true,settings);\r
    if not reverseAccepted then return; end if;\r
    difference := returnedPixel-referencePixel; cycleError := sqrt(difference*difference);\r
    reason := 4;\r
    if not (cycleError <= maximumCycleError) then return; end if;\r
    accepted := true; reason := 0;\r
  end CheckReverse;\r
\r
  function TrackSet\r
    input Real gray[:,:]; input Real referenceDescriptor[:,patchSize];\r
    input Real seeds[size(referenceDescriptor,1),pixelDimension];\r
    input Boolean enabled[size(referenceDescriptor,1)];\r
    input Settings settings = Settings();\r
    output Boolean accepted[size(referenceDescriptor,1)];\r
    output Real pixels[size(referenceDescriptor,1),pixelDimension];\r
    output Integer reasons[size(referenceDescriptor,1)];\r
    output Integer iterations[size(referenceDescriptor,1)];\r
    output Real ssd[size(referenceDescriptor,1)];\r
    output Real minimumEigenvalue[size(referenceDescriptor,1)];\r
  protected\r
    Boolean slotAccepted; Real slotPixel[pixelDimension]; Integer slotReason;\r
    Integer slotIterations; Real slotSsd; Real slotEigenvalue;\r
  algorithm\r
    // Slot identity and sparse enabled mask are retained across the entire extent.\r
    for slot in 1:size(referenceDescriptor,1) loop\r
      (slotAccepted,slotPixel,slotReason,slotIterations,slotSsd,slotEigenvalue)\r
        := Track(gray,referenceDescriptor[slot,:],seeds[slot,:],enabled[slot],settings);\r
      accepted[slot] := slotAccepted; pixels[slot,:] := slotPixel; reasons[slot] := slotReason;\r
      iterations[slot] := slotIterations; ssd[slot] := slotSsd; minimumEigenvalue[slot] := slotEigenvalue;\r
    end for;\r
  end TrackSet;\r
end RGBDPatchTracking;\r
`;export{e as default};
