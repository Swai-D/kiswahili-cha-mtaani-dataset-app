import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { countWords } from "../../../../lib/helpers";

// Rahisi, robust-enough CSV parser inayoshughulikia quoted fields zenye
// comma/newline ndani yake (RFC4180-ish). Haihitaji dependency ya ziada.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") { /* ignore */ }
      else field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }

  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1)
    .filter((r) => r.length > 1 || (r[0] && r[0].trim()))
    .map((r) => {
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = (r[idx] || "").trim(); });
      return obj;
    });
}

const VALID_SOURCE_TYPES = new Set([
  "Mazungumzo ya kawaida", "Tamthilia", "Redio", "Filamu/Bongo Movie",
  "Mitandao ya kijamii", "Jamii Forums", "Nyingine",
]);
const VALID_REGIONS = new Set([
  "Dar es Salaam", "Mwanza", "Arusha", "Dodoma", "Mbeya", "Zanzibar",
  "Tanga", "Sijui / Mchanganyiko", "Nyingine",
]);
const VALID_TOPICS = new Set([
  "Maisha ya kila siku", "Mapenzi", "Biashara", "Michezo", "Siasa",
  "Dini", "Elimu", "Nyingine",
]);

function normalizeRecord(r) {
  const text = (r.text || "").trim();
  if (!text) return null;
  return {
    type: "sentence",
    textSheng: text,
    textStandard: (r.text_standard || r.textStandard || "").trim() || null,
    sourceType: VALID_SOURCE_TYPES.has(r.source_type || r.sourceType) ? (r.source_type || r.sourceType) : "Nyingine",
    sourceName: (r.source_name || r.sourceName || "").trim() || null,
    region: VALID_REGIONS.has(r.region) ? r.region : "Sijui / Mchanganyiko",
    topic: VALID_TOPICS.has(r.topic) ? r.topic : "Nyingine",
    notes: (r.notes || "").trim() || null,
    wordCount: countWords(text),
    qualityFlag: "haijakaguliwa", // data ya kupakiwa kwa wingi LAZIMA ikaguliwe kwanza
  };
}

export async function POST(request) {
  const contentType = request.headers.get("content-type") || "";
  let rawRecords = [];

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!file) return NextResponse.json({ error: "Hakuna faili." }, { status: 400 });
      const text = await file.text();
      rawRecords = parseCsv(text);
    } else {
      const body = await request.json();
      rawRecords = Array.isArray(body.records) ? body.records : [];
    }
  } catch (e) {
    return NextResponse.json({ error: "Faili/JSON haisomeki: " + e.message }, { status: 400 });
  }

  if (rawRecords.length === 0) {
    return NextResponse.json({ error: "Hakuna records zilizopatikana." }, { status: 400 });
  }

  const normalized = rawRecords.map(normalizeRecord).filter(Boolean);
  const skipped = rawRecords.length - normalized.length;

  if (normalized.length === 0) {
    return NextResponse.json({ error: "Hakuna records sahihi (zote hazina 'text').", skipped }, { status: 400 });
  }

  const result = await prisma.entry.createMany({ data: normalized });

  return NextResponse.json({
    ok: true,
    created: result.count,
    skipped,
    total: rawRecords.length,
  });
}
