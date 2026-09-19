/* ===== assets/app-04-01.js ===== */
/* ===================== binding ===================== */
function bind(){
  document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{route.tab=b.dataset.tab; render();});
  document.querySelectorAll("[data-company-tab]").forEach(b=>b.onclick=()=>{route.companyTab=b.dataset.companyTab; render();});
  document.querySelectorAll("[data-analysis-run]").forEach(b=>b.onclick=async()=>{
    const mode=b.dataset.analysisRun||"full";
    route.analysisMode=mode;
    setStatus("Refreshing analysis…","saving");
    b.disabled=true;
    try{
      await loadMasterData();
      await loadLiveResearchData();
      render();
      setStatus("Analysis refreshed","saved");
    }catch(e){
      route.analysisMode=mode;
      render();
      setStatus("Analysis refresh failed");
    }
  });
  const mark=el=>{el.onfocus=()=>typing=true; el.onblur=()=>typing=false;};

  const gs=$("#globalSearch"), gr=$("#globalSearchResults"), gw=$("#globalSearchWrap");
  if(gs&&gr){
    const records=()=>initMasterState().companies||[];
    const showResults=()=>{
      const q=String(gs.value||"").trim().toUpperCase();
      if(!q){ gr.hidden=true; gr.innerHTML=""; return; }
      const matches=records().filter(c=>{
        const t=String(c.ticker||"").toUpperCase();
        const n=String(c.company_name||"").toUpperCase();
        const s=String(c.sector||"").toUpperCase();
        return t.includes(q)||n.includes(q)||s.includes(q);
      }).sort((a,b)=>{
        const at=String(a.ticker||"").toUpperCase(), bt=String(b.ticker||"").toUpperCase();
        const ae=at===q?0:at.startsWith(q)?1:2, be=bt===q?0:bt.startsWith(q)?1:2;
        return ae-be||at.localeCompare(bt);
      }).slice(0,8);
      gr.innerHTML=matches.length?matches.map(c=>
        '<button class="searchresult" type="button" data-search-ticker="'+esc(c.ticker)+'">'
        +'<strong>'+esc(c.ticker)+'</strong><span>'+esc(c.company_name||"—")+'</span><small>'+esc(c.sector||"—")+'</small></button>'
      ).join(""):'<div class="searchnone">No matching company</div>';
      gr.hidden=false;
    };
    gs.oninput=showResults;
    gs.onfocus=showResults;
    gs.onkeydown=e=>{
      if(e.key==="Escape"){gr.hidden=true;gs.blur();}
      if(e.key==="Enter"){
        const first=gr.querySelector("[data-search-ticker]");
        if(first){e.preventDefault();go("company",first.dataset.searchTicker);gr.hidden=true;gs.value="";}
      }
    };
    gr.querySelectorAll?.("[data-search-ticker]");
    document.querySelectorAll("[data-search-ticker]").forEach(b=>b.onclick=()=>{});
    gr.onclick=e=>{
      const b=e.target.closest("[data-search-ticker]");
      if(b){go("company",b.dataset.searchTicker);gr.hidden=true;gs.value="";}
    };
    document.addEventListener("click",e=>{if(gw&&!gw.contains(e.target)) gr.hidden=true;},{once:true});
  }

  document.querySelectorAll("[data-macro]").forEach(el=>{
    el.oninput=el.onchange=()=>{state.macro[el.dataset.macro]=el.value; saveMacro();}; mark(el);});

  document.querySelectorAll("[data-sec]").forEach(el=>{
    el.oninput=el.onchange=()=>{state.sectors[el.dataset.sec][el.dataset.field]=el.value; saveSector(el.dataset.sec);}; mark(el);});

  const s=SECTORS.find(x=>x.id===route.id);
  if(s){
    document.querySelectorAll("[data-row]").forEach(el=>{
      el.oninput=()=>{state.sectors[s.id].rows[+el.dataset.row][el.dataset.col]=el.value; saveSector(s.id);}; mark(el);});
    document.querySelectorAll("[data-co]").forEach(el=>{
      el.oninput=()=>{state.sectors[s.id].companies[+el.dataset.co][el.dataset.col]=el.value; saveSector(s.id);}; mark(el);});
    document.querySelectorAll("[data-delrow]").forEach(b=>b.onclick=()=>{state.sectors[s.id].rows.splice(+b.dataset.delrow,1); saveSector(s.id); render();});
    document.querySelectorAll("[data-delco]").forEach(b=>b.onclick=()=>{state.sectors[s.id].companies.splice(+b.dataset.delco,1); saveSector(s.id); render();});
    const ar=$("#addRow"); if(ar) ar.onclick=()=>{state.sectors[s.id].rows.unshift({month:todayISO().slice(0,7)}); saveSector(s.id); render();};
    const ac=$("#addCo"); if(ac) ac.onclick=()=>{state.sectors[s.id].companies.push({}); saveSector(s.id); render();};
  }

  const addC=$("#addCompany");
  if(addC) addC.onclick=()=>{
    const t=($("#newTicker").value||"").trim().toUpperCase();
    if(!t){ $("#newTicker").focus(); setStatus("Enter a ticker first"); return; }
    if(state.companies[t]){ go("company",t); return; }
    state.companies[t]={ticker:t,name:($("#newName").value||"").trim(),sector:$("#newSector").value,coverage:"Not started",fy:[]};
    saveCompany(t); go("company",t);
  };

  const t=route.ticker, c=t?state.companies[t]:null;
  if(c){
    document.querySelectorAll("[data-co-field]").forEach(el=>{
      el.oninput=el.onchange=()=>{c[el.dataset.coField]=el.value; saveCompany(t); if(el.dataset.coField==="price"||el.dataset.coField==="base") {} }; mark(el);});
    document.querySelectorAll("[data-fy]").forEach(el=>{
      el.oninput=()=>{c.fy[+el.dataset.fy][el.dataset.col]=el.value; saveCompany(t);}; mark(el);});
    document.querySelectorAll("[data-delfy]").forEach(b=>b.onclick=()=>{c.fy.splice(+b.dataset.delfy,1); saveCompany(t); render();});
    const af=$("#addFy"); if(af) af.onclick=()=>{c.fy=c.fy||[]; c.fy.unshift({}); saveCompany(t); render();};
  }

  document.querySelectorAll("[data-pf]").forEach(el=>{
    el.oninput=()=>{state.portfolio[el.dataset.pf]=el.value; savePortfolio();}; mark(el);});
  document.querySelectorAll("[data-pos]").forEach(el=>{
    el.oninput=el.onchange=()=>{
      const i=+el.dataset.pos, col=el.dataset.col;
      state.portfolio.positions[i][col]= col==="ticker"? el.value.toUpperCase() : el.value;
      savePortfolio();
      if(col!=="ticker") { }
    };
    el.onblur=()=>{typing=false; render();};
    el.onfocus=()=>typing=true;});
  document.querySelectorAll("[data-delpos]").forEach(b=>b.onclick=()=>{state.portfolio.positions.splice(+b.dataset.delpos,1); savePortfolio(); render();});
  const ap=$("#addPos"); if(ap) ap.onclick=()=>{state.portfolio.positions=state.portfolio.positions||[]; state.portfolio.positions.push({review:todayISO()}); savePortfolio(); render();};

  document.querySelectorAll("[data-ev]").forEach(el=>{
    el.oninput=()=>{state.events[+el.dataset.ev][el.dataset.col]=el.value; saveEvents();}; mark(el);});
  document.querySelectorAll("[data-delev]").forEach(b=>b.onclick=()=>{state.events.splice(+b.dataset.delev,1); saveEvents(); render();});
  const ae=$("#addEv"); if(ae) ae.onclick=()=>{state.events.push({date:todayISO()}); saveEvents(); render();};

  document.querySelectorAll("[data-src]").forEach(el=>{
    el.oninput=el.onchange=()=>{state.sources[+el.dataset.src][el.dataset.col]=el.value; saveSources();}; mark(el);});
  document.querySelectorAll("[data-delsrc]").forEach(b=>b.onclick=()=>{state.sources.splice(+b.dataset.delsrc,1); saveSources(); render();});
  document.querySelectorAll("[data-pull]").forEach(b=>b.onclick=()=>pullSource(+b.dataset.pull));
  const as=$("#addSrc"); if(as) as.onclick=()=>{state.sources=state.sources||[]; state.sources.push({sector:SECTORS[0].id}); saveSources(); render();};

  const al=$("#addLog"); if(al) al.onclick=addLogEntry;
  bindMasterData();
}

