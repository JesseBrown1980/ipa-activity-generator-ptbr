import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { z } from "zod";

import prisma from "@/lib/db";

const registerSchema = z.object({
  email: z.string().email({ message: "E-mail inválido." }),
  password: z
    .string()
    .min(8, { message: "A senha deve ter pelo menos 8 caracteres." })
    .max(64, { message: "A senha deve ter no máximo 64 caracteres." }),
  orgName: z
    .string()
    .min(2, { message: "Informe o nome da organização." })
    .max(120, { message: "Nome da organização muito longo." }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, orgName } = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json(
        { error: "E-mail já registrado." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const organization = await prisma.organization.create({
      data: { name: orgName },
    });

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        memberships: {
          create: {
            orgId: organization.id,
            role: Role.ADMIN,
          },
        },
      },
    });

    return NextResponse.json({ message: "Conta criada com sucesso." }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message ?? "Dados inválidos.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("Erro ao registrar usuário", error);
    return NextResponse.json(
      { error: "Não foi possível criar a conta agora." },
      { status: 500 }
    );
  }
}
