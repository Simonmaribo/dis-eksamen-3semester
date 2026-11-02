// Personalets side. Al data hentes og ændres med fetch mod JSON-API'et.
// Session-cookien sendes automatisk med, fordi siden og API'et ligger på samme domæne.

let cases = [];
let foundItems = [];

const pageError = document.getElementById('page-error');

function showError(box, message) {
  box.textContent = message;
  box.hidden = false;
}

function formatDate(value) {
  if (!value) return '–';
  return new Date(value).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' });
}

// Lille hjælper til at bygge elementer. textContent bruges altid, så tekst fra kunder
// aldrig bliver tolket som HTML (beskytter mod XSS).
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Hvis sessionen er udløbet, sender vi brugeren til login
function handleUnauthorized(res) {
  if (res.status === 401) {
    window.location.href = '/login';
    return true;
  }
  return false;
}

// ---------- Login-status ----------

async function loadMe() {
  const res = await fetch('/api/auth/me');
  if (handleUnauthorized(res)) return null;
  const me = await res.json();

  document.getElementById('staff-name').textContent = me.name;
  if (me.is_admin) {
    document.getElementById('staff-tab').hidden = false;
  }
  return me;
}

document.getElementById('logout-btn').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login';
});

// ---------- Faner ----------

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === tab));
    document.querySelectorAll('.panel').forEach((panel) => {
      panel.hidden = panel.id !== 'panel-' + tab.dataset.tab;
    });
    if (tab.dataset.tab === 'staff') loadStaff();
  });
});

// ---------- Sager ----------

async function loadCases() {
  const res = await fetch('/api/cases');
  if (handleUnauthorized(res)) return;
  cases = await res.json();
  renderCases();
  renderFoundItems();
}

function renderCases() {
  const showAll = document.querySelector('input[name="case-filter"]:checked').value === 'alle';
  const body = document.getElementById('cases-body');
  body.innerHTML = '';

  const visible = cases.filter((c) => showAll || c.status !== 'udleveret');
  document.getElementById('open-count').textContent = cases.filter((c) => c.status === 'soeges').length || '';

  if (visible.length === 0) {
    const row = el('tr');
    const cell = el('td', 'empty', 'Ingen sager.');
    cell.colSpan = 6;
    row.appendChild(cell);
    body.appendChild(row);
    return;
  }

  visible.forEach((c) => {
    const row = el('tr');
    row.appendChild(el('td', 'mono', c.case_number));
    row.appendChild(el('td', null, c.description));
    row.appendChild(el('td', null, c.lost_date ? `${formatDate(c.lost_date)}, ${c.location}` : 'Via SMS'));

    const customer = el('td');
    customer.appendChild(el('div', null, c.name || 'SMS-kunde'));
    customer.appendChild(el('div', 'muted small', c.channel === 'sms' ? c.phone : c.email));
    row.appendChild(customer);

    const status = el('td');
    status.appendChild(el('span', 'badge ' + c.status, c.status_label));
    row.appendChild(status);

    const actions = el('td', 'actions');
    if (c.status === 'fundet') {
      const btn = el('button', 'btn small', 'Udlevér');
      btn.type = 'button';
      btn.addEventListener('click', () => deliverCase(c.id));
      actions.appendChild(btn);
    }
    row.appendChild(actions);

    body.appendChild(row);
  });
}

async function deliverCase(id) {
  const res = await fetch(`/api/cases/${id}/deliver`, { method: 'PATCH' });
  if (handleUnauthorized(res)) return;
  if (!res.ok) {
    showError(pageError, (await res.json()).error);
    return;
  }
  await loadCases();
}

document.querySelectorAll('input[name="case-filter"]').forEach((input) => {
  input.addEventListener('change', renderCases);
});

// ---------- Fundne ting ----------

async function loadFoundItems() {
  const res = await fetch('/api/found-items');
  if (handleUnauthorized(res)) return;
  foundItems = await res.json();
  renderFoundItems();
}

