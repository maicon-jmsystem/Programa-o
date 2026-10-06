/**
 * SpeedGate
 * Copyright (c) 2026 Maicon da Fonseca da Silva.
 * Código-fonte proprietário. Todos os direitos reservados.
 */
const speed = document.getElementById("speed");
const ping = document.getElementById("ping");
const jitter = document.getElementById("jitter");
const download = document.getElementById("download");
const upload = document.getElementById("upload");
const statusText = document.getElementById("status");
const gauge = document.querySelector(".gauge");
const startButton = document.querySelector(".start-button");
const buttonLabel = document.getElementById("buttonLabel");
const networkBand = document.getElementById("networkBand");
const networkStatus = document.getElementById("networkStatus");
const connectionType = document.getElementById("connectionType");
const connectionQuality = document.getElementById("connectionQuality");
const networkIcon = document.getElementById("networkIcon");
const connectionIcon = document.getElementById("connectionIcon");
const wifiDetailsCard = document.getElementById("wifiDetailsCard");
const wifiSignalDbm = document.getElementById("wifiSignalDbm");
const wifiSignalPercent = document.getElementById("wifiSignalPercent");
const wifiChannel = document.getElementById("wifiChannel");
const wifiBandDetail = document.getElementById("wifiBandDetail");
const wifiFrequency = document.getElementById("wifiFrequency");
const servicePingList = document.getElementById("servicePingList");
const outageList = document.getElementById("outageList");
const reportPanel = document.getElementById("reportPanel");
const reportContent = document.getElementById("reportContent");
const reportTabs = document.querySelectorAll(".report-tab");
const panelToggles = document.querySelectorAll(".panel-toggle");
const appShell = document.querySelector(".app-shell");
const historyPanel = document.getElementById("historyPanel");
const historyList = document.getElementById("historyList");
const clearHistoryButton = document.getElementById("clearHistoryButton");
const viewSwitchButtons = document.querySelectorAll(".view-switch-button");
const androidApiButton = document.getElementById("androidApiButton");

const TEST_SERVER = "https://speed.cloudflare.com";
const HISTORY_STORAGE_KEY = "speedgate-web-history-v1";
const MAX_SAVED_TESTS = 30;
const MAX_GAUGE_SPEED = 1000;
const GAUGE_DEGREES = 250;
const SERVICE_PING_TARGETS = [
    { name: "Facebook", host: "facebook.com" },
    { name: "Instagram", host: "instagram.com" },
    { name: "TikTok", host: "tiktok.com" },
    { name: "WhatsApp", host: "whatsapp.com" },
    { name: "YouTube", host: "youtube.com" },
    { name: "Cloudflare", host: "cloudflare.com" },
    { name: "Google DNS", host: "8.8.8.8" },
    { name: "Prime Video", host: "primevideo.com" },
    { name: "Google Play", host: "play.google.com" },
    { name: "Disney+", host: "disneyplus.com" },
    { name: "Spotify", host: "spotify.com" },
    { name: "Banco do Brasil", host: "bb.com.br" },
    { name: "Itau", host: "itau.com.br" },
    { name: "Santander", host: "santander.com.br" },
    { name: "Nubank", host: "nubank.com.br" }
];

const PING_ROUNDS = 18;
const PING_WARMUP_ROUNDS = 3;
const PING_TIMEOUT_MS = 3000;
const DOWNLOAD_PARALLEL = 12;
const DOWNLOAD_CHUNK_SIZE = 75 * 1024 * 1024;
const DOWNLOAD_DURATION_MS = 17000;
const DOWNLOAD_WARMUP_MS = 2500;
const UPLOAD_PARALLEL = 6;
const UPLOAD_CHUNK_SIZE = 4 * 1024 * 1024;
const UPLOAD_DURATION_MS = 14000;
const UPLOAD_WARMUP_MS = 2200;
const SAMPLE_INTERVAL_MS = 200;
const VISUAL_SMOOTHING_MS = 520;

let running = false;
let finalDownloadSpeed = 0;
let finalUploadSpeed = 0;
let finalPingValue = 0;
let finalJitterValue = 0;
let finalIcmpPingValue = null;
let finalPacketLossValue = null;
let packetLossReference = "";
let finalPingMethod = "ICMP";
let visualFrame = null;
let lastVisualAt = 0;
let activeReportTab = "result";
let latestServicePingResults = [];
let latestOfficialOutageResults = [];
let latestOfficialOutageAt = 0;
let nativeCallSequence = 0;
const nativeCallResolvers = new Map();

window.__resolveNativeCall = (callbackId, result) => {
    const pending = nativeCallResolvers.get(callbackId);
    if (!pending) {
        return;
    }
    clearTimeout(pending.timeout);
    nativeCallResolvers.delete(callbackId);
    pending.resolve(result);
};

window.__nativeProgress = (callbackId, value) => {
    const pending = nativeCallResolvers.get(callbackId);
    if (pending && typeof pending.onProgress === "function") {
        pending.onProgress(Number(value) || 0);
    }
};

function callAndroidAsync(methodName, timeoutMs = 45000, onProgress = null) {
    return new Promise((resolve, reject) => {
        if (!window.SpeedGateAndroid || typeof window.SpeedGateAndroid[methodName] !== "function") {
            reject(new Error(`Recurso Android indisponível: ${methodName}`));
            return;
        }

        const callbackId = `native-${Date.now()}-${++nativeCallSequence}`;
        const timeout = setTimeout(() => {
            nativeCallResolvers.delete(callbackId);
            reject(new Error(`Tempo esgotado: ${methodName}`));
        }, timeoutMs);
        nativeCallResolvers.set(callbackId, { resolve, reject, timeout, onProgress });

        try {
            window.SpeedGateAndroid[methodName](callbackId);
        } catch (error) {
            clearTimeout(timeout);
            nativeCallResolvers.delete(callbackId);
            reject(error);
        }
    });
}

