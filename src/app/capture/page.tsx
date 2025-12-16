import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

import CaptureClient from "./CaptureClient";

type ConsentInfo = {
  audioAllowed: boolean;
  signedAt: string;
};

type CaptureStudent = {
  id: string;
  code: string;
  displayName: string;
  consent: ConsentInfo | null;
};

export default async function CapturePage() {
  const session = await auth();

  if (!session?.user?.id || !session.user.orgId) {
    redirect("/login");
  }

  const students = await prisma.student.findMany({
    where: { orgId: session.user.orgId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      displayName: true,
      consents: {
        orderBy: { signedAt: "desc" },
        take: 1,
        select: { audioAllowed: true, signedAt: true },
      },
    },
  });

  const captureStudents: CaptureStudent[] = students.map((student) => ({
    id: student.id,
    code: student.code,
    displayName: student.displayName ?? "",
    consent: student.consents[0]
      ? {
          audioAllowed: student.consents[0].audioAllowed,
          signedAt: student.consents[0].signedAt.toISOString(),
        }
      : null,
  }));

  return <CaptureClient initialStudents={captureStudents} />;
}
