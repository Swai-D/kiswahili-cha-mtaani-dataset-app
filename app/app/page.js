"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SOURCE_TYPES, REGIONS, TOPICS, countWords } from "../lib/helpers";

function emptyTurns() {
  return [
    { speaker: "Msemaji A", text: "" },
    { speaker: "Msemaji B", text: "" },
  ];
}

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState("");

  const [entryType, setEntryType] = useState("sentence");
  const [textSheng, setTextSheng] = useState("");
  const [textStandard, setTextStandard] = useState("");
  const [turns, setTurns] = useState(emptyTurns());
  const [sourceType, setSourceType] = useState(SOURCE_TYPES[0]);
  const [sourceName, setSourceName] = useState("");
  const [region, setRegion] = useState(REGIONS[0]);
  const [topic, setTopic] = useState(TOPICS[0]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/stats");
    const data = await res.json();
    setStats(data);
  }, []);

  const loadEntries = useCallback(async (q) => {
    setLoadingList(true);
    const res = await fetch("/api/entries?q=" + encodeURIComponent(q || ""));
    const data = await res.json();
    setEntries(data.entries || []);
    setLoadingList(false);
  }, []);

  useEffect(() => {
    loadStats();
    loadEntries("");
  }, [loadStats, loadEntries]);

  function resetForm() {
    setTextSheng("");
    setTextStandard("");
    setTurns(emptyTurns());
    setSourceName("");
    setNotes("");
  }

  function updateTurn(i, field, value) {
    setTurns((prev) => prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));
  }
  function addTurn() {
    setTurns((prev) => [...prev, { speaker: "", text: "" }]);
  }
  function removeTurn(i) {
    setTurns((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    setStatus("Inahifadhi...");
    setSaving(true);
    const payload = {
      type: entryType,
      textSheng,
      textStandard,
      turns,
      sourceType,
      sourceName,
      region,
      topic,
      notes,
    };
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Hitilafu imetokea.");
      } else {
        setStatus("Imehifadhiwa.");
        resetForm();
        await loadStats();
        await loadEntries(search);
        setTimeout(() => setStatus((s) => (s === "Imehifadhiwa." ? "" : s)), 2000);
      }
    } catch (e) {
      setStatus("Imeshindwa kuunganisha na server.");
    }
    setSaving(false);
  }

  async function handleDelete(id) {
    await fetch("/api/entries/" + id, { method: "DELETE" });
    await loadStats();
    await loadEntries(search);
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  }

  const liveWordCount =
    entryType === "sentence"
      ? countWords(textSheng)
      : turns.reduce((sum, t) => sum + countWords(t.text), 0);

  const pct = stats ? Math.min(100, (stats.totalWords / stats.goalWords) * 100) : 0;
  let paceInfo = "—";
  let daysLeftLabel = "—";
  if (stats) {
    const now = new Date();
    const target = new Date(stats.targetDate);
    const start = new Date(stats.startDate);
    const daysLeft = Math.max(0, Math.round((target - now) / 86400000));
    const daysPassed = Math.max(1, Math.round((now - start) / 86400000));
    const remaining = Math.max(0, stats.goalWords - stats.totalWords);
    const neededPace = daysLeft > 0 ? Math.ceil(remaining / daysLeft) : 0;
    const actualPace = Math.round(stats.totalWords / daysPassed);
    paceInfo = `wastani wako: ${actualPace.toLocaleString()} maneno/siku · unahitaji: ${neededPace.toLocaleString()} maneno/siku`;
    daysLeftLabel = `${daysLeft} siku zimebaki`;
  }

  return (
    <div className="wrap">
      <div className="topbar">
        <header>
          <h1>Kiswahili cha Mtaani</h1>
          <p className="sub">Dataset ya lugha ya mtaani — ukusanyaji wa maneno halisi.</p>
        </header>
        <button className="logout" onClick={handleLogout}>toka</button>
      </div>
      <div style={{ marginBottom: 10 }}>
        <a className="navlink" href="/admin">→ Fungua Admin Dashboard (CRUD, filters, export split)</a>
      </div>

      <div className="progress-card">
        <div className="progress-top">
          <div>
            <div className="progress-count">{stats ? stats.totalWords.toLocaleString() : "…"}</div>
            <div className="progress-goal">kati ya lengo la maneno {stats ? stats.goalWords.toLocaleString() : "1,000,000"}</div>
          </div>
          <div className="progress-goal">sentensi {stats ? stats.totalEntries.toLocaleString() : 0} zimeongezwa</div>
        </div>
        <div className="bar-track"><div className="bar-fill" style={{ width: pct.toFixed(1) + "%" }} /></div>
        <div className="progress-meta">
          <span>{paceInfo}</span>
          <span>{daysLeftLabel}</span>
        </div>
      </div>

      <div className="card">
        <h2>Ongeza sentensi mpya</h2>

        <div className="type-toggle">
          <button
            type="button"
            className={"type-btn" + (entryType === "sentence" ? " active" : "")}
            onClick={() => setEntryType("sentence")}
          >
            Sentensi moja
          </button>
          <button
            type="button"
            className={"type-btn" + (entryType === "dialogue" ? " active" : "")}
            onClick={() => setEntryType("dialogue")}
          >
            Mazungumzo (zamu-zamu)
          </button>
        </div>

        {entryType === "sentence" ? (
          <>
            <label>Maneno ya mtaani (kama yalivyosemwa) *</label>
            <textarea rows={2} value={textSheng} onChange={(e) => setTextSheng(e.target.value)}
              placeholder="mfano: Mambo vipi msee, unadakiwa wapi leo?" />

            <label>Tafsiri ya Kiswahili sanifu (si lazima)</label>
            <textarea rows={2} value={textStandard} onChange={(e) => setTextStandard(e.target.value)}
              placeholder="mfano: Habari yako rafiki, unakwenda wapi leo?" />
          </>
        ) : (
          <>
            <label>Zamu za mazungumzo *</label>
            {turns.map((t, i) => (
              <div className="turn-row" key={i}>
                <input type="text" className="speaker" placeholder="Msemaji" value={t.speaker}
                  onChange={(e) => updateTurn(i, "speaker", e.target.value)} />
                <textarea className="turn-text" rows={1} placeholder="alichosema..." value={t.text}
                  onChange={(e) => updateTurn(i, "text", e.target.value)} />
                <button type="button" className="turn-remove" onClick={() => removeTurn(i)}>×</button>
              </div>
            ))}
            <button type="button" className="add-turn" onClick={addTurn}>+ Ongeza zamu</button>
          </>
        )}

        <div className="row2">
          <div>
            <label>Chanzo</label>
            <select value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
              {SOURCE_TYPES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label>Jina la chanzo (kama lipo)</label>
            <input type="text" value={sourceName} onChange={(e) => setSourceName(e.target.value)}
              placeholder="mfano: jina la kipindi" />
          </div>
        </div>

        <div className="row2">
          <div>
            <label>Mkoa / eneo</label>
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              {REGIONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label>Mada</label>
            <select value={topic} onChange={(e) => setTopic(e.target.value)}>
              {TOPICS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <label>Maelezo ya maneno magumu (glossary — si lazima)</label>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="mfano: 'kudakiwa' = kukamatwa/kukumbana na tatizo" />

        <div className="wc-hint">Maneno: {liveWordCount}</div>

        <div className="btn-row">
          <button className="btn" onClick={handleSave} disabled={saving}>
            {saving ? "Inahifadhi..." : "Hifadhi sentensi"}
          </button>
          <button className="btn secondary" onClick={resetForm}>Futa fomu</button>
        </div>
        <div className="status">{status}</div>
      </div>

      <div className="card">
        <div className="list-header">
          <h2 style={{ margin: 0 }}>Sentensi zilizoongezwa</h2>
          <input
            type="text"
            className="search"
            placeholder="Tafuta..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              loadEntries(e.target.value);
            }}
          />
        </div>

        {loadingList ? (
          <div className="load">Inapakia...</div>
        ) : entries.length === 0 ? (
          <div className="empty">Bado hakuna sentensi. Anza kwa kuongeza ya kwanza hapo juu.</div>
        ) : (
          entries.map((e) => (
            <div className="entry" key={e.id}>
              {e.type === "dialogue" ? (
                <div className="entry-text">
                  {e.turns.map((t, i) => (
                    <div key={i}><b>{t.speaker}:</b> {t.text}</div>
                  ))}
                </div>
              ) : (
                <>
                  <p className="entry-text">{e.textSheng}</p>
                  {e.textStandard && <p className="entry-std">{e.textStandard}</p>}
                </>
              )}
              <div className="tags">
                <span className="tag">{e.type === "dialogue" ? "Mazungumzo" : "Sentensi"}</span>
                <span className="tag">{e.sourceType}</span>
                <span className="tag">{e.region}</span>
                <span className="tag">{e.topic}</span>
              </div>
              <div className="entry-foot">
                <span className="entry-meta">
                  {new Date(e.createdAt).toLocaleDateString("sw-TZ")} · maneno {e.wordCount}
                </span>
                <button className="del" onClick={() => handleDelete(e.id)}>futa</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <h2>Pakua data</h2>
        <p className="sub" style={{ marginBottom: 10 }}>
          Hifadhi nakala mara kwa mara — hii ndiyo dataset yako halisi ya kutrain model.
        </p>
        <div className="btn-row">
          <a className="btn secondary" href="/api/export?format=jsonl">Pakua JSONL (kwa ML)</a>
          <a className="btn secondary" href="/api/export?format=csv">Pakua CSV (backup)</a>
        </div>
      </div>
    </div>
  );
}
