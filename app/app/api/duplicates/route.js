import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const entries = await prisma.entry.findMany({
    where: { deleted: false, type: "sentence" },
    select: { id: true, textSheng: true, createdAt: true, region: true, sourceType: true },
    orderBy: { createdAt: "asc" },
  });

  const groups = new Map();
  for (const e of entries) {
    const key = (e.textSheng || "").trim().toLowerCase().replace(/\s+/g, " ");
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }

  const duplicateGroups = Array.from(groups.entries())
    .filter(([, items]) => items.length > 1)
    .map(([key, items]) => ({ key, count: items.length, entries: items }));

  duplicateGroups.sort((a, b) => b.count - a.count);

  return NextResponse.json({ groups: duplicateGroups, totalDuplicateEntries: duplicateGroups.reduce((s, g) => s + g.count - 1, 0) });
}
