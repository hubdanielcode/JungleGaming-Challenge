import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { environmentConfig } from "@/lib/env";
import { mergeClassNames } from "@/lib/utils";

/* - Controle de demonstração, não faz parte do layout do Figma: reinicia o banco simulado (MSW) e os cenários de rede para o estado inicial das fixtures, já que o mock persiste em localStorage para sobreviver a um refresh. Só é renderizado com os mocks ativos — nunca aparece num build de produção apontando para uma API real. - */

const ScenarioResetButton = () => {
  const [isResetting, setIsResetting] = useState(false);

  if (!environmentConfig.mocksEnabled) {
    return null;
  }

  const handleResetScenario = async () => {
    setIsResetting(true);

    try {
      await fetch("/api/dev/reset", { method: "POST" });
    } finally {
      window.location.reload();
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleResetScenario()}
      disabled={isResetting}
      className={mergeClassNames(
        "fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-border-strong bg-surface px-4 py-2.5 text-xs font-semibold text-muted shadow-lg backdrop-blur transition-colors hover:text-foreground",
        "disabled:cursor-not-allowed disabled:opacity-60",
      )}
      title="Reinicia o banco simulado (MSW) para o estado inicial das fixtures"
    >
      <RotateCcw size={13} />

      {isResetting ? "Reiniciando..." : "Resetar cenário"}
    </button>
  );
};

export { ScenarioResetButton };
