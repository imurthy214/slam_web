const e=`within Examples;\r
// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
model InertialOnly "Inertial navigation with filtered airframe IMU measurements"\r
\r
  parameter Real accelTimeConstant(unit="s", min=1e-6) = 0.03\r
    "Accelerometer filter time constant";\r
  parameter Real gyroTimeConstant(unit="s", min=1e-6) = 0.02\r
    "Gyroscope filter time constant";\r
\r
  input Real accel[3](each unit="m/s2", start={0, 0, 9.81})\r
    "Specific force in body FLU coordinates";\r
  input Real gyro[3](each unit="rad/s", each start=0)\r
    "Angular velocity in body FLU coordinates";\r
\r
  output Real position[3](each unit="m") "Position in world ENU coordinates";\r
  output Real velocity[3](each unit="m/s") "Velocity in world ENU coordinates";\r
  output Real quaternion[4] "Unit quaternion {w,x,y,z}, body to world";\r
  output Real filteredAccel[3](each unit="m/s2") "Filtered specific force";\r
  output Real filteredGyro[3](each unit="rad/s") "Filtered angular velocity";\r
\r
  ModelicaInertial estimator(\r
    accel_tau=accelTimeConstant,\r
    gyro_tau=gyroTimeConstant,\r
    accel=accel,\r
    gyro=gyro);\r
equation\r
  position = estimator.position;\r
  velocity = estimator.velocity;\r
  quaternion = estimator.quaternion;\r
  filteredAccel = estimator.filteredAccel;\r
  filteredGyro = estimator.filteredGyro;\r
\r
  annotation (experiment(StopTime=10, Interval=0.01, Tolerance=1e-8));\r
end InertialOnly;\r
`;export{e as default};
