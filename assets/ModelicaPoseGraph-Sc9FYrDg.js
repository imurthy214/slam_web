const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Bounded pose-graph numerical component; no loop detection or truth inputs.\r
// Body-to-world R, world-additive p and RIGHT-local attitude increments.\r
// Residual [Ri'*(pj-pi)-translation, Log(measuredRotation'*Ri'*Rj)].\r
// This product residual is not the coupled SE(3) logarithm (no V^-1 translation).\r
// Small numerical helpers are editable Modelica, not host math.\r
function PGTranspose\r
  input Real A[3,3]; output Real B[3,3];\r
algorithm\r
  B[1,1] := A[1,1];\r
  B[2,1] := A[1,2];\r
  B[3,1] := A[1,3];\r
  B[1,2] := A[2,1];\r
  B[2,2] := A[2,2];\r
  B[3,2] := A[2,3];\r
  B[1,3] := A[3,1];\r
  B[2,3] := A[3,2];\r
  B[3,3] := A[3,3];\r
end PGTranspose;\r
\r
function PGMultiply\r
  input Real A[3,3]; input Real B[3,3]; output Real C[3,3];\r
algorithm\r
  C[1,1] := A[1,1]*B[1,1]+A[1,2]*B[2,1]+A[1,3]*B[3,1];\r
  C[1,2] := A[1,1]*B[1,2]+A[1,2]*B[2,2]+A[1,3]*B[3,2];\r
  C[1,3] := A[1,1]*B[1,3]+A[1,2]*B[2,3]+A[1,3]*B[3,3];\r
  C[2,1] := A[2,1]*B[1,1]+A[2,2]*B[2,1]+A[2,3]*B[3,1];\r
  C[2,2] := A[2,1]*B[1,2]+A[2,2]*B[2,2]+A[2,3]*B[3,2];\r
  C[2,3] := A[2,1]*B[1,3]+A[2,2]*B[2,3]+A[2,3]*B[3,3];\r
  C[3,1] := A[3,1]*B[1,1]+A[3,2]*B[2,1]+A[3,3]*B[3,1];\r
  C[3,2] := A[3,1]*B[1,2]+A[3,2]*B[2,2]+A[3,3]*B[3,2];\r
  C[3,3] := A[3,1]*B[1,3]+A[3,2]*B[2,3]+A[3,3]*B[3,3];\r
end PGMultiply;\r
\r
function PGMatVec\r
  input Real A[3,3]; input Real x[3]; output Real y[3];\r
algorithm\r
  y[1] := A[1,1]*x[1]+A[1,2]*x[2]+A[1,3]*x[3];\r
  y[2] := A[2,1]*x[1]+A[2,2]*x[2]+A[2,3]*x[3];\r
  y[3] := A[3,1]*x[1]+A[3,2]*x[2]+A[3,3]*x[3];\r
end PGMatVec;\r
\r
function PGSkew\r
  input Real x[3]; output Real S[3,3];\r
algorithm\r
  S := zeros(3,3);\r
  S[1,2] := -x[3]; S[1,3] := x[2]; S[2,1] := x[3];\r
  S[2,3] := -x[1]; S[3,1] := -x[2]; S[3,2] := x[1];\r
end PGSkew;\r
\r
function PGProperRotation\r
  input Real R[3,3]; output Boolean valid;\r
protected Real value; Real determinant;\r
algorithm\r
  valid := true; value := 0.0;\r
  for i in 1:3 loop\r
    for j in 1:3 loop\r
      valid := valid and abs(R[i,j]) <= 1.000001;\r
      value := 0.0;\r
      for k in 1:3 loop value := value+R[k,i]*R[k,j]; end for;\r
      valid := valid and abs(value-(if i == j then 1.0 else 0.0)) <= 1e-7;\r
    end for;\r
  end for;\r
  determinant := R[1,1]*(R[2,2]*R[3,3]-R[2,3]*R[3,2])\r
    -R[1,2]*(R[2,1]*R[3,3]-R[2,3]*R[3,1])+R[1,3]*(R[2,1]*R[3,2]-R[2,2]*R[3,1]);\r
  valid := valid and abs(determinant-1.0) <= 1e-7;\r
end PGProperRotation;\r
\r
function PGExp\r
\r
  input Real angle[3]; output Real R[3,3];\r
