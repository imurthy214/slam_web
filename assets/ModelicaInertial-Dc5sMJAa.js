const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Nominal INS without visual corrections. Body FLU inputs; world ENU outputs.\r
// Quaternion [w,x,y,z] rotates body to world. Rumoca integrates held IMU samples.\r
model ModelicaInertial\r
  parameter Real gravity = 9.81;\r
  parameter Real accel_tau = 0.03;\r
  parameter Real gyro_tau = 0.02;\r
  parameter Real accel_bias[3] = {0.0,0.0,0.0};\r
  parameter Real gyro_bias[3] = {0.0,0.0,0.0};\r
  input Real accel[3] = {0.0,0.0,9.81};\r
  input Real gyro[3] = {0.0,0.0,0.0};\r
  output Real position[3];\r
  output Real velocity[3];\r
  output Real quaternion[4];\r
  output Real filteredAccel[3];\r
  output Real filteredGyro[3];\r
protected\r
  Real integratedPosition[3](start={0.0,0.0,0.0},each fixed=true);\r
  Real integratedVelocity[3](start={0.0,0.0,0.0},each fixed=true);\r
  Real q[4](start={1.0,0.0,0.0,0.0},each fixed=true);\r
  Real specificForce[3](start={0.0,0.0,9.81},each fixed=true);\r
  Real angularVelocity[3](start={0.0,0.0,0.0},each fixed=true);\r
  Real quaternionNorm;\r
  Real worldAccel[3];\r
equation\r
  der(specificForce) = (accel-accel_bias-specificForce)/accel_tau;\r
  der(angularVelocity) = (gyro-gyro_bias-angularVelocity)/gyro_tau;\r
  der(integratedPosition) = integratedVelocity;\r
  der(integratedVelocity) = worldAccel;\r
  position = integratedPosition;\r
  velocity = integratedVelocity;\r
  filteredAccel = specificForce;\r
  filteredGyro = angularVelocity;\r
\r
  der(q[1]) = -(q[2]*angularVelocity[1]+q[3]*angularVelocity[2]+q[4]*angularVelocity[3])/2;\r
  der(q[2]) = (q[1]*angularVelocity[1]+q[3]*angularVelocity[3]-q[4]*angularVelocity[2])/2;\r
  der(q[3]) = (q[1]*angularVelocity[2]-q[2]*angularVelocity[3]+q[4]*angularVelocity[1])/2;\r
  der(q[4]) = (q[1]*angularVelocity[3]+q[2]*angularVelocity[2]-q[3]*angularVelocity[1])/2;\r
  quaternionNorm = sqrt(q[1]^2+q[2]^2+q[3]^2+q[4]^2);\r
  quaternion = q/quaternionNorm;\r
\r
  worldAccel[1] = (1-2*(quaternion[3]^2+quaternion[4]^2))*specificForce[1]\r
    +2*(quaternion[2]*quaternion[3]-quaternion[1]*quaternion[4])*specificForce[2]\r
    +2*(quaternion[2]*quaternion[4]+quaternion[1]*quaternion[3])*specificForce[3];\r
  worldAccel[2] = 2*(quaternion[2]*quaternion[3]+quaternion[1]*quaternion[4])*specificForce[1]\r
    +(1-2*(quaternion[2]^2+quaternion[4]^2))*specificForce[2]\r
    +2*(quaternion[3]*quaternion[4]-quaternion[1]*quaternion[2])*specificForce[3];\r
  worldAccel[3] = 2*(quaternion[2]*quaternion[4]-quaternion[1]*quaternion[3])*specificForce[1]\r
    +2*(quaternion[3]*quaternion[4]+quaternion[1]*quaternion[2])*specificForce[2]\r
    +(1-2*(quaternion[2]^2+quaternion[3]^2))*specificForce[3]-gravity;\r
end ModelicaInertial;\r
`;export{e as default};
