import { z } from "zod";

const ActivityStepSchema = z.object({
  title: z.string().min(3, "Informe um título para a etapa."),
  instructions: z
    .string()
    .min(10, "Detalhe as instruções pedagógicas da atividade."),
  durationMinutes: z
    .number()
    .int("A duração deve ser um número inteiro de minutos.")
    .positive("A duração precisa ser positiva."),
});

const AccessibilityNeedSchema = z.object({
  area: z.string().min(2, "Informe o domínio da necessidade."),
  support: z.string().min(5, "Descreva o apoio ou ajuste necessário."),
});

export const ActivityPlanSchema = z.object({
  targetIpa: z.string().min(1, "O alvo IPA é obrigatório."),
  ageOrGrade: z
    .string()
    .min(2, "Idade ou série obrigatória para contextualizar o plano."),
  objectives: z
    .array(z.string().min(3, "Descreva o objetivo de forma clara."))
    .min(1, "Adicione pelo menos um objetivo de aprendizagem."),
  accessibilityNeeds: z
    .array(AccessibilityNeedSchema)
    .default([]),
  activities: z
    .array(
      z.object({
        title: z.string().min(3, "Atividades precisam de um título."),
        steps: z.array(ActivityStepSchema).min(1, "Inclua pelo menos um passo."),
        resources: z
          .array(z.string().min(2, "Liste recursos com pelo menos 2 caracteres."))
          .default([]),
      })
    )
    .min(1, "Inclua ao menos uma atividade no plano."),
});

export type ActivityPlan = z.infer<typeof ActivityPlanSchema>;
