/* ===== assets/views-01.js ===== */
/* ===================== views ===================== */
function render(){
  const v=$("#view"), r=route.view;
  v.innerHTML = r==="dash"?dashHTML(): r==="news"?newsHTML(): r==="analysis"?analysisHTML(): r==="macro"?macroHTML():
    r==="sector"?sectorHTML(SECTORS.find(s=>s.id===route.id)):
    r==="companies"?companiesHTML(): r==="masters"?masterDataHTML(): r==="company"?companyHTML(route.ticker):
    r==="valuation"?valuationHTML(): r==="portfolio"?portfolioHTML():
    r==="events"?eventsHTML(): r==="queue"?queueHTML():
    r==="log"?logHTML(): r==="sources"?sourcesHTML(): methodHTML();
  bind();
}

function dashHTML(){
  const m=state.macro;
  const master=initMasterState();
  const live=initLiveState();
  const events=(live.events||[]).slice().sort((a,b)=>
    String(b.event_date||b.timestamp_pkt||"").localeCompare(String(a.event_date||a.timestamp_pkt||""))
  );
  const highEvents=events.filter(e=>String(e.materiality||"").toLowerCase()==="high");
  const coverage=live.coverage||[];
  const coveredCompanies=coverage.filter(x=>Number(x.financial_rows||0)>0).length;
  const missingCoverage=Math.max(0,(master.companies||[]).length-coveredCompanies);
  const verifiedDocs=(live.sourceDocuments||[]).filter(x=>x.verification_status==="VERIFIED").length;
  const latestEvent=events[0]||null;

  const macroStrip=[["kse","KSE-100"],["rate","Policy rate"],["cpi","CPI YoY"],["pkr","PKR/USD"],["tbill","12M T-bill"]]
    .map(f=>'<div class="marketmetric"><span>'+esc(f[1])+'</span><strong>'+fmtSmart(m[f[0]])+'</strong></div>').join("");

  const decisionCards=[
    ["Latest event",latestEvent?latestEvent.headline:"—",latestEvent?fmtDate(latestEvent.event_date):"No event data","news"],
    ["High materiality",fmtSmart(highEvents.length),"Research events","news"],
    ["Companies covered",fmtSmart(coveredCompanies),fmtSmart((master.companies||[]).length)+" in universe","companies"],
    ["Coverage gaps",fmtSmart(missingCoverage),"Companies without financial history","companies"]
  ].map(x=>'<button class="decisioncard" data-nav="'+x[3]+'"><span>'+esc(x[0])+'</span><strong>'+esc(x[1])+'</strong><small>'+esc(x[2])+'</small></button>').join("");

  const eventCards=events.slice(0,5).map(e=>
    '<button class="dailyitem" data-nav="news"><div><span class="material '+newsMaterialityClass(e.materiality)+'">'+esc(String(e.materiality||"—").toUpperCase())+'</span>'
      +'<small>'+fmtDate(e.event_date)+' · '+esc(e.ticker_sector||e.entity_type||"Market")+'</small></div>'
      +'<strong>'+esc(e.headline||"—")+'</strong><p>'+esc(e.fact_summary||e.what_changed||"—")+'</p>'
      +(e.required_action?'<em>'+esc(e.required_action)+'</em>':"")+'</button>'
  ).join("");

  const radar=(master.companies||[]).slice().sort((a,b)=>{
    const ad=String(a.last_research_update||a.updated_at||"");
    const bd=String(b.last_research_update||b.updated_at||"");
    return bd.localeCompare(ad);
  }).slice(0,12).map(c=>
    '<tr><td class="pad"><a href="#" data-nav="company" data-id="'+esc(c.ticker)+'"><strong>'+esc(c.ticker)+'</strong></a></td>'
      +'<td class="pad">'+esc(c.company_name||"—")+'</td><td class="pad">'+esc(c.sector||"—")+'</td>'
      +'<td class="pad num">'+fmtSmart(c.last_price,2)+'</td><td class="pad num">'+(c.pe==null?"—":fmtSmart(c.pe,2)+"x")+'</td>'
      +'<td class="pad">'+fmtDate(c.latest_report_period)+'</td><td class="pad">'+verificationBadge(c.profile_verification_status||"MISSING")+'</td></tr>'
  ).join("");

  const factPills=[
    ["Universe",(master.companies||[]).length||"—"],
    ["Sectors",(master.sectors||[]).length||"—"],
    ["Financial rows",(live.financials||[]).length||"—"],
    ["Verified sources",verifiedDocs||"—"]
  ].map(x=>'<span class="factpill"><b>'+fmtSmart(x[1])+'</b>'+esc(x[0])+'</span>').join("");

  const strip = SECTORS.map(s=>{
    const d=daysSince(state.sectors[s.id].updatedAt);
    return '<button data-nav="sector" data-id="'+s.id+'" class="'+ageClass(d)+'"><span class="nm">'+esc(s.short)+'</span>'
      +'<span class="days">'+(d===null?"—":d)+'<span class="unit">'+(d===null?"not reviewed":"days old")+'</span></span></button>';
  }).join("");

  const rank = SECTORS.map(s=>{
    const st=state.sectors[s.id], d=daysSince(st.updatedAt);
    const mark = st.rating==="Overweight"?"▲":st.rating==="Underweight"?"▼":st.rating==="Neutral"?"■":"";
    return "<tr><td class='pad'><a href='#' data-nav='sector' data-id='"+s.id+"'>"+esc(s.name)+"</a></td>"
      +"<td class='pad'><span class='rating'><span class='mark'>"+mark+"</span>"+esc(st.rating||"—")+"</span></td>"
      +"<td class='pad num'>"+esc(st.conviction||"—")+"</td><td class='pad num'>"+(st.valPct?esc(st.valPct)+"%":"—")+"</td>"
      +"<td class='pad'>"+esc(st.cycle||"—")+"</td><td class='pad num'>"+(d===null?"—":d+"d")+"</td></tr>";
  }).join("");

  const q = researchQueue().slice(0,5);

  return '<div class="pagehero"><div><div class="eyebrow">DAILY PSX DECISION COCKPIT</div><h2 class="section">What changed, what matters, where to look</h2>'
    +'<p class="sub">Daily research should move from facts to affected companies, valuation and risk. Nothing here invents missing market data.</p></div>'
    +'<div class="factbar">'+factPills+'</div></div>'
    +'<div class="marketstrip">'+macroStrip+'</div>'
    +'<div class="decisiongrid">'+decisionCards+'</div>'
    +'<div class="sectionline"><h3 class="block">Latest material developments</h3><span><button class="textbtn" data-nav="news">Open full news feed</button></span></div>'
    +(eventCards?'<div class="dailyfeed">'+eventCards+'</div>':'<p class="empty">No research events available.</p>')
    +'<div class="sectionline"><h3 class="block">Company radar</h3><span>Recently updated research records</span></div>'
    +'<div class="scroll"><table><thead><tr><th>Ticker</th><th>Company</th><th>Sector</th><th class="num">Price</th><th class="num">P/E</th><th>Latest report</th><th>Profile</th></tr></thead><tbody>'+radar+'</tbody></table></div>'
    +'<div class="sectionline"><h3 class="block">Sector freshness</h3><span>Research maintenance</span></div><div class="strip">'+strip+'</div>'
    +'<p class="legend">Green: reviewed within 35 days. Amber: 36–75 days. Strong amber: more than 75 days.</p>'
    +'<div class="sectionline"><h3 class="block">Cross-sector view</h3><span>Current research file</span></div>'
    +'<div class="scroll"><table><thead><tr><th>Sector</th><th>Rating</th><th class="num">Conviction</th><th class="num">Val %ile</th><th>Earnings regime</th><th class="num">Updated</th></tr></thead><tbody>'+rank+'</tbody></table></div>'
    +'<div class="sectionline"><h3 class="block">What needs attention</h3><span>Research actions</span></div>'
    +(q.length?q.map(x=>'<div class="queue '+x.sev+'"><strong>'+esc(x.what)+'</strong><span class="why">'+esc(x.why)+'</span><span class="act">'+esc(x.act)+'</span></div>').join("")
      :'<p class="empty">Nothing overdue.</p>');
}
function macroHTML(){
  const m=state.macro;
  const fields = MACRO_FIELDS.map(f=>'<div class="field"><label for="m_'+f[0]+'">'+esc(f[1])+'</label>'
    +'<input type="text" id="m_'+f[0]+'" data-macro="'+f[0]+'" value="'+esc(m[f[0]]||"")+'"></div>').join("");
  const reg = REGIMES.map(r=>'<div class="field"><label for="g_'+r[0]+'">'+esc(r[1])+'</label>'
    +'<select id="g_'+r[0]+'" data-macro="'+r[0]+'">'+opts(REGIME_OPTS,m[r[0]])+'</select>'
    +'<input type="text" data-macro="'+r[0]+'_note" value="'+esc(m[r[0]+"_note"]||"")+'" placeholder="why"></div>').join("");
  return '<h2 class="section">Macro</h2>'
    +'<p class="sub">The top layer. Every sector thesis is a claim about one of these numbers, so this updates first and the sectors follow.</p>'
    +'<div class="grid3">'+fields+'</div>'
    +'<h3 class="block">Market regime</h3><p class="hint">A word and a reason, not a colour. Leave it unset rather than guessing.</p>'
    +'<div class="grid3">'+reg+'</div>'
    +'<h3 class="block">Reading</h3>'
    +'<textarea data-macro="notes" rows="6" placeholder="What this configuration means, and which sectors it helps or hurts.">'+esc(m.notes||"")+'</textarea>'
    +'<h3 class="block">Release calendar</h3>'
    +'<ul class="tight"><li>CPI — first working day of the month, PBS</li>'
    +'<li>SBP monetary policy — 26 Oct, 14 Dec 2026; 25 Jan, 8 Mar, 26 Apr, 17 Jun 2027</li>'
    +'<li>External accounts and IT exports — around the 18th, SBP</li>'
    +'<li>Cement dispatches ~5th (APCMA); auto sales ~10th (PAMA)</li>'
    +'<li>Results season — late Feb, Apr, Aug, Oct</li></ul>';
}

function sectorHTML(s){
  const st=state.sectors[s.id];
  const tabs=[["reading","Current reading"],["perf","Performance"],["dashb","Dashboard"],["co","Companies"],["struct","Structure"]]
    .map(t=>'<button class="tab" data-tab="'+t[0]+'" aria-selected="'+(route.tab===t[0])+'">'+t[1]+'</button>').join("");
  let body = route.tab==="reading"?readingHTML(s,st): route.tab==="perf"?perfHTML(s,st):
    route.tab==="dashb"?dashTabHTML(s,st): route.tab==="co"?coHTML(s,st): structHTML(s,st);
  const d=daysSince(st.updatedAt);
  return '<h2 class="section">'+esc(s.name)+'</h2><p class="sub">'+esc(s.swing)+'</p>'
    +'<div class="cadence">'+esc(s.cadence)+(d===null?"":" Last updated "+d+" days ago.")+'</div>'
    +'<div class="tabs" role="tablist">'+tabs+'</div>'+body;
}
function readingHTML(s,st){
  const fields = READING_FIELDS.map(f=>'<div class="field"><label for="r_'+f[0]+'">'+esc(f[1])+'</label>'
    +(f[2]?'<span class="desc">'+esc(f[2])+'</span>':"")
    +'<textarea id="r_'+f[0]+'" data-sec="'+s.id+'" data-field="'+f[0]+'" rows="'+(f[0]==="thesis"?2:3)+'">'+esc(st[f[0]]||"")+'</textarea></div>').join("");
  return '<div class="inline" style="margin-bottom:16px">'
    +'<div class="field"><label for="r_rating">Rating</label><select id="r_rating" data-sec="'+s.id+'" data-field="rating">'
      +opts(["","Overweight","Neutral","Underweight"],st.rating)+'</select></div>'
    +'<div class="field"><label for="r_conv">Conviction 1–5</label><select id="r_conv" data-sec="'+s.id+'" data-field="conviction">'
      +opts(["","1","2","3","4","5"],st.conviction)+'</select></div>'
    +'<div class="field"><label for="r_cycle">Earnings regime</label><select id="r_cycle" data-sec="'+s.id+'" data-field="cycle">'
      +opts(CYCLE_OPTS,st.cycle)+'</select></div>'
    +'<div class="field"><label for="r_val">Valuation percentile</label><input type="text" id="r_val" data-sec="'+s.id+'" data-field="valPct" value="'+esc(st.valPct||"")+'" placeholder="0 = cheapest in 10 yrs"></div></div>'
    +'<p class="hint">Valuation metric for this sector: '+esc(s.valuation)+'.</p>'+fields;
}
function perfHTML(s,st){
  const f = PERF_FIELDS.map(p=>'<div class="field"><label for="p_'+p[0]+'">'+esc(p[1])+'</label>'
    +'<input type="text" id="p_'+p[0]+'" data-sec="'+s.id+'" data-field="'+p[0]+'" value="'+esc(st[p[0]]||"")+'"></div>').join("");
  return '<p class="hint">Relative return is the honest test of a sector call. Absolute return in a rising market tells you nothing about whether the call was right.</p>'
    +'<div class="grid3">'+f+'</div>';
}

;

/* ===== assets/views-02-01.js ===== */
function verificationBadge(status){
  const s=String(status||"").toUpperCase();
  if(!s) return "—";
  const cls={VERIFIED:"verified",PROVISIONAL:"provisional",STALE:"stale",CONFLICT:"conflict",MISSING:"missing"}[s]||"missing";
  return '<span class="verify '+cls+'">'+esc(s)+'</span>';
}
function coverageSummary(dc){
  if(!dc) return "—";
  const n=v=>Number(v||0);
  return '<span class="coverage-mini">F '+n(dc.financial_rows)+' · R '+n(dc.ratio_rows)+' · P '+n(dc.price_rows)+' · V '+n(dc.valuation_rows)+'</span>';
}

function dashTabHTML(s,st){
  const head="<tr><th>Month</th>"+s.metrics.map(m=>'<th class="num">'+esc(m)+'</th>').join("")+"<th></th></tr>";
  const rows=(st.rows||[]).map((r,i)=>"<tr><td><input type=text data-row="+i+' data-col="month" value="'+esc(r.month||"")+'" placeholder="2026-09"></td>'
    +s.metrics.map(m=>'<td class="num"><input type=text data-row='+i+' data-col="'+key(m)+'" value="'+esc(r[key(m)]||"")+'"></td>').join("")
    +'<td><button class="rowdel" data-delrow="'+i+'" aria-label="Delete">×</button></td></tr>').join("");
  return '<p class="hint">Numbers only. Interpretation belongs in the current reading.</p>'
    +'<div class="scroll"><table><thead>'+head+'</thead><tbody>'
    +(rows||'<tr><td class="pad empty" colspan="'+(s.metrics.length+2)+'">No months recorded. Add the latest and work backwards as you have time.</td></tr>')
    +'</tbody></table></div><p style="margin-top:12px"><button class="btn" id="addRow">Add month</button></p>';
}
function coHTML(s,st){
  const head="<tr><th>Company</th>"+s.cols.map(c=>'<th class="num">'+esc(c)+'</th>').join("")+"<th>Note</th><th></th></tr>";
  const rows=(st.companies||[]).map((r,i)=>'<tr><td><input type=text data-co='+i+' data-col="name" value="'+esc(r.name||"")+'" placeholder="Ticker"></td>'
    +s.cols.map(c=>'<td class="num"><input type=text data-co='+i+' data-col="'+key(c)+'" value="'+esc(r[key(c)]||"")+'"></td>').join("")
    +'<td><input type=text data-co='+i+' data-col="note" value="'+esc(r.note||"")+'"></td>'
    +'<td><button class="rowdel" data-delco="'+i+'" aria-label="Delete">×</button></td></tr>').join("");
  return '<p class="hint">The whole comparable set on the same metrics. One company in isolation tells you nothing about whether its multiple is fair.</p>'
    +'<div class="scroll"><table><thead>'+head+'</thead><tbody>'
    +(rows||'<tr><td class="pad empty" colspan="'+(s.cols.length+3)+'">No companies yet. Start with every listed name, not just the ones you like.</td></tr>')
    +'</tbody></table></div><p style="margin-top:12px"><button class="btn" id="addCo">Add company</button></p>';
}
function structHTML(s,st){
  return '<p class="hint">Written once, reviewed yearly. If you edit this monthly, the content belongs in the dashboard instead.</p>'
    +STRUCTURE_FIELDS.map(f=>'<div class="field"><label for="s_'+f[0]+'">'+esc(f[1])+'</label>'
      +'<span class="desc">'+esc(f[2])+'</span>'
      +'<textarea id="s_'+f[0]+'" data-sec="'+s.id+'" data-field="st_'+f[0]+'" rows="3">'+esc(st["st_"+f[0]]||"")+'</textarea></div>').join("");
}

