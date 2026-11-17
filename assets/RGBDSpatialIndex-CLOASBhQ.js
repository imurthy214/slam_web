const n=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Collision-safe bounded spatial lookup. Storage and all search mathematics are\r
// Modelica-owned. Rebuild after pruning; inserted points keep their anchor.\r
package RGBDSpatialIndex\r
  constant Integer defaultBucketCount = 32768;\r
  constant Integer maximumBucketCount = 65536;\r
  constant Integer maximumSlotCount = 1000000;\r
  constant Real coordinateLimit = 1e6;\r
  constant Integer maximumIndexedRadius = 4;\r
\r
  function Cell\r
    input Real point[3];\r
    input Real voxelWidth;\r
    output Integer cell[3];\r
    output Boolean valid;\r
  algorithm\r
    cell := fill(0,3);\r
    valid := voxelWidth >= 0.001 and voxelWidth <= 10.0;\r
    for axis in 1:3 loop\r
      valid := valid and abs(point[axis]) <= coordinateLimit;\r
    end for;\r
    if valid then\r
      for axis in 1:3 loop\r
        cell[axis] := integer(floor(point[axis]/voxelWidth));\r
      end for;\r
    end if;\r
  end Cell;\r
\r
  function Bucket\r
    input Integer cell[3];\r
    input Integer bucketCount;\r
    output Integer bucket;\r
  protected\r
    Integer hash;\r
  algorithm\r
    // The caller certifies 1..maximumBucketCount buckets. Reduce each key\r
    // before multiplication: the intermediate fits even a signed 32-bit Integer.\r
    hash := 0;\r
    for axis in 1:3 loop\r
      hash := mod(31*hash+mod(cell[axis],bucketCount),bucketCount);\r
    end for;\r
    bucket := hash+1;\r
  end Bucket;\r
\r
  function Build\r
    input Real point[:,3];\r
    input Real occupied[size(point,1)];\r
    input Real voxelWidth;\r
    input Integer bucketCount = defaultBucketCount;\r
    output Integer head[bucketCount];\r
    output Integer link[size(point,1)];\r
    output Integer cell[size(point,1),3];\r
    output Integer freeNext[size(point,1)];\r
    output Integer firstFree;\r
    output Boolean valid;\r
  protected\r
    Integer slot;\r
    Integer bucket;\r
    Boolean pointValid;\r
  algorithm\r
    head := fill(0,bucketCount);\r
    link := fill(0,size(point,1));\r
    cell := fill(0,size(point,1),3);\r
    freeNext := fill(0,size(point,1));\r
    firstFree := 0;\r
    valid := size(point,1) > 0 and size(point,1) <= maximumSlotCount\r
      and bucketCount >= 1 and bucketCount <= maximumBucketCount\r
      and voxelWidth >= 0.001 and voxelWidth <= 10.0;\r
    if valid then\r
      // Reverse construction makes both chains and the free list ascending.\r
      // Storage uses array indices, with no lossy collision replacement.\r
      // Allocation and buffer reuse are compiler/runtime responsibilities.\r
      for reverse in 1:size(point,1) loop\r
        slot := size(point,1)+1-reverse;\r
        if occupied[slot] == 1.0 then\r
          (cell[slot,:],pointValid) := Cell(point[slot,:],voxelWidth);\r
          valid := valid and pointValid;\r
          if pointValid then\r
            bucket := Bucket(cell[slot,:],bucketCount);\r
            link[slot] := head[bucket];\r
            head[bucket] := slot;\r
          end if;\r
        elseif occupied[slot] == 0.0 then\r
          freeNext[slot] := firstFree;\r
          firstFree := slot;\r
        else\r
          valid := false;\r
        end if;\r
      end for;\r
    end if;\r
    if not valid then\r
      head := fill(0,bucketCount);\r
      link := fill(0,size(point,1));\r
      cell := fill(0,size(point,1),3);\r
      freeNext := fill(0,size(point,1));\r
      firstFree := 0;\r
    end if;\r
  end Build;\r
