// Login: ved succes sætter serveren en session-cookie, som browseren sender med på alle senere requests

const form = document.getElementById('login-form');
const errorBox = document.getElementById('login-error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.hidden = true;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email.value, password: form.password.value }),
    });
    const result = await res.json();

    if (!res.ok) {
      errorBox.textContent = result.error;
      errorBox.hidden = false;
      return;
    }

    window.location.href = '/personale';
  } catch (error) {
    errorBox.textContent = 'Kunne ikke kontakte serveren. Prøv igen.';
    errorBox.hidden = false;
  }
});
