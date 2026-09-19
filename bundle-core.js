/* ===== assets/app-01a.js ===== */
"use strict";

/* ===================== templates ===================== */
const SECTORS = [
  { id:"banks", name:"Commercial Banks", short:"Banks",
    swing:"Policy rate level and direction; deposit mix",
    cadence:"SBP monetary policy (26 Oct, 14 Dec), monthly SBP deposits and advances, results late Feb / Apr / Aug / Oct.",
    valuation:"P/B against sustainable ROE",
    metrics:["Policy rate %","Deposits YoY %","NIM %","Cost of risk bps","ADR %"],
    cols:["P/B","ROE %","CASA %","NIM %","Cost/income %"] },
  { id:"ep", name:"Oil & Gas Exploration", short:"E&P",
    swing:"Brent, PKR, and the circular-debt receivable",
    cadence:"Brent daily, SBP external accounts monthly, production notices, quarterly results.",
    valuation:"EV/boe and P/E against reserve life",
    metrics:["Brent $/bbl","PKR/USD","Receivables Rs bn","Production boepd","Wells spudded"],
    cols:["EV/boe","Reserve life yrs","Receivable days","P/E","Div yield %"] },
  { id:"fert", name:"Fertilizer", short:"Fertilizer",
    swing:"Urea offtake, feed gas price, subsidy policy",
    cadence:"NFDC monthly offtake, OGRA gas notifications, June budget, quarterly results.",
    valuation:"Dividend yield and payout sustainability",
    metrics:["Urea offtake 000t","Urea inventory 000t","Feed gas Rs/mmbtu","Retention Rs/bag","DAP offtake 000t"],
    cols:["P/E","Div yield %","Payout %","Urea share %","EV/EBITDA"] },
  { id:"cement", name:"Cement", short:"Cement",
    swing:"Local dispatches, retention price, coal cost",
    cadence:"APCMA dispatches around the 5th, coal index weekly, PSDP releases, quarterly results.",
    valuation:"EV/tonne against replacement cost",
    metrics:["Local dispatch mn t","Exports mn t","Retention Rs/bag","Coal $/t","Utilisation %"],
    cols:["EV/tonne $","EV/EBITDA","Net debt/EBITDA","Capacity mn t","EBITDA margin %"] },
  { id:"power", name:"Power Generation & Distribution", short:"Power",
    swing:"Circular debt and CPPA collection, not demand",
    cadence:"NEPRA generation and tariff notices, monthly circular-debt updates, quarterly results.",
    valuation:"Dividend yield against receivable risk",
    metrics:["Circular debt Rs bn","Generation GWh","Receivable days","CPPA payments Rs bn","T&D losses %"],
    cols:["P/E","Div yield %","Receivable days","Capacity MW","Payout %"] },
  { id:"oil", name:"OMC & Refinery", short:"OMC / Refinery",
    swing:"Fuel offtake, inventory gains, refinery policy",
    cadence:"OCAC monthly offtake, OGRA fortnightly price notifications, Brent, quarterly results.",
    valuation:"EV/EBITDA stripped of inventory gains",
    metrics:["Total offtake 000t","MS offtake 000t","HSD offtake 000t","Brent $/bbl","Refining margin $/bbl"],
    cols:["P/E","EV/EBITDA","Inventory P&L Rs bn","Market share %","Net debt/EBITDA"] },
  { id:"tech", name:"Technology & Communication", short:"Technology",
    swing:"Dollar revenue growth and the rupee",
    cadence:"SBP monthly IT export remittances, PKR daily, quarterly results.",
    valuation:"EV/Sales on dollar revenue",
    metrics:["IT exports $mn","PKR/USD","Revenue growth %","Headcount","EBITDA margin %"],
    cols:["EV/Sales","P/E","USD rev share %","Rev growth %","EBITDA margin %"] },
  { id:"auto", name:"Automobile Assemblers", short:"Autos",
    swing:"Unit volumes, financing cost, and the rupee on CKD kits",
    cadence:"PAMA monthly sales around the 10th, SBP consumer financing data, quarterly results.",
    valuation:"P/E on mid-cycle volumes, not peak",
    metrics:["Units sold","Tractor units","PKR/USD","Financing rate %","Localisation %"],
    cols:["P/E","Div yield %","Units capacity","EBITDA margin %","Net cash Rs bn"] },
  { id:"foods", name:"Foods & Personal Care", short:"Foods",
    swing:"Volume growth against input cost, and pricing power",
    cadence:"PBS SPI weekly, commodity prices, quarterly results.",
    valuation:"P/E against volume growth and margin durability",
    metrics:["Volume growth %","Input cost index","Gross margin %","SPI YoY %","Price increase %"],
    cols:["P/E","EV/EBITDA","Gross margin %","Rev growth %","Div yield %"] }
];