function getApiBaseUrl() {
    try {
        if (window.SpeedGateAndroid && typeof window.SpeedGateAndroid.getApiBaseUrl === "function") {
            return String(window.SpeedGateAndroid.getApiBaseUrl() || "").replace(/\/$/, "");
        }
    } catch (error) {
        console.warn("API Android indisponível", error);
    }

    return "";
}

function apiUrl(path) {
    return `${getApiBaseUrl()}${path}`;
}

function getAndroidConnectionInfo() {
    try {
        if (!window.SpeedGateAndroid || typeof window.SpeedGateAndroid.getConnectionInfo !== "function") {
            return null;
        }

        const value = JSON.parse(window.SpeedGateAndroid.getConnectionInfo());
        return value && typeof value === "object" ? value : null;
    } catch (error) {
        console.warn("Leitura nativa de rede indisponível", error);
        return null;
    }
}

const testHistory = {
    download: [],
    upload: [],
    ping: [],
    jitter: []
};

const visualValues = {
    main: { current: 0, target: 0, element: speed },
    ping: { current: 0, target: 0, element: ping },
    jitter: { current: 0, target: 0, element: jitter },
    download: { current: 0, target: 0, element: download },
    upload: { current: 0, target: 0, element: upload }
};



if (androidApiButton && window.SpeedGateAndroid && typeof window.SpeedGateAndroid.configureApi === "function") {
    androidApiButton.hidden = false;
    androidApiButton.addEventListener("click", () => window.SpeedGateAndroid.configureApi());
}

if (navigator.connection && typeof navigator.connection.addEventListener === "function") {
    navigator.connection.addEventListener("change", () => loadConnectionInfo());
}

reportTabs.forEach(tab => {
    tab.addEventListener("click", () => {
        setReportTab(tab.dataset.reportTab);
    });
});

panelToggles.forEach(toggle => {
    toggle.addEventListener("click", () => {
        const panel = toggle.closest(".collapsible-panel");
        const willExpand = panel.classList.contains("is-collapsed");

        panel.classList.toggle("is-collapsed", !willExpand);
        toggle.setAttribute("aria-expanded", String(willExpand));
        toggle.setAttribute(
            "aria-label",
            `${willExpand ? "Recolher" : "Expandir"} ${panel.id === "pingPanel" ? "teste de ping" : "Downdetector"}`
        );
    });
});

viewSwitchButtons.forEach(button => {
    button.addEventListener("click", () => setAppView(button.dataset.view));
});

clearHistoryButton.addEventListener("click", () => {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    renderSavedHistory();
});

historyList.addEventListener("click", event => {
    const toggle = event.target.closest(".history-item-toggle");

    if (!toggle) {
        return;
    }

    const card = toggle.closest(".history-card");
    const willExpand = card.classList.contains("is-collapsed");

    card.classList.toggle("is-collapsed", !willExpand);
    toggle.setAttribute("aria-expanded", String(willExpand));
    toggle.setAttribute("aria-label", `${willExpand ? "Fechar" : "Abrir"} medição de ${toggle.dataset.historyDate}`);
});

async function startTest() {
    if (running) {
        return;
    }

    running = true;
    startButton.disabled = true;
    buttonLabel.innerText = "TESTANDO...";

    resetTest();

    try {
        await measurePing();
        finalDownloadSpeed = await measureDownload();
        finalUploadSpeed = await measureUpload();
        renderServicePingLoading();
        await loadServicePings();

        showMainSpeed(finalUploadSpeed, "Upload final");
        setVisualTarget("download", finalDownloadSpeed);
        setVisualTarget("upload", finalUploadSpeed);
        saveMeasurementHistory();
        showReport("result");
    } catch (error) {
        console.error(error);
        statusText.innerText = "Erro no teste";
    } finally {
        running = false;
        startButton.disabled = false;
        buttonLabel.innerText = "INICIAR TESTE";
    }
}

function setAppView(viewName) {
    const showHistory = viewName === "history";

    appShell.classList.toggle("is-history-view", showHistory);
    historyPanel.classList.toggle("is-hidden", !showHistory);

    viewSwitchButtons.forEach(button => {
        const isActive = button.dataset.view === viewName;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });

    if (showHistory) {
        renderSavedHistory();
    }
}

function saveMeasurementHistory() {
    const measurements = readMeasurementHistory();
    const measurement = {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        download: finalDownloadSpeed,
        upload: finalUploadSpeed,
        latency: finalPingValue,
        jitter: finalJitterValue,
        icmpPing: finalIcmpPingValue,
        pingMethod: finalPingMethod,
        packetLoss: finalPacketLossValue, loadedDown, loadedUp
    };

    measurements.unshift(measurement);

    try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(measurements.slice(0, MAX_SAVED_TESTS)));
    } catch (error) {
        console.warn("Não foi possível salvar o histórico", error);
    }
}

function readMeasurementHistory() {
    try {
        const saved = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || "[]");
        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        return [];
    }
}

function renderSavedHistory() {
    const measurements = readMeasurementHistory();

    if (measurements.length === 0) {
        historyList.innerHTML = `
            <div class="history-empty">
                <strong>Nenhuma medição salva</strong>
                <span>Conclua um teste para registrar data, hora e resultados.</span>
            </div>
        `;
        clearHistoryButton.disabled = true;
        return;
    }

    clearHistoryButton.disabled = false;
    historyList.innerHTML = measurements.map(measurement => {
        const measuredAt = new Date(measurement.createdAt);
        const date = measuredAt.toLocaleDateString("pt-BR");
        const time = measuredAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

        return `
            <article class="history-card is-collapsed">
                <div class="history-card-header">
                    <strong>${escapeHtml(date)}</strong>
                    <div class="history-card-time">
                        <span>${escapeHtml(time)}</span>
                        <button class="history-item-toggle" type="button" aria-expanded="false" aria-controls="history-results-${measurement.id}" aria-label="Abrir medição de ${escapeHtml(date)} às ${escapeHtml(time)}" data-history-date="${escapeHtml(date)} às ${escapeHtml(time)}">
                            <span class="toggle-chevron" aria-hidden="true"></span>
                        </button>
                    </div>
                </div>
                <div class="history-results" id="history-results-${measurement.id}">
                    ${historyResult("Download", measurement.download, "Mbps", "download-title")}
                    ${historyResult("Upload", measurement.upload, "Mbps", "upload-title")}
                    ${historyResult("Latência com download", measurement.loadedDown, "ms", "ping-title")}
                    ${historyResult("Latência", measurement.latency, "ms", "ping-title")}
                    ${historyResult("Jitter", measurement.jitter, "ms", "jitter-title")}
                    ${historyResult("Latência com upload", measurement.loadedUp, "ms", "ping-title")}
                </div>
            </article>
        `;
    }).join("");
}

