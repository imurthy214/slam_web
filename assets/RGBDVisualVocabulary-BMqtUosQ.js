const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Measured appearance bootstrap. Word identities freeze before histogram storage.\r
// This is not a loop constraint, geometric observation or scene/truth signature.\r
package RGBDVisualVocabulary\r
\r
  constant Integer vocabularyCapacity = RGBDKeyframes.wordCapacity;\r
  constant Integer descriptorSize = RGBDKeyframes.descriptorSize;\r
  constant Integer featureCapacity = RGBDKeyframes.featureCapacity;\r
  constant Integer identifierLimit = RGBDKeyframes.identifierLimit;\r
\r
  record State\r
    Integer generation;\r
    Integer sourceRevision;\r
    Integer version;\r
    Real words[vocabularyCapacity,descriptorSize];\r
    Real enabled[vocabularyCapacity];\r
    Integer count;\r
    Boolean ready "Once true, this dictionary cannot be changed by Learn";\r
  end State;\r
\r
  function Empty\r
    input Integer generation = 1;\r
    input Integer sourceRevision = 1;\r
    input Integer version = 1;\r
    output State state;\r
  algorithm\r
    // Invalid supplied ownership remains invalid: Valid/Learn refuse it.\r
    state.generation := generation; state.sourceRevision := sourceRevision;\r
    state.version := version; state.words := zeros(vocabularyCapacity,descriptorSize);\r
    state.enabled := zeros(vocabularyCapacity); state.count := 0; state.ready := false;\r
  end Empty;\r
\r
  function Valid\r
    input State state;\r
    output Boolean valid;\r
  protected\r
    Real mean; Real energy;\r
  algorithm\r
    valid := state.generation >= 1 and state.generation <= identifierLimit\r
      and state.sourceRevision >= 1 and state.sourceRevision <= identifierLimit\r
      and state.version >= 1 and state.version <= identifierLimit\r
      and state.count >= 0 and state.count <= vocabularyCapacity\r
      and (not state.ready or state.count >= 1);\r
    mean := 0.0; energy := 0.0;\r
    for word in 1:vocabularyCapacity loop\r
      valid := valid and state.enabled[word] == (if word <= state.count then 1.0 else 0.0);\r
      // Disabled word storage is opaque, including restored padding.\r
      if word <= state.count then\r
        mean := 0.0; energy := 0.0;\r
        for component in 1:descriptorSize loop\r
          valid := valid and abs(state.words[word,component]) <= 1.0;\r
          mean := mean+state.words[word,component]/descriptorSize;\r
          energy := energy+state.words[word,component]*state.words[word,component];\r
        end for;\r
        valid := valid and abs(mean) <= 1e-6 and abs(energy-1.0) <= 1e-6;\r
      end if;\r
    end for;\r
  end Valid;\r
