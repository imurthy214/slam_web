const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// One complete ES15 pose-observation correction, matching ErrorStateFilter.correct_pose.\r
// World-additive p/v, right-local theta, body accel/gyro biases; Hamilton wxyz output.\r
// Compile this source together with SPD6Solve.mo for ES15CorrectionSolve below.\r
// Same-frame Modelica composition (no host numerical solve):\r
// 1. ES15CorrectionSolve(A=observation_covariance,B=zeros) supplies its valid flag.\r
// 2. Evaluate this component's innovation_covariance/solve_rhs from the prior state.\r
// 3. ES15CorrectionSolve(A=innovation_covariance,B=solve_rhs) supplies solved/solve_valid.\r
// 4. Reevaluate this component with those results; commit only its final next outputs.\r
// The preview uses solve_valid=0; never feed its diagnostics back as another observation.\r
// The caller supplies a finite valid nominal state and symmetric positive-definite P.\r
// Covariance inputs have no replacement/default covariance. Feed every entry per frame.\r
// WASM's finite-value input boundary rejects NaN/Infinity before this numerical component.\r
// Outputs are a proposed next frame: rejection preserves every nominal/P entry.\r
model ES15PoseCorrection\r
  input Real rotation[3,3] = identity(3);\r
  input Real position[3] = {0.0,0.0,0.0};\r
  input Real velocity[3] = {0.0,0.0,0.0};\r
  input Real accel_bias[3] = {0.0,0.0,0.0};\r
  input Real gyro_bias[3] = {0.0,0.0,0.0};\r
  input Real covariance[15,15];\r
  input Real observed_rotation[3,3] = identity(3);\r
  input Real observed_position[3] = {0.0,0.0,0.0};\r
  input Real observation_covariance[6,6];\r
  input Real solved[6,16];\r
  input Real solve_valid = 0.0;\r
  input Real observation_covariance_valid = 0.0;\r
  input Real accepted_count = 0.0;\r
  input Real rejected_count = 0.0;\r
  input Real last_nis = 0.0;\r
  output Real accepted;\r
  output Real next_accepted_count; output Real next_rejected_count; output Real next_last_nis;\r
  output Real next_position[3]; output Real next_velocity[3];\r
  output Real next_accel_bias[3]; output Real next_gyro_bias[3];\r
  output Real next_rotation[3,3]; output Real next_quaternion[4];\r
  output Real next_covariance[15,15];\r
  output Real H[6,15]; output Real cross_covariance[15,6];\r
  output Real innovation_covariance[6,6]; output Real solve_rhs[6,16];\r
  output Real innovation[6]; output Real gain[15,6]; output Real correction[15];\r
  output Real joseph_covariance[15,15];\r
protected\r
  Real gram[3,3]; Real rotation_checks[3,3]; Real determinant;\r
  Real admissible; Real raw_nis; Real correction_checks[15];\r
  Real relative[3,3]; Real angle; Real antisymmetric[3]; Real log_scale;\r
  Real relative_raw_q[4]; Real relative_q[4]; Real relative_q_norm;\r
  Real relative_q_sine; Real relative_q_scale;\r
  Real qr; Real qx; Real qy; Real qz;\r
  Real delta_angle; Real a; Real b; Real W[3,3]; Real increment[3,3];\r
  Real proposed_rotation[3,3]; Real proposed_accel_bias[3]; Real proposed_gyro_bias[3];\r
  Real residual_map[15,15]; Real left[15,15]; Real noise_left[15,6];\r
  Real reset_a; Real reset_b; Real reset_jacobian[3,3];\r
  Real reset_left[15,15]; Real reset_proposed[15,15];\r
  Real output_raw_q[4]; Real output_q_norm; Real ow; Real ox; Real oy; Real oz;\r