function renderFoundItems() {
  const list = document.getElementById('found-list');
  list.innerHTML = '';
  const openCases = cases.filter((c) => c.status === 'soeges');

  if (foundItems.length === 0) {
    list.appendChild(el('p', 'muted', 'Ingen fundne ting endnu.'));
    return;
  }

  foundItems.forEach((item) => {
    const card = el('article', 'card found-item');

    if (item.image_url) {
      const img = el('img');
      img.src = item.image_url;
      img.alt = item.description;
      img.loading = 'lazy';
      card.appendChild(img);
    } else {
      card.appendChild(el('div', 'no-image', 'Intet billede'));
    }

    const info = el('div', 'found-info');
    info.appendChild(el('h3', null, item.description));
    info.appendChild(el('p', 'muted small', `Fundet ${formatDate(item.found_date)}, ${item.location} · ${item.created_by_name}`));

    if (item.case_id) {
      const matchedCase = cases.find((c) => c.id === item.case_id);
      info.appendChild(el('span', 'badge ' + item.case_status, 'Matchet med ' + (matchedCase ? matchedCase.case_number : 'sag')));
    } else if (openCases.length > 0) {
      const matchRow = el('div', 'match-row');
      const select = el('select');
      select.appendChild(el('option', null, 'Vælg sag at matche med'));
      select.firstChild.value = '';
      openCases.forEach((c) => {
        const option = el('option', null, `${c.case_number}: ${c.description}`);
        option.value = c.id;
        select.appendChild(option);
      });
      const btn = el('button', 'btn small primary', 'Match');
      btn.type = 'button';
      btn.addEventListener('click', () => {
        if (select.value) matchItem(item.id, select.value);
      });
      matchRow.appendChild(select);
      matchRow.appendChild(btn);
      info.appendChild(matchRow);
    } else {
      info.appendChild(el('span', 'badge', 'Ingen åbne sager at matche med'));
    }

    card.appendChild(info);
    list.appendChild(card);
  });
}

async function matchItem(foundItemId, caseId) {
  const res = await fetch(`/api/found-items/${foundItemId}/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ case_id: Number(caseId) }),
  });
  if (handleUnauthorized(res)) return;
  const result = await res.json();

  if (!res.ok) {
    showError(pageError, result.error);
    return;
  }
  if (!result.notified) {
    showError(pageError, `Matchet, men beskeden til kunden kunne ikke sendes. Kontakt kunden selv om ${result.case.case_number}.`);
  } else {
    pageError.hidden = true;
  }
  await Promise.all([loadCases(), loadFoundItems()]);
}

const foundForm = document.getElementById('found-form');
document.getElementById('found_date').max = new Date().toISOString().slice(0, 10);
document.getElementById('found_date').value = new Date().toISOString().slice(0, 10);

// Billedet sendes som multipart/form-data. Browseren sætter selv Content-Type med boundary.
foundForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorBox = document.getElementById('found-error');
  const submitBtn = document.getElementById('found-submit');
  errorBox.hidden = true;
  submitBtn.disabled = true;

  try {
    const res = await fetch('/api/found-items', {
      method: 'POST',
      body: new FormData(foundForm),
    });
    if (handleUnauthorized(res)) return;
    const result = await res.json();

    if (!res.ok) {
      showError(errorBox, result.error);
      return;
    }
    foundForm.reset();
    document.getElementById('found_date').value = new Date().toISOString().slice(0, 10);
    await loadFoundItems();
  } finally {
    submitBtn.disabled = false;
  }
});

// ---------- Medarbejdere (admin) ----------

async function loadStaff() {
  const res = await fetch('/api/staff');
  if (handleUnauthorized(res) || !res.ok) return;
  const staff = await res.json();

  const body = document.getElementById('staff-body');
  body.innerHTML = '';
  staff.forEach((s) => {
    const row = el('tr');
    row.appendChild(el('td', null, s.name));
    row.appendChild(el('td', null, s.email));
    row.appendChild(el('td', null, s.is_admin ? 'Admin' : 'Personale'));
    body.appendChild(row);
  });
}

const staffForm = document.getElementById('staff-form');
staffForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorBox = document.getElementById('staff-error');
  errorBox.hidden = true;

  const res = await fetch('/api/staff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: staffForm.name.value,
      email: staffForm.email.value,
      password: staffForm.password.value,
      is_admin: staffForm.is_admin.checked,
    }),
  });
  if (handleUnauthorized(res)) return;
  const result = await res.json();

  if (!res.ok) {
    showError(errorBox, result.error);
    return;
  }
  staffForm.reset();
  await loadStaff();
});

// ---------- Start ----------

async function init() {
  const me = await loadMe();
  if (!me) return;
  // Sager og fundne ting hentes parallelt
  await Promise.all([loadCases(), loadFoundItems()]);
}

init();
