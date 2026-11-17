const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Full-capacity selected covariance of the FINAL undamped pose-graph linearization.\r
// Exact-real variational/tree bound; ordinary floating evaluation is explicitly\r
// not an outward-rounded certificate. No optimizer damping is statistical noise.\r
package ModelicaPoseGraphCovariance\r
\r
  constant Integer nodeCapacity=64;\r
  constant Integer edgeCapacity=256;\r
  constant Integer poseDimension=6;\r
  constant Integer selectedDimension=12;\r
  constant Integer maximumIterations=96;\r
\r
  record Result\r
    Real upper[selectedDimension,selectedDimension];\r
    Real lower[selectedDimension,selectedDimension];\r
    Real residualUpper[selectedDimension,selectedDimension];\r
    Boolean accepted;\r
    Integer status "0 idle;1 numerical result;-1 config/selection;-2 graph;-3 tree/pivot;-4 chart;-5 arithmetic";\r
    Integer iterations[selectedDimension];\r
    Boolean converged[selectedDimension];\r
    Real residualNorm[selectedDimension];\r
    Integer treeEdges;\r
    Integer activeNodes;\r
    Boolean roundoffCertified "Always false: no directed-rounding enclosure in this profile";\r
  end Result;\r
\r
  record Tree\r
    Integer parent[nodeCapacity];\r
    Integer order[nodeCapacity];\r
    Integer count;\r
    Real childInverse[nodeCapacity,poseDimension,poseDimension];\r
    Real parentJacobian[nodeCapacity,poseDimension,poseDimension];\r
    Real weightFactor[nodeCapacity,poseDimension,poseDimension];\r
    Boolean valid;\r
  end Tree;\r
\r
  record Coarse\r
    Real basis[nodeCapacity,poseDimension,poseDimension];\r
    Real product[nodeCapacity,poseDimension,poseDimension];\r
    Real factor[poseDimension,poseDimension];\r
    Boolean valid;\r
  end Coarse;\r
\r
  function EmptyCoarse\r
    output Coarse coarse;\r
  algorithm\r
    coarse.basis:=zeros(nodeCapacity,poseDimension,poseDimension);\r
    coarse.product:=zeros(nodeCapacity,poseDimension,poseDimension);\r
    coarse.factor:=zeros(poseDimension,poseDimension); coarse.valid:=false;\r
  end EmptyCoarse;\r
\r
  function Empty\r
    output Result result;\r
  algorithm\r
    result.upper:=zeros(selectedDimension,selectedDimension);\r
    result.lower:=zeros(selectedDimension,selectedDimension);\r
    result.residualUpper:=zeros(selectedDimension,selectedDimension);\r
    result.accepted:=false; result.status:=0;\r
    result.iterations:=fill(0,selectedDimension); result.converged:=fill(false,selectedDimension);\r
    result.residualNorm:=zeros(selectedDimension); result.treeEdges:=0; result.activeNodes:=0;\r
    result.roundoffCertified:=false;\r
  end Empty;\r
\r
  // Checked small general inverse. Child Jacobians are not SPD matrices.\r
  // The inverse closure is a numerical rank diagnostic, not rounded interval proof.\r
  function Inverse6\r
    input Real A[poseDimension,poseDimension];\r
    output Real inverse[poseDimension,poseDimension];\r
    output Boolean valid;\r
  protected\r
    Real work[poseDimension,poseDimension]; Real scale; Real pivot; Real swap;\r
    Real largest; Real factor; Real closure; Integer selected;\r
  algorithm\r
    inverse:=identity(poseDimension); work:=A; scale:=0.0; valid:=true;\r
    pivot:=0.0; swap:=0.0; largest:=0.0; factor:=0.0; closure:=0.0; selected:=1;\r
    for row in 1:poseDimension loop\r
      for column in 1:poseDimension loop\r
        valid:=valid and abs(A[row,column])<=1e18;\r
        scale:=max(scale,abs(A[row,column]));\r
      end for;\r
    end for;\r
    valid:=valid and scale>1e-12;\r
    for column in 1:poseDimension loop\r
      if valid then\r
        selected:=column; largest:=abs(work[column,column]);\r
        for row in 1:poseDimension loop\r
          if row>column and abs(work[row,column])>largest then\r
            selected:=row; largest:=abs(work[row,column]);\r
          end if;\r
        end for;\r
        valid:=largest>1e-12*scale and largest<=1e18;\r
        if valid then\r
          for k in 1:poseDimension loop\r
            swap:=work[column,k]; work[column,k]:=work[selected,k]; work[selected,k]:=swap;\r
            swap:=inverse[column,k]; inverse[column,k]:=inverse[selected,k]; inverse[selected,k]:=swap;\r
          end for;\r
          pivot:=work[column,column];\r
          for k in 1:poseDimension loop\r
            work[column,k]:=work[column,k]/pivot; inverse[column,k]:=inverse[column,k]/pivot;\r
          end for;\r
          for row in 1:poseDimension loop\r
            if row<>column then\r
              factor:=work[row,column];\r
              for k in 1:poseDimension loop\r
                work[row,k]:=work[row,k]-factor*work[column,k];\r
                inverse[row,k]:=inverse[row,k]-factor*inverse[column,k];\r
              end for;\r
            end if;\r
          end for;\r
        end if;\r
      end if;\r
    end for;\r
    for row in 1:poseDimension loop\r
      for column in 1:poseDimension loop\r
        closure:=sum(inverse[row,k]*A[k,column] for k in 1:poseDimension)\r
          -(if row==column then 1.0 else 0.0);\r
        valid:=valid and abs(closure)<1e-8 and abs(inverse[row,column])<=1e18;\r
      end for;\r
    end for;\r
    if not valid then inverse:=zeros(poseDimension,poseDimension); end if;\r
  end Inverse6;\r
