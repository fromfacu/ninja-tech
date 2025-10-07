// Lingua Lection v1.0 - Hito 2: Flujo Local (Frontend JS)

document.getElementById('ll-analyze').addEventListener('click', function() {
  const input = document.getElementById('ll-input').value.trim();
  const translationDiv = document.getElementById('ll-translation');
  const lessonDiv = document.getElementById('ll-lesson');

  if (!input) {
    translationDiv.textContent = '';
    lessonDiv.textContent = '';
    alert('Por favor, ingresá un texto para analizar.');
    return;
  }

  // Simulación de respuestas (predefinidas)
  // TODO: Reemplazar por integración real en hito 4+
  let simulatedTranslation = '';
  let simulatedLesson = '';
  // Detección simple de idioma (solo para demo)
  if (/^[a-zA-Z0-9 .,!?'"-]+$/.test(input)) {
    simulatedTranslation = 'Traducción al español: ' + input.split('').reverse().join('');
    simulatedLesson = 'Lección: Este es un ejemplo de cómo funcionará Lingua Lection. Aquí recibirás explicaciones y ejercicios personalizados según el texto que envíes.';
  } else {
    simulatedTranslation = 'Traducción al inglés: ' + input.split('').reverse().join('');
    simulatedLesson = 'Lección: Ejemplo local. Cuando actives la IA, aquí aparecerán tips y ejercicios para mejorar tu inglés con el contenido que escribiste.';
  }
  translationDiv.textContent = simulatedTranslation;
  lessonDiv.textContent = simulatedLesson;
});