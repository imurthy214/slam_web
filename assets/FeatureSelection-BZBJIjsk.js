const n=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Ranked raster selection with stable ties and square suppression.\r
function SelectRasterFeatures\r
  input Real scores[:];\r
  input Integer width;\r
  input Integer height;\r
  input Integer capacity;\r
  input Integer minimumBorder;\r
  input Real settings[8]; // absolute,relative,rankScale,radius,cap,spacing,border,start\r
  input Boolean grid;\r
  input Boolean enabled = true "False between camera acquisitions";\r
  output Real features[capacity,3];\r
  output Real count;\r
  output Real valid;\r
protected\r
  Integer candidateIndex[size(scores,1)];\r
  Real candidateRank[size(scores,1)];\r
  Boolean occupied[size(scores,1)];\r
  Integer candidateCount;\r
  Integer radius;\r
  Integer featureLimit;\r
  Integer sampleSpacing;\r
  Integer border;\r
  Integer firstPixel;\r
  Integer x;\r
  Integer y;\r
  Integer index;\r
  Integer position;\r
  Integer root;\r
  Integer child;\r
  Integer heapSize;\r
  Integer temporaryIndex;\r
  Real temporaryRank;\r
  Real scaled;\r
  Real low;\r
  Real fraction;\r
  Real rank;\r
  Real maximum;\r
  Real threshold;\r
  Real guard;\r
  Boolean aboveThreshold;\r
  Boolean sifting;\r
