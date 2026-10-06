const monitorOrder=['pokerstars','bancopan','govbr','itau','globoplay','inter','whatsapp','instagram','facebook','youtube','tiktok','spotify','netflix','nubank'];
const monitorGrid=document.getElementById('monitorGrid');
const monitorMessage=document.getElementById('monitorMessage');
function serviceHealth(points){
 const last=points.at(-1);if(!last||last.kind==='unknown'||last.status===0)return{level:'unknown',label:last?.status===0?'Não verificado · monitor sem conexão':'Não verificado · resposta restrita'};
 if(last.kind==='failure')return points.slice(-3).length===3&&points.slice(-3).every(p=>p.kind==='failure')?{level:'bad',label:'Falhas repetidas de acesso'}:{level:'warn',label:'Falha de acesso · verificando'};
 if(last.ms>1500||points.slice(-3).some(p=>p.kind==='failure'))return{level:'warn',label:'Lentidão ou falha recente'};
 return{level:'ok',label:'Respondendo normalmente'};
}
function monitorChart(points){
 const valid=points.map((p,i)=>({...p,i})).filter(p=>p.kind==='ok');
 if(!valid.length)return '<span class="monitor-empty">Sem amostras de resposta válidas</span>';
 const min=Math.max(0,Math.min(...valid.map(p=>p.ms))-100);
 const max=Math.max(min+250,...valid.map(p=>p.ms))+50;
 const coords=p=>`${points.length===1?150:4+p.i/(points.length-1)*292},${70-(p.ms-min)/(max-min)*55}`;
 const runs=[];let run=[];for(const p of points.map((p,i)=>({...p,i}))){if(p.kind==='ok')run.push(p);else{if(run.length)runs.push(run);run=[];}}if(run.length)runs.push(run);
 return `<svg viewBox="0 0 300 85" role="img" aria-label="Tempo de resposta HTTP em milissegundos, escala ${Math.round(min)} a ${Math.round(max)} ms. Lacunas representam medições sem resposta válida.">${runs.map(r=>r.length>1?`<polyline points="${r.map(coords).join(' ')}"/>`:`<circle cx="${coords(r[0]).split(',')[0]}" cy="${coords(r[0]).split(',')[1]}" r="1.5"><title>${r[0].ms} ms · aguardando mais amostras</title></circle>`).join('')}</svg>`;
}
async function refreshMonitor(){
 monitorMessage.textContent='Verificando serviços…';
 try{
  const response=await fetch('monitor.php',{cache:'no-store',signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw new Error();const data=await response.json();if(!Array.isArray(data.services))throw new Error();
  monitorGrid.innerHTML=data.services.slice().sort((a,b)=>monitorOrder.indexOf(a.id)-monitorOrder.indexOf(b.id)).map(s=>{const health=serviceHealth(s.points);const last=s.points.at(-1);return `<article class="monitor-card level-${health.level}"><div class="monitor-card-top"><strong>${escapeHtml(s.name)}</strong><span class="monitor-dot"></span></div><p>${health.label}</p>${monitorChart(s.points)}<small>${last?.kind==='ok'?`${last.ms} ms · `:''}${s.points.length} amostra(s) · até 30 verificações</small></article>`;}).join('');
  monitorMessage.textContent=`Atualizado às ${new Date(data.checkedAt).toLocaleTimeString('pt-BR')}`;
 }catch{monitorMessage.textContent='Monitor indisponível. Na hospedagem, habilite PHP 8+ com cURL. Nenhum status de serviço foi confirmado.';}
}
refreshMonitor();setInterval(()=>{if(!document.hidden)refreshMonitor();},60000);
