"use client";
import { useState, useEffect } from "react";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300;1,9..40,400&display=swap');`;

const C = {
  bg:"#F7F5F0",card:"#FFFFFF",border:"#E2DED5",accent:"#1B5E4B",accentLight:"#E8F0ED",
  accentDark:"#0F3D30",text:"#2C2926",textMid:"#6B6560",textLight:"#9B958E",
  warm:"#D4A853",warmLight:"#FBF5E8",danger:"#C0392B",dangerLight:"#FDECEB",
  sel:"#1B5E4B",selTxt:"#FFF",link:"#2E7DBA",linkBg:"#EBF3FA"
};

const OBJ_TYPES = {
  MID:{id:"MID",label:"MID Threshold",
    desc:"Establish a minimally important difference threshold (important vs. trivial effect)",
    opts:["All or almost all would consider this an important effect","Most would consider this an important effect",
      "A majority would consider this an important effect","A majority would consider this a trivial effect",
      "Most would consider this a trivial effect","All or almost all would consider this a trivial effect"]},
  DECISION:{id:"DECISION",label:"Decision Threshold",
    desc:"Establish a threshold where recommendations shift (choose vs. decline intervention)",
    opts:["All or almost all (over 90%) would choose the intervention","Most (75–90%) would choose the intervention",
      "A majority (51–74%) would choose the intervention","A majority (51–74%) would decline the intervention",
      "Most (75–90%) would decline the intervention","All or almost all (over 90%) would decline the intervention"]},
  PROPORTION:{id:"PROPORTION",label:"Proportion Electing",
    desc:"Specify the percentage of patients who would elect for or against an intervention across risk groups",
    opts:["All or almost all would choose the intervention","Most would choose the intervention",
      "Majority would choose the intervention","Majority would decline the intervention",
      "Most would decline the intervention","All or almost all would decline the intervention"]}
};

let _id=0; const uid=()=>`id_${++_id}_${Date.now()}`;

function roundNice(v){
  if(v<=0)return 0; if(v<1)return Math.round(v*10)/10;
  if(v<=5)return Math.round(v); if(v<=20)return Math.round(v/2)*2;
  if(v<=100)return Math.round(v/5)*5; if(v<=500)return Math.round(v/10)*10;
  if(v<=2000)return Math.round(v/50)*50; return Math.round(v/100)*100;
}

function genValues(min,max,n=6){
  const lo=Math.min(min,max),hi=Math.max(min,max);
  if(lo===hi)return[lo];
  let vals=Array.from({length:n},(_,i)=>roundNice(lo+(hi-lo)*(i/(n-1))));
  vals[0]=roundNice(lo); vals[n-1]=roundNice(hi);
  return[...new Set(vals)].sort((a,b)=>a-b);
}

function autoDesc(type,outcome,mag,tp){
  const oc=(outcome||"the outcome").toLowerCase(), tps=tp?` ${tp}`:"";
  if(type==="MID") return`an intervention lowers their risk by ${mag} in 1000 (i.e. a decrease in ${oc} of ${mag} in 1,000 patients)${tps}`;
  if(type==="DECISION") return`${mag} in 1000 lower risk of ${oc}${tps}`;
  return`${outcome||"Outcome"}: ${mag} in 1000 reduction${tps}`;
}

function questionText(survey,sc){
  const{objectiveType:t,population:p,intervention:iv}=survey;
  if(t==="MID") return`In ${p.toLowerCase()}, ${sc.autoDescription}. Please choose an option that reflects the proportion of patients who would consider this reduction in risk an at least minimally important or trivial effect. Minimally important difference refers to the smallest difference in the outcome of interest that informed patients or informed proxies perceive as important.`;
  if(t==="DECISION") return`For ${p.toLowerCase()}, how would patients view the trade-off between benefits and harms${iv?` of ${iv.toLowerCase()}`:""}?`;
  return`For ${p.toLowerCase()}, how would patients view the following effects?`;
}

// API functions using fetch
async function loadS(){
  try{
    const res = await fetch('/api/surveys');
    if(!res.ok) return [];
    return await res.json();
  }catch{
    return [];
  }
}

async function saveS(survey){
  try{
    const res = await fetch('/api/surveys', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(survey)
    });
    if(!res.ok){
      const error = await res.json();
      throw new Error(error.error || 'Failed to save survey');
    }
    return await res.json();
  }catch(e){
    console.error('Error saving survey:', e);
    throw e;
  }
}

async function deleteS(id){
  try{
    await fetch(`/api/surveys?id=${id}`, {method: 'DELETE'});
  }catch(e){
    console.error(e);
  }
}

async function loadR(surveyId){
  try{
    const res = await fetch(`/api/responses?surveyId=${surveyId}`);
    if(!res.ok) return [];
    return await res.json();
  }catch{
    return [];
  }
}

async function saveR(surveyId,response){
  try{
    const res = await fetch('/api/responses', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({surveyId, response})
    });
    return await res.json();
  }catch(e){
    console.error(e);
  }
}