const STRUCTURE_FIELDS = [
  ["demand","Demand driver","The one physical volume that moves revenue."],
  ["price","Price mechanism","Regulated, import-parity, or free? Who sets it?"],
  ["cost","Cost structure","The input that decides the margin."],
  ["reg","Regulatory overhang","Tariff, tax, subsidy, circular debt, licensing."],
  ["capacity","Capacity and cycle position","Utilisation now versus expansion under way."],
  ["compete","Competitive structure","Concentration, pricing discipline, share shifts."],
  ["band","Valuation band","The 5–10 year range of the right multiple."],
  ["sources","Sources","Where each number above comes from."]
];
const READING_FIELDS = [
  ["thesis","One-line thesis","What you believe about this sector right now."],
  ["swingNow","Swing variable, latest read","The number that matters, and which way it is moving."],
  ["bull","Bull case",""],
  ["bear","Bear case","Keep this filled even when you are bullish."],
  ["falsifier","What would change my mind","Specific enough to be checked later."]
];
const PERF_FIELDS = [
  ["r1m","1M vs KSE-100 %"],["r3m","3M vs KSE-100 %"],["r12m","12M vs KSE-100 %"],
  ["secPe","Sector P/E x"],["secPb","Sector P/B x"],["secDy","Sector div yield %"]
];
const MACRO_FIELDS = [
  ["kse","KSE-100"],["pe","Market P/E x"],["rate","SBP policy rate %"],["cpi","CPI YoY %"],
  ["tbill","12M T-bill %"],["pkr","PKR/USD"],["reserves","SBP reserves $bn"],
  ["ca","Current account $mn"],["mpc","Next MPC date"]
];
const REGIMES = [
  ["growth","Growth"],["infl","Inflation"],["rates","Rates"],
  ["pkrReg","PKR"],["liq","Liquidity"],["valReg","Valuation"]
];
const REGIME_OPTS = ["","Expanding","Stable","Deteriorating","Not available"];
const CYCLE_OPTS = ["","Expansion","Peak","Normalisation","Contraction","Recovery"];
const COVERAGE_OPTS = ["","Not started","Building baseline","Covered","Stale"];
const BUCKETS = ["Core","Tactical","Legacy"];
const FY_COLS = [["year","Year"],["rev","Revenue Rs mn"],["pat","PAT Rs mn"],["eps","EPS Rs"],
  ["roe","ROE %"],["dps","DPS Rs"],["de","Net debt/Equity"]];

;
/* ===== assets/app-01b.js ===== */
/* ===================== state ===================== */
let sb=null, session=null, dirtyPaths={};
let state = { macro:{}, sectors:{}, companies:{}, portfolio:{positions:[],cash:"",capPosition:"10",capSector:"25"},
              events:[], sources:[], log:[] };
