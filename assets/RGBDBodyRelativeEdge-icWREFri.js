const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Convert an already verified optical registration into the product residual\r
// used by ModelicaPoseGraph. This component does not verify correspondences,\r
// admit graph edges, or resolve correlations between reused images.\r
// Dependencies: RGBDRegistrationUncertainty.mo (rotation/SPD helpers).\r
function RGBDOpticalToBodyEdge\r
\r
  input Real currentFromReference[3,3];\r
  input Real opticalTranslation[3];\r
  input Real opticalCovariance[6,6]\r
    "Independent translation increment, then left optical angle increment";\r
  input Real referenceOpticalToBody[3,3];\r
  input Real currentOpticalToBody[3,3];\r
  input Real referenceCameraOrigin[3];\r
  input Real currentCameraOrigin[3];\r
  input Boolean requested;\r
  input Real coordinateLimit;\r
  input Real minimumPivot;\r
  output Real measuredRotation[3,3] "Current body coordinates to reference body";\r
  output Real measuredTranslation[3] "Current body origin in reference body";\r
  output Real residualJacobian[6,6];\r
  output Real residualCovariance[6,6];\r
  output Real information[6,6];\r
  output Boolean valid;\r
  output Integer rejectionReason;\r
  output Real minimumScaledPivot;\r
protected\r
  Boolean configuration; Boolean geometry; Boolean opticalValid; Boolean edgeValid;\r
  Real rotationCandidate[3,3]; Real translationCandidate[3];\r
  Real opticalToReferenceBody[3,3]; Real arm[3]; Real J[6,6];\r
  Real covarianceCandidate[6,6]; Real inverseCandidate[6,6];\r
  Real unusedInverse[6,6]; Real opticalPivot;\r
algorithm\r
  measuredRotation := identity(3); measuredTranslation := zeros(3);\r
  residualJacobian := zeros(6,6); residualCovariance := zeros(6,6);\r
  information := zeros(6,6); valid := false; rejectionReason := 1;\r
  minimumScaledPivot := 0.0;\r
  // Disabled payload is not read as a measurement.\r
  if requested then\r
    configuration := coordinateLimit > 0.0 and coordinateLimit <= 1e4\r
      and minimumPivot > 0.0 and minimumPivot < 1.0;\r
    rejectionReason := 2;\r
    if configuration then\r
      geometry := RGBDUncertaintyProper(currentFromReference)\r
        and RGBDUncertaintyProper(referenceOpticalToBody)\r
        and RGBDUncertaintyProper(currentOpticalToBody);\r
      for axis in 1:3 loop\r
        geometry := geometry and abs(opticalTranslation[axis]) <= coordinateLimit\r
          and abs(referenceCameraOrigin[axis]) <= coordinateLimit\r
          and abs(currentCameraOrigin[axis]) <= coordinateLimit;\r
      end for;\r
      rejectionReason := 3;\r
      if geometry then\r
        (unusedInverse,opticalValid,opticalPivot) :=\r
          RGBDUncertaintyInverse6(opticalCovariance,minimumPivot);\r
        rejectionReason := 4;\r
        if opticalValid then\r
          opticalToReferenceBody := referenceOpticalToBody*transpose(currentFromReference);\r
          rotationCandidate := opticalToReferenceBody*transpose(currentOpticalToBody);\r
          arm := opticalTranslation+transpose(currentOpticalToBody)*currentCameraOrigin;\r
          translationCandidate := referenceCameraOrigin-opticalToReferenceBody*arm;\r
          // At the nominal edge, r = [Ri'*(pj-pi)-u, Log(D'*Ri'*Rj)].\r
          // Perturb C as Exp(dtheta)*C and t independently as t+dt.\r
          // Differentiating this residual gives [A, A*skew(arm); 0, Ecurrent].\r
          // It is not the coupled SE(3) logarithm/adjoint covariance convention.\r
          J := zeros(6,6);\r
          J[1:3,1:3] := opticalToReferenceBody;\r
          J[1:3,4:6] := opticalToReferenceBody*RGBDUncertaintySkew(arm);\r
          J[4:6,4:6] := currentOpticalToBody;\r
          // Only roundoff asymmetry within the SPD helper's tolerance is\r
          // averaged. No damping or covariance floor invents an accepted edge.\r
          covarianceCandidate := J*((opticalCovariance+transpose(opticalCovariance))/2.0)*transpose(J);\r
          covarianceCandidate := (covarianceCandidate+transpose(covarianceCandidate))/2.0;\r
          (inverseCandidate,edgeValid,minimumScaledPivot) :=\r
            RGBDUncertaintyInverse6(covarianceCandidate,minimumPivot);\r
          rejectionReason := 5;\r
          if edgeValid then\r
            measuredRotation := rotationCandidate;\r
            measuredTranslation := translationCandidate;\r
            residualJacobian := J;\r
            residualCovariance := covarianceCandidate;\r
            information := (inverseCandidate+transpose(inverseCandidate))/2.0;\r
            valid := true; rejectionReason := 0;\r
          end if;\r
        end if;\r
      end if;\r
    end if;\r
  end if;\r
end RGBDOpticalToBodyEdge;\r
\r
model RGBDBodyRelativeEdge\r
\r
  parameter Real coordinateLimit = 100.0;\r
  parameter Real minimumPivot = 1e-10;\r
  input Real currentFromReference[3,3] = identity(3);\r
  input Real opticalTranslation[3] = zeros(3);\r
  input Real opticalCovariance[6,6] = identity(6);\r
  input Real referenceOpticalToBody[3,3] = identity(3);\r
  input Real currentOpticalToBody[3,3] = identity(3);\r
  input Real referenceCameraOrigin[3] = zeros(3);\r
  input Real currentCameraOrigin[3] = zeros(3);\r
  input Boolean requested = false;\r
  output Real measuredRotation[3,3]; output Real measuredTranslation[3];\r
  output Real residualJacobian[6,6]; output Real residualCovariance[6,6];\r
  output Real information[6,6]; output Boolean valid;\r
  output Integer rejectionReason; output Real minimumScaledPivot;\r
equation\r
  (measuredRotation,measuredTranslation,residualJacobian,residualCovariance,\r
    information,valid,rejectionReason,minimumScaledPivot) = RGBDOpticalToBodyEdge(\r
      currentFromReference,opticalTranslation,opticalCovariance,\r
      referenceOpticalToBody,currentOpticalToBody,referenceCameraOrigin,\r
      currentCameraOrigin,requested,coordinateLimit,minimumPivot);\r
end RGBDBodyRelativeEdge;\r
`;export{e as default};
