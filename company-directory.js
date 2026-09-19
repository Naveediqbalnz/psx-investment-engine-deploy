(function(){
function entityType(c){
  var s=String(c.sectorName||(c.masterRecord&&c.masterRecord.sector)||"").toUpperCase();
  if(s.includes("MODARABA")) return "Modaraba";
  if(s.includes("MUTUAL FUND")||s.includes("EXCHANGE TRADED FUND")) return "Fund";
  if(s.includes("REAL ESTATE INVESTMENT TRUST")||s==="REIT") return "REIT";
  return "Company";
}
function rows(){
  return companyDisplayRecords().map(function(c){
    var m=masterCompanyByTicker(c.ticker)||{};
    return Object.assign({},c,{
      masterRecord:m,entityType:entityType(Object.assign({},c,{masterRecord:m})),
      board:m.is_gem===true?"GEM":"Main",active:m.tradable_current!==false,
      marketCap:m.market_cap_pkr_m,freeFloat:m.free_float_pct,
      priceDate:m.price_date,reportPeriod:m.latest_report_period
    });
  });
}
companiesHTML=function(){
  var list=rows();
  var sectors=[...new Set(list.map(function(c){return c.sectorName||c.masterRecord.sector||"";}).filter(Boolean))].sort();
  var companyCount=list.filter(function(c){return c.entityType==="Company";}).length;
  var otherCount=list.length-companyCount;
  var body=list.map(function(c){
    var sector=c.sectorName||c.masterRecord.sector||secName(c.sector);
    var search=[c.ticker,c.name,sector,c.entityType,c.board].join(" ").toUpperCase();
    return '<tr data-company-row data-search="'+esc(search)+'" data-sector="'+esc(sector)+'" data-entity="'+esc(c.entityType)+'" data-board="'+esc(c.board)+'" data-active="'+(c.active?"true":"false")+'">'
      +'<td class="pad"><a href="#" data-nav="company" data-id="'+esc(c.ticker)+'"><strong>'+esc(c.ticker)+'</strong></a></td>'
      +'<td class="pad company-name">'+esc(c.name||"—")+'</td><td class="pad">'+esc(sector||"—")+'</td>'
      +'<td class="pad"><span class="entitytag">'+esc(c.entityType)+'</span></td>'
      +'<td class="pad"><span class="boardtag '+(c.board==="GEM"?"gem":"")+'">'+esc(c.board)+'</span></td>'
      +'<td class="pad"><span class="tradestatus '+(c.active?"active":"inactive")+'">'+(c.active?"Active":"Inactive")+'</span></td>'
      +'<td class="pad num">'+fmtSmart(c.price,2)+'</td><td class="pad">'+fmtDate(c.priceDate)+'</td>'
      +'<td class="pad num">'+fmtSmart(c.marketCap,1)+'</td>'
      +'<td class="pad num">'+(c.freeFloat==null?"—":fmtSmart(c.freeFloat,1)+"%")+'</td>'
      +'<td class="pad">'+fmtDate(c.reportPeriod)+'</td><td class="pad">'+esc(c.coverage||"—")+'</td></tr>';
  }).join("");
  return '<div class="pagehero company-directory-hero"><div><div class="eyebrow">PSX DIRECTORY</div><h2 class="section">All listed entities</h2>'
    +'<p class="sub">Search the complete live universe. Operating companies are shown by default; include funds, modarabas and REITs when needed.</p></div>'
    +'<div class="factbar"><span class="factpill"><b>'+fmtSmart(companyCount)+'</b>Operating companies</span><span class="factpill"><b>'+fmtSmart(otherCount)+'</b>Other securities</span></div></div>'
    +'<div class="directory-controls"><div class="directory-search"><label for="companyDirectorySearch">Find company or ticker</label><input id="companyDirectorySearch" type="search" placeholder="e.g. MEBL or Meezan Bank" autocomplete="off"></div>'
    +'<div class="directory-filter"><label for="companySectorFilter">Sector</label><select id="companySectorFilter"><option value="">All sectors</option>'+sectors.map(function(s){return '<option value="'+esc(s)+'">'+esc(s)+'</option>';}).join("")+'</select></div>'
    +'<div class="directory-filter"><label for="companyBoardFilter">Board</label><select id="companyBoardFilter"><option value="">All boards</option><option value="Main">Main Board</option><option value="GEM">GEM Board</option></select></div>'
    +'<label class="directory-check"><input id="includeOtherEntities" type="checkbox"> Include funds, modarabas and REITs</label>'
    +'<label class="directory-check"><input id="includeInactiveCompanies" type="checkbox"> Include inactive records</label></div>'
    +'<div class="directory-summary"><strong id="companyVisibleCount">'+fmtSmart(companyCount)+'</strong><span>entities shown</span><button class="textbtn" type="button" id="resetCompanyFilters">Reset filters</button></div>'
    +'<div class="scroll company-directory"><table><thead><tr><th>Ticker</th><th>Name</th><th>Sector</th><th>Type</th><th>Board</th><th>Status</th><th class="num">Price</th><th>Price date</th><th class="num">Market cap PKR m</th><th class="num">Free float</th><th>Latest report</th><th>Coverage</th></tr></thead><tbody>'
    +(body||'<tr><td class="pad empty" colspan="12">No listed entities available.</td></tr>')+'</tbody></table></div><p class="empty" id="companyDirectoryEmpty" hidden>No entities match these filters.</p>';
};
var baseBind=bind;
bind=function(){
  baseBind();
  var search=$("#companyDirectorySearch");
  if(!search) return;
  var sector=$("#companySectorFilter"),board=$("#companyBoardFilter"),other=$("#includeOtherEntities"),inactive=$("#includeInactiveCompanies"),count=$("#companyVisibleCount"),empty=$("#companyDirectoryEmpty");
  function apply(){
    var q=String(search.value||"").trim().toUpperCase(),shown=0;
    document.querySelectorAll("[data-company-row]").forEach(function(row){
      var show=(!q||String(row.dataset.search||"").includes(q))
        &&(!sector.value||row.dataset.sector===sector.value)
        &&(!board.value||row.dataset.board===board.value)
        &&(other.checked||row.dataset.entity==="Company")
        &&(inactive.checked||row.dataset.active==="true");
      row.hidden=!show;if(show) shown++;
    });
    count.textContent=shown.toLocaleString();empty.hidden=shown!==0;
  }
  [search,sector,board,other,inactive].forEach(function(el){el.oninput=apply;el.onchange=apply;});
  var reset=$("#resetCompanyFilters");
  if(reset) reset.onclick=function(){search.value="";sector.value="";board.value="";other.checked=false;inactive.checked=false;apply();search.focus();};
  apply();
};
var style=document.createElement("style");
style.textContent=`
.company-directory-hero{margin-bottom:16px}.directory-controls{display:grid;grid-template-columns:minmax(260px,1.5fr) minmax(190px,1fr) minmax(145px,.6fr);gap:10px 12px;align-items:end;background:var(--surface);border:1px solid var(--rule);border-radius:9px;padding:14px 15px;box-shadow:var(--shadow-sm)}.directory-search,.directory-filter{display:flex;flex-direction:column;gap:4px}.directory-search label,.directory-filter label{font-size:11px;font-weight:600;color:var(--ink-2)}.directory-search input{min-width:0}.directory-check{display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--ink-2);cursor:pointer;min-height:34px}.directory-check input{width:16px;height:16px;accent-color:var(--accent)}.directory-summary{display:flex;align-items:baseline;gap:6px;margin:14px 2px 9px;color:var(--ink-2);font-size:12px}.directory-summary strong{font-family:var(--serif);font-size:20px;color:var(--ink);font-weight:500}.directory-summary .textbtn{margin-left:auto}.company-directory{max-height:calc(100vh - 300px);min-height:320px}.company-directory thead{position:sticky;top:0;background:var(--surface);z-index:2}.company-directory .company-name{min-width:220px}.entitytag,.boardtag,.tradestatus{display:inline-flex;white-space:nowrap;border:1px solid var(--rule);border-radius:999px;padding:2px 7px;font-size:10.5px;color:var(--ink-2);background:var(--sunken)}.boardtag.gem{border-color:var(--warn);color:var(--warn);background:var(--warn-soft)}.tradestatus.active{border-color:color-mix(in srgb,var(--accent) 45%,var(--rule));color:var(--accent);background:var(--accent-soft)}.tradestatus.inactive{border-color:var(--alert);color:var(--alert);background:var(--alert-soft)}@media(max-width:980px){.directory-controls{grid-template-columns:1fr 1fr}.directory-search{grid-column:1/-1}}@media(max-width:620px){.directory-controls{grid-template-columns:1fr}.directory-search{grid-column:auto}.company-directory{max-height:none}.company-directory-hero .factbar{min-width:0;width:100%}}
`;
document.head.appendChild(style);
})();