// ─── UI Components ───
const font="'DM Sans', sans-serif", serif="'DM Serif Display', serif";

function Tag({children,color=C.accent,bg=C.accentLight}){
  return <span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,letterSpacing:"0.04em",color,background:bg,textTransform:"uppercase",fontFamily:font}}>{children}</span>;
}

function Btn({children,onClick,variant="primary",small,disabled,style:sx}){
  const base={fontFamily:font,fontWeight:600,fontSize:small?13:14,border:"none",borderRadius:8,cursor:disabled?"not-allowed":"pointer",padding:small?"6px 14px":"10px 22px",transition:"all 0.2s",opacity:disabled?0.5:1};
  const vs={primary:{background:C.accent,color:"#fff"},secondary:{background:"transparent",color:C.accent,border:`1.5px solid ${C.accent}`},danger:{background:C.danger,color:"#fff"},ghost:{background:"transparent",color:C.textMid,padding:small?"6px 10px":"10px 16px"},warm:{background:C.warm,color:"#fff"},link:{background:C.link,color:"#fff"}};
  return <button style={{...base,...vs[variant],...sx}} onClick={disabled?undefined:onClick}>{children}</button>;
}

function Inp({label,value,onChange,type="text",placeholder,multi,suffix,disabled,style:sx}){
  const sh={fontFamily:font,fontSize:14,padding:"10px 14px",border:`1.5px solid ${C.border}`,borderRadius:8,background:disabled?"#F5F4F1":C.card,color:C.text,outline:"none",width:"100%",boxSizing:"border-box"};
  return(
    <div style={{marginBottom:14,...sx}}>
      {label&&<label style={{display:"block",fontSize:12,fontWeight:600,color:C.textMid,marginBottom:5,fontFamily:font,letterSpacing:"0.03em",textTransform:"uppercase"}}>{label}</label>}
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        {multi?<textarea rows={3} style={{...sh,resize:"vertical"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} disabled={disabled}/>
          :<input type={type} style={sh} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} disabled={disabled}/>}
        {suffix&&<span style={{fontSize:13,color:C.textMid,fontFamily:font,whiteSpace:"nowrap"}}>{suffix}</span>}
      </div>
    </div>
  );
}

