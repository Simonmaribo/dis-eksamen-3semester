// Kundens formular: sender sagen til backend som JSON med fetch

const form = document.getElementById('report-form');
const errorBox = document.getElementById('form-error');
const submitBtn = document.getElementById('submit-btn');

// Dato kan ikke ligge i fremtiden
document.getElementById('lost_date').max = new Date().toISOString().slice(0, 10);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.hidden = true;
  submitBtn.disabled = true;

  const data = {
    name: form.name.value,
    email: form.email.value,
    phone: form.phone.value,
    description: form.description.value,
    lost_date: form.lost_date.value,
    location: form.location.value,
  };

  try {
    const res = await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();

    if (!res.ok) {
      errorBox.textContent = result.error;
      errorBox.hidden = false;
      return;
    }

    document.getElementById('case-number').textContent = result.case_number;
    document.getElementById('case-link').href = result.url;
    form.hidden = true;
    document.getElementById('success').hidden = false;
  } catch (error) {
    errorBox.textContent = 'Kunne ikke kontakte serveren. Prøv igen.';
    errorBox.hidden = false;
  } finally {
    submitBtn.disabled = false;
  }
});
