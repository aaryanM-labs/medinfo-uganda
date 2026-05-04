let allDiseases = [];
let currentFilter = 'all';

// Load diseases from JSON
fetch('data/diseases.json')
  .then(response => response.json())
  .then(data => {
    // Sort alphabetically by name
    allDiseases = data.sort((a, b) => a.name.localeCompare(b.name));
    document.getElementById('disease-count').textContent = 
      allDiseases.length + ' conditions in database';
    renderGrid(allDiseases);
  });


// Render the disease grid
function renderGrid(diseases) {
  const grid = document.getElementById('diseases-grid');

  if (diseases.length === 0) {
    grid.innerHTML = '<p style="color:#888;text-align:center;padding:40px;">No diseases found.</p>';
    return;
  }

  grid.innerHTML = diseases.map(disease => `
    <div class="disease-card" onclick="openModal('${disease.name}')">
      <div class="disease-card-top">
        <h3 class="disease-card-name">${disease.name}</h3>
        <span class="urgency-badge urgency-${disease.urgency}">
          ${getUrgencyLabel(disease.urgency)}
        </span>
      </div>
      <p class="disease-card-desc">${disease.description}</p>
      <div class="disease-card-symptoms">
        ${disease.symptoms.slice(0, 4).map(s => 
          `<span class="symptom-pill">${s}</span>`
        ).join('')}
        ${disease.symptoms.length > 4 ? 
          `<span class="symptom-pill-more">+${disease.symptoms.length - 4} more</span>` 
          : ''}
      </div>
    </div>
  `).join('');
}


// Open modal with full disease details
function openModal(diseaseName) {
  const disease = allDiseases.find(d => d.name === diseaseName);
  if (!disease) return;

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-header">
      <h2>${disease.name}</h2>
      <span class="urgency-badge urgency-${disease.urgency}">
        ${getUrgencyLabel(disease.urgency)}
      </span>
    </div>
    <p class="modal-desc">${disease.description}</p>
    <div class="modal-section">
      <h4>Symptoms</h4>
      <div class="modal-symptoms">
        ${disease.symptoms.map(s => `<span class="symptom-pill">${s}</span>`).join('')}
      </div>
    </div>
    <div class="modal-section">
      <h4>How it spreads</h4>
      <p>${disease.spreads}</p>
    </div>
    <div class="modal-section">
      <h4>Prevention</h4>
      <ul>
        ${disease.prevention.map(tip => `<li>${tip}</li>`).join('')}
      </ul>
    </div>
    <div class="urgency-box urgency-box-${disease.urgency}">
      ${disease.urgency_reason}
    </div>
  `;

  document.getElementById('modal-overlay').style.display = 'flex';
}


// Close modal
document.getElementById('modal-close').addEventListener('click', function() {
  document.getElementById('modal-overlay').style.display = 'none';
});

document.getElementById('modal-overlay').addEventListener('click', function(e) {
  if (e.target === this) {
    this.style.display = 'none';
  }
});


// Filter by name
document.getElementById('filter-input').addEventListener('input', function() {
  const search = this.value.toLowerCase();
  const filtered = allDiseases.filter(d => {
    const matchesName = d.name.toLowerCase().includes(search);
    const matchesUrgency = currentFilter === 'all' || d.urgency === currentFilter;
    return matchesName && matchesUrgency;
  });
  renderGrid(filtered);
});


// Filter by urgency buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    currentFilter = this.dataset.filter;

    const search = document.getElementById('filter-input').value.toLowerCase();
    const filtered = allDiseases.filter(d => {
      const matchesName = d.name.toLowerCase().includes(search);
      const matchesUrgency = currentFilter === 'all' || d.urgency === currentFilter;
      return matchesName && matchesUrgency;
    });
    renderGrid(filtered);
  });
});


// Urgency label helper
function getUrgencyLabel(urgency) {
  if (urgency === 'high') return 'Go to hospital';
  if (urgency === 'medium') return 'See clinic soon';
  return 'Manageable at home';
}