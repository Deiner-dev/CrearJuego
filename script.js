const API_BASE = 'https://api-springboot-production-ff3e.up.railway.app/juegos';

// =============================================
// ESTRELLAS
// =============================================
const stars = document.querySelectorAll('.star-btn');
const ratingInput = document.getElementById('calificaciones');
const ratingLabel = document.getElementById('ratingLabel');
let currentRating = 0;

stars.forEach(star => {
  star.addEventListener('click', () => {
    currentRating = parseFloat(star.dataset.value);
    ratingInput.value = currentRating;
    updateStars(currentRating);
  });
  star.addEventListener('mouseenter', () => updateStars(parseFloat(star.dataset.value)));
  star.addEventListener('mouseleave', () => updateStars(currentRating));
});

function updateStars(val) {
  stars.forEach(s => s.classList.toggle('active', parseFloat(s.dataset.value) <= val));
  ratingLabel.textContent = val > 0 ? `${val}.0 / 5.0` : 'Sin calificar';
}

// =============================================
// PREVIEW IMAGEN
// =============================================
const imagenInput = document.getElementById('imagen');
const imgPreview = document.getElementById('imgPreview');
const imgPlaceholder = document.getElementById('imgPlaceholder');

imagenInput.addEventListener('input', () => {
  const url = imagenInput.value.trim();
  if (url) {
    imgPreview.src = url;
    imgPreview.style.display = 'block';
    imgPlaceholder.style.display = 'none';
    imgPreview.onerror = () => {
      imgPreview.style.display = 'none';
      imgPlaceholder.style.display = 'block';
      imgPlaceholder.textContent = 'URL no válida';
    };
  } else {
    imgPreview.style.display = 'none';
    imgPlaceholder.style.display = 'block';
    imgPlaceholder.textContent = 'La imagen aparecerá aquí';
  }
});

// =============================================
// TOAST
// =============================================
function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast' + (isError ? ' error' : '');
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// =============================================
// RESET FORMULARIO
// =============================================
function resetForm() {
  document.getElementById('juegoForm').reset();
  currentRating = 0;
  ratingInput.value = 0;
  updateStars(0);
  imgPreview.style.display = 'none';
  imgPlaceholder.style.display = 'block';
  imgPlaceholder.textContent = 'La imagen aparecerá aquí';
}

document.getElementById('btnResetForm').addEventListener('click', resetForm);

// =============================================
// SUBMIT — CREAR JUEGO
// =============================================
document.getElementById('juegoForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre         = document.getElementById('nombreJuego').value.trim();
  const genero         = document.getElementById('genero').value;
  const anio           = document.getElementById('anioLanzamiento').value;
  const plataforma     = document.getElementById('plataforma').value;
  const desarrolladora = document.getElementById('desarrolladora').value.trim();

  if (!nombre || !genero || !anio || !plataforma || !desarrolladora) {
    showToast('⚠️ Completa los campos obligatorios', true);
    return;
  }

  const payload = {
    nombre:        nombre,
    genero:        genero,
    anio:          parseInt(anio),
    plataforma:    plataforma,
    desarrolladora: desarrolladora,
    descripcion:   document.getElementById('descripcion').value.trim(),
    rating:        parseFloat(ratingInput.value),
    disponible:    document.getElementById('activo').checked,
    imagenUrl:     document.getElementById('imagen').value.trim()
  };

  const btnSubmit = document.querySelector('.btn-submit');
  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Guardando…';

  try {
    const res = await fetch(`${API_BASE}/crear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast('✅ Juego guardado en el catálogo');
      resetForm();
      cargarAlquilados();
    } else {
      const texto = await res.text();
      showToast('❌ Error ' + res.status + ': ' + texto, true);
    }
  } catch (err) {
    showToast('❌ No se pudo conectar con la API', true);
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = '🎮 Guardar juego';
  }
});

// =============================================
// JUEGOS ALQUILADOS — FETCH Y RENDER
// =============================================
async function cargarAlquilados() {
  const grid    = document.getElementById('alquiladosGrid');
  const empty   = document.getElementById('alquiladosEmpty');
  const loading = document.getElementById('alquiladosLoading');

  grid.innerHTML = '';
  empty.hidden   = true;
  loading.hidden = false;

  try {
    const res  = await fetch(`${API_BASE}/alquilados`);
    const data = await res.json();

    loading.hidden = true;

    if (!data || data.length === 0) {
      empty.hidden = false;
      return;
    }

    data.forEach(juego => {
      grid.insertAdjacentHTML('beforeend', tarjetaAlquilado(juego));
    });

  } catch (err) {
    loading.hidden = true;
    grid.insertAdjacentHTML('beforeend', `
      <p class="alq-error">❌ No se pudo cargar la información. Verifica la conexión con la API.</p>
    `);
  }
}

function tarjetaAlquilado(j) {
  const imagen = j.imagenUrl
    ? `<img class="alq-card__img" src="${j.imagenUrl}" alt="${j.nombre}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div class="alq-card__img-placeholder" style="display:none">🎮</div>`
    : `<div class="alq-card__img-placeholder">🎮</div>`;

  const estrellas = generarEstrellas(j.rating || 0);

  return `
    <div class="alq-card">
      <div class="alq-card__cover">
        ${imagen}
        <span class="alq-badge">Alquilado</span>
      </div>
      <div class="alq-card__body">
        <span class="alq-card__genre">${j.genero || '—'}</span>
        <h3 class="alq-card__title">${j.nombre || 'Sin nombre'}</h3>
        <p class="alq-card__meta">${j.plataforma || ''} · ${j.anio || ''}</p>
        <p class="alq-card__dev">${j.desarrolladora || ''}</p>
        <div class="alq-card__rating">${estrellas}</div>
      </div>
    </div>
  `;
}

function generarEstrellas(val) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="star ${i <= val ? 'star--filled' : 'star--empty'}">★</span>`;
  }
  return html;
}

// Cargar al iniciar
cargarAlquilados();

// Botón refrescar
document.getElementById('btnRefrescar').addEventListener('click', cargarAlquilados);