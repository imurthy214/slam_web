const r=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Continuous error dynamics for the RGB-D / airframe IMU teaching filter.\r
// Error order: world dp, world dv, right-local dtheta, body dba, body dbg.\r
// R_true = R * Exp(dtheta); measurements are true body values + bias + noise.\r
// Noise order: acceleration white, gyro white, acceleration bias walk,\r
// gyro bias walk. These conventions differ from a right SE_2(3) filter.\r
// A host retains the filter state; all F/G mathematics below is Modelica.\r
model ES15Dynamics\r
  pure function Matrices\r
    input Real rotation[3,3] = identity(3);\r
    input Real force[3] = {0.0,0.0,9.81};\r
    input Real omega[3] = {0.0,0.0,0.0};\r
    output Real F[15,15];\r
    output Real G[15,12];\r
  protected\r
    Real forceSkew[3,3];\r
    Real omegaSkew[3,3];\r
  algorithm\r
    forceSkew := [0.0,-force[3],force[2];\r
                  force[3],0.0,-force[1];\r
                  -force[2],force[1],0.0];\r
    omegaSkew := [0.0,-omega[3],omega[2];\r
                  omega[3],0.0,-omega[1];\r
                  -omega[2],omega[1],0.0];\r
    F := fill(0.0,15,15);\r
    G := fill(0.0,15,12);\r
    F[1:3,4:6] := identity(3);\r
    // Keep the original three-term contraction order.\r
    for i in 1:3 loop\r
      for j in 1:3 loop\r
        F[i+3,j+6] := -(rotation[i,1]*forceSkew[1,j]\r
                         +rotation[i,2]*forceSkew[2,j]\r
                         +rotation[i,3]*forceSkew[3,j]);\r
      end for;\r
    end for;\r
    F[4:6,10:12] := -rotation;\r
    F[7:9,7:9] := -omegaSkew;\r
    F[7:9,13:15] := -identity(3);\r
    G[4:6,1:3] := -rotation;\r
    G[7:9,4:6] := -identity(3);\r
    G[10:12,7:9] := identity(3);\r
    G[13:15,10:12] := identity(3);\r
  end Matrices;\r
\r
  input Real rotation[3,3] = identity(3);\r
  input Real force[3] = {0.0,0.0,9.81};\r
  input Real omega[3] = {0.0,0.0,0.0};\r
  output Real F[15,15];\r
  output Real G[15,12];\r
algorithm\r
  (F,G) := Matrices(rotation,force,omega);\r
end ES15Dynamics;\r
`;export{r as default};
