const providerLookupEnabled = true; // Ativar somente após autorização para consultar ipapi.co.
let connectionRequest;
loadConnectionInfo = function () {
    if (!providerLookupEnabled) { document.getElementById('providerName').textContent='Identificação pendente'; document.getElementById('publicIp').textContent='IP público: —'; return; }
    if (connectionRequest) connectionRequest.abort();
    const request = connectionRequest = new AbortController();
    const timeout = setTimeout(() => request.abort(), 8000);
    const name = document.getElementById('providerName');
    const ip = document.getElementById('publicIp');
    name.textContent = navigator.onLine ? 'Identificando…' : 'Sem conexão';
    ip.textContent = 'IP público: —';
    if (!navigator.onLine) { clearTimeout(timeout); return; }
    // Consulta feita pelo navegador: identifica o visitante, não o servidor de hospedagem.
    return fetch('https://ipapi.co/json/', {signal: request.signal, cache: 'no-store', credentials: 'omit'})
        .then(async response => {
            if (!response.ok) throw new Error('Consulta indisponível');
            const data = await response.json();
            if (data.error || typeof data.ip !== 'string') throw new Error('Resposta inválida');
            if (connectionRequest !== request) return;
            name.textContent = typeof data.org === 'string' && data.org.trim() ? data.org : 'Operadora não identificada';
            ip.textContent = `IP público: ${data.ip}`;
        })
        .catch(() => {
            if (connectionRequest !== request) return;
            name.textContent = navigator.onLine ? 'Operadora não identificada' : 'Sem conexão';
            ip.textContent = 'IP público: indisponível';
        })
        .finally(() => { clearTimeout(timeout); if (connectionRequest === request) connectionRequest = null; });
};
loadConnectionInfo();

