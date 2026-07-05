"use client";
import { useEffect, useState, useCallback } from "react";
import { SOURCE_TYPES, REGIONS, TOPICS, QUALITY_FLAGS, QUALITY_LABELS, countWords } from "../../lib/helpers";

const EMPTY_FILTERS = { q: "", region: "", topic: "", sourceType: "", type: "", qualityFlag: "" };

export default function AdminPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [entries, setEntries] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);

  const [editingId, setEditingId] = useState(null);
  const [editState, setEditState] = useState(null);

  const [duplicates, setDuplicates] = useState(null);
  const [dupLoading, setDupLoading] = useState(false);

  const [trainRatio, setTrainRatio] = useState(0.8);
  const [valRatio, setValRatio] = useState(0.1);
  const [seed, setSeed] = useState(42);
  const [onlyGood, setOnlyGood] = useState(false);

  const [importStatus, setImportStatus] = useState("");
  const [importing, setImporting] = useState(false);

  async function handleImportCsv(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setImportStatus("Inapakia...");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/entries/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setImportStatus("Hitilafu: " + (data.error || "haijulikani"));
      } else {
        setImportStatus(`Imefanikiwa: ${data.created} entries mpya zimeongezwa (skipped: ${data.skipped}). Zote zina qualityFlag "Haijakaguliwa" — kagua kwenye orodha chini.`);
        loadEntries(filters, page, limit);
      }
    } catch (err) {
      setImportStatus("Imeshindwa kuunganisha na server.");
    }
    setImporting(false);
    e.target.value = "";
  }

  const buildQuery = useCallback((f, p = 1, l = 100) => {
    const params = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set("page", String(p));
    params.set("limit", String(l));
    return params.toString();
  }, []);

  const loadEntries = useCallback(async (f, p = 1, l = 100) => {
    setLoading(true);
    const res = await fetch("/api/entries?" + buildQuery(f, p, l));
    const data = await res.json();
    setEntries(data.entries || []);
    setTotalCount(data.totalCount || 0);
    setLoading(false);
    setSelected(new Set());
  }, [buildQuery]);

  useEffect(() => { loadEntries(filters, page, limit); }, []); // eslint-disable-line

  function applyFilters() {
    setPage(1);
    loadEntries(filters, 1, limit);
  }
  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setPage(1);
    loadEntries(EMPTY_FILTERS, 1, limit);
  }

  function changePage(newPage) {
    setPage(newPage);
    loadEntries(filters, newPage, limit);
  }

  function changeLimit(newLimit) {
    setLimit(newLimit);
    setPage(1);
    loadEntries(filters, 1, newLimit);
  }

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function selectAll() { setSelected(new Set(entries.map((e) => e.id))); }
  function clearSelection() { setSelected(new Set()); }

  async function bulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Futa entries ${selected.size} zilizochaguliwa?`)) return;
    await fetch("/api/entries/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    loadEntries(filters, page, limit);
  }

  async function deleteOne(id) {
    if (!confirm("Futa entry hii?")) return;
    await fetch("/api/entries/" + id, { method: "DELETE" });
    loadEntries(filters, page, limit);
  }

  function startEdit(entry) {
    setEditingId(entry.id);
    setEditState({
      type: entry.type,
      textSheng: entry.textSheng || "",
      textStandard: entry.textStandard || "",
      turns: entry.turns ? entry.turns.map((t) => ({ ...t })) : [],
      sourceType: entry.sourceType,
      sourceName: entry.sourceName || "",
      region: entry.region,
      topic: entry.topic,
      notes: entry.notes || "",
      qualityFlag: entry.qualityFlag,
    });
  }
  function cancelEdit() { setEditingId(null); setEditState(null); }

  function updateEditTurn(i, field, value) {
    setEditState((prev) => ({
      ...prev,
      turns: prev.turns.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)),
    }));
  }

  async function saveEdit(id) {
    const payload = { ...editState };
    await fetch("/api/entries/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    cancelEdit();
    loadEntries(filters, page, limit);
  }

  async function setQuality(id, qualityFlag) {
    await fetch("/api/entries/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qualityFlag }),
    });
    loadEntries(filters, page, limit);
  }

  async function loadDuplicates() {
    setDupLoading(true);
    const res = await fetch("/api/duplicates");
    const data = await res.json();
    setDuplicates(data);
    setDupLoading(false);
  }

  async function dedupeGroup(group) {
    const idsToDelete = group.entries.slice(1).map((e) => e.id);
    if (idsToDelete.length === 0) return;
    if (!confirm(`Futa nakala ${idsToDelete.length}, baki na moja tu?`)) return;
    await fetch("/api/entries/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: idsToDelete }),
    });
    loadDuplicates();
    loadEntries(filters, page, limit);
  }

  function exportUrl(part) {
    const p = new URLSearchParams({
      format: "jsonl",
      part,
      trainRatio: String(trainRatio),
      valRatio: String(valRatio),
      seed: String(seed),
      onlyGood: String(onlyGood),
    });
    return "/api/export?" + p.toString();
  }

  const testRatio = Math.max(0, 1 - parseFloat(trainRatio || 0) - parseFloat(valRatio || 0));

  return (
    <div className="wrap">
      <div className="topbar">
        <header>
          <h1>Admin Dashboard</h1>
          <p className="sub">Kusimamia dataset — hariri, futa, gundua nakala, na export ya train/val/test.</p>
        </header>
        <a className="navlink" href="/">← Rudi kwenye kuongeza data</a>
      </div>

      {/* FILTERS */}
      <div className="card">
        <h2>Filters</h2>
        <div className="filter-bar">
          <input type="text" placeholder="Tafuta..." value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
          <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
            <option value="">Aina yote</option>
            <option value="sentence">Sentensi</option>
            <option value="dialogue">Mazungumzo</option>
          </select>
          <select value={filters.region} onChange={(e) => setFilters({ ...filters, region: e.target.value })}>
            <option value="">Mkoa wote</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filters.topic} onChange={(e) => setFilters({ ...filters, topic: e.target.value })}>
            <option value="">Mada zote</option>
            {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filters.sourceType} onChange={(e) => setFilters({ ...filters, sourceType: e.target.value })}>
            <option value="">Chanzo chote</option>
            {SOURCE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.qualityFlag} onChange={(e) => setFilters({ ...filters, qualityFlag: e.target.value })}>
            <option value="">Quality yote</option>
            {QUALITY_FLAGS.map((q) => <option key={q} value={q}>{QUALITY_LABELS[q]}</option>)}
          </select>
          <select value={limit} onChange={(e) => changeLimit(parseInt(e.target.value, 10))}>
            <option value="50">Onyesha 50</option>
            <option value="100">Onyesha 100</option>
            <option value="250">Onyesha 250</option>
            <option value="500">Onyesha 500</option>
          </select>
        </div>
        <div className="btn-row">
          <button className="btn" onClick={applyFilters}>Chuja (Filter)</button>
          <button className="btn secondary" onClick={clearFilters}>Futa filters</button>
        </div>
      </div>

      {/* CSV IMPORT (kutoka Scraper) */}
      <div className="card">
        <h2>Pakia CSV (kutoka Scraper)</h2>
        <p className="sub" style={{ marginBottom: 10 }}>
          Pakia faili ya CSV iliyotengenezwa na <code>mtaani-scraper</code> (au CSV yoyote
          yenye column ya <code>text</code>). Entries zote zitaingia na quality flag
          &quot;Haijakaguliwa&quot; — zitahitaji kukaguliwa hapa chini kabla ya kuzitumia kwenye export.
        </p>
        <input type="file" accept=".csv" onChange={handleImportCsv} disabled={importing} />
        {importStatus && <div className="status">{importStatus}</div>}
      </div>

      {/* BULK ACTIONS + LIST */}
      <div className="card">
        <div className="list-header">
          <h2 style={{ margin: 0 }}>
            Matokeo {totalCount > 0 ? `(${((page - 1) * limit) + 1} - ${Math.min(page * limit, totalCount)} kati ya ${totalCount})` : `(0)`}
          </h2>
        </div>
        <div className="action-row">
          <button className="small-btn" onClick={selectAll}>Chagua zote zinazoonekana</button>
          <button className="small-btn" onClick={clearSelection}>Futa uchaguzi</button>
          <button className="small-btn danger" onClick={bulkDelete} disabled={selected.size === 0}>
            Futa zilizochaguliwa ({selected.size})
          </button>
        </div>

        {loading ? (
          <div className="load">Inapakia...</div>
        ) : entries.length === 0 ? (
          <div className="empty">Hakuna matokeo yanayolingana na filters.</div>
        ) : (
          entries.map((e) => (
            <div className="admin-row" key={e.id}>
              <div className="admin-row-top">
                <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleSelect(e.id)} />
                <div className="admin-row-body">
                  {e.type === "dialogue" ? (
                    <div className="entry-text">
                      {e.turns.map((t, i) => <div key={i}><b>{t.speaker}:</b> {t.text}</div>)}
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
                    <span className={"qflag " + e.qualityFlag}>{QUALITY_LABELS[e.qualityFlag]}</span>
                  </div>
                  <div className="entry-foot">
                    <span className="entry-meta">
                      {new Date(e.createdAt).toLocaleDateString("sw-TZ")} · maneno {e.wordCount}
                    </span>
                    <div className="action-row" style={{ marginTop: 0 }}>
                      <div className="pill-select">
                        {QUALITY_FLAGS.map((q) => (
                          <button key={q} type="button"
                            className={"pill" + (e.qualityFlag === q ? " active" : "")}
                            onClick={() => setQuality(e.id, q)}>
                            {QUALITY_LABELS[q]}
                          </button>
                        ))}
                      </div>
                      <button className="small-btn" onClick={() => startEdit(e)}>hariri</button>
                      <button className="small-btn danger" onClick={() => deleteOne(e.id)}>futa</button>
                    </div>
                  </div>

                  {editingId === e.id && editState && (
                    <div className="edit-form">
                      {editState.type === "dialogue" ? (
                        editState.turns.map((t, i) => (
                          <div className="turn-row" key={i}>
                            <input type="text" className="speaker" value={t.speaker}
                              onChange={(ev) => updateEditTurn(i, "speaker", ev.target.value)} />
                            <textarea className="turn-text" rows={1} value={t.text}
                              onChange={(ev) => updateEditTurn(i, "text", ev.target.value)} />
                          </div>
                        ))
                      ) : (
                        <>
                          <label>Maneno ya mtaani</label>
                          <textarea rows={2} value={editState.textSheng}
                            onChange={(ev) => setEditState({ ...editState, textSheng: ev.target.value })} />
                          <label>Tafsiri sanifu</label>
                          <textarea rows={2} value={editState.textStandard}
                            onChange={(ev) => setEditState({ ...editState, textStandard: ev.target.value })} />
                        </>
                      )}
                      <div className="row2">
                        <div>
                          <label>Mkoa</label>
                          <select value={editState.region} onChange={(ev) => setEditState({ ...editState, region: ev.target.value })}>
                            {REGIONS.map((r) => <option key={r}>{r}</option>)}
                          </select>
                        </div>
                        <div>
                          <label>Mada</label>
                          <select value={editState.topic} onChange={(ev) => setEditState({ ...editState, topic: ev.target.value })}>
                            {TOPICS.map((t) => <option key={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>
                      <label>Maelezo (glossary)</label>
                      <textarea rows={2} value={editState.notes}
                        onChange={(ev) => setEditState({ ...editState, notes: ev.target.value })} />
                      <div className="btn-row">
                        <button className="btn" onClick={() => saveEdit(e.id)}>Hifadhi mabadiliko</button>
                        <button className="btn secondary" onClick={cancelEdit}>Ghairi</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        {!loading && (Math.ceil(totalCount / limit) || 1) > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => changePage(1)}
              disabled={page === 1}
              title="Ukurasa wa kwanza"
            >
              « Kwanza
            </button>
            <button
              className="pagination-btn"
              onClick={() => changePage(page - 1)}
              disabled={page === 1}
              title="Ukurasa uliopita"
            >
              ‹ Nyuma
            </button>
            <span className="pagination-info">
              Ukurasa {page} kati ya {Math.ceil(totalCount / limit) || 1}
            </span>
            <button
              className="pagination-btn"
              onClick={() => changePage(page + 1)}
              disabled={page === (Math.ceil(totalCount / limit) || 1)}
              title="Ukurasa unaofuata"
            >
              Mbele ›
            </button>
            <button
              className="pagination-btn"
              onClick={() => changePage(Math.ceil(totalCount / limit) || 1)}
              disabled={page === (Math.ceil(totalCount / limit) || 1)}
              title="Ukurasa wa mwisho"
            >
              Mwisho »
            </button>
          </div>
        )}
      </div>

      {/* DUPLICATES */}
      <div className="card">
        <h2>Nakala zinazofanana (Duplicates)</h2>
        <p className="sub" style={{ marginBottom: 10 }}>
          Inagundua sentensi zenye maandishi yanayofanana kabisa (baada ya kusafisha nafasi na herufi kubwa/ndogo).
        </p>
        <button className="btn secondary" onClick={loadDuplicates} disabled={dupLoading}>
          {dupLoading ? "Inakagua..." : "Kagua nakala"}
        </button>
        {duplicates && (
          <div style={{ marginTop: 14 }}>
            <p className="sub">
              Vikundi {duplicates.groups.length} vya nakala vilivyopatikana — jumla ya entries {duplicates.totalDuplicateEntries} za ziada.
            </p>
            {duplicates.groups.map((g) => (
              <div className="dup-group" key={g.key}>
                <div className="entry-foot" style={{ marginBottom: 6 }}>
                  <b>{g.count}× </b><span>&ldquo;{g.key}&rdquo;</span>
                  <button className="small-btn danger" onClick={() => dedupeGroup(g)}>Baki na moja tu</button>
                </div>
                {g.entries.map((it) => (
                  <div className="dup-item" key={it.id}>
                    {new Date(it.createdAt).toLocaleDateString("sw-TZ")} · {it.region} · {it.sourceType}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EXPORT / SPLIT */}
      <div className="card">
        <h2>Export — Train / Val / Test</h2>
        <p className="sub" style={{ marginBottom: 10 }}>
          Split ni deterministic (kutumia seed) — ukibofya tena na seed ile ile, utapata mgawanyo ule ule,
          hivyo train/val/test hazitachanganyika kati ya majaribio tofauti.
        </p>
        <div className="split-controls">
          <div>
            <label>Train ratio</label>
            <input type="number" step="0.05" min="0" max="1" value={trainRatio}
              onChange={(e) => setTrainRatio(e.target.value)} />
          </div>
          <div>
            <label>Val ratio</label>
            <input type="number" step="0.05" min="0" max="1" value={valRatio}
              onChange={(e) => setValRatio(e.target.value)} />
          </div>
          <div>
            <label>Test ratio (auto)</label>
            <input type="text" value={testRatio.toFixed(2)} disabled />
          </div>
          <div>
            <label>Seed</label>
            <input type="number" value={seed} onChange={(e) => setSeed(e.target.value)} />
          </div>
          <div>
            <label>Quality nzuri tu?</label>
            <select value={onlyGood ? "ndio" : "hapana"} onChange={(e) => setOnlyGood(e.target.value === "ndio")}>
              <option value="hapana">Hapana — zote</option>
              <option value="ndio">Ndio — "nzuri" tu</option>
            </select>
          </div>
        </div>
        <div className="btn-row">
          <a className="btn secondary" href={exportUrl("all")}>Pakua Zote (bila split)</a>
          <a className="btn secondary" href={exportUrl("train")}>Pakua Train</a>
          <a className="btn secondary" href={exportUrl("val")}>Pakua Val</a>
          <a className="btn secondary" href={exportUrl("test")}>Pakua Test</a>
        </div>
      </div>
    </div>
  );
}