\r
  function Learn\r
    input State previous;\r
    input Real descriptor[featureCapacity,descriptorSize];\r
    input Real descriptorEnabled[featureCapacity];\r
    input Real descriptorCount "Full domain extent, including disabled sparse slots";\r
    input Integer generation;\r
    input Integer sourceRevision;\r
    input Integer version;\r
    input Boolean requested = true;\r
    input Integer minimumMeasuredDescriptors = 8;\r
    input Real minimumDistanceSquared = 0.04;\r
    output State next;\r
    output Boolean accepted;\r
    output Integer reason "0 idle, 1 frozen now, 2 learning, 3 already frozen; negative refusal";\r
  protected\r
    State pending;\r
    Real samples[featureCapacity,descriptorSize];\r
    Real sample[descriptorSize]; Boolean sampleValid; Boolean inputsValid;\r
    Integer domainCount; Integer measuredCount;\r
    Real distance; Real nearest;\r
  algorithm\r
    next := previous; accepted := false; reason := 0;\r
    pending := previous; samples := zeros(featureCapacity,descriptorSize);\r
    sample := zeros(descriptorSize); sampleValid := false; inputsValid := true;\r
    domainCount := 0; measuredCount := 0; distance := 0.0; nearest := 5.0;\r
    if requested then\r
      if not Valid(previous) then\r
        reason := -1;\r
      elseif generation < 1 or generation > identifierLimit or sourceRevision < 1\r
        or sourceRevision > identifierLimit or version < 1 or version > identifierLimit\r
        or generation <> previous.generation or sourceRevision <> previous.sourceRevision\r
        or version <> previous.version then\r
        reason := -2;\r
      elseif minimumMeasuredDescriptors < 1 or minimumMeasuredDescriptors > featureCapacity\r
        or not (minimumDistanceSquared >= 1e-12 and minimumDistanceSquared <= 4.0) then\r
        reason := -3;\r
      elseif not (descriptorCount >= 0.0 and descriptorCount <= featureCapacity\r
        and floor(descriptorCount) == descriptorCount) then\r
        reason := -4;\r
      else\r
        domainCount := integer(descriptorCount);\r
        // Complete preflight before adding even the first word. No enabled slot\r
        // outside the supplied domain, fractional mask or active poison can commit.\r
        for feature in 1:featureCapacity loop\r
          inputsValid := inputsValid and (descriptorEnabled[feature] == 0.0\r
            or descriptorEnabled[feature] == 1.0)\r
            and (feature <= domainCount or descriptorEnabled[feature] == 0.0);\r
          if feature <= domainCount and descriptorEnabled[feature] == 1.0 then\r
            (sample,sampleValid) := NormalizeVisualWord(descriptor[feature,:],1.0);\r
            inputsValid := inputsValid and sampleValid;\r
            samples[feature,:] := sample;\r
            measuredCount := measuredCount+1;\r
          end if;\r
        end for;\r
        if not inputsValid then\r
          reason := -4;\r
        elseif previous.ready then\r
          accepted := true; reason := 3;\r
        else\r
          // Fixed-bounded nearest representative admission, source raster order.\r
          // Identical samples count as measurements but do not consume more words.\r
          for feature in 1:featureCapacity loop\r
            if feature <= domainCount and descriptorEnabled[feature] == 1.0\r
              and pending.count < vocabularyCapacity then\r
              nearest := 5.0;\r
              for word in 1:vocabularyCapacity loop\r
                if word <= pending.count then\r
                  distance := 0.0;\r
                  for component in 1:descriptorSize loop\r
                    distance := distance+(samples[feature,component]-pending.words[word,component])\r
                      *(samples[feature,component]-pending.words[word,component]);\r
                  end for;\r
                  nearest := min(nearest,distance);\r
                end if;\r
              end for;\r
              if pending.count == 0 or nearest >= minimumDistanceSquared then\r
                pending.count := pending.count+1;\r
                pending.words[pending.count,:] := samples[feature,:];\r
                pending.enabled[pending.count] := 1.0;\r
              end if;\r
            end if;\r
          end for;\r
          pending.ready := measuredCount >= minimumMeasuredDescriptors and pending.count >= 1;\r
          next := pending; accepted := true; reason := if pending.ready then 1 else 2;\r
        end if;\r
      end if;\r
    end if;\r
  end Learn;\r
\r
  function Bootstrap\r
    input State previous;\r
    input Real descriptor[featureCapacity,descriptorSize];\r
    input Real descriptorEnabled[featureCapacity]; input Real descriptorCount;\r
    input Integer generation; input Integer sourceRevision; input Integer version;\r
    input Boolean requested = true;\r
    input Integer minimumMeasuredDescriptors = 8; input Real minimumDistanceSquared = 0.04;\r
    output State next; output Boolean accepted; output Integer reason;\r
  algorithm\r
    (next,accepted,reason) := Learn(previous,descriptor,descriptorEnabled,descriptorCount,\r
      generation,sourceRevision,version,requested,minimumMeasuredDescriptors,minimumDistanceSquared);\r
  end Bootstrap;\r
end RGBDVisualVocabulary;\r
`;export{e as default};