protected Real square; Real theta; Real a; Real b; Real S[3,3];\r
algorithm\r
  square := angle[1]*angle[1]+angle[2]*angle[2]+angle[3]*angle[3]; theta := sqrt(max(square,0.0));\r
  a := if square < 1e-8 then 1.0-square/6.0+square*square/120.0 else sin(theta)/max(theta,1e-12);\r
  b := if square < 1e-8 then 0.5-square/24.0+square*square/720.0 else (1.0-cos(theta))/max(square,1e-12);\r
  S := PGSkew(angle); R := identity(3)+a*S+b*PGMultiply(S,S);\r
end PGExp;\r
\r
function PGLog\r
  input Real R[3,3]; output Real angle[3]; output Boolean valid;\r
protected Real cosine; Real theta; Real square; Real scale;\r
algorithm\r
  cosine := min(1.0,max(-1.0,(R[1,1]+R[2,2]+R[3,3]-1.0)/2.0));\r
  theta := acos(cosine); square := theta*theta;\r
  // The chart is deliberately refused near its nonunique pi branch.\r
  valid := theta >= 0.0 and theta < 3.140592653589793;\r
  scale := if square < 1e-8 then 0.5+square/12.0+7.0*square*square/720.0\r
    else theta/(2.0*max(sin(theta),1e-12));\r
  angle := if valid then scale*{R[3,2]-R[2,3],R[1,3]-R[3,1],R[2,1]-R[1,2]} else zeros(3);\r
end PGLog;\r
\r
function PGEdge\r
\r
  input Real pi[3]; input Real Ri[3,3]; input Real pj[3]; input Real Rj[3,3];\r
  input Real translation[3]; input Real measuredRotation[3,3];\r
  output Real residual[6]; output Real Ji[6,6]; output Real Jj[6,6]; output Boolean valid;\r
protected Real t[3]; Real r[3]; Real square; Real theta; Real c;\r
  Real S[3,3]; Real leftInverse[3,3]; Real rightInverse[3,3];\r
algorithm\r
  t := PGMatVec(PGTranspose(Ri),pj-pi);\r
  (r,valid) := PGLog(PGMultiply(PGMultiply(PGTranspose(measuredRotation),PGTranspose(Ri)),Rj));\r
  square := r[1]*r[1]+r[2]*r[2]+r[3]*r[3]; theta := sqrt(max(square,0.0));\r
  c := if square < 1e-8 then 1.0/12.0+square/720.0+square*square/30240.0\r
    else (1.0-0.5*theta*cos(0.5*theta)/max(sin(0.5*theta),1e-12))/max(square,1e-12);\r
  S := PGSkew(r); leftInverse := identity(3)-0.5*S+c*PGMultiply(S,S);\r
  rightInverse := identity(3)+0.5*S+c*PGMultiply(S,S);\r
  residual := zeros(6); Ji := zeros(6,6); Jj := zeros(6,6); S := PGSkew(t);\r
  leftInverse := -PGMultiply(leftInverse,PGTranspose(measuredRotation));\r
  for i in 1:3 loop\r
    residual[i] := t[i]-translation[i]; residual[i+3] := r[i];\r
    for j in 1:3 loop\r
      Ji[i,j] := -Ri[j,i]; Jj[i,j] := Ri[j,i]; Ji[i,j+3] := S[i,j];\r
      Ji[i+3,j+3] := leftInverse[i,j]; Jj[i+3,j+3] := rightInverse[i,j];\r
    end for;\r
  end for;\r
end PGEdge;\r
\r
function PGCholesky\r
  input Real A[6,6]; input Real pivotRelative;\r
  output Real L[6,6]; output Boolean valid;\r
protected Real scale; Real value;\r
algorithm\r
  L := zeros(6,6); valid := true; scale := 0.0; value := 0.0;\r
  for i in 1:6 loop scale := max(scale,abs(A[i,i])); end for;\r
  valid := scale > 1e-12 and scale <= 1e18;\r
  for i in 1:6 loop\r
    for j in 1:6 loop\r
      valid := valid and abs(A[i,j]) <= 1e18\r
        and abs(A[i,j]-A[j,i]) <= 1e-10*max(1.0,scale);\r
      value := A[i,j];\r
      for k in 1:6 loop\r
        if j <= i and k < j then value := value-L[i,k]*L[j,k]; end if;\r
      end for;\r
      if j <= i then\r
        if i == j then\r
          valid := valid and value > pivotRelative*scale and value <= 1e18;\r
          L[i,j] := sqrt(if value > pivotRelative*scale and value <= 1e18 then value else 1.0);\r
        else\r
          L[i,j] := value/L[j,j];\r
        end if;\r
      end if;\r
    end for;\r
  end for;\r
