import { NextRequest, NextResponse } from "next/server";

import OpenAI from "openai";
import { Role } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { applyRateLimit, rateLimitPolicies } from "@/lib/rate-limit";
import { requireRole } from "@/lib/rbac";
import { ActivityPlanSchema } from "@/lib/schemas/activity-plan";

const PlanGenerationInputSchema = ActivityPlanSchema.omit({ activities: true }).extend({
  accessibilityNeeds: z
    .array(
      z.object({
        area: z.string().min(2),
        support: z.string().min(5),
      })
    )
    .default([]),
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, rateLimitPolicies.planGeneration);
  if (limited) {
    return limited;
  }

  const session = await auth();

  if (!session?.user?.id || !session.user.orgId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    requireRole(session, [Role.ADMIN]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acesso negado.";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao ler o corpo.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const parsedInput = PlanGenerationInputSchema.safeParse(body);

  if (!parsedInput.success) {
    return NextResponse.json(
      { error: "Dados inválidos para geração do plano.", details: parsedInput.error.format() },
      { status: 400 }
    );
  }

  const model = process.env.OPENAI_MODEL;

  if (!openai.apiKey || !model) {
    return NextResponse.json(
      { error: "Configuração do modelo de IA ausente no servidor." },
      { status: 500 }
    );
  }

  try {
    const systemPrompt =
      "Você é um assistente que gera planos de atividades pedagógicas inclusivas. " +
      "Sempre responda apenas com JSON válido seguindo o schema: {targetIpa, ageOrGrade, objectives[], accessibilityNeeds[], activities[{title, steps[{title, instructions, durationMinutes}], resources[]}]}. " +
      "Assegure coerência com idade/série, objetivos e necessidades informadas. Mantenha português claro.";

    const userPrompt = `Crie um plano completo com base nestes dados: ${JSON.stringify(
      parsedInput.data
    )}`;

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Não foi possível gerar o plano com a IA." },
        { status: 502 }
      );
    }

    let generatedPlan: unknown;

    try {
      generatedPlan = JSON.parse(content);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Resposta inválida da IA.";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const validatedPlan = ActivityPlanSchema.safeParse(generatedPlan);

    if (!validatedPlan.success) {
      return NextResponse.json(
        {
          error: "Plano gerado fora do formato esperado.",
          details: validatedPlan.error.format(),
        },
        { status: 502 }
      );
    }

    const savedPlan = await prisma.plan.create({
      data: {
        orgId: session.user.orgId,
        createdByUserId: session.user.id,
        targetIpa: parsedInput.data.targetIpa,
        ageOrGrade: parsedInput.data.ageOrGrade,
        needsJson: {
          accessibilityNeeds: parsedInput.data.accessibilityNeeds,
          objectives: parsedInput.data.objectives,
        },
        planJson: validatedPlan.data,
      },
    });

    return NextResponse.json(savedPlan, { status: 200 });
  } catch (error) {
    console.error("Erro ao gerar plano com OpenAI", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