function Sel({label,value,onChange,options}){
  return(
    <div style={{marginBottom:14}}>
      {label&&<label style={{display:"block",fontSize:12,fontWeight:600,color:C.textMid,marginBottom:5,fontFamily:font,letterSpacing:"0.03em",textTransform:"uppercase"}}>{label}</label>}
      <select style={{fontFamily:font,fontSize:14,padding:"10px 14px",border:`1.5px solid ${C.border}`,borderRadius:8,background:C.card,color:C.text,width:"100%",boxSizing:"border-box"}} value={value} onChange={e=>onChange(e.target.value)}>
        {options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

function Card({children,style:sx}){
  return <div style={{background:C.card,borderRadius:14,border:`1px solid ${C.border}`,padding:28,boxShadow:"0 1px 4px rgba(0,0,0,0.04)",...sx}}>{children}</div>;
}

function RadioOpt({label,selected,onClick}){
  return(
    <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:10,cursor:"pointer",transition:"all 0.2s",background:selected?C.sel:"transparent",border:`1.5px solid ${selected?C.sel:C.border}`,marginBottom:6}}>
      <div style={{width:20,height:20,borderRadius:"50%",flexShrink:0,border:`2px solid ${selected?"#fff":C.border}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
        {selected&&<div style={{width:10,height:10,borderRadius:"50%",background:"#fff"}}/>}
      </div>
      <span style={{fontSize:14,fontFamily:font,lineHeight:1.4,color:selected?C.selTxt:C.text,fontWeight:selected?500:400}}>{label}</span>
    </div>
  );
}

// ─── Share Link ───
function ShareLink({surveyId}){
  const[copied,setCopied]=useState(false);
  const url=`${window.location.origin}${window.location.pathname}#respond/${surveyId}`;
  const copy=async()=>{
    try{await navigator.clipboard.writeText(url);}catch{const t=document.createElement("textarea");t.value=url;document.body.appendChild(t);t.select();document.execCommand("copy");document.body.removeChild(t);}
    setCopied(true);setTimeout(()=>setCopied(false),2500);
  };
  return(
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:10,background:C.linkBg,border:`1px solid ${C.link}33`}}>
      <span style={{fontSize:16}}>🔗</span>
      <code style={{flex:1,fontFamily:font,fontSize:12,color:C.link,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",userSelect:"all"}}>{url}</code>
      <Btn small variant="link" onClick={copy} style={{flexShrink:0}}>{copied?"✓ Copied!":"Copy Link"}</Btn>
    </div>
  );
}

// ─── Scenario Range Generator ───
function ScenarioGen({objectiveType,outcome,timePeriod,onGenerate,existing}){
  const[min,setMin]=useState(""); const[max,setMax]=useState(""); const[preview,setPrev]=useState(null);
  const doPrev=()=>{const lo=parseFloat(min),hi=parseFloat(max);if(isNaN(lo)||isNaN(hi)||lo<0||hi<0)return;setPrev(genValues(lo,hi,6));};
  const doConfirm=(append=false)=>{if(!preview)return;const newScs=preview.map(v=>({id:uid(),magnitude:v,autoDescription:autoDesc(objectiveType,outcome||"the outcome",v,timePeriod)}));if(append){onGenerate(prev=>[...prev,...newScs]);}else{onGenerate(newScs);}setPrev(null);};
  useEffect(()=>{setPrev(null);},[min,max]);

  return(
    <Card style={{marginBottom:20,background:"#FAFAF7"}}>
      <h4 style={{fontFamily:serif,fontSize:16,color:C.accent,margin:"0 0 12px"}}>Generate Scenarios</h4>
      <p style={{fontFamily:font,fontSize:13,color:C.textMid,margin:"0 0 16px",lineHeight:1.5}}>Enter the lowest and highest effect magnitude. Six evenly-spaced scenarios with round numbers will be generated automatically.</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:12,alignItems:"end"}}>
        <Inp label="Lowest effect (per 1000)" value={min} onChange={setMin} type="number" placeholder="e.g. 1" suffix="in 1000"/>
        <Inp label="Highest effect (per 1000)" value={max} onChange={setMax} type="number" placeholder="e.g. 20" suffix="in 1000"/>
        <div style={{marginBottom:14}}><Btn small onClick={doPrev} disabled={!min||!max}>Preview</Btn></div>
      </div>
      {preview&&(
        <div style={{marginTop:8}}>
          <div style={{padding:16,borderRadius:10,background:C.accentLight,border:`1px solid ${C.accent}22`}}>
            <p style={{fontSize:12,fontWeight:600,color:C.accent,margin:"0 0 10px",fontFamily:font,textTransform:"uppercase",letterSpacing:"0.04em"}}>{preview.length} scenarios will be generated:</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {preview.map((v,i)=><span key={i} style={{display:"inline-block",padding:"6px 14px",borderRadius:8,background:C.card,border:`1px solid ${C.border}`,fontFamily:font,fontSize:14,fontWeight:600,color:C.accent}}>{v} in 1000</span>)}
            </div>
            {outcome&&<p style={{fontSize:12,color:C.textMid,margin:"10px 0 0",fontFamily:font,fontStyle:"italic"}}>Example: "…{autoDesc(objectiveType,outcome,preview[0],timePeriod)}"</p>}
          </div>
          <div style={{marginTop:12,display:"flex",gap:8,justifyContent:"flex-end"}}>
            <Btn small variant="secondary" onClick={()=>setPrev(null)}>Cancel</Btn>
            {existing?.length>0&&<Btn small variant="secondary" onClick={()=>doConfirm(true)}>Add to Existing</Btn>}
            <Btn small onClick={()=>doConfirm(false)}>{existing?.length>0?"Replace Existing":"Generate Scenarios"}</Btn>
          </div>
        </div>
      )}
      {existing?.length>0&&!preview&&(
        <div style={{marginTop:12,padding:12,borderRadius:8,background:C.warmLight,border:`1px solid ${C.warm}33`}}>
          <p style={{fontSize:12,fontWeight:600,color:C.warm,margin:"0 0 6px",fontFamily:font}}>Current scenarios ({existing.length}):</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {existing.map((sc,i)=><span key={i} style={{fontSize:13,fontFamily:font,color:C.text,padding:"3px 10px",borderRadius:6,background:"#fff",border:`1px solid ${C.border}`}}>{sc.magnitude} in 1000</span>)}
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Survey Builder ───
function SurveyBuilder({existingSurvey,onSave,onCancel}){
  const[title,setTitle]=useState(existingSurvey?.title||"");
  const[ot,setOt]=useState(existingSurvey?.objectiveType||"MID");
  const[pop,setPop]=useState(existingSurvey?.population||"");
  const[oc,setOc]=useState(existingSurvey?.outcome||"");
  const[tp,setTp]=useState(existingSurvey?.timePeriod||"");
  const[intro,setIntro]=useState(existingSurvey?.introText||"");
  const[harm,setHarm]=useState(existingSurvey?.harmInfo||"");
  const[scenarios,setSc]=useState([...(existingSurvey?.scenarios||[])].sort((a,b)=>a.magnitude-b.magnitude));
  const[addMag,setAddMag]=useState("");
  const setSortedSc=v=>setSc(typeof v==="function"?prev=>[...v(prev)].sort((a,b)=>a.magnitude-b.magnitude):[...v].sort((a,b)=>a.magnitude-b.magnitude));

  useEffect(()=>{
    if(scenarios.length>0&&oc){setSc(p=>p.map(s=>({...s,autoDescription:autoDesc(ot,oc,s.magnitude,tp)})));}
  },[oc,tp,ot]);

  const valid=title&&pop&&oc&&scenarios.length>0;
  const save=()=>onSave({id:existingSurvey?.id||uid(),title,objectiveType:ot,population:pop,outcome:oc,timePeriod:tp,introText:intro,harmInfo:harm,scenarios,createdAt:existingSurvey?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()});

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
        <Btn variant="ghost" small onClick={onCancel}>← Back</Btn>
        <h2 style={{fontFamily:serif,fontSize:26,color:C.text,margin:0}}>{existingSurvey?"Edit Survey":"Create New Survey"}</h2>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
        <Card>
          <h3 style={{fontFamily:serif,fontSize:18,margin:"0 0 16px",color:C.accent}}>Basic Information</h3>
          <Inp label="Survey title" value={title} onChange={setTitle} placeholder="e.g. MID survey – myocardial infarction"/>
          <Sel label="Survey objective type" value={ot} onChange={v=>{setOt(v);setSc([]);}} options={Object.values(OBJ_TYPES).map(t=>({v:t.id,l:`${t.label} – ${t.desc.substring(0,55)}…`}))}/>
          <div style={{padding:"10px 14px",borderRadius:8,background:C.accentLight,marginBottom:14,fontSize:13,color:C.accentDark,fontFamily:font,lineHeight:1.5}}>{OBJ_TYPES[ot].desc}</div>
          <Inp label="Target population" value={pop} onChange={setPop} placeholder="e.g. Adults with risk of myocardial infarction"/>
          <Inp label="Key outcome" value={oc} onChange={setOc} placeholder="e.g. Myocardial infarction"/>
          <Inp label="Time period (optional)" value={tp} onChange={setTp} placeholder="e.g. over a period of 5 years"/>
        </Card>
        <Card>
          <h3 style={{fontFamily:serif,fontSize:18,margin:"0 0 16px",color:C.accent}}>Context for Respondents</h3>
          <Inp label="Introduction text" value={intro} onChange={setIntro} multi placeholder="Provide background and instructions for panel members..."/>
          {(ot==="DECISION"||ot==="PROPORTION")&&<Inp label="Constant harms / burdens (shown in every question)" value={harm} onChange={setHarm} multi placeholder="e.g. Risk of diabetic ketoacidosis = 2 in 1000 increase"/>}
          <div style={{padding:16,borderRadius:10,background:C.warmLight,border:`1px solid ${C.warm}33`}}>
            <p style={{fontSize:12,fontWeight:600,color:C.warm,margin:"0 0 6px",fontFamily:font,textTransform:"uppercase",letterSpacing:"0.04em"}}>Response scale</p>
            {OBJ_TYPES[ot].opts.map((o,i)=><p key={i} style={{fontSize:13,color:C.textMid,margin:"3px 0",fontFamily:font}}>{i<3?"🟢":"🔴"} {o}</p>)}
          </div>
        </Card>
      </div>

      <ScenarioGen objectiveType={ot} outcome={oc} timePeriod={tp} onGenerate={setSortedSc} existing={scenarios}/>

      <Card style={{marginBottom:20,background:"#FAFAF7"}}>
        <h4 style={{fontFamily:serif,fontSize:16,color:C.accent,margin:"0 0 12px"}}>Add Single Scenario</h4>
        <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:12,alignItems:"end"}}>
          <Inp label="Magnitude (per 1000)" value={addMag} onChange={setAddMag} type="number" placeholder="e.g. 15" suffix="in 1000" style={{marginBottom:0}}/>
          <div style={{paddingBottom:14}}><Btn small disabled={!addMag} onClick={()=>{const mag=parseFloat(addMag);if(isNaN(mag))return;setSortedSc(s=>[...s,{id:uid(),magnitude:mag,autoDescription:autoDesc(ot,oc||"the outcome",mag,tp)}]);setAddMag("");}}>+ Add</Btn></div>
        </div>
      </Card>

      {scenarios.length>0&&(
        <Card style={{marginBottom:20}}>
          <h3 style={{fontFamily:serif,fontSize:18,margin:"0 0 8px",color:C.accent}}>Scenarios ({scenarios.length})</h3>
          <p style={{fontSize:13,color:C.textMid,margin:"0 0 16px",fontFamily:font,lineHeight:1.5}}>Presented in random order. Descriptions auto-generated from key outcome.</p>
          <div style={{display:"grid",gap:10}}>
            {scenarios.map((sc,i)=>(
              <div key={sc.id} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",borderRadius:10,background:"#FAFAF7",border:`1px solid ${C.border}`}}>
                <span style={{fontFamily:font,fontWeight:700,fontSize:18,color:C.accent,minWidth:60,textAlign:"right"}}>{sc.magnitude}</span>
                <span style={{fontFamily:font,fontSize:13,color:C.textMid}}>in 1000</span>
                <div style={{flex:1,borderLeft:`2px solid ${C.border}`,paddingLeft:14}}>
                  <p style={{fontFamily:font,fontSize:13,color:C.text,margin:0,lineHeight:1.5}}>{sc.autoDescription}</p>
                </div>
                <button onClick={()=>setSc(s=>s.filter((_,j)=>j!==i))} style={{background:"transparent",border:"none",color:C.textLight,cursor:"pointer",fontSize:18,padding:4}}>×</button>
              </div>
            ))}
          </div>
        </Card>
      )}
      <div style={{display:"flex",gap:12,justifyContent:"flex-end"}}>
        <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
        <Btn disabled={!valid} onClick={save}>{existingSurvey?"Update Survey":"Create Survey"}</Btn>
      </div>
    </div>
  );
}

// ─── Dashboard ───
function Dashboard({surveys,onEdit,onCreate,onDelete,onResults,onPreview}){
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:32}}>
        <div>
          <h2 style={{fontFamily:serif,fontSize:28,color:C.text,margin:0}}>Survey Dashboard</h2>
          <p style={{fontFamily:font,fontSize:14,color:C.textMid,margin:"6px 0 0"}}>Create and manage MID panel surveys. Share links with your working group.</p>
        </div>
        <Btn onClick={onCreate}>+ New Survey</Btn>
      </div>
      {surveys.length===0?(
        <Card style={{textAlign:"center",padding:60}}>
          <div style={{fontSize:48,marginBottom:16}}>📋</div>
          <h3 style={{fontFamily:serif,fontSize:22,color:C.text,margin:"0 0 8px"}}>No surveys yet</h3>
          <p style={{fontFamily:font,color:C.textMid,fontSize:14,margin:"0 0 20px"}}>Create your first panel survey to get started.</p>
          <Btn onClick={onCreate}>Create First Survey</Btn>
        </Card>
      ):(
        <div style={{display:"grid",gap:16}}>
          {surveys.map(s=><SurveyCard key={s.id} survey={s} onEdit={()=>onEdit(s)} onDelete={()=>onDelete(s.id)} onResults={()=>onResults(s)} onPreview={()=>onPreview(s)}/>)}
        </div>
      )}
    </div>
  );
}

