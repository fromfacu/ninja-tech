// js/lingua.js  –  Lingua Lection 1.0  (cliente)
document.getElementById('ll-analyze').addEventListener('click', async function () {
  const input = document.getElementById('ll-input').value.trim();
  const translationDiv = document.getElementById('ll-translation');
  const lessonDiv = document.getElementById('ll-lesson');

  if (!input) {
    translationDiv.textContent = '';
    lessonDiv.textContent = '';
    alert('Por favor, ingresá un texto para analizar.');
    return;
  }

  translationDiv.textContent = 'Cargando...';
  lessonDiv.textContent = '';

  try {
    // ✅ Ruta CORRECTA de la función serverless
    const res = await fetch('/.netlify/functions/lingua.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: input })
    });

    if (!res.ok) throw new Error('Respuesta fallida');

    const data = await res.json();

    // Separamos el markdown que llega en data.markdown
    const parts = data.markdown.split('---');
    translationDiv.innerHTML = parts[1] || ''; // TRADUCCIÓN
    lessonDiv.innerHTML   = parts[2] || '';   // LECCIÓN

  } catch (err) {
    translationDiv.textContent = '';
    lessonDiv.textContent = '';
    alert('Error al comunicarse con el servidor.');
  }
});