\r
  function BuildTree\r
    input Real nodeMask[nodeCapacity]; input Real edgeMask[edgeCapacity];\r
    input Integer source[edgeCapacity]; input Integer target[edgeCapacity];\r
    input Real Ji[edgeCapacity,poseDimension,poseDimension];\r
    input Real Jj[edgeCapacity,poseDimension,poseDimension];\r
    input Real information[edgeCapacity,poseDimension,poseDimension];\r
    output Tree tree;\r
  protected\r
    Boolean reached[nodeCapacity]; Boolean layer[nodeCapacity]; Boolean inverseValid; Boolean weightValid;\r
    Integer parent; Integer child; Real childJacobian[poseDimension,poseDimension];\r
    Real parentJacobian[poseDimension,poseDimension]; Real inverse[poseDimension,poseDimension];\r
    Real weight[poseDimension,poseDimension];\r
  algorithm\r
    tree.parent:=fill(0,nodeCapacity); tree.order:=fill(1,nodeCapacity); tree.count:=0;\r
    tree.childInverse:=zeros(nodeCapacity,poseDimension,poseDimension);\r
    tree.parentJacobian:=zeros(nodeCapacity,poseDimension,poseDimension);\r
    tree.weightFactor:=zeros(nodeCapacity,poseDimension,poseDimension); tree.valid:=true;\r
    reached:=fill(false,nodeCapacity); reached[1]:=true; layer:=reached; parent:=1; child:=1;\r
    childJacobian:=zeros(poseDimension,poseDimension); parentJacobian:=childJacobian;\r
    inverse:=childJacobian; weight:=childJacobian; inverseValid:=false; weightValid:=false;\r
    for pass in 1:nodeCapacity loop\r
      // Only vertices reached before this pass can parent new vertices. Keeping\r
      // the discovery layer fixed avoids selecting an entire long chain before\r
      // any shortcut edge is examined. Original edge order breaks equal-depth\r
      // ties; every factor remains in the full undamped information operator.\r
      layer:=reached;\r
      for edge in 1:edgeCapacity loop\r
        if tree.valid and edgeMask[edge]==1.0 then\r
          parent:=1; child:=1;\r
          if layer[source[edge]] and not reached[target[edge]] then\r
            parent:=source[edge]; child:=target[edge];\r
            childJacobian:=Jj[edge,:,:]; parentJacobian:=Ji[edge,:,:];\r
          elseif layer[target[edge]] and not reached[source[edge]] then\r
            parent:=target[edge]; child:=source[edge];\r
            childJacobian:=Ji[edge,:,:]; parentJacobian:=Jj[edge,:,:];\r
          end if;\r
          if child>1 then\r
            (inverse,inverseValid):=Inverse6(childJacobian);\r
            (weight,weightValid):=PGCholesky(information[edge,:,:],1e-10);\r
            tree.valid:=inverseValid and weightValid and tree.count<nodeCapacity-1;\r
            if tree.valid then\r
              reached[child]:=true; tree.count:=tree.count+1;\r
              tree.order[tree.count]:=child; tree.parent[child]:=parent;\r
              tree.childInverse[child,:,:]:=inverse;\r
              tree.parentJacobian[child,:,:]:=parentJacobian;\r
              tree.weightFactor[child,:,:]:=weight;\r
            end if;\r
          end if;\r
        end if;\r
      end for;\r
    end for;\r
    for node in 1:nodeCapacity loop tree.valid:=tree.valid and (nodeMask[node]==0.0 or reached[node]); end for;\r
  end BuildTree;\r
