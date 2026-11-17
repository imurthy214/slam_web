const r=`// 6-DOF quadrotor SIL plant model.\r
//\r
// Inputs:  4 motor angular velocities [rad/s]\r
// States:  rigid body pose/velocity plus motor speeds\r
//\r
// Internal frame matches the cyecca model: local world Z is Up and body axes\r
// are Forward-Left-Up. Wrappers can expose NED/FRD values.\r
//\r
// Motor layout (ArduPilot Quad-X output order):\r
//   1: front-right  CCW   2: rear-left   CCW\r
//   3: front-left   CW    4: rear-right  CW\r
\r
model QuadrotorSIL\r
  parameter Real vehicle_mass = 2.0 "Total vehicle mass [kg]";\r
  parameter Real vehicle_ixx = 0.02166666666666667 "Body inertia xx [kg*m^2]";\r
  parameter Real vehicle_iyy = 0.02166666666666667 "Body inertia yy [kg*m^2]";\r
  parameter Real vehicle_izz = 0.04000000000000001 "Body inertia zz [kg*m^2]";\r
\r
  extends RigidBody.RigidBody6DOF(\r
    mass = vehicle_mass,\r
    g = 9.8,\r
    ixx = vehicle_ixx,\r
    iyy = vehicle_iyy,\r
    izz = vehicle_izz,\r
    p_start = {0, 0, ground_z - leg_z + initial_ground_clearance},\r
    qnorm_gain = 1.0\r
  );\r
\r
  // Aerodynamic and actuator parameters\r
  parameter Real Ct = 8.54858e-6 "Thrust coefficient [N/(rad/s)^2]";\r
  parameter Real Cm = 0.016 "Rotor torque/thrust ratio [m]";\r
  parameter Real arm_length = 0.25 "Arm length [m]";\r
  parameter Real d = arm_length * 0.7071067811865476 "Effective moment arm [m]";\r
  parameter Real Cl_p = -0.2 "Rolling moment coefficient per roll rate";\r
  parameter Real Cm_q = -0.2 "Pitching moment coefficient per pitch rate";\r
  parameter Real Cn_r = -0.1 "Yawing moment coefficient per yaw rate";\r
  parameter Real S = 0.1 "Reference area [m^2]";\r
  parameter Real CdA[3] = {0.06, 0.08, 0.12} "Body-axis drag area [m^2]";\r
  parameter Real linear_drag[3] = {0.12, 0.12, 0.18} "Low-speed body-axis drag [N/(m/s)]";\r
  parameter Real rho = 1.225 "Air density [kg/m^3]";\r
  parameter Real mag_world_ned[3] = {0.21, 0.0, 0.45} "Mag field NED [Gauss]";\r
  parameter Real R_FRD_FLU[3, 3] = [\r
    1, 0, 0;\r
    0, -1, 0;\r
    0, 0, -1\r
  ] "Body FLU to body FRD transform";\r
  parameter Real R_NWU_NED[3, 3] = [\r
    1, 0, 0;\r
    0, -1, 0;\r
    0, 0, -1\r
  ] "World NED to internal N/W/U transform";\r
\r
  // Ground contact (spring-damper)\r
  parameter Real ground_k = 3000 "Ground stiffness per contact point [N/m]";\r
  parameter Real ground_c = 150 "Ground normal damping per contact point [N*s/m]";\r
  parameter Real ground_tangent_c = 25 "Ground tangential damping per contact point [N*s/m]";\r
  parameter Real ground_z = 0.0 "World Z coordinate of the ground collision plane [m]";\r
  parameter Real initial_ground_clearance = 0.02 "Initial landing-leg clearance above the ground plane [m]";\r
  parameter Real leg_x = 0.17 "Landing contact X offset from CG [m]";\r
  parameter Real leg_y = 0.17 "Landing contact Y offset from CG [m]";\r
  parameter Real leg_z = -0.10 "Landing contact Z offset from CG [m]";\r
\r
  // Motor first-order response\r
  parameter Real tau_up = 0.0125 "Motor spin-up time constant [s]";\r
  parameter Real tau_down = 0.025 "Motor spin-down time constant [s]";\r
  parameter Real motor_tau_eps = 1.0 "Smooth transition width for asymmetric motor lag [rad/s]";\r
  parameter Real motor_omega_cmd_max = 1600 "Maximum commanded motor speed [rad/s]";\r
  parameter Real motor_omega_cmd_eps = 20 "Smooth command saturation width [rad/s]";\r
  parameter Real motor_moment_map[3, 4] = [\r
    -d,   d,   d,  -d;\r
    -d,   d,  -d,   d;\r
   -Cm, -Cm,  Cm,  Cm\r
  ] "Motor thrust to body moment map";\r
  parameter Real rate_damping[3] = {\r
    4 * S * arm_length * Cl_p,\r
    4 * S * arm_length * Cm_q,\r
    4 * S * arm_length * Cn_r\r
  } "Body rate damping coefficients";\r
\r
  model Motor\r
    parameter Real Ct = 8.54858e-6 "Thrust coefficient [N/(rad/s)^2]";\r
    parameter Real tau_up = 0.0125 "Motor spin-up time constant [s]";\r
    parameter Real tau_down = 0.025 "Motor spin-down time constant [s]";\r
    parameter Real tau_inv_mid = 0.5 * (1.0 / tau_up + 1.0 / tau_down) "Mean inverse motor lag [1/s]";\r
    parameter Real tau_inv_delta = 0.5 * (1.0 / tau_up - 1.0 / tau_down) "Signed inverse motor lag half-range [1/s]";\r
    parameter Real tau_eps = 1.0 "Smooth transition width for asymmetric lag [rad/s]";\r
    parameter Real omega_cmd_max = 1600 "Maximum commanded motor speed [rad/s]";\r
    parameter Real omega_cmd_eps = 20 "Smooth command saturation width [rad/s]";\r
\r
    input Real omega_cmd(start = 0) "Commanded speed [rad/s]";\r
    output Real omega(start = 0, fixed = true) "Actual speed [rad/s]";\r
    output Real thrust "Motor thrust [N]";\r
\r
  protected\r
    Real omega_error "Motor speed tracking error [rad/s]";\r
    Real omega_cmd_nonnegative "Command after smooth lower limit [rad/s]";\r
    Real omega_cmd_upper_margin "Distance from the smooth lower-limited command to the upper command limit [rad/s]";\r
    Real omega_cmd_limited "Command after smooth lower and upper limits [rad/s]";\r
    Real lag_blend "Smooth lag blend";\r
    Real tau_inv "Smooth inverse lag [1/s]";\r
\r
  equation\r
    omega_cmd_nonnegative = 0.5 * (omega_cmd + sqrt(omega_cmd * omega_cmd + omega_cmd_eps * omega_cmd_eps));\r
    omega_cmd_upper_margin = omega_cmd_max - omega_cmd_nonnegative;\r
    omega_cmd_limited = omega_cmd_max - 0.5 * (omega_cmd_upper_margin + sqrt(omega_cmd_upper_margin * omega_cmd_upper_margin + omega_cmd_eps * omega_cmd_eps));\r
    omega_error = omega_cmd_limited - omega;\r
    lag_blend = omega_error / sqrt(omega_error * omega_error + tau_eps * tau_eps);\r
    tau_inv = tau_inv_mid + tau_inv_delta * lag_blend;\r
    der(omega) = tau_inv * omega_error;\r
    thrust = Ct * omega * omega;\r
  end Motor;\r
\r
  input Real omega_cmd[4](start = {0, 0, 0, 0}) "Motor commands [rad/s]";\r
\r
  output Real position[3](start = p_start) "World position [m]";\r
  output Real velocity[3](start = v_b_start) "World velocity [m/s]";\r
  output Real quat[4](start = q_start) "Quaternion w,x,y,z";\r
  output Real omega_m[4](start = {0, 0, 0, 0}) "Motor actual speeds [rad/s]";\r
  output Real accel[3](start = {0, 0, 0}) "Body FRD accelerometer [m/s^2] (specific force)";\r
  output Real gyro[3](start = {0, 0, 0}) "Body FRD gyroscope [rad/s]";\r
  output Real mag[3](start = {0.21, 0, -0.45}) "Body FRD magnetometer [Gauss]";\r
\r
protected\r
  Motor motor[4](\r
    each Ct = Ct,\r
    each tau_up = tau_up,\r
    each tau_down = tau_down,\r
    each tau_eps = motor_tau_eps,\r
    each omega_cmd_max = motor_omega_cmd_max,\r
    each omega_cmd_eps = motor_omega_cmd_eps\r
  );\r
  Real F_m[4] "Motor thrusts [N]";\r
  Real T "Total motor thrust [N]";\r
  Real M_rotor[3] "Rotor moment in body FLU [N*m]";\r
  Real M_rate[3] "Rate damping moment in body FLU [N*m]";\r
  Real V "Airspeed magnitude [m/s]";\r
  Real drag_b[3] "Body drag force [N]";\r
  Real mag_world_w[3] "Mag field in internal N/W/U world axes [Gauss]";\r
  Real mag_b_flu[3] "Mag field in body FLU axes [Gauss]";\r
  Real leg_h_w[4] "Landing contact world Z positions [m]";\r
  parameter Real leg_r_b[3, 4] = [\r
    leg_x, -leg_x, leg_x, -leg_x;\r
    -leg_y, leg_y, leg_y, -leg_y;\r
    leg_z, leg_z, leg_z, leg_z\r
  ] "Landing contact offsets in body FLU [m]";\r
  Real leg_v_b[3, 4] "Landing contact velocities in body [m/s]";\r
  Real leg_f_w[3, 4] "Landing contact forces in world [N]";\r
  Real leg_f_b[3, 4] "Landing contact forces in body [N]";\r
  Real leg_m_b[3, 4] "Landing contact moments in body [N*m]";\r
  Real F_ground_b[3] "Total ground force in body FLU [N]";\r
  Real M_ground_b[3] "Total ground moment in body FLU [N*m]";\r
\r
equation\r
  motor.omega_cmd = omega_cmd;\r
  omega_m = motor.omega;\r
  F_m = motor.thrust;\r
  T = F_m[1] + F_m[2] + F_m[3] + F_m[4];\r
\r
  V = sqrt(v_b[1] * v_b[1] + v_b[2] * v_b[2] + v_b[3] * v_b[3] + 1e-12);\r
  drag_b = -0.5 * rho * V * (CdA .* v_b) - linear_drag .* v_b;\r
\r
  M_rotor = motor_moment_map * F_m;\r
  M_rate = rate_damping .* omega;\r
\r
  for i in 1:4 loop\r
    leg_v_b[:, i] = v_b + cross(omega, leg_r_b[:, i]);\r
    leg_h_w[i] = p[3] + R[3, :] * leg_r_b[:, i];\r
    leg_f_w[1, i] = if leg_h_w[i] < ground_z then -ground_tangent_c * (R[1, :] * leg_v_b[:, i]) else 0;\r
    leg_f_w[2, i] = if leg_h_w[i] < ground_z then -ground_tangent_c * (R[2, :] * leg_v_b[:, i]) else 0;\r
    leg_f_w[3, i] = if leg_h_w[i] < ground_z then max(0, ground_k * (ground_z - leg_h_w[i]) - ground_c * (R[3, :] * leg_v_b[:, i])) else 0;\r
    leg_m_b[:, i] = cross(leg_r_b[:, i], leg_f_b[:, i]);\r
  end for;\r
\r
  leg_f_b = transpose(R) * leg_f_w;\r
\r
  F_ground_b = leg_f_b * {1, 1, 1, 1};\r
  M_ground_b = leg_m_b * {1, 1, 1, 1};\r
\r
  M_b = M_rotor + M_rate + M_ground_b;\r
  F_b = F_ground_b + drag_b + {0, 0, T};\r
\r
  accel = R_FRD_FLU * a_b;\r
  gyro = R_FRD_FLU * omega;\r
  mag_world_w = R_NWU_NED * mag_world_ned;\r
  mag_b_flu = transpose(R) * mag_world_w;\r
  mag = R_FRD_FLU * mag_b_flu;\r
\r
  position = p;\r
  velocity = v_w;\r
  quat = q;\r
\r
end QuadrotorSIL;\r
`;export{r as default};