;
/* ===== assets/app-04-02.js ===== */
async function addLogEntry(){
  const belief=$("#l_belief").value.trim();
  if(!belief){ $("#l_belief").focus(); setStatus("Add what you believe before recording"); return; }
  if(!session){ setStatus("Not signed in — nothing saved"); return; }
  try{
    setStatus("Saving…","saving");
    await addLog({ts:Date.now(),date:$("#l_date").value||todayISO(),sector:$("#l_sector").value,
      confidence:$("#l_conf").value,belief,why:$("#l_why").value.trim(),falsifier:$("#l_fals").value.trim(),
      action:$("#l_action").value.trim()});
    setStatus("Entry recorded","saved"); render();
  }catch(e){ setStatus(e&&e.code==="quota_exceeded"?"Log is full — export and prune":"Could not record entry"); }
}

;
/* ===== assets/app-05-01.js ===== */
/* ===================== command bar ===================== */
let pending=null, cmdBusy=false;
function fieldMap(){
  const m={};
  SECTORS.forEach(s=>{ m[s.id]={ name:s.name,
    reading:["rating","conviction","valPct","cycle"].concat(READING_FIELDS.map(f=>f[0])).concat(PERF_FIELDS.map(f=>f[0])),
    structure:STRUCTURE_FIELDS.map(f=>"st_"+f[0]),
    metrics:s.metrics.map(key), companyFields:s.cols.map(key) }; });
  return m;
}
function labelFor(sec,kind,k){
  const s=SECTORS.find(x=>x.id===sec);
  if(kind==="metric"&&s){const h=s.metrics.find(m=>key(m)===k); if(h) return h;}
  if(kind==="company"&&s){const h=s.cols.find(c=>key(c)===k); if(h) return h;}
  if(kind==="reading"){const h=READING_FIELDS.find(f=>f[0]===k)||PERF_FIELDS.find(f=>f[0]===k); if(h) return h[1];
    if(k==="rating")return "Rating"; if(k==="conviction")return "Conviction"; if(k==="valPct")return "Valuation percentile"; if(k==="cycle")return "Earnings regime";}
  if(kind==="structure"){const h=STRUCTURE_FIELDS.find(f=>"st_"+f[0]===k); if(h) return h[1];}
  if(kind==="macro"){const h=MACRO_FIELDS.find(f=>f[0]===k)||REGIMES.find(f=>f[0]===k); if(h) return h[1];}
  return k;
}
async function runCommand(){
  const text=$("#cmdInput").value.trim();
  if(!text||cmdBusy) return;
  cmdBusy=true; $("#cmdSend").disabled=true; $("#cmdOut").innerHTML='<p class="thinking">Reading that…</p>';
  const prompt="You fill in a Pakistani equity research file from what an analyst tells you. Reply with only JSON: {\"changes\":[...]}. Each change is one of:\n"
    +'{\"type\":\"reading\",\"sector\":\"<id>\",\"field\":\"<field>\",\"value\":\"<text>\"}\n'
    +'{\"type\":\"structure\",\"sector\":\"<id>\",\"field\":\"<st_field>\",\"value\":\"<text>\"}\n'
    +'{\"type\":\"metric\",\"sector\":\"<id>\",\"month\":\"YYYY-MM\",\"field\":\"<metricKey>\",\"value\":\"<number>\"}\n'
    +'{\"type\":\"sectorCompany\",\"sector\":\"<id>\",\"name\":\"<TICKER>\",\"field\":\"<companyField>\",\"value\":\"<number>\"}\n'
    +'{\"type\":\"macro\",\"field\":\"<macroField>\",\"value\":\"<text>\"}\n'
    +'{\"type\":\"company\",\"ticker\":\"<TICKER>\",\"field\":\"price|shares|bear|base|bull|required|thesis|catalyst|risks|quality|coverage|name|sector\",\"value\":\"<text>\"}\n'
    +'{\"type\":\"event\",\"date\":\"YYYY-MM-DD\",\"subject\":\"\",\"what\":\"\",\"impact\":\"\"}\n'
    +'{\"type\":\"log\",\"sector\":\"<sector name or Macro>\",\"date\":\"YYYY-MM-DD\",\"confidence\":\"1-5\",\"belief\":\"\",\"why\":\"\",\"falsifier\":\"\",\"action\":\"\"}\n'
    +"Rating must be Overweight, Neutral or Underweight. Earnings regime must be one of "+JSON.stringify(CYCLE_OPTS.slice(1))+". "
    +"Use only these sector ids and field keys:\n"+JSON.stringify(fieldMap())
    +"\nMacro fields: "+JSON.stringify(MACRO_FIELDS.map(f=>f[0]).concat(REGIMES.map(r=>r[0])))
    +"\nToday is "+todayISO()+". The analyst is currently looking at: "+(route.view==="sector"?route.id:route.view)+".\n"
    +"Only record what the text actually says. Never invent numbers. Keep the analyst's own wording for judgement fields. If nothing matches, reply {\"changes\":[]}.\n\nAnalyst says:\n\"\"\"\n"+text+"\n\"\"\"";
  try{
    const res=await callFill(prompt);
    pending=(res&&Array.isArray(res.changes))?res.changes:[];
    renderPreview(pending);
  }catch(e){
    $("#cmdOut").innerHTML='<p class="thinking">'+esc(fillError(e))+'</p>';
  }finally{ cmdBusy=false; $("#cmdSend").disabled=false; }
}
function renderPreview(ch){ renderPreviewInto("#cmdOut", ch); }

