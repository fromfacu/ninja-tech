document.getElementById('ll-analyze').addEventListener('click', async function() {
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
    const res = await fetch('/api/lingua', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: input })
    });
    const data = await res.json();

    translationDiv.textContent = data.translation || '';
    lessonDiv.textContent = data.lesson || '';
  } catch (err) {
    translationDiv.textContent = '';
    lessonDiv.textContent = '';
    alert('Error al comunicarse con el servidor.');
  }
});