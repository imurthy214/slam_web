const n=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Fresh state construction runs in the compiled Modelica program. Reload must\r
// restore the complete source-bound State, rather than invoking this reset.\r
model RGBDFastSLAMReset\r
\r
  constant Integer dimension = RGBDKeyframes.dimension;\r
  constant Integer currentDimension = RGBDLocalizationFrame.currentDimension;\r
  input Integer generation = 1;\r
  input Integer sourceRevision = 1;\r
  input Integer vocabularyVersion = 1;\r
  input Real worldFrame = 0;\r
  input Real position[dimension] = zeros(dimension);\r
  input Real velocity[dimension] = zeros(dimension);\r
  input Real rotation[dimension,dimension] = identity(dimension);\r
  input Real accelBias[dimension] = zeros(dimension);\r
  input Real gyroBias[dimension] = zeros(dimension);\r
  input Real covariance[currentDimension,currentDimension] = diagonal({0.25,0.25,0.25,\r
    0.04,0.04,0.04,0.01,0.01,0.01,0.0004,0.0004,0.0004,0.000025,0.000025,0.000025});\r
  output RGBDGraphProcessing.State next;\r
equation\r
  next = RGBDGraphProcessing.Empty(RGBDLocalizationCatalog.Empty(\r
    RGBDLocalizationCatalog.EmptyEstimator(position,velocity,rotation,accelBias,gyroBias,covariance),\r
    generation,sourceRevision,vocabularyVersion,worldFrame));\r
end RGBDFastSLAMReset;\r
`;export{n as default};
