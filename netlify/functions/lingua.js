const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Método no permitido" })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Body inválido" })
    };
  }

  const texto = (body.texto || '').trim();
  // Prompt para OpenAI
  const prompt = `
Eres Lingua Lection, un asistente de aprendizaje de idiomas de Ninja Tech.
1. Traduce el siguiente texto al inglés o español (detecta el idioma automáticamente).
2. Luego, genera una lección breve y personalizada para el usuario. Sé agudo, práctico y usa el tono Ninja Tech.

Texto: ${texto}
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: "Eres Lingua Lection, asistente de idiomas de Ninja Tech." },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 400
      })
    });
    const data = await response.json();

    // Procesar la respuesta
    const output = data.choices?.[0]?.message?.content || "";
    // Separar traducción y lección usando "Lección:"
    let [translation, lesson] = output.split(/Lección:/i);
    translation = translation ? translation.replace(/Traducción:/i, '').trim() : '';
    lesson = lesson ? lesson.trim() : '';

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ translation, lesson })
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error en OpenAI", details: e.message })
    };
  }
};