end PGCholesky;\r
\r
function PGSolveBlock\r
  input Real L[6,6]; input Real b[6]; output Real x[6];\r
protected Real z[6]; Real value; Integer row;\r
algorithm\r
  z := zeros(6); x := zeros(6); value := 0.0; row := 1;\r
  for i in 1:6 loop\r
    value := b[i];\r
    for k in 1:6 loop if k < i then value := value-L[i,k]*z[k]; end if; end for;\r
    z[i] := value/L[i,i];\r
  end for;\r
  for reverseRow in 1:6 loop\r
    row := 7-reverseRow; value := z[row];\r
    for k in 1:6 loop if k > row then value := value-L[k,row]*x[k]; end if; end for;\r
    x[row] := value/L[row,row];\r
  end for;\r
end PGSolveBlock;\r
\r
function PGNormalProduct\r
  input Real x[:,6]; input Real nodeMask[size(x,1)];\r
  input Real edgeMask[:]; input Integer source[size(edgeMask,1)]; input Integer target[size(edgeMask,1)];\r
  input Real Ji[size(edgeMask,1),6,6]; input Real Jj[size(edgeMask,1),6,6];\r
  input Real information[size(edgeMask,1),6,6]; input Real dampingDiagonal[size(x,1),6]; input Real damping;\r
  output Real y[size(x,1),6];\r
protected Integer i; Integer j; Real row[6]; Real weighted[6];\r
algorithm\r
  y := zeros(size(x,1),6); i := 1; j := 1; row := zeros(6); weighted := zeros(6);\r
  for node in 1:size(x,1) loop\r
    for k in 1:6 loop\r
      y[node,k] := if node > 1 and nodeMask[node] == 1.0 then damping*dampingDiagonal[node,k]*x[node,k] else 0.0;\r
    end for;\r
  end for;\r
  for edge in 1:size(edgeMask,1) loop\r
    if edgeMask[edge] == 1.0 then\r
      i := source[edge]; j := target[edge];\r
      row := Ji[edge,:,:]*x[i,:]+Jj[edge,:,:]*x[j,:]; weighted := information[edge,:,:]*row;\r
      if i > 1 then y[i,:] := y[i,:]+transpose(Ji[edge,:,:])*weighted; end if;\r
      if j > 1 then y[j,:] := y[j,:]+transpose(Jj[edge,:,:])*weighted; end if;\r
    end if;\r
  end for;\r
  // Node1 is the exact gauge: callers keep x[1,:]=0; its operator row is zero.\r
end PGNormalProduct;\r
\r
function PGGraphCost\r
\r
  input Real p[:,3]; input Real R[size(p,1),3,3]; input Real edgeMask[:];\r
  input Integer source[size(edgeMask,1)]; input Integer target[size(edgeMask,1)];\r
  input Real translation[size(edgeMask,1),3]; input Real measuredRotation[size(edgeMask,1),3,3];\r
  input Real information[size(edgeMask,1),6,6];\r
  output Real cost; output Boolean valid;\r
protected Real residual[6]; Real Ji[6,6]; Real Jj[6,6]; Boolean edgeValid;\r
algorithm\r
  cost := 0.0; valid := true; edgeValid := false; residual := zeros(6); Ji := zeros(6,6); Jj := zeros(6,6);\r
  for edge in 1:size(edgeMask,1) loop\r
    if edgeMask[edge] == 1.0 then\r
      (residual,Ji,Jj,edgeValid) := PGEdge(p[source[edge],:],R[source[edge],:,:],\r
        p[target[edge],:],R[target[edge],:,:],translation[edge,:],measuredRotation[edge,:,:]);\r
      valid := valid and edgeValid; cost := cost+0.5*(residual*(information[edge,:,:]*residual));\r
    end if;\r
  end for;\r
  valid := valid and cost >= 0.0 and cost <= 1e100;\r
end PGGraphCost;\r
\r
function PGValidateGraph\r
\r
  input Real p[:,3]; input Real R[size(p,1),3,3]; input Real nodeMask[size(p,1)]; input Real edgeMask[:];\r
  input Real fromNode[size(edgeMask,1)]; input Real toNode[size(edgeMask,1)];\r
  input Real translation[size(edgeMask,1),3]; input Real measuredRotation[size(edgeMask,1),3,3];\r
  input Real information[size(edgeMask,1),6,6];\r
  output Integer source[size(edgeMask,1)]; output Integer target[size(edgeMask,1)];\r
  output Real status; output Real activeNodes; output Real activeEdges;\r