function companiesHTML(){
  const list=companyDisplayRecords();
  const rows=list.map(c=>{
    const d=daysSince(c.updatedAt);
    const sectorLabel=c.sectorName||secName(c.sector);
    return "<tr><td class='pad'><a href='#' data-nav='company' data-id='"+esc(c.ticker)+"'><strong>"+esc(c.ticker)+"</strong></a></td>"
      +"<td class='pad'>"+esc(c.name||"—")+"</td><td class='pad'>"+esc(sectorLabel||"—")+"</td>"
      +"<td class='pad'>"+esc(c.coverage||"—")+"</td>"
      +"<td class='pad'>"+verificationBadge(c.dataCoverage&&c.dataCoverage.verification_status)+"</td>"
      +"<td class='pad'>"+coverageSummary(c.dataCoverage)+"</td>"
      +"<td class='pad num'>"+fmtSmart(c.price,2)+"</td>"
      +"<td class='pad'>"+esc((c.thesis||"").slice(0,70)||"—")+"</td><td class='pad num'>"+(d===null?"—":d+"d")+"</td></tr>";
  }).join("");
  return '<h2 class="section">Company research</h2>'
    +'<p class="sub">Live PSX company universe from Supabase. Identity, price and structured financial history come from the database; your valuation and judgement notes remain personal overlays.</p>'
    +'<p><button class="btn primary" data-nav="masters">View master data</button></p>'
    +'<div class="scroll"><table><thead><tr><th>Ticker</th><th>Name</th><th>Sector</th><th>Research</th><th>Verification</th><th>Data rows</th><th class="num">Price</th><th>Thesis</th><th class="num">Updated</th></tr></thead><tbody>'
    +(rows||'<tr><td class="pad empty" colspan="9">No company data available.</td></tr>')+'</tbody></table></div>';
}

;

