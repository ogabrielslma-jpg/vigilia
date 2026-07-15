export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({error:'Method not allowed'}); return; }
  const KEY = process.env.GEMINI_KEY;
  if (!KEY) { res.status(500).json({error:'GEMINI_KEY not configured'}); return; }
  const { prompt, image, mime, model } = req.body || {};
  if (!prompt || !image) { res.status(400).json({error:'Missing prompt or image'}); return; }
  try {
    const modelName = model || 'gemini-2.0-flash';
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`, {
      method: 'POST',
      headers: {'Content-Type':'application/json','x-goog-api-key':KEY},
      body: JSON.stringify({
        contents: [{ parts: [{text:prompt},{inline_data:{mime_type:mime||'image/jpeg',data:image}}] }],
        generationConfig: {temperature:0.2,maxOutputTokens:300}
      })
    });
    if (!r.ok) { res.status(r.status).json({error:'Gemini error',detail:await r.text()}); return; }
    const data = await r.json();
    res.status(200).json({text: data.candidates?.[0]?.content?.parts?.[0]?.text || null});
  } catch (err) { res.status(500).json({error:err.message}); }
}