protected Boolean valid; Boolean proper; Boolean endpoints; Boolean factorValid;\r
  Real L[6,6]; Real reached[size(p,1)]; Integer i; Integer j;\r
algorithm\r
  source := fill(1,size(edgeMask,1)); target := fill(1,size(edgeMask,1)); reached := zeros(size(p,1));\r
  valid := size(p,1) >= 1 and size(p,1) <= 128 and size(edgeMask,1) >= 1 and size(edgeMask,1) <= 256 and nodeMask[1] == 1.0;\r
  proper := false; endpoints := false; factorValid := false; L := zeros(6,6); i := 1; j := 1;\r
  status := -1.0; activeNodes := 0.0; activeEdges := 0.0;\r
  for node in 1:size(p,1) loop\r
    valid := valid and (nodeMask[node] == 0.0 or nodeMask[node] == 1.0);\r
    for k in 1:3 loop valid := valid and (nodeMask[node] == 0.0 or abs(p[node,k]) <= 1e6); end for;\r
    proper := PGProperRotation(R[node,:,:]); valid := valid and (nodeMask[node] == 0.0 or proper);\r
    activeNodes := activeNodes+(if nodeMask[node] == 1.0 then 1.0 else 0.0);\r
  end for;\r
  status := if valid then -2.0 else status;\r
  for edge in 1:size(edgeMask,1) loop\r
    endpoints := edgeMask[edge] == 1.0 and fromNode[edge] >= 1.0 and fromNode[edge] <= size(p,1)\r
      and floor(fromNode[edge]) == fromNode[edge] and toNode[edge] >= 1.0 and toNode[edge] <= size(p,1)\r
      and floor(toNode[edge]) == toNode[edge] and fromNode[edge] <> toNode[edge];\r
    valid := valid and (edgeMask[edge] == 0.0 or (edgeMask[edge] == 1.0 and endpoints));\r
    source[edge] := if endpoints then integer(fromNode[edge]) else 1;\r
    target[edge] := if endpoints then integer(toNode[edge]) else 1;\r
    valid := valid and (edgeMask[edge] == 0.0 or (nodeMask[source[edge]] == 1.0 and nodeMask[target[edge]] == 1.0));\r
    for k in 1:3 loop valid := valid and (edgeMask[edge] == 0.0 or abs(translation[edge,k]) <= 1e6); end for;\r
    proper := PGProperRotation(measuredRotation[edge,:,:]);\r
    (L,factorValid) := PGCholesky(information[edge,:,:],1e-10);\r
    valid := valid and (edgeMask[edge] == 0.0 or (proper and factorValid));\r
    activeEdges := activeEdges+(if edgeMask[edge] == 1.0 then 1.0 else 0.0);\r
  end for;\r
  status := if valid then -3.0 else status; reached[1] := 1.0;\r
  for pass in 1:size(p,1) loop\r
    for edge in 1:size(edgeMask,1) loop\r
      if valid and edgeMask[edge] == 1.0 then\r
        i := source[edge]; j := target[edge];\r
        if reached[i] == 1.0 or reached[j] == 1.0 then reached[i] := 1.0; reached[j] := 1.0; end if;\r
      end if;\r
    end for;\r
  end for;\r
  for node in 1:size(p,1) loop valid := valid and (nodeMask[node] == 0.0 or reached[node] == 1.0); end for;\r
  status := if valid then 1.0 else status;\r
end PGValidateGraph;\r
\r
function PGLinearize\r
\r
  input Real p[:,3]; input Real R[size(p,1),3,3]; input Real edgeMask[:];\r
  input Integer source[size(edgeMask,1)]; input Integer target[size(edgeMask,1)];\r
  input Real translation[size(edgeMask,1),3]; input Real measuredRotation[size(edgeMask,1),3,3];\r
  input Real information[size(edgeMask,1),6,6];\r
  output Real Ji[size(edgeMask,1),6,6]; output Real Jj[size(edgeMask,1),6,6];\r
  output Real gradient[size(p,1),6]; output Real blocks[size(p,1),6,6];\r
protected Integer i; Integer j; Real residual[6]; Boolean valid;\r
  Real edgeJi[6,6]; Real edgeJj[6,6];\r