/* ===== assets/views-02-02.js ===== */
function companyLiveFinancials(ticker){
  const t=cleanTicker(ticker);
  return (initLiveState().financials||[]).filter(x=>cleanTicker(x.ticker)===t)
    .slice().sort((a,b)=>String(b.period_end||"").localeCompare(String(a.period_end||"")));
}
function companyLiveRatios(ticker){
  const t=cleanTicker(ticker);
  return (initLiveState().ratios||[]).filter(x=>cleanTicker(x.ticker)===t)
    .slice().sort((a,b)=>String(b.as_of||"").localeCompare(String(a.as_of||"")));
}
function companyBankMetrics(ticker){
  const t=cleanTicker(ticker);
  return (initLiveState().bankMetrics||[]).filter(x=>cleanTicker(x.ticker)===t)
    .slice().sort((a,b)=>String(b.as_of||"").localeCompare(String(a.as_of||"")));
}
function latestBankField(rows,field){
  return rows.find(r=>num(r[field])!==null)||null;
}
function companyValuationScenarios(ticker){
  const t=cleanTicker(ticker);
  const order={BEAR:1,BASE:2,BULL:3};
  return (initLiveState().valuationScenarios||[]).filter(x=>cleanTicker(x.ticker)===t)
    .slice().sort((a,b)=>(order[String(a.scenario||"").toUpperCase()]||9)-(order[String(b.scenario||"").toUpperCase()]||9));
}
function companyLatestValuation(ticker){
  const t=cleanTicker(ticker);
  return (initLiveState().valuations||[]).filter(x=>cleanTicker(x.ticker)===t)
    .slice().sort((a,b)=>String(b.as_of||"").localeCompare(String(a.as_of||"")))[0]||null;
}
function bankResidualModel(p){
  const book=num(p.book), start=num(p.startRoe), end=num(p.endRoe), payoutPct=num(p.payout),
        coePct=num(p.coe), terminalRoePct=num(p.terminalRoe), growthPct=num(p.growth);
  if([book,start,end,payoutPct,coePct,terminalRoePct,growthPct].some(x=>x===null)) return null;
  if(book<=0||payoutPct<0||payoutPct>100) return null;
  const payout=payoutPct/100, ke=coePct/100, g=growthPct/100, troe=terminalRoePct/100;
  if(ke<=g||troe<=g||ke<=0) return null;
  let bv=book, pvri=0, pvdiv=0;
  const roes=[];
  for(let i=0;i<5;i++){
    const roe=(start+(end-start)*(i/4))/100;
    roes.push(roe*100);
    const eps=roe*bv;
    const div=payout*eps;
    const ri=(roe-ke)*bv;
    pvri+=ri/Math.pow(1+ke,i+1);
    pvdiv+=div/Math.pow(1+ke,i+1);
    bv+=eps-div;
  }
  const terminalRI=((troe-ke)*bv)/(ke-g);
  const residual=book+pvri+terminalRI/Math.pow(1+ke,5);
  const terminalDividend=((troe-g)*bv)/(ke-g);
  const ddm=pvdiv+terminalDividend/Math.pow(1+ke,5);
  const fair=(residual+ddm)/2;
  return {fair,residual,ddm,bv5:bv,pvri,roes,terminalPayout:(1-g/troe)*100};
}
function bankImpliedTerminalRoe(target,p){
  const m=bankResidualModel(p), price=num(target), ke=num(p.coe), g=num(p.growth);
  if(!m||price===null||ke===null||g===null||m.bv5===0) return null;
  const kd=ke/100, gd=g/100;
  return (kd+((price-num(p.book)-m.pvri)*(kd-gd)*Math.pow(1+kd,5)/m.bv5))*100;
}
function bankImpliedCostOfEquity(target,p){
  const price=num(target), g=num(p.growth);
  if(price===null||g===null) return null;
  let lo=Math.max(g+0.1,5), hi=50;
  const valueAt=coe=>{const m=bankResidualModel(Object.assign({},p,{coe}));return m?m.fair:null;};
  let vlo=valueAt(lo), vhi=valueAt(hi);
  if(vlo===null||vhi===null||price>vlo||price<vhi) return null;
  for(let i=0;i<70;i++){
    const mid=(lo+hi)/2, v=valueAt(mid);
    if(v===null) return null;
    if(v>price) lo=mid; else hi=mid;
  }
  return (lo+hi)/2;
}
function updateMeblValuationInteractive(){
  const root=document.querySelector("[data-mebl-model-root]");
  if(!root) return;
  const p={book:root.dataset.book,price:root.dataset.price,tbill:root.dataset.tbill};
  root.querySelectorAll("[data-mebl-model]").forEach(el=>p[el.dataset.meblModel]=el.value);
  const m=bankResidualModel(p);
  const put=(k,v)=>{const el=root.querySelector('[data-model-output="'+k+'"]');if(el)el.textContent=v;};
  if(!m){
    put("fair","—");put("ri","—");put("ddm","—");put("vsprice","—");put("mos","—");put("pb","—");
    const mat=root.querySelector("#meblSensitivity"); if(mat) mat.innerHTML='<div class="resultempty error"><strong>Invalid model assumptions</strong><span>Cost of equity must exceed terminal growth, and terminal ROE must exceed terminal growth.</span></div>';
    return;
  }
  const price=num(p.price), book=num(p.book);
  const vs=price?((m.fair-price)/price)*100:null;
  const mos=m.fair?((m.fair-price)/m.fair)*100:null;
  put("fair","Rs "+fmt(m.fair,2));
  put("ri","Rs "+fmt(m.residual,2));
  put("ddm","Rs "+fmt(m.ddm,2));
  put("vsprice",vs===null?"—":pct(vs));
  put("mos",mos===null?"—":pct(mos));
  put("pb",book?fmt(m.fair/book,2)+"x":"—");
  put("roePath",m.roes.map(x=>fmt(x,1)+"%").join(" → "));
  put("terminalPayout",fmt(m.terminalPayout,1)+"%");
  const impliedRoe=bankImpliedTerminalRoe(price,p);
  const impliedCoe=bankImpliedCostOfEquity(price,p);
  put("impliedRoe",impliedRoe===null?"—":fmt(impliedRoe,1)+"%");
  put("impliedCoe",impliedCoe===null?"—":fmt(impliedCoe,2)+"%");
  const premium=impliedCoe!==null&&num(p.tbill)!==null?impliedCoe-num(p.tbill):null;
  put("impliedPremium",premium===null?"—":fmt(premium,2)+"pp");

  const matrix=root.querySelector("#meblSensitivity");
  if(matrix){
    const baseCoe=num(p.coe), baseTR=num(p.terminalRoe);
    const coes=[-4,-2,0,2,4].map(x=>Math.max(num(p.growth)+0.5,baseCoe+x));
    const troes=[-6,-3,0,3,6].map(x=>Math.max(num(p.growth)+0.5,baseTR+x));
    let html='<table class="sensmatrix"><thead><tr><th>Terminal ROE / COE</th>'+coes.map(x=>'<th>'+fmt(x,1)+'%</th>').join("")+'</tr></thead><tbody>';
    troes.forEach(tr=>{
      html+='<tr><th>'+fmt(tr,1)+'%</th>';
      coes.forEach(coe=>{
        const x=bankResidualModel(Object.assign({},p,{coe,terminalRoe:tr}));
        const current=Math.abs(coe-baseCoe)<0.01&&Math.abs(tr-baseTR)<0.01;
        html+='<td class="'+(current?"current":"")+'">'+(x?"Rs "+fmt(x.fair,0):"—")+'</td>';
      });
      html+='</tr>';
    });
    html+='</tbody></table>';
    matrix.innerHTML=html;
  }
}
function companyLiveEvents(ticker){
  const t=cleanTicker(ticker);
  return (initLiveState().events||[]).filter(e=>{
    const tag=cleanTicker(e.ticker_sector||"");
    const head=String(e.headline||"").toUpperCase();
    return tag===t || head.includes(t);
  }).slice().sort((a,b)=>String(b.event_date||"").localeCompare(String(a.event_date||"")));
}
function companySourceDocuments(ticker){
  const t=cleanTicker(ticker);
  return (initLiveState().sourceDocuments||[]).filter(d=>cleanTicker(d.entity_key)===t)
    .slice().sort((a,b)=>String(b.period_end||b.verified_at||"").localeCompare(String(a.period_end||a.verified_at||"")));
}
function changePct(a,b){
  const x=num(a), y=num(b);
  return (x===null||y===null||y===0)?null:((x-y)/Math.abs(y))*100;
}
function pkrBn(v,d=1){
  const x=num(v);
  return x===null?"—":fmt(x/1e9,d);
}
function pkrBnLabel(v,d=1){
  const x=num(v);
  return x===null?"—":"Rs "+fmt(x/1e9,d)+"bn";
}
function pkrMBn(v,d=1){
  const x=num(v);
  return x===null?"—":fmt(x/1000,d);
}
function bankTrendBars(rows){
  const annual=rows.filter(r=>r.period_type==="FY"&&num(r.profit_after_tax)!==null)
    .slice().sort((a,b)=>Number(a.fiscal_year)-Number(b.fiscal_year));
  if(!annual.length) return '<p class="empty">No annual PAT history available.</p>';
  const max=Math.max(...annual.map(r=>num(r.profit_after_tax)||0),1);
  return '<div class="bankbars">'+annual.map(r=>{
    const pat=num(r.profit_after_tax)||0;
    const w=Math.max(4,(pat/max)*100);
    return '<div class="bankbarrow"><span>'+esc(r.fiscal_year||"—")+'</span><div class="bankbartrack"><i style="width:'+w.toFixed(1)+'%"></i></div><strong>Rs '+pkrBn(pat,1)+'bn</strong></div>';
  }).join("")+'</div>';
}
function bankDataGap(label,available,detail){
  return '<div class="gaprow"><span class="gapdot '+(available?"ok":"missing")+'"></span><div><strong>'+esc(label)+'</strong><small>'+esc(detail||"")+'</small></div><b>'+(available?"AVAILABLE":"—")+'</b></div>';
}
function bankCompanyHTML(t,c,master,dc){
  const fs=companyLiveFinancials(t);
  const ratios=companyLiveRatios(t);
  const bankRows=companyBankMetrics(t);
  const latestBank=bankRows[0]||{};
  const latestFYBank=bankRows.find(r=>r.period_type==="FY")||{};
  const valuationScenarios=companyValuationScenarios(t);
  const latestValuation=companyLatestValuation(t);
  const docs=companySourceDocuments(t);
  const companyEvents=companyLiveEvents(t);
  const macroEvents=(initLiveState().events||[]).filter(e=>String(e.entity_type||"").toLowerCase()==="macro")
    .slice().sort((a,b)=>String(b.event_date||"").localeCompare(String(a.event_date||"")));
  const bankSector=masterSectorByName("COMMERCIAL BANKS")||{};
  const tab=route.companyTab||"overview";
  const tabs=[["overview","Overview"],["financials","Financials"],["ratios","Ratios"],["valuation","Valuation"],["news","News"],["analysis","Analysis"],["sources","Sources"]]
    .map(x=>'<button class="companytab" data-company-tab="'+x[0]+'" aria-selected="'+(tab===x[0])+'">'+x[1]+'</button>').join("");

  const price=num(master&&master.last_price!=null?master.last_price:c.price);
  const pe=num(master&&master.pe);
  const marketCapM=num(master&&master.market_cap_pkr_m);
  const sharesM=num(master&&master.shares_m);
  const freeFloat=num(master&&master.free_float_pct);
  const ttmEPS=num(master&&master.eps_ttm);
  const ttmDPS=num(master&&master.dps_ttm);
  const divYield=num(master&&master.dividend_yield_pct);
  const latestRoeRow=latestBankField(bankRows,"roe_pct");
  const latestCarRow=latestBankField(bankRows,"car_pct")||latestBankField(bankRows,"car_min_pct");
  const latestNpfRow=latestBankField(bankRows,"npf_ratio_pct");
  const latestCoverageRow=latestBankField(bankRows,"coverage_ratio_pct");
  const latestAdrRow=latestBankField(bankRows,"adr_pct");
  const latestCasaRow=latestBankField(bankRows,"casa_pct");
  const latestRoaRow=latestBankField(bankRows,"roa_pct");
  const latestBvpsRow=latestBankField(bankRows,"bvps");
  const latestPayoutRow=latestBankField(bankRows,"payout_ratio_pct");
  const bvps=latestBvpsRow?num(latestBvpsRow.bvps):null;
  const pb=(price!==null&&bvps!==null&&bvps!==0)?price/bvps:null;
  const latestQ=fs.find(r=>String(r.period_type||"").startsWith("Q"))||null;
  const priorQ=latestQ?fs.find(r=>r.period_type===latestQ.period_type && Number(r.fiscal_year)===Number(latestQ.fiscal_year)-1):null;
  const annual=fs.filter(r=>r.period_type==="FY").slice().sort((a,b)=>Number(b.fiscal_year)-Number(a.fiscal_year));
  const latestFY=annual[0]||null, priorFY=annual[1]||null;
  const qPatGrowth=latestQ&&priorQ?changePct(latestQ.profit_after_tax,priorQ.profit_after_tax):null;
  const fyPatGrowth=latestFY&&priorFY?changePct(latestFY.profit_after_tax,priorFY.profit_after_tax):null;
  const tb=findMacro("12M T-Bill Cut-off Yield");
  const policy=findMacro("SBP Policy Rate");
  const cpi=findMacro("CPI Inflation YoY");
  const earningsYield=pe&&pe>0?100/pe:null;
  const tbill=num(tb&&tb.latest_value);
  const yieldGap=earningsYield!==null&&tbill!==null?earningsYield-tbill:null;

  const header='<p class="meta"><a href="#" data-nav="companies">Companies</a> / Commercial Banks</p>'
    +'<div class="companyhero"><div><div class="eyebrow">BANK RESEARCH</div><div class="companytitle"><h2 class="section">'+esc(t)+' — '+esc(c.name||master.company_name||"")+'</h2>'
    +verificationBadge((master&&master.profile_verification_status)||(dc&&dc.verification_status))+'</div>'
    +'<p class="sub">Issuer-backed bank research with market data, earnings, balance-sheet metrics, asset quality, capital, dividends and source lineage kept separate.</p>'
    +'<div class="tagrow"><span>'+esc(master.coverage_tier||"—")+'</span><span>Commercial Banks</span><span>FY end '+esc(master.fy_end||"—")+'</span><span>'+fmtSmart(bankRows.length)+' verified bank periods</span></div></div>'
    +'<div class="companyquote"><span>Price</span><strong>Rs '+fmt(price,2)+'</strong><small>'+fmtDate(master.price_date)+'</small></div></div>'
    +'<div class="bank-kpis">'
      +'<div class="kpi"><div class="k">Market cap</div><div class="v">Rs '+(marketCapM===null?"—":fmt(marketCapM/1000,1))+'bn</div></div>'
      +'<div class="kpi"><div class="k">P/E TTM</div><div class="v">'+(pe===null?"—":fmt(pe,2)+"x")+'</div></div>'
      +'<div class="kpi"><div class="k">P/B on FY25 BVPS</div><div class="v">'+(pb===null?"—":fmt(pb,2)+"x")+'</div></div>'
      +'<div class="kpi"><div class="k">ROE latest</div><div class="v">'+(latestRoeRow?fmtSmart(latestRoeRow.roe_pct,2)+"%":"—")+'</div></div>'
      +'<div class="kpi"><div class="k">Dividend yield TTM</div><div class="v">'+(divYield===null?"—":fmt(divYield,2)+"%")+'</div></div>'
    +'</div><div class="companytabs">'+tabs+'</div>';

  let body="";
  if(tab==="overview"){
    body='<div class="sectionline"><h3 class="block">Latest bank snapshot</h3><span>'+fmtDate(latestBank.as_of)+' · '+esc(latestBank.period_type||"—")+'</span></div>'
      +'<div class="bank-kpis four">'
        +'<div class="kpi"><div class="k">H1 PAT</div><div class="v">'+pkrBnLabel(latestBank.profit_after_tax,2)+'</div></div>'
        +'<div class="kpi"><div class="k">H1 EPS</div><div class="v">'+fmtSmart(latestBank.eps,2)+'</div></div>'
        +'<div class="kpi"><div class="k">Annualised ROE</div><div class="v">'+fmtSmart(latestBank.roe_pct,2)+'%</div></div>'
        +'<div class="kpi"><div class="k">Net spread</div><div class="v">'+pkrBnLabel(latestBank.net_spread,2)+'</div></div>'
        +'<div class="kpi"><div class="k">Total assets</div><div class="v">'+pkrBnLabel(latestBank.total_assets,0)+'</div></div>'
        +'<div class="kpi"><div class="k">NPF ratio</div><div class="v">'+fmtSmart(latestBank.npf_ratio_pct,2)+'%</div></div>'
        +'<div class="kpi"><div class="k">Coverage</div><div class="v">'+fmtSmart(latestBank.coverage_ratio_pct,1)+'%</div></div>'
        +'<div class="kpi"><div class="k">CAR</div><div class="v">'+(num(latestBank.car_pct)!==null?fmtSmart(latestBank.car_pct,2)+"%":num(latestBank.car_min_pct)!==null?"> "+fmtSmart(latestBank.car_min_pct,1)+"%":"—")+'</div></div>'
      +'</div>'
      +'<div class="grid2 bank-overview-grid"><div class="card"><div class="analysislabel">ANNUAL PAT TREND</div>'+bankTrendBars(fs)+'</div>'
      +'<div class="card"><div class="analysislabel">FRANCHISE & FOOTPRINT</div><dl class="researchdl">'
        +'<dt>Branches</dt><dd>'+fmtSmart(latestBank.branches)+' across '+fmtSmart(latestBank.cities)+' cities</dd>'
        +'<dt>ATMs</dt><dd>'+fmtSmart(latestBank.atms)+'</dd>'
        +'<dt>Entity rating</dt><dd>'+esc(latestBank.entity_rating||"—")+' · '+esc(latestBank.rating_outlook||"—")+'</dd>'
        +'<dt>Latest interim dividend</dt><dd>Rs '+fmtSmart(latestBank.dps_period,2)+' / share; FY26 YTD Rs '+fmtSmart(latestBank.dps_cumulative_ytd,2)+'</dd>'
      +'</dl></div></div>'
      +'<div class="sectionline"><h3 class="block">Bank framework</h3><span>Sector-specific decision inputs</span></div>'
      +'<div class="card"><dl class="researchdl"><dt>Macro sensitivity</dt><dd>'+esc(bankSector.macro_sensitivity||"—")+'</dd>'
        +'<dt>Key KPIs</dt><dd>'+esc(bankSector.key_kpis||"—")+'</dd>'
        +'<dt>Primary valuation</dt><dd>'+esc(bankSector.primary_valuation_metric||"—")+'</dd>'
        +'<dt>Opportunity cost</dt><dd>'+esc(bankSector.opportunity_vs_tbill||"—")+'</dd></dl></div>'
      +'<div class="sectionline"><h3 class="block">Data coverage</h3><span>Verified coverage now loaded</span></div>'
      +'<div class="gapgrid">'
        +bankDataGap("Price / market profile",price!==null&&marketCapM!==null,"PSX profile verified")
        +bankDataGap("PAT / EPS history",fs.some(x=>num(x.profit_after_tax)!==null),fmtSmart(fs.length)+" structured financial periods")
        +bankDataGap("Bank-specific history",bankRows.length>0,fmtSmart(bankRows.length)+" verified bank-metric periods")
        +bankDataGap("ROE / capital",Boolean(latestRoeRow&&latestCarRow),"ROE and CAR available")
        +bankDataGap("Book value / P/B",Boolean(latestBvpsRow),"FY2025 audited BVPS available")
        +bankDataGap("Dividend yield / payout",divYield!==null&&Boolean(latestPayoutRow),"TTM yield plus FY2025 payout")
        +bankDataGap("CASA / ADR / asset quality",Boolean(latestCasaRow&&latestAdrRow&&latestNpfRow&&latestCoverageRow),"Funding mix and risk metrics loaded")
        +bankDataGap("NIM",false,"Not populated until an issuer-disclosed NIM figure is verified")
      +'</div>';
  } else if(tab==="financials"){
    const rows=bankRows.map(r=>
      '<tr><td class="pad"><strong>'+esc(r.period_type||"—")+'</strong><br><small>'+fmtDate(r.as_of)+'</small></td>'
      +'<td class="pad num">'+pkrBnLabel(r.profit_after_tax,2)+'</td>'
      +'<td class="pad num">'+fmtSmart(r.eps,2)+'</td>'
      +'<td class="pad num">'+pkrBnLabel(r.net_spread,1)+'</td>'
      +'<td class="pad num">'+pkrBnLabel(r.total_assets,0)+'</td>'
      +'<td class="pad num">'+pkrBnLabel(r.deposits,0)+'</td>'
      +'<td class="pad num">'+pkrBnLabel(r.investments,0)+'</td>'
      +'<td class="pad num">'+pkrBnLabel(r.gross_financing,0)+'</td>'
      +'<td class="pad num">'+pkrBnLabel(r.total_equity,0)+'</td>'
      +'<td class="pad">'+verificationBadge(r.verification_status)+'</td></tr>'
    ).join("");
    body='<div class="sectionline"><h3 class="block">Bank financial history</h3><span>PKR billions except EPS</span></div>'
      +'<div class="scroll"><table><thead><tr><th>Period</th><th class="num">PAT</th><th class="num">EPS</th><th class="num">Net spread</th><th class="num">Assets</th><th class="num">Deposits</th><th class="num">Investments</th><th class="num">Gross financing</th><th class="num">Equity</th><th>Status</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
      +'<div class="sectionline"><h3 class="block">Annual PAT trend</h3><span>Audited annual series</span></div><div class="card">'+bankTrendBars(fs)+'</div>'
      +'<p class="hint">Blank cells mean that metric was not explicitly verified from the source used for that period; they are not zero.</p>';
  } else if(tab==="ratios"){
    body='<div class="bank-kpis four">'
      +'<div class="kpi"><div class="k">P/E TTM</div><div class="v">'+(pe===null?"—":fmt(pe,2)+"x")+'</div><div class="meta">Price '+fmtDate(master.price_date)+'</div></div>'
      +'<div class="kpi"><div class="k">P/B</div><div class="v">'+(pb===null?"—":fmt(pb,2)+"x")+'</div><div class="meta">Using FY25 BVPS Rs '+fmtSmart(bvps,2)+'</div></div>'
      +'<div class="kpi"><div class="k">ROE</div><div class="v">'+(latestRoeRow?fmtSmart(latestRoeRow.roe_pct,2)+"%":"—")+'</div><div class="meta">'+(latestRoeRow?fmtDate(latestRoeRow.as_of):"—")+'</div></div>'
      +'<div class="kpi"><div class="k">Dividend yield</div><div class="v">'+(divYield===null?"—":fmt(divYield,2)+"%")+'</div><div class="meta">TTM DPS Rs '+fmtSmart(ttmDPS,2)+'</div></div>'
      +'<div class="kpi"><div class="k">CAR</div><div class="v">'+(latestCarRow?(num(latestCarRow.car_pct)!==null?fmtSmart(latestCarRow.car_pct,2)+"%":"> "+fmtSmart(latestCarRow.car_min_pct,1)+"%"):"—")+'</div><div class="meta">'+(latestCarRow?fmtDate(latestCarRow.as_of):"—")+'</div></div>'
      +'<div class="kpi"><div class="k">NPF ratio</div><div class="v">'+(latestNpfRow?fmtSmart(latestNpfRow.npf_ratio_pct,2)+"%":"—")+'</div><div class="meta">'+(latestNpfRow?fmtDate(latestNpfRow.as_of):"—")+'</div></div>'
      +'<div class="kpi"><div class="k">Coverage ratio</div><div class="v">'+(latestCoverageRow?fmtSmart(latestCoverageRow.coverage_ratio_pct,1)+"%":"—")+'</div><div class="meta">'+(latestCoverageRow?fmtDate(latestCoverageRow.as_of):"—")+'</div></div>'
      +'<div class="kpi"><div class="k">ADR</div><div class="v">'+(latestAdrRow?fmtSmart(latestAdrRow.adr_pct,1)+"%":"—")+'</div><div class="meta">'+(latestAdrRow?fmtDate(latestAdrRow.as_of):"—")+'</div></div>'
      +'<div class="kpi"><div class="k">CASA</div><div class="v">'+(latestCasaRow?fmtSmart(latestCasaRow.casa_pct,1)+"%":"—")+'</div><div class="meta">'+(latestCasaRow?fmtDate(latestCasaRow.as_of):"—")+'</div></div>'
      +'<div class="kpi"><div class="k">ROA</div><div class="v">'+(latestRoaRow?fmtSmart(latestRoaRow.roa_pct,1)+"%":"—")+'</div><div class="meta">'+(latestRoaRow?fmtDate(latestRoaRow.as_of):"—")+'</div></div>'
      +'<div class="kpi"><div class="k">FY25 payout</div><div class="v">'+(latestPayoutRow?fmtSmart(latestPayoutRow.payout_ratio_pct,1)+"%":"—")+'</div></div>'
      +'<div class="kpi"><div class="k">NIM</div><div class="v na">—</div><div class="meta">Awaiting verified issuer disclosure</div></div>'
      +'</div>';
  } else if(tab==="valuation"){
    const base=num(c.base), bear=num(c.bear), bull=num(c.bull);
    const upside=price&&base!==null?((base-price)/price)*100:null;
    const baseScenario=valuationScenarios.find(x=>String(x.scenario||"").toUpperCase()==="BASE")||null;
    const bearScenario=valuationScenarios.find(x=>String(x.scenario||"").toUpperCase()==="BEAR")||null;
    const bullScenario=valuationScenarios.find(x=>String(x.scenario||"").toUpperCase()==="BULL")||null;
    const scenarioCards=valuationScenarios.map(s=>{
      const label=String(s.scenario||"").toUpperCase();
      return '<div class="valscenario '+label.toLowerCase()+'"><div class="valscenariohead"><span>'+esc(label)+'</span>'+verificationBadge(s.verification_status||"PROVISIONAL")+'</div>'
        +'<strong>Rs '+fmtSmart(s.blended_fair_value,2)+'</strong>'
        +'<small>Residual income Rs '+fmtSmart(s.fair_value_primary,2)+' · DDM check Rs '+fmtSmart(s.fair_value_secondary,2)+'</small>'
        +'<dl><dt>ROE path</dt><dd>'+fmtSmart(s.sustainable_roe_year1_pct,1)+'% → '+fmtSmart(s.sustainable_roe_year5_pct,1)+'%</dd>'
        +'<dt>Payout</dt><dd>'+fmtSmart(s.payout_pct,1)+'%</dd>'
        +'<dt>Cost of equity</dt><dd>'+fmtSmart(s.cost_of_equity_pct,1)+'%</dd>'
        +'<dt>Terminal ROE</dt><dd>'+fmtSmart(s.terminal_roe_pct,1)+'%</dd>'
        +'<dt>Terminal growth</dt><dd>'+fmtSmart(s.terminal_growth_pct,1)+'%</dd>'
        +'<dt>Vs current price</dt><dd class="'+(num(s.upside_downside_pct)>=0?"pos":"neg")+'">'+pct(num(s.upside_downside_pct))+'</dd></dl></div>';
    }).join("");

    const historyMap={};
    valuationScenarios.forEach(s=>{const d=String(s.as_of||"");if(!historyMap[d])historyMap[d]={date:d};historyMap[d][String(s.scenario||"").toLowerCase()]=s;});
    const historyRows=Object.values(historyMap).sort((a,b)=>b.date.localeCompare(a.date)).map(h=>
      '<tr><td class="pad">'+fmtDate(h.date)+'</td>'
      +'<td class="pad num">'+(h.bear?"Rs "+fmtSmart(h.bear.blended_fair_value,2):"—")+'</td>'
      +'<td class="pad num">'+(h.base?"Rs "+fmtSmart(h.base.blended_fair_value,2):"—")+'</td>'
      +'<td class="pad num">'+(h.bull?"Rs "+fmtSmart(h.bull.blended_fair_value,2):"—")+'</td>'
      +'<td class="pad">'+verificationBadge((h.base&&h.base.verification_status)||"PROVISIONAL")+'</td></tr>'
    ).join("");

    const modelBook=bvps;
    const modelPrice=price;
    const modelTbill=tbill;
    body='<div class="valuationhero"><div><div class="analysislabel">MEBL INTRINSIC VALUE MODEL</div><h3>5-year residual income + clean-surplus DDM check</h3><p>The model anchors to audited FY2025 book value and fades ROE over five years. The DDM check uses the same clean-surplus economics, so it should converge with residual income when assumptions are internally consistent.</p></div>'
      +'<div class="valuationstatus">'+verificationBadge(latestValuation?latestValuation.verification_status:"MISSING")+'<span>'+(latestValuation?("Model as of "+fmtDate(latestValuation.as_of)):"No model stored")+'</span></div></div>'
      +'<div class="bank-kpis four">'
        +'<div class="kpi"><div class="k">Current price</div><div class="v">Rs '+fmt(price,2)+'</div><div class="meta">'+fmtDate(master.price_date)+'</div></div>'
        +'<div class="kpi"><div class="k">Saved model range</div><div class="v">Rs '+(bearScenario?fmtSmart(bearScenario.blended_fair_value,0):"—")+'–'+(bullScenario?fmtSmart(bullScenario.blended_fair_value,0):"—")+'</div></div>'
        +'<div class="kpi"><div class="k">Saved base value</div><div class="v">'+(baseScenario?"Rs "+fmtSmart(baseScenario.blended_fair_value,2):"—")+'</div></div>'
        +'<div class="kpi"><div class="k">Saved base vs price</div><div class="v '+(baseScenario&&num(baseScenario.upside_downside_pct)>=0?"pos":"neg")+'">'+(baseScenario?pct(num(baseScenario.upside_downside_pct)):"—")+'</div></div>'
      +'</div>'
      +'<div class="valscenarios">'+(scenarioCards||'<p class="empty">No stored valuation scenarios.</p>')+'</div>'

      +'<div class="sectionline"><h3 class="block">Interactive scenario lab</h3><span>Updates instantly; does not overwrite verified source data</span></div>'
      +'<div class="modellab" data-mebl-model-root data-book="'+esc(modelBook)+'" data-price="'+esc(modelPrice)+'" data-tbill="'+esc(modelTbill)+'">'
        +'<div class="modelcontrols">'
          +'<div class="field"><label>Year 1 ROE %</label><input type="number" step="0.1" data-guest-enabled data-mebl-model="startRoe" data-model-default="'+esc(baseScenario&&baseScenario.sustainable_roe_year1_pct||30)+'" value="'+esc(baseScenario&&baseScenario.sustainable_roe_year1_pct||30)+'"></div>'
          +'<div class="field"><label>Year 5 ROE %</label><input type="number" step="0.1" data-guest-enabled data-mebl-model="endRoe" data-model-default="'+esc(baseScenario&&baseScenario.sustainable_roe_year5_pct||25)+'" value="'+esc(baseScenario&&baseScenario.sustainable_roe_year5_pct||25)+'"></div>'
          +'<div class="field"><label>Payout %</label><input type="number" step="0.1" min="0" max="100" data-guest-enabled data-mebl-model="payout" data-model-default="'+esc(baseScenario&&baseScenario.payout_pct||58)+'" value="'+esc(baseScenario&&baseScenario.payout_pct||58)+'"></div>'
          +'<div class="field"><label>Cost of equity %</label><input type="number" step="0.1" data-guest-enabled data-mebl-model="coe" data-model-default="'+esc(baseScenario&&baseScenario.cost_of_equity_pct||18)+'" value="'+esc(baseScenario&&baseScenario.cost_of_equity_pct||18)+'"></div>'
          +'<div class="field"><label>Terminal ROE %</label><input type="number" step="0.1" data-guest-enabled data-mebl-model="terminalRoe" data-model-default="'+esc(baseScenario&&baseScenario.terminal_roe_pct||24)+'" value="'+esc(baseScenario&&baseScenario.terminal_roe_pct||24)+'"></div>'
          +'<div class="field"><label>Terminal growth %</label><input type="number" step="0.1" data-guest-enabled data-mebl-model="growth" data-model-default="'+esc(baseScenario&&baseScenario.terminal_growth_pct||6)+'" value="'+esc(baseScenario&&baseScenario.terminal_growth_pct||6)+'"></div>'
        +'</div>'
        +'<div class="modeltoolbar"><button class="btn small" type="button" data-mebl-reset>Reset to saved base</button><span>Audited BVPS Rs '+fmtSmart(modelBook,2)+' · 12M T-bill '+fmtSmart(modelTbill,2)+'%</span></div>'
        +'<div class="bank-kpis four modeloutputs">'
          +'<div class="kpi"><div class="k">Live fair value</div><div class="v" data-model-output="fair">—</div></div>'
          +'<div class="kpi"><div class="k">Residual income</div><div class="v" data-model-output="ri">—</div></div>'
          +'<div class="kpi"><div class="k">DDM check</div><div class="v" data-model-output="ddm">—</div></div>'
          +'<div class="kpi"><div class="k">Vs current price</div><div class="v" data-model-output="vsprice">—</div></div>'
          +'<div class="kpi"><div class="k">Margin of safety</div><div class="v" data-model-output="mos">—</div></div>'
          +'<div class="kpi"><div class="k">Implied fair P/B</div><div class="v" data-model-output="pb">—</div></div>'
          +'<div class="kpi"><div class="k">ROE fade path</div><div class="v smallv" data-model-output="roePath">—</div></div>'
          +'<div class="kpi"><div class="k">Terminal payout implied by g</div><div class="v" data-model-output="terminalPayout">—</div></div>'
        +'</div>'
        +'<div class="sectionline"><h3 class="block">What would justify the market price?</h3><span>Holding the other live inputs constant</span></div>'
        +'<div class="bank-kpis four">'
          +'<div class="kpi"><div class="k">Implied terminal ROE</div><div class="v" data-model-output="impliedRoe">—</div><div class="meta">At selected cost of equity / growth</div></div>'
          +'<div class="kpi"><div class="k">Implied cost of equity</div><div class="v" data-model-output="impliedCoe">—</div><div class="meta">At selected terminal ROE / growth</div></div>'
          +'<div class="kpi"><div class="k">Implied equity premium vs T-bill</div><div class="v" data-model-output="impliedPremium">—</div></div>'
          +'<div class="kpi"><div class="k">Market price</div><div class="v">Rs '+fmt(price,2)+'</div></div>'
        +'</div>'
        +'<div class="sectionline"><h3 class="block">Sensitivity matrix</h3><span>Fair value by terminal ROE and cost of equity</span></div>'
        +'<div id="meblSensitivity" class="sensitivitywrap"></div>'
      +'</div>'

      +'<div class="sectionline"><h3 class="block">Verified anchors</h3><span>Facts used by the model</span></div>'
      +'<div class="bank-kpis four">'
        +'<div class="kpi"><div class="k">FY25 BVPS</div><div class="v">Rs '+fmtSmart(bvps,2)+'</div></div>'
        +'<div class="kpi"><div class="k">Latest ROE</div><div class="v">'+(latestRoeRow?fmtSmart(latestRoeRow.roe_pct,1)+"%":"—")+'</div></div>'
        +'<div class="kpi"><div class="k">TTM EPS</div><div class="v">'+fmtSmart(ttmEPS,2)+'</div></div>'
        +'<div class="kpi"><div class="k">TTM DPS</div><div class="v">Rs '+fmtSmart(ttmDPS,2)+'</div></div>'
        +'<div class="kpi"><div class="k">FY25 payout</div><div class="v">'+(latestPayoutRow?fmtSmart(latestPayoutRow.payout_ratio_pct,1)+"%":"—")+'</div></div>'
        +'<div class="kpi"><div class="k">12M T-bill</div><div class="v">'+(tbill===null?"—":fmt(tbill,2)+"%")+'</div></div>'
        +'<div class="kpi"><div class="k">NPF / coverage</div><div class="v">'+(latestNpfRow?fmtSmart(latestNpfRow.npf_ratio_pct,2)+"%":"—")+' / '+(latestCoverageRow?fmtSmart(latestCoverageRow.coverage_ratio_pct,0)+"%":"—")+'</div></div>'
        +'<div class="kpi"><div class="k">CAR</div><div class="v">'+(latestCarRow?(num(latestCarRow.car_pct)!==null?fmtSmart(latestCarRow.car_pct,1)+"%":"> "+fmtSmart(latestCarRow.car_min_pct,1)+"%"):"—")+'</div></div>'
      +'</div>'
      +'<div class="resultnotice limited"><strong>Interpretation rule</strong><span>Negative margin of safety means the market price is above the modeled intrinsic value under the selected assumptions. It is not a trading instruction.</span></div>'
      +'<div class="noticebox"><strong>Model sensitivity</strong><span>Sustainable ROE, cost of equity and terminal growth drive most of the valuation. The live scenario lab is designed to make that sensitivity visible rather than hide it behind one target price.</span></div>'

      +'<div class="sectionline"><h3 class="block">Model history</h3><span>Stored valuation snapshots</span></div>'
      +'<div class="scroll"><table><thead><tr><th>As of</th><th class="num">Bear</th><th class="num">Base</th><th class="num">Bull</th><th>Status</th></tr></thead><tbody>'
        +(historyRows||'<tr><td class="pad empty" colspan="5">No model history stored yet.</td></tr>')+'</tbody></table></div>'

      +'<div class="sectionline"><h3 class="block">Personal fair-value overlay</h3><span>Optional; saved only when signed in</span></div>'
      +'<div class="inline">'
        +'<div class="field"><label>Bear Rs</label><input type="text" data-co-field="bear" value="'+esc(c.bear||"")+'"></div>'
        +'<div class="field"><label>Base Rs</label><input type="text" data-co-field="base" value="'+esc(c.base||"")+'"></div>'
        +'<div class="field"><label>Bull Rs</label><input type="text" data-co-field="bull" value="'+esc(c.bull||"")+'"></div>'
        +'<div class="field"><label>Required return %</label><input type="text" data-co-field="required" value="'+esc(c.required||"")+'"></div>'
      +'</div>'
      +'<div class="bank-kpis four" style="margin-top:14px">'
        +'<div class="kpi"><div class="k">Personal base upside</div><div class="v '+(upside===null?"na":upside>=0?"pos":"neg")+'">'+(upside===null?"—":pct(upside))+'</div></div>'
        +'<div class="kpi"><div class="k">Current P/B</div><div class="v">'+(pb===null?"—":fmt(pb,2)+"x")+'</div></div>'
        +'<div class="kpi"><div class="k">Saved model base P/B</div><div class="v">'+(latestValuation&&num(latestValuation.target_pb)!==null?fmtSmart(latestValuation.target_pb,2)+"x":"—")+'</div></div>'
        +'<div class="kpi"><div class="k">Saved base required return</div><div class="v">'+(baseScenario?fmtSmart(baseScenario.cost_of_equity_pct,1)+"%":"—")+'</div></div>'
      +'</div>';
  } else if(tab==="news"){
    const own=companyEvents.map(e=>'<article class="newsitem"><div class="newsmeta"><span>'+fmtDate(e.event_date)+'</span><span>'+esc(e.event_type||"Event")+'</span><span class="material '+newsMaterialityClass(e.materiality)+'">'+esc(String(e.materiality||"—").toUpperCase())+'</span></div><h3>'+esc(e.headline||"—")+'</h3><p class="newsfact">'+esc(e.fact_summary||e.what_changed||"—")+'</p><div class="newssource">'+esc(sourceTextForEvent(e))+'</div>'+(e.required_action?'<div class="newsaction"><b>Research action</b><span>'+esc(e.required_action)+'</span></div>':"")+'</article>').join("");
    const relevant=macroEvents.slice(0,5).map(e=>'<article class="newsitem"><div class="newsmeta"><span>'+fmtDate(e.event_date)+'</span><span>Bank macro</span></div><h3>'+esc(e.headline||"—")+'</h3><p class="newsfact">'+esc(e.fact_summary||"—")+'</p><div class="newssource">'+esc(sourceTextForEvent(e))+'</div></article>').join("");
    body='<div class="sectionline"><h3 class="block">MEBL-specific events</h3><span>Company feed</span></div>'+(own||'<p class="empty">No MEBL-specific research events have been ingested yet.</p>')
      +'<div class="sectionline"><h3 class="block">Bank-relevant macro</h3><span>Rates and inflation</span></div>'+(relevant||'<p class="empty">No bank-relevant macro events available.</p>');
  } else if(tab==="analysis"){
    const h1=bankRows.find(r=>r.as_of==="2026-06-30")||latestBank;
    const fy25=bankRows.find(r=>r.as_of==="2025-12-31")||latestFYBank;
    body='<div class="factinterpret"><div><span class="analysislabel">FACT</span><strong>Latest operating picture</strong>'
      +'<p>H1 2026 PAT was '+pkrBnLabel(h1.profit_after_tax,2)+', EPS '+fmtSmart(h1.eps,2)+', annualised ROE '+fmtSmart(h1.roe_pct,1)+'%, NPF '+fmtSmart(h1.npf_ratio_pct,2)+'% and coverage '+fmtSmart(h1.coverage_ratio_pct,0)+'%.</p>'
      +'<p>FY2025 deposits were '+pkrBnLabel(fy25.deposits,0)+', investments '+pkrBnLabel(fy25.investments,0)+' and gross financing '+pkrBnLabel(fy25.gross_financing,0)+'.</p></div>'
      +'<div><span class="analysislabel">INTERPRETATION</span><p>The verified data show a high-ROE, well-provisioned Islamic bank operating through a lower-rate cycle. Spread growth is modest, while non-funded income and balance-sheet scale are important offsets. Valuation should be anchored to sustainable ROE versus cost of equity and book-value growth, not P/E alone.</p></div></div>'
      +'<div class="analysisgrid">'
        +'<div class="analysispanel"><div class="analysislabel">MACRO</div><div class="impactrow"><strong>Policy rate</strong><span>'+(policy&&policy.latest_value!=null?fmtSmart(policy.latest_value)+"%":"—")+'</span></div><div class="impactrow"><strong>CPI YoY</strong><span>'+(cpi&&cpi.latest_value!=null?fmtSmart(cpi.latest_value)+"%":"—")+'</span></div><div class="impactrow"><strong>12M T-bill</strong><span>'+(tb&&tb.latest_value!=null?fmtSmart(tb.latest_value)+"%":"—")+'</span></div></div>'
        +'<div class="analysispanel"><div class="analysislabel">QUALITY</div><div class="impactrow"><strong>ROE</strong><span>'+fmtSmart(h1.roe_pct,1)+'%</span></div><div class="impactrow"><strong>NPF / coverage</strong><span>'+fmtSmart(h1.npf_ratio_pct,2)+'% / '+fmtSmart(h1.coverage_ratio_pct,0)+'%</span></div><div class="impactrow"><strong>CAR</strong><span>'+(num(h1.car_pct)!==null?fmtSmart(h1.car_pct,1)+"%":"> "+fmtSmart(h1.car_min_pct,1)+"%")+'</span></div></div>'
        +'<div class="analysispanel"><div class="analysislabel">VALUATION CONTEXT</div><div class="impactrow"><strong>P/E</strong><span>'+(pe===null?"—":fmt(pe,2)+"x")+'</span></div><div class="impactrow"><strong>P/B on FY25 BVPS</strong><span>'+(pb===null?"—":fmt(pb,2)+"x")+'</span></div><div class="impactrow"><strong>Dividend yield</strong><span>'+(divYield===null?"—":fmt(divYield,2)+"%")+'</span></div></div>'
      +'</div>'
      +'<div class="sectionline"><h3 class="block">Valuation model now available</h3><span>Bear / base / bull</span></div>'
      +'<div class="queue"><strong>MEBL</strong><span class="why">Residual-income and DDM scenarios are stored in the Valuation tab with explicit ROE, payout, cost-of-equity and terminal-growth assumptions.</span><span class="act">Valuation</span></div>'
      +'<div class="queue warn"><strong>MEBL</strong><span class="why">Re-run the model whenever policy-rate expectations, sustainable ROE or book value materially change.</span><span class="act">Monitor</span></div>'
      +'<div class="queue"><strong>MEBL</strong><span class="why">NIM remains unpopulated until an issuer-disclosed figure is verified.</span><span class="act">Data</span></div>';
  } else {
    const srcRows=docs.map(d=>'<tr><td class="pad"><strong>'+esc(d.title||d.document_type||"—")+'</strong></td><td class="pad">'+esc(d.document_type||"—")+'</td><td class="pad">'+fmtDate(d.period_end)+'</td><td class="pad">'+verificationBadge(d.verification_status)+'</td><td class="pad">'+(safeHttpsUrl(d.source_url)?'<a href="'+esc(safeHttpsUrl(d.source_url))+'" target="_blank" rel="noreferrer">Open source</a>':"—")+'</td></tr>').join("");
    body='<div class="sectionline"><h3 class="block">Source documents</h3><span>'+fmtSmart(docs.length)+' evidence records</span></div>'
      +'<div class="scroll"><table><thead><tr><th>Document</th><th>Type</th><th>Period</th><th>Verification</th><th>Link</th></tr></thead><tbody>'+(srcRows||'<tr><td class="pad empty" colspan="5">No source documents found.</td></tr>')+'</tbody></table></div>'
      +'<div class="noticebox"><strong>Verification hierarchy</strong><span>Issuer annual/interim reports and official results releases take precedence. Standardized PSX rows are retained for cross-checking and historical continuity.</span></div>';
  }
  return header+body;
}
function companyHTML(t){
  const c=state.companies[t]||ensureCompanyDetailFromMaster(t);
  if(!c) return '<h2 class="section">Not found</h2><p class="sub">That company is not in the live company universe. <a href="#" data-nav="companies">Back to the list</a>.</p>';

  const price=num(c.price), base=num(c.base), bear=num(c.bear), bull=num(c.bull);
  const upside=(price&&base!==null)?((base-price)/price)*100:null;
  const mos=(base&&price!==null)?((base-price)/base)*100:null;
  const master=masterCompanyByTicker(t);
  const masterSector=master ? (master.sector||"—") : (c.sectorName||secName(c.sector));
  const dc=c.dataCoverage||null;
  if(masterSector==="COMMERCIAL BANKS") return bankCompanyHTML(t,c,master||{},dc);

  const rows=(c.fy||[]).map(r=>{
    const src=safeHttpsUrl(r.source_url)
      ? '<a href="'+esc(safeHttpsUrl(r.source_url))+'" target="_blank" rel="noreferrer">'+esc(r.source_name||"source")+'</a>'
      : esc(r.source_name||"—");
    return '<tr>'
      +'<td class="pad num">'+esc(r.year||"—")+'</td>'
      +'<td class="pad num">'+fmtSmart(r.rev,2)+'</td>'
      +'<td class="pad num">'+fmtSmart(r.pat,2)+'</td>'
      +'<td class="pad num">'+fmtSmart(r.eps,4)+'</td>'
      +'<td class="pad num">'+fmtSmart(r.roe,4)+'</td>'
      +'<td class="pad num">'+fmtSmart(r.dps,4)+'</td>'
      +'<td class="pad num">'+fmtSmart(r.de,4)+'</td>'
      +'<td class="pad">'+verificationBadge(r.verification_status||"PROVISIONAL")+'</td>'
      +'<td class="pad">'+src+(r.source_page?' · p. '+esc(r.source_page):'')+'</td></tr>';
  }).join("");

  return '<p class="meta"><a href="#" data-nav="companies">Companies</a> / '+esc(masterSector)+'</p>'
    +'<h2 class="section">'+esc(c.ticker)+' — '+esc(c.name||"")+'</h2>'
    +'<div class="inline" style="margin:14px 0 18px">'
      +'<div class="field"><label>Coverage</label><input type="text" value="'+esc(c.coverage||"—")+'" disabled></div>'
      +'<div class="field"><label>Master sector</label><input type="text" value="'+esc(masterSector)+'" disabled></div>'
      +'<div class="field"><label>Price Rs</label><input type="text" value="'+fmtSmart(c.price,2)+'" disabled></div>'
      +'<div class="field"><label>Shares mn</label><input type="text" value="'+fmtSmart(c.shares,4)+'" disabled></div>'
      +'<div class="field"><label>Data verification</label><div style="padding-top:7px">'+verificationBadge(dc&&dc.verification_status)+'</div></div>'
    +'</div>'
    +'<div class="kpis">'
      +'<div class="kpi"><div class="k">Financial rows</div><div class="v">'+(dc?fmtSmart(dc.financial_rows):"—")+'</div></div>'
      +'<div class="kpi"><div class="k">Ratio rows</div><div class="v">'+(dc?fmtSmart(dc.ratio_rows):"—")+'</div></div>'
      +'<div class="kpi"><div class="k">Price rows</div><div class="v">'+(dc?fmtSmart(dc.price_rows):"—")+'</div></div>'
      +'<div class="kpi"><div class="k">Valuation rows</div><div class="v">'+(dc?fmtSmart(dc.valuation_rows):"—")+'</div></div>'
    +'</div>'
    +'<h3 class="block">Financial history</h3>'
    +'<p class="hint">Live structured financial data. Missing values display as — and are not estimated.</p>'
    +'<div class="scroll"><table><thead><tr><th class="num">Year</th><th class="num">Revenue</th><th class="num">PAT</th><th class="num">EPS</th><th class="num">ROE %</th><th class="num">Dividends</th><th class="num">Debt/Equity</th><th>Verification</th><th>Source</th></tr></thead><tbody>'
      +(rows||'<tr><td class="pad empty" colspan="9">No structured financial history available for this company yet.</td></tr>')
    +'</tbody></table></div>'
    +'<h3 class="block">Fair value — personal model</h3>'
    +'<div class="inline" style="margin-bottom:10px">'
      +'<div class="field"><label>Bear Rs</label><input type="text" data-co-field="bear" value="'+esc(c.bear||"")+'"></div>'
      +'<div class="field"><label>Base Rs</label><input type="text" data-co-field="base" value="'+esc(c.base||"")+'"></div>'
      +'<div class="field"><label>Bull Rs</label><input type="text" data-co-field="bull" value="'+esc(c.bull||"")+'"></div>'
      +'<div class="field"><label>Required return %</label><input type="text" data-co-field="required" value="'+esc(c.required||"")+'"></div>'
    +'</div>'
    +'<div class="kpis"><div class="kpi"><div class="k">Upside to base</div><div class="v'+(upside===null?" na":"")+'">'+(upside===null?"—":pct(upside))+'</div></div>'
      +'<div class="kpi"><div class="k">Margin of safety</div><div class="v'+(mos===null?" na":"")+'">'+(mos===null?"—":mos.toFixed(1)+"%")+'</div></div>'
      +'<div class="kpi"><div class="k">Bear downside</div><div class="v'+((price&&bear!==null)?"":" na")+'">'+((price&&bear!==null)?pct(((bear-price)/price)*100):"—")+'</div></div>'
      +'<div class="kpi"><div class="k">Bull upside</div><div class="v'+((price&&bull!==null)?"":" na")+'">'+((price&&bull!==null)?pct(((bull-price)/price)*100):"—")+'</div></div></div>'
    +'<h3 class="block">Judgement — personal overlay</h3>'
    +['thesis','catalyst','risks','quality'].map(f=>'<div class="field"><label>'
      +({thesis:"Thesis",catalyst:"Next catalyst",risks:"What kills it",quality:"Business quality and balance sheet"}[f])+'</label>'
      +'<textarea data-co-field="'+f+'" rows="3">'+esc(c[f]||"")+'</textarea></div>').join("");
}

