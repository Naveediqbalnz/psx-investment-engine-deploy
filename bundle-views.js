/* ===== assets/views-01.js ===== */
/* ===================== views ===================== */
function render(){
  const v=$("#view"), r=route.view;
  v.innerHTML = r==="dash"?dashHTML(): r==="macro"?macroHTML():
    r==="sector"?sectorHTML(SECTORS.find(s=>s.id===route.id)):
    r==="companies"?companiesHTML(): r==="masters"?masterDataHTML(): r==="company"?companyHTML(route.ticker):
    r==="valuation"?valuationHTML(): r==="portfolio"?portfolioHTML():
    r==="events"?eventsHTML(): r==="queue"?queueHTML():
    r==="log"?logHTML(): r==="sources"?sourcesHTML(): methodHTML();
  bind();
}

function dashHTML(){
  const m=state.macro;
  const kpis = [["kse","KSE-100"],["rate","Policy rate %"],["cpi","CPI YoY %"],["pkr","PKR/USD"]]
    .map(f=>'<div class="kpi"><div class="k">'+esc(f[1])+'</div><div class="v'+(m[f[0]]?"":" na")+'">'
      +esc(m[f[0]]||"Not recorded")+'</div></div>').join("");
  const strip = SECTORS.map(s=>{
    const d=daysSince(state.sectors[s.id].updatedAt);
    return '<button data-nav="sector" data-id="'+s.id+'" class="'+ageClass(d)+'"><span class="nm">'+esc(s.short)+'</span>'
      +'<span class="days">'+(d===null?"—":d)+'<span class="unit">'+(d===null?"never opened":"days old")+'</span></span></button>';
  }).join("");
  const rank = SECTORS.map(s=>{
    const st=state.sectors[s.id], d=daysSince(st.updatedAt);
    const mark = st.rating==="Overweight"?"▲":st.rating==="Underweight"?"▼":st.rating==="Neutral"?"■":"·";
    return "<tr><td class='pad'><a href='#' data-nav='sector' data-id='"+s.id+"'>"+esc(s.name)+"</a></td>"
      +"<td class='pad'><span class='rating'><span class='mark'>"+mark+"</span>"+esc(st.rating||"unrated")+"</span></td>"
      +"<td class='pad num'>"+esc(st.conviction||"—")+"</td><td class='pad num'>"+(st.valPct?esc(st.valPct)+"%":"—")+"</td>"
      +"<td class='pad'>"+esc(st.cycle||"—")+"</td><td class='pad num'>"+(d===null?"—":d+"d")+"</td></tr>";
  }).join("");
  const p = positionRows();
  const q = researchQueue().slice(0,5);
  return '<h2 class="section">Pakistan equity dashboard</h2>'
    +'<p class="sub">Core market, macro and company data are loaded from the live Supabase research database. Personal thesis and valuation notes remain separate; missing values stay blank rather than being invented.</p>'
    +'<div class="kpis">'+kpis+'</div>'
    +'<h3 class="block">Sector freshness</h3><div class="strip">'+strip+'</div>'
    +'<p class="legend">Green under 35 days. Amber past 35. Solid amber past 75 — the file has stopped describing the present.</p>'
    +'<h3 class="block">Cross-sector ranking</h3>'
    +'<div class="scroll"><table><thead><tr><th>Sector</th><th>Rating</th><th class="num">Conviction</th><th class="num">Val %ile</th><th>Earnings regime</th><th class="num">Updated</th></tr></thead><tbody>'+rank+'</tbody></table></div>'
    +'<h3 class="block">Portfolio</h3>'
    +'<div class="kpis"><div class="kpi"><div class="k">Positions</div><div class="v">'+p.rows.length+'</div></div>'
    +'<div class="kpi"><div class="k">Invested Rs</div><div class="v">'+fmt(p.invested,0)+'</div></div>'
    +'<div class="kpi"><div class="k">Cash Rs</div><div class="v">'+fmt(p.cash,0)+'</div></div>'
    +'<div class="kpi"><div class="k">Total Rs</div><div class="v">'+fmt(p.total,0)+'</div></div></div>'
    +'<h3 class="block">What needs attention</h3>'
    +(q.length? q.map(x=>'<div class="queue '+x.sev+'"><strong>'+esc(x.what)+'</strong><span class="why">'+esc(x.why)+'</span><span class="act">'+esc(x.act)+'</span></div>').join("")
      : '<p class="empty">Nothing overdue.</p>');
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
      +"<td class='pad'>"+esc(c.coverage||"—")+"</td><td class='pad num'>"+esc(c.price||"—")+"</td>"
      +"<td class='pad'>"+esc((c.thesis||"").slice(0,70)||"—")+"</td><td class='pad num'>"+(d===null?"—":d+"d")+"</td></tr>";
  }).join("");
  return '<h2 class="section">Company research</h2>'
    +'<p class="sub">Live PSX company universe from Supabase. Identity, price and structured financial history come from the database; your valuation and judgement notes remain personal overlays.</p>'
    +'<p><button class="btn primary" data-nav="masters">View master data</button></p>'
    +'<div class="scroll"><table><thead><tr><th>Ticker</th><th>Name</th><th>Sector</th><th>Coverage</th><th class="num">Price</th><th>Thesis</th><th class="num">Updated</th></tr></thead><tbody>'
    +(rows||'<tr><td class="pad empty" colspan="7">No company data available.</td></tr>')+'</tbody></table></div>';
}