let route = { workspace:"investing", view:"dash", id:null, tab:"reading", ticker:null, companyTab:"overview", analysisMode:"full", analysisRan:false, analysisRunning:false, analysisRanAt:null, analysisError:null, tradeChartMode:"price", tradeRange:"1M", tradeTicker:"MEBL" };
let typing = false;
SECTORS.forEach(s=> state.sectors[s.id] = { rows:[], companies:[] });

/* ===================== helpers ===================== */
const $ = s => document.querySelector(s);
const esc = s => String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const key = s => s.toLowerCase().replace(/[^a-z0-9]+/g,"_");
const num = v => { const n = parseFloat(String(v==null?"":v).replace(/[, ]/g,"")); return isFinite(n)?n:null; };
const fmt = (n,d=0) => {
  const x=num(n);
  return x===null?"—":x.toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d});
};
const fmtSmart = (v,maxDecimals=4) => {
  if(v===null||v===undefined||String(v).trim()==="") return "—";
  const raw=String(v).trim().replace(/,/g,"");
  if(!/^-?\d+(?:\.\d+)?$/.test(raw)) return esc(v);
  const x=Number(raw);
  if(!Number.isFinite(x)) return esc(v);
  const decimals=raw.includes(".")?Math.min(raw.split(".")[1].length,maxDecimals):0;
  return x.toLocaleString("en-US",{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
};
const pct = n => n===null?"—":(n>0?"+":"")+n.toFixed(1)+"%";
const directionClass = v => { const x=num(v); return x===null||x===0?"":x>0?"pos":"neg"; };
const daysSince = ts => ts? Math.floor((Date.now()-ts)/86400000):null;
const ageClass = d => d===null?"":d<=35?"fresh":d<=75?"aging":"stale";
const todayISO = () => new Date().toISOString().slice(0,10);
const fmtDate = v => {
  if(v===null||v===undefined||String(v).trim()==="") return "—";
  const s=String(v).trim();
  const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sept","Oct","Nov","Dec"];
  let y,m,d;
  const iso=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(iso){ y=Number(iso[1]); m=Number(iso[2]); d=Number(iso[3]); }
  else{
    const dt=new Date(s);
    if(Number.isNaN(dt.getTime())) return esc(s);
    y=dt.getFullYear(); m=dt.getMonth()+1; d=dt.getDate();
  }
  if(!y||m<1||m>12||d<1||d>31) return esc(s);
  return d+" "+months[m-1]+" "+String(y).slice(-2);
};
const setStatus = (t,c) => { const e=$("#status"); e.textContent=t; e.className="status "+(c||""); };
const secName = id => (SECTORS.find(s=>s.id===id)||{}).short || id || "—";
const opts = (list,val) => list.map(o=>'<option value="'+esc(o)+'"'+(val===o?" selected":"")+">"+esc(o||"—")+"</option>").join("");

;
/* ===== assets/master-data.js ===== */
/* ===================== live master data ===================== */
const LEGACY_SECTOR_MAP = {
  "COMMERCIAL BANKS":"banks",
  "OIL & GAS EXPLORATION COMPANIES":"ep",
  "FERTILIZER":"fert",
  "CEMENT":"cement",
  "POWER GENERATION & DISTRIBUTION":"power",
  "OIL & GAS MARKETING COMPANIES":"oil",
  "REFINERY":"oil",
  "TECHNOLOGY & COMMUNICATION":"tech",
  "AUTOMOBILE ASSEMBLER":"auto",
  "FOOD & PERSONAL CARE PRODUCTS":"foods"
};

function initMasterState(){
  if(!state.master){
    state.master={sectors:[],companies:[],sources:[],loaded:false,error:null};
  }
  return state.master;
}
function safeHttpsUrl(value){
  const v=String(value||"").trim();
  if(!v) return "";
  try{
    const u=new URL(v);
    return u.protocol==="https:" ? u.toString() : "";
  }catch(e){ return ""; }
}
function cleanTicker(value){
  return String(value||"").trim().toUpperCase().replace(/[^A-Z0-9.-]+/g,"");
}
function legacySectorIdForName(name){
  return LEGACY_SECTOR_MAP[String(name||"").trim().toUpperCase()]||"";
}
async function loadMasterData(){
  const master=initMasterState();
  if(!sb) return master;
  master.error=null;

  const [sectors,companies,sources]=await Promise.all([
    sb.from("sectors").select("*").order("sector",{ascending:true}),
    sb.from("companies").select("*").order("ticker",{ascending:true}),
    sb.from("sources").select("*").order("source_name",{ascending:true})
  ]);

  const errors=[sectors.error,companies.error,sources.error].filter(Boolean);
  if(errors.length){
    master.loaded=false;
    master.error=errors.map(e=>e.message).join(" | ");
    return master;
  }

  master.sectors=sectors.data||[];
  master.companies=companies.data||[];
  master.sources=sources.data||[];
  master.loaded=true;
  return master;
}
function masterCompanyByTicker(ticker){
  const t=cleanTicker(ticker);
  return initMasterState().companies.find(c=>cleanTicker(c.ticker)===t)||null;
}
function masterSectorByName(name){
  const n=String(name||"").trim().toUpperCase();
  return initMasterState().sectors.find(s=>String(s.sector||"").trim().toUpperCase()===n)||null;
}
function masterSectorName(name){ return name||"—"; }

function companyDisplayRecords(){
  const byTicker={};
  Object.values(state.companies||{}).forEach(c=>{
    const t=cleanTicker(c.ticker);
    if(t) byTicker[t]=Object.assign({},c,{ticker:t});
  });
  initMasterState().companies.forEach(m=>{
    const t=cleanTicker(m.ticker);
    if(!t) return;
    const existing=byTicker[t]||{};
    byTicker[t]=Object.assign({},{
      ticker:t,
      name:m.company_name||"",
      sectorName:m.sector||"",
      sector:legacySectorIdForName(m.sector),
      coverage:m.coverage_status||"Not started",
      price:m.last_price==null?"":String(m.last_price),
      shares:m.shares_m==null?"":String(m.shares_m),
      thesis:m.investment_thesis||"",
      risks:m.key_risk||"",
      catalyst:m.next_catalyst||"",
      universeSource:m.universe_source||"",
      updatedAt:m.last_research_update ? Date.parse(m.last_research_update) : (m.updated_at?Date.parse(m.updated_at):null),
      master:true
    },existing,{
      ticker:t,
      name:m.company_name||existing.name||"",
      sectorName:m.sector||existing.sectorName||"",
      sector:legacySectorIdForName(m.sector)||existing.sector||"",
      price:m.last_price==null?(existing.price||""):String(m.last_price),
      shares:m.shares_m==null?(existing.shares||""):String(m.shares_m)
    });
  });
  return Object.values(byTicker).sort((a,b)=>a.ticker.localeCompare(b.ticker));
}
function ensureCompanyDetailFromMaster(ticker){
  const t=cleanTicker(ticker);
  if(!t) return null;
  const m=masterCompanyByTicker(t);
  const existing=state.companies[t]||{};
  if(!m){
    if(Object.keys(existing).length) return existing;
    return null;
  }
  state.companies[t]=Object.assign({},{
    ticker:t,
    name:m.company_name||"",
    sectorName:m.sector||"",
    sector:legacySectorIdForName(m.sector),
    coverage:m.coverage_status||"Not started",
    price:m.last_price==null?"":String(m.last_price),
    shares:m.shares_m==null?"":String(m.shares_m),
    thesis:m.investment_thesis||"",
    risks:m.key_risk||"",
    catalyst:m.next_catalyst||"",
    fy:[]
  },existing,{
    ticker:t,
    name:m.company_name||existing.name||"",
    sectorName:m.sector||existing.sectorName||"",
    sector:legacySectorIdForName(m.sector)||existing.sector||"",
    price:m.last_price==null?(existing.price||""):String(m.last_price),
    shares:m.shares_m==null?(existing.shares||""):String(m.shares_m)
  });
  return state.companies[t];
}
function bindMasterData(){}

;
/* ===== assets/live-data.js ===== */
/* ===================== live Supabase research adapter ===================== */
function initLiveState(){
  if(!state.live){
    state.live={macro:[],financials:[],ratios:[],bankMetrics:[],valuationScenarios:[],prices:[],valuations:[],portfolio:[],events:[],queue:[],sourceDocuments:[],coverage:[],errors:[]};
  }
  state.live.bankMetrics=state.live.bankMetrics||[];
  state.live.valuationScenarios=state.live.valuationScenarios||[];
  return state.live;
}
async function liveRead(table, select="*", orderColumn=null, ascending=true){
  let q=sb.from(table).select(select);
  if(orderColumn) q=q.order(orderColumn,{ascending});
  const {data,error}=await q;
  if(error){
    initLiveState().errors.push(table+": "+error.message);
    return [];
  }
  return data||[];
}
function sourceDocumentById(id){
  if(id==null) return null;
  return initLiveState().sourceDocuments.find(x=>String(x.id)===String(id))||null;
}
function companyCoverageByTicker(ticker){
  const t=cleanTicker(ticker);
  return initLiveState().coverage.find(x=>cleanTicker(x.ticker)===t)||null;
}
function findMacro(indicator){
  return initLiveState().macro.find(x=>String(x.indicator||"").toLowerCase()===String(indicator||"").toLowerCase())||null;
}
function liveSector(name){
  return initMasterState().sectors.find(x=>String(x.sector||"").toUpperCase()===String(name||"").toUpperCase())||null;
}
function mapMacroIntoLegacy(){
  const pairs=[
    ["kse","KSE-100"],["rate","SBP Policy Rate"],["cpi","CPI Inflation YoY"],
    ["pkr","USD / PKR M2M"],["tbill","12M T-Bill Cut-off Yield"],["reserves","SBP FX Reserves"]
  ];
  pairs.forEach(([field,name])=>{
    const r=findMacro(name);
    if(r&&r.latest_value!=null) state.macro[field]=String(r.latest_value);
  });
  state.macro.liveRows=initLiveState().macro;
}
function mapSectorsIntoLegacy(){
  const names={
    banks:"COMMERCIAL BANKS",
    ep:"OIL & GAS EXPLORATION COMPANIES",
    fert:"FERTILIZER",
    cement:"CEMENT",
    power:"POWER GENERATION & DISTRIBUTION",
    oil:"OIL & GAS MARKETING COMPANIES",
    tech:"TECHNOLOGY & COMMUNICATION",
    auto:"AUTOMOBILE ASSEMBLER",
    foods:"FOOD & PERSONAL CARE PRODUCTS"
  };
  Object.entries(names).forEach(([id,name])=>{
    const live=liveSector(name);
    if(!live) return;
    const existing=state.sectors[id]||{rows:[],companies:[]};
    state.sectors[id]=Object.assign({},existing,{
      thesis:existing.thesis||live.structural_thesis||"",
      cycle:existing.cycle||live.regime||"",
      swingNow:existing.swingNow||live.macro_sensitivity||"",
      bull:existing.bull||live.catalysts||"",
      bear:existing.bear||live.risks||"",
      st_band:existing.st_band||live.primary_valuation_metric||"",
      updatedAt:live.updated_at?Date.parse(live.updated_at):existing.updatedAt
    });
  });
}
function mapCompaniesIntoLegacy(){
  const coverageMap={};
  initLiveState().coverage.forEach(r=>{ const t=cleanTicker(r.ticker); if(t) coverageMap[t]=r; });
  const financialByTicker={};
  initLiveState().financials.forEach(r=>{
    const t=cleanTicker(r.ticker);
    (financialByTicker[t]||(financialByTicker[t]=[])).push(r);
  });
  const ratioByTicker={};
  initLiveState().ratios.forEach(r=>{
    const t=cleanTicker(r.ticker);
    (ratioByTicker[t]||(ratioByTicker[t]=[])).push(r);
  });
  initMasterState().companies.forEach(m=>{
    const t=cleanTicker(m.ticker);
    if(!t) return;
    const existing=ensureCompanyDetailFromMaster(t)||{};
    const fs=(financialByTicker[t]||[]).slice().sort((a,b)=>String(b.period_end||"").localeCompare(String(a.period_end||"")));
    const rs=(ratioByTicker[t]||[]).slice().sort((a,b)=>String(b.as_of||"").localeCompare(String(a.as_of||"")));
    if((!existing.fy||!existing.fy.length)&&fs.length){
      existing.fy=fs.map(f=>{
        const ratio=rs.find(r=>r.as_of===f.period_end)||rs[0]||{};
        return {
          year:f.fiscal_year||String(f.period_end||"").slice(0,4),
          rev:f.revenue==null?"":String(f.revenue),
          pat:f.profit_after_tax==null?"":String(f.profit_after_tax),
          eps:f.eps==null?"":String(f.eps),
          roe:ratio.roe_pct==null?"":String(ratio.roe_pct),
          dps:f.dividends==null?"":String(f.dividends),
          de:ratio.debt_to_equity==null?"":String(ratio.debt_to_equity),
          source_name:f.source_name||(sourceDocumentById(f.source_document_id)||{}).source_name||"",
          source_url:f.source_url||(sourceDocumentById(f.source_document_id)||{}).source_url||"",
          source_title:(sourceDocumentById(f.source_document_id)||{}).title||"",
          source_page:f.source_page||null,
          verification_status:f.verification_status||"PROVISIONAL",
          verification_note:f.verification_note||""
        };
      });
    }
    existing.dataCoverage=coverageMap[t]||null;
    state.companies[t]=existing;
  });
}
function mapEventsIntoLegacy(){
  const live=initLiveState().events.map(e=>({
    date:e.event_date||"",
    subject:e.ticker_sector||e.entity_type||"",
    what:e.headline||e.event_type||"",
    impact:e.what_changed||e.required_action||"",
    live:true
  }));
  const personal=(state.events||[]).filter(e=>!e.live);
  state.events=live.concat(personal);
}
async function loadLiveResearchData(){
  const live=initLiveState();
  live.errors=[];
  const [macro,financials,ratios,bankMetrics,valuationScenarios,prices,valuations,portfolio,events,queue,sourceDocuments,coverage]=await Promise.all([
    liveRead("macro_indicators","*","id",true),
    liveRead("company_financials","*","period_end",false),
    liveRead("company_ratios","*","as_of",false),
    liveRead("bank_metrics","*","as_of",false),
    liveRead("valuation_scenarios","*","as_of",false),
    liveRead("market_prices","*","price_date",false),
    liveRead("valuations","*","as_of",false),
    liveRead("portfolio_holdings","*","ticker",true),
    liveRead("research_events","*","event_date",false),
    liveRead("research_queue","*","priority",true),
    liveRead("source_documents","*","retrieved_at",false),
    liveRead("company_data_coverage","*","ticker",true)
  ]);
  Object.assign(live,{macro,financials,ratios,bankMetrics,valuationScenarios,prices,valuations,portfolio,events,queue,sourceDocuments,coverage});
  mapMacroIntoLegacy();
  mapSectorsIntoLegacy();
  mapCompaniesIntoLegacy();
  mapEventsIntoLegacy();
  return live;
}

;
/* ===== assets/app-02.js ===== */
/* ===================== persistence ===================== */
const queues = {};
function queueWrite(path, body){
  const q = queues[path] || (queues[path]={timer:null,busy:false,pending:null});
  q.pending = body; setStatus("Saving…","saving");
  clearTimeout(q.timer); q.timer = setTimeout(()=>flush(path), 700);
}
async function flush(path){
  const q = queues[path];
  if(!q || q.busy || q.pending===null) return;
  if(!session){ setStatus("Not signed in — nothing saved"); return; }
  q.busy = true; const body = q.pending; q.pending = null;
  try{
    await saveDoc(path, body);
    setStatus("Saved "+new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),"saved");
  }catch(e){
    setStatus(e&&e.code==="invalid_argument" ? "Read-only — not saved" : "Save failed");
    if(e&&e.code==="unavailable"){ q.pending=q.pending||body; setTimeout(()=>flush(path),2000); }
  }finally{ q.busy=false; if(q.pending!==null) flush(path); }
}
function saveSector(id){ const s=state.sectors[id]; if(!s) return; s.updatedAt=Date.now(); queueWrite("sectors/"+id,s); renderNav(); }
function saveMacro(){ state.macro.updatedAt=Date.now(); queueWrite("macro/current",state.macro); }
function saveCompany(t){ const c=state.companies[t]; if(!c) return; c.updatedAt=Date.now(); queueWrite("companies/"+t,c); }
function savePortfolio(){ state.portfolio.updatedAt=Date.now(); queueWrite("portfolio/holdings",state.portfolio); }
function saveSources(){ queueWrite("sources/all",{list:state.sources,updatedAt:Date.now()}); }
function saveEvents(){ queueWrite("events/all",{list:state.events,updatedAt:Date.now()}); }

/* ===================== derived ===================== */
function positionRows(){
  const p = state.portfolio, cash = num(p.cash)||0;
  const rows = (p.positions||[]).map(x=>{
    const co = state.companies[(x.ticker||"").toUpperCase()];
    const price = num(x.price) !== null ? num(x.price) : (co? num(co.price) : null);
    const qty = num(x.qty), cost = num(x.cost);
    const value = (qty!==null && price!==null) ? qty*price : null;
    const pnl = (price!==null && cost) ? ((price-cost)/cost)*100 : null;
    const missing = [];
    if(!x.stop) missing.push("stop"); if(!x.target) missing.push("target"); if(!x.review) missing.push("review date");
    return Object.assign({}, x, {price, value, pnl, missing});
  });
  const invested = rows.reduce((a,r)=>a+(r.value||0),0);
  const total = invested + cash;
  rows.forEach(r=> r.weight = (total>0 && r.value!==null) ? (r.value/total)*100 : null);
  return { rows, cash, invested, total };
}
function sectorExposure(){
  const { rows, total } = positionRows();
  const out = {};
  rows.forEach(r=>{ const s=r.sector||"unassigned"; out[s]=(out[s]||0)+(r.value||0); });
  Object.keys(out).forEach(k=> out[k] = total>0 ? (out[k]/total)*100 : 0);
  return out;
}
function valuationRows(){
  return Object.values(state.companies).map(c=>{
    const price=num(c.price), base=num(c.base), bear=num(c.bear), bull=num(c.bull);
    const upside = (price && base!==null) ? ((base-price)/price)*100 : null;
    const mos = (base && price!==null) ? ((base-price)/base)*100 : null;
    const downside = (price && bear!==null) ? ((bear-price)/price)*100 : null;
    return Object.assign({}, c, {price, base, bear, bull, upside, mos, downside});
  }).sort((a,b)=>(b.upside===null?-1e9:b.upside)-(a.upside===null?-1e9:a.upside));
}
function researchQueue(){
  const q=[];
  SECTORS.forEach(s=>{
    const d=daysSince(state.sectors[s.id].updatedAt);
    if(d===null) q.push({sev:"warn",what:s.name,why:"Never opened",act:"Write the structure once",nav:["sector",s.id]});
    else if(d>75) q.push({sev:"bad",what:s.name,why:d+" days since update",act:"Refresh the reading",nav:["sector",s.id]});
    else if(d>35) q.push({sev:"warn",what:s.name,why:d+" days since update",act:"Add this month's data",nav:["sector",s.id]});
  });
  Object.values(state.companies).forEach(c=>{
    const d=daysSince(c.updatedAt);
    if(d!==null && d>90) q.push({sev:"warn",what:c.ticker+" — "+(c.name||""),why:d+" days since update",act:"Model is stale",nav:["company",c.ticker]});
  });
  const {rows}=positionRows();
  rows.forEach(r=>{
    if(r.missing.length) q.push({sev:"bad",what:(r.ticker||"position"),why:"Missing "+r.missing.join(", "),act:"Set it or exit",nav:["portfolio"]});
    if(r.review && r.review<=todayISO()) q.push({sev:"warn",what:(r.ticker||"position"),why:"Review date passed ("+r.review+")",act:"Review or re-date",nav:["portfolio"]});
  });
  const soon=new Date(Date.now()+14*86400000).toISOString().slice(0,10);
  (state.events||[]).forEach(e=>{ if(e.date && e.date>=todayISO() && e.date<=soon)
    q.push({sev:"warn",what:e.subject||"Event",why:"Due "+e.date,act:e.what||"Catalyst ahead",nav:["events"]}); });
  return q;
}

/* ===================== nav ===================== */
function syncWorkspaceUI(){
  const ws=route.workspace==="trading"?"trading":"investing";
  document.documentElement.setAttribute("data-workspace",ws);
  document.querySelectorAll("[data-workspace-panel]").forEach(el=>{el.hidden=el.dataset.workspacePanel!==ws;});
  document.querySelectorAll("[data-workspace-switch]").forEach(b=>b.setAttribute("aria-current",b.dataset.workspaceSwitch===ws?"true":"false"));
}
function renderNav(){
  syncWorkspaceUI();
  $("#sectorNav").innerHTML = SECTORS.map(s=>{
    const d=daysSince(state.sectors[s.id].updatedAt);
    return '<button class="navbtn" data-nav="sector" data-id="'+s.id+'"><span class="dot '+ageClass(d)+'"></span>'
      +'<span>'+esc(s.short)+'</span><span class="age">'+(d===null?"—":d+"d")+'</span></button>';
  }).join("");
  document.querySelectorAll(".navbtn,.topnavbtn").forEach(b=>{
    const on = b.dataset.nav===route.view && (b.dataset.nav!=="sector"||b.dataset.id===route.id);
    b.setAttribute("aria-current", on?"true":"false");
  });
}
function go(view,id){
  if(String(view||"").startsWith("trade-")) route.workspace="trading";
  else if(["dash","news","analysis","macro","sector","companies","masters","company","valuation","portfolio","events","queue","log","sources","method"].includes(view)) route.workspace="investing";
  if(view==="company"){
    ensureCompanyDetailFromMaster(id);
    route.view="company"; route.ticker=id; route.companyTab="overview";
  }
  else { route.view=view; route.id=id||null; if(view==="sector") route.tab="reading"; }
  renderNav(); render(); window.scrollTo(0,0);
}
document.addEventListener("click", e=>{
  const n=e.target.closest("[data-nav]");
  if(n){ e.preventDefault(); go(n.dataset.nav, n.dataset.id); }
});

document.addEventListener("click",e=>{
  const w=e.target.closest("[data-workspace-switch]");
  if(!w) return;
  e.preventDefault();
  const ws=w.dataset.workspaceSwitch==="trading"?"trading":"investing";
  route.workspace=ws;
  try{localStorage.setItem("psx-workspace",ws);}catch(err){}
  route.view=ws==="trading"?"trade-dash":"dash";
  route.id=null; route.ticker=null;
  renderNav(); render(); window.scrollTo(0,0);
});

;