\r
  function Find\r
    input Real point[:,3];\r
    input Real occupied[size(point,1)];\r
    input Integer head[:];\r
    input Integer link[size(point,1)];\r
    input Integer cell[size(point,1),3];\r
    input Real candidate[3];\r
    input Real voxelWidth;\r
    input Real mergeRadius;\r
    input Boolean searchEnabled;\r
    output Integer duplicate;\r
    output Boolean valid;\r
    output Integer visited "Occupied point checks, for algorithmic profiling";\r
    output Boolean linearSearch;\r
  protected\r
    Integer queryCell[3];\r
    Integer neighbor[3];\r
    Integer radius;\r
    Integer neighborhood;\r
    Integer node;\r
    Integer traversed;\r
    Real difference[3];\r
    Boolean sameVoxel;\r
    Boolean matches;\r
  algorithm\r
    duplicate := 0;\r
    visited := 0;\r
    linearSearch := false;\r
    valid := true;\r
    queryCell := fill(0,3);\r
    neighbor := fill(0,3);\r
    difference := zeros(3);\r
    radius := 0;\r
    neighborhood := 0;\r
    node := 0;\r
    traversed := 0;\r
    sameVoxel := false;\r
    matches := false;\r
    if searchEnabled then\r
      (queryCell,valid) := Cell(candidate,voxelWidth);\r
      valid := valid and size(point,1) > 0 and size(point,1) <= maximumSlotCount\r
        and size(head,1) >= 1 and size(head,1) <= maximumBucketCount\r
        and mergeRadius >= 0.0 and mergeRadius <= 10.0;\r
      if valid then\r
        radius := integer(ceil(mergeRadius/voxelWidth));\r
        // Broad radii remain correct without iterating billions of empty cells.\r
        linearSearch := radius > maximumIndexedRadius;\r
        if not linearSearch then\r
          neighborhood := (2*radius+1)*(2*radius+1)*(2*radius+1);\r
          linearSearch := neighborhood >= size(point,1)\r
            or neighborhood >= size(head,1);\r
        end if;\r
        if linearSearch then\r
          for slot in 1:size(point,1) loop\r
            if occupied[slot] == 1.0 then\r
              visited := visited+1;\r
              difference := point[slot,:]-candidate;\r
              sameVoxel := floor(point[slot,1]/voxelWidth) == queryCell[1]\r
                and floor(point[slot,2]/voxelWidth) == queryCell[2]\r
                and floor(point[slot,3]/voxelWidth) == queryCell[3];\r
              matches := sameVoxel or difference*difference <= mergeRadius^2;\r
              if matches and duplicate == 0 then\r
                duplicate := slot;\r
              end if;\r
            end if;\r
          end for;\r
        else\r
          for dx in -radius:radius loop\r
            for dy in -radius:radius loop\r
              for dz in -radius:radius loop\r
                neighbor := queryCell+{dx,dy,dz};\r
                node := head[Bucket(neighbor,size(head,1))];\r
                traversed := 0;\r
                valid := valid and node >= 0 and node <= size(point,1);\r
                while node > 0 and valid loop\r
                  // Bound corrupt cycles and refuse invalid indices before reads.\r
                  if node > size(point,1) or traversed >= size(point,1) then\r
                    valid := false;\r
                  else\r
                    traversed := traversed+1;\r
                    visited := visited+1;\r
                    valid := occupied[node] == 1.0\r
                      and link[node] >= 0 and link[node] <= size(point,1);\r
                    if valid then\r
                      if cell[node,1] == neighbor[1] and cell[node,2] == neighbor[2]\r
                        and cell[node,3] == neighbor[3] then\r
                        difference := point[node,:]-candidate;\r
                        sameVoxel := neighbor[1] == queryCell[1]\r
                          and neighbor[2] == queryCell[2] and neighbor[3] == queryCell[3];\r
                        matches := sameVoxel or difference*difference <= mergeRadius^2;\r
                        if matches and (duplicate == 0 or node < duplicate) then\r
                          duplicate := node;\r
                        end if;\r
                      end if;\r
                      node := link[node];\r
                    end if;\r
                  end if;\r
                end while;\r
              end for;\r
            end for;\r
          end for;\r
        end if;\r
      end if;\r
    end if;\r
    if not valid then\r
      duplicate := 0;\r
    end if;\r
  end Find;\r
end RGBDSpatialIndex;\r
`;export{n as default};
