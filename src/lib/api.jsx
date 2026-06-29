export async function prioritizeTasks(tasks) {
  const res = await fetch('https://ai-companion-production.up.railway.app', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks, now: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
