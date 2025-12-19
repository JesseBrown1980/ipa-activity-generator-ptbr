import { Role } from "@prisma/client";
import type { Session } from "next-auth";
import { describe, expect, it } from "vitest";

import { requireRole } from "./rbac";

describe("requireRole", () => {
  const baseSession = {
    user: {
      id: "user-1",
      email: "user@example.com",
      orgId: "org-1",
      role: Role.ADMIN,
      name: "Usuário teste",
    },
    expires: new Date(Date.now() + 60_000).toISOString(),
  } satisfies Session;

  it("permite acesso quando o papel é autorizado", () => {
    expect(requireRole(baseSession, [Role.ADMIN, Role.TEACHER])).toBe(true);
  });

  it("lança erro quando não há sessão ativa", () => {
    expect(() => requireRole(null, [Role.ADMIN])).toThrow(
      "Usuário sem sessão ativa."
    );
  });

  it("lança erro quando o usuário não tem role definida", () => {
    const sessionWithoutRole: Session = {
      ...baseSession,
      user: { ...baseSession.user, role: null },
    } as Session;

    expect(() => requireRole(sessionWithoutRole, [Role.ADMIN])).toThrow(
      "Usuário sem sessão ativa."
    );
  });

  it("bloqueia perfis sem permissão", () => {
    const teacherSession: Session = {
      ...baseSession,
      user: { ...baseSession.user, role: Role.TEACHER },
    };

    expect(() => requireRole(teacherSession, [Role.ADMIN])).toThrow(
      "Acesso negado para este perfil."
    );
  });
});
