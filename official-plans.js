(() => {
 const list=document.getElementById('providersList');if(!list)return;
 const responses=new Map();
 async function lookup(name){if(!responses.has(name))responses.set(name,fetch('official-plans.php?'+new URLSearchParams({provider:name}),{credentials:'same-origin'}).then(async response=>{const data=await response.json();if(!response.ok)return {...data,status:data.status||'official_site_unavailable'};return data;}).catch(()=>({status:'official_site_unavailable',plans:[]})));return responses.get(name);}
 function update(){for(const card of list._rankingCards||list.querySelectorAll('.provider-card')){
  if(card.dataset.plansRequested)continue;card.dataset.plansRequested='true';
  const box=card.querySelector('.provider-plans');if(!box)continue;
  const canonical=internetOperatorName(card.dataset.provider)||card.dataset.provider;
  lookup(canonical).then(data=>{
   if(!card.isConnected)return;
   const title=document.createElement('strong');title.textContent='Planos no site oficial';box.replaceChildren(title);
   const status=document.createElement('p');
   const messages={official_site_unknown:'Site oficial ainda não cadastrado. Não exibimos preços de comparadores.',php_extensions_missing:'A consulta exige PHP cURL e DOM habilitados na hospedagem.',official_site_unavailable:'Não foi possível consultar o site oficial agora.',structured_offers_unavailable:'O site não disponibilizou ofertas em formato legível automaticamente. Consulte os planos e informe seu CEP no site oficial.'};
   status.textContent=data.status==='found'?data.notice:(messages[data.status]||'Planos indisponíveis para consulta automática.');box.append(status);
   for(const offer of data.plans||[]){const item=document.createElement('div');item.className='plan-mini';const name=document.createElement('strong');name.textContent=offer.name;const price=document.createElement('span');price.textContent=Number(offer.price).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});const info=document.createElement('small');info.textContent=[offer.billing,offer.conditions].filter(Boolean).join(' ');item.append(name,price,info);box.append(item);}
   if(data.source){const a=document.createElement('a');a.href=data.source;a.textContent='Consultar planos e cobertura no site oficial ↗';a.target='_blank';a.rel='noopener noreferrer';box.append(a);for(const link of card.querySelectorAll('.provider-links a'))if(link.textContent.startsWith('Consultar cobertura'))link.href=data.source;}
   if(data.checked_at){const date=document.createElement('small');date.textContent='Consulta: '+new Date(data.checked_at).toLocaleString('pt-BR');box.append(date);}
  });
 }}
 new MutationObserver(update).observe(list,{subtree:true,childList:true});update();
 document.querySelector('.providers-panel')?.addEventListener('click',event=>{if(event.target.textContent==='Atualizar avaliações'){responses.clear();for(const card of list._rankingCards||[])delete card.dataset.plansRequested;update();}});
})();