\r
  // T' q=f, reversed discovery order, retaining each edge's original direction.\r
  function Backward\r
    input Real f[nodeCapacity,poseDimension]; input Tree tree;\r
    output Real q[nodeCapacity,poseDimension];\r
  protected\r
    Real pending[nodeCapacity,poseDimension]; Integer node; Integer parent;\r
  algorithm\r
    q:=zeros(nodeCapacity,poseDimension); pending:=f; pending[1,:]:=zeros(poseDimension);\r
    node:=1; parent:=1;\r
    for reverseIndex in 1:nodeCapacity loop\r
      if reverseIndex<=tree.count then\r
        node:=tree.order[tree.count+1-reverseIndex]; parent:=tree.parent[node];\r
        q[node,:]:=transpose(tree.childInverse[node,:,:])*pending[node,:];\r
        if parent>1 then pending[parent,:]:=pending[parent,:]-transpose(tree.parentJacobian[node,:,:])*q[node,:]; end if;\r
      end if;\r
    end for;\r
  end Backward;\r
\r
  function TreeSolve\r
    input Real f[nodeCapacity,poseDimension]; input Tree tree;\r
    output Real x[nodeCapacity,poseDimension];\r
  protected\r
    Real q[nodeCapacity,poseDimension]; Real w[poseDimension]; Integer node;\r
  algorithm\r
    q:=Backward(f,tree); x:=zeros(nodeCapacity,poseDimension); w:=zeros(poseDimension); node:=1;\r
    for index in 1:nodeCapacity loop\r
      if index<=tree.count then\r
        node:=tree.order[index]; w:=PGSolveBlock(tree.weightFactor[node,:,:],q[node,:]);\r
        x[node,:]:=tree.childInverse[node,:,:]*(w-tree.parentJacobian[node,:,:]*x[tree.parent[node],:]);\r
      end if;\r
    end for;\r
  end TreeSolve;\r
\r
  // Six global rigid-motion directions in the graph's world-p/right-local-angle\r
  // chart. The root and inactive rows stay zero; column normalization changes\r
  // the basis, not its span. H is the same full undamped operator used by PCG.\r
  function BuildCoarse\r
    input Real position[nodeCapacity,3]; input Real rotation[nodeCapacity,3,3];\r
    input Real nodeMask[nodeCapacity]; input Real edgeMask[edgeCapacity];\r
    input Integer source[edgeCapacity]; input Integer target[edgeCapacity];\r
    input Real Ji[edgeCapacity,poseDimension,poseDimension];\r
    input Real Jj[edgeCapacity,poseDimension,poseDimension];\r
    input Real information[edgeCapacity,poseDimension,poseDimension];\r
    output Coarse coarse;\r
  protected\r
    Real skew[3,3]; Real square; Real E[poseDimension,poseDimension]; Real value;\r
    Boolean factorValid;\r
  algorithm\r
    coarse:=EmptyCoarse(); skew:=zeros(3,3); square:=0.0;\r
    E:=zeros(poseDimension,poseDimension); value:=0.0; factorValid:=false; coarse.valid:=true;\r
    for node in 1:nodeCapacity loop\r
      if node>1 and nodeMask[node]==1.0 then\r
        skew:=PGSkew(position[node,:]-position[1,:]);\r
        for axis in 1:3 loop\r
          coarse.basis[node,axis,axis]:=1.0;\r
          for column in 1:3 loop\r
            coarse.basis[node,axis,column+3]:=-skew[axis,column];\r
            coarse.basis[node,axis+3,column+3]:=rotation[node,column,axis];\r
          end for;\r
        end for;\r
      end if;\r
    end for;\r
    for column in 1:poseDimension loop\r
      square:=PGDot(coarse.basis[:,:,column],coarse.basis[:,:,column]);\r
      coarse.valid:=coarse.valid and square>1e-24 and square<=1e100;\r
      if coarse.valid then coarse.basis[:,:,column]:=coarse.basis[:,:,column]/sqrt(square); end if;\r
    end for;\r
    if coarse.valid then\r
      for column in 1:poseDimension loop\r
        coarse.product[:,:,column]:=PGNormalProduct(coarse.basis[:,:,column],nodeMask,edgeMask,\r
          source,target,Ji,Jj,information,zeros(nodeCapacity,poseDimension),0.0);\r
      end for;\r
      for row in 1:poseDimension loop\r
        for column in 1:poseDimension loop\r
          value:=0.5*(PGDot(coarse.basis[:,:,row],coarse.product[:,:,column])\r
            +PGDot(coarse.basis[:,:,column],coarse.product[:,:,row]));\r
          E[row,column]:=value; coarse.valid:=coarse.valid and abs(value)<=1e100;\r
        end for;\r
      end for;\r
      if coarse.valid then\r
        (coarse.factor,factorValid):=PGCholesky(E,1e-12); coarse.valid:=factorValid;\r
      end if;\r
    end if;\r
    if not coarse.valid then coarse:=EmptyCoarse(); end if;\r
  end BuildCoarse;\r