function historyResult(label, value, unit, colorClass) {
    const hasValue = Number.isFinite(value);

    return `
        <div class="history-result">
            <span class="${colorClass}">${escapeHtml(label)}</span>
            <strong>${hasValue ? Math.round(value) : "N/D"}<small>${hasValue ? ` ${unit}` : ""}</small></strong>
        </div>
    `;
}

function resetTest() {
    finalDownloadSpeed = 0;
    finalUploadSpeed = 0;
    finalPingValue = 0;
    finalJitterValue = 0;
    finalIcmpPingValue = null;
    finalPacketLossValue = null;
    packetLossReference = "";
    finalPingMethod = "ICMP";

    Object.keys(testHistory).forEach(key => {
        testHistory[key] = [];
    });

    resetVisualValues();
    statusText.innerText = "Iniciando";
    reportPanel.classList.add("is-hidden");

}

async function measurePing() {
    statusText.innerText = "Ping";

    if (window.SpeedGateAndroid && typeof window.SpeedGateAndroid.measurePingAsync === "function") {
        let nativeResult = await callAndroidAsync("measurePingAsync", 30000);
        if (!nativeResult || !nativeResult.ok) {
            await wait(350);
            nativeResult = await callAndroidAsync("measurePingAsync", 30000);
        }
        if (!nativeResult.ok || !Number.isFinite(nativeResult.latency)) {
            throw new Error("Nao foi possivel medir o ping nativo");
        }

        finalPingValue = nativeResult.latency;
        finalJitterValue = Number(nativeResult.jitter) || 0;
        finalIcmpPingValue = nativeResult.latency;
        finalPacketLossValue = Number(nativeResult.loss) || 0;
        finalPingMethod = "TCP";
        packetLossReference = "Cloudflare TCP:443";
        testHistory.ping = Array.isArray(nativeResult.samples) ? nativeResult.samples : [nativeResult.latency];
        testHistory.jitter = [finalJitterValue];
        setVisualTarget("ping", finalPingValue);
        setVisualTarget("jitter", finalJitterValue);
        return;
    }

    const samples = [];

    for (let i = 0; i < PING_ROUNDS; i++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
        const startedAt = performance.now();

        try {
            const response = await fetch(`${TEST_SERVER}/__down?bytes=0&t=${Date.now()}-${i}`, {
                cache: "no-store",
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`Ping HTTP ${response.status}`);
            }

            await response.arrayBuffer();
            samples.push(performance.now() - startedAt);
        } catch (error) {
            if (error.name !== "AbortError") {
                console.warn("Amostra de ping descartada", error);
            }
        } finally {
            clearTimeout(timeout);
        }

        await wait(100);
    }

    const measuredSamples = samples.slice(PING_WARMUP_ROUNDS);
    const stableSamples = filterPingOutliers(measuredSamples);

    if (stableSamples.length < 3) {
        throw new Error("Nao foi possivel obter amostras suficientes de ping");
    }

    const pingValue = median(stableSamples);
    const jitterSamples = stableSamples.slice(1).map((sample, index) => {
        return Math.abs(sample - stableSamples[index]);
    });
    const jitterValue = average(jitterSamples);

    finalPingValue = pingValue;
    finalJitterValue = jitterValue;
    testHistory.ping = stableSamples;
    testHistory.jitter = jitterSamples;

    setVisualTarget("ping", pingValue);
    setVisualTarget("jitter", jitterValue);
}

function filterPingOutliers(samples) {
    if (samples.length < 5) {
        return samples;
    }

    const medianValue = median(samples);
    const deviations = samples.map(sample => Math.abs(sample - medianValue));
    const mad = median(deviations);

    if (mad === 0) {
        return samples;
    }

    const limit = mad * 3.5;
    const filtered = samples.filter(sample => Math.abs(sample - medianValue) <= limit);

    return filtered.length >= 3 ? filtered : samples;
}

async function measureDownload() {
    statusText.innerText = "Download";

    if (window.SpeedGateAndroid && typeof window.SpeedGateAndroid.measureDownloadAsync === "function") {
        const renderProgress = value => updateSpeed(value, download, "Download", "download");
        let nativeResult = await callAndroidAsync("measureDownloadAsync", 35000, renderProgress);
        let nativeSpeed = Number(nativeResult && nativeResult.value);
        if (!Number.isFinite(nativeSpeed) || nativeSpeed <= 0) {
            await wait(350);
            nativeResult = await callAndroidAsync("measureDownloadAsync", 35000, renderProgress);
            nativeSpeed = Number(nativeResult && nativeResult.value);
        }
        if (!Number.isFinite(nativeSpeed) || nativeSpeed <= 0) {
            throw new Error("Falha no download nativo");
        }
        updateSpeed(nativeSpeed, download, "Download", "download");
        return nativeSpeed;
    }

    const result = await measureParallelTransfer({
        durationMs: DOWNLOAD_DURATION_MS,
        warmupMs: DOWNLOAD_WARMUP_MS,
        parallel: DOWNLOAD_PARALLEL,
        worker: downloadWorker,
        onProgress: value => {
            updateSpeed(value, download, "Download", "download");
        }
    });

    updateSpeed(result, download, "Download", "download");

    return result;
}