algorithm\r
  Ji := zeros(size(edgeMask,1),6,6); Jj := zeros(size(edgeMask,1),6,6);\r
  gradient := zeros(size(p,1),6); blocks := zeros(size(p,1),6,6); residual := zeros(6); valid := false; i := 1; j := 1;\r
  edgeJi := zeros(6,6); edgeJj := zeros(6,6);\r
  for edge in 1:size(edgeMask,1) loop\r
    if edgeMask[edge] == 1.0 then\r
      i := source[edge]; j := target[edge];\r
      (residual,edgeJi,edgeJj,valid) := PGEdge(p[i,:],R[i,:,:],p[j,:],R[j,:,:],translation[edge,:],measuredRotation[edge,:,:]);\r
      Ji[edge,:,:] := edgeJi; Jj[edge,:,:] := edgeJj;\r
      if i > 1 then\r
        gradient[i,:] := gradient[i,:]+transpose(Ji[edge,:,:])*(information[edge,:,:]*residual);\r
        blocks[i,:,:] := blocks[i,:,:]+transpose(Ji[edge,:,:])*information[edge,:,:]*Ji[edge,:,:];\r
      end if;\r
      if j > 1 then\r
        gradient[j,:] := gradient[j,:]+transpose(Jj[edge,:,:])*(information[edge,:,:]*residual);\r
        blocks[j,:,:] := blocks[j,:,:]+transpose(Jj[edge,:,:])*information[edge,:,:]*Jj[edge,:,:];\r
      end if;\r
    end if;\r
  end for;\r
end PGLinearize;\r
\r
function PGDampedFactor\r
\r
  input Real localBlock[6,6]; input Real damping;\r
  output Real L[6,6]; output Real diagonal[6]; output Boolean valid;\r
protected Real A[6,6];\r
algorithm\r
  A := localBlock; diagonal := zeros(6);\r
  for k in 1:6 loop diagonal[k] := max(A[k,k],1e-6); A[k,k] := A[k,k]+damping*diagonal[k]; end for;\r
  (L,valid) := PGCholesky(A,1e-12);\r
end PGDampedFactor;\r
\r
function PGPrecondition\r
\r
  input Real rhs[:,6]; input Real factors[size(rhs,1),6,6]; input Real nodeMask[size(rhs,1)];\r
  output Real z[size(rhs,1),6];\r
algorithm\r
  z := zeros(size(rhs,1),6);\r
  for node in 1:size(rhs,1) loop\r
    if node > 1 and nodeMask[node] == 1.0 then z[node,:] := PGSolveBlock(factors[node,:,:],rhs[node,:]); end if;\r
  end for;\r
end PGPrecondition;\r
\r
function PGDot\r
  input Real x[:,:]; input Real y[size(x,1),size(x,2)]; output Real value;\r
algorithm\r
  value := 0.0;\r
  for i in 1:size(x,1) loop for j in 1:size(x,2) loop value := value+x[i,j]*y[i,j]; end for; end for;\r
end PGDot;\r
\r
function PGPCG\r
\r
  input Real gradient[:,6]; input Real blocks[size(gradient,1),6,6]; input Real nodeMask[size(gradient,1)];\r
  input Real edgeMask[:]; input Integer source[size(edgeMask,1)]; input Integer target[size(edgeMask,1)];\r
  input Real Ji[size(edgeMask,1),6,6]; input Real Jj[size(edgeMask,1),6,6]; input Real information[size(edgeMask,1),6,6];\r
  input Real damping; input Real tolerance; input Integer maximumPCG;\r
  output Real delta[size(gradient,1),6]; output Real iterations; output Real initialNorm; output Boolean valid;\r
protected Real factors[size(gradient,1),6,6]; Real diagonal[size(gradient,1),6]; Real rhs[size(gradient,1),6];\r
  Real localFactor[6,6]; Real localDiagonal[6];\r
  Real z[size(gradient,1),6]; Real direction[size(gradient,1),6]; Real product[size(gradient,1),6];\r
  Real rho; Real nextRho; Real denominator; Real alpha; Real beta; Real residualNorm; Boolean factorValid; Boolean running;\r
