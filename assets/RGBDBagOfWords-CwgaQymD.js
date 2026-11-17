const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Appearance retrieval only; full descriptor matching and geometric registration\r
// must verify each loop proposal.\r
function NormalizeVisualWord\r
  input Real descriptor[descriptorSize];\r
  input Real enabled;\r
  output Real normalized[descriptorSize];\r
  output Boolean valid;\r
protected\r
  constant Integer descriptorSize = 49;\r
  Real mean;\r
  Real energy;\r
  Real value;\r
  Real scale;\r
algorithm\r
  normalized := zeros(descriptorSize);\r
  mean := 0.0;\r
  energy := 0.0;\r
  value := 0.0;\r
  scale := 1.0;\r
  valid := enabled >= 1.0 and enabled <= 1.0;\r
  for k in 1:descriptorSize loop\r
    valid := valid and abs(descriptor[k]) <= 1e3;\r
    value := if abs(descriptor[k]) <= 1e3 then descriptor[k] else 0.0;\r
    normalized[k] := value;\r
    mean := mean+value/descriptorSize;\r
  end for;\r
  for k in 1:descriptorSize loop\r
    normalized[k] := normalized[k]-mean;\r
    energy := energy+normalized[k]*normalized[k];\r
  end for;\r
  valid := valid and energy > 1e-12 and energy <= 1e9;\r
  scale := if valid then sqrt(max(energy,1e-12)) else 1.0;\r
  for k in 1:descriptorSize loop\r
    normalized[k] := if valid then normalized[k]/scale else 0.0;\r
  end for;\r
end NormalizeVisualWord;\r
\r
function RetrieveVisualWords\r
\r
  input Real descriptor[featureCapacity,descriptorSize];\r
  input Real descriptorEnabled[featureCapacity];\r
  input Real descriptorCount;\r
  input Real vocabulary[vocabularyCapacity,descriptorSize];\r
  input Real vocabularyEnabled[vocabularyCapacity];\r
  input Real vocabularyVersion;\r
  input Real previousHistogram[keyframeCapacity,vocabularyCapacity];\r
  input Real previousEnabled[keyframeCapacity];\r
  input Real previousKeyframeId[keyframeCapacity];\r
  input Real previousKeyframeTime[keyframeCapacity];\r
  input Real previousVersion;\r
  input Real previousNextSlot;\r
  input Real previousTime;\r
  input Real queryKeyframeId;\r
  input Real timeNow;\r
  input Real storeKeyframe;\r
  input Real resetRequested;\r
  input Real maximumWordDistanceSquared;\r
  input Real minimumAssignments;\r
  input Real minimumSimilarity;\r
  input Real minimumAge;\r
  input Real catalogSlot = 0.0 "Keyframe catalog slot this capture was stored in; 0 keeps the standalone ring";\r
  output Real wordIndex[featureCapacity];\r
  output Real histogram[vocabularyCapacity];\r
  output Real candidateId[candidateCapacity];\r
  output Real candidateSlot[candidateCapacity];\r
  output Real candidateScore[candidateCapacity];\r
  output Real nextHistogram[keyframeCapacity,vocabularyCapacity];\r
  output Real nextEnabled[keyframeCapacity];\r
  output Real nextKeyframeId[keyframeCapacity];\r
  output Real nextKeyframeTime[keyframeCapacity];\r
  output Real nextVersion;\r
  output Real nextSlot;\r
  output Real nextTime;\r
  output Real configurationValid;\r
  output Real vocabularyCount;\r
  output Real assignmentCount;\r
  output Real retrievalValid;\r
  output Real candidateCount;\r
  output Real stored;\r
  output Real invalidHistoryCount;\r
