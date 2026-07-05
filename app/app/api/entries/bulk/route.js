import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(request) {
  const { ids } = await request.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "Hakuna ids." }, { status: 400 });
  }
  const result = await prisma.entry.updateMany({
    where: { id: { in: ids } },
    data: { deleted: true },
  });
  return NextResponse.json({ ok: true, count: result.count });
}
