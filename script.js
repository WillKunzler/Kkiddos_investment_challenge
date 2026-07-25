const csv='https://docs.google.com/spreadsheets/d/e/2PACX-1vTFT5m8FTR2vwF9tvP150_8UYdeODRHp-MLGGhsUAJie9H7u4zkpLg8TxovqVyZKssee_VNBa6fdMJn/pub?gid=0&single=true&output=csv';
async function load(){
 const t=await fetch(csv+'?t='+Date.now()).then(r=>r.text());
 const rows=t.trim().split('\n').slice(1).map(r=>r.split(','));
 const data=rows.map(r=>({name:r[0],bal:parseFloat(r[1].replace(/[$,]/g,''))||0}))
 .sort((a,b)=>b.bal-a.bal);
 const medals=['🥇','🥈','🥉','🏅'],cls=['first','second','third','fourth'];
 cards.innerHTML='';
 data.forEach((d,i)=>{
 cards.innerHTML+=`<div class="card ${cls[i]}"><div class=name>${medals[i]} ${d.name}</div><div class=bal>${d.bal.toLocaleString('en-US',{style:'currency',currency:'USD'})}</div></div>`;
 });
 updated.textContent='Updated: '+new Date().toLocaleString();
}
load();setInterval(load,300000);