const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Selection only: every camera observation still passes the processing barrier.\r
// The estimated pose determines motion; sensor identity never comes from time.\r
package RGBDKeyframePolicy\r
\r
  constant Real pi = 3.141592653589793;\r
  record Decision\r
    Boolean valid;\r
    Boolean captureRequested;\r
    Integer reason "0 capture; 1 idle; 2 configuration; 3 binding/geometry; 4 pose; 5 features; 6 cadence; 7 motion; 8 consumed image";\r
    Integer enabledCount;\r
    Real elapsed;\r
    Real translationSquared;\r
    Real rotationCosine;\r
  end Decision;\r
\r
  function Select\r
    input RGBDKeyframes.Catalog catalog;\r
    input RGBDKeyframes.Frame measurement;\r
    input Boolean imageFresh "Fresh catalog acquisition receipt; separate from Schmidt independent-noise eligibility";\r
    input Real poseAccepted;\r
    input Boolean requested;\r
    input Real minimumInterval = 0.5;\r
    input Real maximumInterval = 2.0;\r
    input Real translationThreshold = 0.6;\r
    input Real rotationThreshold = 0.25 "Radians";\r
    input Integer minimumFeatures = 12;\r
    input Real coordinateLimit = 1e6;\r
    output Decision result;\r
  protected\r
    Boolean valid;\r
    Integer latestSlot;\r
    Real difference[RGBDKeyframes.dimension];\r
    Real relativeRotation[RGBDKeyframes.dimension,RGBDKeyframes.dimension];\r
  algorithm\r
    result.valid := false; result.captureRequested := false; result.reason := 1;\r
    result.enabledCount := 0; result.elapsed := 0.0;\r
    result.translationSquared := 0.0; result.rotationCosine := 1.0;\r
    if requested then\r
      result.reason := 2;\r
      valid := minimumInterval > 0 and minimumInterval <= 1e4\r
        and maximumInterval >= minimumInterval and maximumInterval <= 1e4\r
        and translationThreshold >= 0 and translationThreshold <= 1e4\r
        and rotationThreshold >= 0 and rotationThreshold <= pi\r
        and minimumFeatures >= 8 and minimumFeatures <= RGBDKeyframes.featureCapacity\r
        and coordinateLimit > 0 and coordinateLimit <= 1e6;\r
      if valid then\r
        result.reason := 3;\r
        valid := RGBDKeyframes.ValidHeader(catalog)\r
          and catalog.nextId < RGBDKeyframes.identifierLimit\r
          and measurement.generation == catalog.generation\r
          and measurement.vocabularyVersion == catalog.vocabularyVersion\r
          and measurement.id == catalog.nextId\r
          and measurement.epoch > catalog.lastEpoch and measurement.epoch <= RGBDKeyframes.identifierLimit\r
          and measurement.imageTime >= 0 and measurement.imageTime <= 1e9\r
          and (catalog.nextId == 1 or measurement.imageTime > catalog.lastTime)\r
          and measurement.count >= 0 and measurement.count <= RGBDKeyframes.featureCapacity\r
          and RGBDMapAnchors.ProperRotation(measurement.bodyRotation);\r
        for axis in 1:RGBDKeyframes.dimension loop\r
          valid := valid and abs(measurement.bodyPosition[axis]) <= coordinateLimit;\r
        end for;\r
        if valid then\r
          for feature in 1:RGBDKeyframes.featureCapacity loop\r
            if measurement.enabled[feature] then\r
              result.enabledCount := result.enabledCount+1;\r
              valid := valid and feature <= measurement.count and measurement.opticalPoint[feature,3] > 0;\r
              for axis in 1:RGBDKeyframes.dimension loop\r
                valid := valid and abs(measurement.opticalPoint[feature,axis]) <= coordinateLimit;\r
              end for;\r
            end if;\r
          end for;\r
          if catalog.nextId > 1 then\r
            latestSlot := max(1,RGBDKeyframes.NewestSlot(catalog));\r
            valid := valid and RGBDMapAnchors.ProperRotation(catalog.bodyRotations[latestSlot,:,:]);\r
            for axis in 1:RGBDKeyframes.dimension loop\r
              valid := valid and abs(catalog.bodyPositions[latestSlot,axis]) <= coordinateLimit;\r
            end for;\r
            if valid then\r
              difference := measurement.bodyPosition-catalog.bodyPositions[latestSlot,:];\r
              result.translationSquared := difference*difference;\r
              relativeRotation := transpose(catalog.bodyRotations[latestSlot,:,:])*measurement.bodyRotation;\r
              result.rotationCosine := max(-1.0,min(1.0,\r
                (sum(relativeRotation[axis,axis] for axis in 1:RGBDKeyframes.dimension)-1.0)/2.0));\r
              result.elapsed := measurement.imageTime-catalog.lastTime;\r
            end if;\r
          end if;\r
          result.valid := valid;\r
          if valid then\r
            if not imageFresh then\r
              result.reason := 8;\r
            elseif poseAccepted <> 1.0 then\r
              result.reason := 4;\r
            elseif result.enabledCount < minimumFeatures then\r
              result.reason := 5;\r
            elseif catalog.nextId == 1 then\r
              result.captureRequested := true; result.reason := 0;\r
            elseif result.elapsed < minimumInterval then\r
              result.reason := 6;\r
            elseif result.elapsed >= maximumInterval\r
                or result.translationSquared >= translationThreshold*translationThreshold\r
                or result.rotationCosine <= cos(rotationThreshold) then\r
              result.captureRequested := true; result.reason := 0;\r
            else\r
              result.reason := 7;\r
            end if;\r
          end if;\r
        end if;\r
      end if;\r
    end if;\r
  end Select;\r
end RGBDKeyframePolicy;\r
`;export{e as default};