function SurveyCard({survey:s,onEdit,onDelete,onResults,onPreview}){
  const[rc,setRc]=useState(0);const[share,setShare]=useState(false);
  useEffect(()=>{loadR(s.id).then(r=>setRc(r.length));},[s.id]);
  const ti=OBJ_TYPES[s.objectiveType];
  return(
    <Card>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{flex:1}}>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
            <Tag>{ti.label}</Tag><Tag color={C.warm} bg={C.warmLight}>{s.scenarios.length} scenarios</Tag><Tag color="#7B68EE" bg="#F0EDFF">{rc} responses</Tag>
          </div>
          <h3 style={{fontFamily:serif,fontSize:20,color:C.text,margin:"0 0 6px"}}>{s.title}</h3>
          <p style={{fontFamily:font,fontSize:13,color:C.textMid,margin:0,lineHeight:1.5}}>
            <strong>Population:</strong> {s.population} · <strong>Outcome:</strong> {s.outcome}
            {s.scenarios.length>0&&<> · <strong>Range:</strong> {Math.min(...s.scenarios.map(x=>x.magnitude))}–{Math.max(...s.scenarios.map(x=>x.magnitude))} in 1000</>}
          </p>
        </div>
        <div style={{display:"flex",gap:8,flexShrink:0,marginLeft:16,flexWrap:"wrap",justifyContent:"flex-end"}}>
          <Btn variant="link" small onClick={()=>setShare(!share)}>🔗 Share</Btn>
          <Btn variant="ghost" small onClick={onPreview}>👁 Preview</Btn>
          <Btn variant="secondary" small onClick={onEdit}>Edit</Btn>
          <Btn variant="warm" small onClick={onResults}>Results</Btn>
          <Btn variant="danger" small onClick={onDelete}>Delete</Btn>
        </div>
      </div>
      {share&&<div style={{marginTop:14}}><ShareLink surveyId={s.id}/><p style={{fontFamily:font,fontSize:12,color:C.textMid,margin:"8px 0 0"}}>Share this link with panel members to collect responses.</p></div>}
    </Card>
  );
}

