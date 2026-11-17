const e=`within Examples;\r
// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
model ResponsiveInertial "Short IMU filters: faster response, less noise rejection"\r
\r
  extends InertialOnly(\r
    accelTimeConstant=0.005,\r
    gyroTimeConstant=0.005);\r
\r
  annotation (experiment(StopTime=10, Interval=0.01, Tolerance=1e-8));\r
end ResponsiveInertial;\r
`;export{e as default};
