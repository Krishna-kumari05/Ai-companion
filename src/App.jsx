import { useEffect, useMemo, useState } from 'react';
import { prioritizeTasks } from './lib/api';

const STORAGE_KEY = 'momentum.tasks.v1';
const order = { urgent: 0, high: 1, medium: 2, low: 3 };

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [deadline, setDeadline] = useState('');
  const [ai, setAi] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setTasks(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  const rankedById = useMemo(() => {
    const m = new Map();
    ai?.ranked?.forEach((r) => m.set(r.id, r));
    return m;
  }, [ai]);

  const sortedOpen = useMemo(() => {
    if (!ai) return open;
    return [...open].sort((a, b) => {
      const ra = rankedById.get(a.id);
      const rb = rankedById.get(b.id);
      return (ra ? order[ra.priority] : 99) - (rb ? order[rb.priority] : 99);
    });
  }, [open, ai, rankedById]);

  function addTask(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setTasks((p) => [
      ...p,
      { id: crypto.randomUUID(), title: title.trim(), notes, deadline, done: false },
    ]);
    setTitle(''); setNotes(''); setDeadline(''); setAi(null);
  }

  async function runAI() {
    setErr(''); setLoading(true);
    try {
      const result = await prioritizeTasks(open);
      setAi(result);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header><h1>Momentum</h1><p>Your AI productivity companion</p></header>

      <form onSubmit={addTask} className="card">
        <input placeholder="What do you need to do?" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="row">
          <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          <button type="submit">Add</button>
        </div>
      </form>

      <div className="row between">
        <span>{open.length} open · {done.length} done</span>
        <button onClick={runAI} disabled={loading}>{loading ? 'Thinking…' : 'Plan my day'}</button>
      </div>
      {err && <p className="err">{err}</p>}

      {ai && (
        <div className="card ai">
          <strong>AI Plan</strong>
          <p>{ai.summary}</p>
          <ul>{ai.recommendations?.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </div>
      )}

      <ul className="tasks">
        {sortedOpen.map((t) => {
          const r = rankedById.get(t.id);
          return (
            <li key={t.id} className="card">
              <div className="row between">
                <strong>{t.title}</strong>
                {r && <span className={`badge ${r.priority}`}>{r.priority}</span>}
              </div>
              {t.notes && <p>{t.notes}</p>}
              {t.deadline && <small>due {new Date(t.deadline).toLocaleString()}</small>}
              {r && <div className="ai-note"><p>{r.reason}</p><p>→ {r.nextAction}</p></div>}
              <div className="row">
                <button onClick={() => setTasks(tasks.map((x) => x.id === t.id ? { ...x, done: true } : x))}>Done</button>
                <button onClick={() => setTasks(tasks.filter((x) => x.id !== t.id))}>Delete</button>
              </div>
            </li>
          );
        })}
      </ul>

      {done.length > 0 && (
        <>
          <h3>Completed</h3>
          <ul className="tasks">
            {done.map((t) => (
              <li key={t.id} className="card done">
                <s>{t.title}</s>
                <button onClick={() => setTasks(tasks.filter((x) => x.id !== t.id))}>Delete</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
