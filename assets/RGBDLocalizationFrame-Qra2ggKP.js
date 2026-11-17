const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Source-owned transport from one accepted localization image to the catalog\r
// measurement API. This is not another visual update or an independence claim.\r
// Dependencies: RGBDKeyframes, RGBDRegistrationUncertainty, SLAMExactRealEqual.\r
package RGBDLocalizationFrame\r
\r
  // Current errors are five3-vectors: world dp,dv, right-local dtheta,dba,dbg.\r
  constant Integer currentDimension = 5*RGBDKeyframes.dimension;\r
  constant Integer poseIndices[RGBDKeyframes.poseDimension] = {1,2,3,7,8,9};\r
\r
  function Build\r
    input Integer generation "Checked outer catalog/reset generation";\r
    input Integer id "Checked catalog nextId proposal, never a ring slot";\r
    input Integer imageEpoch "Acquisition identity, independent of imageTime";\r
    input Real coreEpoch "Must exactly equal the Integer acquisition identity";\r
    input Real imageTime;\r
    input Real currentCount "Selected domain extent, not enabled or match count";\r
    input Real currentDescriptor[RGBDKeyframes.featureCapacity,RGBDKeyframes.descriptorSize];\r
    input Real currentPoint[RGBDKeyframes.featureCapacity,RGBDKeyframes.dimension];\r
    input Real currentEnabled[RGBDKeyframes.featureCapacity];\r
    input Real pixels[RGBDKeyframes.featureCapacity,2] "Zero-based RGB pixels";\r
    input Integer rgbSize[2] "Actual height,width";\r
    input Integer depthSize[2];\r
    input Real rgbCalibration[4];\r
    input Real depthCalibration[4];\r
    input Real opticalToBody[RGBDKeyframes.dimension,RGBDKeyframes.dimension];\r
    input Real cameraOriginBody[RGBDKeyframes.dimension];\r
    input Real disparityNoise;\r
    input Real noiseReferenceFx;\r
    input Real baseline;\r
    input Real bodyPosition[RGBDKeyframes.dimension];\r
    input Real bodyRotation[RGBDKeyframes.dimension,RGBDKeyframes.dimension];\r
    input Real currentCovariance[currentDimension,currentDimension]\r
      "Already accepted producer covariance: world dp,dv; right-local angle; body biases";\r
    input Integer vocabularyVersion;\r
    input Real poseAccepted;\r
    input Boolean requested;\r
    output RGBDKeyframes.Frame frame;\r
    output Boolean accepted;\r
    output Integer rejectionReason "0 accepted; 1 idle; 2 metadata; 3 domain/mask; 4 calibration; 5 pose; 6 pose covariance; 7 feature payload";\r
    input Integer filterSourceRevision = 0 "Estimator source revision this pose belongs to";\r
    input Integer filterCorrectionRevision = 0 "Accepted graph-to-filter commits before this pose";\r
  protected\r
    RGBDKeyframes.Frame candidate;\r
    Boolean valid;\r
    Boolean covarianceValid;\r
    Real inverseCovariance[RGBDKeyframes.poseDimension,RGBDKeyframes.poseDimension];\r
    Real scaledPivot;\r
    Real descriptorNorm;\r
    Real descriptorMean;\r
  algorithm\r
    frame := RGBDKeyframes.EmptyFrame();\r
    accepted := false;\r
    rejectionReason := 1;\r
    // The whole idle payload is opaque. No conversions or helper calls below\r
    // are demanded until requested and their preceding domains are certified.\r
    if requested then\r
      rejectionReason := 2;\r
      valid := generation >= 1 and generation <= RGBDKeyframes.identifierLimit\r
        and id >= 1 and id < RGBDKeyframes.identifierLimit\r
        and imageEpoch >= 0 and imageEpoch <= RGBDKeyframes.identifierLimit\r
        and SLAMExactRealEqual(coreEpoch,imageEpoch)\r
        and imageTime >= 0.0 and imageTime <= 1e9\r
        and vocabularyVersion >= 1 and vocabularyVersion <= RGBDKeyframes.identifierLimit;\r
      if valid then\r
        rejectionReason := 3;\r
        valid := currentCount >= 0.0 and currentCount <= RGBDKeyframes.featureCapacity\r
          and SLAMExactRealEqual(currentCount,floor(currentCount));\r
        if valid then\r
          // Mask validation never reads descriptor/point/pixel payload.\r
          for feature in 1:RGBDKeyframes.featureCapacity loop\r
            valid := valid and (SLAMExactRealEqual(currentEnabled[feature],0.0)\r
              or SLAMExactRealEqual(currentEnabled[feature],1.0));\r
            if SLAMExactRealEqual(currentEnabled[feature],1.0) then\r
              valid := valid and feature <= currentCount;\r
            end if;\r
          end for;\r
        end if;\r
        if valid then\r
          rejectionReason := 4;\r
          valid := RGBDKeyframes.ValidCalibration(rgbCalibration,rgbSize)\r
            and RGBDKeyframes.ValidCalibration(depthCalibration,depthSize)\r
            and disparityNoise > 0.0 and disparityNoise <= 1.0\r
            and noiseReferenceFx >= 1e-6 and noiseReferenceFx <= 1e6\r
            and baseline >= 1e-6 and baseline <= 1.0\r
            and RGBDUncertaintyProper(opticalToBody);\r
          for axis in 1:RGBDKeyframes.dimension loop\r
            valid := valid and abs(cameraOriginBody[axis]) <= 10.0;\r
          end for;\r
        end if;\r
        if valid then\r
          rejectionReason := 5;\r
          valid := SLAMExactRealEqual(poseAccepted,1.0)\r
            and RGBDUncertaintyProper(bodyRotation);\r
          for axis in 1:RGBDKeyframes.dimension loop\r
            valid := valid and abs(bodyPosition[axis]) <= 1e6;\r
          end for;\r
        end if;\r
        if valid then\r
          candidate := RGBDKeyframes.EmptyFrame();\r
          // Preserve the complete position/right-local-angle marginal, both\r
          // cross blocks included. This does not certify the full21-state prior.\r
          for row in 1:RGBDKeyframes.poseDimension loop\r
            for column in 1:RGBDKeyframes.poseDimension loop\r
              candidate.poseCovariance[row,column] :=\r
                currentCovariance[poseIndices[row],poseIndices[column]];\r
            end for;\r
          end for;\r
          rejectionReason := 6;\r
          (inverseCovariance,covarianceValid,scaledPivot) :=\r
            RGBDUncertaintyInverse6(candidate.poseCovariance,1e-10);\r
          valid := covarianceValid;\r
          if valid then\r
            rejectionReason := 7;\r
            for feature in 1:RGBDKeyframes.featureCapacity loop\r
              if SLAMExactRealEqual(currentEnabled[feature],1.0) then\r
                valid := valid and currentPoint[feature,3] > 0.0;\r
                for axis in 1:RGBDKeyframes.dimension loop\r
                  valid := valid and abs(currentPoint[feature,axis]) <= 1e6;\r
                end for;\r
                for coordinate in 1:2 loop\r
                  valid := valid and pixels[feature,coordinate] >= 0.0\r
                    and pixels[feature,coordinate] < rgbSize[3-coordinate]\r
                    and SLAMExactRealEqual(pixels[feature,coordinate],floor(pixels[feature,coordinate]));\r
                end for;\r
                descriptorNorm := 0.0;\r
                descriptorMean := 0.0;\r
                for sample in 1:RGBDKeyframes.descriptorSize loop\r
                  valid := valid and abs(currentDescriptor[feature,sample]) <= 1.000001;\r
                  descriptorNorm := descriptorNorm+currentDescriptor[feature,sample]^2;\r
                  descriptorMean := descriptorMean+currentDescriptor[feature,sample];\r
                end for;\r
                valid := valid and abs(descriptorNorm-1.0) <= 1e-6\r
                  and abs(descriptorMean) <= 1e-6;\r
              end if;\r
            end for;\r
            if valid then\r
              // Conversions follow complete domain validation. Disabled slots\r
              // retain canonical empty payload; even a poisoned slot is unread.\r
              candidate.generation := generation; candidate.id := id;\r
              candidate.epoch := imageEpoch; candidate.imageTime := imageTime;\r
              candidate.count := integer(currentCount);\r
              candidate.rgbSize := rgbSize; candidate.depthSize := depthSize;\r
              candidate.rgbCalibration := rgbCalibration;\r
              candidate.depthCalibration := depthCalibration;\r
              candidate.opticalToBody := opticalToBody;\r
              candidate.cameraOriginBody := cameraOriginBody;\r
              candidate.disparityNoise := disparityNoise;\r
              candidate.noiseReferenceFx := noiseReferenceFx; candidate.baseline := baseline;\r
              candidate.bodyPosition := bodyPosition; candidate.bodyRotation := bodyRotation;\r
              candidate.filterSourceRevision := filterSourceRevision;\r
              candidate.filterCorrectionRevision := filterCorrectionRevision;\r
              candidate.vocabularyVersion := vocabularyVersion;\r
              // Histogram stays canonical zero; PrepareCapture alone owns BoW.\r
              for feature in 1:RGBDKeyframes.featureCapacity loop\r
                if SLAMExactRealEqual(currentEnabled[feature],1.0) then\r
                  candidate.enabled[feature] := true;\r
                  candidate.descriptor[feature,:] := currentDescriptor[feature,:];\r
                  candidate.opticalPoint[feature,:] := currentPoint[feature,:];\r
                  for coordinate in 1:2 loop\r
                    candidate.pixels[feature,coordinate] := integer(pixels[feature,coordinate]);\r
                  end for;\r
                end if;\r
              end for;\r
              frame := candidate; accepted := true; rejectionReason := 0;\r
            end if;\r
          end if;\r
        end if;\r
      end if;\r
    end if;\r
  end Build;\r
end RGBDLocalizationFrame;\r
`;export{e as default};