;
/* ===== assets/views-03-01.js ===== */
function valuationHTML(){
  const rows=valuationRows();
  const body=rows.map(c=>{
    const cls = (c.mos!==null && c.mos>=25) ? "" : "";
    return "<tr class='"+cls+"'><td class='pad'><a href='#' data-nav='company' data-id='"+esc(c.ticker)+"'>"+esc(c.ticker)+"</a></td>"
      +"<td class='pad'>"+esc(secName(c.sector))+"</td>"
      +"<td class='pad num'>"+(c.price===null?"—":fmt(c.price,2))+"</td>"
      +"<td class='pad num'>"+(c.bear===null?"—":fmt(c.bear,0))+"</td>"
      +"<td class='pad num'>"+(c.base===null?"—":fmt(c.base,0))+"</td>"
      +"<td class='pad num'>"+(c.bull===null?"—":fmt(c.bull,0))+"</td>"
      +"<td class='pad num "+(c.upside===null?"":c.upside>=0?"pos":"neg")+"'>"+(c.upside===null?"—":pct(c.upside))+"</td>"
      +"<td class='pad num'>"+(c.mos===null?"—":c.mos.toFixed(0)+"%")+"</td></tr>";
  }).join("");
  return '<h2 class="section">Valuation</h2>'
    +'<p class="sub">Upside and margin of safety are calculated from the price and fair-value numbers on each company page. Blank inputs stay blank here rather than defaulting to zero.</p>'
    +'<div class="scroll"><table><thead><tr><th>Ticker</th><th>Sector</th><th class="num">Price</th><th class="num">Bear</th><th class="num">Base</th><th class="num">Bull</th><th class="num">Upside</th><th class="num">MoS</th></tr></thead><tbody>'
    +(body||'<tr><td class="pad empty" colspan="8">No company has a fair-value estimate yet.</td></tr>')+'</tbody></table></div>'
    +'<p class="hint" style="margin-top:12px">Margin of safety is measured against your base case, not against the bull case. If the only way a name looks cheap is the bull column, it is not cheap.</p>';
}

