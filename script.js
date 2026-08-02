const csvURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBtyGriDud4pVArvyGHpC3aptGso3l6xn2B8phOwMIn2JekjQZPPkKzt2274D82ie1djrwndV6PcFC/pub?gid=481332784&single=true&output=csv";
const REFRESH_MS = 5 * 60 * 1000;
const medals = ["🥇","🥈","🥉","🏅"];
const classes = ["first","second","third","fourth"];
const ordinal = ["1st place","2nd place","3rd place","4th place"];

function cleanMoney(value) {
  return Number(String(value ?? "").replace(/[^0-9.-]/g, "")) || 0;
}
function currency(value) {
  return value.toLocaleString("en-US", {style:"currency",currency:"USD",minimumFractionDigits:2});
}
function formatTimestamp(value) {
  if (!value) return "Not yet recorded";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const now = new Date();
  const sameDay = parsed.getFullYear()===now.getFullYear() && parsed.getMonth()===now.getMonth() && parsed.getDate()===now.getDate();
  const datePart = sameDay ? "Today" : parsed.toLocaleDateString("en-US", {month:"short",day:"numeric",year:"numeric"});
  const timePart = parsed.toLocaleTimeString("en-US", {hour:"numeric",minute:"2-digit"});
  return `${datePart} • ${timePart}`;
}
function setStatus(text,isError=false) {
  const status=document.getElementById("status");
  status.textContent=text;
  status.classList.toggle("error",isError);
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}

async function loadLeaderboard() {
  const cards=document.getElementById("cards");
  const updated=document.getElementById("updated");
  const banner=document.getElementById("leader-banner");
  setStatus("Refreshing");
  try {
    const response=await fetch(`${csvURL}&cacheBust=${Date.now()}`,{cache:"no-store"});
    if(!response.ok) throw new Error(`Google Sheets returned ${response.status}`);
    const csv=await response.text();
    const parsed=Papa.parse(csv,{header:true,skipEmptyLines:true,transformHeader:h=>h.trim()});
    let players=parsed.data.map(row=>({
      name:String(row.Child??row.Name??"").trim(),
      balance:cleanMoney(row.Balance),
      rank:Number(row.Rank)||null,
      medal:String(row.Medal??"").trim(),
      updated:String(row["Last Updated"]??"").trim()
    })).filter(p=>p.name);
    if(!players.length) throw new Error("No participant rows were found.");
    players.sort((a,b)=>a.rank&&b.rank?a.rank-b.rank:b.balance-a.balance);
    const leader=players[0], second=players[1];
    banner.querySelector(".leader-name").textContent=leader.name;
    banner.querySelector(".leader-balance").textContent=currency(leader.balance);
    banner.querySelector(".leader-margin").textContent=second?`Leading by ${currency(leader.balance-second.balance)}`:"";
    cards.innerHTML=players.slice(0,4).map((p,i)=>{
      const gap=leader.balance-p.balance;
      const gapText=i===0?`<div class="behind leader">Currently leading</div>`:`<div class="behind">${currency(gap)} behind first</div>`;
      return `<article class="card ${classes[i]}" style="animation-delay:${i*60}ms">
        <div class="place" aria-hidden="true">${p.medal||medals[i]}</div>
        <div class="person"><div class="rank">${ordinal[i]}</div><div class="name">${escapeHtml(p.name)}</div></div>
        <div class="money"><div class="balance">${currency(p.balance)}</div>${gapText}</div>
      </article>`;
    }).join("");
    const ts=players.find(p=>p.updated)?.updated||"";
    updated.textContent=formatTimestamp(ts);
    setStatus("Live");
  } catch(error) {
    console.error(error);
    cards.innerHTML=`<div class="error-card"><strong>Unable to load the leaderboard</strong><span>${escapeHtml(error.message)}</span></div>`;
    banner.querySelector(".leader-name").textContent="Data unavailable";
    banner.querySelector(".leader-balance").textContent="";
    banner.querySelector(".leader-margin").textContent="";
    updated.textContent="Unavailable";
    setStatus("Connection error",true);
  }
}
loadLeaderboard();
setInterval(loadLeaderboard,REFRESH_MS);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)loadLeaderboard();});
if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js"));
