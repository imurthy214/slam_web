const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Geometric proposals use the same immutable catalog snapshot as retrieval.\r
// Graph admission and shared-image correlation remain separate owners.\r
package RGBDCatalogLoopVerification\r
\r
  function PoseConsistent\r
    input Real referencePosition[3]; input Real currentPosition[3];\r
    input Real referenceRotation[3,3];\r
    input Real referenceCovariance[6,6]; input Real currentCovariance[6,6];\r
    input Real measuredTranslation[3]; input Real measuredCovariance[3,3];\r
    input Real maximumSquared = 9.0; input Real minimumPivot = 1e-10;\r
    input Real maximumTranslationInnovation = 2.0 "Motion disagreement limit; explicit relocalization policy may enlarge it";\r
    output Boolean accepted; output Real squared;\r
  protected\r
    Real residual[3]; Real arm[3,3]; Real covariance[3,3]; Boolean valid;\r
  algorithm\r
    residual := currentPosition-referencePosition-referenceRotation*measuredTranslation;\r
    arm := referenceRotation*RGBDUncertaintySkew(measuredTranslation);\r
    // A conservative screening bound, not an independent measurement update.\r
    // Four times the marginal sum bounds arbitrary correlations among the\r
    // two positions, retained-reference angle and measured translation.\r
    covariance := 4.0*(referenceCovariance[1:3,1:3]+currentCovariance[1:3,1:3]\r
      +referenceRotation*measuredCovariance*transpose(referenceRotation)\r
      +arm*referenceCovariance[4:6,4:6]*transpose(arm));\r
    (valid,squared) := RegistrationWhitenedResidual3(residual,covariance,minimumPivot);\r
    accepted := valid and maximumSquared > 0.0 and squared <= maximumSquared\r
      and maximumTranslationInnovation > 0.0\r
      and residual*residual <= maximumTranslationInnovation*maximumTranslationInnovation;\r
  end PoseConsistent;\r
\r
  function VerifyCandidate\r
    input RGBDKeyframes.Catalog catalog;\r
    input RGBDKeyframes.Frame current;\r
    input Integer candidateId; input Integer candidateSlot;\r
    input Real appearanceScore; input Boolean requested;\r
    input Integer seed = 7; input Integer trials = 96; input Integer refinements = 4;\r
    input Integer minimumInliers = 12; input Real minimumFraction = 0.5;\r
    input Real inlierDistance = 0.08; input Real maximumRms = 0.03;\r
    input Real minimumAge = 5.0; input Real minimumSimilarity = 0.35;\r
    input Real descriptorRatio = 0.8; input Real maximumDescriptorDistance = 0.8;\r
    input Real coordinateLimit = 100.0; input Real rankTolerance = 1e-8;\r
    input Real localizationSigma = 0.5; input Real depthInflation = 1.0; input Real minimumPivot = 1e-10;\r
    output RGBDLoopVerification.Proposal proposal;\r
    input Boolean calibratedResiduals = true;\r
    input Real maximumNormalizedSquared = 9.0;\r
    input Boolean poseConsistentLoops = false;\r
    input Real maximumPoseInnovation = 2.0;\r
    input Real poseConsistencySquared = 9.0;\r
  protected\r
    RGBDKeyframes.Frame reference;\r
    Boolean bound; Boolean poseConsistent; Real poseSquared;\r
  algorithm\r
    proposal := RGBDLoopVerification.EmptyProposal(seed);\r
    if requested then\r
      // Check domains before reading a slot. Capture will replace nextSlot,\r
      // so that identity cannot supply a retained loop endpoint.\r
      bound := RGBDKeyframes.ValidHeader(catalog)\r
        and candidateSlot >= 1 and candidateSlot <= RGBDKeyframes.keyframeCapacity\r
        and candidateSlot <> catalog.nextSlot and candidateId >= 1 and candidateId < catalog.nextId\r
        and current.generation == catalog.generation\r
        and current.vocabularyVersion == catalog.vocabularyVersion\r
        and current.id == catalog.nextId and current.epoch > catalog.lastEpoch\r
        and (catalog.nextId == 1 or current.imageTime > catalog.lastTime)\r
        and minimumSimilarity >= 0 and minimumSimilarity <= 1\r
        and appearanceScore >= minimumSimilarity and appearanceScore <= 1;\r
      proposal.rejectionReason := 10 "Catalog/appearance identity binding refused";\r
      if bound then\r
        bound := catalog.occupied[candidateSlot] and catalog.ids[candidateSlot] == candidateId\r
          and catalog.generations[candidateSlot] == current.generation\r
          and catalog.vocabularyVersions[candidateSlot] == current.vocabularyVersion;\r
        if bound then\r
          reference := RGBDKeyframes.ReadSlot(catalog,candidateSlot);\r
          proposal := RGBDLoopVerification.Verify(reference,current,true,seed,trials,refinements,\r
            minimumInliers,minimumFraction,inlierDistance,maximumRms,minimumAge,descriptorRatio,\r
            maximumDescriptorDistance,coordinateLimit,rankTolerance,localizationSigma,depthInflation,minimumPivot,\r
            calibratedResiduals=calibratedResiduals,maximumNormalizedSquared=maximumNormalizedSquared);\r
          if proposal.verified and poseConsistentLoops then\r
            (poseConsistent,poseSquared) := PoseConsistent(reference.bodyPosition,current.bodyPosition,\r
              reference.bodyRotation,reference.poseCovariance,current.poseCovariance,\r
              proposal.bodyTranslation,proposal.covariance[1:3,1:3],minimumPivot=minimumPivot,\r
              maximumSquared=poseConsistencySquared,maximumTranslationInnovation=maximumPoseInnovation);\r
            if not poseConsistent then\r
              proposal.verified := false; proposal.rejectionReason := 11;\r
            end if;\r
          end if;\r
        end if;\r
      end if;\r
    end if;\r
  end VerifyCandidate;\r