algorithm\r
  features := zeros(capacity,3);\r
  count := 0.0;\r
  valid := if width > 0 and height > 0 and size(scores,1) == width*height and capacity > 0 and\r
    settings[1] >= 0.0 and settings[1] <= 255.0 and\r
    settings[2] >= 0.0 and settings[2] <= 1.0 and\r
    settings[3] >= 1.0 and settings[3] <= 1e12 and\r
    settings[4] >= 0.0 and settings[4] <= 16.0 and floor(settings[4]) == settings[4] and\r
    settings[5] >= 1.0 and settings[5] <= width*height and settings[5] <= capacity and floor(settings[5]) == settings[5] and\r
    settings[6] >= 1.0 and settings[6] <= width and floor(settings[6]) == settings[6] and\r
    settings[7] >= minimumBorder and settings[7] <= floor((height-1)/2.0) and floor(settings[7]) == settings[7] and\r
    settings[8] >= settings[7] and settings[8] < height-settings[7] and floor(settings[8]) == settings[8] and\r
    (not grid or (settings[1] == 0.0 and settings[2] == 0.0 and settings[3] == 1.0 and settings[4] == 0.0))\r
    then 1.0 else 0.0;\r
  // Protected conversion is needed even for rejected nonfinite settings.\r
  radius := if valid > 0.0 then integer(settings[4]) else 0;\r
  featureLimit := if valid > 0.0 then integer(settings[5]) else 1;\r
  sampleSpacing := if valid > 0.0 then integer(settings[6]) else 1;\r
  border := if valid > 0.0 then integer(settings[7]) else 0;\r
  firstPixel := if valid > 0.0 then integer(settings[8]) else 0;\r
  candidateCount := 0;\r
  maximum := 0.0;\r
  threshold := 0.0;\r
  guard := 0.0;\r
  if valid > 0.0 and enabled then\r
    candidateIndex := fill(0,size(scores,1));\r
    candidateRank := zeros(size(scores,1));\r
    occupied := fill(false,size(scores,1));\r
    if grid then\r
      // Grid mode reads only visited pixels.\r
      y := firstPixel;\r
      while y < height-border and count < featureLimit loop\r
        x := firstPixel;\r
        while x < width-border and count < featureLimit loop\r
          index := y*width+x+1;\r
          if abs(scores[index]) <= 1.7976931348623157e308 then\r
            count := count+1.0;\r
            features[integer(count),1] := x;\r
            features[integer(count),2] := y;\r
            features[integer(count),3] := scores[index];\r
          else\r
            valid := 0.0;\r
          end if;\r
          x := x+sampleSpacing;\r
        end while;\r
        y := y+sampleSpacing;\r
      end while;\r
    else\r
      // Validate every score, including pixels outside the candidate border.\r
      for i in 1:size(scores,1) loop\r
        if abs(scores[i]*settings[3]) <= 9007199254740991.0 then\r
          maximum := max(maximum,scores[i]);\r
        else\r
          valid := 0.0;\r
        end if;\r
      end for;\r
      threshold := max(settings[1],maximum*settings[2]);\r
      guard := floor(threshold*settings[3])-1.0;\r
      if valid > 0.0 then\r
        y := firstPixel;\r
        while y < height-border loop\r
          x := firstPixel;\r
          while x < width-border loop\r
            index := y*width+x+1;\r
            scaled := scores[index]*settings[3];\r
            low := floor(scaled);\r
            fraction := scaled-low;\r
            rank := if fraction < 0.5 then low else if fraction > 0.5 then low+1.0\r
              else if low-floor(low/2.0)*2.0 == 0.0 then low else low+1.0;\r
            if rank >= guard then\r
              candidateCount := candidateCount+1;\r
              candidateIndex[candidateCount] := index;\r
              candidateRank[candidateCount] := rank;\r
            end if;\r
            x := x+sampleSpacing;\r
          end while;\r
          y := y+sampleSpacing;\r
        end while;\r
        // Heap order: ascending rank, descending raster index. Read in reverse.\r
        heapSize := candidateCount;\r
        for build in 1:candidateCount loop\r
          root := candidateCount-build+1;\r
          sifting := true;\r
          while root <= div(heapSize,2) and sifting loop\r
            child := 2*root;\r
            if child < heapSize then\r
              if candidateRank[child+1] > candidateRank[child] or\r
                (candidateRank[child+1] == candidateRank[child] and candidateIndex[child+1] < candidateIndex[child]) then\r
                child := child+1;\r
              end if;\r
            end if;\r
            if candidateRank[child] > candidateRank[root] or\r
              (candidateRank[child] == candidateRank[root] and candidateIndex[child] < candidateIndex[root]) then\r
              temporaryRank := candidateRank[root];\r
              temporaryIndex := candidateIndex[root];\r
              candidateRank[root] := candidateRank[child];\r
              candidateIndex[root] := candidateIndex[child];\r
              candidateRank[child] := temporaryRank;\r
              candidateIndex[child] := temporaryIndex;\r
              root := child;\r
            else\r
              sifting := false;\r
            end if;\r
          end while;\r
        end for;\r
        for remove in 1:candidateCount loop\r
          heapSize := candidateCount-remove+1;\r
          temporaryRank := candidateRank[heapSize];\r
          temporaryIndex := candidateIndex[heapSize];\r
          candidateRank[heapSize] := candidateRank[1];\r
          candidateIndex[heapSize] := candidateIndex[1];\r
          candidateRank[1] := temporaryRank;\r
          candidateIndex[1] := temporaryIndex;\r
          heapSize := heapSize-1;\r
          root := 1;\r
          sifting := true;\r
          while root <= div(heapSize,2) and sifting loop\r
            child := 2*root;\r
            if child < heapSize then\r
              if candidateRank[child+1] > candidateRank[child] or\r
                (candidateRank[child+1] == candidateRank[child] and candidateIndex[child+1] < candidateIndex[child]) then\r
                child := child+1;\r
              end if;\r
            end if;\r
            if candidateRank[child] > candidateRank[root] or\r
              (candidateRank[child] == candidateRank[root] and candidateIndex[child] < candidateIndex[root]) then\r
              temporaryRank := candidateRank[root];\r
              temporaryIndex := candidateIndex[root];\r
              candidateRank[root] := candidateRank[child];\r
              candidateIndex[root] := candidateIndex[child];\r
              candidateRank[child] := temporaryRank;\r
              candidateIndex[child] := temporaryIndex;\r
              root := child;\r
            else\r
              sifting := false;\r
            end if;\r
          end while;\r
        end for;\r
        aboveThreshold := true;\r
        for candidate in 1:candidateCount loop\r
          position := candidateCount-candidate+1;\r
          index := candidateIndex[position];\r
          // Preserve the original early stop on raw score, before occupancy.\r
          if scores[index] < threshold then\r
            aboveThreshold := false;\r
          end if;\r
          if aboveThreshold and count < featureLimit and not occupied[index] then\r
            x := mod(index-1,width);\r
            y := div(index-1,width);\r
            count := count+1.0;\r
            features[integer(count),1] := x;\r
            features[integer(count),2] := y;\r
            features[integer(count),3] := scores[index];\r
            for yy in max(border,y-radius):min(height-border-1,y+radius) loop\r
              for xx in max(border,x-radius):min(width-border-1,x+radius) loop\r
                occupied[yy*width+xx+1] := true;\r
              end for;\r
            end for;\r
          end if;\r
        end for;\r
      end if;\r
    end if;\r
  end if;\r
  if valid <= 0.0 then\r
    features := zeros(capacity,3);\r
    count := 0.0;\r
  end if;\r
end SelectRasterFeatures;\r
\r
model FeatureSelection\r
\r
  parameter Integer width = 160;\r
  parameter Integer height = 90;\r
  // Storage covers the full editable feature limit.\r
  parameter Integer capacity = 14400;\r
  // Structural loop bound; presets may modify it before compilation.\r
  parameter Integer minimumBorder = 0 annotation(Evaluate = true);\r
  parameter Boolean grid = false;\r
  input Boolean enabled = true;\r
  input Real scores[width*height] = zeros(width*height);\r
  input Real settings[8] = {1e-9,0.01,1e12,3.0,240.0,1.0,0.0,0.0};\r
  output Real features[capacity,3];\r
  output Real count;\r
  output Real valid;\r
equation\r
  (features,count,valid) = SelectRasterFeatures(scores,width,height,capacity,minimumBorder,settings,grid,enabled);\r
end FeatureSelection;\r
\r
model GridFeatureSelection\r
\r
  extends FeatureSelection(capacity=14400,grid=true,settings={0.0,0.0,1.0,0.0,14400.0,6.0,5.0,5.0});\r
end GridFeatureSelection;\r
\r
model FastFeatureSelection\r
\r
  extends FeatureSelection(minimumBorder=3,settings={18.0,0.0,1e8,3.0,240.0,1.0,3.0,3.0});\r
end FastFeatureSelection;\r
`;export{n as default};