;
/* ===== assets/views-02-02.js ===== */
function companyHTML(t){
  const c=state.companies[t]||ensureCompanyDetailFromMaster(t);
  if(!c) return '<h2 class="section">Not found</h2><p class="sub">That company is not in the live company universe. <a href="#" data-nav="companies">Back to the list</a>.</p>';

  const price=num(c.price), base=num(c.base), bear=num(c.bear), bull=num(c.bull);
  const upside=(price&&base!==null)?((base-price)/price)*100:null;
  const mos=(base&&price!==null)?((base-price)/base)*100:null;
  const master=masterCompanyByTicker(t);
  const masterSector=master ? (master.sector||"—") : (c.sectorName||secName(c.sector));

  const rows=(c.fy||[]).map(r=>{
    const src=safeHttpsUrl(r.source_url)
      ? '<a href="'+esc(safeHttpsUrl(r.source_url))+'" target="_blank" rel="noreferrer">'+esc(r.source_name||"source")+'</a>'
      : esc(r.source_name||"—");
    return '<tr>'
      +'<td class="pad num">'+esc(r.year||"—")+'</td>'
      +'<td class="pad num">'+esc(r.rev||"—")+'</td>'
      +'<td class="pad num">'+esc(r.pat||"—")+'</td>'
      +'<td class="pad num">'+esc(r.eps||"—")+'</td>'
      +'<td class="pad num">'+esc(r.roe||"—")+'</td>'
      +'<td class="pad num">'+esc(r.dps||"—")+'</td>'
      +'<td class="pad num">'+esc(r.de||"—")+'</td>'
      +'<td class="pad">'+src+'</td></tr>';
  }).join("");

  return '<p class="meta"><a href="#" data-nav="companies">Companies</a> / '+esc(masterSector)+'</p>'
    +'<h2 class="section">'+esc(c.ticker)+' — '+esc(c.name||"")+'</h2>'
    +'<div class="inline" style="margin:14px 0 18px">'
      +'<div class="field"><label>Coverage</label><input type="text" value="'+esc(c.coverage||"—")+'" disabled></div>'
      +'<div class="field"><label>Master sector</label><input type="text" value="'+esc(masterSector)+'" disabled></div>'
      +'<div class="field"><label>Price Rs</label><input type="text" value="'+esc(c.price||"")+'" disabled></div>'
      +'<div class="field"><label>Shares mn</label><input type="text" value="'+esc(c.shares||"")+'" disabled></div>'
    +'</div>'
    +'<h3 class="block">Financial history</h3>'
    +'<p class="hint">Live structured financial data. Missing values display as — and are not estimated.</p>'
    +'<div class="scroll"><table><thead><tr><th class="num">Year</th><th class="num">Revenue</th><th class="num">PAT</th><th class="num">EPS</th><th class="num">ROE %</th><th class="num">Dividends</th><th class="num">Debt/Equity</th><th>Source</th></tr></thead><tbody>'
      +(rows||'<tr><td class="pad empty" colspan="8">No structured financial history available for this company yet.</td></tr>')
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
    +'<div class="lmeta">'+esc(e.date||"")+' · conviction '+esc(e.confidence||"—")+'</div>'
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
