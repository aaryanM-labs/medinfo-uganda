let allDrugs = [];
let currentFilter = 'all';

fetch('data/drugs.json')
  .then(response => response.json())
  .then(data => {
    allDrugs = data.sort((a, b) => a.name.localeCompare(b.name));
    document.getElementById('drug-count').textContent =
      allDrugs.length + ' medications in database';
    renderDrugs(allDrugs);
  });


function renderDrugs(drugs) {
  const grid = document.getElementById('drugs-grid');

  if (drugs.length === 0) {
    grid.innerHTML = '<p style="color:#A0AEC0;text-align:center;padding:40px;">No medications found.</p>';
    return;
  }

  grid.innerHTML = drugs.map(drug => `
    <div class="disease-card" onclick="openModal('${drug.id}')">
      <div class="disease-card-top">
        <h3 class="disease-card-name">${drug.name}</h3>
        <span class="urgency-badge ${drug.prescription_needed ? 'urgency-high' : 'urgency-low'}">
          ${drug.prescription_needed ? 'Prescription' : 'OTC'}
        </span>
      </div>
      <p class="disease-card-desc">${drug.category}</p>
      <div class="disease-card-symptoms">
        ${drug.treats.slice(0, 3).map(t =>
          `<span class="symptom-pill">${t}</span>`
        ).join('')}
        ${drug.treats.length > 3 ?
          `<span class="symptom-pill-more">+${drug.treats.length - 3} more</span>`
          : ''}
      </div>
    </div>
  `).join('');
}


function openModal(id) {
  const drug = allDrugs.find(d => d.id === id);
  if (!drug) return;

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-header">
      <h2>${drug.name}</h2>
      <span class="urgency-badge ${drug.prescription_needed ? 'urgency-high' : 'urgency-low'}">
        ${drug.prescription_needed ? 'Prescription needed' : 'Over the counter'}
      </span>
    </div>

    <p class="modal-desc">${drug.category}</p>

    <div class="modal-section">
      <h4>Treats</h4>
      <div class="modal-symptoms">
        ${drug.treats.map(t => `<span class="symptom-pill">${t}</span>`).join('')}
      </div>
    </div>

    <div class="modal-section">
      <h4>How it works</h4>
      <p>${drug.how_it_works}</p>
    </div>

    <div class="modal-section">
      <h4>Dosage</h4>
      <p>${drug.dosage}</p>
    </div>

    <div class="modal-section">
      <h4>Side effects</h4>
      <ul>
        ${drug.side_effects.map(s => `<li>${s}</li>`).join('')}
      </ul>
    </div>

    <div style="background:#FEE2E2;border-radius:6px;padding:12px 14px;margin-top:12px;">
      <p style="font-size:12px;font-weight:600;color:#991B1B;margin-bottom:4px;">
        WARNINGS
      </p>
      <p style="font-size:13px;color:#991B1B;">${drug.warnings}</p>
    </div>

    <div style="background:#E8F5EE;border-radius:6px;padding:12px 14px;margin-top:8px;">
      <p style="font-size:12px;font-weight:600;color:#1A6B4A;margin-bottom:4px;">
        AVAILABLE IN UGANDA
      </p>
      <p style="font-size:13px;color:#1A6B4A;">
        ${drug.available_in_uganda ? 
          'This medication is commonly available in Uganda at pharmacies and health centres.' : 
          'Availability in Uganda may be limited. Check with your nearest hospital.'}
      </p>
    </div>
  `;

  document.getElementById('modal-overlay').style.display = 'flex';
}


document.getElementById('modal-close').addEventListener('click', function() {
  document.getElementById('modal-overlay').style.display = 'none';
});

document.getElementById('modal-overlay').addEventListener('click', function(e) {
  if (e.target === this) this.style.display = 'none';
});


document.getElementById('filter-input').addEventListener('input', function() {
  const search = this.value.toLowerCase();
  const filtered = allDrugs.filter(d => {
    const matchesName = d.name.toLowerCase().includes(search) ||
      d.treats.some(t => t.toLowerCase().includes(search));
    const matchesPrescription = currentFilter === 'all' ||
      String(d.prescription_needed) === currentFilter;
    return matchesName && matchesPrescription;
  });
  renderDrugs(filtered);
});


document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    currentFilter = this.dataset.filter;

    const search = document.getElementById('filter-input').value.toLowerCase();
    const filtered = allDrugs.filter(d => {
      const matchesName = d.name.toLowerCase().includes(search) ||
        d.treats.some(t => t.toLowerCase().includes(search));
      const matchesPrescription = currentFilter === 'all' ||
        String(d.prescription_needed) === currentFilter;
      return matchesName && matchesPrescription;
    });
    renderDrugs(filtered);
  });
});