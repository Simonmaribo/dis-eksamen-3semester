// Kundens sagsside: tokenet står i URL'en (/sag/<token>), og sagen hentes med fetch

const STEP_ORDER = ['soeges', 'fundet', 'udleveret'];

function formatDate(value) {
  if (!value) return 'Ikke oplyst';
  return new Date(value).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });
}

async function loadCase() {
  const token = window.location.pathname.split('/').pop();

  try {
    const res = await fetch('/api/cases/public/' + encodeURIComponent(token));
    const lostCase = await res.json();
    document.getElementById('loading').hidden = true;

    if (!res.ok) {
      document.getElementById('error').textContent = lostCase.error;
      document.getElementById('error-card').hidden = false;
      return;
    }

    document.getElementById('case-number').textContent = lostCase.case_number;
    document.getElementById('status-label').textContent = lostCase.status_label;
    document.getElementById('description').textContent = lostCase.description;
    document.getElementById('lost').textContent = lostCase.location
      ? `${formatDate(lostCase.lost_date)}, ${lostCase.location}`
      : formatDate(lostCase.lost_date);
    document.getElementById('created').textContent = formatDate(lostCase.created_at);

    const current = STEP_ORDER.indexOf(lostCase.status);
    document.querySelectorAll('#steps li').forEach((li) => {
      const index = STEP_ORDER.indexOf(li.dataset.step);
      li.classList.toggle('done', index <= current);
      li.classList.toggle('current', index === current);
    });

    if (lostCase.status === 'fundet') {
      document.getElementById('pickup-number').textContent = lostCase.case_number;
      document.getElementById('pickup').hidden = false;
    }

    document.getElementById('case').hidden = false;
  } catch (error) {
    document.getElementById('loading').hidden = true;
    document.getElementById('error').textContent = 'Kunne ikke hente sagen. Prøv igen senere.';
    document.getElementById('error-card').hidden = false;
  }
}

loadCase();
