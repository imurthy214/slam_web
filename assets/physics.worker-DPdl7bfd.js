const q=[{id:"circuit",label:"Street circuit"},{id:"indoor",label:"Outdoor → indoor → outdoor"},{id:"office-loop",label:"Office loop"},{id:"hallway",label:"Hallway out and back"}];function W(e){return q.some(t=>t.id===e)}var X=`model MapFlightTour\r
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
`,Y=`// Closed four-corridor reference; controller, rigid body and motor dynamics remain active.\r
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
`,U=`// Ten-minute reference. The real controller/plant follows these targets.\r
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
`;const T="models/Planning/MapFlightTour.mo",B=Object.freeze({[T]:X,"models/Benchmarks/OfficeLoopProfile.mo":Y,"models/Benchmarks/HallwayProfile.mo":U}),N=["positionMode",...["targetPosition","targetVelocity","targetAcceleration"].flatMap(e=>[1,2,3].map(t=>`${e}[${t}]`)),"targetHeading"];class C{constructor(t,i){this.session=t,this.origin=i}session;origin;inputs(t,i,s){if(!Number.isFinite(i)||i<0||!Number.isFinite(s)||s<0)throw Error("Flight tour requires finite nonnegative times");if(t!=="office-loop"&&t!=="hallway")throw Error("Unknown map flight tour");this.session.set_inputs(JSON.stringify([["sampleTime",i],["route",t==="office-loop"?1:2],["origin[1]",this.origin.x],["origin[2]",this.origin.y],["origin[3]",this.origin.z]])),this.session.advance_to(s);const n=JSON.parse(this.session.state_json()).values,l=f=>{const a=n?.[f];if(typeof a!="number"||!Number.isFinite(a))throw Error(`Modelica flight tour must expose finite ${f}`);return a};return[["positionMode",1],...["Position","Velocity","Acceleration"].flatMap(f=>[1,2,3].map(a=>[`target${f}[${a}]`,l(`${f.toLowerCase()}[${a}]`)])),["targetHeading",l("heading")]]}reset(){this.session.reset()}free(){this.session.free()}}var Z=`{\r
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
`,i)+1;return i+t.character},G=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1 $2").replace(/^./,t=>t.toUpperCase());function Q(e,t){const i=J(e,t.selectionRange.start),s=M(e,i);let n=0,l=s.length;const f=M(e.slice(0,J(e,t.range.start)));let a=f.length-1;for(;a>=0&&f[a].text!==";";)a--;const w=f.slice(a+1),R=w.some(r=>r.text==="final"),S=w.some(r=>r.text==="constant");for(let r=0;r<s.length;r++){const o=s[r].text;if(o===";"&&n===0){l=r;break}["(","[","{"].includes(o)&&n++,[")","]","}"].includes(o)&&n--}const u=s.slice(0,l);let v="",y="",d=-1,c=-1;n=0;let m=[];if(u[1]?.text==="["){let r=2,o=r,p=0;for(;r<u.length;r++){const h=u[r].text;if((h===","||h==="]")&&p===0){if(m.push(e.slice(u[o].start,u[r].start).trim()),o=r+1,h==="]")break}else["(","[","{"].includes(h)?p++:[")","]","}"].includes(h)&&p--}}for(let r=1;r<u.length;r++){const o=u[r].text;if(n===0){if(o==="="&&d<0&&(d=r+1),o==="annotation"){c=r;break}o.startsWith('"')&&(v=I(o),d>=0&&!y&&(y=e.slice(u[d].start,u[r].start).trim()))}["(","[","{"].includes(o)&&n++,[")","]","}"].includes(o)&&n--}d>=0&&!y&&(y=e.slice(u[d].start,c>=0?u[c].start:u.at(-1).end).trim());const g={};for(let r=0;r<u.length-2;r++)if(u[r+1].text==="="){const o=u[r].text,p=u[r+2].text;if(["unit","group","tab"].includes(o)&&p.startsWith('"')&&(g[o]=I(p)),["min","max"].includes(o)){const h=Number(p==="-"?"-"+u[r+3]?.text:p);Number.isFinite(h)&&(g[o]=h)}}return{name:t.name,type:(t.detail??"Real").split("[")[0],label:G(t.name),description:v,final:R,...S?{constant:!0}:{},expression:y,dimensions:m,unit:g.unit,group:g.group,tab:g.tab,minValue:g.min,maxValue:g.max}}function A(e,t){const i=[];function s(n,l=[]){if(n.name==="Parameters"||n.name==="Inputs")for(const f of n.children??[])i.push({...Q(e,f),owner:l.join("."),kind:n.name==="Parameters"?"parameter":"input"});else for(const f of n.children??[])s(f,[...l,n.name])}for(const n of t)s(n);return i}function K(e,t,i,s,n={}){try{return JSON.parse(s(t,i))}catch(l){let f=function(d){if(w.has(d))return;w.add(d);let c=S.some(r=>r.owner===d||d.endsWith("."+r.owner))?t:void 0;for(let r=d.split(".");!c&&r.length;r.pop()){const o=r.join("/"),p=Object.keys(n).find(h=>h.endsWith("/"+o+".mo")||h.endsWith("/"+o+"/package.mo"));p&&(c=n[p])}if(!c&&d===i&&(c=t),!c)throw Error(`Original declaration source is unavailable for ${d}`);const m=A(c,JSON.parse(e.lsp_document_symbols(c)));for(const r of m.filter(o=>o.kind==="input"&&(o.owner===d||d.endsWith("."+o.owner))&&!o.expression)){if(!["Real","Integer","Boolean","String"].includes(r.type))continue;const o=r.type==="Boolean"?"false":r.type==="String"?'""':r.type==="Integer"?"0":"0.0";a.set(r.name,r.dimensions?.length?`fill(${o},${r.dimensions.join(",")})`:o)}let g=c;try{g=JSON.parse(e.get_class_info(d)).source_modelica}catch{}for(const r of g.matchAll(/\bextends\s+([\w.]+)/g)){let o=r[1];const p=[...c.matchAll(/\bimport\s+(\w+)\s*=\s*([\w.]+)/g)].find(h=>h[1]===o);if(p)o=p[2];else{let h=!1;try{e.get_class_info(o),h=!0}catch{}for(let $=d.split(".").slice(0,-1);!h&&$.length;$.pop()){const k=[...$,o].join(".");try{e.get_class_info(k),o=k,h=!0}catch{}}}try{f(o)}catch(h){R.push(String(h))}}};if(!String(l).includes("neither a checked default nor a runtime value"))throw l;const a=new Map,w=new Set,R=[],S=A(t,JSON.parse(e.lsp_document_symbols(t)));if(f(i),!a.size)throw Error(`${String(l)}${R.length?`; inspection: ${R.join("; ")}`:""}`);let u="ParameterInspection";for(;new RegExp(`\\b${u}\\b`).test(t);)u+="_";const v=i.includes(".")?i.slice(0,i.lastIndexOf(".")):t.match(/^\s*within\s+([\w.]+)\s*;/)?.[1],y=t+`
model ${u}
 extends ${i}(${[...a].map(([d,c])=>`${d}=${c}`).join(",")});
end ${u};
`;return JSON.parse(s(y,v?`${v}.${u}`:u))}}function F(e,t,i,s,n,l,f,a,w={},R={}){if(!Object.keys(w).length)return e.WasmSimulationSession.withInteractiveOptions(t,i,s,n,l,f,a);const S=K(e,t,i,e.model_parameter_metadata,R),u=new Set(S.map(c=>c.name)),v={},y=Object.create(null),d=A(t,JSON.parse(e.lsp_document_symbols(t)));for(const[c,m]of Object.entries(w)){if(u.has(c)&&typeof m=="number"){v[c]=m;continue}if(!/^[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*$/.test(c))throw Error(`Structural/text array parameter ${c} requires a Modelica source binding`);const g=c.split(".");let r=y;for(const p of g.slice(0,-1))r=r[p]??=Object.create(null);const o=d.some(p=>p.name===c&&p.type==="Boolean");r[g.at(-1)]=typeof m=="string"?JSON.stringify(m):o?m===1?"true":"false":String(m)}if(Object.keys(y).length){const c=r=>Object.entries(r).map(([o,p])=>typeof p=="string"?`${o}=${p}`:`${o}(${c(p)})`).join(",");let m="ConfiguredExperiment";for(;new RegExp(`\\b${m}\\b`).test(t);)m+="_";const g=i.includes(".")?i.slice(0,i.lastIndexOf(".")):t.match(/^\s*within\s+([\w.]+)\s*;/)?.[1];t+=`
model ${m}
 extends ${i}(${c(y)});
end ${m};
`,i=g?`${g}.${m}`:m}return e.WasmSimulationSession.withInteractiveConfiguration(t,i,JSON.stringify({dt:s,solver:n,atol:l,rtol:f,initial_inputs:JSON.parse(a),execution_policy:"auto",parameters:v}))}let x,b,_,L="",z={x:0,y:0,z:1.5},H=!1,O=!1,P=[];async function ee(e){if(e.type==="init"){x??=await import(j(e.base,"js")),await x.default({module_or_path:j(e.base,"wasm")});const t={...B,...e.workspaceSources},i=t[T];if(delete t[T],typeof i!="string")throw Error("Map flight tour source is missing");const s=JSON.parse(x.sync_workspace_sources(JSON.stringify(t)));if(s.error_count)throw new Error("Rumoca could not load the flight library: "+s.skipped_files.join(", "));const n=F(x,e.source,e.modelName??"LabQuadrotor",.01,"rk-like",1e-8,1e-6,'[["forward",0],["left",0],["up",0],["yaw",0]]',e.parameters,e.workspaceSources);let l,f=!1;try{l=E(n,!0);const a=JSON.parse(n.input_names());if(!Array.isArray(a)||!a.every(w=>typeof w=="string"))throw Error("Invalid physics input names");f=N.every(w=>a.includes(w))}catch(a){throw n.free(),a}return H=f,_?.free(),_=void 0,O=!1,P=[],L=i,z={x:l.x,y:l.y,z:l.z},b?.free(),b=n,l}else if(e.type==="step"){if(!b)throw new Error("Physics has not been compiled");const t=e.tourMode??(e.indoorTour?"indoor":"circuit");if(!W(t))throw Error("Unknown flight tour route");const i=e.autopilot&&(t==="office-loop"||t==="hallway");if(i&&!H)throw Error("This physics model has no map trajectory inputs. Load the current default physics model or choose a legacy tour.");i&&!O&&(P=N.map(n=>{const l=b.get(n);if(typeof l!="number"||!Number.isFinite(l))throw Error("Map trajectory input is unavailable: "+n);return[n,l]})),i&&!_&&(_=new C(F(x,L,"MapFlightTour",.01,"rk-like",1e-12,1e-12,"[]"),z));const s=i?_.inputs(t,e.commandTime,e.time):O?P:[];b.set_inputs(JSON.stringify([...Object.entries(e.command),["autopilot",e.autopilot?1:0],["indoorTour",t==="indoor"?1:0],["commandTime",e.commandTime],...s])),b.advance_to(e.time),O=!!i}else e.type==="reset"&&(b?.reset(),_?.reset(),O=!1,P=[]);if(!b)throw new Error("No physics session");if(e.type==="executionReceipt"){const t=b;if(typeof t.execution_receipt_json!="function")throw new Error("Installed Rumoca does not expose execution receipts");return{compiler:{version:x.get_version(),revision:x.get_git_commit()},execution:JSON.parse(t.execution_receipt_json())}}return E(b,!0)}let V=Promise.resolve();self.onmessage=({data:e})=>{V=V.then(async()=>{try{self.postMessage({id:e.id,result:await ee(e)})}catch(t){self.postMessage({id:e.id,error:String(t)})}})};
