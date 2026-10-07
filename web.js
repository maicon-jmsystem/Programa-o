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
            await new Promise((resolve,reject) => {
                const engine=activeEngine=new window.CloudflareSpeedTest({autoStart:false,measurements:[
                    {type:'latency',numPackets:12},
                    ...[1e5,1e6,1e7,2.5e7].map(bytes=>({type:'download',bytes,count:3})),
                    ...[1e5,1e6,1e7,2.5e7].map(bytes=>({type:'upload',bytes,count:2}))
                ]});
                const timeout=setTimeout(()=>{engine.pause();reject(new Error('Tempo esgotado. Tente novamente.'));},120000);
                window.finishCancelledTest=()=>{clearTimeout(timeout);resolve();};
                engine.onResultsChange=({type})=>{
                    if(cancelled) return;
                    const r=engine.results;
                    const val=type==='download'?r.getDownloadBandwidth()/1e6:type==='upload'?r.getUploadBandwidth()/1e6:0;
                    if(Number.isFinite(val)&&val>0) updateSpeed(val,type==='download'?download:upload,type==='download'?'Download':'Upload',type);
                    finalPingValue=r.getUnloadedLatency(); finalJitterValue=r.getUnloadedJitter();
                    statusText.textContent=type==='latency'?'Medindo latência':type==='download'?'Download':'Upload';
                };
                engine.onError=error=>{clearTimeout(timeout);engine.pause();reject(new Error(String(error)));};
                engine.onFinish=r=>{
                    clearTimeout(timeout);
                    finalDownloadSpeed=r.getDownloadBandwidth()/1e6; finalUploadSpeed=r.getUploadBandwidth()/1e6;
                    finalPingValue=r.getUnloadedLatency();finalJitterValue=r.getUnloadedJitter();
                    loadedDown=r.getDownLoadedLatency();loadedUp=r.getUpLoadedLatency();
                    testHistory.download=r.getDownloadBandwidthPoints().map(p=>p.bps/1e6);
                    testHistory.upload=r.getUploadBandwidthPoints().map(p=>p.bps/1e6);
                    testHistory.ping=r.getUnloadedLatencyPoints();
                    testHistory.jitter=testHistory.ping.slice(1).map((p,i)=>Math.abs(p-testHistory.ping[i]));
                    if(![finalDownloadSpeed,finalUploadSpeed,finalPingValue,finalJitterValue].every(Number.isFinite)) reject(new Error('Amostras insuficientes. Repita o teste.'));
                    else resolve();
                };
                engine.play();
            });
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