protected\r
  constant Integer featureCapacity = 350;\r
  constant Integer descriptorSize = 49;\r
  constant Integer vocabularyCapacity = 256;\r
  constant Integer keyframeCapacity = 64;\r
  constant Integer candidateCapacity = 4;\r
  Real words[vocabularyCapacity,descriptorSize];\r
  Real usableWord[vocabularyCapacity];\r
  Real sample[descriptorSize];\r
  Boolean sampleValid;\r
  Real distance;\r
  Real nearestDistanceSquared;\r
  Integer nearestWord;\r
  Real histogramMass;\r
  Real idf[vocabularyCapacity];\r
  Real documentFrequency;\r
  Real documentCount;\r
  Real queryNormSquared;\r
  Real weightedDot;\r
  Real candidateNormSquared;\r
  Real weighted;\r
  Real score[keyframeCapacity];\r
  Real selected[keyframeCapacity];\r
  Real bestScore;\r
  Real bestId;\r
  Integer bestSlot;\r
  Integer destination;\r
  Integer existingSlot;\r
  Boolean configuration;\r
  Boolean stateValid;\r
  Boolean resetHistory;\r
  Boolean historyValid;\r
  Boolean eligible;\r
algorithm\r
  wordIndex := zeros(featureCapacity);\r
  histogram := zeros(vocabularyCapacity);\r
  candidateId := zeros(candidateCapacity);\r
  candidateSlot := zeros(candidateCapacity);\r
  candidateScore := zeros(candidateCapacity);\r
  words := zeros(vocabularyCapacity,descriptorSize);\r
  usableWord := zeros(vocabularyCapacity);\r
  sample := zeros(descriptorSize);\r
  sampleValid := false;\r
  nextHistogram := zeros(keyframeCapacity,vocabularyCapacity);\r
  nextEnabled := zeros(keyframeCapacity);\r
  nextKeyframeId := zeros(keyframeCapacity);\r
  nextKeyframeTime := zeros(keyframeCapacity);\r
  idf := zeros(vocabularyCapacity);\r
  score := zeros(keyframeCapacity);\r
  selected := zeros(keyframeCapacity);\r
  nextVersion := 0.0;\r
  nextSlot := 1.0;\r
  nextTime := 0.0;\r
  configurationValid := 0.0;\r
  vocabularyCount := 0.0;\r
  assignmentCount := 0.0;\r
  retrievalValid := 0.0;\r
  candidateCount := 0.0;\r
  stored := 0.0;\r
  invalidHistoryCount := 0.0;\r
  distance := 0.0;\r
  nearestDistanceSquared := 5.0;\r
  nearestWord := 0;\r
  histogramMass := 0.0;\r
  documentFrequency := 0.0;\r
  documentCount := 0.0;\r
  queryNormSquared := 0.0;\r
  weightedDot := 0.0;\r
  candidateNormSquared := 0.0;\r
  weighted := 0.0;\r
  bestScore := -1.0;\r
  bestId := 1e9+1.0;\r
  bestSlot := 0;\r
  destination := 1;\r
  existingSlot := 0;\r
  historyValid := false;\r
  eligible := false;\r
  stateValid := previousVersion >= 0.0 and previousVersion <= 1e9 and floor(previousVersion) == previousVersion\r
    and previousNextSlot >= 1.0 and previousNextSlot <= keyframeCapacity and floor(previousNextSlot) == previousNextSlot\r
    and previousTime >= 0.0 and previousTime <= 1e9;\r
  configuration := descriptorCount >= 0.0 and descriptorCount <= featureCapacity and floor(descriptorCount) == descriptorCount\r
    and vocabularyVersion >= 1.0 and vocabularyVersion <= 1e9 and floor(vocabularyVersion) == vocabularyVersion\r
    and queryKeyframeId >= 0.0 and queryKeyframeId <= 1e9 and floor(queryKeyframeId) == queryKeyframeId\r
    and timeNow >= 0.0 and timeNow <= 1e9 and (timeNow >= previousTime or resetRequested == 1.0)\r
    and (storeKeyframe == 0.0 or storeKeyframe == 1.0) and (storeKeyframe == 0.0 or queryKeyframeId >= 1.0)\r
    and (resetRequested == 0.0 or resetRequested == 1.0) and (stateValid or resetRequested == 1.0)\r
    and maximumWordDistanceSquared >= 0.0 and maximumWordDistanceSquared <= 4.0\r
    and minimumAssignments >= 1.0 and minimumAssignments <= featureCapacity and floor(minimumAssignments) == minimumAssignments\r
    and minimumSimilarity >= 0.0 and minimumSimilarity <= 1.0 and minimumAge >= 0.0 and minimumAge <= 1e6\r
    and (catalogSlot == 0.0 or (catalogSlot >= 1.0 and catalogSlot <= keyframeCapacity and floor(catalogSlot) == catalogSlot));\r
  resetHistory := configuration and (resetRequested == 1.0 or vocabularyVersion <> previousVersion);\r
  nextVersion := if configuration then vocabularyVersion else if stateValid then previousVersion else 0.0;\r
  nextSlot := if stateValid and not resetHistory then previousNextSlot else 1.0;\r
  nextTime := if configuration then timeNow else if stateValid then previousTime else 0.0;\r
  // Validate retained histograms before retrieval.\r
  for frame in 1:keyframeCapacity loop\r
    histogramMass := 0.0;\r
    historyValid := stateValid and not resetHistory and previousEnabled[frame] == 1.0\r
      and previousKeyframeId[frame] >= 1.0 and previousKeyframeId[frame] <= 1e9\r
      and floor(previousKeyframeId[frame]) == previousKeyframeId[frame]\r
      and previousKeyframeTime[frame] >= 0.0 and previousKeyframeTime[frame] <= previousTime;\r
    for word in 1:vocabularyCapacity loop\r
      historyValid := historyValid and previousHistogram[frame,word] >= 0.0 and previousHistogram[frame,word] <= 1.0;\r
      histogramMass := histogramMass+(if previousHistogram[frame,word] >= 0.0 and previousHistogram[frame,word] <= 1.0\r
        then previousHistogram[frame,word] else 0.0);\r
    end for;\r
    historyValid := historyValid and abs(histogramMass-1.0) <= 1e-6;\r
    invalidHistoryCount := invalidHistoryCount+(if not resetHistory and previousEnabled[frame] <> 0.0 and not historyValid then 1.0 else 0.0);\r
    nextEnabled[frame] := if historyValid then 1.0 else 0.0;\r
    nextKeyframeId[frame] := if historyValid then previousKeyframeId[frame] else 0.0;\r
    nextKeyframeTime[frame] := if historyValid then previousKeyframeTime[frame] else 0.0;\r
    for word in 1:vocabularyCapacity loop\r
      nextHistogram[frame,word] := if historyValid then previousHistogram[frame,word] else 0.0;\r
    end for;\r
    documentCount := documentCount+nextEnabled[frame];\r
    if nextEnabled[frame] == 1.0 and nextKeyframeId[frame] == queryKeyframeId and existingSlot == 0 then\r
      existingSlot := frame;\r
    end if;\r
  end for;\r
  for word in 1:vocabularyCapacity loop\r
    (sample,sampleValid) := NormalizeVisualWord(vocabulary[word,:],if configuration then vocabularyEnabled[word] else 0.0);\r
    words[word,:] := sample;\r
    usableWord[word] := if sampleValid then 1.0 else 0.0;\r
    vocabularyCount := vocabularyCount+usableWord[word];\r
  end for;\r
  // Nearest visual word; distance ties keep the lower index.\r
  for feature in 1:featureCapacity loop\r
    (sample,sampleValid) := NormalizeVisualWord(descriptor[feature,:],\r
      if configuration and feature <= descriptorCount then descriptorEnabled[feature] else 0.0);\r
    nearestDistanceSquared := 5.0;\r
    nearestWord := 0;\r
    for word in 1:vocabularyCapacity loop\r
      if sampleValid and usableWord[word] == 1.0 then\r
        distance := 0.0;\r
        for k in 1:descriptorSize loop\r
          distance := distance+(sample[k]-words[word,k])*(sample[k]-words[word,k]);\r
        end for;\r
        if distance < nearestDistanceSquared then\r
          nearestDistanceSquared := distance;\r
          nearestWord := word;\r
        end if;\r
      end if;\r
    end for;\r
    if nearestWord > 0 and nearestDistanceSquared <= maximumWordDistanceSquared then\r
      wordIndex[feature] := nearestWord;\r
      histogram[nearestWord] := histogram[nearestWord]+1.0;\r
      assignmentCount := assignmentCount+1.0;\r
    end if;\r
  end for;\r
  // TF-IDF query weights.\r
  for word in 1:vocabularyCapacity loop\r
    histogram[word] := if assignmentCount > 0.0 then histogram[word]/max(assignmentCount,1.0) else 0.0;\r
    documentFrequency := 0.0;\r
    for frame in 1:keyframeCapacity loop\r
      documentFrequency := documentFrequency+(if nextEnabled[frame] == 1.0 and nextHistogram[frame,word] > 0.0 then 1.0 else 0.0);\r
    end for;\r
    idf[word] := 1.0+log((1.0+documentCount)/(1.0+documentFrequency));\r
    weighted := histogram[word]*idf[word];\r
    queryNormSquared := queryNormSquared+weighted*weighted;\r
  end for;\r
  configurationValid := if configuration then 1.0 else 0.0;\r
  retrievalValid := if configuration and vocabularyCount > 0.0\r
    and assignmentCount >= minimumAssignments and queryNormSquared > 1e-12 then 1.0 else 0.0;\r
  // Cosine similarity against eligible retained keyframes.\r
  for frame in 1:keyframeCapacity loop\r
    eligible := retrievalValid == 1.0 and nextEnabled[frame] == 1.0\r
      and timeNow-nextKeyframeTime[frame] >= minimumAge and queryKeyframeId <> nextKeyframeId[frame];\r
    weightedDot := 0.0;\r
    candidateNormSquared := 0.0;\r
    for word in 1:vocabularyCapacity loop\r
      weighted := nextHistogram[frame,word]*idf[word];\r
      candidateNormSquared := candidateNormSquared+weighted*weighted;\r
      weightedDot := weightedDot+weighted*histogram[word]*idf[word];\r
    end for;\r
    score[frame] := if eligible and candidateNormSquared > 1e-12\r
      then min(1.0,max(0.0,weightedDot/sqrt(max(queryNormSquared*candidateNormSquared,1e-24)))) else -1.0;\r
  end for;\r
  for rank in 1:candidateCapacity loop\r
    bestScore := -1.0;\r
    bestId := 1e9+1.0;\r
    bestSlot := 0;\r
    for frame in 1:keyframeCapacity loop\r
      if selected[frame] == 0.0 and score[frame] >= minimumSimilarity\r
        and (score[frame] > bestScore or (score[frame] == bestScore and\r
          (nextKeyframeId[frame] < bestId or (nextKeyframeId[frame] == bestId and frame < bestSlot)))) then\r
        bestScore := score[frame];\r
        bestId := nextKeyframeId[frame];\r
        bestSlot := frame;\r
      end if;\r
    end for;\r
    if bestSlot > 0 then\r
      candidateId[rank] := bestId;\r
      candidateSlot[rank] := bestSlot;\r
      candidateScore[rank] := bestScore;\r
      selected[bestSlot] := 1.0;\r
      candidateCount := candidateCount+1.0;\r
    end if;\r
  end for;\r
  // Query history before inserting the geometrically admitted keyframe.\r
  // Beside a retention catalog the histogram follows the catalog's stored\r
  // slot (Store chooses it); alone, it keeps its own ring.\r
  destination := if existingSlot > 0 then existingSlot\r
    else if catalogSlot >= 1.0 and catalogSlot <= keyframeCapacity then integer(catalogSlot)\r
    else if nextSlot >= 1.0 and nextSlot <= keyframeCapacity then integer(nextSlot) else 1;\r
  stored := if retrievalValid == 1.0 and storeKeyframe == 1.0 then 1.0 else 0.0;\r
  if stored == 1.0 then\r
    nextHistogram[destination,:] := histogram;\r
    nextEnabled[destination] := 1.0;\r
    nextKeyframeId[destination] := queryKeyframeId;\r
    nextKeyframeTime[destination] := timeNow;\r
    nextSlot := if existingSlot > 0 then nextSlot else if destination < keyframeCapacity then destination+1.0 else 1.0;\r
  end if;\r
