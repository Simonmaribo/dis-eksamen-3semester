// Personalets side. Al data hentes og ændres med fetch mod JSON-API'et.
// Session-cookien sendes automatisk med, fordi siden og API'et ligger på samme domæne.

let cases = [];
let foundItems = [];
let matchingItem = null;
let deliveringCase = null;

const today = () => new Date().toISOString().slice(0, 10);

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

function showError(box, message) {
  box.textContent = message;
  box.hidden = false;
}

let toastTimer;
function toast(message) {
  const box = document.getElementById('toast');
  box.textContent = message;
  box.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { box.hidden = true; }, 3500);
}

// Hvis sessionen er udløbet, sender vi brugeren til login
function handleUnauthorized(res) {
  if (res.status === 401) {
    window.location.href = '/login';
    return true;
  }
  return false;
}

// ---------- Modaler (native <dialog>) ----------

document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => dialog.close()));
  // Klik på den mørke baggrund lukker modalen
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
});

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

function showTab(name) {
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.panel').forEach((panel) => {
    panel.hidden = panel.id !== 'panel-' + name;
  });
  if (name === 'staff') loadStaff();
}

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => showTab(tab.dataset.tab));
});

// ---------- Overblik ----------

function renderStats() {
  const open = cases.filter((c) => c.status === 'soeges').length;
  const ready = cases.filter((c) => c.status === 'fundet').length;
  const unmatched = foundItems.filter((i) => !i.case_id).length;

  document.getElementById('stat-open').textContent = open;
  document.getElementById('stat-ready').textContent = ready;
  document.getElementById('stat-unmatched').textContent = unmatched;
  document.getElementById('open-count').textContent = open || '';
  document.getElementById('unmatched-count').textContent = unmatched || '';
}

// ---------- Sager ----------

async function loadCases() {
  const res = await fetch('/api/cases');
  if (handleUnauthorized(res)) return;
  cases = await res.json();
  renderCases();
  renderFoundItems();
  renderStats();
}

function renderCases() {
  const filter = document.querySelector('input[name="case-filter"]:checked').value;
  const query = document.getElementById('case-search').value.trim().toLowerCase();
  const body = document.getElementById('cases-body');
  body.innerHTML = '';

  const visible = cases.filter((c) => {
    if (filter === 'aktive' && c.status === 'udleveret') return false;
    if ((filter === 'soeges' || filter === 'fundet') && c.status !== filter) return false;
    if (!query) return true;
    return [c.case_number, c.description, c.name, c.email, c.phone]
      .some((value) => value && value.toLowerCase().includes(query));
  });

  if (visible.length === 0) {
    const row = el('tr');
    const cell = el('td', 'empty', query ? 'Ingen sager matcher søgningen.' : 'Ingen sager her.');
    cell.colSpan = 6;
    row.appendChild(cell);
    body.appendChild(row);
    return;
  }

  visible.forEach((c) => {
    const row = el('tr');
    row.appendChild(el('td', 'mono', c.case_number));
    row.appendChild(el('td', 'desc', c.description));
    row.appendChild(el('td', 'nowrap', c.lost_date ? `${formatDate(c.lost_date)}, ${c.location}` : 'Via SMS'));

    const customer = el('td');
    customer.appendChild(el('div', null, c.name || 'SMS-kunde'));
    customer.appendChild(el('div', 'muted small', c.channel === 'sms' ? c.phone : c.email));
    row.appendChild(customer);

    const status = el('td');
    status.appendChild(el('span', 'badge ' + c.status, c.status_label));
    row.appendChild(status);

    const actions = el('td', 'actions');
    if (c.status === 'fundet') {
      const btn = el('button', 'btn small primary', 'Udlevér');
      btn.type = 'button';
      btn.addEventListener('click', () => openDeliverDialog(c));
      actions.appendChild(btn);
    } else if (c.status === 'soeges') {
      const btn = el('button', 'btn small', 'Find match');
      btn.type = 'button';
      btn.addEventListener('click', () => findMatchFor(c));
      actions.appendChild(btn);
    }
    row.appendChild(actions);

    body.appendChild(row);
  });
}

document.querySelectorAll('input[name="case-filter"]').forEach((input) => {
  input.addEventListener('change', renderCases);
});
document.getElementById('case-search').addEventListener('input', renderCases);

// ---------- Udlevering ----------

