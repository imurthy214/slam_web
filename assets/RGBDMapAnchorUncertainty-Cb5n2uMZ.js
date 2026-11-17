const n=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Per-landmark conditional first-order bound. No landmark/filter independence\r
// or joint-landmark guarantee. Local geometry remains an immutable input.\r
package RGBDMapAnchorUncertainty\r
\r
  // Anchor slots are catalog slots, assigned by keyframe retention rather\r
  // than derived from ids, so the capacity follows the map-anchor owner.\r
  constant Integer anchorCapacity = RGBDMapAnchors.keyframeCapacity;\r
  constant Integer landmarkCapacity = 14400;\r
  constant Integer positionDimension = 3;\r
  constant Integer anchorDimension = 6;\r
  constant Integer identifierLimit = 1000000000;\r
  record Binding\r
    Integer generation; Integer sourceRevision; Integer landmarkSlot;\r
    Integer anchorId; Integer anchorSlot; Integer anchorEpoch; Integer anchorPoseRevision;\r
    Integer rawObservationEpoch; Integer rawObservationProvenance;\r
    Integer localBoundProvenance; Integer anchorBoundProvenance;\r
    Real anchorTime; Real observationTime;\r
  end Binding;\r
  record Estimate\r
    Binding binding; Real worldPoint[3]; Real covariance[3,3];\r
  end Estimate;\r
  function SameBinding\r
    input Binding a; input Binding b; output Boolean same;\r
  algorithm\r
    same := a.generation == b.generation and a.sourceRevision == b.sourceRevision\r
      and a.landmarkSlot == b.landmarkSlot and a.anchorId == b.anchorId and a.anchorSlot == b.anchorSlot\r
      and a.anchorEpoch == b.anchorEpoch and a.anchorPoseRevision == b.anchorPoseRevision\r
      and a.rawObservationEpoch == b.rawObservationEpoch and a.rawObservationProvenance == b.rawObservationProvenance\r
      and a.localBoundProvenance == b.localBoundProvenance and a.anchorBoundProvenance == b.anchorBoundProvenance\r
      and a.anchorTime == b.anchorTime and a.observationTime == b.observationTime;\r
  end SameBinding;\r
  function ValidBinding\r
    input Binding b; output Boolean valid;\r
  algorithm\r
    valid := b.generation > 0 and b.sourceRevision > 0 and b.landmarkSlot >= 1 and b.landmarkSlot <= landmarkCapacity\r
      and b.anchorId > 0 and b.anchorId <= identifierLimit and b.anchorSlot >= 1 and b.anchorSlot <= anchorCapacity\r
      and b.anchorEpoch >= 0 and b.anchorPoseRevision >= 0 and b.rawObservationEpoch >= b.anchorEpoch\r
      and b.rawObservationProvenance > 0 and b.localBoundProvenance > 0 and b.anchorBoundProvenance > 0\r
      and b.anchorTime >= 0 and b.observationTime <= 1e12\r
      and (if b.rawObservationEpoch == b.anchorEpoch then b.observationTime == b.anchorTime\r
        else b.observationTime > b.anchorTime);\r
    // Slots are not a function of ids under retention; the slot range is\r
    // certified above and the anchor owner checks the stored id\r
    // (RGBDMapAnchors: nodeId[slot] == anchorId), so slot reuse never\r
    // preserves a stale anchor identity.\r
  end ValidBinding;\r
  function Transport\r
    input Estimate previous; input Binding binding; input Binding expectedBinding;\r
    input Real anchorPosition[3]; input Real anchorRotation[3,3]; input Real anchorBound[6,6];\r
    input Real localPoint[3]; input Real localBound[3,3]; input Real beta; input Boolean requested;\r
    output Estimate result; output Boolean accepted; output Integer rejectionReason;\r
  protected\r
    Boolean valid; Real J[3,6]; Real lever[3,3]; Real point[3]; Real covariance[3,3];\r
  algorithm\r
    result := previous; accepted := false; rejectionReason := 1;\r
    if requested then\r
      rejectionReason := 2; valid := ValidBinding(binding) and SameBinding(binding,expectedBinding);\r
      if valid then rejectionReason := 3; valid := beta > 0 and beta < 1; end if;\r
      if valid then\r
        rejectionReason := 4; valid := RGBDUncertaintyProper(anchorRotation);\r
        for i in 1:3 loop valid := valid and abs(anchorPosition[i]) <= 1e6 and abs(localPoint[i]) <= 1e6; end for;\r
      end if;\r
      if valid then\r
        rejectionReason := 5;\r
        valid := SLAMCovariancePSDCheck(anchorBound,1e-12) == 1 and SLAMCovariancePSDCheck(localBound,1e-12) == 1;\r
      end if;\r
      if valid then\r
        J := zeros(3,6); J[:,1:3] := identity(3); lever := -anchorRotation*RGBDUncertaintySkew(localPoint); J[:,4:6] := lever;\r
        point := anchorPosition+anchorRotation*localPoint;\r
        covariance := J*anchorBound*transpose(J)/beta+anchorRotation*localBound*transpose(anchorRotation)/(1-beta);\r
        rejectionReason := 6;\r
        valid := SLAMCovariancePSDCheck(covariance,1e-12) == 1;\r
        for i in 1:3 loop valid := valid and abs(point[i]) <= 1e6; end for;\r
        if valid then\r
          result.binding := binding; result.worldPoint := point; result.covariance := covariance;\r
          accepted := true; rejectionReason := 0;\r
        end if;\r
      end if;\r
    end if;\r
  end Transport;\r
end RGBDMapAnchorUncertainty;\r
`;export{n as default};