equation\r
  gram = transpose(observed_rotation)*observed_rotation;\r
  determinant = observed_rotation[1,1]*(observed_rotation[2,2]*observed_rotation[3,3]-observed_rotation[2,3]*observed_rotation[3,2])\r
              - observed_rotation[1,2]*(observed_rotation[2,1]*observed_rotation[3,3]-observed_rotation[2,3]*observed_rotation[3,1])\r
              + observed_rotation[1,3]*(observed_rotation[2,1]*observed_rotation[3,2]-observed_rotation[2,2]*observed_rotation[3,1]);\r
  for i in 1:3 loop\r
    for j in 1:3 loop\r
      rotation_checks[i,j] = if noEvent(abs(gram[i,j]-(if i == j then 1.0 else 0.0)) <= 1e-6) then 0.0 else 1.0;\r
    end for;\r
  end for;\r
  admissible = if noEvent(sum(rotation_checks[i,j] for i in 1:3, j in 1:3) < 0.5 and abs(determinant-1.0) <= 1e-6 and observation_covariance_valid > 0.5) then 1.0 else 0.0;\r
  relative = transpose(rotation)*observed_rotation;\r
  angle = acos(min(1.0,max(-1.0,(relative[1,1]+relative[2,2]+relative[3,3]-1.0)/2.0)));\r
  antisymmetric = {relative[3,2]-relative[2,3],relative[1,3]-relative[3,1],relative[2,1]-relative[1,2]};\r
  // Stable dominant-component Hamilton quaternion, including the pi branch.\r
  qr = 2.0*sqrt(max(0.0,1.0+relative[1,1]+relative[2,2]+relative[3,3]));\r
  qx = 2.0*sqrt(max(0.0,1.0+relative[1,1]-relative[2,2]-relative[3,3]));\r
  qy = 2.0*sqrt(max(0.0,1.0-relative[1,1]+relative[2,2]-relative[3,3]));\r
  qz = 2.0*sqrt(max(0.0,1.0-relative[1,1]-relative[2,2]+relative[3,3]));\r
  relative_raw_q = if noEvent(relative[1,1]+relative[2,2]+relative[3,3] > 0.0) then\r
      {qr/4.0,antisymmetric[1]/max(qr,1e-12),antisymmetric[2]/max(qr,1e-12),antisymmetric[3]/max(qr,1e-12)}\r
    elseif noEvent(relative[1,1] > relative[2,2] and relative[1,1] > relative[3,3]) then\r
      {antisymmetric[1]/max(qx,1e-12),qx/4.0,(relative[1,2]+relative[2,1])/max(qx,1e-12),(relative[1,3]+relative[3,1])/max(qx,1e-12)}\r
    elseif noEvent(relative[2,2] > relative[3,3]) then\r
      {antisymmetric[2]/max(qy,1e-12),(relative[1,2]+relative[2,1])/max(qy,1e-12),qy/4.0,(relative[2,3]+relative[3,2])/max(qy,1e-12)}\r
    else {antisymmetric[3]/max(qz,1e-12),(relative[1,3]+relative[3,1])/max(qz,1e-12),(relative[2,3]+relative[3,2])/max(qz,1e-12),qz/4.0};\r
  relative_q_norm = sqrt(sum(relative_raw_q[k]^2 for k in 1:4));\r
  relative_q = (if noEvent(relative_raw_q[1] < 0.0) then -1.0 else 1.0)*relative_raw_q/max(relative_q_norm,1e-12);\r
  relative_q_sine = sqrt(relative_q[2]^2+relative_q[3]^2+relative_q[4]^2);\r
  relative_q_scale = 2.0*atan2(relative_q_sine,relative_q[1])/max(relative_q_sine,1e-12);\r
  log_scale = if noEvent(angle < 1e-7) then 0.5 else angle/(2.0*max(sin(angle),1e-12));\r
  for i in 1:3 loop\r
    innovation[i] = observed_position[i]-position[i];\r
    innovation[i+3] = if noEvent(angle < 3.141592653589793-1e-5) then log_scale*antisymmetric[i] else relative_q_scale*relative_q[i+1];\r
  end for;\r
  for i in 1:6 loop\r
    for j in 1:15 loop\r
      H[i,j] = if i <= 3 and j == i or i > 3 and j == i+3 then 1.0 else 0.0;\r
      solve_rhs[i,j] = cross_covariance[j,i];\r
    end for;\r
    solve_rhs[i,16] = innovation[i];\r
  end for;\r
  cross_covariance = covariance*transpose(H);\r
  innovation_covariance = H*cross_covariance+observation_covariance;\r
  for i in 1:15 loop\r
    for j in 1:6 loop\r
      gain[i,j] = solved[j,i];\r
    end for;\r
    correction[i] = sum(gain[i,j]*innovation[j] for j in 1:6);\r
    correction_checks[i] = if noEvent(abs(correction[i]) <= 1.7976931348623157e308) then 0.0 else 1.0;\r
  end for;\r
  raw_nis = sum(innovation[i]*solved[i,16] for i in 1:6);\r
  next_last_nis = if noEvent(admissible > 0.5) then (if noEvent(abs(raw_nis) <= 1.7976931348623157e308) then raw_nis else 0.0) else last_nis;\r
  proposed_accel_bias = accel_bias+{correction[10],correction[11],correction[12]};\r
  proposed_gyro_bias = gyro_bias+{correction[13],correction[14],correction[15]};\r
  accepted = if noEvent(admissible > 0.5 and solve_valid > 0.5 and raw_nis >= 0.0 and raw_nis <= 22.46 and\r
    innovation[4]^2+innovation[5]^2+innovation[6]^2 <= 0.35^2 and sum(correction_checks[i] for i in 1:15) < 0.5 and\r
    sum(proposed_accel_bias[i]^2 for i in 1:3) <= 2.0^2 and sum(proposed_gyro_bias[i]^2 for i in 1:3) <= 0.3^2) then 1.0 else 0.0;\r
  next_accepted_count = accepted_count+accepted;\r
  next_rejected_count = rejected_count+1.0-accepted;\r
  residual_map = identity(15)-gain*H;\r
  left = residual_map*covariance;\r
  noise_left = gain*observation_covariance;\r
  joseph_covariance = left*transpose(residual_map)+noise_left*transpose(gain);\r
  delta_angle = sqrt(correction[7]^2+correction[8]^2+correction[9]^2);\r
  a = if noEvent(delta_angle < 1e-7) then 1.0 else sin(delta_angle)/max(delta_angle,1e-7);\r
  b = if noEvent(delta_angle < 1e-7) then 0.5 else (1.0-cos(delta_angle))/max(delta_angle^2,1e-14);\r
  W = [0.0,-correction[9],correction[8];correction[9],0.0,-correction[7];-correction[8],correction[7],0.0];\r
  increment = identity(3)+a*W+b*(W*W);\r
  proposed_rotation = rotation*increment;\r
  // Exact right-local reset, including every p/v/bias-attitude cross term.\r
  reset_a = if noEvent(delta_angle < 1e-6) then 0.5 else (1.0-cos(delta_angle))/max(delta_angle^2,1e-12);\r
  reset_b = if noEvent(delta_angle < 1e-6) then 1.0/6.0 else (delta_angle-sin(delta_angle))/max(delta_angle^3,1e-18);\r
  reset_jacobian = identity(3)-reset_a*W+reset_b*(W*W);\r
  for j in 1:15 loop\r
    for i in 1:6 loop\r
      reset_left[i,j] = joseph_covariance[i,j];\r
    end for;\r
    for i in 1:3 loop\r
      reset_left[i+6,j] = sum(reset_jacobian[i,k]*joseph_covariance[k+6,j] for k in 1:3);\r
    end for;\r
    for i in 10:15 loop\r
      reset_left[i,j] = joseph_covariance[i,j];\r
    end for;\r
  end for;\r
  for i in 1:15 loop\r
    for j in 1:6 loop\r
      reset_proposed[i,j] = reset_left[i,j];\r
    end for;\r
    for j in 1:3 loop\r
      reset_proposed[i,j+6] = sum(reset_left[i,k+6]*reset_jacobian[j,k] for k in 1:3);\r
    end for;\r
    for j in 10:15 loop\r
      reset_proposed[i,j] = reset_left[i,j];\r
    end for;\r
  end for;\r
  for i in 1:3 loop\r
    next_position[i] = if noEvent(accepted > 0.5) then position[i]+correction[i] else position[i];\r
    next_velocity[i] = if noEvent(accepted > 0.5) then velocity[i]+correction[i+3] else velocity[i];\r
    next_accel_bias[i] = if noEvent(accepted > 0.5) then proposed_accel_bias[i] else accel_bias[i];\r
    next_gyro_bias[i] = if noEvent(accepted > 0.5) then proposed_gyro_bias[i] else gyro_bias[i];\r
    for j in 1:3 loop\r
      next_rotation[i,j] = if noEvent(accepted > 0.5) then proposed_rotation[i,j] else rotation[i,j];\r
    end for;\r
  end for;\r
  for i in 1:15 loop\r
    for j in 1:15 loop\r
      next_covariance[i,j] = if noEvent(accepted > 0.5) then 0.5*(reset_proposed[i,j]+reset_proposed[j,i]) else covariance[i,j];\r
    end for;\r
  end for;\r
  ow = 2.0*sqrt(max(0.0,1.0+next_rotation[1,1]+next_rotation[2,2]+next_rotation[3,3]));\r
  ox = 2.0*sqrt(max(0.0,1.0+next_rotation[1,1]-next_rotation[2,2]-next_rotation[3,3]));\r
  oy = 2.0*sqrt(max(0.0,1.0-next_rotation[1,1]+next_rotation[2,2]-next_rotation[3,3]));\r
  oz = 2.0*sqrt(max(0.0,1.0-next_rotation[1,1]-next_rotation[2,2]+next_rotation[3,3]));\r
  output_raw_q = if noEvent(next_rotation[1,1]+next_rotation[2,2]+next_rotation[3,3] > 0.0) then\r
      {ow/4.0,(next_rotation[3,2]-next_rotation[2,3])/max(ow,1e-12),(next_rotation[1,3]-next_rotation[3,1])/max(ow,1e-12),(next_rotation[2,1]-next_rotation[1,2])/max(ow,1e-12)}\r
    elseif noEvent(next_rotation[1,1] > next_rotation[2,2] and next_rotation[1,1] > next_rotation[3,3]) then\r
      {(next_rotation[3,2]-next_rotation[2,3])/max(ox,1e-12),ox/4.0,(next_rotation[1,2]+next_rotation[2,1])/max(ox,1e-12),(next_rotation[1,3]+next_rotation[3,1])/max(ox,1e-12)}\r
    elseif noEvent(next_rotation[2,2] > next_rotation[3,3]) then\r
      {(next_rotation[1,3]-next_rotation[3,1])/max(oy,1e-12),(next_rotation[1,2]+next_rotation[2,1])/max(oy,1e-12),oy/4.0,(next_rotation[2,3]+next_rotation[3,2])/max(oy,1e-12)}\r
    else {(next_rotation[2,1]-next_rotation[1,2])/max(oz,1e-12),(next_rotation[1,3]+next_rotation[3,1])/max(oz,1e-12),(next_rotation[2,3]+next_rotation[3,2])/max(oz,1e-12),oz/4.0};\r
  output_q_norm = sqrt(sum(output_raw_q[k]^2 for k in 1:4));\r
  next_quaternion = (if noEvent(output_raw_q[1] < 0.0) then -1.0 else 1.0)*output_raw_q/max(output_q_norm,1e-12);\r
end ES15PoseCorrection;\r
\r
// The reference uses strict positive definiteness, without a teaching pivot floor.\r
// All symmetry checks, rejected solves, and sixteen RHS stay in SPD6Solve.\r
model ES15CorrectionSolve\r
\r
  extends SPD6Solve(pivot_floor=0.0);\r
end ES15CorrectionSolve;\r
`;export{e as default};