algorithm\r
  factors := zeros(size(gradient,1),6,6); diagonal := zeros(size(gradient,1),6); delta := zeros(size(gradient,1),6);\r
  localFactor := zeros(6,6); localDiagonal := zeros(6);\r
  rhs := -gradient; z := zeros(size(gradient,1),6); direction := zeros(size(gradient,1),6); product := zeros(size(gradient,1),6);\r
  valid := true; factorValid := false; iterations := 0.0; rho := 0.0; nextRho := 0.0; denominator := 0.0;\r
  alpha := 0.0; beta := 0.0; residualNorm := 0.0; running := false;\r
  for node in 1:size(gradient,1) loop\r
    if node > 1 and nodeMask[node] == 1.0 then\r
      (localFactor,localDiagonal,factorValid) := PGDampedFactor(blocks[node,:,:],damping);\r
      factors[node,:,:] := localFactor; diagonal[node,:] := localDiagonal;\r
      valid := valid and factorValid;\r
    end if;\r
  end for;\r
  z := PGPrecondition(rhs,factors,nodeMask); direction := z;\r
  rho := PGDot(rhs,z); initialNorm := PGDot(rhs,rhs);\r
  valid := valid and rho >= 0.0 and rho <= 1e100 and initialNorm <= 1e100;\r
  running := valid and initialNorm > 1e-18;\r
  for pcg in 1:96 loop\r
    if running and pcg <= maximumPCG then\r
      iterations := iterations+1.0;\r
      product := PGNormalProduct(direction,nodeMask,edgeMask,source,target,Ji,Jj,information,diagonal,damping);\r
      denominator := PGDot(direction,product); valid := denominator > 0.0 and denominator <= 1e100 and rho > 0.0;\r
      if valid then\r
        alpha := rho/denominator; delta := delta+alpha*direction; rhs := rhs-alpha*product; residualNorm := PGDot(rhs,rhs);\r
        valid := residualNorm >= 0.0 and residualNorm <= 1e100;\r
        running := valid and residualNorm > tolerance*tolerance*initialNorm;\r
        if running then\r
          z := PGPrecondition(rhs,factors,nodeMask); nextRho := PGDot(rhs,z);\r
          valid := nextRho > 0.0 and nextRho <= 1e100; beta := nextRho/max(rho,1e-300);\r
          direction := z+beta*direction; rho := nextRho; running := running and valid;\r
        end if;\r
      else running := false;\r
      end if;\r
    end if;\r
  end for;\r
end PGPCG;\r
\r
function PGRetract\r
\r
  input Real p[:,3]; input Real R[size(p,1),3,3]; input Real nodeMask[size(p,1)]; input Real delta[size(p,1),6]; input Real scale;\r
  output Real nextP[size(p,1),3]; output Real nextR[size(p,1),3,3];\r
algorithm\r
  nextP := p; nextR := R;\r
  for node in 1:size(p,1) loop\r
    if node > 1 and nodeMask[node] == 1.0 then\r
      nextP[node,:] := p[node,:]+scale*delta[node,1:3]; nextR[node,:,:] := R[node,:,:]*PGExp(scale*delta[node,4:6]);\r
    end if;\r
  end for;\r
end PGRetract;\r
\r
function PGStep\r
\r
  input Real p[:,3]; input Real R[size(p,1),3,3]; input Real nodeMask[size(p,1)]; input Real edgeMask[:];\r
  input Integer source[size(edgeMask,1)]; input Integer target[size(edgeMask,1)];\r
  input Real translation[size(edgeMask,1),3]; input Real measuredRotation[size(edgeMask,1),3,3]; input Real information[size(edgeMask,1),6,6];\r
  input Real currentCost; input Real damping; input Real maximumPositionStep; input Real maximumAngleStep;\r
  input Real pcgTolerance; input Integer maximumPCG; input Integer maximumBacktracks;\r
  output Real nextP[size(p,1),3]; output Real nextR[size(p,1),3,3]; output Real nextCost; output Real nextDamping;\r
  output Real accepted; output Real iterations; output Boolean running;\r
protected Real Ji[size(edgeMask,1),6,6]; Real Jj[size(edgeMask,1),6,6]; Real gradient[size(p,1),6]; Real blocks[size(p,1),6,6];\r
  Real delta[size(p,1),6]; Real initialNorm; Real scale; Real positionNorm; Real angleNorm;\r
  Real trialP[size(p,1),3]; Real trialR[size(p,1),3,3]; Real trialCost; Boolean pcgValid; Boolean trialValid;\r