;

/* ===== assets/views-03-02.js ===== */
function portfolioHTML(){
  const p=state.portfolio, {rows,cash,invested,total}=positionRows();
  const capP=num(p.capPosition), capS=num(p.capSector);
  const exp=sectorExposure();
  const body=rows.map((r,i)=>{
    const over = capP!==null && r.weight!==null && r.weight>capP;
    const cls = r.missing.length? "bad" : over? "flag":"";
    return "<tr class='"+cls+"'>"
      +'<td><input type=text data-pos='+i+' data-col="ticker" value="'+esc(r.ticker||"")+'" placeholder="Ticker"></td>'
      +'<td><select data-pos='+i+' data-col="sector">'+opts([""].concat(SECTORS.map(s=>s.id)),r.sector).replace(/>([a-z]+)</g,(mm,id)=>{const s=SECTORS.find(x=>x.id===id);return ">"+(s?esc(s.short):id)+"<";})+'</select></td>'
      +'<td><select data-pos='+i+' data-col="bucket">'+opts([""].concat(BUCKETS),r.bucket)+'</select></td>'
      +'<td class="num"><input type=text data-pos='+i+' data-col="qty" value="'+esc(r.qty||"")+'"></td>'
      +'<td class="num"><input type=text data-pos='+i+' data-col="cost" value="'+esc(r.cost||"")+'"></td>'
      +'<td class="num"><input type=text data-pos='+i+' data-col="price" value="'+esc(r.price!==null?r.price:"")+'"></td>'
      +'<td class="pad num">'+(r.value===null?"—":fmt(r.value,0))+'</td>'
      +'<td class="pad num">'+(r.weight===null?"—":r.weight.toFixed(1)+"%")+'</td>'
      +'<td class="pad num '+(r.pnl===null?"":r.pnl>=0?"pos":"neg")+'">'+(r.pnl===null?"—":pct(r.pnl))+'</td>'
      +'<td class="num"><input type=text data-pos='+i+' data-col="stop" value="'+esc(r.stop||"")+'" placeholder="stop"></td>'
      +'<td class="num"><input type=text data-pos='+i+' data-col="target" value="'+esc(r.target||"")+'" placeholder="target"></td>'
      +'<td><input type=date data-pos='+i+' data-col="review" value="'+esc(r.review||"")+'"></td>'
      +'<td><button class="rowdel" data-delpos="'+i+'" aria-label="Delete">×</button></td></tr>';
  }).join("");
  const expRows=Object.keys(exp).sort((a,b)=>exp[b]-exp[a]).map(k=>{
    const over = capS!==null && exp[k]>capS;
    return "<tr class='"+(over?"flag":"")+"'><td class='pad'>"+esc(secName(k))+"</td><td class='pad num'>"+exp[k].toFixed(1)+"%</td>"
      +"<td class='pad num'>"+(capS===null?"—":capS+"%")+"</td><td class='pad'>"+(over?"Over cap":"Within cap")+"</td></tr>";
  }).join("");
  return '<h2 class="section">Portfolio</h2>'
    +'<p class="sub">Every position carries a stop, a target and a review date set at entry. Rows missing any of the three are shaded — that is the rule doing its job, not an error.</p>'
    +'<div class="inline" style="margin-bottom:16px">'
    +'<div class="field"><label>Cash Rs</label><input type="text" data-pf="cash" value="'+esc(p.cash||"")+'"></div>'
    +'<div class="field"><label>Position cap %</label><input type="text" data-pf="capPosition" value="'+esc(p.capPosition||"")+'"></div>'
    +'<div class="field"><label>Sector cap %</label><input type="text" data-pf="capSector" value="'+esc(p.capSector||"")+'"></div></div>'
    +'<div class="kpis"><div class="kpi"><div class="k">Invested Rs</div><div class="v">'+fmt(invested,0)+'</div></div>'
    +'<div class="kpi"><div class="k">Cash Rs</div><div class="v">'+fmt(cash,0)+'</div></div>'
    +'<div class="kpi"><div class="k">Total Rs</div><div class="v">'+fmt(total,0)+'</div></div>'
    +'<div class="kpi"><div class="k">Cash weight</div><div class="v">'+(total>0?((cash/total)*100).toFixed(1)+"%":"—")+'</div></div></div>'
    +'<div class="scroll"><table><thead><tr><th>Ticker</th><th>Sector</th><th>Bucket</th><th class="num">Qty</th><th class="num">Avg cost</th><th class="num">Price</th><th class="num">Value</th><th class="num">Weight</th><th class="num">P&L</th><th class="num">Stop</th><th class="num">Target</th><th>Review</th><th></th></tr></thead><tbody>'
    +(body||'<tr><td class="pad empty" colspan="13">No positions.</td></tr>')+'</tbody></table></div>'
    +'<p style="margin-top:10px"><button class="btn" id="addPos">Add position</button></p>'
    +'<h3 class="block">Sector exposure against cap</h3>'
    +'<div class="scroll"><table><thead><tr><th>Sector</th><th class="num">Weight</th><th class="num">Cap</th><th>Status</th></tr></thead><tbody>'
    +(expRows||'<tr><td class="pad empty" colspan="4">No exposure recorded.</td></tr>')+'</tbody></table></div>';
}

;

/* ===== assets/views-03-03.js ===== */
function eventsHTML(){
  const list=(state.events||[]).slice().sort((a,b)=>String(a.date||"").localeCompare(String(b.date||"")));
  const body=list.map((e,i)=>{
    const upcoming = e.date && e.date>=todayISO();
    return "<tr class='"+(upcoming?"":"")+"'>"
      +'<td><input type=date data-ev='+i+' data-col="date" value="'+esc(e.date||"")+'"></td>'
      +'<td><input type=text data-ev='+i+' data-col="subject" value="'+esc(e.subject||"")+'" placeholder="Ticker or sector"></td>'
      +'<td><input type=text data-ev='+i+' data-col="what" value="'+esc(e.what||"")+'" placeholder="Results, MPC, AGM"></td>'
      +'<td><input type=text data-ev='+i+' data-col="impact" value="'+esc(e.impact||"")+'" placeholder="What it would change"></td>'
      +'<td><button class="rowdel" data-delev="'+i+'" aria-label="Delete">×</button></td></tr>';
  }).join("");
  return '<h2 class="section">Events</h2>'
    +'<p class="sub">Only what could change a thesis. A calendar of everything is noise; a calendar of catalysts is a work plan.</p>'
    +'<div class="scroll"><table><thead><tr><th>Date</th><th>Subject</th><th>Event</th><th>What it would change</th><th></th></tr></thead><tbody>'
    +(body||'<tr><td class="pad empty" colspan="5">No events. Start with the MPC dates and the next results season.</td></tr>')
    +'</tbody></table></div><p style="margin-top:10px"><button class="btn" id="addEv">Add event</button></p>';
}

function queueHTML(){
  const q=researchQueue();
  return '<h2 class="section">Research queue</h2>'
    +'<p class="sub">Built from what is stale, what breaks a risk rule, and what is about to happen. Nothing here was typed in — it is derived from everything else in the file.</p>'
    +(q.length? q.map(x=>'<div class="queue '+x.sev+'"><strong>'+esc(x.what)+'</strong><span class="why">'+esc(x.why)+'</span><span class="act">'+esc(x.act)+'</span></div>').join("")
      : '<p class="empty">Nothing outstanding. Either you are current, or the file is empty enough to have nothing to say.</p>');
}

;

/* ===== assets/views-04-01.js ===== */
function logHTML(){
  const secOpts='<option value="Macro">Macro</option>'+SECTORS.map(s=>'<option value="'+esc(s.name)+'">'+esc(s.name)+'</option>').join("");
  const entries=state.log.length? state.log.map(e=>'<div class="logentry"><h4>'+esc(e.sector||"")+'</h4>'
    +'<div class="lmeta">'+fmtDate(e.date)+' · conviction '+esc(e.confidence||"—")+'</div>'
    +'<p><span class="lbl">Belief</span>'+esc(e.belief||"")+'</p>'
    +(e.why?'<p><span class="lbl">Because</span>'+esc(e.why)+'</p>':"")
    +(e.falsifier?'<p><span class="lbl">Wrong if</span>'+esc(e.falsifier)+'</p>':"")
    +(e.action?'<p><span class="lbl">Did</span>'+esc(e.action)+'</p>':"")+'</div>').join("")
    : '<p class="empty">Nothing logged yet. The first entry is the start of your track record.</p>';
  return '<h2 class="section">Decision log</h2>'
    +'<p class="sub">Dated and append-only. Entries cannot be edited or deleted — a record you can tidy afterwards tells you nothing about whether your judgement is any good.</p>'
    +'<div class="card" style="margin-bottom:24px"><div class="inline" style="margin-bottom:12px">'
    +'<div class="field"><label for="l_date">Date</label><input type="date" id="l_date" value="'+todayISO()+'"></div>'
    +'<div class="field"><label for="l_sector">Sector</label><select id="l_sector">'+secOpts+'</select></div>'
    +'<div class="field"><label for="l_conf">Conviction 1–5</label><input type="number" id="l_conf" min="1" max="5" step="1"></div></div>'
    +'<div class="field"><label for="l_belief">What I believe</label><textarea id="l_belief" rows="2"></textarea></div>'
    +'<div class="field"><label for="l_why">Because</label><textarea id="l_why" rows="2"></textarea></div>'
    +'<div class="field"><label for="l_fals">This is wrong if</label><textarea id="l_fals" rows="2"></textarea></div>'
    +'<div class="field"><label for="l_action">What I did</label><textarea id="l_action" rows="2" placeholder="Entry, size, stop, target, review date — or nothing"></textarea></div>'
    +'<button class="btn primary" id="addLog">Record entry</button></div>'+entries;
}

