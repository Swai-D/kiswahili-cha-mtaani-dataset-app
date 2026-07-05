import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { countWords } from "../../../lib/helpers";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const region = searchParams.get("region");
  const topic = searchParams.get("topic");
  const sourceType = searchParams.get("sourceType");
  const type = searchParams.get("type");
  const qualityFlag = searchParams.get("qualityFlag");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  
  let page = parseInt(searchParams.get("page") || "1", 10);
  if (isNaN(page) || page < 1) page = 1;
  
  let limit = parseInt(searchParams.get("limit") || "100", 10);
  if (isNaN(limit) || limit < 1) limit = 100;
  limit = Math.min(limit, 1000);
  
  const skip = (page - 1) * limit;

  const where = {
    deleted: false,
    ...(q
      ? {
          OR: [
            { textSheng: { contains: q, mode: "insensitive" } },
            { textStandard: { contains: q, mode: "insensitive" } },
            { notes: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(region ? { region } : {}),
    ...(topic ? { topic } : {}),
    ...(sourceType ? { sourceType } : {}),
    ...(type ? { type } : {}),
    ...(qualityFlag ? { qualityFlag } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const [entries, totalCount] = await Promise.all([
    prisma.entry.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.entry.count({ where }),
  ]);

  return NextResponse.json({ entries, totalCount, page, limit });
}

export async function POST(request) {
  const body = await request.json();
  const { type, textSheng, textStandard, turns, sourceType, sourceName, region, topic, notes } = body;

  if (type === "dialogue") {
    if (!Array.isArray(turns) || turns.filter((t) => t.text && t.text.trim()).length < 2) {
      return NextResponse.json(
        { error: "Ongeza angalau zamu mbili zenye maandishi kwenye mazungumzo." },
        { status: 400 }
      );
    }
  } else if (!textSheng || !textSheng.trim()) {
    return NextResponse.json({ error: "Andika maneno ya mtaani kabla ya kuhifadhi." }, { status: 400 });
  }

  const cleanTurns =
    type === "dialogue"
      ? turns
          .filter((t) => t.text && t.text.trim())
          .map((t) => ({ speaker: (t.speaker || "Msemaji").trim(), text: t.text.trim() }))
      : null;

  const wordCount =
    type === "dialogue"
      ? cleanTurns.reduce((sum, t) => sum + countWords(t.text), 0)
      : countWords(textSheng);

  const entry = await prisma.entry.create({
    data: {
      type: type === "dialogue" ? "dialogue" : "sentence",
      textSheng: type === "dialogue" ? null : textSheng.trim(),
      textStandard: type === "dialogue" ? null : (textStandard || "").trim() || null,
      turns: cleanTurns || undefined,
      sourceType: sourceType || "Nyingine",
      sourceName: (sourceName || "").trim() || null,
      region: region || "Nyingine",
      topic: topic || "Nyingine",
      notes: (notes || "").trim() || null,
      wordCount,
    },
  });

  return NextResponse.json({ entry });
}
