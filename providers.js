const nearbyProviders = [
 {name:'Cybernet RS',cities:['Alvorada'],site:'https://cybernetrs.com.br/',ra:'https://www.reclameaqui.com.br/cybernetrs/falta-de-internet-e-dificuldade-de-contato-com-suporte-tecnico-da-cybernet-rs_D7oD_wJr_AEu9gUz/',review:'Reclame Aqui: foi localizado relato sobre falta de conexão e atendimento; a nota geral não pôde ser confirmada. Google: nota não confirmada diretamente.',source:'https://cybernetrs.com.br/'},
 {name:'Even Telecom',cities:['Cachoeirinha'],site:'https://eventelecom.com.br/',ra:'https://www.reclameaqui.com.br/empresa/even-telecom/',review:'Reclame Aqui: sem reputação definida. Google: nota não confirmada diretamente.',source:'https://eventelecom.com.br/'},
 {name:'NetParque',cities:['Cachoeirinha','Canoas','Gravataí'],site:'https://www.netparque.com.br/',ra:'https://www.reclameaqui.com.br/empresa/netparque/',review:'Reclame Aqui: sem reputação definida. Google: nota não confirmada diretamente.',source:'https://www.netparque.com.br/'},
 {name:'Flex Fibra',cities:['Canoas'],site:'https://www2.flexfibra.com.br/',ra:'https://www.reclameaqui.com.br/empresa/flex-fibra-rs/',review:'Reclame Aqui: sem reputação definida. Google: nota não confirmada diretamente.',source:'https://www2.flexfibra.com.br/'},
 {name:'Vem pra Uno',cities:['Cachoeirinha','Gravataí'],site:'https://vemprauno.com.br/',ra:'https://www.reclameaqui.com.br/compare/uno-provedor-de-internet',review:'Reclame Aqui: sem reputação definida na comparação consultada. Google: nota não confirmada diretamente.',source:'https://vemprauno.com.br/'}
];
const alvoradaRankingSource='https://melhorplano.net/internet-banda-larga/rs/alvorada';
const alvoradaRanking=[['ONNET',5],['Cybernet RS',5],['MHNET Telecom',4.3],['Internet O Sul',4],['GNS Fibra',3.8],['Claro',3.2],['Vivo',3.2],['Vero Internet',2.9],['Nio Fibra',2.4],['TIM',1.7]].map(([name,score])=>({name,score,cities:['Alvorada'],site:alvoradaRankingSource,source:alvoradaRankingSource,ra:'https://www.reclameaqui.com.br/busca/?q='+encodeURIComponent(name),review:'Avaliação de usuários: '+score.toLocaleString('pt-BR')+'/5 · Minha Conexão, publicada no MelhorPlano. Google e Reclame Aqui não compõem esta nota.'}));
const cachoeirinhaRankingSource='https://melhorplano.net/internet-banda-larga/rs/cachoeirinha';
const cachoeirinhaRanking=[['Unifique',3.9],['MHNET Telecom',3.6],['Vivo',3.1],['Renovare Telecom',2.6],['Vem pra Uno',2.6],['Claro',2.3],['Nio Fibra',2],['Algar',1.9]].map(([name,score])=>({name,score,cities:['Cachoeirinha'],site:cachoeirinhaRankingSource,source:cachoeirinhaRankingSource,ra:'https://www.reclameaqui.com.br/busca/?q='+encodeURIComponent(name),review:'Minha Conexão: '+score.toLocaleString('pt-BR')+'/5 · consultado em 05/10/2026. Nota não é do Google nem do Reclame Aqui.'}));
const providerPlans = {
 'Even Telecom':{source:'https://evenfibra.com.br/residencial',items:['600 Mbps · R$ 104,99/mês','700 Mbps · R$ 124,99/mês','800 Mbps · R$ 134,99/mês','1000 Mbps · R$ 159,99/mês'],conditions:'Valores exibidos na página oficial para Porto Alegre/RS; confirmar para seu endereço. Nos 12 primeiros meses ou renovação anual. Instalação sujeita à cobertura.'},
 'NetParque':{source:'https://www.netparque.com.br/#planos',items:['600 Mbps · R$ 99,90/mês','700 Mbps · R$ 129,90/mês','800 Mbps · R$ 149,90/mês'],conditions:'Contrato de 12 meses; equipamentos em comodato. Consulte taxa de instalação e cobertura.'},
 'Vem pra Uno':{source:'https://vemprauno.com.br/casa',items:['500 Mbps · Valor sob consulta','600 Mbps · Valor sob consulta','800 Mbps · Valor sob consulta','1000 Mbps · Valor sob consulta'],conditions:'A página oficial informa velocidades, mas não publica preços. Confirme as condições com o provedor.'},
 'GNS Fibra':{source:'https://www.gnsfibra.com.br/',items:['95 Mbps · R$ 59,90/mês · 1 ponto Wi-Fi','300 Mbps · R$ 79,90/mês · Wi-Fi 5','600 Mbps · R$ 99,90/mês · Wi-Fi 5'],conditions:'Pagamento por boleto ou PIX. Consulte fidelidade, instalação e cobertura.'},
 'Cybernet RS':{source:'https://melhorplano.net/provedores/cybernet-rs',items:['600 Mbps · a partir de R$ 99,90/mês'],conditions:'Oferta publicada no comparador MelhorPlano. Confirme preço, fidelidade e instalação com o provedor.'},
 'Claro':{source:'https://www.claro.com.br/internet/banda-larga/rs/alvorada',items:['600 Mbps + Netflix · preço sob consulta','600 Mbps + HBO Max · preço sob consulta'],conditions:'Disponibilidade e preço dependem do endereço e condições de contratação.'}
};
const providerReputation = {
 'NetParque':{google:'4,4 / 5 ★',googleCount:514,googleDetail:'514 avaliações · captura enviada em 04/10/2026',ra:'Sem reputação definida',raDetail:'Última consulta disponível: 03/10/2026 · menos de 10 reclamações avaliadas'},
 'Even Telecom':{google:'4,9 / 5 ★',googleCount:480,googleDetail:'480 avaliações · informado no site da Even, não confirmado diretamente no Google',ra:'Sem reputação definida',raDetail:'Última consulta disponível: 03/10/2026 · menos de 10 reclamações avaliadas'},
 'Flex Fibra':{google:'Não confirmado',googleDetail:'Consultar avaliações no Google',ra:'Sem reputação definida',raDetail:'Última consulta disponível: 03/10/2026 · menos de 10 reclamações avaliadas'},
 'Vem pra Uno':{google:'Não confirmado',googleDetail:'Consultar avaliações no Google',ra:'Sem reputação definida',raDetail:'Comparação consultada em 03/10/2026'}
};
// Dados pesquisados manualmente. Ausência de nota não significa nota zero.
const researchDate='05/10/2026';
const providerProfiles={
 'Unifique':{site:'https://unifique.com.br/para-voce',ra:'https://www.reclameaqui.com.br/empresa/unifique/'},
 'MHNET Telecom':{site:'https://mhnet.com.br/planos-de-internet-fibra/',ra:'https://www.reclameaqui.com.br/empresa/mhnet-telecom/'},
 'Vivo':{site:'https://web.vivo.com.br/',ra:'https://www.reclameaqui.com.br/empresa/vivo-celular-fixo-internet-tv/'},
 'Claro':{site:'https://www.claro.com.br/internet/banda-larga',ra:'https://www.reclameaqui.com.br/empresa/claro/'},
 'Nio Fibra':{site:'https://www.niointernet.com.br/',ra:'https://www.reclameaqui.com.br/empresa/client-co-servicos-de-rede-nordeste-s-a/'},
 'Algar':{site:'https://loja.algar.com.br/',ra:'https://www.reclameaqui.com.br/empresa/algar1/'},
 'Fênix Internet':{site:'https://fenixinternet-rs.com.br/',ra:'https://www.reclameaqui.com.br/empresa/fenix-internet/'}
};
Object.assign(providerPlans,{
 'MHNET Telecom':{checked:researchDate,source:providerProfiles['MHNET Telecom'].site,items:['500 Mbps · R$ 99,90/mês','600 Mbps · R$ 119,90/mês','700 Mbps · R$ 149,99/mês','1000 Mbps · R$ 149,90/mês'],conditions:'Tabela anunciada no site oficial; consultar oferta para seu endereço, desconto por vencimento e fidelidade. O site anuncia 700 Mega por R$ 149,99 e 1 Giga por R$ 149,90.'},
 'Vivo':{checked:researchDate,source:providerProfiles.Vivo.site,items:['600 Mbps · R$ 100,00/mês'],conditions:'Oferta anunciada no site oficial, sujeita ao endereço. Instalação grátis mediante fidelização; bônus Wi-Fi mediante adimplência. Consulte regulamento VIV202603030214.'},
 'Nio Fibra':{checked:researchDate,source:providerProfiles['Nio Fibra'].site,items:['600 Mbps · R$ 95,00/mês · R$ 110 sem cartão','700 Mbps + 5G · R$ 125,00/mês · R$ 140 sem cartão','800 Mbps + 5G · R$ 155,00/mês · R$ 170 sem cartão','1000 Mbps + 5G · R$ 185,00/mês · R$ 200 sem cartão'],conditions:'Valores com pagamento no cartão. Planos de 700/800/1000 Mega incluem chips 5G; consulte franquias, fidelidade e cobertura por CEP. Oferta nacional anunciada, disponibilidade local não garantida.'},
 'Fênix Internet':{checked:researchDate,source:providerProfiles['Fênix Internet'].site,items:['220 Mbps · Valor sob consulta','570 Mbps · Valor sob consulta','670 Mbps · Valor sob consulta','720 Mbps · Valor sob consulta','820 Mbps · Valor sob consulta'],conditions:'Site oficial informa velocidades, instalação grátis, Wi-Fi incluso e fidelidade de 12 meses; preços somente mediante consulta.'},
 'Unifique':{checked:researchDate,source:providerProfiles.Unifique.site,items:[],conditions:'O site oficial exige selecionar a cidade para consultar as ofertas. Preço e velocidade para este endereço ainda não verificados.'}
});
for(const [name,ra,detail] of [
 ['Unifique','8,0 / 10 · Ótima','Período 01/04 a 30/09/2026 · página oficial de perguntas frequentes do Reclame Aqui'],
 ['MHNET Telecom','7,1 / 10 · Boa','Período 01/04 a 30/09/2026 · página oficial da empresa no Reclame Aqui'],
 ['Claro','Não recomendada','Período 01/04 a 30/09/2026 · sem nota numérica publicada'],
 ['Vivo','Não recomendada','Perfil Vivo — Celular, Internet móvel e TV; classificação indexada na lista de reclamações'],
 ['Algar','7,3 / 10 · Boa','Perfil atual Algar (algar1); resultado indexado da página oficial']
])providerReputation[name]={google:'Não verificado',googleDetail:'Nota local do Google ainda não verificada; abra o perfil da sua cidade.',ra,raDetail:detail+' · pesquisa '+researchDate,raSource:providerProfiles[name].ra};
providerReputation.Unifique.raCount=1071;
providerReputation['MHNET Telecom'].raCount=299;
providerReputation.Unifique.raSource='https://www.reclameaqui.com.br/empresa/unifique/faq/';
providerReputation.Vivo.raSource='https://www.reclameaqui.com.br/empresa/vivo-celular-fixo-internet-tv/lista-reclamacoes/?problema=0000000000000018';
function createReputationBadges(provider,googleUrl){
 const data=provider.googleDetails?{google:Number.isFinite(provider.googleRating)?provider.googleRating.toLocaleString('pt-BR')+' / 5 ★':'Sem avaliações',googleDetail:provider.googleDetails,ra:'Não confirmado',raDetail:'Consultar reputação no Reclame Aqui'}:providerReputation[provider.name]||{google:'Não confirmado',googleDetail:'Consultar avaliações no Google',ra:'Não confirmado',raDetail:'Consultar reputação no Reclame Aqui'};
 const group=document.createElement('div');group.className='reputation-grid';
 for(const [label,value,detail,url] of [['Google',data.google,data.googleDetail,googleUrl],['Reclame Aqui',data.ra,data.raDetail,data.raSource||provider.ra]]){const badge=document.createElement('a');badge.className='reputation-badge';badge.href=url;badge.target='_blank';badge.rel='noopener noreferrer';badge.title=detail;const heading=document.createElement('span');heading.textContent=label;const score=document.createElement('strong');score.textContent=value;const info=document.createElement('small');info.textContent=detail;badge.append(heading,score,info);group.append(badge);}return group;
}
function rankingValue(provider){
 if(Number.isFinite(provider.score))return provider.score;
 const rating=providerReputation[provider.name]?.google;
 const match=rating?.match(/^(\d+(?:,\d+)?) \/ 5/);
 return match?Number(match[1].replace(',','.')):null;
}
const normalizeCity = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
// Lista conservadora: resultados desconhecidos não recebem classificação automática.
const internetOperatorAliases = [
 ['RL NET', ['rl net','rlnet']], ['Unitec', ['unitec provedor de internet','unitec internet']],
 ['BLUE3 INTERNET', ['blue3 internet']], ['POANET Telecom', ['poanet telecom','poanet']],
 ['Mov Conexão', ['mov conexao']], ['Clicnet', ['clicnet']], ['Telium', ['telium']],
 ['Vivo', ['vivo']], ['Claro', ['claro']], ['Sebratel', ['sebratel']],
 ...Object.keys(providerProfiles).map(name=>[name,[name]]),
 ...nearbyProviders.map(p=>[p.name,[p.name]]),
 ...alvoradaRanking.map(p=>[p.name,[p.name]]),
 ...cachoeirinhaRanking.map(p=>[p.name,[p.name]])
];
function internetOperatorName(name){
 const normalized=normalizeCity(name).replace(/[^a-z0-9]+/g,' ').trim();
 if(/\b(consultoria|consultor|assessoria|marketing|publicidade|software|agencia|wifi do cliente|pmweb)\b/.test(normalized))return null;
 for(const [canonical,aliases] of internetOperatorAliases){
  for(const alias of aliases){const key=normalizeCity(alias).replace(/[^a-z0-9]+/g,' ').trim();
   if(normalized===key||normalized.startsWith(key+' '))return canonical;
  }
 }
 return null;
}
function filterInternetOperators(providers){
 const seen=new Set();
 return providers.filter(p=>{const name=internetOperatorName(p.name);if(!name||seen.has(name))return false;seen.add(name);return true;});
}
function coverageOperatorRows(data){
 if(data.country_code!=='BR'||!data.city)return [];
 const brands=[['Vivo','https://www.vivo.com.br/para-voce/produtos-e-servicos/para-casa/internet'],['Claro','https://www.claro.com.br/internet/banda-larga']];
 if(data.region_code==='RS')brands.push(['Sebratel','https://sebratel.com.br/']);
 return brands.map(([name,site])=>({name,site,cities:[data.city],coverageOnly:true,ra:'https://www.reclameaqui.com.br/busca/?q='+encodeURIComponent(name)}));
}
function selectNearbyProviders(data){
 if(Array.isArray(data.providers))return data.providers;
 if(data.country_code !== 'BR' || data.region_code !== 'RS' || !data.city)return [];
 if(normalizeCity(data.city)==='alvorada')return alvoradaRanking;
 if(normalizeCity(data.city)==='cachoeirinha'){const googleRows=nearbyProviders.filter(p=>p.cities.includes('Cachoeirinha')&&p.name!=='Vem pra Uno');return [...googleRows,...cachoeirinhaRanking,{name:'Fênix Internet',cities:['Cachoeirinha'],site:cachoeirinhaRankingSource,source:cachoeirinhaRankingSource,ra:'https://www.reclameaqui.com.br/busca/?q=Fenix%20Internet',review:'Oferta localizada para Cachoeirinha; nota comparável ainda não confirmada.'}];}
 return nearbyProviders.filter(p=>p.cities.some(city=>normalizeCity(city)===normalizeCity(data.city))).sort((a,b)=>(rankingValue(b)??-1)-(rankingValue(a)??-1)||a.name.localeCompare(b.name,'pt-BR'));
}
function renderNearbyProviders(data){
 const list=document.getElementById('providersList');list.dataset.city=data.city||'';list.dataset.region=data.region_code||'';list.dataset.country=data.country_code||'';delete list.dataset.discoveryCity;list._rankingCards=null;list.replaceChildren();
 document.getElementById('providerCoverageOptions')?.remove();
 const rows=[...selectNearbyProviders(data)];
 for(const brand of coverageOperatorRows(data)){if(!rows.some(p=>(internetOperatorName(p.name)||p.name)===brand.name))rows.push(brand);}
 document.getElementById('providersLocation').textContent=data.city?`Cidade estimada: ${data.city}${data.region_code?' / '+data.region_code:''}`:'Cidade não identificada';
 if(!rows.length){const message=document.createElement('p');message.textContent=data.country_code==='BR'?'Consulta automática de operadoras disponível para esta cidade. Aguardando o Google Maps…':'Ainda não temos provedores pesquisados para essa cidade.';list.append(message);return;}
 const heading=document.createElement('h3');heading.textContent=rows.some(p=>Number.isFinite(p.score))?'Operadoras e avaliações na região':`Melhores notas disponíveis · ${rows.filter(p=>rankingValue(p)!==null).length} provedores`;list.append(heading);
 const otherProviders=document.createElement('div');otherProviders.id='otherProviders';otherProviders.hidden=true;
 for(const rawProvider of rows){
  const provider={...rawProvider,...providerProfiles[rawProvider.name]};
  const card=document.createElement('article');card.className='provider-card';card.dataset.provider=provider.name;if(provider.coverageOnly)card.dataset.coverageOnly='true';const initialGoogle=providerReputation[provider.name]?.google?.match(/^(\d+(?:,\d+)?) \/ 5/);if(Number.isFinite(provider.googleRating)){card.dataset.googleRating=provider.googleRating;card.dataset.googleCount=provider.googleCount||0;}
  const title=document.createElement('h3');const rating=rankingValue(provider);title.textContent=rating!==null?`${rows.indexOf(rawProvider)+1}º · ${provider.name} · ${rating.toLocaleString('pt-BR')}/5 · ${Number.isFinite(provider.score)?'Minha Conexão':'Google'}`:`${provider.name} · sem classificação`;
  const review=document.createElement('p');review.textContent=provider.review;
  const checked=document.createElement('small');checked.textContent=provider.googleDetails?'Google Maps · consultado agora · confirmar cobertura':'Dados pesquisados até '+researchDate+' · confirmar cobertura';
  const links=document.createElement('div');links.className='provider-links';
  const google=provider.googleUrl||'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(provider.name+' '+data.city+' '+(data.region_code||''));
  for(const [label,url] of [['Consultar cobertura',provider.site],['Avaliações no Google',google],['Reclame Aqui',provider.ra]]){const a=document.createElement('a');a.textContent=label+' ↗';a.href=url;a.target='_blank';a.rel='noopener noreferrer';links.append(a);}
  const plans=document.createElement('div');plans.className='provider-plans';
  const planTitle=document.createElement('strong');planTitle.textContent='Planos de internet';plans.append(planTitle);
  const offer=provider.coverageOnly?null:providerPlans[provider.name];
  if(offer){const grid=document.createElement('div');grid.className='plan-mini-grid';for(const item of offer.items){const parts=item.split(' · ');const mini=document.createElement('div');mini.className='plan-mini';const speed=document.createElement('strong');speed.textContent=parts[0].replace('Mbps','Mega');const price=document.createElement('span');price.textContent=parts[1]||'Sob consulta';mini.append(speed,price);if(parts[2]){const detail=document.createElement('small');detail.textContent=parts.slice(2).join(' · ');mini.append(detail);}grid.append(mini);}if(offer.items.length)plans.append(grid);const conditions=document.createElement('small');conditions.textContent=offer.conditions+' Pesquisa: '+(offer.checked||'04/10/2026')+'. Ofertas podem mudar.';plans.append(conditions);}
  else {const p=document.createElement('p');p.textContent='Preço e velocidades ainda não confirmados. Consulte as ofertas disponíveis para seu endereço.';plans.append(p);}
  const planLink=document.createElement('a');planLink.textContent='Ver planos e condições ↗';planLink.href=offer?.source||provider.site;planLink.target='_blank';planLink.rel='noopener noreferrer';plans.append(planLink);
  const reputation=createReputationBadges(provider,google);
  const provenance=document.createElement('details');provenance.className='provider-provenance';const summary=document.createElement('summary');summary.textContent='Fontes e datas das avaliações';provenance.append(summary);const reputationData=providerReputation[provider.name];const explanation=document.createElement('p');explanation.textContent=provider.googleDetails?provider.googleDetails+' · Avaliações do estabelecimento; não medem diretamente a velocidade da conexão.':'Google: '+(reputationData?.googleDetail||'nota ainda não verificada para esta cidade')+'. Reclame Aqui: '+(reputationData?.raDetail||'reputação atual ainda não verificada')+'. Dados de pesquisa manual; não são atualizados em tempo real.';provenance.append(explanation);for(const attr of provider.googleAttributions||[]){if(!attr.providerUri)continue;const a=document.createElement('a');a.textContent=attr.provider||'Fonte';a.href=attr.providerUri;a.target='_blank';a.rel='noopener noreferrer';provenance.append(a);}
  if(Number.isFinite(provider.score))card.append(title,review,reputation,checked,plans,links,provenance);
  else card.append(title,reputation,checked,plans,links,provenance);if(rows.indexOf(rawProvider)===0)list.append(card);else {card.hidden=true;otherProviders.append(card);}
 }
 list.append(otherProviders);
 applyProviderRanking(list);
}
// Índice SpeedGate: média bayesiana com referência 3/5 e peso de 50 avaliações.
function weightedProviderScore(rating,count){return (rating*count+3*50)/(count+50);}
function providerCardScore(card){
 const raw=Number(card.dataset.googleRating),count=Number(card.dataset.googleCount);
 if(card.dataset.googleRating===undefined||!Number.isFinite(raw)||raw<1||raw>5)return null;
 const confirmed=Number.isInteger(count)&&count>0;
 return {score:confirmed?weightedProviderScore(raw,count):null,source:'Google',display:raw.toLocaleString('pt-BR',{maximumFractionDigits:1})+'/5',count:confirmed?count:null};
}
function applyProviderRanking(list){
 const cards=list._rankingCards||Array.from(list.querySelectorAll('.provider-card'));list._rankingCards=cards;
 const entries=cards.map(card=>({card,rating:providerCardScore(card)})).sort((a,b)=>(b.rating?.score??-Infinity)-(a.rating?.score??-Infinity)||(b.rating?.count??0)-(a.rating?.count??0)||a.card.dataset.provider.localeCompare(b.card.dataset.provider,'pt-BR'));
 list.querySelector('#otherProviders')?.remove();list.querySelector('.providers-expand')?.remove();
 const heading=list.querySelector('h3');if(heading)heading.textContent='Operadoras · '+cards.length+' opções';
 let position=0;
 for(const {card,rating} of entries){
  const ranked=rating?.score!=null;
  card.querySelector('h3').textContent=(ranked?(++position)+'º · ':'')+card.dataset.provider+(rating?' · '+rating.display+' · Google':' · sem avaliação local do Google confirmada');
  let summary=card.querySelector('.ranking-volume');if(!summary){summary=document.createElement('p');summary.className='ranking-volume';card.insertBefore(summary,card.children[1]);}
  summary.textContent=ranked?rating.count.toLocaleString('pt-BR')+' avaliações no Google · Índice SpeedGate: '+rating.score.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'/5':'Sem posição no ranking. Confirme a cobertura no seu endereço pelo site oficial.';
  card.hidden=false;list.append(card);
 }
 let note=list.querySelector('.rating-ranking-note');if(!note){note=document.createElement('p');note.className='rating-ranking-note';list.insertBefore(note,heading?.nextSibling||list.firstChild);}
 note.textContent='Prioridade pela nota e quantidade de avaliações do Google: (nota × quantidade + 3 × 50) ÷ (quantidade + 50). Assim, uma nota alta com poucas avaliações tem menos peso. Empresas sem nota e volume confirmados ficam ao final, sem posição. Avaliações não comprovam cobertura ou velocidade no seu endereço.';
}