;
/* ===== assets/app-05-02.js ===== */
function renderPreviewInto(target, ch){
  if(!ch.length){ $(target).innerHTML='<p class="thinking">Nothing in that matched a field. Name the sector and the figure — for example, "cement retention Rs 1,320 a bag in August".</p>'; return; }
  const items=ch.map(c=>{
    if(c.type==="log") return "<li>Decision log — new entry for "+esc(c.sector||"")+"</li>";
    if(c.type==="event") return "<li>Events — "+esc(c.date||"")+" "+esc(c.subject||"")+" "+esc(c.what||"")+"</li>";
    if(c.type==="company") return "<li>"+esc(c.ticker||"")+" · "+esc(c.field)+" → <strong>"+esc(String(c.value||"").slice(0,80))+"</strong></li>";
    if(c.type==="metric") return "<li>"+esc(secName(c.sector))+" · "+esc(labelFor(c.sector,"metric",c.field))+" ("+esc(c.month||"")+") → <strong>"+esc(c.value)+"</strong></li>";
    if(c.type==="sectorCompany") return "<li>"+esc(secName(c.sector))+" · "+esc(c.name||"")+" "+esc(labelFor(c.sector,"company",c.field))+" → <strong>"+esc(c.value)+"</strong></li>";
    if(c.type==="macro") return "<li>Macro · "+esc(labelFor(null,"macro",c.field))+" → <strong>"+esc(c.value)+"</strong></li>";
    return "<li>"+esc(secName(c.sector))+" · "+esc(labelFor(c.sector,c.type,c.field))+" → <strong>"+esc(String(c.value||"").slice(0,110))+"</strong></li>";
  }).join("");
  $(target).innerHTML='<div class="preview"><h4>Save these '+ch.length+' change'+(ch.length>1?"s":"")+'?</h4><ul>'+items+'</ul>'
    +'<button class="btn primary" id="applyBtn">Save them</button> <button class="btn" id="discardBtn">Discard</button></div>';
  $("#applyBtn").onclick=applyChanges;
  $("#discardBtn").onclick=()=>{pending=null; $(target).innerHTML="";};
}
async function applyChanges(){
  const ch=pending||[]; const touched={}; let evs=false;
  for(const c of ch){
    try{
      if(c.type==="log"){ if(session) await addLog({ts:Date.now(),date:c.date||todayISO(),
        sector:c.sector||"Macro",confidence:String(c.confidence||""),belief:c.belief||"",why:c.why||"",
        falsifier:c.falsifier||"",action:c.action||""}); continue; }
      if(c.type==="event"){ state.events.push({date:c.date||todayISO(),subject:c.subject||"",what:c.what||"",impact:c.impact||""}); evs=true; continue; }
      if(c.type==="macro"){ state.macro[c.field]=String(c.value); saveMacro(); continue; }
      if(c.type==="company"){
        const t=String(c.ticker||"").trim().toUpperCase(); if(!t) continue;
        if(!state.companies[t]) state.companies[t]={ticker:t,fy:[],coverage:"Building baseline"};
        state.companies[t][c.field]=String(c.value); saveCompany(t); continue;
      }
      const st=state.sectors[c.sector]; if(!st) continue;
      if(c.type==="reading"||c.type==="structure") st[c.field]=String(c.value);
      else if(c.type==="metric"){
        const mo=c.month||todayISO().slice(0,7);
        st.rows=st.rows||[]; let row=st.rows.find(r=>r.month===mo);
        if(!row){ row={month:mo}; st.rows.unshift(row); }
        row[c.field]=String(c.value);
      } else if(c.type==="sectorCompany"){
        const nm=String(c.name||"").trim(); st.companies=st.companies||[];
        let co=st.companies.find(x=>(x.name||"").toLowerCase()===nm.toLowerCase());
        if(!co){ co={name:nm}; st.companies.push(co); }
        co[c.field]=String(c.value);
      }
      touched[c.sector]=true;
    }catch(e){}
  }
  Object.keys(touched).forEach(saveSector);
  if(evs) saveEvents();
  pending=null; $("#cmdInput").value="";
  $("#cmdOut").innerHTML='<p class="thinking">Saved. Check below and correct anything it got wrong.</p>';
  render();
  setTimeout(()=>{const o=$("#cmdOut"); if(o&&o.querySelector(".thinking")) o.innerHTML="";},6000);
}

