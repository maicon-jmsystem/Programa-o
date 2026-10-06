function resolveMunicipality(data) {
 const isCity = name => typeof name==='string' && name.trim() && !/regi[aã]o|metropolitan|microrregi|mesorregi/i.test(name);
 const administrative = data.localityInfo?.administrative || [];
 const municipality = administrative.find(entry=>Number(entry.adminLevel)===8 && isCity(entry.name));
 if(municipality)return municipality.name.trim();
 if(isCity(data.city))return data.city.trim();
 // Uma localidade isolada pode ser bairro; não tratá-la automaticamente como município.
 return null;
}
const locationButton = document.getElementById('enableLocation');
const renderProvidersForCity = renderNearbyProviders;
let lastIpLocation;
window.deviceLocationActive = false;
renderNearbyProviders = function(data) {
    lastIpLocation = data;
    if (!window.deviceLocationActive) renderProvidersForCity(data);
};
async function requestDeviceLocation() {
    const message = document.getElementById('providersLocation');
    if (!navigator.geolocation || !window.isSecureContext) {
        message.textContent = 'Localização indisponível. Abra o site em HTTPS e verifique as permissões do navegador.';
        return;
    }
    if(locationButton) locationButton.disabled = true;
    window.deviceLocationActive = true;
    message.textContent = 'Aguardando autorização da localização…';
    try {
        const position = await new Promise((resolve,reject) => navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,timeout:15000,maximumAge:0}));
        message.textContent = 'Identificando a cidade pela localização…';
        const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
        url.search = new URLSearchParams({latitude:position.coords.latitude,longitude:position.coords.longitude,localityLanguage:'pt'});
        const response = await fetch(url,{credentials:'omit',signal:AbortSignal.timeout(10000)});
        if (!response.ok) throw new Error('Não foi possível consultar a cidade.');
        const data = await response.json();
        const municipality = resolveMunicipality(data);
        if (!data.countryCode || !municipality) throw new Error('Cidade não identificada pela localização.');
        const region = String(data.principalSubdivisionCode || '').split('-').at(-1);
        renderProvidersForCity({city:municipality,region_code:region,country_code:data.countryCode});
        message.textContent = `Localização do dispositivo: ${municipality} / ${region} · precisão aproximada: ${Math.round(position.coords.accuracy)} m`;
        if(locationButton) locationButton.textContent = 'Atualizar localização';
    } catch(error) {
        window.deviceLocationActive = false;
        if (lastIpLocation) renderProvidersForCity(lastIpLocation);
        const reason = error.message==='Cidade não identificada pela localização.' ? 'O GPS retornou apenas a região, sem identificar o município.' : error.code===1 ? 'Permissão negada.' : error.code===3 ? 'Tempo esgotado ao obter localização.' : 'Não foi possível identificar sua localização.';
        message.textContent = reason + (lastIpLocation?.city ? ` Mantida a estimativa pelo IP: ${lastIpLocation.city}.` : ' Tente novamente.');
    } finally { if(locationButton) locationButton.disabled = false; }
}
locationButton?.addEventListener('click', requestDeviceLocation);
window.requestDeviceLocation = requestDeviceLocation;

// Solicita a permissão ao acessar o site; o teste não repete o pedido.
requestDeviceLocation();
