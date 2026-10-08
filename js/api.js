// ==========================================================================
// Integración Frontend ↔ AWS API Gateway / Lambda
// Reto Serverless: EventPass · Registro en Evento Tecnológico
// ==========================================================================

// TU endpoint real de API Gateway en us-east-1:
const API_URL = 'https://vp47aaeych.execute-api.us-east-1.amazonaws.com/dev/contact';


document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('eventRegistrationForm');
  const submitBtn = document.getElementById('submitBtn');
  const feedbackBox = document.getElementById('formFeedback');

  if (!form) return;

  form.addEventListener('submit', async (event) => {
    // Evitamos el envío tradicional y recarga de página
    event.preventDefault();

    // 1. Extraemos los valores de los 3 campos mínimos requeridos
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const interestInput = document.getElementById('interest');

    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const interest = interestInput ? interestInput.value.trim() : '';

    // 2. Validación básica en cliente
    if (!name || !email || !interest) {
      showFeedback('Por favor, completa todos los campos requeridos: Nombre, Email e Interés.', 'error');
      return;
    }

    // 3. Estructuramos el payload JSON para Lambda
    const payload = {
      name: name,
      email: email,
      interest: interest
    };

    console.log('🚀 [EventPass] Enviando payload a API Gateway:', payload);

    // 4. Feedback visual de carga
    setLoadingState(true);
    hideFeedback();

    try {
      // 5. Enviamos la petición POST al endpoint de AWS API Gateway
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));
      console.log('📡 [EventPass] Respuesta recibida:', response.status, data);

      if (!response.ok) {
        const errorMsg = data.error || data.message || `Error del servidor (HTTP ${response.status})`;
        throw new Error(errorMsg);
      }

      // 6. Éxito: Notificamos al usuario y reseteamos el formulario
      const successMsg = data.message || `¡Solicitud registrada correctamente para ${name}!`;
      showFeedback(`✅ ${successMsg}`, 'success');
      form.reset();

    } catch (error) {
      console.error('❌ [EventPass] Error al enviar solicitud:', error);
      showFeedback(`❌ Error al registrar solicitud: ${error.message}`, 'error');
    } finally {
      setLoadingState(false);
    }
  });

  // Funciones de interfaz
  function setLoadingState(isLoading) {
    if (!submitBtn) return;
    if (isLoading) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        Enviando solicitud...
      `;
    } else {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <span>Solicitar Plaza Ahora</span>
        <i class="bi-arrow-right-short fs-5"></i>
      `;
    }
  }

  function showFeedback(message, type) {
    if (!feedbackBox) {
      alert(message);
      return;
    }
    feedbackBox.className = `form-feedback show ${type}`;
    feedbackBox.innerHTML = message;
    feedbackBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideFeedback() {
    if (!feedbackBox) return;
    feedbackBox.className = 'form-feedback';
    feedbackBox.innerHTML = '';
  }
});