\r
  // C=ZKZ'+(I-ZKZ'H) TreeInverse (I-HZKZ'), K=(Z'HZ)^-1.\r
  // HZ is precomputed; no full H application occurs in this helper. The same\r
  // fixed factor is used on both sides, preserving the symmetric SPD contract.\r
  function BalancedSolve\r
    input Real f[nodeCapacity,poseDimension]; input Tree tree; input Coarse coarse;\r
    output Real x[nodeCapacity,poseDimension];\r
  protected\r
    Real coefficients[poseDimension]; Real correction[poseDimension];\r
    Real pending[nodeCapacity,poseDimension]; Real work[nodeCapacity,poseDimension];\r
  algorithm\r
    coefficients:=zeros(poseDimension); correction:=zeros(poseDimension);\r
    pending:=f; work:=zeros(nodeCapacity,poseDimension); x:=work;\r
    for column in 1:poseDimension loop coefficients[column]:=PGDot(coarse.basis[:,:,column],f); end for;\r
    coefficients:=PGSolveBlock(coarse.factor,coefficients);\r
    for column in 1:poseDimension loop pending:=pending-coarse.product[:,:,column]*coefficients[column]; end for;\r
    work:=TreeSolve(pending,tree);\r
    for column in 1:poseDimension loop correction[column]:=PGDot(coarse.product[:,:,column],work); end for;\r
    correction:=PGSolveBlock(coarse.factor,correction);\r
    x:=work;\r
    for column in 1:poseDimension loop x:=x+coarse.basis[:,:,column]*(coefficients[column]-correction[column]); end for;\r
  end BalancedSolve;\r
