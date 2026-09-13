export type LatencyProfile = "none" | "fast" | "variable" | "slow";

export interface ScenarioConfig {
  latency: LatencyProfile;
  transientFailureRate: number;
  offline: boolean;
  forceOrderTimeout: boolean;
  nextPaymentOutcome: "confirmed" | "declined" | null;
}

const scenarioStorageKey = "kurio-scenarios";

const defaultScenarioConfig: ScenarioConfig = {
  latency: "fast",
  transientFailureRate: 0,
  offline: false,
  forceOrderTimeout: false,
  nextPaymentOutcome: null,
};

const readScenarioFromUrl = (): Partial<ScenarioConfig> => {
  if (typeof window === "undefined") {
    return {};
  }

  const searchParameters = new URLSearchParams(window.location.search);
  const scenarioName = searchParameters.get("scenario");

  switch (scenarioName) {
    case "slow":
      return { latency: "slow" };

    case "flaky":
      return { latency: "variable", transientFailureRate: 0.3 };

    case "offline":
      return { offline: true };

    case "order-timeout":
      return { forceOrderTimeout: true };

    case "payment-declined":
      return { nextPaymentOutcome: "declined" };

    default:
      return {};
  }
};

let cachedScenarioConfig: ScenarioConfig | null = null;

const getScenarioConfig = (): ScenarioConfig => {
  if (cachedScenarioConfig) {
    return cachedScenarioConfig;
  }

  try {
    const storedScenarioConfig = localStorage.getItem(scenarioStorageKey);
    const parsedScenarioConfig = storedScenarioConfig ? (JSON.parse(storedScenarioConfig) as Partial<ScenarioConfig>) : {};

    cachedScenarioConfig = {
      ...defaultScenarioConfig,
      ...parsedScenarioConfig,
      ...readScenarioFromUrl(),
    };
  } catch {
    cachedScenarioConfig = {
      ...defaultScenarioConfig,
      ...readScenarioFromUrl(),
    };
  }

  return cachedScenarioConfig;
};

const setScenarioConfig = (scenarioPatch: Partial<ScenarioConfig>) => {
  cachedScenarioConfig = {
    ...getScenarioConfig(),
    ...scenarioPatch,
  };

  localStorage.setItem(scenarioStorageKey, JSON.stringify(cachedScenarioConfig));
};

const resetScenarioConfig = () => {
  cachedScenarioConfig = { ...defaultScenarioConfig };
  localStorage.removeItem(scenarioStorageKey);
};

const latencyRangeByProfile: Record<LatencyProfile, [number, number]> = {
  none: [0, 0],
  fast: [80, 200],
  variable: [100, 1800],
  slow: [1500, 3500],
};

const simulateNetworkLatency = async () => {
  const [minimumLatencyMs, maximumLatencyMs] = latencyRangeByProfile[getScenarioConfig().latency];

  if (maximumLatencyMs === 0) {
    return;
  }

  const latencyMs = minimumLatencyMs + Math.random() * (maximumLatencyMs - minimumLatencyMs);

  await new Promise<void>((resolve) => setTimeout(resolve, latencyMs));
};

const shouldFailTransiently = () => {
  return Math.random() < getScenarioConfig().transientFailureRate;
};

if (typeof window !== "undefined") {
  (
    window as unknown as {
      kurioScenarios: {
        get: typeof getScenarioConfig;
        set: typeof setScenarioConfig;
        reset: typeof resetScenarioConfig;
      };
    }
  ).kurioScenarios = {
    get: getScenarioConfig,
    set: setScenarioConfig,
    reset: resetScenarioConfig,
  };
}

export { getScenarioConfig, setScenarioConfig, resetScenarioConfig, simulateNetworkLatency, shouldFailTransiently };