algorithm\r
  nextP := p; nextR := R; nextCost := currentCost; nextDamping := min(1e6,damping*10.0); accepted := 0.0;\r
  trialP := p; trialR := R; trialCost := currentCost; scale := 1.0; positionNorm := 0.0; angleNorm := 0.0; trialValid := false;\r
  (Ji,Jj,gradient,blocks) := PGLinearize(p,R,edgeMask,source,target,translation,measuredRotation,information);\r
  (delta,iterations,initialNorm,pcgValid) := PGPCG(gradient,blocks,nodeMask,edgeMask,source,target,Ji,Jj,information,damping,pcgTolerance,maximumPCG);\r
  running := initialNorm > 1e-18;\r
  for node in 1:size(p,1) loop\r
    positionNorm := sqrt(max(delta[node,1:3]*delta[node,1:3],0.0)); angleNorm := sqrt(max(delta[node,4:6]*delta[node,4:6],0.0));\r
    scale := min(scale,min(maximumPositionStep/max(positionNorm,1e-12),maximumAngleStep/max(angleNorm,1e-12)));\r
  end for;\r
  for backtrack in 1:12 loop\r
    if pcgValid and running and accepted == 0.0 and backtrack <= maximumBacktracks then\r
      (trialP,trialR) := PGRetract(p,R,nodeMask,delta,scale);\r
      (trialCost,trialValid) := PGGraphCost(trialP,trialR,edgeMask,source,target,translation,measuredRotation,information);\r
      if trialValid and trialCost < currentCost-1e-12*max(1.0,currentCost) then\r
        nextP := trialP; nextR := trialR; nextCost := trialCost; nextDamping := max(1e-9,damping*0.3); accepted := 1.0;\r
      else scale := scale*0.5;\r
      end if;\r
    end if;\r
  end for;\r
end PGStep;\r
\r
function PGRun\r
\r
  input Real p[:,3]; input Real R[size(p,1),3,3]; input Real nodeMask[size(p,1)]; input Real edgeMask[:];\r
  input Integer source[size(edgeMask,1)]; input Integer target[size(edgeMask,1)];\r
  input Real translation[size(edgeMask,1),3]; input Real measuredRotation[size(edgeMask,1),3,3]; input Real information[size(edgeMask,1),6,6];\r
  input Real initialCost; input Real initialDamping; input Real maximumPositionStep; input Real maximumAngleStep; input Real pcgTolerance;\r
  input Integer maximumIterations; input Integer maximumPCG; input Integer maximumBacktracks;\r
  output Real nextP[size(p,1),3]; output Real nextR[size(p,1),3,3]; output Real cost; output Real acceptedIterations; output Real pcgIterations;\r
protected Real damping; Real accepted; Real iterations; Boolean running;\r
algorithm\r
  nextP := p; nextR := R; cost := initialCost; acceptedIterations := 0.0; pcgIterations := 0.0;\r
  damping := initialDamping; accepted := 0.0; iterations := 0.0; running := true;\r
  for iteration in 1:16 loop\r
    if running and iteration <= maximumIterations then\r
      (nextP,nextR,cost,damping,accepted,iterations,running) := PGStep(nextP,nextR,nodeMask,edgeMask,source,target,\r
        translation,measuredRotation,information,cost,damping,maximumPositionStep,maximumAngleStep,pcgTolerance,maximumPCG,maximumBacktracks);\r
      acceptedIterations := acceptedIterations+accepted; pcgIterations := pcgIterations+iterations;\r
    end if;\r
  end for;\r
end PGRun;\r
\r
function OptimizeModelicaPoseGraph\r
\r
  input Real position[:,3]; input Real rotation[size(position,1),3,3]; input Real nodeMask[size(position,1)];\r
  input Real edgeMask[:]; input Real fromNode[size(edgeMask,1)]; input Real toNode[size(edgeMask,1)];\r
  input Real translation[size(edgeMask,1),3]; input Real measuredRotation[size(edgeMask,1),3,3]; input Real information[size(edgeMask,1),6,6];\r
  input Integer maximumIterations; input Integer maximumPCG; input Integer maximumBacktracks;\r
  input Real initialDamping; input Real maximumPositionStep; input Real maximumAngleStep; input Real pcgTolerance;\r
  output Real nextPosition[size(position,1),3]; output Real nextRotation[size(position,1),3,3]; output Real status;\r
  output Real costBefore; output Real costAfter; output Real acceptedIterations; output Real pcgIterations; output Real activeNodes; output Real activeEdges;\r