/* ===================== server calls ===================== */
function fillError(e){
  const m = String((e&&e.message)||"");
  if(m.indexOf("401")>=0) return "Your session expired. Reload the page and sign in again.";
  if(m.indexOf("429")>=0) return "Too many requests just now. Wait a moment and try again.";
  if(m.indexOf("500")>=0) return "The server could not reach Claude. Check the API key in Vercel.";
  if(m.indexOf("parse")>=0) return "That came back unreadable. Try shorter sentences.";
  return "That did not go through. Try again, or type into the boxes below.";
}
async function authHeaders(){
  const t = session && session.access_token;
  return { "Content-Type":"application/json", "Authorization":"Bearer "+(t||"") };
}
async function callFill(prompt){
  const r = await fetch("/api/fill", {method:"POST", headers:await authHeaders(), body:JSON.stringify({prompt})});
  if(!r.ok) throw new Error("HTTP "+r.status);
  const out = await r.json();
  let txt = String(out.text||"").trim();
  const fence = txt.match(/```(?:json)?\s*([\s\S]*?)```/);
  if(fence) txt = fence[1].trim();
  const a = txt.indexOf("{"), b = txt.lastIndexOf("}");
  if(a>=0 && b>a) txt = txt.slice(a, b+1);
  try{ return JSON.parse(txt); }catch(e){ throw new Error("parse"); }
}

