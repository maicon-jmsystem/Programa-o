function googleErrorMessage(error){return ({not_configured:'Avaliações automáticas indisponíveis: configure a chave Google Places no servidor.',curl_unavailable:'Avaliações automáticas indisponíveis: habilite a extensão PHP cURL.',google_permission:'Google Places recusou a consulta. Verifique a API habilitada, o faturamento e as restrições da chave.',invalid_provider:'Este provedor ainda não está no catálogo de consultas automáticas.'})[error]||'Não foi possível consultar o Google Places. Verifique a configuração do servidor.';}
(() => {
 const panel=document.querySelector('.providers-panel');
 const list=document.getElementById('providersList');
 if(!panel||!list)return;
 let disabled=false,busy=false,pending=false;
 async function update(){
  if(panel.hidden||disabled)return;
  if(busy){pending=true;return;}
  busy=true;
  try {
  const city=list.dataset.city||'';
  const state=list.dataset.region||'';
  if(!city||list.dataset.country!=='BR'||!['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].includes(state))return;
  if(!(list._rankingCards||list.querySelectorAll('.provider-card')).length){
   if(list.dataset.discoveryCity===city+' / '+state)return;
   list.dataset.discoveryCity=city+' / '+state;
   try{
    const response=await fetch('google-places.php?'+new URLSearchParams({discover:'1',city,state}),{credentials:'same-origin'});
    const result=await response.json();
    if(list.dataset.city!==city||list.dataset.region!==state)return;
    if(!response.ok){attribution.textContent=googleErrorMessage(result.error);return;}
    const providers=(result.providers||[]).map(p=>({name:p.name,cities:[city],site:p.url,ra:'https://www.reclameaqui.com.br/busca/?q='+encodeURIComponent(p.name),googleRating:p.rating,googleCount:p.count,googleUrl:p.url,googleAttributions:p.attributions||[],googleDetails:'Google Maps · '+p.count+' avaliações · '+p.name+' · '+p.address}));
    if(!providers.length){attribution.textContent='Google Maps: nenhum provedor com endereço confirmado nesta cidade. Isso não comprova ausência de cobertura.';return;}
    renderProvidersForCity({city,country_code:'BR',region_code:state,providers});
    for(const card of list._rankingCards||[])card.dataset.googleRequested='true';
    attribution.textContent='Avaliações consultadas no Google Maps · estabelecimentos locais; confirme a cobertura no seu endereço.';
   }catch{attribution.textContent='Não foi possível consultar o Google Maps. Verifique a conexão e a configuração do servidor.';}
   return;
  }
  let changed=false;
  for(const card of list._rankingCards||list.querySelectorAll('.provider-card')){
   if(card.dataset.googleRequested)continue;
   changed=true;
   const title=card.querySelector('h3').textContent;
   const name=card.dataset.provider||title.replace(/^\d+º · /,'').split(' · ')[0];
   card.dataset.googleRequested='true';
   const badge=card.querySelector('.reputation-badge');
   try{
    const response=await fetch('google-places.php?'+new URLSearchParams({provider:name,city,state}),{credentials:'same-origin'});
    const data=await response.json();
    if(data.error==='not_configured'){attribution.textContent=googleErrorMessage(data.error);disabled=true;return;}
    if(!response.ok){attribution.textContent=googleErrorMessage(data.error);badge.title='Não foi possível consultar o Google agora. Atualize a página para tentar novamente.';continue;}
    if(!data.found){delete card.dataset.googleRating;badge.querySelector('strong').textContent='Perfil local não encontrado';badge.title='O Google não retornou um perfil correspondente ao nome e à cidade. A nota não foi substituída por outra filial.';continue;}
    card.dataset.googleCount=data.count;
    if(Number.isFinite(data.rating))card.dataset.googleRating=data.rating;else delete card.dataset.googleRating;
    badge.querySelector('strong').textContent=data.rating==null?'Sem avaliações':data.rating.toLocaleString('pt-BR')+' / 5 ★';
    badge.href=data.url||badge.href;
    const detail=`Google Maps · ${data.count} avaliações · ${data.name} · ${data.address}`;
    badge.title=detail;badge.querySelector('small').textContent=detail;
    const info=card.querySelector('.provider-provenance');
    const p=document.createElement('p');p.textContent=detail+' · consultado agora pela API. A avaliação é deste estabelecimento local.';info?.append(p);
    for(const attr of data.attributions||[]){const a=document.createElement('a');a.textContent=attr.provider||'Fonte';a.href=attr.providerUri;a.target='_blank';a.rel='noopener noreferrer';info?.append(a);}
   }catch{ /* Mantém a pesquisa manual quando a API não responde. */ }
  }
  if(changed)applyProviderRanking(list);
  } finally {busy=false;if(pending){pending=false;queueMicrotask(update);}}
 }
 const attribution=document.createElement('p');attribution.className='providers-note';attribution.textContent='Avaliações automáticas: Google Maps';
 panel.append(attribution);
 new MutationObserver(update).observe(panel,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
 update();
})();