protected Integer source[size(edgeMask,1)]; Integer target[size(edgeMask,1)]; Boolean valid; Boolean costValid;\r
algorithm\r
  nextPosition := position; nextRotation := rotation; costBefore := 0.0; costAfter := 0.0; acceptedIterations := 0.0; pcgIterations := 0.0;\r
  (source,target,status,activeNodes,activeEdges) := PGValidateGraph(position,rotation,nodeMask,edgeMask,fromNode,toNode,translation,measuredRotation,information);\r
  valid := status == 1.0 and maximumIterations >= 1 and maximumIterations <= 16 and maximumPCG >= 1 and maximumPCG <= 96\r
    and maximumBacktracks >= 1 and maximumBacktracks <= 12 and initialDamping >= 1e-9 and initialDamping <= 1e3\r
    and maximumPositionStep > 0.0 and maximumPositionStep <= 2.0 and maximumAngleStep > 0.0 and maximumAngleStep <= 0.5\r
    and pcgTolerance >= 1e-8 and pcgTolerance <= 0.1;\r
  status := if status == 1.0 and not valid then -1.0 else status; costValid := false;\r
  if valid then\r
    (costBefore,costValid) := PGGraphCost(position,rotation,edgeMask,source,target,translation,measuredRotation,information);\r
    status := if costValid then 1.0 else -4.0; costAfter := costBefore;\r
    if costValid then\r
      (nextPosition,nextRotation,costAfter,acceptedIterations,pcgIterations) := PGRun(position,rotation,nodeMask,edgeMask,source,target,\r
        translation,measuredRotation,information,costBefore,initialDamping,maximumPositionStep,maximumAngleStep,pcgTolerance,maximumIterations,maximumPCG,maximumBacktracks);\r
      status := if acceptedIterations > 0.0 then 2.0 else 1.0;\r
    end if;\r
  end if;\r
end OptimizeModelicaPoseGraph;\r
\r
function PGEdgeDiagnostics\r
\r
  input Real pi[3]; input Real Ri[3,3]; input Real pj[3]; input Real Rj[3,3]; input Real translation[3]; input Real measuredRotation[3,3];\r
  output Real residual[6]; output Real Ji[6,6]; output Real Jj[6,6]; output Real valid;\r
protected Boolean chartValid;\r
algorithm\r
  (residual,Ji,Jj,chartValid) := PGEdge(pi,Ri,pj,Rj,translation,measuredRotation); valid := if chartValid then 1.0 else 0.0;\r
end PGEdgeDiagnostics;\r
\r
model ModelicaPoseGraph\r
\r
  parameter Integer nodeCapacity = 128; parameter Integer edgeCapacity = 256;\r
  parameter Integer maximumIterations = 8; parameter Integer maximumPCG = 48; parameter Integer maximumBacktracks = 8;\r
  parameter Real initialDamping = 0.001; parameter Real maximumPositionStep = 0.5;\r
  parameter Real maximumAngleStep = 0.2; parameter Real pcgTolerance = 1e-5;\r
  input Real position[nodeCapacity,3] = zeros(nodeCapacity,3);\r
  input Real rotation[nodeCapacity,3,3] = zeros(nodeCapacity,3,3);\r
  input Real nodeMask[nodeCapacity] = zeros(nodeCapacity); input Real edgeMask[edgeCapacity] = zeros(edgeCapacity);\r
  input Real fromNode[edgeCapacity] = ones(edgeCapacity); input Real toNode[edgeCapacity] = ones(edgeCapacity);\r
  input Real translation[edgeCapacity,3] = zeros(edgeCapacity,3);\r
  input Real measuredRotation[edgeCapacity,3,3] = zeros(edgeCapacity,3,3);\r
  input Real information[edgeCapacity,6,6] = zeros(edgeCapacity,6,6);\r
  output Real nextPosition[nodeCapacity,3]; output Real nextRotation[nodeCapacity,3,3];\r
  output Real status; output Real costBefore; output Real costAfter; output Real acceptedIterations;\r
  output Real pcgIterations; output Real activeNodes; output Real activeEdges;\r
equation\r
  (nextPosition,nextRotation,status,costBefore,costAfter,acceptedIterations,pcgIterations,activeNodes,activeEdges) =\r
    OptimizeModelicaPoseGraph(position,rotation,nodeMask,edgeMask,fromNode,toNode,translation,measuredRotation,information,\r
      maximumIterations,maximumPCG,maximumBacktracks,initialDamping,maximumPositionStep,maximumAngleStep,pcgTolerance);\r
end ModelicaPoseGraph;\r
\r
model ModelicaPoseGraphEdge\r
\r
  input Real pi[3] = zeros(3); input Real pj[3] = zeros(3);\r
  input Real Ri[3,3] = identity(3); input Real Rj[3,3] = identity(3);\r
  input Real translation[3] = zeros(3); input Real measuredRotation[3,3] = identity(3);\r
  output Real residual[6]; output Real Ji[6,6]; output Real Jj[6,6]; output Real valid;\r
equation\r
  (residual,Ji,Jj,valid) = PGEdgeDiagnostics(pi,Ri,pj,Rj,translation,measuredRotation);\r
end ModelicaPoseGraphEdge;\r
`;export{e as default};
