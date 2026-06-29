import 'dotenv/config';
import express from 'express';


console.log('Key:', process.env.ANTHROPIC_API_KEY); 



const app = express();
         
app.use(express.json());

app.post('/api/prioritize', async (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: 'Missing ANTHROPIC_API_KEY' });

  const { tasks = [], now } = req.body || {};
  const open = tasks.filter((t) => !t.done);
  if (open.length === 0) {
    return res.json({ summary: "You're all caught up.", ranked: [], recommendations: [] });
  }

  const systemPrompt =
    'You are a proactive productivity companion. Rank tasks by priority and suggest concrete next actions. Respond with ONLY valid JSON matching: {"summary":string,"ranked":[{"id":string,"priority":"urgent"|"high"|"medium"|"low","reason":string,"nextAction":string}],"recommendations":string[]}';

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Current time: ${now}\n\nOpen tasks:\n${JSON.stringify(open, null, 2)}`,
          },
        ],
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: text });
    }

    const data = await r.json();
    const text = data.content[0].text;
    const parsed = JSON.parse(text);
    res.json(parsed); // ✅ this was missing

  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));