function openDeliverDialog(lostCase) {
  deliveringCase = lostCase;
  document.getElementById('deliver-number').textContent = lostCase.case_number;
  const who = lostCase.name ? `${lostCase.name}` : `kunden (${lostCase.phone})`;
  const text = document.getElementById('deliver-text');
  text.innerHTML = '';
  text.append(`Bed ${who} om at oplyse sagsnummer `, el('strong', 'nowrap', lostCase.case_number),
    `, og udlevér "${lostCase.description}".`);
  document.getElementById('deliver-dialog').showModal();
}

document.getElementById('deliver-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const res = await fetch(`/api/cases/${deliveringCase.id}/deliver`, { method: 'PATCH' });
  if (handleUnauthorized(res)) return;
  document.getElementById('deliver-dialog').close();

  if (!res.ok) {
    toast((await res.json()).error);
    return;
  }
  toast(`${deliveringCase.case_number} er markeret som udleveret.`);
  await loadCases();
});

// ---------- Fundne ting ----------

async function loadFoundItems() {
  const res = await fetch('/api/found-items');
  if (handleUnauthorized(res)) return;
  foundItems = await res.json();
  renderFoundItems();
  renderStats();
}

function itemImage(item) {
  if (item.image_url) {
    const img = el('img');
    img.src = item.image_url;
    img.alt = item.description;
    img.loading = 'lazy';
    return img;
  }
  return el('div', 'no-image', 'Intet billede');
}

// Sagen personalet leder efter et match til. Fundne ting fra samme sted vises først.
let focusCase = null;

function findMatchFor(lostCase) {
  focusCase = lostCase;
  document.querySelector('input[name="found-filter"][value="uden"]').checked = true;
  showTab('found');
  renderFoundItems();
}

function renderFoundItems() {
  const list = document.getElementById('found-list');
  const showAll = document.querySelector('input[name="found-filter"]:checked').value === 'alle';
  list.innerHTML = '';

  const hint = document.getElementById('focus-hint');
  hint.hidden = !focusCase;
  if (focusCase) {
    document.getElementById('focus-text').textContent =
      `Leder efter ${focusCase.case_number}: ${focusCase.description}` +
      (focusCase.location ? ` (${focusCase.location})` : '');
  }

  const visible = foundItems
    .filter((item) => showAll || !item.case_id)
    .sort((a, b) => focusCase
      ? (b.location === focusCase.location) - (a.location === focusCase.location)
      : 0);

  if (visible.length === 0) {
    const empty = el('div', 'empty-state');
    empty.appendChild(el('p', null, showAll ? 'Ingen fundne ting endnu.' : 'Alle fundne ting har fundet deres ejer.'));
    list.appendChild(empty);
    return;
  }

  visible.forEach((item) => {
    const card = el('article', 'card found-item');
    card.appendChild(itemImage(item));

    const info = el('div', 'found-info');
    info.appendChild(el('h3', null, item.description));
    info.appendChild(el('p', 'muted small', `Fundet ${formatDate(item.found_date)}, ${item.location} · ${item.created_by_name}`));

    if (item.case_id) {
      const matchedCase = cases.find((c) => c.id === item.case_id);
      info.appendChild(el('span', 'badge ' + item.case_status, 'Matchet med ' + (matchedCase ? matchedCase.case_number : 'sag')));
    } else {
      const btn = el('button', 'btn small primary', 'Match med sag');
      btn.type = 'button';
      btn.addEventListener('click', () => openMatchDialog(item));
      info.appendChild(btn);
    }

    card.appendChild(info);
    list.appendChild(card);
  });
}

document.getElementById('clear-focus').addEventListener('click', () => {
  focusCase = null;
  renderFoundItems();
});

document.querySelectorAll('input[name="found-filter"]').forEach((input) => {
  input.addEventListener('change', renderFoundItems);
});

// ---------- Modal: registrér fundet ting ----------

const foundDialog = document.getElementById('found-dialog');
const foundForm = document.getElementById('found-form');
const imageInput = document.getElementById('image');
const imagePreview = document.getElementById('image-preview');
const fileName = document.getElementById('file-name');

function resetFoundForm() {
  foundForm.reset();
  document.getElementById('found_date').value = today();
  document.getElementById('found_date').max = today();
  imagePreview.hidden = true;
  imagePreview.removeAttribute('src');
  fileName.textContent = 'Klik for at vælge et billede';
  document.getElementById('found-error').hidden = true;
}

document.getElementById('open-found-dialog').addEventListener('click', () => {
  resetFoundForm();
  foundDialog.showModal();
});

// Vis billedet lokalt i browseren, før det sendes
imageInput.addEventListener('change', () => {
  const file = imageInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    imagePreview.src = reader.result;
    imagePreview.hidden = false;
  };
  reader.readAsDataURL(file);
  fileName.textContent = file.name;
});

