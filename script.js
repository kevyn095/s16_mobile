const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

const storageKey = 'ecoplanner.tasks.v2';
let tasks = [];
let currentFilter = 'all';

function uid() { return Math.random().toString(36).slice(2, 9); }
function save() { localStorage.setItem(storageKey, JSON.stringify(tasks)); }
function load() {
  try { tasks = JSON.parse(localStorage.getItem(storageKey) || '[]'); }
  catch { tasks = []; }
}

// ===== Renderização =====
const listEl = $('#lista');
const statusEl = $('#status');

function taskMeta(task) {
  const bits = [];
  if (task.prio) bits.push(`Prioridade: ${task.prio}`);
  if (task.cat) bits.push(`Categoria: ${task.cat}`);
  if (task.due) bits.push(`Prazo: ${task.due}`);
  if (task.sust) bits.push('Hábito sustentável');
  return bits.join('. ');
}

function render() {
  listEl.innerHTML = '';
  const filtered = tasks.filter(t => {
    if (currentFilter === 'active') return !t.done;
    if (currentFilter === 'done') return t.done;
    return true;
  });

  if (!filtered.length) {
    const li = document.createElement('li');
    li.className = 'task';
    li.innerHTML = '<span class="meta">Nenhuma tarefa encontrada para este filtro.</span>';
    listEl.appendChild(li);
    return;
  }

  for (const t of filtered) {
    const li = document.createElement('li');
    li.className = 'task' + (t.done ? ' completed' : '');
    li.dataset.id = t.id;

    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.id = `chk-${t.id}`;
    chk.checked = t.done;
    chk.addEventListener('change', () => {
      t.done = chk.checked; save(); render();
      announce(`Tarefa “${t.title}” marcada como ${t.done ? 'concluída' : 'ativa'}.`);
    });

    const label = document.createElement('label');
    label.setAttribute('for', chk.id);
    label.className = 'title';
    label.textContent = t.title;

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.id = `meta-${t.id}`;
    meta.textContent = taskMeta(t);

    const controls = document.createElement('div');
    controls.className = 'controls';

    const btnDetails = document.createElement('button');
    btnDetails.className = 'btn-small';
    btnDetails.type = 'button';
    btnDetails.setAttribute('aria-controls', `det-${t.id}`);
    btnDetails.setAttribute('aria-expanded', 'false');
    btnDetails.textContent = 'Detalhes';

    const btnRemove = document.createElement('button');
    btnRemove.className = 'btn-small';
    btnRemove.type = 'button';
    btnRemove.setAttribute('aria-label', `Remover tarefa “${t.title}”`);
    btnRemove.textContent = 'Remover';

    const details = document.createElement('div');
    details.id = `det-${t.id}`;
    details.hidden = true;
    details.innerHTML = `<div class="meta">${t.notes ? t.notes : 'Sem notas.'}</div>`;

    btnDetails.addEventListener('click', () => {
      const isOpen = details.hidden === false;
      details.hidden = isOpen; // alterna
      btnDetails.setAttribute('aria-expanded', String(!isOpen));
    });

    btnRemove.addEventListener('click', () => {
      tasks = tasks.filter(x => x.id !== t.id); save(); render();
      announce(`Tarefa “${t.title}” removida.`);
    });

    controls.append(btnDetails, btnRemove);

    li.append(chk, label, controls, meta, details);
    listEl.appendChild(li);
  }
}

function announce(msg) {
  statusEl.textContent = msg;
  setTimeout(() => { statusEl.textContent = ''; }, 1000);
}

// ===== Formulário =====
const toggleBtn = $('#toggleForm');
const formSec = $('#sec-form');
toggleBtn.addEventListener('click', () => {
  const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
  toggleBtn.setAttribute('aria-expanded', String(!expanded));
  formSec.hidden = expanded; 
  if (!expanded) $('#titulo').focus();
});

const form = $('#form');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const title = String(data.get('titulo') || '').trim();
  if (!title) { $('#titulo').focus(); return; }
  const task = {
    id: uid(),
    title,
    cat: String(data.get('categoria') || ''),
    due: String(data.get('prazo') || ''),
    prio: String(data.get('prioridade') || 'Baixa'),
    notes: String(data.get('notas') || ''),
    sust: Boolean(data.get('sustentavel')),
    done: false,
  };
  tasks.unshift(task); save(); render();
  form.reset();
  announce(`Tarefa “${task.title}” adicionada.`);
});

// ===== Filtros =====
const filterButtons = $$('.filters .btn');
filterButtons.forEach(btn => btn.addEventListener('click', () => {
  filterButtons.forEach(b => b.setAttribute('aria-pressed', 'false'));
  btn.setAttribute('aria-pressed', 'true');
  currentFilter = btn.dataset.filter;
  render();
}));

// ===== Sementes iniciais =====
function seedIfEmpty() {
  if (tasks.length) return;
  tasks = [
    { id: uid(), title: 'Levar ecobag no mercado', done: false, cat: 'Compras', due: '', prio: 'Média', notes: 'Reduzir uso de plástico.', sust: true },
    { id: uid(), title: 'Levar garrafas plásticas a um ponto de coleta', done: false, cat: 'Casa', due: '', prio: 'Alta', notes: 'evita poluição e preserva recursos', sust: true },
    { id: uid(), title: 'Caminhar até a padaria do bairro', done: false, cat: 'Transporte', due: '', prio: 'Baixa', notes: 'Se chover, usar guarda-chuva.', sust: true },
  ];
  save();
}

// ===== Inicialização =====
load();
if (!tasks.length) seedIfEmpty();
render();