\r
  record Batch\r
    RGBDKeyframes.Frame prepared;\r
    Boolean retrievalAccepted; Integer retrievalRejectionReason;\r
    Real wordIndex[RGBDKeyframes.featureCapacity];\r
    Integer candidateId[RGBDKeyframeRetrieval.proposalCapacity];\r
    Integer candidateSlot[RGBDKeyframeRetrieval.proposalCapacity];\r
    Real candidateScore[RGBDKeyframeRetrieval.proposalCapacity];\r
    Integer candidateCount; Real assignmentCount;\r
    RGBDLoopVerification.Proposal proposals[RGBDKeyframeRetrieval.proposalCapacity];\r
    Integer verifiedCount;\r
    Integer nextSeeds[RGBDKeyframeRetrieval.proposalCapacity];\r
  end Batch;\r
\r
  function ProposeCapture\r
    input RGBDKeyframes.Catalog catalog;\r
    input RGBDKeyframes.Frame measurement;\r
    input Real vocabulary[RGBDKeyframes.wordCapacity,RGBDKeyframes.descriptorSize];\r
    input Real vocabularyEnabled[RGBDKeyframes.wordCapacity];\r
    input Boolean requested;\r
    input Integer seeds[RGBDKeyframeRetrieval.proposalCapacity];\r
    input Real maximumWordDistanceSquared = 0.8; input Integer minimumAssignments = 8;\r
    input Real minimumSimilarity = 0.35; input Real minimumAge = 5.0;\r
    input Integer trials = 96; input Integer refinements = 4;\r
    input Integer minimumInliers = 12; input Real minimumFraction = 0.5;\r
    input Real inlierDistance = 0.08; input Real maximumRms = 0.03;\r
    input Real descriptorRatio = 0.8; input Real maximumDescriptorDistance = 0.8;\r
    input Real coordinateLimit = 100.0; input Real rankTolerance = 1e-8;\r
    input Real localizationSigma = 0.5; input Real depthInflation = 1.0; input Real minimumPivot = 1e-10;\r
    output Batch result;\r
    input Boolean calibratedResiduals = true;\r
    input Real maximumNormalizedSquared = 9.0;\r
    input Boolean poseConsistentLoops = false;\r
    input Real maximumPoseInnovation = 2.0;\r
    input Real poseConsistencySquared = 9.0;\r
  algorithm\r
    (result.prepared,result.retrievalAccepted,result.retrievalRejectionReason,result.wordIndex,result.candidateId,result.candidateSlot,result.candidateScore,\r
      result.candidateCount,result.assignmentCount) := RGBDKeyframeRetrieval.PrepareCapture(catalog,measurement,\r
        vocabulary,vocabularyEnabled,requested,maximumWordDistanceSquared,minimumAssignments,minimumSimilarity,minimumAge);\r
    result.verifiedCount := 0;\r
    for rank in 1:RGBDKeyframeRetrieval.proposalCapacity loop\r
      result.proposals[rank] := VerifyCandidate(catalog,result.prepared,result.candidateId[rank],result.candidateSlot[rank],result.candidateScore[rank],\r
        result.retrievalAccepted and rank <= result.candidateCount,seeds[rank],trials,refinements,minimumInliers,\r
        minimumFraction,inlierDistance,maximumRms,minimumAge,minimumSimilarity,descriptorRatio,\r
        maximumDescriptorDistance,coordinateLimit,rankTolerance,localizationSigma,depthInflation,minimumPivot,\r
        calibratedResiduals=calibratedResiduals,maximumNormalizedSquared=maximumNormalizedSquared,\r
        poseConsistentLoops=poseConsistentLoops,maximumPoseInnovation=maximumPoseInnovation,poseConsistencySquared=poseConsistencySquared);\r
      result.nextSeeds[rank] := result.proposals[rank].nextSeed;\r
      result.verifiedCount := result.verifiedCount+(if result.proposals[rank].verified then 1 else 0);\r
    end for;\r
  end ProposeCapture;\r
end RGBDCatalogLoopVerification;\r
`;export{e as default};
