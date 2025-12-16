import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { getStorageProvider } from "@/lib/storage";

const downloadSchema = z.object({
  key: z.string().min(1),
});

function keyMatchesOrg(key: string, orgId: string) {
  return key.startsWith(`org/${orgId}/`);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id || !session.user.orgId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = downloadSchema.parse(body);

    if (!keyMatchesOrg(data.key, session.user.orgId)) {
      return NextResponse.json(
        { error: "Chave não pertence à organização." },
        { status: 403 }
      );
    }

    const storage = getStorageProvider();
    const { url } = await storage.getSignedDownloadUrl({ key: data.key });

    return NextResponse.json({ downloadUrl: url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message ?? "Dados inválidos.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("Erro ao gerar URL de download", error);
    return NextResponse.json(
      { error: "Não foi possível gerar a URL de download." },
      { status: 500 }
    );
  }
}
