import { prisma } from "../../../lib/prisma";
import { splitDataset } from "../../../lib/helpers";

function csvEscape(v) {
  return '"' + String(v ?? "").replace(/"/g, '""') + '"';
}

function toCsv(entries) {
  const cols = [
    "createdAt",
    "type",
    "textSheng",
    "textStandard",
    "turns",
    "sourceType",
    "sourceName",
    "region",
    "topic",
    "notes",
    "wordCount",
    "qualityFlag",
  ];
  const rows = [cols.join(",")];
  for (const e of entries) {
    const row = cols.map((c) => {
      if (c === "turns") {
        return csvEscape(e.turns ? e.turns.map((t) => `${t.speaker}: ${t.text}`).join(" | ") : "");
      }
      return csvEscape(e[c]);
    });
    rows.push(row.join(","));
  }
  return rows.join("\n");
}

function toJsonl(entries) {
  return entries
    .map((e) =>
      JSON.stringify({
        type: e.type,
        text: e.textSheng || null,
        standard_swahili: e.textStandard || null,
        turns: e.turns || null,
        source_type: e.sourceType,
        source_name: e.sourceName || null,
        region: e.region,
        topic: e.topic,
        notes: e.notes || null,
        word_count: e.wordCount,
        quality_flag: e.qualityFlag,
        date: e.createdAt,
      })
    )
    .join("\n");
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") || "jsonl").toLowerCase();
  const part = (searchParams.get("part") || "all").toLowerCase(); // all | train | val | test
  const trainRatio = parseFloat(searchParams.get("trainRatio") || "0.8");
  const valRatio = parseFloat(searchParams.get("valRatio") || "0.1");
  const seed = parseInt(searchParams.get("seed") || "42", 10);
  const onlyGoodQuality = searchParams.get("onlyGood") === "true";

  const entries = await prisma.entry.findMany({
    where: {
      deleted: false,
      ...(onlyGoodQuality ? { qualityFlag: "nzuri" } : {}),
    },
    orderBy: { id: "asc" },
  });

  let selected = entries;
  let filename = "kiswahili_mtaani_dataset";

  if (part !== "all") {
    const { train, val, test } = splitDataset(entries, trainRatio, valRatio, seed);
    selected = { train, val, test }[part] || entries;
    filename = `kiswahili_mtaani_${part}`;
  }

  const body = format === "csv" ? toCsv(selected) : toJsonl(selected);
  const ext = format === "csv" ? "csv" : "jsonl";
  const contentType = format === "csv" ? "text/csv; charset=utf-8" : "application/jsonl; charset=utf-8";

  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}.${ext}"`,
    },
  });
}