\r
  constant Integer pairDimension = 2*poseDimension;\r
  constant Integer pairCapacity = div(nodeCapacity,2);\r
  record Pairs\r
    Real factor[pairCapacity,pairDimension,pairDimension];\r
    Boolean active[nodeCapacity];\r
    Boolean valid;\r
  end Pairs;\r
  function EmptyPairs\r
    output Pairs pairs;\r
  algorithm\r
    pairs.factor := zeros(pairCapacity,pairDimension,pairDimension);\r
    pairs.active := fill(false,nodeCapacity); pairs.valid := false;\r
  end EmptyPairs;\r
  function FactorPair\r
    input Real A[pairDimension,pairDimension];\r
    output Real L[pairDimension,pairDimension]; output Boolean valid;\r
  protected Real scale; Real value;\r
  algorithm\r
    L := zeros(pairDimension,pairDimension); scale := 0.0; value := 0.0; valid := true;\r
    for i in 1:pairDimension loop scale := max(scale,abs(A[i,i])); end for;\r
    valid := scale > 1e-12 and scale <= 1e18;\r
    for i in 1:pairDimension loop\r
      for j in 1:pairDimension loop\r
        valid := valid and abs(A[i,j]) <= 1e18 and abs(A[i,j]-A[j,i]) <= 1e-10*max(1.0,scale);\r
        value := A[i,j];\r
        for k in 1:pairDimension loop\r
          if j <= i and k < j then value := value-L[i,k]*L[j,k]; end if;\r
        end for;\r
        if j <= i then\r
          if i == j then\r
            valid := valid and value > 1e-12*scale and value <= 1e18;\r
            L[i,j] := sqrt(if value > 1e-12*scale and value <= 1e18 then value else 1.0);\r
          else L[i,j] := value/L[j,j]; end if;\r
        end if;\r
      end for;\r
    end for;\r
    if not valid then L := zeros(pairDimension,pairDimension); end if;\r
  end FactorPair;\r
  // Principal full-H blocks on free rows (2,3),(4,5),...,(nodeCapacity,padding).\r
  // Every active factor contributes diagonal terms; within-pair factors also\r
  // contribute both cross blocks. This changes only the numerical preconditioner.\r
  function BuildPairs\r
    input Real nodeMask[nodeCapacity]; input Real edgeMask[edgeCapacity];\r
    input Integer source[edgeCapacity]; input Integer target[edgeCapacity];\r
    input Real Ji[edgeCapacity,poseDimension,poseDimension];\r
    input Real Jj[edgeCapacity,poseDimension,poseDimension];\r
    input Real information[edgeCapacity,poseDimension,poseDimension];\r
    output Pairs pairs;\r
  protected\r
    Real blocks[pairCapacity,pairDimension,pairDimension]; Real normalBlock[poseDimension,poseDimension];\r
    Real left[poseDimension,poseDimension]; Real right[poseDimension,poseDimension];\r
    Real L[pairDimension,pairDimension]; Real paddingScale; Boolean factorValid;\r
    Integer a; Integer b; Integer pa; Integer pb; Integer oa; Integer ob; Integer node;\r
  algorithm\r
    pairs := EmptyPairs(); pairs.valid := true;\r
    blocks := zeros(pairCapacity,pairDimension,pairDimension); normalBlock := zeros(poseDimension,poseDimension);\r
    left := normalBlock; right := normalBlock; L := zeros(pairDimension,pairDimension); factorValid := false;\r
    paddingScale := 1.0; a := 1; b := 1; pa := 1; pb := 1; oa := 0; ob := 0; node := 1;\r
    for i in 1:nodeCapacity loop\r
      pairs.valid := pairs.valid and (nodeMask[i] == 0.0 or nodeMask[i] == 1.0);\r
      pairs.active[i] := i > 1 and nodeMask[i] == 1.0;\r
    end for;\r
    for edge in 1:edgeCapacity loop\r
      pairs.valid := pairs.valid and (edgeMask[edge] == 0.0 or edgeMask[edge] == 1.0);\r
      if pairs.valid and edgeMask[edge] == 1.0 then\r
        a := source[edge]; b := target[edge];\r
        pairs.valid := a >= 1 and a <= nodeCapacity and b >= 1 and b <= nodeCapacity and a <> b;\r
        if pairs.valid then pairs.valid := nodeMask[a] == 1.0 and nodeMask[b] == 1.0; end if;\r
        if pairs.valid then\r
          for sideA in 1:2 loop\r
            for sideB in 1:2 loop\r
              a := if sideA == 1 then source[edge] else target[edge];\r
              b := if sideB == 1 then source[edge] else target[edge];\r
              if a > 1 and b > 1 then\r
                pa := div(a-2,2)+1; pb := div(b-2,2)+1;\r
                if pa == pb then\r
                  oa := mod(a-2,2)*poseDimension; ob := mod(b-2,2)*poseDimension;\r
                  left := if sideA == 1 then Ji[edge,:,:] else Jj[edge,:,:];\r
                  right := if sideB == 1 then Ji[edge,:,:] else Jj[edge,:,:];\r
                  normalBlock := transpose(left)*information[edge,:,:]*right;\r
                  for i in 1:poseDimension loop for j in 1:poseDimension loop\r
                    blocks[pa,oa+i,ob+j] := blocks[pa,oa+i,ob+j]+normalBlock[i,j];\r
                  end for; end for;\r
                end if;\r
              end if;\r
            end for;\r
          end for;\r
        end if;\r
      end if;\r
    end for;\r
    if pairs.valid then\r
      for pair in 1:pairCapacity loop\r
        paddingScale := 0.0;\r
        for row in 1:pairDimension loop\r
          node := 2+2*(pair-1)+div(row-1,poseDimension);\r
          if node <= nodeCapacity then\r
            if pairs.active[node] then paddingScale := max(paddingScale,abs(blocks[pair,row,row])); end if;\r
          end if;\r
        end for;\r
        if paddingScale == 0.0 then paddingScale := 1.0; end if;\r
        for row in 1:pairDimension loop\r
          node := 2+2*(pair-1)+div(row-1,poseDimension);\r
          // Inactive and out-of-range padding never read numerical input cells.\r
          if node > nodeCapacity then blocks[pair,row,row] := paddingScale;\r
          elseif not pairs.active[node] then blocks[pair,row,row] := paddingScale; end if;\r
        end for;\r
        (L,factorValid) := FactorPair(blocks[pair,:,:]); pairs.valid := pairs.valid and factorValid;\r
        pairs.factor[pair,:,:] := L;\r
      end for;\r
    end if;\r
    if not pairs.valid then pairs := EmptyPairs(); end if;\r
  end BuildPairs;\r
  function PairSolve\r
    input Real f[nodeCapacity,poseDimension]; input Pairs pairs;\r
    output Real x[nodeCapacity,poseDimension];\r
  protected Real z[pairDimension]; Real w[pairDimension]; Real value; Integer node; Integer axis; Integer row;\r
  algorithm\r
    x := zeros(nodeCapacity,poseDimension); z := zeros(pairDimension); w := z;\r
    value := 0.0; node := 1; axis := 1; row := 1;\r
    if pairs.valid then\r
      for pair in 1:pairCapacity loop\r
        z := zeros(pairDimension); w := z;\r
        for i in 1:pairDimension loop\r
          node := 2+2*(pair-1)+div(i-1,poseDimension); axis := mod(i-1,poseDimension)+1;\r
          value := 0.0;\r
          if node <= nodeCapacity then if pairs.active[node] then value := f[node,axis]; end if; end if;\r
          for k in 1:pairDimension loop if k < i then value := value-pairs.factor[pair,i,k]*z[k]; end if; end for;\r
          z[i] := value/pairs.factor[pair,i,i];\r
        end for;\r
        for i in 1:pairDimension loop\r
          row := pairDimension+1-i; value := z[row];\r
          for k in 1:pairDimension loop if k > row then value := value-pairs.factor[pair,k,row]*w[k]; end if; end for;\r
          w[row] := value/pairs.factor[pair,row,row];\r
        end for;\r
        for i in 1:pairDimension loop\r
          node := 2+2*(pair-1)+div(i-1,poseDimension); axis := mod(i-1,poseDimension)+1;\r
          if node <= nodeCapacity then if pairs.active[node] then x[node,axis] := w[i]; end if; end if;\r
        end for;\r
      end for;\r
    end if;\r
  end PairSolve;\r
  function BalancedPairSolve\r
    input Real f[nodeCapacity,poseDimension]; input Pairs pairs; input Coarse coarse;\r
    output Real x[nodeCapacity,poseDimension];\r
  protected Real coefficients[poseDimension]; Real correction[poseDimension];\r
    Real pending[nodeCapacity,poseDimension]; Real work[nodeCapacity,poseDimension];\r
  algorithm\r
    coefficients := zeros(poseDimension); correction := zeros(poseDimension);\r
    pending := f; work := zeros(nodeCapacity,poseDimension); x := work;\r
    for column in 1:poseDimension loop coefficients[column] := PGDot(coarse.basis[:,:,column],f); end for;\r
    coefficients := PGSolveBlock(coarse.factor,coefficients);\r
    for column in 1:poseDimension loop pending := pending-coarse.product[:,:,column]*coefficients[column]; end for;\r
    work := PairSolve(pending,pairs);\r
    for column in 1:poseDimension loop correction[column] := PGDot(coarse.product[:,:,column],work); end for;\r
    correction := PGSolveBlock(coarse.factor,correction);\r
    x := work;\r
    for column in 1:poseDimension loop x := x+coarse.basis[:,:,column]*(coefficients[column]-correction[column]); end for;\r
  end BalancedPairSolve;\r
