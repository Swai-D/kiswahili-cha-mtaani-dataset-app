import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  let settings = await prisma.settings.findUnique({ where: { id: 1 } });

  if (!settings) {
    const target = new Date();
    target.setDate(target.getDate() + 365);
    settings = await prisma.settings.create({
      data: {
        id: 1,
        startDate: new Date(),
        targetDate: target,
        goalWords: parseInt(process.env.GOAL_WORDS || "1000000", 10),
      },
    });
  }

  const agg = await prisma.entry.aggregate({
    where: { deleted: false },
    _sum: { wordCount: true },
    _count: { _all: true },
  });

  return NextResponse.json({
    totalWords: agg._sum.wordCount || 0,
    totalEntries: agg._count._all || 0,
    startDate: settings.startDate,
    targetDate: settings.targetDate,
    goalWords: settings.goalWords,
  });
}
