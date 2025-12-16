import { describe, expect, it } from "vitest";

import { ActivityPlanSchema } from "./activity-plan";

const basePlan = {
  targetIpa: "/ʃ/ inicial",
  ageOrGrade: "1º ano",
  objectives: [
    "Trabalhar discriminação auditiva do som /ʃ/",
    "Introduzir produção em palavras simples",
  ],
  accessibilityNeeds: [
    { area: "Comunicação", support: "Uso de figuras para apoio visual" },
  ],
  activities: [
    {
      title: "Aquecimento articulatório",
      steps: [
        {
          title: "Respiração diafragmática",
          instructions:
            "Oriente inspirações profundas e expirações longas com contagem até 4.",
          durationMinutes: 5,
        },
        {
          title: "Alongamento lingual",
          instructions:
            "Peça para o estudante tocar a ponta da língua nos cantos da boca e alvejar o som /ʃ/.",
          durationMinutes: 8,
        },
      ],
      resources: ["Cartões visuais", "Áudio de referência"],
    },
  ],
};

describe("ActivityPlanSchema", () => {
  it("aceita um plano completo e bem formado", () => {
    const result = ActivityPlanSchema.safeParse(basePlan);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.activities[0].steps[1].durationMinutes).toBe(8);
      expect(result.data.accessibilityNeeds[0].area).toBe("Comunicação");
    }
  });

  it("falha quando faltam atividades ou alvos IPA", () => {
    const result = ActivityPlanSchema.safeParse({
      ...basePlan,
      targetIpa: "",
      activities: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join("."));
      expect(paths).toContain("targetIpa");
      expect(paths).toContain("activities");
    }
  });
});