async function downloadWorker(workerId, endAt, addBytes) {
    while (performance.now() < endAt) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), Math.max(1, endAt - performance.now()));

        try {
            const response = await fetch(
                `${TEST_SERVER}/__down?bytes=${DOWNLOAD_CHUNK_SIZE}&t=${Date.now()}-${workerId}`,
                {
                    cache: "no-store",
                    signal: controller.signal
                }
            );

            if (!response.ok || !response.body) {
                throw new Error("Falha no download");
            }

            const reader = response.body.getReader();

            while (performance.now() < endAt) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                addBytes(value.length);
            }

            await reader.cancel().catch(() => {});
        } catch (error) {
            if (error.name !== "AbortError") {
                throw error;
            }
        } finally {
            clearTimeout(timeout);
        }
    }
}

async function measureUpload() {
    statusText.innerText = "Upload";

    if (window.SpeedGateAndroid && typeof window.SpeedGateAndroid.measureUploadAsync === "function") {
        const renderProgress = value => updateSpeed(value, upload, "Upload", "upload");
        let nativeResult = await callAndroidAsync("measureUploadAsync", 35000, renderProgress);
        let nativeSpeed = Number(nativeResult && nativeResult.value);
        if (!Number.isFinite(nativeSpeed) || nativeSpeed <= 0) {
            await wait(350);
            nativeResult = await callAndroidAsync("measureUploadAsync", 35000, renderProgress);
            nativeSpeed = Number(nativeResult && nativeResult.value);
        }
        if (!Number.isFinite(nativeSpeed) || nativeSpeed <= 0) {
            throw new Error("Falha no upload nativo");
        }
        updateSpeed(nativeSpeed, upload, "Upload", "upload");
        return nativeSpeed;
    }

    const payload = makePayload(UPLOAD_CHUNK_SIZE);

    const result = await measureParallelTransfer({
        durationMs: UPLOAD_DURATION_MS,
        warmupMs: UPLOAD_WARMUP_MS,
        parallel: UPLOAD_PARALLEL,
        worker: (workerId, endAt, addBytes) => uploadWorker(workerId, endAt, addBytes, payload),
        onProgress: value => {
            updateSpeed(value, upload, "Upload", "upload");
        }
    });

    updateSpeed(result, upload, "Upload", "upload");

    return result;
}

async function uploadWorker(workerId, endAt, addBytes, payload) {
    while (performance.now() < endAt) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);

        try {
            await fetch(`${TEST_SERVER}/__up?t=${Date.now()}-${workerId}`, {
                method: "POST",
                cache: "no-store",
                mode: "no-cors",
                body: payload,
                signal: controller.signal
            });

            addBytes(payload.length);
        } catch (error) {
            if (error.name !== "AbortError") {
                throw error;
            }
        } finally {
            clearTimeout(timeout);
        }
    }
}

async function measureParallelTransfer({ durationMs, warmupMs, parallel, worker, onProgress }) {
    let totalBytes = 0;
    let previousBytes = 0;
    let previousSampleAt = 0;
    const startedAt = performance.now();
    const endAt = startedAt + durationMs;
    let finishedAt = startedAt;
    const samples = [];

    const addBytes = bytes => {
        totalBytes += bytes;
    };

    const progressTimer = setInterval(() => {
        const now = performance.now();
        const elapsedMs = now - startedAt;
        const sampleBytes = totalBytes - previousBytes;
        const sampleSeconds = (now - previousSampleAt) / 1000;
        const sampleSpeed = bytesToMbps(sampleBytes, sampleSeconds);

        previousBytes = totalBytes;
        previousSampleAt = now;

        if (elapsedMs >= warmupMs && sampleSpeed > 0) {
            samples.push(sampleSpeed);
            onProgress(stableTransferResult(samples));
        } else {
            onProgress(bytesToMbps(totalBytes, elapsedSeconds(startedAt)));
        }
    }, SAMPLE_INTERVAL_MS);

    try {
        previousSampleAt = performance.now();

        await Promise.all(
            Array.from({ length: parallel }, (_, index) => worker(index, endAt, addBytes))
        );

        finishedAt = performance.now();
    } finally {
        clearInterval(progressTimer);
    }

    if (samples.length === 0) {
        return bytesToMbps(totalBytes, (finishedAt - startedAt) / 1000);
    }

    return stableTransferResult(samples);
}

function updateSpeed(value, target, label, type) {
    const safeValue = Math.max(0, value);

    if (testHistory[type]) {
        testHistory[type].push(safeValue);
    }

    setVisualTarget(type, safeValue);
    showMainSpeed(safeValue, label);
}

function showMainSpeed(value, label) {
    const speedValue = Math.max(0, value);

    statusText.innerText = label;
    setVisualTarget("main", speedValue);
}

function setGauge(value) {
    const cappedValue = Math.min(value, MAX_GAUGE_SPEED);
    const deg = (cappedValue / MAX_GAUGE_SPEED) * GAUGE_DEGREES;

    gauge.style.setProperty("--deg", `${deg}deg`);
}

function resetVisualValues() {
    Object.values(visualValues).forEach(item => {
        item.current = 0;
        item.target = 0;
        item.element.innerText = "0";
    });

    setGauge(0);
}

function setVisualTarget(key, value) {
    const item = visualValues[key];

    if (!item) {
        return;
    }

    item.target = Math.max(0, value);
    startVisualLoop();
}

function startVisualLoop() {
    if (visualFrame) {
        return;
    }

    lastVisualAt = performance.now();
    visualFrame = requestAnimationFrame(updateVisualValues);
}

function updateVisualValues(now) {
    const elapsed = Math.max(16, now - lastVisualAt);
    const alpha = 1 - Math.exp(-elapsed / VISUAL_SMOOTHING_MS);
    let hasMovement = false;

    lastVisualAt = now;

    Object.values(visualValues).forEach(item => {
        const diff = item.target - item.current;

        if (Math.abs(diff) < .35) {
            item.current = item.target;
        } else {
            item.current += diff * alpha;
            hasMovement = true;
        }

        item.element.innerText = Math.round(item.current);
    });

    setGauge(visualValues.main.current);

    if (hasMovement) {
        visualFrame = requestAnimationFrame(updateVisualValues);
        return;
    }

    visualFrame = null;
}

