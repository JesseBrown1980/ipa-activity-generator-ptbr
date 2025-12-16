// Minimal development seed to create a demo organization and admin user.
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const organization = await prisma.organization.upsert({
    where: { id: "dev-org" },
    update: {},
    create: {
      id: "dev-org",
      name: "Organização de Desenvolvimento",
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      id: "dev-admin",
      email: "admin@example.com",
      passwordHash: "trocar-esta-senha",
    },
  });

  await prisma.membership.upsert({
    where: { id: "dev-membership" },
    update: {},
    create: {
      id: "dev-membership",
      orgId: organization.id,
      userId: adminUser.id,
      role: "ADMIN",
    },
  });

  console.log("Seed concluído: organização e usuário admin disponíveis.");
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
