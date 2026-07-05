import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { countWords } from "../../../../lib/helpers";

export async function PATCH(request, { params }) {
  const { id } = params;
  const body = await request.json();
  const { type, textSheng, textStandard, turns, sourceType, sourceName, region, topic, notes, qualityFlag } = body;

  const data = {};

  if (sourceType !== undefined) data.sourceType = sourceType;
  if (sourceName !== undefined) data.sourceName = (sourceName || "").trim() || null;
  if (region !== undefined) data.region = region;
  if (topic !== undefined) data.topic = topic;
  if (notes !== undefined) data.notes = (notes || "").trim() || null;
  if (qualityFlag !== undefined) data.qualityFlag = qualityFlag;

  // Only recompute text/turns/wordCount if the caller actually sent them
  if (type === "dialogue" || (type === undefined && Array.isArray(turns))) {
    if (Array.isArray(turns)) {
      const cleanTurns = turns
        .filter((t) => t.text && t.text.trim())
        .map((t) => ({ speaker: (t.speaker || "Msemaji").trim(), text: t.text.trim() }));
      if (cleanTurns.length < 2) {
        return NextResponse.json(
          { error: "Ongeza angalau zamu mbili zenye maandishi kwenye mazungumzo." },
          { status: 400 }
        );
      }
      data.type = "dialogue";
      data.turns = cleanTurns;
      data.textSheng = null;
      data.textStandard = null;
      data.wordCount = cleanTurns.reduce((sum, t) => sum + countWords(t.text), 0);
    }
  } else if (textSheng !== undefined) {
    if (!textSheng.trim()) {
      return NextResponse.json({ error: "Maneno ya mtaani hayawezi kuwa tupu." }, { status: 400 });
    }
    data.type = "sentence";
    data.textSheng = textSheng.trim();
    data.textStandard = (textStandard || "").trim() || null;
    data.turns = null;
    data.wordCount = countWords(textSheng);
  }

  try {
    const entry = await prisma.entry.update({ where: { id }, data });
    return NextResponse.json({ entry });
  } catch (e) {
    return NextResponse.json({ error: "Haikupatikana." }, { status: 404 });
  }
}

export async function DELETE(_request, { params }) {
  const { id } = params;
  try {
    await prisma.entry.update({
      where: { id },
      data: { deleted: true },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Haikupatikana." }, { status: 404 });
  }
}
