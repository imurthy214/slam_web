const e=`// Diagnostic of the existing correction rule; this is not an estimator repair.\r
function ProbeNuisanceCI\r
  input Real weight;\r
  output Real accepted; output Real reason;\r
  output Real varianceRatio[9]; output Real nuisanceMeanDelta[9];\r
protected\r
  SchmidtGraphPoseCorrection.State previous;\r
  SchmidtGraphPoseCorrection.Policy policy;\r
  SchmidtGraphPoseCorrection.Attempt attempt;\r
  SchmidtGraphPoseCorrection.Result result;\r
  GraphGaugeUncertainty.Estimate graph;\r
  GraphGaugeUncertainty.Binding binding;\r
  Integer nuisance[9] = {4,5,6,10,11,12,13,14,15};\r
algorithm\r
  binding.generation := 1; binding.graphRevision := 1; binding.catalogPoseRevision := 0;\r
  binding.anchorId := 1; binding.anchorEpoch := 0; binding.anchorCaptureSequence := 1;\r
  binding.currentId := 3; binding.currentEpoch := 2; binding.currentCaptureSequence := 3;\r
  binding.referenceId := 2; binding.referenceEpoch := 1; binding.referenceCaptureSequence := 2;\r
  binding.chart := 1; binding.anchorTime := 0; binding.currentTime := 0.2; binding.referenceTime := 0.1;\r
  binding.sourceRevision := 1; binding.factorProvenance := 1; binding.anchorBoundProvenance := 1;\r
  previous.position := zeros(3); previous.velocity := {0.4,-0.3,0.2}; previous.rotation := identity(3);\r
  previous.accelBias := {0.01,0.02,0.03}; previous.gyroBias := {0.001,0.002,0.003};\r
  previous.covariance := 0.1*identity(15); previous.crossCovariance := zeros(15,6);\r
  previous.referenceCovariance := 0.1*identity(6); previous.referencePosition := zeros(3); previous.referenceRotation := identity(3);\r
  previous.referenceAvailable := true; previous.referenceUsed := true;\r
  previous.generation := 1; previous.sourceRevision := 1; previous.currentId := 3; previous.currentEpoch := 2;\r
  previous.currentCaptureSequence := 3; previous.referenceId := 2; previous.referenceEpoch := 1;\r
  previous.referenceCaptureSequence := 2; previous.lastUsedEpoch := 1; previous.predictionTime := 0.2; previous.referenceTime := 0.1;\r
  graph.binding := binding; graph.positions := {{0.01,0,0},{0.01,0,0}};\r
  graph.rotations[1,:,:] := identity(3); graph.rotations[2,:,:] := identity(3); graph.covariance := 0.1*identity(12);\r
  policy := SchmidtGraphPoseCorrection.DefaultPolicy(); policy.weight := weight; policy.constrainVelocityAndBias := true;\r
  attempt.generation := 1; attempt.graphRevision := 0; attempt.factorProvenance := 0;\r
  result := SchmidtGraphPoseCorrection.Correct(previous,graph,binding,attempt,policy,true);\r
  accepted := if result.accepted then 1.0 else 0.0; reason := result.reason;\r
  for i in 1:9 loop\r
    varianceRatio[i] := result.next.covariance[nuisance[i],nuisance[i]]/previous.covariance[nuisance[i],nuisance[i]];\r
    nuisanceMeanDelta[i] := result.correction[nuisance[i]];\r
  end for;\r
end ProbeNuisanceCI;\r
\r
model CINuisanceProfile\r
  input Real weight = 0.5;\r
  output Real accepted; output Real reason;\r
  output Real varianceRatio[9]; output Real nuisanceMeanDelta[9];\r
equation\r
  (accepted,reason,varianceRatio,nuisanceMeanDelta) = ProbeNuisanceCI(weight);\r
end CINuisanceProfile;\r
`;export{e as default};