function sourcesHTML(){
  const rows=(state.sources||[]).map((r,i)=>{
    return "<tr>"
      +'<td><input type=text data-src='+i+' data-col="label" value="'+esc(r.label||"")+'" placeholder="Cement dispatches"></td>'
      +'<td><select data-src='+i+' data-col="sector">'+SECTORS.map(x=>'<option value="'+x.id+'"'+(r.sector===x.id?" selected":"")+">"+esc(x.short)+"</option>").join("")+'</select></td>'
      +'<td><input type=text data-src='+i+' data-col="url" value="'+esc(r.url||"")+'" placeholder="https://…"></td>'
      +'<td class="pad meta">'+esc(r.lastPull||"never")+'</td>'
      +'<td class="pad">'+((window.CONFIG&&CONFIG.sourcePullEnabled)?'<button class="btn small" data-pull="'+i+'">Pull</button>':'—')+'</td>'
      +'<td><button class="rowdel" data-delsrc="'+i+'" aria-label="Delete">×</button></td></tr>';
  }).join("");
  return '<h2 class="section">Sources</h2>'
    +'<p class="sub">Research source registry. Automated source pulling is disabled in this preview until the server-side fetch service is deployed.</p>'
    +'<div class="scroll"><table><thead><tr><th>What it publishes</th><th>Sector</th><th>Address</th><th>Last pull</th><th></th><th></th></tr></thead><tbody>'
    +(rows||'<tr><td class="pad empty" colspan="6">No sources yet. Add the pages you already check by hand each month.</td></tr>')
    +'</tbody></table></div><p style="margin-top:10px"><button class="btn" id="addSrc">Add source</button></p>'
    +'<div id="pullOut"></div>'
    +'<h3 class="block">What this can and cannot do</h3>'
    +'<div class="prose"><p>Pull works on pages that publish their numbers as ordinary text. It will not get through a login, a PDF scan, or a figure that only exists inside a chart image. When a page changes its layout, the pull will start coming back empty — that is normal, and the fix is to check the page yourself.</p>'
    +'<p>Nothing is saved from a pull until you approve it, for the same reason nothing is saved from the fill-in box: a number whose origin you cannot vouch for is worse than a blank.</p></div>'
    +'<h3 class="block">Verification order</h3>'
    +'<ul class="tight"><li>PSX data portal — prices, financials, announcements</li>'
    +'<li>State Bank — policy rate, deposits, external accounts, IT export remittances</li>'
    +'<li>PBS — CPI, SPI, trade</li><li>SECP and company filings — accounts, related-party disclosure</li>'
    +'<li>Regulators and associations — OGRA, NEPRA, APCMA, PAMA, NFDC, OCAC</li>'
    +'<li>Broker research and media: useful for what others expect, never as the source of a fact</li></ul>';
}

;

/* ===== assets/views-04-02.js ===== */
async function pullSource(i){
  const src=(state.sources||[])[i];
  if(!src || !src.url){ setStatus("Add an address first"); return; }
  const sec=SECTORS.find(x=>x.id===src.sector) || SECTORS[0];
  $("#pullOut").innerHTML='<p class="thinking">Fetching '+esc(src.url)+'…</p>';
  try{
    const text=await callFetchSource(src.url);
    if(!text.trim()){ $("#pullOut").innerHTML='<p class="thinking">That page returned nothing readable.</p>'; return; }
    $("#pullOut").innerHTML='<p class="thinking">Reading it…</p>';
    const prompt="You extract published figures from a web page for a Pakistani equity research file. "
      +"Reply with only JSON: {\"changes\":[...]}, where each change is "
      +'{\"type\":\"metric\",\"sector\":\"'+sec.id+'\",\"month\":\"YYYY-MM\",\"field\":\"<metricKey>\",\"value\":\"<number>\"}.\n'
      +"Valid metricKeys for this sector: "+JSON.stringify(sec.metrics.map(key))+"\n"
      +"Labels, in the same order: "+JSON.stringify(sec.metrics)+"\n"
      +"Today is "+todayISO()+". Use the month the page says the figure is for, not today's month. "
      +"Only extract figures the page actually states, and only those matching a key above. Never estimate or convert units you are unsure of. "
      +"If none match, reply {\"changes\":[]}.\n\nPage text:\n\"\"\"\n"+text.slice(0,30000)+"\n\"\"\"";
    const res=await callFill(prompt);
    const ch=(res&&Array.isArray(res.changes))?res.changes:[];
    src.lastPull=todayISO(); saveSources();
    if(!ch.length){ $("#pullOut").innerHTML='<p class="thinking">Nothing on that page matched a field for '+esc(sec.short)+'.</p>'; render(); return; }
    pending=ch; renderPreviewInto("#pullOut", ch);
  }catch(e){
    $("#pullOut").innerHTML='<p class="thinking">'+esc(fillError(e))+'</p>';
  }
}

;

/* ===== assets/views-05.js ===== */
function methodHTML(){
  return '<h2 class="section">How to run it</h2>'
    +'<div class="prose"><p>Four layers, kept apart on purpose. Structure changes every few years. The current reading changes quarterly, after results. The dashboard changes monthly, from published data. The log changes when you act.</p>'
    +'<p>Mixing them is what kills a research file: you face a full rewrite every month, so you stop. Kept apart, the monthly update is half an hour.</p></div>'
    +'<h3 class="block">Monthly, about 30 minutes</h3>'
    +'<ul class="tight"><li>Update macro from the release calendar.</li><li>Add one dashboard row per sector from that month\'s published data.</li>'
    +'<li>Update prices on the companies you hold.</li>'
    +'<li>Change a current reading only if a number crossed a falsifier you already wrote down.</li></ul>'
    +'<h3 class="block">Quarterly, after results</h3>'
    +'<ul class="tight"><li>Refresh the company tables and financial history for sectors that reported.</li>'
    +'<li>Rewrite the current readings and re-rank conviction across all nine.</li>'
    +'<li>Re-run fair value where the numbers moved.</li>'
    +'<li>Read back log entries from three to six months ago and mark what you got wrong.</li></ul>'
    +'<h3 class="block">What this is designed against</h3>'
    +'<ul class="tight"><li>Becoming a news scrapbook — nothing enters unless it changes a number or a thesis.</li>'
    +'<li>Growing unreadable — the current reading stays one screen.</li>'
    +'<li>Confirmation drift — the bear case is filled even when you are bullish.</li>'
    +'<li>Unfalsifiable memory — every log entry names what would prove it wrong.</li>'
    +'<li>Silent risk — a position without a stop, target and review date is flagged until it has all three.</li></ul>';
}


function newsMaterialityClass(v){
  const x=String(v||"").toLowerCase();
  return x==="high"?"high":x==="medium"?"medium":"low";
}
function sourceTextForEvent(e){
  const source=String(e.source||"").trim();
  const sourceType=String(e.source_type||"").trim();
  return [source,sourceType].filter(Boolean).join(" · ")||"—";
}
function newsHTML(){
  const events=(initLiveState().events||[]).slice().sort((a,b)=>
    String(b.event_date||b.timestamp_pkt||"").localeCompare(String(a.event_date||a.timestamp_pkt||""))
  );
  const official=events.filter(e=>String(e.source_type||"").toLowerCase()==="official").length;
  const high=events.filter(e=>String(e.materiality||"").toLowerCase()==="high").length;
  const cards=events.map(e=>{
    const mat=String(e.materiality||"").toUpperCase()||"—";
    return '<article class="newsitem">'
      +'<div class="newsmeta"><span>'+fmtDate(e.event_date)+'</span><span>'+esc(e.event_type||e.entity_type||"Event")+'</span>'
      +'<span class="material '+newsMaterialityClass(e.materiality)+'">'+esc(mat)+'</span></div>'
      +'<h3>'+esc(e.headline||"—")+'</h3>'
      +'<p class="newsfact">'+esc(e.fact_summary||e.what_changed||"—")+'</p>'
      +'<div class="newssource">'+esc(sourceTextForEvent(e))+'</div>'
      +(e.required_action?'<div class="newsaction"><b>Research action</b><span>'+esc(e.required_action)+'</span></div>':"")
      +'</article>';
  }).join("");
  return '<div class="pagehero compact"><div><div class="eyebrow">MARKET INTELLIGENCE</div><h2 class="section">News</h2>'
    +'<p class="sub">Chronological PSX, macro, sector and company developments already captured by the research engine. Facts are shown before interpretation.</p></div>'
    +'<div class="factbar"><span class="factpill"><b>'+fmtSmart(events.length)+'</b>Events</span>'
    +'<span class="factpill"><b>'+fmtSmart(official)+'</b>Official-source</span>'
    +'<span class="factpill"><b>'+fmtSmart(high)+'</b>High materiality</span></div></div>'
    +(cards||'<p class="empty">No research events have been ingested yet.</p>');
}

function analysisImpactColumn(title,field,events){
  const rows=events.filter(e=>String(e[field]||"").trim()).slice(0,5);
  return '<div class="analysispanel"><div class="analysislabel">'+esc(title)+'</div>'
    +(rows.length?rows.map(e=>'<div class="impactrow"><strong>'+esc(e.ticker_sector||e.entity_type||"Market")+'</strong><span>'+esc(e[field])+'</span></div>').join("")
      :'<p class="empty">—</p>')+'</div>';
}

function fullDailyDeskResultHTML(live,master,events,macro){
  const companies=(master.companies||[]);
  const sectors=(master.sectors||[]);
  const coverage=(live.coverage||[]);
  const financials=(live.financials||[]);
  const valuations=(live.valuations||[]);
  const covered=coverage.filter(x=>Number(x.financial_rows||0)>0);
  const latestEvents=events.slice(0,6);
  const highEvents=events.filter(e=>String(e.materiality||"").toLowerCase()==="high");
  const verifiedSources=(live.sourceDocuments||[]).filter(x=>String(x.verification_status||"").toUpperCase()==="VERIFIED").length;

  const summaryCards=[
    ["PSX universe",companies.length,"companies"],
    ["Financial coverage",covered.length,companies.length+" companies in universe"],
    ["Financial rows",financials.length,"structured records"],
    ["Research events",events.length,highEvents.length+" high materiality"],
    ["Verified sources",verifiedSources,"source documents"],
    ["Valuation records",valuations.length,valuations.length?"stored models":"not populated yet"]
  ].map(x=>'<div class="deskstat"><span>'+esc(x[0])+'</span><strong>'+fmtSmart(x[1])+'</strong><small>'+esc(x[2])+'</small></div>').join("");

  const macroRows=macro.map(m=>
    '<div class="deskmetric"><span>'+esc(m.indicator||"—")+'</span><strong>'+fmtSmart(m.latest_value)+'</strong>'
      +'<small>'+esc([m.unit,m.period].filter(Boolean).join(" · ")||"—")+'</small></div>'
  ).join("");

  const eventRows=latestEvents.map(e=>
    '<div class="deskfinding"><div class="deskfindingtop"><span class="material '+newsMaterialityClass(e.materiality)+'">'+esc(String(e.materiality||"—").toUpperCase())+'</span>'
      +'<small>'+fmtDate(e.event_date)+' · '+esc(e.ticker_sector||e.entity_type||"Market")+'</small></div>'
      +'<strong>'+esc(e.headline||"—")+'</strong>'
      +'<p>'+esc(e.fact_summary||"—")+'</p>'
      +'<div class="deskimpact"><b>What changed</b><span>'+esc(e.what_changed||"—")+'</span></div>'
      +'<div class="deskimpact"><b>Valuation / risk</b><span>'+esc(e.valuation_impact||e.risk_impact||"—")+'</span></div>'
      +(e.required_action?'<div class="deskaction"><b>Research action</b><span>'+esc(e.required_action)+'</span></div>':"")
    +'</div>'
  ).join("");

  const coveredTickers=covered.slice(0,20).map(x=>cleanTicker(x.ticker)).filter(Boolean);
  const companyRows=coveredTickers.map(t=>{
    const c=companies.find(x=>cleanTicker(x.ticker)===t)||{};
    const dc=coverage.find(x=>cleanTicker(x.ticker)===t)||{};
    return '<tr><td class="pad"><a href="#" data-nav="company" data-id="'+esc(t)+'"><strong>'+esc(t)+'</strong></a></td>'
      +'<td class="pad">'+esc(c.company_name||"—")+'</td>'
      +'<td class="pad">'+esc(c.sector||"—")+'</td>'
      +'<td class="pad num">'+fmtSmart(c.last_price,2)+'</td>'
      +'<td class="pad num">'+fmtSmart(dc.financial_rows)+'</td>'
      +'<td class="pad">'+fmtDate(c.latest_report_period)+'</td>'
      +'<td class="pad">'+verificationBadge(c.profile_verification_status||dc.verification_status||"MISSING")+'</td></tr>';
  }).join("");

  const actions=events.filter(e=>String(e.required_action||"").trim()).slice(0,8);
  const actionRows=actions.map(e=>
    '<div class="queue warn"><strong>'+esc(e.ticker_sector||e.entity_type||"Market")+'</strong>'
      +'<span class="why">'+esc(e.required_action)+'</span><span class="act">'+fmtDate(e.event_date)+'</span></div>'
  ).join("");

  const coverageMessage=valuations.length
    ? 'Stored valuation records are available for this run.'
    : 'No verified valuation records are stored yet. The desk can show prices and available multiples, but it should not produce intrinsic-value conclusions until the valuation engine has verified inputs.';

  return '<section class="analysisresult">'
    +'<div class="resulthead"><div><span class="analysislabel">RUN RESULT</span><h3>Full Daily Desk</h3>'
      +'<p>Database-driven PSX research snapshot generated from the latest records available to the portal.</p></div>'
      +'<div class="runstamp"><span>Completed</span><strong>'+fmtDate(route.analysisRanAt||todayISO())+'</strong></div></div>'
    +'<div class="deskstats">'+summaryCards+'</div>'
    +'<div class="sectionline"><h3 class="block">Market & macro</h3><span>'+fmtSmart(macro.length)+' indicators loaded</span></div>'
    +'<div class="deskmetrics">'+(macroRows||'<div class="resultempty">No verified macro data available.</div>')+'</div>'
    +'<div class="sectionline"><h3 class="block">What changed</h3><span>Latest material research events</span></div>'
    +(eventRows?'<div class="deskfindings">'+eventRows+'</div>':'<div class="resultempty">No research events available for this run.</div>')
    +'<div class="sectionline"><h3 class="block">Companies with financial coverage</h3><span>'+fmtSmart(covered.length)+' of '+fmtSmart(companies.length)+'</span></div>'
    +'<div class="scroll"><table><thead><tr><th>Ticker</th><th>Company</th><th>Sector</th><th class="num">Price</th><th class="num">Financial rows</th><th>Latest report</th><th>Status</th></tr></thead><tbody>'
      +(companyRows||'<tr><td class="pad empty" colspan="7">No company financial coverage available.</td></tr>')+'</tbody></table></div>'
    +'<div class="sectionline"><h3 class="block">Valuation readiness</h3><span>Evidence check</span></div>'
    +'<div class="resultnotice '+(valuations.length?"ready":"limited")+'"><strong>'+(valuations.length?"Valuation data available":"Valuation layer not ready")+'</strong><span>'+esc(coverageMessage)+'</span></div>'
    +'<div class="sectionline"><h3 class="block">What to investigate next</h3><span>Research queue generated from events</span></div>'
    +(actionRows||'<div class="resultempty">No outstanding research actions recorded.</div>')
    +'</section>';
}