async function loadConnectionInfo() {
    const androidConnection = getAndroidConnectionInfo();

    if (androidConnection && androidConnection.connected) {
        renderConnectionInfo(androidConnection);
        return;
    }

    try {
        const response = await fetch(apiUrl(`/api/connection?t=${Date.now()}`), {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Falha ao detectar conexão");
        }

        const serverConnection = await response.json();
        const connection = mergeBrowserConnectionInfo(serverConnection);

        renderConnectionInfo(connection);
    } catch (error) {
        renderConnectionInfo(mergeBrowserConnectionInfo({
            connected: navigator.onLine,
            type: navigator.onLine ? "unknown" : "offline",
            label: navigator.onLine ? "Rede" : "Offline",
            detail: navigator.onLine ? "Conectado" : "Sem rede",
            quality: navigator.onLine ? "Tipo não identificado" : "Desconectado",
            name: navigator.onLine ? "Internet" : "Sem conexão"
        }));
    }
}

function mergeBrowserConnectionInfo(serverConnection) {
    const browserConnection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const browserType = browserConnection && browserConnection.type;

    if (browserType === "cellular") {
        return {
            connected: navigator.onLine,
            type: "mobile",
            label: "Dados móveis",
            detail: "Rede celular",
            quality: browserConnection.effectiveType
                ? `Conexão ${browserConnection.effectiveType.toUpperCase()}`
                : "Conectado",
            name: "Internet móvel"
        };
    }

    if (browserType === "wifi" && (!serverConnection.connected || serverConnection.type === "unknown")) {
        return {
            ...serverConnection,
            connected: navigator.onLine,
            type: "wifi",
            label: "Wi-Fi",
            detail: "Wi-Fi",
            quality: "Banda não identificada"
        };
    }

    return serverConnection;
}

async function loadServicePings() {
    try {
        if (window.SpeedGateAndroid && typeof window.SpeedGateAndroid.getServicePingsAsync === "function") {
            const nativeServices = await callAndroidAsync("getServicePingsAsync", 45000);
            if (!Array.isArray(nativeServices) || nativeServices.length === 0) {
                throw new Error("Monitor Android sem resposta");
            }
            applyServicePingResults(nativeServices);
            return nativeServices;
        }

        const response = await fetch(apiUrl(`/api/service-pings?t=${Date.now()}`), {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Falha no teste de apps");
        }

        const services = await response.json();
        applyServicePingResults(services);
        return services;
    } catch (error) {
        servicePingList.innerHTML = `<div class="service-loading">Nao foi possivel medir os apps agora.</div>`;
        return [];
    }
}

function applyServicePingResults(services) {
        latestServicePingResults = services;
        const lossReference = services.find(service => service.name === "Cloudflare" && service.method === "ICMP" && service.ok)
            || services.find(service => service.name === "Google DNS" && service.method === "ICMP" && service.ok)
            || services.find(service => service.method === "ICMP" && service.ok)
            || services.find(service => service.ok);

        finalPacketLossValue = lossReference ? lossReference.loss : null;
        finalIcmpPingValue = lossReference ? lossReference.latency : null;
        packetLossReference = lossReference ? lossReference.name : "";
        if (lossReference && lossReference.method) {
            finalPingMethod = lossReference.method;
        }
        renderServicePings(services);
        if (window.SpeedGateAndroid && !getApiBaseUrl()) {
            renderAndroidOutageFallback();
        }
}

function setReportTab(tabName) {
    activeReportTab = tabName;

    reportTabs.forEach(tab => {
        tab.classList.toggle("is-active", tab.dataset.reportTab === tabName);
    });

    renderReportContent();
}

function showReport(tabName) {
    reportPanel.classList.remove("is-hidden");
    setReportTab(tabName);
}

function renderReportContent() {
    if (activeReportTab === "detail") {
        renderDetailReport();
        return;
    }

    if (activeReportTab === "improvements") {
        renderImprovementReport();
        return;
    }

    renderResultReport();
}

function renderResultReport() {
    reportContent.innerHTML = `
        <div class="report-summary">
            ${summaryCard("Download", finalDownloadSpeed, "Mbps", "download-title")}
            ${summaryCard("Upload", finalUploadSpeed, "Mbps", "upload-title")}
            ${summaryCard(`Ping ${finalPingMethod}`, finalIcmpPingValue, "ms", "ping-title")}
            ${summaryCard("Latência", finalPingValue, "ms", "ping-title")}
            ${summaryCard("Jitter", finalJitterValue, "ms", "jitter-title")}
            ${summaryCard("Perda de pacotes", finalPacketLossValue, "%", finalPacketLossValue > 0 ? "loss-title" : "download-title")}
        </div>
    `;
}

function summaryCard(label, value, unit, colorClass) {
    return `
        <article class="report-summary-card">
            <div class="report-label ${colorClass}">${label}</div>
            <div class="report-number">${Number.isFinite(value) ? Math.round(value) : "N/D"} <small>${Number.isFinite(value) ? unit : ""}</small></div>
        </article>
    `;
}

function renderDetailReport() {
    reportContent.innerHTML = `
        <div class="detail-stack">
            ${detailCard("Download", finalDownloadSpeed, "Mbps", testHistory.download, "download")}
            ${detailCard("Upload", finalUploadSpeed, "Mbps", testHistory.upload, "upload")}
            ${detailCard("Latência", finalPingValue, "ms", testHistory.ping, "ping")}
            ${detailCard("Jitter", finalJitterValue, "ms", testHistory.jitter, "jitter")}
            ${packetLossDetailCard()}
        </div>
    `;
}

function packetLossDetailCard() {
    const hasMeasurement = Number.isFinite(finalPacketLossValue);
    const status = !hasMeasurement
        ? "Medição ICMP indisponível"
        : finalPacketLossValue > 0
        ? "Perda detectada"
        : "Nenhuma perda detectada";

    return `
        <article class="detail-card packet-loss-detail">
            <div class="detail-card-header">
                <div class="detail-card-title">Perda de pacotes</div>
                <div class="detail-card-value">${hasMeasurement ? Math.round(finalPacketLossValue) : "N/D"} <small>${hasMeasurement ? "%" : ""}</small></div>
            </div>
            <div class="packet-loss-status ${finalPacketLossValue > 0 ? "has-loss" : ""}">${escapeHtml(status)}</div>
            <div class="packet-loss-reference">${packetLossReference ? `Referência ${escapeHtml(finalPingMethod)}: ${escapeHtml(packetLossReference)}` : "Nenhuma referência respondeu com segurança."}</div>
        </article>
    `;
}

function detailCard(label, value, unit, samples, type) {
    const cleanSamples = samples.filter(sample => Number.isFinite(sample));
    const stats = sampleStats(cleanSamples);
    const points = chartPoints(cleanSamples);
    const lineClass = type === "upload" ? "upload-line" : type === "ping" ? "ping-line" : type === "jitter" ? "jitter-line" : "";

    return `
        <article class="detail-card">
            <div class="detail-card-header">
                <div class="detail-card-title">${label}</div>
                <div class="detail-card-value">${Math.round(value)} <small>${unit}</small></div>
            </div>
            <svg class="detail-chart ${lineClass}" viewBox="0 0 640 92" preserveAspectRatio="none" aria-hidden="true">
                <line class="detail-axis" x1="0" y1="78" x2="640" y2="78"></line>
                <polyline points="${points}"></polyline>
            </svg>
            <div class="detail-stats">
                <div class="detail-stat"><strong>${Math.round(stats.median)} ${unit}</strong>Mediana</div>
                <div class="detail-stat"><strong>${Math.round(stats.average)} ${unit}</strong>Media</div>
                <div class="detail-stat"><strong>${Math.round(stats.min)} ${unit}</strong>Minimo</div>
                <div class="detail-stat"><strong>${Math.round(stats.max)} ${unit}</strong>Maximo</div>
            </div>
        </article>
    `;
}

function renderImprovementReport() {
    const suggestions = buildSuggestions();

    reportContent.innerHTML = `
        <div class="improvement-stack">
            ${suggestions.map((suggestion, index) => `
                <details class="improvement-card" ${index < 2 ? "open" : ""}>
                    <summary><span class="improvement-index">${index + 1}</span>${escapeHtml(suggestion.title)}</summary>
                    <div class="improvement-body">${escapeHtml(suggestion.body)}</div>
                </details>
            `).join("")}
        </div>
    `;
}

function buildSuggestions() {
    const suggestions = [];

    if (finalPingValue > 40 || finalJitterValue > 8) {
        suggestions.push({
            title: "Reduza a latencia da conexao",
            body: "Aproxime-se do roteador, evite barreiras fisicas e prefira cabo de rede para jogos, chamadas de video e transmissao ao vivo."
        });
    }

    if (finalDownloadSpeed < 300) {
        suggestions.push({
            title: "Verifique o desempenho do download",
            body: "Feche downloads, atualizacoes e aplicativos em segundo plano. Em Wi-Fi, teste tambem na rede 5G ou via cabo para comparar."
        });
    }

    if (finalUploadSpeed < 100) {
        suggestions.push({
            title: "Melhore o upload",
            body: "Uploads baixos podem afetar backup, chamadas e envio de arquivos. Confira se outro dispositivo esta enviando dados ou usando nuvem."
        });
    }

    const problematicServices = latestServicePingResults.filter(service => !service.ok || service.loss > 0 || service.latency > 180);

    if (problematicServices.length > 0) {
        suggestions.push({
            title: "Revise os destinos com alerta",
            body: `Alguns servicos tiveram perda, bloqueio ou latencia alta: ${problematicServices.map(service => service.name).join(", ")}. Isso pode ser rota, bloqueio ICMP/HTTPS ou instabilidade externa.`
        });
    }

    suggestions.push({
        title: "Reinicie o roteador e teste novamente",
        body: "Reiniciar o roteador pode corrigir travamentos temporarios, limpar sessoes antigas e melhorar a estabilidade da rede local."
    });

    suggestions.push({
        title: "Considere usar uma conexao com fio",
        body: "Cabo Ethernet costuma ter menor jitter e menor perda que Wi-Fi, principalmente em ambientes com muitas redes proximas."
    });

    return suggestions.slice(0, 5);
}

function chartPoints(samples) {
    if (samples.length === 0) {
        return "0,78 640,78";
    }

    const maxValue = Math.max(...samples, 1);
    const minValue = Math.min(...samples);
    const range = Math.max(maxValue - minValue, 1);

    return samples.map((sample, index) => {
        const x = samples.length === 1 ? 0 : (index / (samples.length - 1)) * 640;
        const y = 78 - ((sample - minValue) / range) * 58;

        return `${Math.round(x)},${Math.round(y)}`;
    }).join(" ");
}

function sampleStats(samples) {
    if (samples.length === 0) {
        return { median: 0, average: 0, min: 0, max: 0 };
    }

    return {
        median: median(samples),
        average: average(samples),
        min: Math.min(...samples),
        max: Math.max(...samples)
    };
}

function renderServicePingLoading() {
    servicePingList.innerHTML = SERVICE_PING_TARGETS.map(service => `
        <article class="service-ping-card testing">
            <div>
                <div class="service-name">${escapeHtml(service.name)}</div>
                <div class="service-host">${escapeHtml(service.host)}</div>
                <div class="service-packets">Aguardando resposta...</div>
            </div>
            <div class="service-latency warn">...</div>
        </article>
    `).join("");
}

function renderServicePingIdle() {
    servicePingList.innerHTML = SERVICE_PING_TARGETS.map(service => `
        <article class="service-ping-card">
            <div>
                <div class="service-name">${escapeHtml(service.name)}</div>
                <div class="service-host">${escapeHtml(service.host)}</div>
                <div class="service-packets">ICMP/HTTPS aguardando</div>
            </div>
            <div class="service-latency">0<small>ms</small></div>
        </article>
    `).join("");
}

async function loadOutageStatus() {
    try {
        const apiBase = getApiBaseUrl();
        if (window.SpeedGateAndroid && !apiBase) {
            if (latestOfficialOutageResults.length > 0 && Date.now() - latestOfficialOutageAt < 5 * 60 * 1000) {
                renderOutageStatus(latestOfficialOutageResults);
                return;
            }

            if (typeof window.SpeedGateAndroid.getDowndetectorAsync === "function") {
                outageList.innerHTML = `<div class="service-loading">Consultando Downdetector oficial...</div>`;
                const officialServices = await callAndroidAsync("getDowndetectorAsync", 35000);
                if (Array.isArray(officialServices) && officialServices.length > 0) {
                    latestOfficialOutageResults = officialServices;
                    latestOfficialOutageAt = Date.now();
                    renderOutageStatus(officialServices);
                    return;
                }
            }

            renderAndroidOutageFallback();
            return;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(apiUrl(`/api/outages?t=${Date.now()}`), {
            cache: "no-store",
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error("Falha no Downdetector");
        }

        const services = await response.json();
        latestOfficialOutageResults = services;
        latestOfficialOutageAt = Date.now();
        renderOutageStatus(services);
    } catch (error) {
        if (window.SpeedGateAndroid) {
            renderAndroidOutageFallback();
            return;
        }
        outageList.innerHTML = `<div class="service-loading">Downdetector indisponivel agora.</div>`;
    }
}

function renderAndroidOutageFallback() {
    if (latestServicePingResults.length === 0) {
        outageList.innerHTML = `<div class="service-loading">O monitor próprio será atualizado ao iniciar o teste.</div>`;
        return;
    }

    const services = latestServicePingResults.map((service, index) => ({
        name: service.name,
        source: "Monitor Android",
        latency: service.latency,
        loss: service.loss,
        priority: index + 1,
        level: !service.ok || service.loss >= 67
            ? "bad"
            : service.loss > 0 || service.latency > 250
            ? "warn"
            : "ok"
    }));
    renderOutageStatus(services);
}

function renderServicePings(services) {
    servicePingList.innerHTML = services.map(service => {
        const qualityClass = !service.ok || service.loss >= 25
            ? "bad"
            : service.loss > 0 || service.latency > 100
            ? service.latency > 250 ? "bad" : "warn"
            : "";
        const latency = service.ok
            ? service.method === "ICMP" && service.latency === 0
                ? `&lt;1<small>ms</small>`
                : `${Math.round(service.latency)}<small>ms</small>`
            : "Falha";
        const packetText = service.method === "TCP"
            ? service.ok
                ? `TCP:${service.port} ${service.received}/${service.sent} resp. ${service.loss}% perda`
                : `TCP:${service.port} sem resposta`
            : service.method === "HTTPS" && service.ok
            ? `HTTPS OK${service.status ? ` ${service.status}` : ""}`
            : service.ok
            ? `ICMP ${service.received}/${service.sent} resp. ${service.loss}% perda`
            : "Sem resposta ICMP";

        return `
            <article class="service-ping-card">
                <div>
                    <div class="service-name">${escapeHtml(service.name)}</div>
                    <div class="service-host">${escapeHtml(service.host)}</div>
                    <div class="service-packets">${escapeHtml(packetText)}</div>
                </div>
                <div class="service-latency ${qualityClass}">${latency}</div>
            </article>
        `;
    }).join("");
}

function renderOutageStatus(services) {
    const severity = { bad: 0, warn: 1, unknown: 2, ok: 3 };
    const monitoredServices = services
        .map(service => {
            if (service.source !== "Monitor SpeedGate" || service.level === "ok" || service.level === "warn") {
                return service;
            }

            const confirmedServerError = /^Erro HTTP 5\d\d/.test(service.status || "");
            const confirmedSlowRoute = service.status === "Rota lenta"
                && service.loss === 0
                && service.latency > 500;

            if (confirmedServerError || confirmedSlowRoute) {
                return service;
            }

            return {
                ...service,
                status: "Não verificado",
                level: "unknown"
            };
        })
        .sort((a, b) => {
            return (severity[a.level] ?? 4) - (severity[b.level] ?? 4)
                || (a.priority || 999) - (b.priority || 999);
        });

    if (monitoredServices.length === 0) {
        outageList.innerHTML = `
            <div class="outage-empty">
                <strong>Nenhuma instabilidade detectada</strong>
                <span>Serviços populares são verificados pelo Downdetector e pelo monitor SpeedGate.</span>
            </div>
        `;
        return;
    }

    outageList.innerHTML = monitoredServices.map(service => {
        const tagName = service.url ? "a" : "article";
        const linkAttrs = service.url ? ` href="${escapeHtml(service.url)}" target="_blank" rel="noopener"` : "";
        const sparkline = buildSparkline(service.name, service.level);

        const graph = service.sparklinePath
            ? `<path d="${escapeHtml(service.sparklinePath)}"></path>`
            : `<polyline points="${sparkline}"></polyline>`;

        return `
            <${tagName} class="outage-card level-${escapeHtml(service.level)}"${linkAttrs}>
                <div class="outage-topline">
                    <div>
                        <div class="service-name">${escapeHtml(service.name)}</div>
                        <div class="service-host">${escapeHtml(service.source)}${Number.isFinite(service.latency) ? ` · ${Math.round(service.latency)} ms` : ""}</div>
                    </div>
                </div>
                <svg class="outage-sparkline" viewBox="0 0 ${service.sparklinePath ? "243 40" : "120 34"}" preserveAspectRatio="none" aria-hidden="true">
                    ${graph}
                </svg>
            </${tagName}>
        `;
    }).join("");
}

function buildSparkline(name, level) {
    const base = level === "bad" ? 16 : level === "warn" ? 21 : 25;
    const amplitude = level === "bad" ? 15 : level === "warn" ? 9 : 5;
    const seed = [...name].reduce((total, char) => total + char.charCodeAt(0), 0);
    const points = [];

    for (let index = 0; index < 18; index++) {
        const wave = Math.sin((index + seed) * .8) * amplitude;
        const spike = (index + seed) % 7 === 0 ? amplitude * .8 : 0;
        const x = Math.round(index * (120 / 17));
        const y = Math.max(4, Math.min(31, Math.round(base - wave - spike)));

        points.push(`${x},${y}`);
    }

    return points.join(" ");
}

function renderConnectionInfo(connection) {
    const isEthernet = connection.type === "ethernet";
    const isMobile = connection.type === "mobile";
    const isWifi = String(connection.type || "").startsWith("wifi");
    const isOffline = !connection.connected;

    networkBand.innerText = connection.label || "Rede";
    networkStatus.innerText = isOffline ? "Desconectado" : connection.name || "Conectado";
    if (connectionType) {
        connectionType.innerText = connection.detail || connection.label || "Rede";
    }
    if (connectionQuality) {
        connectionQuality.innerText = connection.quality || connection.speed || "Conectado";
    }

    const iconClass = isEthernet ? "cable-icon" : isMobile ? "mobile-icon" : "wifi-icon";
    networkIcon.className = `connection-icon ${iconClass}`;
    if (connectionIcon) {
        connectionIcon.className = `connection-icon ${iconClass}`;
    }

    if (wifiDetailsCard) {
        wifiDetailsCard.classList.toggle("is-unavailable", !isWifi);
        wifiDetailsCard.title = isWifi
            ? "Informações fornecidas pelo adaptador Wi-Fi do Windows"
            : "Sinal, canal e frequência são informações exclusivas de conexões Wi-Fi";
    }

    wifiSignalDbm.innerText = isWifi && Number.isFinite(connection.signalDbm)
        ? `${connection.signalDbm} dBm`
        : "N/A";
    wifiSignalPercent.innerText = isWifi && Number.isFinite(connection.signalPercent)
        ? `${Math.round(connection.signalPercent)}%`
        : "Somente Wi-Fi";
    wifiChannel.innerText = isWifi && Number.isFinite(connection.channel)
        ? Math.round(connection.channel)
        : "N/A";
    wifiBandDetail.innerText = isWifi ? (connection.label || "Wi-Fi") : "Somente Wi-Fi";
    wifiFrequency.innerText = isWifi && Number.isFinite(connection.frequencyMhz)
        ? Math.round(connection.frequencyMhz)
        : "N/A";

    const signalQuality = !isWifi || !Number.isFinite(connection.signalDbm)
        ? "unavailable"
        : connection.signalDbm <= -76
        ? "bad"
        : connection.signalDbm <= -68
        ? "warn"
        : "good";
    wifiSignalDbm.className = `quality-${signalQuality}`;
    wifiSignalPercent.className = `quality-${signalQuality}`;

    const nearbyOnChannel = Number(connection.sameChannelNetworks);
    const hasChannelReading = isWifi && Number.isFinite(nearbyOnChannel) && nearbyOnChannel >= 0;
    const channelQuality = !hasChannelReading
        ? "unavailable"
        : nearbyOnChannel >= 5
        ? "bad"
        : nearbyOnChannel >= 2
        ? "warn"
        : "good";
    wifiChannel.className = `quality-${channelQuality}`;
    wifiBandDetail.className = `quality-${channelQuality}`;
    wifiBandDetail.innerText = hasChannelReading
        ? `${connection.label || "Wi-Fi"} · ${nearbyOnChannel} ${nearbyOnChannel === 1 ? "rede" : "redes"}`
        : isWifi ? (connection.label || "Wi-Fi") : "Somente Wi-Fi";
}

function makePayload(size) {
    const payload = new Uint8Array(size);

    for (let offset = 0; offset < size; offset += 65536) {
        crypto.getRandomValues(payload.subarray(offset, Math.min(offset + 65536, size)));
    }

    return payload;
}

function trimSamples(samples) {
    if (samples.length < 4) {
        return samples;
    }

    return [...samples].sort((a, b) => a - b).slice(1, -1);
}

function stableTransferResult(samples) {
    const validSamples = samples.filter(sample => Number.isFinite(sample) && sample > 0);

    if (validSamples.length === 0) {
        return 0;
    }

    if (validSamples.length < 6) {
        return average(validSamples);
    }

    const medianValue = median(validSamples);
    const deviations = validSamples.map(sample => Math.abs(sample - medianValue));
    const mad = median(deviations) || medianValue * .08 || 1;
    const maxDeviation = mad * 2.75;
    const filteredSamples = validSamples.filter(sample => {
        return Math.abs(sample - medianValue) <= maxDeviation;
    });
    const cleanSamples = filteredSamples.length >= 4 ? filteredSamples : validSamples;
    const sortedSamples = [...cleanSamples].sort((a, b) => a - b);
    const lowIndex = Math.floor(sortedSamples.length * .15);
    const highIndex = Math.max(lowIndex + 1, Math.ceil(sortedSamples.length * .85));
    const stableSamples = sortedSamples.slice(lowIndex, highIndex);

    return average(stableSamples);
}

function median(values) {
    if (values.length === 0) {
        return 0;
    }

    const sortedValues = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sortedValues.length / 2);

    if (sortedValues.length % 2 === 0) {
        return (sortedValues[middle - 1] + sortedValues[middle]) / 2;
    }

    return sortedValues[middle];
}

function bytesToMbps(bytes, seconds) {
    if (seconds <= 0) {
        return 0;
    }

    return (bytes * 8) / seconds / 1000 / 1000;
}

function elapsedSeconds(startedAt) {
    return (performance.now() - startedAt) / 1000;
}

function average(values) {
    if (values.length === 0) {
        return 0;
    }

    return values.reduce((total, value) => total + value, 0) / values.length;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
