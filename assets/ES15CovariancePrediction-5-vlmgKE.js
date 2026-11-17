const n=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// World-additive p/v, right-local theta, body ba/bg: ES15Dynamics convention.\r
// Caller owns dt admission. This function does not extend the supported interval.\r
function ES15TransitionNoise\r
  input Real F[15,15];\r
  input Real G[15,12];\r
  input Real dt;\r
  input Real density[12];\r
  output Real Phi[15,15];\r
  output Real Q[15,15];\r
protected\r
  constant Real fraction[3] = {0.5-sqrt(15.0)/10.0,0.5,0.5+sqrt(15.0)/10.0};\r
  constant Real weight[3] = {5.0/18.0,4.0/9.0,5.0/18.0};\r
  Real A[15,15]; Real A2[15,15]; Real A3[15,15];\r
  Real noiseTransition[3,15,15]; Real B[3,15,12];\r
  Real nodeNoise[3,15,15];\r
algorithm\r
  A := F*dt;\r
  A2 := A*A;\r
  A3 := A2*A;\r
  Phi := identity(15)+A+0.5*A2+A3/6.0;\r
  for node in 1:3 loop\r
    for i in 1:15 loop\r
      for j in 1:15 loop\r
        noiseTransition[node,i,j] := (if i == j then 1.0 else 0.0)\r
          +fraction[node]*A[i,j]+0.5*fraction[node]^2*A2[i,j]\r
          +fraction[node]^3*A3[i,j]/6.0;\r
      end for;\r
      for j in 1:12 loop\r
        B[node,i,j] := (noiseTransition[node,i,1]*G[1,j]+noiseTransition[node,i,2]*G[2,j]+noiseTransition[node,i,3]*G[3,j]+noiseTransition[node,i,4]*G[4,j]+noiseTransition[node,i,5]*G[5,j]+noiseTransition[node,i,6]*G[6,j]+noiseTransition[node,i,7]*G[7,j]+noiseTransition[node,i,8]*G[8,j]+noiseTransition[node,i,9]*G[9,j]+noiseTransition[node,i,10]*G[10,j]+noiseTransition[node,i,11]*G[11,j]+noiseTransition[node,i,12]*G[12,j]+noiseTransition[node,i,13]*G[13,j]+noiseTransition[node,i,14]*G[14,j]+noiseTransition[node,i,15]*G[15,j])*density[j];\r
      end for;\r
    end for;\r
    // Complete every B row before the Gram matrix reads B[node,j,:].\r
    for i in 1:15 loop\r
      for j in 1:15 loop\r
        nodeNoise[node,i,j] := (B[node,i,1]*B[node,j,1]+B[node,i,2]*B[node,j,2]+B[node,i,3]*B[node,j,3]+B[node,i,4]*B[node,j,4]+B[node,i,5]*B[node,j,5]+B[node,i,6]*B[node,j,6]+B[node,i,7]*B[node,j,7]+B[node,i,8]*B[node,j,8]+B[node,i,9]*B[node,j,9]+B[node,i,10]*B[node,j,10]+B[node,i,11]*B[node,j,11]+B[node,i,12]*B[node,j,12]);\r
      end for;\r
    end for;\r
  end for;\r
  for i in 1:15 loop\r
    for j in 1:15 loop\r
      Q[i,j] := dt*(weight[1]*nodeNoise[1,i,j]+weight[2]*nodeNoise[2,i,j]+weight[3]*nodeNoise[3,i,j]);\r
    end for;\r
  end for;\r
end ES15TransitionNoise;\r
\r
// Convenience propagation for callers that need only the current-state block.\r
// Joint-state callers use ES15TransitionNoise and propagate covariance once.\r
function ES15CovarianceStep\r
\r
  input Real F[15,15];\r
  input Real G[15,12];\r
  input Real P[15,15];\r
  input Real dt;\r
  input Real density[12];\r
  output Real Phi[15,15];\r
  output Real Q[15,15];\r
  output Real predicted[15,15];\r
protected\r
  Real propagated[15,15]; Real raw[15,15];\r
algorithm\r
  (Phi,Q) := ES15TransitionNoise(F,G,dt,density);\r
  propagated := Phi*P*transpose(Phi);\r
  raw := propagated+Q;\r
  predicted := 0.5*(raw+transpose(raw));\r
end ES15CovarianceStep;\r
\r
// Equation adapter preserving the existing model interface and input defaults.\r
model ES15CovariancePrediction\r
\r
  input Real F[15,15] = fill(0.0,15,15);\r
  input Real G[15,12] = fill(0.0,15,12);\r
  input Real P[15,15] = identity(15);\r
  input Real dt = 1.0/90.0;\r
  input Real density[12] = {0.06,0.06,0.06,0.006,0.006,0.006,\r
                           0.002,0.002,0.002,0.0002,0.0002,0.0002};\r
  output Real Phi[15,15];\r
  output Real Q[15,15];\r
  output Real predicted[15,15];\r
equation\r
  (Phi,Q,predicted) = ES15CovarianceStep(F,G,P,dt,density);\r
end ES15CovariancePrediction;\r
`;export{n as default};