// ─── Survey Form (Respondent) ───
function SurveyForm({survey,onComplete,isPreview}){
  const[step,setStep]=useState(0);const[answers,setAns]=useState({});const[name,setName]=useState("");
  const[shuffled,setShuffled]=useState([]);
  const ti=OBJ_TYPES[survey.objectiveType];

  useEffect(()=>{
    // Sort scenarios by magnitude (smallest to largest)
    const sorted = [...survey.scenarios].sort((a,b)=>a.magnitude-b.magnitude);
    // Alternate between smallest and highest: [smallest, highest, 2nd smallest, 2nd highest, ...]
    const alternating = [];
    let left = 0, right = sorted.length - 1;
    while(left <= right){
      alternating.push(sorted[left++]);
      if(left <= right) alternating.push(sorted[right--]);
    }
    setShuffled(alternating);
  },[survey]);

  const total=shuffled.length+2;
  const isIntro=step===0,isName=step===shuffled.length+1,isDone=step===total;
  const cur=!isIntro&&!isName&&!isDone?shuffled[step-1]:null;
  const prog=Math.min(step/(total-1),1);

  const submit=async()=>{
    const r={id:uid(),respondentName:name||"Anonymous",answers,submittedAt:new Date().toISOString()};
    if(!isPreview)await saveR(survey.id,r);
    setStep(total);
  };

  if(isDone) return(
    <div style={{textAlign:"center",padding:"60px 20px"}}>
      <div style={{fontSize:56,marginBottom:20}}>✓</div>
      <h2 style={{fontFamily:serif,fontSize:28,color:C.accent}}>{isPreview?"Preview Complete":"Thank You!"}</h2>
      <p style={{fontFamily:font,color:C.textMid,fontSize:15,maxWidth:460,margin:"12px auto 24px",lineHeight:1.6}}>
        {isPreview?"This is how the survey looks to respondents.":"Your responses have been recorded. The results will be presented at the panel meeting."}
      </p>
      {isPreview&&onComplete&&<Btn onClick={onComplete}>← Back</Btn>}
    </div>
  );

  return(
    <div style={{maxWidth:720,margin:"0 auto"}}>
      <div style={{height:4,background:C.border,borderRadius:2,marginBottom:32,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${prog*100}%`,background:C.accent,borderRadius:2,transition:"width 0.4s ease"}}/>
      </div>
      {isPreview&&<div style={{padding:"10px 16px",borderRadius:8,background:C.warmLight,border:`1px solid ${C.warm}44`,marginBottom:20,display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>👁</span><span style={{fontFamily:font,fontSize:13,color:C.warm,fontWeight:600}}>PREVIEW MODE – responses will not be saved</span></div>}

      {isIntro&&(
        <Card>
          <Tag>{ti.label}</Tag>
          <h2 style={{fontFamily:serif,fontSize:26,color:C.text,margin:"16px 0 12px"}}>{survey.title}</h2>
          <div style={{borderLeft:`3px solid ${C.accent}`,paddingLeft:16,marginBottom:20}}>
            <p style={{fontFamily:font,fontSize:14,color:C.textMid,lineHeight:1.7,margin:0}}>
              <strong>Population:</strong> {survey.population}<br/><strong>Key outcome:</strong> {survey.outcome}
              {survey.timePeriod&&<><br/><strong>Time period:</strong> {survey.timePeriod}</>}
            </p>
          </div>
          {survey.introText&&<div style={{padding:20,borderRadius:10,background:C.accentLight,marginBottom:20}}><p style={{fontFamily:font,fontSize:14,color:C.text,lineHeight:1.7,margin:0,whiteSpace:"pre-wrap"}}>{survey.introText}</p></div>}
          {survey.harmInfo&&<div style={{padding:20,borderRadius:10,background:C.dangerLight,marginBottom:20}}><p style={{fontSize:12,fontWeight:600,color:C.danger,margin:"0 0 8px",fontFamily:font,textTransform:"uppercase",letterSpacing:"0.04em"}}>Harms / Burdens (constant across all questions)</p><p style={{fontFamily:font,fontSize:14,color:C.text,lineHeight:1.7,margin:0,whiteSpace:"pre-wrap"}}>{survey.harmInfo}</p></div>}
          <p style={{fontFamily:font,fontSize:13,color:C.textMid,lineHeight:1.6}}>When we say "all or almost all" we mean 90% or more; "most" means 75–90%; and "majority" means 50–74%.</p>
          <div style={{marginTop:20,textAlign:"right"}}><Btn onClick={()=>setStep(1)}>Begin Survey →</Btn></div>
        </Card>
      )}

      {cur&&(
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <Tag>Question {step} of {shuffled.length}</Tag>
            <span style={{fontFamily:font,fontSize:22,fontWeight:700,color:C.accent,background:C.accentLight,padding:"4px 14px",borderRadius:8}}>{cur.magnitude} in 1000</span>
          </div>
          <p style={{fontFamily:font,fontSize:15,color:C.text,lineHeight:1.7,margin:"0 0 16px"}}>{questionText(survey,cur)}</p>
          {cur.autoDescription&&<div style={{padding:16,borderRadius:10,background:"#F8F9FA",marginBottom:20,border:`1px solid ${C.border}`}}><p style={{fontFamily:font,fontSize:14,margin:0,color:C.accentDark,lineHeight:1.6}}><strong style={{color:C.accent}}>Effect:</strong> {cur.autoDescription}</p></div>}
          <div style={{marginBottom:20}}>{ti.opts.map((o,i)=><RadioOpt key={i} label={o} index={i} total={ti.opts.length} selected={answers[cur.id]===i} onClick={()=>setAns(a=>({...a,[cur.id]:i}))}/>)}</div>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <Btn variant="ghost" onClick={()=>setStep(s=>s-1)}>← Previous</Btn>
            <Btn disabled={answers[cur.id]===undefined} onClick={()=>setStep(s=>s+1)}>{step===shuffled.length?"Continue →":"Next →"}</Btn>
          </div>
        </Card>
      )}

      {isName&&(
        <Card>
          <h3 style={{fontFamily:serif,fontSize:22,color:C.text,margin:"0 0 16px"}}>Almost done!</h3>
          <p style={{fontFamily:font,fontSize:14,color:C.textMid,marginBottom:20,lineHeight:1.6}}>Please enter your name so we can track responses. This will only be visible to the survey coordinator.</p>
          <Inp label="Your name (optional)" value={name} onChange={setName} placeholder="e.g. Dr. Virtanen"/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:20}}>
            <Btn variant="ghost" onClick={()=>setStep(s=>s-1)}>← Previous</Btn>
            <Btn onClick={submit}>Submit Responses</Btn>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Results ───
function Results({survey,onBack}){
  const[responses,setR]=useState([]);const[loading,setL]=useState(true);
  useEffect(()=>{loadR(survey.id).then(r=>{setR(r);setL(false);});},[survey.id]);
  const ti=OBJ_TYPES[survey.objectiveType];

  if(loading) return <p style={{fontFamily:font,color:C.textMid,padding:40}}>Loading…</p>;

  const summary=survey.scenarios.map(sc=>{
    const counts=new Array(ti.opts.length).fill(0);
    responses.forEach(r=>{const a=r.answers[sc.id];if(a!==undefined)counts[a]++;});
    const tot=counts.reduce((a,b)=>a+b,0);
    let cum=0,med=-1;
    for(let i=0;i<counts.length;i++){cum+=counts[i];if(cum>tot/2&&med===-1)med=i;}
    return{sc,counts,tot,med};
  });

  const downloadExcel=()=>{
    const rows=[];
    rows.push([`Tulokset: ${survey.title}`]);
    rows.push([`Vastauksia yhteensä: ${responses.length}`]);
    rows.push([]);
    rows.push(["YHTEENVETO"]);
    rows.push(["Skenaario","Vastausvaihtoehto","Lukumäärä","Prosentti","Mediaani"]);
    summary.forEach(({sc,counts,tot,med})=>{
      ti.opts.forEach((opt,i)=>{
        const pct=tot>0?Math.round((counts[i]/tot)*100):0;
        rows.push([`${sc.magnitude} / 1000`,opt,counts[i],`${pct}%`,i===med?"Mediaani":""]);
      });
      rows.push([]);
    });
    rows.push(["YKSITTÄISET VASTAUKSET"]);
    rows.push(["Vastaaja",...survey.scenarios.map(sc=>`${sc.magnitude}/1000`)]);
    responses.forEach(r=>{
      rows.push([r.respondentName,...survey.scenarios.map(sc=>{const a=r.answers[sc.id];return a!==undefined?a+1:"";})]);
    });
    const csv=rows.map(row=>row.map(cell=>`"${String(cell).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=`${survey.title.replace(/[^a-z0-9]/gi,"_")}_tulokset.csv`;
    a.click();URL.revokeObjectURL(url);
  };

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <Btn variant="ghost" small onClick={onBack}>← Back</Btn>
        <h2 style={{fontFamily:serif,fontSize:26,color:C.text,margin:0,flex:1}}>Results: {survey.title}</h2>
        {responses.length>0&&<Btn variant="ghost" small onClick={downloadExcel}>⬇ Lataa Excel</Btn>}
      </div>
      <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}><Tag>{ti.label}</Tag><Tag color="#7B68EE" bg="#F0EDFF">{responses.length} responses</Tag></div>
      <div style={{marginBottom:24}}><ShareLink surveyId={survey.id}/></div>

      {responses.length===0?(
        <Card style={{textAlign:"center",padding:40}}><p style={{fontFamily:font,color:C.textMid,fontSize:15}}>No responses yet. Share the link above with panel members.</p></Card>
      ):(
        <div style={{display:"grid",gap:16}}>
          {summary.map(({sc,counts,tot,med})=>(
            <Card key={sc.id}>
              <h4 style={{fontFamily:serif,fontSize:18,color:C.accent,margin:"0 0 4px"}}>{sc.magnitude} in 1000</h4>
              <p style={{fontFamily:font,fontSize:13,color:C.textMid,margin:"0 0 12px"}}>{sc.autoDescription}</p>
              <div style={{marginBottom:12}}>
                {ti.opts.map((opt,i)=>{
                  const pct=tot>0?(counts[i]/tot)*100:0;
                  const t=ti.opts.length>1?i/(ti.opts.length-1):0;
                  const col=`hsl(${(1-t)*145},50%,42%)`;
                  return(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                      <div style={{width:220,fontSize:12,fontFamily:font,color:C.textMid,textAlign:"right",flexShrink:0}}>{opt}</div>
                      <div style={{flex:1,height:22,background:"#F0EDE8",borderRadius:4,position:"relative",overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${pct}%`,background:col,borderRadius:4,transition:"width 0.4s"}}/>
                        {i===med&&<div style={{position:"absolute",top:0,right:4,fontSize:10,lineHeight:"22px",color:pct>50?"#fff":C.text,fontWeight:700,fontFamily:font}}>MEDIAN</div>}
                      </div>
                      <span style={{width:54,fontSize:13,fontFamily:font,color:C.text,fontWeight:600,textAlign:"right"}}>{counts[i]} ({Math.round(pct)}%)</span>
                    </div>
                  );
                })}
              </div>
              <p style={{fontSize:12,color:C.textLight,fontFamily:font,margin:0}}>n = {tot}</p>
            </Card>
          ))}

          <Card>
            <h4 style={{fontFamily:serif,fontSize:18,color:C.accent,margin:"0 0 16px"}}>Individual Responses</h4>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontFamily:font,fontSize:13}}>
                <thead><tr style={{borderBottom:`2px solid ${C.border}`}}>
                  <th style={{textAlign:"left",padding:"8px 12px",color:C.textMid,fontWeight:600}}>Respondent</th>
                  {survey.scenarios.map(sc=><th key={sc.id} style={{textAlign:"center",padding:"8px 12px",color:C.textMid,fontWeight:600,minWidth:70}}>{sc.magnitude}/1000</th>)}
                </tr></thead>
                <tbody>{responses.map(r=>(
                  <tr key={r.id} style={{borderBottom:`1px solid ${C.border}`}}>
                    <td style={{padding:"8px 12px",fontWeight:500,color:C.text}}>{r.respondentName}</td>
                    {survey.scenarios.map(sc=>{const a=r.answers[sc.id];return <td key={sc.id} style={{padding:"8px 12px",textAlign:"center",color:a!==undefined?C.text:C.textLight}}>{a!==undefined?a+1:"—"}</td>;})}
                  </tr>
                ))}</tbody>
              </table>
              <p style={{fontSize:11,color:C.textLight,marginTop:8,fontFamily:font}}>Scale: 1 = {ti.opts[0].substring(0,35)}… — 6 = {ti.opts[5].substring(0,35)}…</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Main App ───
export default function App(){
  const[view,setView]=useState("dashboard");
  const[surveys,setSurveys]=useState([]);
  const[active,setActive]=useState(null);
  const[loading,setLoading]=useState(true);

  useEffect(()=>{loadS().then(s=>{setSurveys(s);setLoading(false);});},[]);

  useEffect(()=>{
    const check=()=>{
      const h=window.location.hash;
      if(h.startsWith("#respond/")){
        const sid=h.replace("#respond/","");
        if(surveys.length>0){const f=surveys.find(s=>s.id===sid);if(f){setActive(f);setView("respond");}}
      }
    };
    check();
    window.addEventListener("hashchange",check);
    return()=>window.removeEventListener("hashchange",check);
  },[surveys]);

  const save=async(s)=>{
    try{
      await saveS(s);
      const updated = await loadS();
      setSurveys(updated);
      setView("dashboard");
      setActive(null);
    }catch(error){
      alert(`Error saving survey: ${error.message}\n\nMake sure you've connected Vercel KV database in your Vercel project settings.`);
      console.error('Save error:', error);
    }
  };

  const del=async(id)=>{
    await deleteS(id);
    const updated = await loadS();
    setSurveys(updated);
  };

  const go=(v,s)=>{setActive(s||null);setView(v);};

  if(loading) return <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><p style={{fontFamily:font,color:C.textMid}}>Loading…</p></div>;

  return(
    <div style={{minHeight:"100vh",background:C.bg}}>
      <style>{FONTS}</style>
      <style>{`*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{background:${C.bg}}::selection{background:${C.accentLight};color:${C.accentDark}}input:focus,textarea:focus,select:focus{border-color:${C.accent}!important;outline:none}`}</style>

      <header style={{borderBottom:`1px solid ${C.border}`,background:C.card,padding:"14px 32px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,cursor:view==="respond"?"default":"pointer"}} onClick={view==="respond"?undefined:()=>{go("dashboard");window.location.hash="";}}>
          <div style={{width:32,height:32,borderRadius:8,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:15,fontFamily:serif}}>M</div>
          <span style={{fontFamily:serif,fontSize:18,color:C.text}}>MID Panel Survey</span>
        </div>
        {view!=="respond"&&<Btn variant={view==="dashboard"?"primary":"ghost"} small onClick={()=>go("dashboard")}>Dashboard</Btn>}
      </header>

      <main style={{maxWidth:1100,margin:"0 auto",padding:"32px 24px"}}>
        {view==="dashboard"&&<Dashboard surveys={surveys} onCreate={()=>go("create")} onEdit={s=>go("edit",s)} onDelete={del} onResults={s=>go("results",s)} onPreview={s=>go("preview",s)}/>}
        {view==="create"&&<SurveyBuilder onSave={save} onCancel={()=>go("dashboard")}/>}
        {view==="edit"&&active&&<SurveyBuilder existingSurvey={active} onSave={save} onCancel={()=>go("dashboard")}/>}
        {view==="respond"&&active&&<SurveyForm survey={active} onComplete={()=>{go("dashboard");window.location.hash="";}}/>}
        {view==="preview"&&active&&<SurveyForm survey={active} isPreview onComplete={()=>go("dashboard")}/>}
        {view==="results"&&active&&<Results survey={active} onBack={()=>go("dashboard")}/>}
      </main>
    </div>
  );
}