\r
  function Select\r
    input Real position[nodeCapacity,3]; input Real rotation[nodeCapacity,3,3];\r
    input Real nodeMask[nodeCapacity]; input Real edgeMask[edgeCapacity];\r
    input Real fromNode[edgeCapacity]; input Real toNode[edgeCapacity];\r
    input Real translation[edgeCapacity,3]; input Real measuredRotation[edgeCapacity,3,3];\r
    input Real information[edgeCapacity,poseDimension,poseDimension] "Already scaled by PrepareProblem; no second inflation";\r
    input Integer currentNode; input Integer referenceNode;\r
    input Integer maximumPCG=48; input Real tolerance=1e-10; input Boolean requested=true;\r
    output Result result;\r
  protected\r
    Integer source[edgeCapacity]; Integer target[edgeCapacity]; Integer selected[selectedDimension];\r
    Real Ji[edgeCapacity,poseDimension,poseDimension]; Real Jj[edgeCapacity,poseDimension,poseDimension];\r
    Real B[nodeCapacity,poseDimension,selectedDimension]; Real X[nodeCapacity,poseDimension,selectedDimension];\r
    Real HX[nodeCapacity,poseDimension,selectedDimension]; Real residual[nodeCapacity,poseDimension,selectedDimension];\r
    Real whitened[nodeCapacity,poseDimension,selectedDimension];\r
    Real r[nodeCapacity,poseDimension]; Real z[nodeCapacity,poseDimension];\r
    Real direction[nodeCapacity,poseDimension]; Real product[nodeCapacity,poseDimension];\r
    Real q[nodeCapacity,poseDimension]; Real edgeResidual[poseDimension];\r
    Real edgeJi[poseDimension,poseDimension]; Real edgeJj[poseDimension,poseDimension];\r
    Real rho; Real nextRho; Real curvature; Real alpha; Real beta; Real initialNorm;\r
    Real norm; Real value; Real graphStatus; Real activeNodes; Real activeEdges;\r
    Boolean valid; Boolean chartValid; Boolean running; Boolean coarseEnabled;\r
    Tree tree; Coarse coarse; Pairs pairs;\r
  algorithm\r
    result:=Empty(); source:=fill(1,edgeCapacity); target:=source; selected:=fill(1,selectedDimension);\r
    Ji:=zeros(edgeCapacity,poseDimension,poseDimension); Jj:=Ji;\r
    B:=zeros(nodeCapacity,poseDimension,selectedDimension); X:=B; HX:=B; residual:=B; whitened:=B;\r
    r:=zeros(nodeCapacity,poseDimension); z:=r; direction:=r; product:=r; q:=r;\r
    edgeJi:=zeros(poseDimension,poseDimension); edgeJj:=edgeJi; edgeResidual:=zeros(poseDimension);\r
    rho:=0.0; nextRho:=0.0; curvature:=0.0; alpha:=0.0; beta:=0.0; initialNorm:=0.0;\r
    norm:=0.0; value:=0.0; graphStatus:=0.0; activeNodes:=0.0; activeEdges:=0.0;\r
    valid:=false; chartValid:=false; running:=false; coarseEnabled:=false; coarse:=EmptyCoarse(); pairs:=EmptyPairs();\r
    if requested then\r
      result.status:=-1;\r
      valid:=currentNode>=1 and currentNode<=nodeCapacity and referenceNode>=1 and referenceNode<=nodeCapacity\r
        and maximumPCG>=0 and maximumPCG<=maximumIterations and tolerance>=1e-14 and tolerance<=1e-2;\r
      if valid then valid:=nodeMask[currentNode]==1.0 and nodeMask[referenceNode]==1.0; end if;\r
      if valid then\r
        (source,target,graphStatus,activeNodes,activeEdges):=PGValidateGraph(position,rotation,nodeMask,\r
          edgeMask,fromNode,toNode,translation,measuredRotation,information);\r
        result.status:=-2; valid:=graphStatus==1.0;\r
      end if;\r
      if valid then\r
        result.status:=-4;\r
        for edge in 1:edgeCapacity loop\r
          if edgeMask[edge]==1.0 then\r
            (edgeResidual,edgeJi,edgeJj,chartValid):=PGEdge(position[source[edge],:],rotation[source[edge],:,:],\r
              position[target[edge],:],rotation[target[edge],:,:],translation[edge,:],measuredRotation[edge,:,:]);\r
            Ji[edge,:,:]:=edgeJi; Jj[edge,:,:]:=edgeJj;\r
            valid:=valid and chartValid;\r
            for row in 1:poseDimension loop\r
              for column in 1:poseDimension loop\r
                valid:=valid and information[edge,row,column]==information[edge,column,row]\r
                  and abs(Ji[edge,row,column])<=1e18 and abs(Jj[edge,row,column])<=1e18;\r
              end for;\r
            end for;\r
          end if;\r
        end for;\r
      end if;\r
      if valid then\r
        result.status:=-3; tree:=BuildTree(nodeMask,edgeMask,source,target,Ji,Jj,information); valid:=tree.valid;\r
      end if;\r
      if valid then\r
        // Preserve X=0/tree-only majorant when no PCG step is requested. With\r
        // only the root active there is no free subspace or coarse rank to test.\r
        coarseEnabled:=maximumPCG>0 and activeNodes>1.0;\r
        if coarseEnabled then\r
          coarse:=BuildCoarse(position,rotation,nodeMask,edgeMask,source,target,Ji,Jj,information); valid:=coarse.valid;\r
          if valid then pairs:=BuildPairs(nodeMask,edgeMask,source,target,Ji,Jj,information); valid:=pairs.valid; end if;\r
        end if;\r
      end if;\r
      if valid then\r
        result.status:=-5;\r
        for column in 1:selectedDimension loop\r
          selected[column]:=if column<=poseDimension then currentNode else referenceNode;\r
          if selected[column]>1 then B[selected[column],mod(column-1,poseDimension)+1,column]:=1.0; end if;\r
          r:=B[:,:,column]; z:=if coarseEnabled then BalancedPairSolve(r,pairs,coarse) else TreeSolve(r,tree); direction:=z;\r
          rho:=PGDot(r,z); initialNorm:=PGDot(r,r);\r
          valid:=valid and rho>=0.0 and rho<=1e100;\r
          running:=valid and initialNorm>0.0;\r
          for iteration in 1:maximumIterations loop\r
            if running and iteration<=maximumPCG then\r
              product:=PGNormalProduct(direction,nodeMask,edgeMask,source,target,Ji,Jj,information,zeros(nodeCapacity,poseDimension),0.0);\r
              curvature:=PGDot(direction,product); valid:=curvature>0.0 and curvature<=1e100 and rho>0.0;\r
              if valid then\r
                alpha:=rho/curvature; X[:,:,column]:=X[:,:,column]+alpha*direction;\r
                r:=r-alpha*product; norm:=PGDot(r,r); result.iterations[column]:=iteration;\r
                valid:=norm>=0.0 and norm<=1e100;\r
                running:=valid and norm>tolerance*tolerance*initialNorm;\r
                if running then\r
                  z:=if coarseEnabled then BalancedPairSolve(r,pairs,coarse) else TreeSolve(r,tree); nextRho:=PGDot(r,z); valid:=nextRho>0.0 and nextRho<=1e100;\r
                  if valid then beta:=nextRho/rho; direction:=z+beta*direction; rho:=nextRho; else running:=false; end if;\r
                end if;\r
              else running:=false;\r
              end if;\r
            end if;\r
          end for;\r
          HX[:,:,column]:=PGNormalProduct(X[:,:,column],nodeMask,edgeMask,source,target,Ji,Jj,information,zeros(nodeCapacity,poseDimension),0.0);\r
          residual[:,:,column]:=B[:,:,column]-HX[:,:,column];\r
          norm:=PGDot(residual[:,:,column],residual[:,:,column]);\r
          result.residualNorm[column]:=sqrt(max(0.0,norm));\r
          result.converged[column]:=norm<=tolerance*tolerance*initialNorm;\r
          q:=Backward(residual[:,:,column],tree);\r
          for node in 1:nodeCapacity loop\r
            if node>1 and nodeMask[node]==1.0 then\r
              // Only L_W^-1 q is needed for the full residual Gram upper bound.\r
              for axis in 1:poseDimension loop\r
                value:=q[node,axis];\r
                for k in 1:poseDimension loop\r
                  if k<axis then value:=value-tree.weightFactor[node,axis,k]*whitened[node,k,column]; end if;\r
                end for;\r
                whitened[node,axis,column]:=value/tree.weightFactor[node,axis,axis];\r
              end for;\r
            end if;\r
          end for;\r
        end for;\r
        for row in 1:selectedDimension loop\r
          for column in 1:selectedDimension loop\r
            result.lower[row,column]:=PGDot(B[:,:,row],X[:,:,column])+PGDot(X[:,:,row],B[:,:,column])\r
              -0.5*(PGDot(X[:,:,row],HX[:,:,column])+PGDot(HX[:,:,row],X[:,:,column]));\r
            result.residualUpper[row,column]:=PGDot(whitened[:,:,row],whitened[:,:,column]);\r
            result.upper[row,column]:=result.lower[row,column]+result.residualUpper[row,column];\r
            valid:=valid and abs(result.lower[row,column])<=1e100\r
              and abs(result.residualUpper[row,column])<=1e100 and abs(result.upper[row,column])<=1e100;\r
          end for;\r
        end for;\r
        if valid then\r
          result.accepted:=true; result.status:=1; result.treeEdges:=tree.count; result.activeNodes:=integer(activeNodes);\r
        end if;\r
      end if;\r
      if not valid then\r
        graphStatus:=result.status; result:=Empty(); result.status:=integer(graphStatus);\r
      end if;\r
    end if;\r
  end Select;\r
end ModelicaPoseGraphCovariance;\r
`;export{e as default};
