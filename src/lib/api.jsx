export async function prioritizeTasks(tasks) {
  const res = await fetch('http://localhost:3001/api/prioritize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks, now: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}