function macroRatesResultHTML(live,events,macro){
  const byName=name=>macro.find(m=>String(m.indicator||"").toLowerCase()===String(name||"").toLowerCase())||null;
  const policy=byName("SBP Policy Rate");
  const cpi=byName("CPI Inflation YoY");
  const tbill=byName("12M T-Bill Cut-off Yield");
  const pkr=byName("USD / PKR M2M");
  const sbpRes=byName("SBP FX Reserves");
  const totalRes=byName("Total FX Reserves");
  const kse=byName("KSE-100");
  const policyV=num(policy&&policy.latest_value), cpiV=num(cpi&&cpi.latest_value), tbillV=num(tbill&&tbill.latest_value);
  const realPolicy=policyV!==null&&cpiV!==null?policyV-cpiV:null;
  const realTbill=tbillV!==null&&cpiV!==null?tbillV-cpiV:null;
  const macroEvents=events.filter(e=>String(e.entity_type||"").toLowerCase()==="macro");
  const actions=macroEvents.filter(e=>String(e.required_action||"").trim());

  const keyCards=[
    ["Policy rate",policyV,policy&&policy.unit,policy&&policy.change_value,policy&&policy.release_date],
    ["CPI YoY",cpiV,cpi&&cpi.unit,cpi&&cpi.change_value,cpi&&cpi.release_date],
    ["12M T-bill",tbillV,tbill&&tbill.unit,tbill&&tbill.change_value,tbill&&tbill.release_date],
    ["USD / PKR",num(pkr&&pkr.latest_value),pkr&&pkr.unit,pkr&&pkr.change_value,pkr&&pkr.release_date],
    ["SBP FX reserves",num(sbpRes&&sbpRes.latest_value),sbpRes&&sbpRes.unit,sbpRes&&sbpRes.change_value,sbpRes&&sbpRes.release_date],
    ["KSE-100",num(kse&&kse.latest_value),kse&&kse.unit,kse&&kse.change_value,kse&&kse.release_date]
  ].map(x=>'<div class="macrokpi"><span>'+esc(x[0])+'</span><strong>'+fmtSmart(x[1])+'</strong><small>'+esc(x[2]||"")+'</small><em>'+esc(x[3]||"—")+'</em><b>'+fmtDate(x[4])+'</b></div>').join("");

  const indicatorRows=macro.map(m=>
    '<tr><td class="pad"><strong>'+esc(m.indicator||"—")+'</strong><br><small>'+esc(m.category||"—")+'</small></td>'
      +'<td class="pad num">'+fmtSmart(m.latest_value)+'</td>'
      +'<td class="pad num">'+fmtSmart(m.previous_value)+'</td>'
      +'<td class="pad">'+esc(m.change_value||"—")+'</td>'
      +'<td class="pad">'+esc(m.period||"—")+'</td>'
      +'<td class="pad">'+fmtDate(m.release_date)+'</td>'
      +'<td class="pad"><span class="macrostatus '+esc(String(m.status||"").toLowerCase())+'">'+esc(String(m.status||"—").toUpperCase())+'</span></td>'
      +'<td class="pad">'+(safeHttpsUrl(m.source_url)?'<a href="'+esc(safeHttpsUrl(m.source_url))+'" target="_blank" rel="noreferrer">'+esc(m.source_name||"Source")+'</a>':esc(m.source_name||"—"))+'</td></tr>'
  ).join("");

  const transmissionRows=macro.map(m=>
    '<div class="macrotrans"><div><span>'+esc(m.category||"Macro")+'</span><strong>'+esc(m.indicator||"—")+'</strong></div>'
      +'<p>'+esc(m.investment_relevance||"—")+'</p>'
      +'<small><b>Affected:</b> '+esc(m.affected_sectors||"—")+'</small>'
      +'<small><b>Signal:</b> '+esc(m.threshold_signal||"—")+'</small></div>'
  ).join("");

  const eventRows=macroEvents.map(e=>
    '<article class="newsitem"><div class="newsmeta"><span>'+fmtDate(e.event_date)+'</span><span>'+esc(e.event_type||"Macro")+'</span><span class="material '+newsMaterialityClass(e.materiality)+'">'+esc(String(e.materiality||"—").toUpperCase())+'</span></div>'
      +'<h3>'+esc(e.headline||"—")+'</h3><p class="newsfact">'+esc(e.fact_summary||"—")+'</p>'
      +'<div class="macroimpactgrid"><div><b>What changed</b><span>'+esc(e.what_changed||"—")+'</span></div><div><b>Earnings</b><span>'+esc(e.earnings_impact||"—")+'</span></div><div><b>Valuation</b><span>'+esc(e.valuation_impact||"—")+'</span></div><div><b>Risk</b><span>'+esc(e.risk_impact||"—")+'</span></div></div>'
      +(e.required_action?'<div class="newsaction"><b>Research action</b><span>'+esc(e.required_action)+'</span></div>':"")
      +'<div class="newssource">'+esc(sourceTextForEvent(e))+'</div></article>'
  ).join("");

  const actionRows=actions.map(e=>
    '<div class="queue warn"><strong>'+esc(e.event_type||"Macro")+'</strong><span class="why">'+esc(e.required_action)+'</span><span class="act">'+fmtDate(e.event_date)+'</span></div>'
  ).join("");

  return '<section class="analysisresult">'
    +'<div class="resulthead"><div><span class="analysislabel">RUN RESULT</span><h3>Macro & Rates</h3><p>Latest macro, rates and market-regime inputs currently stored in the research database.</p></div>'
      +'<div class="runstamp"><span>Completed</span><strong>'+fmtDate(route.analysisRanAt||todayISO())+'</strong></div></div>'
    +'<div class="macrokpis">'+keyCards+'</div>'
    +'<div class="sectionline"><h3 class="block">Derived rate context</h3><span>Calculated from stored official inputs</span></div>'
    +'<div class="bank-kpis four">'
      +'<div class="kpi"><div class="k">Policy less CPI</div><div class="v '+(realPolicy===null?"na":realPolicy>=0?"pos":"neg")+'">'+(realPolicy===null?"—":(realPolicy>=0?"+":"")+fmt(realPolicy,2)+"pp")+'</div><div class="meta">Simple nominal spread, not a forward real rate</div></div>'
      +'<div class="kpi"><div class="k">12M T-bill less CPI</div><div class="v '+(realTbill===null?"na":realTbill>=0?"pos":"neg")+'">'+(realTbill===null?"—":(realTbill>=0?"+":"")+fmt(realTbill,2)+"pp")+'</div><div class="meta">Simple nominal spread</div></div>'
      +'<div class="kpi"><div class="k">Policy vs T-bill</div><div class="v">'+(policyV!==null&&tbillV!==null?fmt(tbillV-policyV,2)+"pp":"—")+'</div></div>'
      +'<div class="kpi"><div class="k">Total / SBP reserves</div><div class="v">'+(num(totalRes&&totalRes.latest_value)!==null&&num(sbpRes&&sbpRes.latest_value)!==null?fmt(num(totalRes.latest_value)-num(sbpRes.latest_value),1)+" USDm":"—")+'</div><div class="meta">Calculated difference</div></div>'
    +'</div>'
    +'<div class="sectionline"><h3 class="block">Macro data table</h3><span>'+fmtSmart(macro.length)+' indicators</span></div>'
    +'<div class="scroll"><table><thead><tr><th>Indicator</th><th class="num">Latest</th><th class="num">Previous</th><th>Change</th><th>Period</th><th>Release</th><th>Status</th><th>Source</th></tr></thead><tbody>'
      +(indicatorRows||'<tr><td class="pad empty" colspan="8">No macro indicators available.</td></tr>')+'</tbody></table></div>'
    +'<div class="sectionline"><h3 class="block">Investment transmission</h3><span>How each macro input reaches PSX sectors</span></div>'
    +'<div class="macrotransgrid">'+(transmissionRows||'<div class="resultempty">No transmission notes available.</div>')+'</div>'
    +'<div class="sectionline"><h3 class="block">Latest macro events</h3><span>Facts separated from investment impact</span></div>'
    +(eventRows?'<div class="newsgrid">'+eventRows+'</div>':'<div class="resultempty">No macro research events available.</div>')
    +'<div class="sectionline"><h3 class="block">Research actions</h3><span>What the desk should refresh next</span></div>'
    +(actionRows||'<div class="resultempty">No outstanding macro research actions.</div>')
    +'</section>';
}


function sectorScanResultHTML(live,master,events){
  const sectors=(master.sectors||[]).slice();
  const companies=(master.companies||[]).slice();
  const active=sectors.filter(s=>String(s.regime||"")==="Active coverage");
  const ready=sectors.filter(s=>String(s.regime||"")==="Framework ready");
  const unbuilt=sectors.filter(s=>!String(s.regime||"").trim());
  const withMacro=sectors.filter(s=>String(s.macro_sensitivity||"").trim());
  const withValuation=sectors.filter(s=>String(s.primary_valuation_metric||"").trim());
  const withEarnings=sectors.filter(s=>String(s.earnings_direction||"").trim());
  const withCatalysts=sectors.filter(s=>String(s.catalysts||"").trim());
  const withRisks=sectors.filter(s=>String(s.risks||"").trim());
  const sectorEvents=events.filter(e=>String(e.entity_type||"").toLowerCase()==="sector");
  const companyCount=sectors.reduce((sum,s)=>sum+(num(s.psx_companies)||0),0);

  const stats=[
    ["PSX sectors",sectors.length,"sector master"],
    ["Active coverage",active.length,"research framework active"],
    ["Framework ready",ready.length,"framework built; analysis pending"],
    ["Not populated",unbuilt.length,"research framework required"],
    ["Macro frameworks",withMacro.length,sectors.length+" sectors total"],
    ["Valuation frameworks",withValuation.length,sectors.length+" sectors total"]
  ].map(x=>'<div class="deskstat"><span>'+esc(x[0])+'</span><strong>'+fmtSmart(x[1])+'</strong><small>'+esc(x[2])+'</small></div>').join("");

  const activeCards=active.map(s=>
    '<article class="sectorscancard active">'
      +'<div class="sectorcardtop"><div><span>ACTIVE COVERAGE</span><h4>'+esc(s.sector||"—")+'</h4></div><b>'+fmtSmart(s.psx_companies)+' companies</b></div>'
      +'<dl><dt>Macro sensitivity</dt><dd>'+esc(s.macro_sensitivity||"—")+'</dd>'
      +'<dt>Key KPIs</dt><dd>'+esc(s.key_kpis||"—")+'</dd>'
      +'<dt>Valuation framework</dt><dd>'+esc(s.primary_valuation_metric||"—")+'</dd>'
      +'<dt>Vs T-bill</dt><dd>'+esc(s.opportunity_vs_tbill||"—")+'</dd>'
      +'<dt>Named coverage</dt><dd>'+esc(s.top_names||"—")+'</dd>'
      +'<dt>Earnings direction</dt><dd>'+esc(s.earnings_direction||"—")+'</dd>'
      +'<dt>Catalysts</dt><dd>'+esc(s.catalysts||"—")+'</dd>'
      +'<dt>Risks</dt><dd>'+esc(s.risks||"—")+'</dd></dl></article>'
  ).join("");

  const readyRows=ready.map(s=>
    '<tr><td class="pad"><strong>'+esc(s.sector||"—")+'</strong></td>'
      +'<td class="pad num">'+fmtSmart(s.psx_companies)+'</td>'
      +'<td class="pad">'+esc(s.macro_sensitivity||"—")+'</td>'
      +'<td class="pad">'+esc(s.key_kpis||"—")+'</td>'
      +'<td class="pad">'+esc(s.primary_valuation_metric||"—")+'</td>'
      +'<td class="pad">'+esc(s.opportunity_vs_tbill||"—")+'</td></tr>'
  ).join("");

  const unbuiltRows=unbuilt.map(s=>
    '<tr><td class="pad"><strong>'+esc(s.sector||"—")+'</strong></td><td class="pad num">'+fmtSmart(s.psx_companies)+'</td>'
      +'<td class="pad">'+(String(s.macro_sensitivity||"").trim()?"Available":"—")+'</td>'
      +'<td class="pad">'+(String(s.primary_valuation_metric||"").trim()?"Available":"—")+'</td></tr>'
  ).join("");

  const eventRows=sectorEvents.map(e=>
    '<article class="newsitem"><div class="newsmeta"><span>'+fmtDate(e.event_date)+'</span><span>'+esc(e.ticker_sector||"Sector")+'</span><span class="material '+newsMaterialityClass(e.materiality)+'">'+esc(String(e.materiality||"—").toUpperCase())+'</span></div>'
      +'<h3>'+esc(e.headline||"—")+'</h3><p class="newsfact">'+esc(e.fact_summary||"—")+'</p>'
      +'<div class="macroimpactgrid"><div><b>Earnings</b><span>'+esc(e.earnings_impact||"—")+'</span></div><div><b>Valuation</b><span>'+esc(e.valuation_impact||"—")+'</span></div><div><b>Risk</b><span>'+esc(e.risk_impact||"—")+'</span></div><div><b>What changed</b><span>'+esc(e.what_changed||"—")+'</span></div></div>'
      +(e.required_action?'<div class="newsaction"><b>Research action</b><span>'+esc(e.required_action)+'</span></div>':"")+'</article>'
  ).join("");

  const gapRows=[
    ["Earnings direction",withEarnings.length,sectors.length,"sector earnings trend fields populated"],
    ["Catalysts",withCatalysts.length,sectors.length,"sector catalyst fields populated"],
    ["Risks",withRisks.length,sectors.length,"sector risk fields populated"],
    ["Cross-market comparison",0,sectors.length,"country/peer comparison dataset not yet connected"]
  ].map(x=>'<div class="sectorcoverage"><div><strong>'+esc(x[0])+'</strong><small>'+esc(x[3])+'</small></div><span>'+fmtSmart(x[1])+' / '+fmtSmart(x[2])+'</span><progress max="'+esc(x[2])+'" value="'+esc(x[1])+'"></progress></div>').join("");

  return '<section class="analysisresult">'
    +'<div class="resulthead"><div><span class="analysislabel">RUN RESULT</span><h3>Sector Scan</h3><p>PSX sector research coverage and sector-specific analytical frameworks. This run does not rank sectors where valuation, earnings or risk evidence is incomplete.</p></div>'
      +'<div class="runstamp"><span>Completed</span><strong>'+fmtDate(route.analysisRanAt||todayISO())+'</strong></div></div>'
    +'<div class="deskstats">'+stats+'</div>'
    +'<div class="resultnotice limited"><strong>Coverage discipline</strong><span>The sector master represents '+fmtSmart(companyCount)+' company slots versus '+fmtSmart(companies.length)+' companies in the current company universe. Sector counts and company-universe counts can differ because classification/sync timing is not identical. Missing sector conclusions remain —.</span></div>'
    +'<div class="sectionline"><h3 class="block">Active coverage</h3><span>'+fmtSmart(active.length)+' sector frameworks currently active</span></div>'
    +(activeCards?'<div class="sectorscangrid">'+activeCards+'</div>':'<div class="resultempty">No active sector frameworks available.</div>')
    +'<div class="sectionline"><h3 class="block">Framework ready</h3><span>Structure exists; earnings / catalysts / risks still need research</span></div>'
    +'<div class="scroll"><table><thead><tr><th>Sector</th><th class="num">Companies</th><th>Macro sensitivity</th><th>Key KPIs</th><th>Valuation</th><th>Vs T-bill</th></tr></thead><tbody>'
      +(readyRows||'<tr><td class="pad empty" colspan="6">No framework-ready sectors.</td></tr>')+'</tbody></table></div>'
    +'<div class="sectionline"><h3 class="block">Research completeness</h3><span>Conclusion fields, not framework fields</span></div>'
    +'<div class="sectorcovergrid">'+gapRows+'</div>'
    +'<div class="sectionline"><h3 class="block">Not yet populated</h3><span>'+fmtSmart(unbuilt.length)+' sectors need a research framework</span></div>'
    +'<div class="scroll"><table><thead><tr><th>Sector</th><th class="num">Companies</th><th>Macro framework</th><th>Valuation framework</th></tr></thead><tbody>'
      +(unbuiltRows||'<tr><td class="pad empty" colspan="4">All sectors have frameworks.</td></tr>')+'</tbody></table></div>'
    +'<div class="sectionline"><h3 class="block">Sector events</h3><span>Event-driven sector research</span></div>'
    +(eventRows?'<div class="newsgrid">'+eventRows+'</div>':'<div class="resultempty">No sector-specific research events are stored yet.</div>')
    +'<div class="sectionline"><h3 class="block">Research actions</h3><span>What must be built before sector opportunity ranking</span></div>'
    +'<div class="queue warn"><strong>Sector engine</strong><span class="why">Populate earnings direction, catalysts and risks for the 18 active/framework-ready sectors using verified sector and company evidence.</span><span class="act">Priority</span></div>'
    +'<div class="queue warn"><strong>Coverage expansion</strong><span class="why">Build macro sensitivity, KPI and valuation frameworks for the '+fmtSmart(unbuilt.length)+' currently unpopulated sectors.</span><span class="act">Backlog</span></div>'
    +'<div class="queue"><strong>Cross-country stage</strong><span class="why">Connect comparable-country / peer-market data before using the cross-market stage in sector conclusions.</span><span class="act">Not available</span></div>'
    +'</section>';
}