end RetrieveVisualWords;\r
\r
model RGBDBagOfWords\r
\r
  constant Integer featureCapacity = 350;\r
  constant Integer descriptorSize = 49;\r
  constant Integer vocabularyCapacity = 256;\r
  constant Integer keyframeCapacity = 64;\r
  constant Integer candidateCapacity = 4;\r
  parameter Real maximumWordDistanceSquared = 0.8;\r
  parameter Real minimumAssignments = 8.0;\r
  parameter Real minimumSimilarity = 0.35;\r
  parameter Real minimumAge = 2.0 "Simulation seconds; independent of frame rate";\r
  input Real descriptor[featureCapacity,descriptorSize] = zeros(featureCapacity,descriptorSize);\r
  input Real descriptorEnabled[featureCapacity] = zeros(featureCapacity);\r
  input Real descriptorCount = 0.0;\r
  input Real vocabulary[vocabularyCapacity,descriptorSize] = zeros(vocabularyCapacity,descriptorSize);\r
  input Real vocabularyEnabled[vocabularyCapacity] = zeros(vocabularyCapacity);\r
  input Real vocabularyVersion = 1.0;\r
  input Real previousHistogram[keyframeCapacity,vocabularyCapacity] = zeros(keyframeCapacity,vocabularyCapacity);\r
  input Real previousEnabled[keyframeCapacity] = zeros(keyframeCapacity);\r
  input Real previousKeyframeId[keyframeCapacity] = zeros(keyframeCapacity);\r
  input Real previousKeyframeTime[keyframeCapacity] = zeros(keyframeCapacity);\r
  input Real previousVersion = 0.0;\r
  input Real previousNextSlot = 1.0;\r
  input Real previousTime = 0.0;\r
  input Real queryKeyframeId = 0.0;\r
  input Real timeNow = 0.0;\r
  input Real storeKeyframe = 0.0;\r
  input Real resetRequested = 0.0;\r
  input Real catalogSlot = 0.0 "Keyframe catalog stored slot to follow; 0 keeps the standalone ring";\r
  output Real wordIndex[featureCapacity];\r
  output Real histogram[vocabularyCapacity];\r
  output Real candidateId[candidateCapacity];\r
  output Real candidateSlot[candidateCapacity];\r
  output Real candidateScore[candidateCapacity];\r
  output Real nextHistogram[keyframeCapacity,vocabularyCapacity];\r
  output Real nextEnabled[keyframeCapacity];\r
  output Real nextKeyframeId[keyframeCapacity];\r
  output Real nextKeyframeTime[keyframeCapacity];\r
  output Real nextVersion;\r
  output Real nextSlot;\r
  output Real nextTime;\r
  output Real configurationValid;\r
  output Real vocabularyCount;\r
  output Real assignmentCount;\r
  output Real retrievalValid;\r
  output Real candidateCount;\r
  output Real stored;\r
  output Real invalidHistoryCount;\r
equation\r
  (wordIndex,histogram,candidateId,candidateSlot,candidateScore,nextHistogram,nextEnabled,nextKeyframeId,nextKeyframeTime,\r
    nextVersion,nextSlot,nextTime,configurationValid,vocabularyCount,assignmentCount,retrievalValid,candidateCount,stored,invalidHistoryCount) =\r
    RetrieveVisualWords(descriptor,descriptorEnabled,descriptorCount,vocabulary,vocabularyEnabled,vocabularyVersion,\r
      previousHistogram,previousEnabled,previousKeyframeId,previousKeyframeTime,previousVersion,previousNextSlot,previousTime,\r
      queryKeyframeId,timeNow,storeKeyframe,resetRequested,maximumWordDistanceSquared,minimumAssignments,minimumSimilarity,minimumAge,catalogSlot);\r
end RGBDBagOfWords;\r
`;export{e as default};