;
/* ===== assets/app-05-03.js ===== */
async function callFetchSource(url){
  const r = await fetch("/api/fetch", {method:"POST", headers:await authHeaders(), body:JSON.stringify({url})});
  if(!r.ok) throw new Error("HTTP "+r.status);
  const out = await r.json();
  return String(out.text||"");
}

;
/* ===== assets/app-06.js ===== */
/* ===================== supabase storage ===================== */
async function saveDoc(path, body){
  const { error } = await sb.from("docs").upsert(
    { user_id: session.user.id, path, body, updated_at: new Date().toISOString() },
    { onConflict: "user_id,path" });
  if(error) throw error;
}
async function addLog(entry){
  await saveDoc("log/"+entry.ts, entry);
  state.log.unshift(entry);
}
async function deleteDoc(path){
  await sb.from("docs").delete().eq("user_id", session.user.id).eq("path", path);
}
async function loadAll(){
  const { data, error } = await sb.from("docs").select("path, body");
  if(error){ setStatus("Could not load — "+error.message); return; }
  const logs=[];
  (data||[]).forEach(r=>{
    const p=r.path, b=r.body||{};
    if(p==="macro/current") state.macro=b;
    else if(p==="portfolio/holdings"){ b.positions=b.positions||[]; state.portfolio=b; }
    else if(p==="events/all") state.events=b.list||[];
    else if(p==="sources/all") state.sources=b.list||[];
    else if(p.indexOf("sectors/")===0){ b.rows=b.rows||[]; b.companies=b.companies||[]; state.sectors[p.slice(8)]=b; }
    else if(p.indexOf("companies/")===0){ if(b.ticker) state.companies[b.ticker]=b; }
    else if(p.indexOf("log/")===0) logs.push(b);
  });
  state.log = logs.sort((a,b)=>(b.ts||0)-(a.ts||0));
  SECTORS.forEach(x=>{ if(!state.sectors[x.id]) state.sectors[x.id]={rows:[],companies:[]}; });
}

