let activeEngine = null;
let cancelled = false;
let loadedDown = null;
let loadedUp = null;
const cancelButton = document.getElementById('cancelTest');
setGauge = function (value) {
    const marks = [[0,7],[5,33],[10,58],[50,90],[100,125],[250,158],[500,188],[750,215],[1000,243]];
    const capped = Math.min(Math.max(value,0),1000);
    let degrees = 0;
    if(capped>0) {
        const upper = marks.findIndex(mark=>mark[0]>=capped);
        const [lowValue,lowAngle] = marks[Math.max(0,upper-1)];
        const [highValue,highAngle] = marks[upper];
        degrees = lowAngle+(capped-lowValue)/(highValue-lowValue)*(highAngle-lowAngle);
    }
    gauge.style.setProperty('--deg',`${degrees}deg`);
};
document.querySelector('.service-panel').remove();
loadConnectionInfo = function () {
    // O navegador não fornece os dados do adaptador Wi-Fi.
};
window.addEventListener('online', loadConnectionInfo);
window.addEventListener('offline', loadConnectionInfo);
loadConnectionInfo();
cancelButton.addEventListener('click', () => {
    cancelled = true;
    if (activeEngine) activeEngine.pause();
    if (window.finishCancelledTest) window.finishCancelledTest();
});
renderResultReport = function () {
    reportContent.innerHTML = `<div class="report-summary">${summaryCard('Download',finalDownloadSpeed,'Mbps','download-title')}${summaryCard('Upload',finalUploadSpeed,'Mbps','upload-title')}${summaryCard('Latência HTTP',finalPingValue,'ms','ping-title')}${summaryCard('Jitter',finalJitterValue,'ms','jitter-title')}${summaryCard('Latência com download',loadedDown,'ms','ping-title')}${summaryCard('Latência com upload',loadedUp,'ms','ping-title')}</div>`;
};
packetLossDetailCard = () => '<p class="web-caption">Perda de pacotes não medida: requer infraestrutura adicional de medição.</p>';
renderImprovementReport = function () {
    const template = document.getElementById('improvementTemplate');
    reportContent.replaceChildren(template.content.cloneNode(true));
};
startTest = async function () {
    if (running) return;
    document.getElementById('testNotice').hidden=true;
    if (!navigator.onLine) { statusText.textContent='Sem conexão'; return; }
    document.querySelector('.providers-panel').hidden=true;
    loadConnectionInfo();

    running=true; cancelled=false; startButton.disabled=true;
    cancelButton.hidden=false; buttonLabel.textContent='TESTANDO...'; resetTest();
    loadedDown=null; loadedUp=null; finalPingMethod='HTTP';
    try {
        {
            if(!window.CloudflareSpeedTest) throw new Error('Motor de medição indisponível.');
            const latencyResults=await window.runSpeedGatePhase('latency',r=>{
                finalPingValue=r.getUnloadedLatency();finalJitterValue=r.getUnloadedJitter();
                statusText.textContent='Medindo latência';
            });
            if(cancelled)return;
            finalPingValue=latencyResults.getUnloadedLatency();finalJitterValue=latencyResults.getUnloadedJitter();
            const updatePhase=type=>(r,phase)=>{
                const value=(type==='download'?r.getDownloadBandwidth():r.getUploadBandwidth())/1e6;
                if(Number.isFinite(value)&&value>0)updateSpeed(value,type==='download'?download:upload,type==='download'?'Download':'Upload',type);
                statusText.textContent=type==='download'?'Download':'Upload';
            };
            const downResults=await window.runSpeedGatePhase('download',updatePhase('download'));
            if(cancelled)return;
            const upResults=await window.runSpeedGatePhase('upload',updatePhase('upload'));
            if(cancelled)return;
            finalDownloadSpeed=downResults.getDownloadBandwidth()/1e6;
            finalUploadSpeed=upResults.getUploadBandwidth()/1e6;
            loadedDown=downResults.getDownLoadedLatency();loadedUp=upResults.getUpLoadedLatency();
            testHistory.download=downResults.getDownloadBandwidthPoints().map(p=>p.bps/1e6);
            testHistory.upload=upResults.getUploadBandwidthPoints().map(p=>p.bps/1e6);
            testHistory.ping=latencyResults.getUnloadedLatencyPoints();
            testHistory.jitter=testHistory.ping.slice(1).map((p,i)=>Math.abs(p-testHistory.ping[i]));
            if(![finalDownloadSpeed,finalUploadSpeed,finalPingValue,finalJitterValue].every(Number.isFinite))throw new Error('Amostras insuficientes. Repita o teste.');
        }
        if(cancelled) return;
        setVisualTarget('download',finalDownloadSpeed);setVisualTarget('upload',finalUploadSpeed);
        setVisualTarget('ping',finalPingValue);setVisualTarget('jitter',finalJitterValue);
        showMainSpeed(finalDownloadSpeed,'Teste concluído');
        saveMeasurementHistory();
        showReport('result');
        document.querySelector('.providers-panel').hidden=false;
    } catch(error) {statusText.textContent='Teste não concluído';document.getElementById('testNotice').textContent=error.message;document.getElementById('testNotice').hidden=false;}
    finally {running=false;activeEngine=null;window.finishCancelledTest=null;startButton.disabled=false;cancelButton.hidden=true;buttonLabel.textContent='INICIAR TESTE';if(cancelled)statusText.textContent='Teste cancelado';}
};