function analysisHTML(){
  const live=initLiveState();
  const master=initMasterState();
  const mode=route.analysisMode||"full";
  const events=(live.events||[]).slice().sort((a,b)=>
    String(b.event_date||b.timestamp_pkt||"").localeCompare(String(a.event_date||a.timestamp_pkt||""))
  );
  const macro=(live.macro||[]).slice();
  const sectors=(master.sectors||[]).slice();
  const companies=(master.companies||[]).slice();
  const valuations=(live.valuations||[]).slice();
  const latestFacts=events.slice(0,5);
  const actions=events.filter(e=>String(e.required_action||"").trim()).slice(0,8);
  const companyEvents=events.filter(e=>String(e.entity_type||"").toLowerCase()==="company");
  const macroEvents=events.filter(e=>String(e.entity_type||"").toLowerCase()==="macro");
  const modeLabels={full:"Full Daily Desk",macro:"Macro & Rates",sectors:"Sector Scan",companies:"Company Changes",valuation:"Valuation Scan",risk:"Risk & Catalysts"};
  const launchers=[
    ["full","Full Daily Desk","Whole PSX research stack"],
    ["macro","Macro & Rates","Rates, inflation, PKR, liquidity"],
    ["sectors","Sector Scan","Sector regime, catalysts and risks"],
    ["companies","Company Changes","Reports and company-level developments"],
    ["valuation","Valuation Scan","Price, multiples and model coverage"],
    ["risk","Risk & Catalysts","Material risks, catalysts and actions"]
  ].map(x=>'<button class="analysisrun '+(mode===x[0]?"active":"")+'" data-analysis-run="'+x[0]+'"><span>Run</span><strong>'+esc(x[1])+'</strong><small>'+esc(x[2])+'</small></button>').join("");

  const macroCards=macro.slice(0,10).map(m=>
    '<div class="analysisstat"><span>'+esc(m.indicator||"—")+'</span><strong>'+fmtSmart(m.latest_value)+'</strong>'
      +'<small>'+esc([m.unit,m.period].filter(Boolean).join(" · ")||"")+'</small></div>'
  ).join("");

  const factsForMode=(mode==="macro"?macroEvents:mode==="companies"?companyEvents:latestFacts).slice(0,6);
  const factRows=factsForMode.map(e=>
    '<div class="factinterpret"><div><span class="analysislabel">FACT</span><strong>'+esc(e.headline||"—")+'</strong><p>'+esc(e.fact_summary||"—")+'</p>'
      +'<small>'+fmtDate(e.event_date)+' · '+esc(sourceTextForEvent(e))+'</small></div>'
      +'<div><span class="analysislabel">INTERPRETATION</span><p>'+esc(e.what_changed||e.analyst_note||"—")+'</p></div></div>'
  ).join("");

  const sectorRows=sectors.filter(s=>s.sector_view||s.earnings_direction||s.risks||s.catalysts).slice(0,20).map(s=>
    '<tr><td class="pad"><strong>'+esc(s.sector||"—")+'</strong></td>'
      +'<td class="pad">'+esc(s.regime||"—")+'</td>'
      +'<td class="pad">'+esc(s.earnings_direction||"—")+'</td>'
      +'<td class="pad">'+esc(s.sector_view||"—")+'</td>'
      +'<td class="pad">'+esc(s.catalysts||"—")+'</td>'
      +'<td class="pad">'+esc(s.risks||"—")+'</td></tr>'
  ).join("");

  const companyRows=companies.slice().sort((a,b)=>{
    const ad=String(a.latest_report_period||a.last_research_update||"");
    const bd=String(b.latest_report_period||b.last_research_update||"");
    return bd.localeCompare(ad);
  }).slice(0,25).map(c=>
    '<tr><td class="pad"><a href="#" data-nav="company" data-id="'+esc(c.ticker)+'"><strong>'+esc(c.ticker)+'</strong></a></td>'
      +'<td class="pad">'+esc(c.company_name||"—")+'</td><td class="pad">'+esc(c.sector||"—")+'</td>'
      +'<td class="pad num">'+fmtSmart(c.last_price,2)+'</td><td class="pad num">'+(c.pe==null?"—":fmtSmart(c.pe,2)+"x")+'</td>'
      +'<td class="pad">'+fmtDate(c.latest_report_period)+'</td><td class="pad">'+verificationBadge(c.profile_verification_status||"MISSING")+'</td></tr>'
  ).join("");

  const valuationMap={};
  valuations.forEach(v=>{ const t=cleanTicker(v.ticker); if(t&&!valuationMap[t]) valuationMap[t]=v; });
  const valRows=companies.filter(c=>num(c.last_price)!==null||num(c.pe)!==null||valuationMap[cleanTicker(c.ticker)])
    .sort((a,b)=>(num(a.pe)??1e9)-(num(b.pe)??1e9)).slice(0,30).map(c=>{
      const v=valuationMap[cleanTicker(c.ticker)]||{};
      return '<tr><td class="pad"><a href="#" data-nav="company" data-id="'+esc(c.ticker)+'"><strong>'+esc(c.ticker)+'</strong></a></td>'
        +'<td class="pad">'+esc(c.sector||"—")+'</td><td class="pad num">'+fmtSmart(c.last_price,2)+'</td>'
        +'<td class="pad num">'+(c.pe==null?"—":fmtSmart(c.pe,2)+"x")+'</td>'
        +'<td class="pad num">'+(c.pb==null?"—":fmtSmart(c.pb,2)+"x")+'</td>'
        +'<td class="pad num">'+(v.base_value==null?"—":fmtSmart(v.base_value,2))+'</td>'
        +'<td class="pad">'+verificationBadge(v.verification_status||"MISSING")+'</td></tr>';
    }).join("");

  const riskEvents=events.filter(e=>
    String(e.risk_impact||"").trim()||String(e.required_action||"").trim()||String(e.materiality||"").toLowerCase()==="high"
  ).slice(0,12);
  const riskRows=riskEvents.map(e=>
    '<div class="riskcard"><div><span class="material '+newsMaterialityClass(e.materiality)+'">'+esc(String(e.materiality||"—").toUpperCase())+'</span>'
      +'<small>'+fmtDate(e.event_date)+' · '+esc(e.ticker_sector||e.entity_type||"Market")+'</small></div>'
      +'<strong>'+esc(e.headline||"—")+'</strong>'
      +'<p>'+esc(e.risk_impact||e.what_changed||"—")+'</p>'
      +(e.required_action?'<em>'+esc(e.required_action)+'</em>':"")+'</div>'
  ).join("");

  const fullMacro = '<div class="sectionline"><h3 class="block">Market & macro snapshot</h3><span>Latest verified database inputs</span></div>'
    +'<div class="analysisstats">'+(macroCards||'<p class="empty">No macro data available.</p>')+'</div>';

  const fullFacts = '<div class="sectionline"><h3 class="block">Facts vs interpretation</h3><span>Latest material developments</span></div>'
    +(factRows||'<p class="empty">No research events available.</p>');

  const transmission = '<div class="sectionline"><h3 class="block">Investment transmission</h3><span>How new facts reach the model</span></div>'
    +'<div class="analysisgrid">'
      +analysisImpactColumn("Earnings impact","earnings_impact",events)
      +analysisImpactColumn("Valuation impact","valuation_impact",events)
      +analysisImpactColumn("Risk impact","risk_impact",events)
    +'</div>';

  const sectorDesk = '<div class="sectionline"><h3 class="block">Sector desk</h3><span>Current research framework</span></div>'
    +'<div class="scroll"><table><thead><tr><th>Sector</th><th>Regime</th><th>Earnings</th><th>Current view</th><th>Catalysts</th><th>Risks</th></tr></thead><tbody>'
      +(sectorRows||'<tr><td class="pad empty" colspan="6">Sector analysis has not been populated yet.</td></tr>')+'</tbody></table></div>';

  const companyDesk = '<div class="sectionline"><h3 class="block">Company changes</h3><span>Recently reported / updated companies</span></div>'
    +'<div class="scroll"><table><thead><tr><th>Ticker</th><th>Company</th><th>Sector</th><th class="num">Price</th><th class="num">P/E</th><th>Latest report</th><th>Profile</th></tr></thead><tbody>'
      +(companyRows||'<tr><td class="pad empty" colspan="7">No company records available.</td></tr>')+'</tbody></table></div>';

  const valuationDesk = '<div class="sectionline"><h3 class="block">Valuation scan</h3><span>Available inputs only</span></div>'
    +'<div class="noticebox"><strong>Coverage rule</strong><span>Missing P/B, intrinsic value or verification remains —. A low P/E is not treated as a buy signal.</span></div>'
    +'<div class="scroll"><table><thead><tr><th>Ticker</th><th>Sector</th><th class="num">Price</th><th class="num">P/E</th><th class="num">P/B</th><th class="num">Base value</th><th>Verification</th></tr></thead><tbody>'
      +(valRows||'<tr><td class="pad empty" colspan="7">No valuation inputs available.</td></tr>')+'</tbody></table></div>';

  const riskDesk = '<div class="sectionline"><h3 class="block">Risk & catalyst scan</h3><span>Material events and required research</span></div>'
    +(riskRows?'<div class="riskgrid">'+riskRows+'</div>':'<p class="empty">No risk events recorded.</p>');

  const actionDesk = '<div class="sectionline"><h3 class="block">What to investigate next</h3><span>Research actions, not trading instructions</span></div>'
    +(actions.length?actions.map(e=>'<div class="queue warn"><strong>'+esc(e.ticker_sector||e.entity_type||"Market")+'</strong><span class="why">'+esc(e.required_action)+'</span><span class="act">'+fmtDate(e.event_date)+'</span></div>').join("")
      :'<p class="empty">No outstanding research actions recorded.</p>');

  let body="";
  if(mode==="macro") body=fullMacro+fullFacts+transmission+actionDesk;
  else if(mode==="sectors") body=sectorDesk+transmission+riskDesk+actionDesk;
  else if(mode==="companies") body=companyDesk+fullFacts+actionDesk;
  else if(mode==="valuation") body=valuationDesk+transmission+actionDesk;
  else if(mode==="risk") body=riskDesk+fullFacts+actionDesk;
  else body=fullMacro+fullFacts+transmission+sectorDesk+companyDesk+valuationDesk+riskDesk+actionDesk;

  const runState = route.analysisRunning
    ? '<div class="resultempty loading"><strong>Running '+esc(modeLabels[mode]||modeLabels.full)+'…</strong><span>Refreshing the latest database records.</span></div>'
    : route.analysisError
      ? '<div class="resultempty error"><strong>Run failed</strong><span>'+esc(route.analysisError)+'</span></div>'
      : !route.analysisRan
        ? '<div class="resultempty prompt"><strong>Choose an analysis above and press Run.</strong><span>The result will appear here after the latest database records are refreshed.</span></div>'
        : mode==="full"
          ? fullDailyDeskResultHTML(live,master,events,macro)
          : mode==="macro"
            ? macroRatesResultHTML(live,events,macro)
            : mode==="sectors"
              ? sectorScanResultHTML(live,master,events)
              : body;

  return '<div class="pagehero compact"><div><div class="eyebrow">INSTITUTIONAL DESK</div><h2 class="section">Analysis</h2>'
    +'<p class="sub">Run a focused PSX analysis against the latest research database. Facts and interpretation stay separate.</p></div>'
    +'<div class="analysisrunmeta"><span>Current run</span><strong>'+esc(modeLabels[mode]||modeLabels.full)+'</strong><small>'+(route.analysisRanAt?fmtDate(route.analysisRanAt):"Not run")+'</small></div></div>'
    +'<div class="analysislauncher">'+launchers+'</div>'
    +runState;
}

;
/* ===== assets/views-master.js ===== */
function masterDataHTML(){
  const m=initMasterState();
  const sectorRows=(m.sectors||[]).map(s=>'<tr>'
    +'<td class="pad"><strong>'+esc(s.sector||"—")+'</strong></td>'
    +'<td class="pad">'+esc(s.regime||"—")+'</td>'
    +'<td class="pad">'+esc(s.primary_valuation_metric||"—")+'</td>'
    +'<td class="pad">'+esc(s.sector_view||"—")+'</td>'
    +'</tr>').join("");

  const companyRows=(m.companies||[]).slice(0,500).map(c=>'<tr>'
    +'<td class="pad"><a href="#" data-nav="company" data-id="'+esc(c.ticker)+'"><strong>'+esc(c.ticker)+'</strong></a></td>'
    +'<td class="pad">'+esc(c.company_name||"—")+'</td>'
    +'<td class="pad">'+esc(c.sector||"—")+'</td>'
    +'<td class="pad">'+esc(c.coverage_status||"—")+'</td>'
    +'<td class="pad">'+esc(c.universe_source||"—")+'</td>'
    +'</tr>').join("");

  const sourceRows=(m.sources||[]).map(s=>'<tr>'
    +'<td class="pad"><strong>'+esc(s.source_name||"—")+'</strong></td>'
    +'<td class="pad">'+esc(s.category||"—")+'</td>'
    +'<td class="pad">'+esc(s.official_secondary||"—")+'</td>'
    +'<td class="pad">'+esc(s.frequency||"—")+'</td>'
    +'<td class="pad">'+(safeHttpsUrl(s.url)?'<a href="'+esc(safeHttpsUrl(s.url))+'" target="_blank" rel="noreferrer">open</a>':"—")+'</td>'
    +'</tr>').join("");

  return '<h2 class="section">Master data</h2>'
    +'<p class="sub">Live read-only view of the structured Supabase research database. Missing fields remain — rather than being filled with guesses.</p>'
    +(m.error?'<div class="banner">'+esc(m.error)+'</div>':"")
    +'<div class="kpis">'
      +'<div class="kpi"><div class="k">Sectors</div><div class="v">'+(m.sectors||[]).length+'</div></div>'
      +'<div class="kpi"><div class="k">Companies</div><div class="v">'+(m.companies||[]).length+'</div></div>'
      +'<div class="kpi"><div class="k">Sources</div><div class="v">'+(m.sources||[]).length+'</div></div>'
      +'<div class="kpi"><div class="k">Connection</div><div class="v">'+(m.loaded?"Live":"—")+'</div></div>'
    +'</div>'
    +'<h3 class="block">PSX sectors</h3>'
    +'<div class="scroll"><table><thead><tr><th>Sector</th><th>Regime</th><th>Primary valuation</th><th>View</th></tr></thead><tbody>'
      +(sectorRows||'<tr><td class="pad empty" colspan="4">No sector data available.</td></tr>')
    +'</tbody></table></div>'
    +'<h3 class="block">Company universe</h3>'
    +'<div class="scroll"><table><thead><tr><th>Ticker</th><th>Company</th><th>Sector</th><th>Coverage</th><th>Universe source</th></tr></thead><tbody>'
      +(companyRows||'<tr><td class="pad empty" colspan="5">No company data available.</td></tr>')
    +'</tbody></table></div>'
    +'<h3 class="block">Research sources</h3>'
    +'<div class="scroll"><table><thead><tr><th>Source</th><th>Category</th><th>Class</th><th>Frequency</th><th>URL</th></tr></thead><tbody>'
      +(sourceRows||'<tr><td class="pad empty" colspan="5">No source data available.</td></tr>')
    +'</tbody></table></div>';
}

;
