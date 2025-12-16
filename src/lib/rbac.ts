import { Role } from "@prisma/client";
import { Session } from "next-auth";

export function requireRole(session: Session | null, roles: Role[]) {
  if (!session?.user?.role) {
    throw new Error("Usuário sem sessão ativa.");
  }

  if (!roles.includes(session.user.role)) {
    throw new Error("Acesso negado para este perfil.");
  }

  return true;
}
