const n=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Shared Cholesky factorization of a 6×6 geometric innovation covariance.\r
// Sixteen RHS carry cross-covariance transpose plus innovation; inputs are finite.\r
// valid=0 rejects nonsymmetric/nonpositive covariance and returns zero solutions.\r
// Invalid diagonal factors use a unit value to keep following arithmetic bounded.\r
// Fixed six-row formulas avoid a dependent reduction-domain compiler limitation.\r
// Regenerate with scripts/generate-spd6-model.mjs; students can edit this source.\r
model SPD6Solve\r
  parameter Real pivot_floor = 1e-12;\r
  parameter Real symmetry_absolute = 1e-12;\r
  parameter Real symmetry_relative = 1e-8;\r
  input Real A[6,6] = identity(6);\r
  input Real B[6,16] = fill(0.0,6,16);\r
  output Real X[6,16];\r
  output Real valid;\r
protected\r
  Real L[6,6]; Real pivot[6]; Real Z[6,16]; Real solution[6,16];\r
  Real symmetryChecks[6,6]; Real symmetry_errors;\r
equation\r
  for i in 1:6 loop\r
    for j in 1:6 loop\r
      symmetryChecks[i,j] = if noEvent(abs(A[i,j]-A[j,i]) <=\r
        symmetry_absolute+symmetry_relative*abs(A[j,i])) then 0.0 else 1.0;\r
    end for;\r
  end for;\r
  symmetry_errors = sum(symmetryChecks[i,j] for i in 1:6, j in 1:6);\r
  pivot[1] = A[1,1]-(0.0);\r
  L[1,1] = sqrt(if noEvent(pivot[1] > pivot_floor) then pivot[1] else 1.0);\r
  L[1,2] = 0.0;\r
  L[1,3] = 0.0;\r
  L[1,4] = 0.0;\r
  L[1,5] = 0.0;\r
  L[1,6] = 0.0;\r
  L[2,1] = (A[2,1]-(0.0))/L[1,1];\r
  pivot[2] = A[2,2]-(L[2,1]*L[2,1]);\r
  L[2,2] = sqrt(if noEvent(pivot[2] > pivot_floor) then pivot[2] else 1.0);\r
  L[2,3] = 0.0;\r
  L[2,4] = 0.0;\r
  L[2,5] = 0.0;\r
  L[2,6] = 0.0;\r
  L[3,1] = (A[3,1]-(0.0))/L[1,1];\r
  L[3,2] = (A[3,2]-(L[3,1]*L[2,1]))/L[2,2];\r
  pivot[3] = A[3,3]-(L[3,1]*L[3,1]+L[3,2]*L[3,2]);\r
  L[3,3] = sqrt(if noEvent(pivot[3] > pivot_floor) then pivot[3] else 1.0);\r
  L[3,4] = 0.0;\r
  L[3,5] = 0.0;\r
  L[3,6] = 0.0;\r
  L[4,1] = (A[4,1]-(0.0))/L[1,1];\r
  L[4,2] = (A[4,2]-(L[4,1]*L[2,1]))/L[2,2];\r
  L[4,3] = (A[4,3]-(L[4,1]*L[3,1]+L[4,2]*L[3,2]))/L[3,3];\r
  pivot[4] = A[4,4]-(L[4,1]*L[4,1]+L[4,2]*L[4,2]+L[4,3]*L[4,3]);\r
  L[4,4] = sqrt(if noEvent(pivot[4] > pivot_floor) then pivot[4] else 1.0);\r
  L[4,5] = 0.0;\r
  L[4,6] = 0.0;\r
  L[5,1] = (A[5,1]-(0.0))/L[1,1];\r
  L[5,2] = (A[5,2]-(L[5,1]*L[2,1]))/L[2,2];\r
  L[5,3] = (A[5,3]-(L[5,1]*L[3,1]+L[5,2]*L[3,2]))/L[3,3];\r
  L[5,4] = (A[5,4]-(L[5,1]*L[4,1]+L[5,2]*L[4,2]+L[5,3]*L[4,3]))/L[4,4];\r
  pivot[5] = A[5,5]-(L[5,1]*L[5,1]+L[5,2]*L[5,2]+L[5,3]*L[5,3]+L[5,4]*L[5,4]);\r
  L[5,5] = sqrt(if noEvent(pivot[5] > pivot_floor) then pivot[5] else 1.0);\r
  L[5,6] = 0.0;\r
  L[6,1] = (A[6,1]-(0.0))/L[1,1];\r
  L[6,2] = (A[6,2]-(L[6,1]*L[2,1]))/L[2,2];\r
  L[6,3] = (A[6,3]-(L[6,1]*L[3,1]+L[6,2]*L[3,2]))/L[3,3];\r
  L[6,4] = (A[6,4]-(L[6,1]*L[4,1]+L[6,2]*L[4,2]+L[6,3]*L[4,3]))/L[4,4];\r
  L[6,5] = (A[6,5]-(L[6,1]*L[5,1]+L[6,2]*L[5,2]+L[6,3]*L[5,3]+L[6,4]*L[5,4]))/L[5,5];\r
  pivot[6] = A[6,6]-(L[6,1]*L[6,1]+L[6,2]*L[6,2]+L[6,3]*L[6,3]+L[6,4]*L[6,4]+L[6,5]*L[6,5]);\r
  L[6,6] = sqrt(if noEvent(pivot[6] > pivot_floor) then pivot[6] else 1.0);\r
  valid = if noEvent(symmetry_errors < 0.5 and\r
    pivot[1] > pivot_floor and pivot[2] > pivot_floor and pivot[3] > pivot_floor and pivot[4] > pivot_floor and pivot[5] > pivot_floor and pivot[6] > pivot_floor) then 1.0 else 0.0;\r
  for column in 1:16 loop\r
    Z[1,column] = (B[1,column]-(0.0))/L[1,1];\r
    Z[2,column] = (B[2,column]-(L[2,1]*Z[1,column]))/L[2,2];\r
    Z[3,column] = (B[3,column]-(L[3,1]*Z[1,column]+L[3,2]*Z[2,column]))/L[3,3];\r
    Z[4,column] = (B[4,column]-(L[4,1]*Z[1,column]+L[4,2]*Z[2,column]+L[4,3]*Z[3,column]))/L[4,4];\r
    Z[5,column] = (B[5,column]-(L[5,1]*Z[1,column]+L[5,2]*Z[2,column]+L[5,3]*Z[3,column]+L[5,4]*Z[4,column]))/L[5,5];\r
    Z[6,column] = (B[6,column]-(L[6,1]*Z[1,column]+L[6,2]*Z[2,column]+L[6,3]*Z[3,column]+L[6,4]*Z[4,column]+L[6,5]*Z[5,column]))/L[6,6];\r
    solution[6,column] = (Z[6,column]-(0.0))/L[6,6];\r
    solution[5,column] = (Z[5,column]-(L[6,5]*solution[6,column]))/L[5,5];\r
    solution[4,column] = (Z[4,column]-(L[5,4]*solution[5,column]+L[6,4]*solution[6,column]))/L[4,4];\r
    solution[3,column] = (Z[3,column]-(L[4,3]*solution[4,column]+L[5,3]*solution[5,column]+L[6,3]*solution[6,column]))/L[3,3];\r
    solution[2,column] = (Z[2,column]-(L[3,2]*solution[3,column]+L[4,2]*solution[4,column]+L[5,2]*solution[5,column]+L[6,2]*solution[6,column]))/L[2,2];\r
    solution[1,column] = (Z[1,column]-(L[2,1]*solution[2,column]+L[3,1]*solution[3,column]+L[4,1]*solution[4,column]+L[5,1]*solution[5,column]+L[6,1]*solution[6,column]))/L[1,1];\r
    for i in 1:6 loop\r
      X[i,column] = if noEvent(valid > 0.5) then solution[i,column] else 0.0;\r
    end for;\r
  end for;\r
end SPD6Solve;\r
`;export{n as default};
