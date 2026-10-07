// Medição efetiva: 15 s de download e 15 s de upload, além da latência inicial.
window.runSpeedGatePhase = function(type, onResults, durationMs = 15000) {
    const latency = type === 'latency';
    const measurements = latency ? [{type:'latency',numPackets:12}] : [
        {type,bytes:100000,count:1,bypassMinDuration:true},
        {type,bytes:1000000,count:2,bypassMinDuration:true},
        {type,bytes:10000000,count:2,bypassMinDuration:true},
        {type,bytes:25000000,count:100000,bypassMinDuration:true}
    ];
    const engine = new window.CloudflareSpeedTest({
        autoStart:false, measurements,
        bandwidthFinishRequestDuration:Infinity,
        logAimApiUrl:null, logMeasurementApiUrl:null
    });
    return new Promise((resolve,reject) => {
        let settled=false;
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
            onResults(engine.results,phase);
        };
        engine.play();
    });
};
