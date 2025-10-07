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

  // Respuesta dummy/hardcodeada (simulación de la IA)
  const respuesta = {
    translation: "Traducción simulada: " + texto.split('').reverse().join(''),
    lesson: "Lección simulada: Aquí iría la explicación y ejercicios generados por IA."
  };

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(respuesta)
  };
};