/* ===================== import / export ===================== */
function exportJSON(){
  const blob = new Blob([JSON.stringify({exported:todayISO(), macro:state.macro, sectors:state.sectors,
    companies:state.companies, portfolio:state.portfolio, events:state.events,
    sources:state.sources, log:state.log}, null, 2)], {type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob); a.download="psx-desk-"+todayISO()+".json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
}
async function importJSON(file){
  let d;
  try{ d = JSON.parse(await file.text()); }catch(e){ setStatus("That file is not readable JSON"); return; }
  setStatus("Importing…","saving");
  try{
    if(d.macro){ state.macro=d.macro; await saveDoc("macro/current", state.macro); }
    if(d.sectors) for(const k of Object.keys(d.sectors)){
      if(state.sectors[k]){ state.sectors[k]=d.sectors[k]; await saveDoc("sectors/"+k, d.sectors[k]); } }
    if(d.companies) for(const t of Object.keys(d.companies)){
      state.companies[t]=d.companies[t]; await saveDoc("companies/"+t, d.companies[t]); }
    if(d.portfolio){ state.portfolio=d.portfolio; await saveDoc("portfolio/holdings", d.portfolio); }
    if(d.events){ state.events=d.events; await saveDoc("events/all", {list:d.events}); }
    if(d.sources){ state.sources=d.sources; await saveDoc("sources/all", {list:d.sources}); }
    if(Array.isArray(d.log)) for(const e of d.log){ if(e && e.ts) await saveDoc("log/"+e.ts, e); }
    if(Array.isArray(d.log)) state.log=d.log.slice().sort((a,b)=>(b.ts||0)-(a.ts||0));
    setStatus("Imported","saved"); renderNav(); render();
  }catch(e){ setStatus("Import stopped — "+(e.message||"error")); }
}

/* ===================== boot ===================== */
$("#themeBtn").onclick=()=>{
  const cur=document.documentElement.getAttribute("data-theme");
  document.documentElement.setAttribute("data-theme", cur==="dark"?"light":cur==="light"?"dark":"light");
};
$("#exportBtn").onclick=exportJSON;
$("#exportBtn").hidden=false;
$("#importBtn").onclick=()=>$("#importFile").click();
$("#importFile").onchange=e=>{ const f=e.target.files[0]; if(f) importJSON(f); e.target.value=""; };
$("#signOut").onclick=async()=>{ await sb.auth.signOut(); location.reload(); };

function gateMsg(t){ $("#gateMsg").textContent=t||""; }
function applyGuestReadOnly(){
  document.body.classList.add("guest-readonly");
  ["#importBtn","#importFile","#exportBtn","#signOut"].forEach(sel=>{ const el=$(sel); if(el) el.hidden=true; });
  document.querySelectorAll("input, textarea, select").forEach(el=>{ if(!el.hasAttribute("data-guest-enabled")) el.disabled=true; });
  document.querySelectorAll("[id^='add'], [data-delrow], [data-delco], [data-delfy], [data-delpos], [data-delev], [data-delsrc], [data-pull]").forEach(el=>{ el.hidden=true; });
}
async function startGuestApp(){
  session = null;
  $("#gate").hidden = true;
  $("#app").hidden = false;
  setStatus("Loading live data…","saving");
  await loadMasterData();
  await loadLiveResearchData();
  renderNav(); render();
  applyGuestReadOnly();
  const observer=new MutationObserver(()=>applyGuestReadOnly());
  observer.observe($("#view"),{childList:true,subtree:true});
  setStatus("Temporary read-only access");
  $("#cmd").hidden = true;
}
async function startApp(sess){
  session = sess;
  $("#gate").hidden = true;
  $("#app").hidden = false;
  setStatus("Loading…","saving");
  await loadAll();
  await loadMasterData();
  await loadLiveResearchData();
  renderNav(); render();
  setStatus("Live database connected");
  const aiEnabled=Boolean(window.CONFIG&&CONFIG.aiFillEnabled);
  $("#cmd").hidden = !aiEnabled;
  if(aiEnabled){
    $("#cmdSend").onclick = runCommand;
    $("#cmdInput").addEventListener("keydown", ev=>{
      if(ev.key==="Enter" && !ev.shiftKey){ ev.preventDefault(); runCommand(); } });
  }
}

(async function(){
  const browserKey = window.CONFIG && (CONFIG.supabasePublishableKey || CONFIG.supabaseAnonKey);
  if(!window.CONFIG || !CONFIG.supabaseUrl || !browserKey){
    $("#gate").hidden=false;
    gateMsg("config.js is missing your Supabase address and publishable key. Fill it in, then reload.");
    return;
  }

  $("#gate").hidden=false;
  gateMsg("Checking sign-in link…");
  sb = window.supabase.createClient(CONFIG.supabaseUrl, browserKey);

  // Temporary read-only guest mode. Database permissions remain enforced by RLS.
  const TEMP_GUEST_MODE = true;
  if(TEMP_GUEST_MODE){
    await startGuestApp();
    return;
  }

  let recoveryActive=false;
  function showRecovery(sess){
    recoveryActive=true;
    session=sess||session;
    $("#gate").hidden=false;
    $("#app").hidden=true;
    $("#standardAuthActions").hidden=true;
    $("#recoveryBox").hidden=false;
    $("#email").parentElement.hidden=true;
    $("#pw").parentElement.hidden=true;
    gateMsg("Enter a new password for your PSX account.");
  }

  const hashParams=new URLSearchParams((location.hash||"").replace(/^#/,""));
  const queryParams=new URLSearchParams(location.search||"");
  const linkError=hashParams.get("error_description") || queryParams.get("error_description");
  if(linkError){
    $("#gate").hidden=false;
    gateMsg(decodeURIComponent(linkError.replace(/\+/g," ")));
  }

  sb.auth.onAuthStateChange((event,sess)=>{
    if(event==="PASSWORD_RECOVERY"){
      showRecovery(sess);
    }
  });

  $("#setNewPw").onclick=async()=>{
    const password=$("#newPw").value;
    if(!password || password.length<8){ gateMsg("Use at least 8 characters."); return; }
    gateMsg("Updating password…");
    const { error } = await sb.auth.updateUser({ password });
    if(error){ gateMsg(error.message); return; }
    history.replaceState({}, document.title, location.pathname);
    gateMsg("Password updated. Opening your research file…");
    const { data:d } = await sb.auth.getSession();
    if(d && d.session) await startApp(d.session);
  };

  const { data } = await sb.auth.getSession();

  const recoveryHint =
    hashParams.get("type")==="recovery" ||
    queryParams.get("type")==="recovery" ||
    queryParams.get("recovery")==="1";

  if(recoveryHint && data && data.session){
    showRecovery(data.session);
    return;
  }

  // Give the auth client a brief moment to emit PASSWORD_RECOVERY after parsing the URL.
  if(data && data.session){
    await new Promise(resolve=>setTimeout(resolve,120));
    if(recoveryActive) return;
    await startApp(data.session);
    return;
  }

  if(recoveryActive) return;
  gateMsg("");

  $("#signIn").onclick=async()=>{
    gateMsg("Signing in…");
    const { data:d, error } = await sb.auth.signInWithPassword({
      email:$("#email").value.trim(), password:$("#pw").value });
    if(error){ gateMsg(error.message); return; }
    await startApp(d.session);
  };

  $("#signUp").onclick=async()=>{
    gateMsg("Creating account…");
    const { data:d, error } = await sb.auth.signUp({
      email:$("#email").value.trim(), password:$("#pw").value });
    if(error){ gateMsg(error.message); return; }
    if(d.session){ await startApp(d.session); }
    else gateMsg("Check your email to confirm the address, then sign in.");
  };

  $("#forgotPw").onclick=async()=>{
    const email=$("#email").value.trim();
    if(!email){ gateMsg("Enter your email address first."); $("#email").focus(); return; }
    gateMsg("Sending password reset email…");
    const redirectTo = location.origin + "/?recovery=1";
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
    if(error){ gateMsg(error.message); return; }
    gateMsg("Password reset email sent. Open the newest email link. Older reset links may expire.");
  };

  $("#pw").addEventListener("keydown", e=>{ if(e.key==="Enter") $("#signIn").click(); });
})();
