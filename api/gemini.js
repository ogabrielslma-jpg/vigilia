// Proxy Groq - Llama 4 Scout com suporte a múltiplas imagens (mini-vídeo)
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({error:'Method not allowed'}); return; }
  const KEY = process.env.GROQ_KEY;
  if (!KEY) { res.status(500).json({error:'GROQ_KEY not configured'}); return; }
  const { prompt, image, images, mime } = req.body || {};
  const imageList = Array.isArray(images) ? images : (image ? [image] : []);
  if (!prompt || imageList.length === 0) { res.status(400).json({error:'Missing prompt or image(s)'}); return; }
  if (imageList.length > 5) { res.status(400).json({error:'Max 5 images per request'}); return; }
  try {
    const modelName = 'meta-llama/llama-4-scout-17b-16e-instruct';
    const mimeType = mime || 'image/jpeg';
    const content = [{ type: 'text', text: prompt }];
    for (const img of imageList) {
      content.push({ type: 'image_url', image_url: { url: `data:${mimeType};base64,${img}` } });
    }
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KEY}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content }],
        temperature: 0.2,
        max_completion_tokens: 500
      })
    });
    if (!r.ok) { res.status(r.status).json({ error: 'Groq error', detail: await r.text() }); return; }
    const data = await r.json();
    res.status(200).json({ text: data.choices?.[0]?.message?.content || null });
  } catch (err) { res.status(500).json({error:err.message}); }
}
