const q=[{id:"circuit",label:"Street circuit"},{id:"indoor",label:"Outdoor → indoor → outdoor"},{id:"office-loop",label:"Office loop"},{id:"hallway",label:"Hallway out and back"}];function W(e){return q.some(t=>t.id===e)}var U=`model MapFlightTour\r
  "Sample the existing map references at the held command boundary"\r
  input Real sampleTime = 0;\r
  input Real route = 1 "1 office loop, 2 hallway out and back";\r
  input Real origin[3] = {0,0,1.5};\r
  output Real position[3];\r
  output Real velocity[3];\r
  output Real acceleration[3];\r
  output Real heading;\r
equation\r
  position = if noEvent(route < 1.5) then\r
    {origin[1]+OfficeLoopProfile.X(sampleTime),origin[2]+OfficeLoopProfile.Y(sampleTime),origin[3]} else\r
    {origin[1]+HallwayProfile.Position(sampleTime),origin[2],origin[3]};\r
  velocity = if noEvent(route < 1.5) then\r
    {OfficeLoopProfile.VX(sampleTime),OfficeLoopProfile.VY(sampleTime),0} else\r
    {HallwayProfile.Velocity(sampleTime),0,0};\r
  acceleration = if noEvent(route < 1.5) then\r
    {OfficeLoopProfile.AX(sampleTime),OfficeLoopProfile.AY(sampleTime),0} else\r
    {HallwayProfile.Acceleration(sampleTime),0,0};\r
  heading = if noEvent(route < 1.5) then OfficeLoopProfile.Heading(sampleTime) else 0;\r
end MapFlightTour;\r
`,X=`// Closed four-corridor reference; controller, rigid body and motor dynamics remain active.\r
package OfficeLoopProfile\r
  function Progress\r
    input Real t; input Real startTime; input Real duration; output Real value;\r
  protected Real s;\r
  algorithm\r
    s := min(1,max(0,(t-startTime)/duration));\r
    value := 10*s*s*s-15*s*s*s*s+6*s*s*s*s*s;\r
  end Progress;\r
  function Speed\r
    input Real t; input Real startTime; input Real duration; output Real value;\r
  protected Real s;\r
  algorithm\r
    s := min(1,max(0,(t-startTime)/duration));\r
    value := (30*s*s-60*s*s*s+30*s*s*s*s)/duration;\r
  end Speed;\r
  function Accel\r
    input Real t; input Real startTime; input Real duration; output Real value;\r
  protected Real s;\r
  algorithm\r
    s := min(1,max(0,(t-startTime)/duration));\r
    value := (60*s-180*s*s+120*s*s*s)/(duration*duration);\r
  end Accel;\r
  function X\r
    input Real t; output Real value;\r
  algorithm value := 24*(Progress(t,5,60)-Progress(t,125,60)); end X;\r
  function Y\r
    input Real t; output Real value;\r
  algorithm value := 16*(Progress(t,75,40)-Progress(t,195,40)); end Y;\r
  function VX\r
    input Real t; output Real value;\r
  algorithm value := 24*(Speed(t,5,60)-Speed(t,125,60)); end VX;\r
  function VY\r
    input Real t; output Real value;\r
  algorithm value := 16*(Speed(t,75,40)-Speed(t,195,40)); end VY;\r
  function AX\r
    input Real t; output Real value;\r
  algorithm value := 24*(Accel(t,5,60)-Accel(t,125,60)); end AX;\r
  function AY\r
    input Real t; output Real value;\r
  algorithm value := 16*(Accel(t,75,40)-Accel(t,195,40)); end AY;\r
  function Heading\r
    input Real t; output Real value;\r
  algorithm value := (3.141592653589793/2)*(Progress(t,65,10)+Progress(t,115,10)+Progress(t,185,10)+Progress(t,235,10)); end Heading;\r
end OfficeLoopProfile;\r
`,Y=`// Ten-minute reference. The real controller/plant follows these targets.\r
package HallwayProfile\r
  function RampIntegral\r
    input Real s; output Real value;\r
  algorithm value := s*s*s-0.5*s*s*s*s; end RampIntegral;\r
  function Position\r
    input Real t; output Real x;\r
  algorithm\r
    x := if t <= 5 then 0 else if t < 15 then 5*RampIntegral((t-5)/10)\r
      else if t < 285 then 2.5+0.5*(t-15)\r
      else if t < 295 then 137.5+5*((t-285)/10-RampIntegral((t-285)/10))\r
      else if t < 305 then 140\r
      else if t < 315 then 140-5*RampIntegral((t-305)/10)\r
      else if t < 585 then 137.5-0.5*(t-315)\r
      else if t < 595 then 2.5-5*((t-585)/10-RampIntegral((t-585)/10)) else 0;\r
  end Position;\r
  function Velocity\r
    input Real t; output Real v;\r
  protected Real s;\r
  algorithm\r
    s := if t < 15 then (t-5)/10 else if t < 295 then (t-285)/10\r
      else if t < 315 then (t-305)/10 else (t-585)/10;\r
    v := if t <= 5 then 0 else if t < 15 then 0.5*(3*s*s-2*s*s*s)\r
      else if t < 285 then 0.5 else if t < 295 then 0.5*(1-3*s*s+2*s*s*s)\r
      else if t < 305 then 0 else if t < 315 then -0.5*(3*s*s-2*s*s*s)\r
      else if t < 585 then -0.5 else if t < 595 then -0.5*(1-3*s*s+2*s*s*s) else 0;\r
  end Velocity;\r
  function Acceleration\r
    input Real t; output Real a;\r
  protected Real s;\r
  algorithm\r
    s := if t < 15 then (t-5)/10 else if t < 295 then (t-285)/10\r
      else if t < 315 then (t-305)/10 else (t-585)/10;\r
    a := if t > 5 and t < 15 then 0.05*(6*s-6*s*s)\r
      else if t > 285 and t < 295 then -0.05*(6*s-6*s*s)\r
      else if t > 305 and t < 315 then -0.05*(6*s-6*s*s)\r
      else if t > 585 and t < 595 then 0.05*(6*s-6*s*s) else 0;\r
  end Acceleration;\r
end HallwayProfile;\r
`;const T="models/Planning/MapFlightTour.mo",B=Object.freeze({[T]:U,"models/Benchmarks/OfficeLoopProfile.mo":X,"models/Benchmarks/HallwayProfile.mo":Y}),N=["positionMode",...["targetPosition","targetVelocity","targetAcceleration"].flatMap(e=>[1,2,3].map(t=>`${e}[${t}]`)),"targetHeading"];class C{constructor(t,i){this.session=t,this.origin=i}session;origin;inputs(t,i,s){if(!Number.isFinite(i)||i<0||!Number.isFinite(s)||s<0)throw Error("Flight tour requires finite nonnegative times");if(t!=="office-loop"&&t!=="hallway")throw Error("Unknown map flight tour");this.session.set_inputs(JSON.stringify([["sampleTime",i],["route",t==="office-loop"?1:2],["origin[1]",this.origin.x],["origin[2]",this.origin.y],["origin[3]",this.origin.z]])),this.session.advance_to(s);const n=JSON.parse(this.session.state_json()).values,l=f=>{const a=n?.[f];if(typeof a!="number"||!Number.isFinite(a))throw Error(`Modelica flight tour must expose finite ${f}`);return a};return[["positionMode",1],...["Position","Velocity","Acceleration"].flatMap(f=>[1,2,3].map(a=>[`target${f}[${a}]`,l(`${f.toLowerCase()}[${a}]`)])),["targetHeading",l("heading")]]}reset(){this.session.reset()}free(){this.session.free()}}var Z=`{\r
  "repository": "CogniPilot/rumoca",\r
  "revision": "bc93cff7f7a4cccb5da5c84f8d72965885ff70c6",\r
  "runId": 40570006459,\r
  "artifact": "wasm-package",\r
  "variant": "release-full-web",\r
  "files": {\r
    "rumoca_bind_wasm.js": "d9d2894f03eb24d730905204b32b86caff93d351a3cd7989240232e232eb8387",\r
    "rumoca_bind_wasm_bg.wasm": "b802897ce953a07592f12ea707bfbf98219e694caea9a4fc8b36513d25762ada"\r
  },\r
  "version": "0.10.3",\r
  "distribution": "npm"\r
}\r
`;const D=JSON.parse(Z).revision;function j(e,t){const i=new URL(`vendor/rumoca/rumoca_bind_wasm${t==="wasm"?"_bg.wasm":".js"}`,e);return i.searchParams.set("revision",D),i.href}function E(e,t=!1){const{time:i,values:s}=JSON.parse(e.state_json());if(!Number.isFinite(i))throw new Error("Physics returned a nonfinite simulation time");const n=a=>{if(typeof s?.[a]!="number"||!Number.isFinite(s[a]))throw new Error(`Model must expose finite ${a}`);return s[a]},l=Array.from({length:4},(a,w)=>`propellerAngles[${w+1}]`),f=l.some(a=>Object.hasOwn(s??{},a));return{time:i,x:n("x"),y:n("y"),z:n("z"),quaternion:[n("qw"),n("qx"),n("qy"),n("qz")],velocity:["vx","vy","vz"].map(n),accel:["imu_ax","imu_ay","imu_az"].map(n),gyro:["p","q","r"].map(n),...t?{command:{forward:n("forwardSetpoint"),left:n("leftSetpoint"),up:n("upSetpoint"),yaw:n("yawSetpoint")}}:{},...f?{propellerAngles:l.map(n)}:{}}}function M(e,t=0){const i=[],s=/\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[A-Za-z_$][\w$]*|(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|./gy;s.lastIndex=t;let n;for(;n=s.exec(e);){const l=n[0];/^\s|^\/\/|^\/\*/.test(l)||i.push({text:l,start:n.index,end:s.lastIndex})}return i}const I=e=>{try{return JSON.parse(e)}catch{return e.slice(1,-1)}},J=(e,t)=>{let i=0;for(let s=0;s<t.line;s++)i=e.indexOf(`
`,i)+1;return i+t.character},G=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1 $2").replace(/^./,t=>t.toUpperCase());function Q(e,t){const i=J(e,t.selectionRange.start),s=M(e,i);let n=0,l=s.length;const f=M(e.slice(0,J(e,t.range.start)));let a=f.length-1;for(;a>=0&&f[a].text!==";";)a--;const w=f.slice(a+1),v=w.some(r=>r.text==="final"),_=w.some(r=>r.text==="constant");for(let r=0;r<s.length;r++){const o=s[r].text;if(o===";"&&n===0){l=r;break}["(","[","{"].includes(o)&&n++,[")","]","}"].includes(o)&&n--}const u=s.slice(0,l);let R="",y="",p=-1,m=-1;n=0;let g=[];if(u[1]?.text==="["){let r=2,o=r,h=0;for(;r<u.length;r++){const c=u[r].text;if((c===","||c==="]")&&h===0){if(g.push(e.slice(u[o].start,u[r].start).trim()),o=r+1,c==="]")break}else["(","[","{"].includes(c)?h++:[")","]","}"].includes(c)&&h--}}for(let r=1;r<u.length;r++){const o=u[r].text;if(n===0){if(o==="="&&p<0&&(p=r+1),o==="annotation"){m=r;break}o.startsWith('"')&&(R=I(o),p>=0&&!y&&(y=e.slice(u[p].start,u[r].start).trim()))}["(","[","{"].includes(o)&&n++,[")","]","}"].includes(o)&&n--}p>=0&&!y&&(y=e.slice(u[p].start,m>=0?u[m].start:u.at(-1).end).trim());const d={};for(let r=0;r<u.length-2;r++)if(u[r+1].text==="="){const o=u[r].text,h=u[r+2].text;if(["unit","group","tab"].includes(o)&&h.startsWith('"')&&(d[o]=I(h)),["min","max"].includes(o)){const c=Number(h==="-"?"-"+u[r+3]?.text:h);Number.isFinite(c)&&(d[o]=c)}}return{name:t.name,type:(t.detail??"Real").split("[")[0],label:G(t.name),description:R,final:v,..._?{constant:!0}:{},expression:y,dimensions:g,unit:d.unit,group:d.group,tab:d.tab,minValue:d.min,maxValue:d.max}}function A(e,t){const i=[];function s(n,l=[]){if(n.name==="Parameters"||n.name==="Inputs")for(const f of n.children??[])i.push({...Q(e,f),owner:l.join("."),kind:n.name==="Parameters"?"parameter":"input"});else for(const f of n.children??[])s(f,[...l,n.name])}for(const n of t)s(n);return i}function K(e,t,i,s,n={}){try{return JSON.parse(s(t,i))}catch(l){let f=function(p){if(w.has(p))return;w.add(p);let m=_.some(r=>r.owner===p||p.endsWith("."+r.owner))?t:void 0;for(let r=p.split(".");!m&&r.length;r.pop()){const o=r.join("/"),h=Object.keys(n).find(c=>c.endsWith("/"+o+".mo")||c.endsWith("/"+o+"/package.mo"));h&&(m=n[h])}if(!m&&p===i&&(m=t),!m)throw Error(`Original declaration source is unavailable for ${p}`);const g=A(m,JSON.parse(e.lsp_document_symbols(m)));for(const r of g.filter(o=>o.kind==="input"&&(o.owner===p||p.endsWith("."+o.owner))&&!o.expression)){if(!["Real","Integer","Boolean","String"].includes(r.type))continue;const o=r.type==="Boolean"?"false":r.type==="String"?'""':r.type==="Integer"?"0":"0.0";a.set(r.name,r.dimensions?.length?`fill(${o},${r.dimensions.join(",")})`:o)}let d=m;try{d=JSON.parse(e.get_class_info(p)).source_modelica}catch{}for(const r of d.matchAll(/\bextends\s+([\w.]+)/g)){let o=r[1];const h=[...m.matchAll(/\bimport\s+(\w+)\s*=\s*([\w.]+)/g)].find(c=>c[1]===o);if(h)o=h[2];else{let c=!1;try{e.get_class_info(o),c=!0}catch{}for(let $=p.split(".").slice(0,-1);!c&&$.length;$.pop()){const k=[...$,o].join(".");try{e.get_class_info(k),o=k,c=!0}catch{}}}try{f(o)}catch(c){v.push(String(c))}}};if(!String(l).includes("neither a checked default nor a runtime value"))throw l;const a=new Map,w=new Set,v=[],_=A(t,JSON.parse(e.lsp_document_symbols(t)));if(f(i),!a.size)throw Error(`${String(l)}${v.length?`; inspection: ${v.join("; ")}`:""}`);let u="ParameterInspection";for(;new RegExp(`\\b${u}\\b`).test(t);)u+="_";const R=i.includes(".")?i.slice(0,i.lastIndexOf(".")):t.match(/^\s*within\s+([\w.]+)\s*;/)?.[1],y=t+`
model ${u}
 extends ${i}(${[...a].map(([p,m])=>`${p}=${m}`).join(",")});
end ${u};
`;return JSON.parse(s(y,R?`${R}.${u}`:u))}}let ee;function te(){return ee??=WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,5,5,2,0,1,0,1]))}function ne(){return te()?"auto":"interpreter"}function F(e,t,i,s,n,l,f,a,w={},v={},_=ne()){if(!Object.keys(w).length&&_==="auto")return e.WasmSimulationSession.withInteractiveOptions(t,i,s,n,l,f,a);const u=K(e,t,i,e.model_parameter_metadata,v),R=new Set(u.map(g=>g.name)),y={},p=Object.create(null),m=A(t,JSON.parse(e.lsp_document_symbols(t)));for(const[g,d]of Object.entries(w)){if(R.has(g)&&typeof d=="number"){y[g]=d;continue}if(!/^[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*$/.test(g))throw Error(`Structural/text array parameter ${g} requires a Modelica source binding`);const r=g.split(".");let o=p;for(const c of r.slice(0,-1))o=o[c]??=Object.create(null);const h=m.some(c=>c.name===g&&c.type==="Boolean");o[r.at(-1)]=typeof d=="string"?JSON.stringify(d):h?d===1?"true":"false":String(d)}if(Object.keys(p).length){const g=o=>Object.entries(o).map(([h,c])=>typeof c=="string"?`${h}=${c}`:`${h}(${g(c)})`).join(",");let d="ConfiguredExperiment";for(;new RegExp(`\\b${d}\\b`).test(t);)d+="_";const r=i.includes(".")?i.slice(0,i.lastIndexOf(".")):t.match(/^\s*within\s+([\w.]+)\s*;/)?.[1];t+=`
model ${d}
 extends ${i}(${g(p)});
end ${d};
`,i=r?`${r}.${d}`:d}return e.WasmSimulationSession.withInteractiveConfiguration(t,i,JSON.stringify({dt:s,solver:n,atol:l,rtol:f,initial_inputs:JSON.parse(a),execution_policy:_,parameters:y}))}let x,b,S,L="",z={x:0,y:0,z:1.5},H=!1,O=!1,P=[];async function re(e){if(e.type==="init"){x??=await import(j(e.base,"js")),await x.default({module_or_path:j(e.base,"wasm")});const t={...B,...e.workspaceSources},i=t[T];if(delete t[T],typeof i!="string")throw Error("Map flight tour source is missing");const s=JSON.parse(x.sync_workspace_sources(JSON.stringify(t)));if(s.error_count)throw new Error("Rumoca could not load the flight library: "+s.skipped_files.join(", "));const n=F(x,e.source,e.modelName??"LabQuadrotor",.01,"rk-like",1e-8,1e-6,'[["forward",0],["left",0],["up",0],["yaw",0]]',e.parameters,e.workspaceSources);let l,f=!1;try{l=E(n,!0);const a=JSON.parse(n.input_names());if(!Array.isArray(a)||!a.every(w=>typeof w=="string"))throw Error("Invalid physics input names");f=N.every(w=>a.includes(w))}catch(a){throw n.free(),a}return H=f,S?.free(),S=void 0,O=!1,P=[],L=i,z={x:l.x,y:l.y,z:l.z},b?.free(),b=n,l}else if(e.type==="step"){if(!b)throw new Error("Physics has not been compiled");const t=e.tourMode??(e.indoorTour?"indoor":"circuit");if(!W(t))throw Error("Unknown flight tour route");const i=e.autopilot&&(t==="office-loop"||t==="hallway");if(i&&!H)throw Error("This physics model has no map trajectory inputs. Load the current default physics model or choose a legacy tour.");i&&!O&&(P=N.map(n=>{const l=b.get(n);if(typeof l!="number"||!Number.isFinite(l))throw Error("Map trajectory input is unavailable: "+n);return[n,l]})),i&&!S&&(S=new C(F(x,L,"MapFlightTour",.01,"rk-like",1e-12,1e-12,"[]"),z));const s=i?S.inputs(t,e.commandTime,e.time):O?P:[];b.set_inputs(JSON.stringify([...Object.entries(e.command),["autopilot",e.autopilot?1:0],["indoorTour",t==="indoor"?1:0],["commandTime",e.commandTime],...s])),b.advance_to(e.time),O=!!i}else e.type==="reset"&&(b?.reset(),S?.reset(),O=!1,P=[]);if(!b)throw new Error("No physics session");if(e.type==="executionReceipt"){const t=b;if(typeof t.execution_receipt_json!="function")throw new Error("Installed Rumoca does not expose execution receipts");return{compiler:{version:x.get_version(),revision:x.get_git_commit()},execution:JSON.parse(t.execution_receipt_json())}}return E(b,!0)}let V=Promise.resolve();self.onmessage=({data:e})=>{V=V.then(async()=>{try{self.postMessage({id:e.id,result:await re(e)})}catch(t){self.postMessage({id:e.id,error:String(t)})}})};