// Billedet sendes som multipart/form-data. Browseren sætter selv Content-Type med boundary.
foundForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorBox = document.getElementById('found-error');
  const submitBtn = document.getElementById('found-submit');
  errorBox.hidden = true;
  submitBtn.disabled = true;
  submitBtn.classList.add('is-loading');
  submitBtn.textContent = 'Gemmer …';

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
    foundDialog.close();
    toast(`"${result.description}" er registreret.`);
    await loadFoundItems();
  } finally {
    submitBtn.disabled = false;
    submitBtn.classList.remove('is-loading');
    submitBtn.textContent = 'Gem fundet ting';
  }
});

// ---------- Modal: match med sag ----------

const matchDialog = document.getElementById('match-dialog');
const matchSubmit = document.getElementById('match-submit');

function openMatchDialog(item) {
  matchingItem = item;
  const preselect = focusCase;
  document.getElementById('match-error').hidden = true;
  matchSubmit.disabled = true;

  const summary = document.getElementById('match-item');
  summary.innerHTML = '';
  if (item.image_url) summary.appendChild(itemImage(item));
  const text = el('div');
  text.appendChild(el('strong', null, item.description));
  text.appendChild(el('p', 'muted small', `Fundet ${formatDate(item.found_date)}, ${item.location}`));
  summary.appendChild(text);

  // Sager fra samme sted vises først
  const openCases = cases
    .filter((c) => c.status === 'soeges')
    .sort((a, b) => (b.location === item.location) - (a.location === item.location));

  const options = document.getElementById('case-options');
  options.innerHTML = '';

  if (openCases.length === 0) {
    options.appendChild(el('p', 'empty-state', 'Der er ingen åbne sager at matche med lige nu.'));
  }

  openCases.forEach((c) => {
    const option = el('label', 'case-option');
    const radio = el('input');
    radio.type = 'radio';
    radio.name = 'case_id';
    radio.value = c.id;
    radio.addEventListener('change', () => { matchSubmit.disabled = false; });
    if (preselect && preselect.id === c.id) {
      radio.checked = true;
      matchSubmit.disabled = false;
    }
    option.appendChild(radio);

    const body = el('div', 'case-option-body');
    const top = el('div', 'case-option-top');
    top.appendChild(el('span', 'mono', c.case_number));
    if (c.location && c.location === item.location) top.appendChild(el('span', 'badge fundet', 'Samme sted'));
    top.appendChild(el('span', 'badge', c.channel === 'sms' ? 'SMS' : 'Mail'));
    body.appendChild(top);
    body.appendChild(el('div', null, c.description));
    body.appendChild(el('div', 'muted small',
      (c.lost_date ? `Mistet ${formatDate(c.lost_date)}, ${c.location}` : 'Oprettet via SMS') +
      ' · ' + (c.name || c.phone)));
    option.appendChild(body);

    options.appendChild(option);
  });

  matchDialog.showModal();
}

document.getElementById('match-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const selected = document.querySelector('input[name="case_id"]:checked');
  if (!selected) return;
  matchSubmit.disabled = true;

  const res = await fetch(`/api/found-items/${matchingItem.id}/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ case_id: Number(selected.value) }),
  });
  if (handleUnauthorized(res)) return;
  const result = await res.json();

  if (!res.ok) {
    showError(document.getElementById('match-error'), result.error);
    matchSubmit.disabled = false;
    return;
  }

  matchDialog.close();
  focusCase = null;
  const channel = result.case.channel === 'sms' ? 'SMS' : 'mail';
  toast(result.notified
    ? `Matchet med ${result.case.case_number}. Kunden har fået besked på ${channel}.`
    : `Matchet med ${result.case.case_number}, men beskeden kunne ikke sendes. Kontakt kunden selv.`);
  await Promise.all([loadCases(), loadFoundItems()]);
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
    const role = el('td');
    role.appendChild(el('span', s.is_admin ? 'badge fundet' : 'badge', s.is_admin ? 'Admin' : 'Personale'));
    row.appendChild(role);
    body.appendChild(row);
  });
}

const staffDialog = document.getElementById('staff-dialog');
const staffForm = document.getElementById('staff-form');

document.getElementById('open-staff-dialog').addEventListener('click', () => {
  staffForm.reset();
  document.getElementById('staff-error').hidden = true;
  staffDialog.showModal();
});

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
  staffDialog.close();
  toast(`${result.name} er oprettet.`);
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
