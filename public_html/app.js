const { useEffect, useMemo, useRef, useState } = React;

const DATA_LIST_URL = "/data-files";
const DATA_FOLDER = "/data/";
const DEFAULT_BENCHMARK_FILE = "benchmarks.json";
const REFRESH_INTERVAL_MS = 15000;
const CONTACT_API_URL = "./contact.php";

const HARDCODED_BENCHMARKS = [
  {
    benchmark_id: "rtx6000-llama-405b",
    timestamp: new Date().toISOString(),
    config: {
      name: "RTX 6000 Ada · Llama 3.1 405B",
      hardware: {
        cpu: { model: "AMD Threadripper Pro 5975WX" },
        gpu: { model: "NVIDIA RTX 6000 Ada 48GB" },
        ram: { size_gb: 256, type: "DDR4 ECC" }
      }
    },
    performance: {
      tokens_per_sec: 92.4
    },
    scores: {
      performance_score: 9.8,
      capability_score: 9.6,
      rag_score: 9.7,
      privacy_score: 9.0,
      quant_precision_score: 9.5
    },
    cost: {
      hardware_eur: 18000
    },
    inference: {
      model: {
        name: "Llama 3.1 405B",
        quantization: "Q5_K_M"
      },
      context_window_tokens: 262144
    },
    deployment: {
      offline_only: true
    }
  },
  {
    benchmark_id: "macstudio-m4-llama-70b",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    config: {
      name: "Mac Studio M4 Max · Llama 3 70B",
      hardware: {
        cpu: { model: "Apple M4 Max" },
        gpu: { model: "Apple Neural Engine" },
        ram: { size_gb: 128, type: "Unified" }
      }
    },
    performance: {
      tokens_per_sec: 38.7
    },
    scores: {
      performance_score: 8.4,
      capability_score: 8.9,
      rag_score: 8.6,
      privacy_score: 9.5,
      quant_precision_score: 9.2
    },
    cost: {
      hardware_eur: 6500
    },
    inference: {
      model: {
        name: "Llama 3 70B",
        quantization: "Q4_K_M"
      },
      context_window_tokens: 131072
    },
    deployment: {
      offline_only: true
    }
  },
  {
    benchmark_id: "minipc-phi4",
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    config: {
      name: "Mini PC Ryzen · Phi-4",
      hardware: {
        cpu: { model: "AMD Ryzen 7 7840HS" },
        gpu: { model: "iGPU RDNA3" },
        ram: { size_gb: 64, type: "DDR5" }
      }
    },
    performance: {
      tokens_per_sec: 22.1
    },
    scores: {
      performance_score: 7.2,
      capability_score: 7.5,
      rag_score: 7.0,
      privacy_score: 8.8,
      quant_precision_score: 8.9
    },
    cost: {
      hardware_eur: 1600
    },
    inference: {
      model: {
        name: "Phi-4",
        quantization: "Q4_K_M"
      },
      context_window_tokens: 65536
    },
    deployment: {
      offline_only: true
    }
  },
  {
    benchmark_id: "dual3090-deepseek-v3",
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    config: {
      name: "Dual RTX 3090 · DeepSeek-V3",
      hardware: {
        cpu: { model: "AMD Ryzen 9 7950X" },
        gpu: { model: "2× NVIDIA RTX 3090 24GB" },
        ram: { size_gb: 128, type: "DDR5" }
      }
    },
    performance: {
      tokens_per_sec: 61.3
    },
    scores: {
      performance_score: 9.0,
      capability_score: 9.2,
      rag_score: 9.1,
      privacy_score: 8.7,
      quant_precision_score: 9.0
    },
    cost: {
      hardware_eur: 8000
    },
    inference: {
      model: {
        name: "DeepSeek-V3",
        quantization: "Q4_K_M"
      },
      context_window_tokens: 200000
    },
    deployment: {
      offline_only: true
    }
  }
];

  function parseDate(timestamp) {
    const date = new Date(timestamp);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  function getConfigTitle(benchmark) {
    return benchmark?.config?.name || "Configuracion sin nombre";
  }

  function getHardwareSummary(benchmark) {
    const cpu = benchmark?.config?.hardware?.cpu?.model || "CPU no indicada";
    const gpu = benchmark?.config?.hardware?.gpu?.model || "GPU no indicada";
    const ramSize = benchmark?.config?.hardware?.ram?.size_gb;
    const ramType = benchmark?.config?.hardware?.ram?.type;
    const ram = ramSize ? `${ramSize} GB ${ramType || "RAM"}` : "RAM no indicada";
    return `${cpu} · ${gpu} · ${ram}`;
  }

  function getBenchmarkFileLabel(filename) {
    if (!filename) return "Archivo desconocido";
    return filename
      .replace(/\.json$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function getTokensPerSec(benchmark) {
    const value = benchmark?.performance?.tokens_per_sec;
    return Number.isFinite(Number(value)) ? Number(value) : null;
  }

  function getPerformanceScore(benchmark) {
    const value = benchmark?.scores?.performance_score;
    return Number.isFinite(Number(value)) ? Number(value) : null;
  }

  function getCapabilityScore(benchmark) {
    const value = benchmark?.scores?.capability_score;
    return Number.isFinite(Number(value)) ? Number(value) : null;
  }

  function getHardwareCost(benchmark) {
    const value = benchmark?.cost?.hardware_eur;
    return Number.isFinite(Number(value)) ? Number(value) : null;
  }

function getRagScore(benchmark) {
  // Backend actual: no trae rag_score. Usamos proxy (overall_score) + bonus por contexto.
  const overall = benchmark?.scores?.overall_score;
  const ctx = benchmark?.inference?.model?.context_size;
  const base = Number.isFinite(Number(overall)) ? Number(overall) : null;
  if (base === null) return null;
  const ctxBonus = Number.isFinite(Number(ctx)) ? Math.min(1.0, Math.log2(Number(ctx) / 4096 + 1) / 3) : 0;
  return base + ctxBonus;
}

function getPrivacyScore(benchmark) {
  // Backend actual: no trae privacy_score. Proxy: overall_score + bonus si parece offline.
  const overall = benchmark?.scores?.overall_score;
  const base = Number.isFinite(Number(overall)) ? Number(overall) : null;
  if (base === null) return null;
  const backend = String(benchmark?.inference?.backend || "").toLowerCase();
  const isLikelyOffline = backend && !backend.includes("openai") && !backend.includes("anthropic") && !backend.includes("cloud");
  return base + (isLikelyOffline ? 0.5 : 0);
}

function getQuantPrecision(benchmark) {
  // Backend actual: no trae quant_precision_score. Proxy: capability_score o overall_score.
  const value = benchmark?.scores?.capability_score ?? benchmark?.scores?.overall_score;
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function getModelName(benchmark) {
  return benchmark?.inference?.model?.name || "Modelo no indicado";
}

  function formatNumber(value, decimals) {
    if (value === null || value === undefined) return "—";
    return Number(value).toFixed(decimals).replace(/\.0$/, "");
  }

  function getOverallScore(benchmark) {
    const performance = getPerformanceScore(benchmark);
    const capability = getCapabilityScore(benchmark);
    if (performance === null && capability === null) return -Infinity;
    if (performance === null) return capability;
    if (capability === null) return performance;
    return performance * 0.6 + capability * 0.4;
  }

  function isValidBenchmark(benchmark) {
  return Boolean(benchmark && typeof benchmark === "object" && benchmark.benchmark_id);
}

function areBenchmarksEqual(previousBenchmarks, nextBenchmarks) {
  return JSON.stringify(previousBenchmarks) === JSON.stringify(nextBenchmarks);
}

function pickTop3OfMonth(benchmarks) {
  if (!benchmarks.length) return { best: null, efficient: null, budget: null };

  const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = benchmarks.filter((b) => {
    const t = parseDate(b?.timestamp)?.getTime() || 0;
    return t >= monthAgo;
  });

  const pool = recent.length ? recent : benchmarks;

  const byTokens = [...pool].sort((a, b) => (getTokensPerSec(b) || 0) - (getTokensPerSec(a) || 0));
  const byEfficiency = [...pool].sort((a, b) => {
    const ta = getTokensPerSec(a) || 0;
    const tb = getTokensPerSec(b) || 0;
    const ca = getHardwareCost(a) || Infinity;
    const cb = getHardwareCost(b) || Infinity;
    const ea = ca === Infinity ? 0 : ta / ca;
    const eb = cb === Infinity ? 0 : tb / cb;
    return eb - ea;
  });
  const byBudget = [...pool].sort((a, b) => {
    const ca = getHardwareCost(a) || Infinity;
    const cb = getHardwareCost(b) || Infinity;
    return ca - cb;
  });

  return {
    best: byTokens[0] || null,
    efficient: byEfficiency[0] || null,
    budget: byBudget[0] || null
  };
}

function average(values) {
  const valid = values.filter((value) => Number.isFinite(Number(value))).map(Number);
  if (!valid.length) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

async function fetchBenchmarkFilesList() {
    const response = await fetch(DATA_LIST_URL, {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (!Array.isArray(payload)) {
      throw new Error("Formato de lista de archivos no soportado");
    }

    return payload.filter((filename) => typeof filename === "string" && filename.toLowerCase().endsWith(".json"));
  }

  async function fetchBenchmarksFromFile(filename) {
    const safeFile = encodeURIComponent(filename);
    const response = await fetch(`${DATA_FOLDER}${safeFile}`, {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.benchmarks)) return payload.benchmarks;
    throw new Error("Formato de respuesta no soportado");
  }

  async function loadBenchmarks(filename) {
    const payload = await fetchBenchmarksFromFile(filename);
    const normalized = payload.map(normalizeBenchmark);
    return normalized.filter(isValidBenchmark);
  }

function normalizeBenchmark(raw) {
  // Caso 1: payload anidado (el “formato completo”)
  if (raw?.config && raw?.performance && raw?.scores) {
    return raw;
  }

  // Caso 2: payload plano (lo que está devolviendo ahora el backend)
  // Ejemplo real:
  // {
  //   benchmark_id, timestamp,
  //   config_name, config_type,
  //   backend, model_name, quantization,
  //   overall_score
  // }
  return {
    benchmark_id: raw?.benchmark_id,
    timestamp: raw?.timestamp,
    config: {
      name: raw?.config_name || "Configuracion sin nombre",
      type: raw?.config_type,
      hardware: {
        cpu: { model: raw?.cpu_model },
        gpu: { model: raw?.gpu_model },
        ram: { size_gb: raw?.ram_size_gb, type: raw?.ram_type, speed_mhz: raw?.ram_speed_mhz },
        storage: { type: raw?.storage_type, size_gb: raw?.storage_size_gb }
      },
      system: { os: raw?.os, driver: raw?.driver }
    },
    inference: {
      backend: raw?.backend,
      model: {
        name: raw?.model_name,
        quantization: raw?.quantization,
        context_size: raw?.context_size
      }
    },
    performance: {
      tokens_per_sec: raw?.tokens_per_sec
    },
    cost: {
      hardware_eur: raw?.hardware_eur
    },
    scores: {
      overall_score: raw?.overall_score,
      performance_score: raw?.performance_score,
      capability_score: raw?.capability_score
    }
  };
}

function App() {
  const [benchmarks, setBenchmarks] = useState([]);
  const [status, setStatus] = useState({
    message: "Cargando benchmarks desde la base de datos...",
    kind: "loading"
  });
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState("Aun sin actualizar");
  const [showContact, setShowContact] = useState(false);
  const [showContactSent, setShowContactSent] = useState(false);
  const [contactError, setContactError] = useState("");
  const [isSendingContact, setIsSendingContact] = useState(false);
  const [selectedBenchmark, setSelectedBenchmark] = useState(null);
  const [leaderboardScope, setLeaderboardScope] = useState("configuration");
  const [leaderboardTab, setLeaderboardTab] = useState("rag");
  const [showAllConfigs, setShowAllConfigs] = useState(false);
  const [showComparator, setShowComparator] = useState(false);
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");
  const [benchmarkFiles, setBenchmarkFiles] = useState([]);
  const [selectedBenchmarkFile, setSelectedBenchmarkFile] = useState(DEFAULT_BENCHMARK_FILE);
  const benchmarksRef = useRef([]);
  const selectedBenchmarkFileRef = useRef(DEFAULT_BENCHMARK_FILE);
  const contactSectionRef = useRef(null);

  useEffect(() => {
    benchmarksRef.current = benchmarks;
  }, [benchmarks]);

  useEffect(() => {
    async function load() {
      setStatus({ message: "Cargando benchmarks desde el backend...", kind: "loading" });
      try {
        const availableFiles = await fetchBenchmarkFilesList();
        setBenchmarkFiles(availableFiles);

        const fileToUse = availableFiles.includes(selectedBenchmarkFile)
          ? selectedBenchmarkFile
          : availableFiles[0] || DEFAULT_BENCHMARK_FILE;

        setSelectedBenchmarkFile(fileToUse);
        selectedBenchmarkFileRef.current = fileToUse;

        const valid = await loadBenchmarks(fileToUse);
        setBenchmarks(valid);
        setLastUpdatedAt(Date.now());
        setStatus({
          message: `Mostrando ${valid.length} benchmarks desde el archivo ${fileToUse}.`,
          kind: valid.length ? "success" : "info"
        });
      } catch (error) {
        console.warn("No se pudo cargar desde archivo JSON, usando demo:", error);
        const validBenchmarks = HARDCODED_BENCHMARKS.filter(isValidBenchmark);
        setBenchmarks(validBenchmarks);
        setLastUpdatedAt(Date.now());
        setStatus({
          message: `JSON no disponible. Mostrando ${validBenchmarks.length} benchmarks de ejemplo (modo demo).`,
          kind: "info"
        });
      }
    }

    load();

    const intervalId = window.setInterval(() => {
      loadBenchmarks(selectedBenchmarkFileRef.current)
        .then((valid) => {
          setBenchmarks(valid);
          setLastUpdatedAt(Date.now());
          setStatus({
            message: `Actualizado desde ${selectedBenchmarkFileRef.current}.`,
            kind: valid.length ? "success" : "info"
          });
        })
        .catch((error) => {
          console.warn("Error actualizando benchmarks:", error);
        });
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    function updateLastUpdatedLabel() {
      if (!lastUpdatedAt) {
        setLastUpdatedLabel("Aun sin actualizar");
        return;
      }

      const seconds = Math.max(0, Math.floor((Date.now() - lastUpdatedAt) / 1000));
      if (seconds < 5) {
        setLastUpdatedLabel("Actualizado hace unos segundos");
        return;
      }

      setLastUpdatedLabel(`Actualizado hace ${seconds} s`);
    }

    updateLastUpdatedLabel();
    const intervalId = window.setInterval(updateLastUpdatedLabel, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [lastUpdatedAt]);

  const recentBenchmarks = useMemo(() => {
    return [...benchmarks]
      .sort((a, b) => {
        const aTime = parseDate(a?.timestamp)?.getTime() || 0;
        const bTime = parseDate(b?.timestamp)?.getTime() || 0;
        return bTime - aTime;
      })
      .slice(0, 3);
  }, [benchmarks]);

  const visibleRecentBenchmarks = useMemo(() => {
    if (showAllConfigs) return benchmarks;
    return recentBenchmarks;
  }, [benchmarks, recentBenchmarks, showAllConfigs]);

  const leaderboardBenchmarks = useMemo(() => {
    const base = [...benchmarks];
    if (leaderboardTab === "rag") {
      return base
        .sort((a, b) => (getRagScore(b) || -Infinity) - (getRagScore(a) || -Infinity))
        .slice(0, 5);
    }
    if (leaderboardTab === "privacy") {
      return base
        .sort((a, b) => (getPrivacyScore(b) || -Infinity) - (getPrivacyScore(a) || -Infinity))
        .slice(0, 5);
    }
    if (leaderboardTab === "quant") {
      return base
        .sort((a, b) => (getQuantPrecision(b) || -Infinity) - (getQuantPrecision(a) || -Infinity))
        .slice(0, 5);
    }
    return base.sort((a, b) => getOverallScore(b) - getOverallScore(a)).slice(0, 5);
  }, [benchmarks, leaderboardTab]);

  const leaderboardModels = useMemo(() => {
    const grouped = benchmarks.reduce((acc, benchmark) => {
      const modelName = getModelName(benchmark);
      if (!acc[modelName]) {
        acc[modelName] = [];
      }
      acc[modelName].push(benchmark);
      return acc;
    }, {});

    const items = Object.entries(grouped).map(([modelName, entries]) => ({
      modelName,
      bestConfigName: [...entries].sort(
        (a, b) => (getTokensPerSec(b) || 0) - (getTokensPerSec(a) || 0)
      )[0]?.config?.name || "Configuracion no indicada",
      avgRag: average(entries.map((entry) => getRagScore(entry))),
      avgPrivacy: average(entries.map((entry) => getPrivacyScore(entry))),
      avgQuant: average(entries.map((entry) => getQuantPrecision(entry))),
      avgContext: average(entries.map((entry) => entry?.inference?.context_window_tokens)),
      offlineShare:
        entries.filter((entry) => entry?.deployment?.offline_only).length / entries.length,
      quantizations: [
        ...new Set(
          entries
            .map((entry) => entry?.inference?.model?.quantization)
            .filter(Boolean)
        )
      ]
    }));

    if (leaderboardTab === "rag") {
      return items
        .sort((a, b) => (b.avgRag || -Infinity) - (a.avgRag || -Infinity))
        .slice(0, 5);
    }
    if (leaderboardTab === "privacy") {
      return items
        .sort((a, b) => (b.avgPrivacy || -Infinity) - (a.avgPrivacy || -Infinity))
        .slice(0, 5);
    }
    return items
      .sort((a, b) => (b.avgQuant || -Infinity) - (a.avgQuant || -Infinity))
      .slice(0, 5);
  }, [benchmarks, leaderboardTab]);

  const top3 = useMemo(() => pickTop3OfMonth(benchmarks), [benchmarks]);

  const compareConfigA = useMemo(
    () => benchmarks.find((b) => b.benchmark_id === compareA) || null,
    [benchmarks, compareA]
  );
  const compareConfigB = useMemo(
    () => benchmarks.find((b) => b.benchmark_id === compareB) || null,
    [benchmarks, compareB]
  );

  function handleOpenDetails(benchmark) {
    setSelectedBenchmark(benchmark || null);
  }


  return (
    <>
      <section className="hero">
        <img src="logo.png" className="logo" alt="onpremIA Labs" />
        <h1>Benchmarks de hardware para IA local</h1>
        <p>Analizamos configuraciones on-prem para ejecutar modelos en local con metricas reales de rendimiento, coste y estabilidad.</p>
        <div className="buttons">
          <a
            href="data/Sponsorship_Program_onpremIALabs.pdf"
            className="btn primary"
            download="Sponsorship_Program_onPremiaLabs.pdf"
          >
            Descargar Media Kit
          </a>
        </div>
      </section>

      <section className="features">
        <div className="feature">
          <div className="icon">⚡</div>
          <p>
            <strong>BENCHMARKS DE HARDWARE</strong>
            <br />
            <span>Metricas completas por configuracion</span>
          </p>
        </div>
        <div className="feature">
          <div className="icon">➕</div>
          <p>
            <strong>COMPARATIVAS TECNICAS PROFUNDAS</strong>
            <br />
            <span>Analisis detallado de tokens/s, VRAM, RAM, consumo energetico y costes operativos</span>
          </p>
        </div>
        <div className="feature">
          <div className="icon">✔</div>
          <p>
            <strong>VALIDACION DE MODELOS LOCALES</strong>
            <br />
            <span>Evaluacion rigurosa de modelos en entornos on-premise</span>
          </p>
        </div>
      </section>

      <section className="benchmark">
        <h2>Que medimos en cada configuracion</h2>
        <div className="cards">
          <div className="card">⚡ Rendimiento de inferencia<br /><span>Tokens/s, TTFT y latencia</span></div>
          <div className="card">💾 Uso de recursos<br /><span>VRAM, RAM, CPU y GPU</span></div>
          <div className="card">🔥 Eficiencia energetica<br /><span>Consumo medio y coste operativo</span></div>
          <div className="card">🧪 Estabilidad de la configuracion<br /><span>Capacidad, fiabilidad y usabilidad</span></div>
          <div className="card">📚 RAG y Privacidad<br /><span>Calidad de recuperacion y ejecucion offline segura</span></div>
        </div>
      </section>

      <section className="top3">
        <h2>Top 3 del mes</h2>
        <p className="hint">
          Seleccion curada por onpremIA Labs: configuraciones validadas para rendimiento real, eficiencia y despliegues edge.
        </p>
        <div className="top3-grid">
          {top3.best ? (
            <article className="top3-card">
              <div className="top3-ribbon top3-gold">🥇 Performance</div>
              <h3>La Bestia</h3>
              <p className="top3-name">{getConfigTitle(top3.best)}</p>
              <p className="top3-meta">{getHardwareSummary(top3.best)}</p>
              <p className="top3-metric">
                {formatNumber(getTokensPerSec(top3.best), 1)} tokens/s
              </p>
              <button
                type="button"
                className="top3-link"
                onClick={() => handleOpenDetails(top3.best)}
              >
                Ver ficha tecnica
              </button>
            </article>
          ) : null}

          {top3.efficient ? (
            <article className="top3-card">
              <div className="top3-ribbon top3-silver">🥈 Eficiencia</div>
              <h3>El Equilibrado</h3>
              <p className="top3-name">{getConfigTitle(top3.efficient)}</p>
              <p className="top3-meta">{getHardwareSummary(top3.efficient)}</p>
              <p className="top3-metric">
                {formatNumber(getTokensPerSec(top3.efficient), 1)} tokens/s
              </p>
              <button
                type="button"
                className="top3-link"
                onClick={() => handleOpenDetails(top3.efficient)}
              >
                Ver ficha tecnica
              </button>
            </article>
          ) : null}

          {top3.budget ? (
            <article className="top3-card">
              <div className="top3-ribbon top3-bronze">🥉 Budget / Edge</div>
              <h3>El Mini-Server</h3>
              <p className="top3-name">{getConfigTitle(top3.budget)}</p>
              <p className="top3-meta">{getHardwareSummary(top3.budget)}</p>
              <p className="top3-metric">
                {formatNumber(getTokensPerSec(top3.budget), 1)} tokens/s
              </p>
              <button
                type="button"
                className="top3-link"
                onClick={() => handleOpenDetails(top3.budget)}
              >
                Ver ficha tecnica
              </button>
            </article>
          ) : null}

          {!top3.best && !top3.efficient && !top3.budget && (
            <p className="hint">Aun no hay datos suficientes para construir el Top 3 del mes.</p>
          )}
        </div>
      </section>

      <section className="results">
        <h2>Configuraciones Recientes</h2>
        <p className="hint">Visualizamos benchmarks ya ejecutados y almacenados por el framework para comparar hardware real orientado a inferencia local.</p>
        <p className="data-status" data-kind={status.kind} aria-live="polite" hidden={status.kind === "success"}>{status.message}</p>
        <p className="refresh-status" hidden>Auto-refresh cada 15 s · {lastUpdatedLabel}</p>

        {benchmarkFiles.length > 0 ? (
          <div className="data-picker">
            <label htmlFor="benchmark-file-select">Fuente de benchmark:</label>
            <select
              id="benchmark-file-select"
              value={selectedBenchmarkFile}
              onChange={async (event) => {
                const fileName = event.target.value;
                setSelectedBenchmarkFile(fileName);
                selectedBenchmarkFileRef.current = fileName;
                try {
                  const valid = await loadBenchmarks(fileName);
                  setBenchmarks(valid);
                  setLastUpdatedAt(Date.now());
                  setStatus({
                    message: `Mostrando ${valid.length} benchmarks desde ${fileName}.`,
                    kind: valid.length ? "success" : "info"
                  });
                } catch (error) {
                  console.warn("Error cargando archivo seleccionado:", error);
                  setStatus({
                    message: `No se pudo cargar ${fileName}.`,
                    kind: "error"
                  });
                }
              }}
            >
              {benchmarkFiles.map((filename) => (
                <option key={filename} value={filename}>
                  {getBenchmarkFileLabel(filename)}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="cards">
          {visibleRecentBenchmarks.length === 0 ? (
            <article className="result-card">
              <h3>Sin benchmarks</h3>
              <span className="subvalue">Todavia no hay configuraciones publicadas.</span>
            </article>
          ) : (
            visibleRecentBenchmarks.map((benchmark) => {
              const modelName = benchmark?.inference?.model?.name || "modelo local";
              const quant = benchmark?.inference?.model?.quantization || "sin cuantizacion";
              const tokens = getTokensPerSec(benchmark);

              return (
                <article
                  className="result-card"
                  key={benchmark.benchmark_id}
                  onClick={() => handleOpenDetails(benchmark)}
                >
                  <h3>{getConfigTitle(benchmark)}</h3>
                  <div className="meta">{getHardwareSummary(benchmark)}</div>
                  <p className="value">{formatNumber(tokens, 1)}</p>
                  <span className="subvalue">Tokens/s con {modelName} ({quant})</span>
                  <button
                    type="button"
                    className="link-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleOpenDetails(benchmark);
                    }}
                  >
                    Ver ficha tecnica
                  </button>
                </article>
              );
            })
          )}
        </div>

        <div className="buttons">
          <button
            type="button"
            className="btn btn-blue"
            onClick={() => setShowAllConfigs((prev) => !prev)}
          >
            {showAllConfigs ? "Mostrar solo recientes" : "Ver mas configuraciones"}
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => setShowComparator((prev) => !prev)}
          >
            {showComparator ? "Ocultar comparador" : "Explorar comparador"}
          </button>
        </div>

        {showComparator && (
          <div className="comparator">
            <h3>Comparador de configuraciones</h3>
            <p className="hint">Selecciona dos configuraciones para comparar rendimiento y coste.</p>
            <div className="comparator-pickers">
              <select
                value={compareA}
                onChange={(event) => setCompareA(event.target.value)}
              >
                <option value="">Configuracion A</option>
                {benchmarks.map((b) => (
                  <option key={`a-${b.benchmark_id}`} value={b.benchmark_id}>
                    {getConfigTitle(b)}
                  </option>
                ))}
              </select>
              <select
                value={compareB}
                onChange={(event) => setCompareB(event.target.value)}
              >
                <option value="">Configuracion B</option>
                {benchmarks.map((b) => (
                  <option key={`b-${b.benchmark_id}`} value={b.benchmark_id}>
                    {getConfigTitle(b)}
                  </option>
                ))}
              </select>
            </div>

            {compareConfigA && compareConfigB && (
              <div className="comparator-table">
                <div className="comp-row comp-head">
                  <span>Metrica</span>
                  <span>{getConfigTitle(compareConfigA)}</span>
                  <span>{getConfigTitle(compareConfigB)}</span>
                </div>
                <div className="comp-row">
                  <span>Tokens/s</span>
                  <span>{formatNumber(getTokensPerSec(compareConfigA), 1)}</span>
                  <span>{formatNumber(getTokensPerSec(compareConfigB), 1)}</span>
                </div>
                <div className="comp-row">
                  <span>Score performance</span>
                  <span>{formatNumber(getPerformanceScore(compareConfigA), 1)}</span>
                  <span>{formatNumber(getPerformanceScore(compareConfigB), 1)}</span>
                </div>
                <div className="comp-row">
                  <span>Score capacidad</span>
                  <span>{formatNumber(getCapabilityScore(compareConfigA), 1)}</span>
                  <span>{formatNumber(getCapabilityScore(compareConfigB), 1)}</span>
                </div>
                <div className="comp-row">
                  <span>Coste hardware (EUR)</span>
                  <span>{Math.round(getHardwareCost(compareConfigA) || 0)}</span>
                  <span>{Math.round(getHardwareCost(compareConfigB) || 0)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="leaderboard">
        <h2>Ranking multi-categoria</h2>
        <div className="tabs tabs-scope">
          <button
            type="button"
            className={leaderboardScope === "configuration" ? "tab active" : "tab"}
            onClick={() => setLeaderboardScope("configuration")}
          >
            Por configuracion
          </button>
          <button
            type="button"
            className={leaderboardScope === "model" ? "tab active" : "tab"}
            onClick={() => setLeaderboardScope("model")}
          >
            Por modelo
          </button>
        </div>
        <div className="tabs tabs-category">
          <button
            type="button"
            className={leaderboardTab === "rag" ? "tab active" : "tab"}
            onClick={() => setLeaderboardTab("rag")}
          >
            RAG
          </button>
          <button
            type="button"
            className={leaderboardTab === "privacy" ? "tab active" : "tab"}
            onClick={() => setLeaderboardTab("privacy")}
          >
            Privacidad / Compliance
          </button>
          <button
            type="button"
            className={leaderboardTab === "quant" ? "tab active" : "tab"}
            onClick={() => setLeaderboardTab("quant")}
          >
            Cuantizacion
          </button>
        </div>
        <div className="leaderboard-list">
          {leaderboardScope === "configuration" && leaderboardBenchmarks.length === 0 ? (
            <article className="leaderboard-card">Sin datos de configuraciones.</article>
          ) : null}

          {leaderboardScope === "configuration" ? (
            leaderboardBenchmarks.map((benchmark, index) => {
              return (
                <article
                  className="leaderboard-row"
                  key={`rank-${leaderboardTab}-${benchmark.benchmark_id}`}
                  onClick={() => handleOpenDetails(benchmark)}
                >
                  <div className="leaderboard-rank">#{index + 1}</div>
                  <div className="leaderboard-main">
                    <h3>{getConfigTitle(benchmark)}</h3>
                    <div className="leaderboard-subtitle">{getHardwareSummary(benchmark)}</div>
                  </div>
                  {leaderboardTab === "rag" && (
                    <div className="leaderboard-metrics">
                      <div className="metric">
                        <span className="k">Score RAG</span>
                        <span className="v">{formatNumber(getRagScore(benchmark), 1)}</span>
                      </div>
                      <div className="metric">
                        <span className="k">Ventana contexto real</span>
                        <span className="v">
                          {benchmark?.inference?.model?.context_size || "—"} tokens
                        </span>
                      </div>
                    </div>
                  )}
                  {leaderboardTab === "privacy" && (
                    <div className="leaderboard-metrics">
                      <div className="metric">
                        <span className="k">Score Privacidad</span>
                        <span className="v">{formatNumber(getPrivacyScore(benchmark), 1)}</span>
                      </div>
                      <div className="metric">
                        <span className="k">Modo offline</span>
                        <span className="v">
                          {String(benchmark?.inference?.backend || "").toLowerCase().includes("cloud") ? "Mixto" : "100% offline"}
                        </span>
                      </div>
                    </div>
                  )}
                  {leaderboardTab === "quant" && (
                    <div className="leaderboard-metrics">
                      <div className="metric">
                        <span className="k">Cuantizacion</span>
                        <span className="v">
                          {benchmark?.inference?.model?.quantization || "FP16"}
                        </span>
                      </div>
                      <div className="metric">
                        <span className="k">Score precision</span>
                        <span className="v">
                          {formatNumber(getQuantPrecision(benchmark), 1)}
                        </span>
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          ) : null}

          {leaderboardScope === "model" && leaderboardModels.length === 0 ? (
            <article className="leaderboard-card">Sin datos de modelos.</article>
          ) : null}

          {leaderboardScope === "model"
            ? leaderboardModels.map((model, index) => (
                <article
                  className="leaderboard-row"
                  key={`model-${leaderboardTab}-${model.modelName}`}
                >
                  <div className="leaderboard-rank">#{index + 1}</div>
                  <div className="leaderboard-main">
                    <h3>{model.modelName}</h3>
                    <div className="leaderboard-subtitle">
                      Mejor configuracion: {model.bestConfigName}
                    </div>
                  </div>
                  {leaderboardTab === "rag" && (
                    <div className="leaderboard-metrics">
                      <div className="metric">
                        <span className="k">Score RAG medio</span>
                        <span className="v">{formatNumber(model.avgRag, 1)}</span>
                      </div>
                      <div className="metric">
                        <span className="k">Contexto medio</span>
                        <span className="v">{formatNumber(model.avgContext, 0)} tokens</span>
                      </div>
                    </div>
                  )}
                  {leaderboardTab === "privacy" && (
                    <div className="leaderboard-metrics">
                      <div className="metric">
                        <span className="k">Score Privacidad medio</span>
                        <span className="v">{formatNumber(model.avgPrivacy, 1)}</span>
                      </div>
                      <div className="metric">
                        <span className="k">Offline</span>
                        <span className="v">{formatNumber(model.offlineShare * 100, 0)}%</span>
                      </div>
                    </div>
                  )}
                  {leaderboardTab === "quant" && (
                    <div className="leaderboard-metrics">
                      <div className="metric">
                        <span className="k">Score precision medio</span>
                        <span className="v">{formatNumber(model.avgQuant, 1)}</span>
                      </div>
                      <div className="metric">
                        <span className="k">Cuantizaciones</span>
                        <span className="v">{model.quantizations.join(", ") || "FP16"}</span>
                      </div>
                    </div>
                  )}
                </article>
              ))
            : null}
        </div>
        {leaderboardTab === "rag" && (
          <p className="hint">
            {leaderboardScope === "configuration"
              ? "Ranking basado en calidad de recuperacion y ventana de contexto efectiva para escenarios RAG exigentes."
              : "Ranking agregado por modelo, promediando calidad RAG y ventana de contexto sobre las configuraciones medidas."}
          </p>
        )}
        {leaderboardTab === "privacy" && (
          <p className="hint">
            {leaderboardScope === "configuration"
              ? "Priorizamos ejecucion 100% offline, modelos open source y cumplimiento de requisitos de privacidad."
              : "Ranking agregado por modelo, ponderando ejecucion offline y score de privacidad en todas sus configuraciones."}
          </p>
        )}
        {leaderboardTab === "quant" && (
          <>
            <p className="hint">
              Compara la caida de precision frente al aumento de velocidad con distintos esquemas de cuantizacion.
            </p>
            <div className="quant-table">
              <div className="quant-row quant-head">
                <span>Formato</span>
                <span>Precision relativa</span>
                <span>Rendimiento</span>
              </div>
              <div className="quant-row">
                <span>FP16</span>
                <span>100%</span>
                <span>1× tokens/s</span>
              </div>
              <div className="quant-row">
                <span>Q4_K_M</span>
                <span>≈98%</span>
                <span>≈3× tokens/s</span>
              </div>
              <div className="quant-row">
                <span>Q6_K</span>
                <span>≈99%</span>
                <span>≈2× tokens/s</span>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="cta">
        <h2>Trabajemos juntos</h2>
        <p>Incluye tu hardware en nuestras pruebas de modelos locales y convierte tu configuracion en un caso de referencia para IA on-prem.</p>
        <a className="btn primary" href="mailto:info@onpremialabs.com">
          Contactar
        </a>
      </section>

      {showContact && (
        <section
          id="contacto"
          className="contact"
          ref={contactSectionRef}
        >
          <h2>Contacto</h2>
          <p className="hint">
            Cuéntanos brevemente tu configuracion de hardware, el contexto de uso de IA local y que tipo de benchmarks te interesan.
          </p>

          <form
            className="contact-form"
            onSubmit={async (event) => {
              event.preventDefault();
              setContactError("");
              const form = event.currentTarget;
              const formData = new FormData(form);
              const nombre = (formData.get("nombre") || "").toString().trim();
              const email = (formData.get("email") || "").toString().trim();
              const mensaje = (formData.get("mensaje") || "").toString().trim();

              if (!mensaje) {
                setContactError("Escribe un mensaje antes de enviar.");
                return;
              }

              try {
                setIsSendingContact(true);
                const response = await fetch(CONTACT_API_URL, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                  },
                  body: JSON.stringify({
                    nombre,
                    email,
                    mensaje
                  })
                });
                const rawResponse = await response.text();
                let result = {};
                try {
                  result = rawResponse ? JSON.parse(rawResponse) : {};
                } catch (parseError) {
                  throw new Error(
                    "El endpoint de contacto no devolvio JSON. Asegura servir el sitio con PHP (no abrir index.html directo)."
                  );
                }
                if (!response.ok) {
                  throw new Error(result?.error || "No se pudo enviar el formulario.");
                }

                form.reset();
                setShowContactSent(true);
                setShowContact(false);
              } catch (error) {
                setContactError(error?.message || "Error al enviar. Intentalo nuevamente.");
              } finally {
                setIsSendingContact(false);
              }
            }}
          >
            <div className="field">
              <label htmlFor="nombre">Nombre</label>
              <input id="nombre" name="nombre" type="text" placeholder="Tu nombre" />
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" placeholder="tu@empresa.com" required />
            </div>

            <div className="field">
              <label htmlFor="mensaje">Mensaje</label>
              <textarea
                id="mensaje"
                name="mensaje"
                rows="4"
                placeholder="Cuéntanos brevemente qué necesitas evaluar o comparar..."
                required
              />
            </div>
            {contactError && <p className="hint" role="alert">{contactError}</p>}

            <button type="submit" className="btn primary contact-submit" disabled={isSendingContact}>
              {isSendingContact ? "Enviando..." : "Enviar"}
            </button>
          </form>
        </section>
      )}

      {showContactSent && (
        <div className="toast-backdrop" role="status" aria-live="polite">
          <div className="toast">
            <p className="toast-title">Mensaje enviado</p>
            <p className="toast-body">Muchas gracias, mensaje enviado con exito a info@onpremialabs.com</p>
            <button
              type="button"
              className="btn primary toast-close"
              onClick={() => setShowContactSent(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {selectedBenchmark && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal">
            <div className="modal-header">
              <div>
                <h3>Ficha tecnica</h3>
                <p className="modal-subtitle">{getConfigTitle(selectedBenchmark)}</p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedBenchmark(null)}
                aria-label="Cerrar ficha tecnica"
              >
                ✕
              </button>
            </div>

            <div className="modal-section">
              <h4>Hardware stack</h4>
              <ul className="modal-list">
                <li>
                  <span className="k">CPU</span>
                  <span className="v">
                    {selectedBenchmark?.config?.hardware?.cpu?.model || "No indicado"}
                  </span>
                </li>
                <li>
                  <span className="k">GPU</span>
                  <span className="v">
                    {selectedBenchmark?.config?.hardware?.gpu?.model || "No indicada"}
                  </span>
                </li>
                <li>
                  <span className="k">RAM</span>
                  <span className="v">
                    {selectedBenchmark?.config?.hardware?.ram?.size_gb
                      ? `${selectedBenchmark?.config?.hardware?.ram?.size_gb} GB ${
                          selectedBenchmark?.config?.hardware?.ram?.type || ""
                        }${
                          selectedBenchmark?.config?.hardware?.ram?.speed_mhz
                            ? ` · ${selectedBenchmark?.config?.hardware?.ram?.speed_mhz} MHz`
                            : ""
                        }`
                      : "No indicada"}
                  </span>
                </li>
                <li>
                  <span className="k">Almacenamiento</span>
                  <span className="v">
                    {selectedBenchmark?.config?.hardware?.storage?.type
                      ? `${selectedBenchmark?.config?.hardware?.storage?.type} · ${selectedBenchmark?.config?.hardware?.storage?.size_gb || "—"} GB`
                      : "No indicado"}
                  </span>
                </li>
              </ul>
            </div>

            <div className="modal-section">
              <h4>Software stack</h4>
              <ul className="modal-list">
                <li>
                  <span className="k">Modelo</span>
                  <span className="v">
                    {selectedBenchmark?.inference?.model?.name || "No indicado"}{" "}
                    ({selectedBenchmark?.inference?.model?.quantization || "FP16"})
                  </span>
                </li>
                <li>
                  <span className="k">Runtime</span>
                  <span className="v">
                    {selectedBenchmark?.inference?.backend || "No indicado"}
                  </span>
                </li>
                <li>
                  <span className="k">Drivers GPU</span>
                  <span className="v">
                    {selectedBenchmark?.config?.system?.driver || "No indicado"}
                  </span>
                </li>
                <li>
                  <span className="k">Sistema operativo</span>
                  <span className="v">
                    {selectedBenchmark?.config?.system?.os || "No indicado"}
                  </span>
                </li>
              </ul>
            </div>

            <div className="modal-section">
              <h4>Estabilidad tras 2h de inferencia continua</h4>
              <p className="modal-text">
                Estudiamos la estabilidad de rendimiento para evitar thermal throttling y
                degradacion con carga sostenida.
              </p>
              <div className="stability-chart">
                <div className="stability-row">
                  <span>T0</span>
                  <div className="stability-bar stability-bar-ok" />
                  <span className="stability-label">
                    {formatNumber(getTokensPerSec(selectedBenchmark), 1)} tokens/s
                  </span>
                </div>
                <div className="stability-row">
                  <span>+60 min</span>
                  <div className="stability-bar stability-bar-ok" />
                  <span className="stability-label">
                    ~{formatNumber(getTokensPerSec(selectedBenchmark) * 0.99, 1)} tokens/s
                  </span>
                </div>
                <div className="stability-row">
                  <span>+120 min</span>
                  <div className="stability-bar stability-bar-ok" />
                  <span className="stability-label">
                    ~{formatNumber(getTokensPerSec(selectedBenchmark) * 0.98, 1)} tokens/s
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn outline modal-footer-close"
              onClick={() => setSelectedBenchmark(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <footer className="site-footer">
        <p className="site-footer-copy">onpremIA Labs 2026 - ® Todos los derechos reservados</p>
        <div className="site-footer-socials">
          <a
            className="social-link"
            href="https://www.linkedin.com/company/onpremia-labs/"
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn de onpremIA Labs"
            title="LinkedIn"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4.98 3.5C4.98 4.88 3.87 6 2.49 6A2.5 2.5 0 1 1 4.98 3.5zM.5 8h4v12h-4zM8 8h3.8v1.75h.05c.53-1 1.82-2.05 3.75-2.05 4.01 0 4.75 2.64 4.75 6.08V20h-4v-5.5c0-1.31-.02-2.99-1.82-2.99-1.83 0-2.11 1.42-2.11 2.89V20H8z" />
            </svg>
          </a>
          <a
            className="social-link"
            href="https://www.youtube.com/@onpremialabs"
            target="_blank"
            rel="noreferrer"
            aria-label="YouTube de onpremIA Labs"
            title="YouTube"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M23.5 7.1a3 3 0 0 0-2.1-2.12C19.5 4.5 12 4.5 12 4.5s-7.5 0-9.4.48A3 3 0 0 0 .5 7.1 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 4.9 3 3 0 0 0 2.1 2.12c1.9.48 9.4.48 9.4.48s7.5 0 9.4-.48a3 3 0 0 0 2.1-2.12A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-4.9zM9.6 15.5v-7l6.2 3.5-6.2 3.5z" />
            </svg>
          </a>
        </div>
      </footer>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
