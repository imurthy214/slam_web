const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// One held-IMU substep for the existing ES15 filter convention.\r
// Rotation maps body FLU into the gravity-aligned map frame. Biases stay body-local.\r
// The caller subdivides a frame to h <= 20 ms and |omega|*h <= 0.1 rad.\r
// Pure Modelica mathematics; this component is not yet a production estimator.\r
model ES15NominalPrediction\r
  pure function Predict\r
    input Real rotation[3,3] = identity(3);\r
    input Real position[3] = {0.0,0.0,0.0};\r
    input Real velocity[3] = {0.0,0.0,0.0};\r
    input Real accel[3] = {0.0,0.0,9.81};\r
    input Real gyro[3] = {0.0,0.0,0.0};\r
    input Real accel_bias[3] = {0.0,0.0,0.0};\r
    input Real gyro_bias[3] = {0.0,0.0,0.0};\r
    input Real gravity[3] = {0.0,0.0,-9.81};\r
    input Real h = 1.0/90.0;\r
    output Real force[3]; output Real omega[3];\r
    output Real middle_rotation[3,3]; output Real next_rotation[3,3];\r
    output Real next_position[3]; output Real next_velocity[3];\r
    output Real valid;\r
  protected\r
    Real angle; Real a; Real b; Real middle_a; Real middle_b;\r
    Real W[3,3]; Real W2[3,3];\r
    Real increment[3,3]; Real middle_increment[3,3]; Real proposed_rotation[3,3];\r
    Real acceleration[3];\r
  algorithm\r
    force := accel-accel_bias;\r
    omega := gyro-gyro_bias;\r
    angle := sqrt(omega[1]^2+omega[2]^2+omega[3]^2)*h;\r
    valid := if noEvent(h > 0.0 and h <= 0.02 and angle <= 0.1) then 1.0 else 0.0;\r
    // Protected denominators also keep unselected small-angle branches finite.\r
    a := if noEvent(angle < 1e-7) then 1.0 else sin(angle)/max(angle,1e-7);\r
    b := if noEvent(angle < 1e-7) then 0.5 else (1.0-cos(angle))/max(angle^2,1e-14);\r
    middle_a := if noEvent(angle*0.5 < 1e-7) then 1.0 else sin(angle*0.5)/max(angle*0.5,1e-7);\r
    middle_b := if noEvent(angle*0.5 < 1e-7) then 0.5 else (1.0-cos(angle*0.5))/max(angle^2*0.25,1e-14);\r
    W := [0.0,-omega[3]*h,omega[2]*h;\r
         omega[3]*h,0.0,-omega[1]*h;\r
         -omega[2]*h,omega[1]*h,0.0];\r
    W2 := W*W;\r
    increment := identity(3)+a*W+b*W2;\r
    middle_increment := identity(3)+middle_a*0.5*W+middle_b*0.25*W2;\r
    middle_rotation := rotation*middle_increment;\r
    proposed_rotation := rotation*increment;\r
    acceleration := middle_rotation*force+gravity;\r
    for i in 1:3 loop\r
      next_position[i] := if noEvent(valid > 0.5) then position[i]+velocity[i]*h+0.5*acceleration[i]*h^2 else position[i];\r
      next_velocity[i] := if noEvent(valid > 0.5) then velocity[i]+acceleration[i]*h else velocity[i];\r
      for j in 1:3 loop\r
        next_rotation[i,j] := if noEvent(valid > 0.5) then proposed_rotation[i,j] else rotation[i,j];\r
      end for;\r
    end for;\r
  end Predict;\r
\r
  input Real rotation[3,3] = identity(3);\r
  input Real position[3] = {0.0,0.0,0.0};\r
  input Real velocity[3] = {0.0,0.0,0.0};\r
  input Real accel[3] = {0.0,0.0,9.81};\r
  input Real gyro[3] = {0.0,0.0,0.0};\r
  input Real accel_bias[3] = {0.0,0.0,0.0};\r
  input Real gyro_bias[3] = {0.0,0.0,0.0};\r
  input Real gravity[3] = {0.0,0.0,-9.81};\r
  input Real h = 1.0/90.0;\r
  output Real force[3]; output Real omega[3];\r
  output Real middle_rotation[3,3]; output Real next_rotation[3,3];\r
  output Real next_position[3]; output Real next_velocity[3];\r
  output Real valid;\r
algorithm\r
  (force,omega,middle_rotation,next_rotation,next_position,next_velocity,valid) :=\r
    Predict(rotation,position,velocity,accel,gyro,accel_bias,gyro_bias,gravity,h);\r
end ES15NominalPrediction;\r
`;export{e as default};
