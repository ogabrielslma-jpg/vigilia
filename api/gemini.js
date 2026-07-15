// Proxy para Groq (API compatível com OpenAI) - com JSON mode
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({error:'Method not allowed'}); return; }
  const KEY = process.env.GROQ_KEY;
  if (!KEY) { res.status(500).json({error:'GROQ_KEY not configured'}); return; }
  const { prompt, image, mime } = req.body || {};
  if (!prompt || !image) { res.status(400).json({error:'Missing prompt or image'}); return; }
  try {
    const modelName = 'qwen/qwen3.6-27b';
    const dataUrl = `data:${mime || 'image/jpeg'};base64,${image}`;
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KEY}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: dataUrl } }
          ]
        }],
        temperature: 0.2,
        max_completion_tokens: 800,
        response_format: { type: 'json_object' }
      })
    });
    if (!r.ok) { res.status(r.status).json({ error: 'Groq error', detail: await r.text() }); return; }
    const data = await r.json();
    res.status(200).json({ text: data.choices?.[0]?.message?.content || null });
  } catch (err) { res.status(500).json({error:err.message}); }
}
