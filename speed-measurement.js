// Medição efetiva: 15 s de download e 15 s de upload, além da latência inicial.
window.runSpeedGatePhase = function(type, onResults, durationMs = 15000) {
    const latency = type === 'latency';
    const measurements = latency ? [{type:'latency',numPackets:12}] : [
        {type,bytes:65536,count:1,bypassMinDuration:true},
        {type,bytes:65536,count:100000,bypassMinDuration:true}
    ];
    const engine = new window.CloudflareSpeedTest({
        autoStart:false, measurements,
        bandwidthFinishRequestDuration:Infinity,
        logAimApiUrl:null, logMeasurementApiUrl:null
    });
    return new Promise((resolve,reject) => {
        let settled=false, payloadSized=false;
        const started=performance.now();
        const timer=setTimeout(()=>latency?finish(new Error('Tempo esgotado ao medir latência.')):finish(),latency?20000:durationMs);
        function finish(error){
            if(settled)return;settled=true;clearTimeout(timer);engine.pause();
            if(window.activeTimedSpeedGateEngine===engine)window.activeTimedSpeedGateEngine=null;
            error?reject(error):resolve(engine.results);
        }
        window.activeTimedSpeedGateEngine=engine;
        window.finishCancelledTest=()=>finish();
        engine.onError=error=>finish(new Error(String(error)));
        engine.onFinish=()=>{if(latency)finish();else finish(new Error('A etapa de velocidade terminou antes do tempo previsto.'));};
        engine.onResultsChange=({type:phase})=>{
            if(settled)return;
            if(!latency){
                const rate=type==='download'?engine.results.getDownloadBandwidth():engine.results.getUploadBandwidth();
                // Dimensiona as próximas transferências para ~0,75 s, sem multiplicar resultados.
                if(!payloadSized&&Number.isFinite(rate)&&rate>0){payloadSized=true;measurements[1].bytes=Math.min(25000000,Math.max(16384,Math.round(rate*0.75/8)));}
            }
            onResults(engine.results,phase,Math.min(15,Math.floor((performance.now()-started)/1000)));
        };
        engine.play();
    });
};
