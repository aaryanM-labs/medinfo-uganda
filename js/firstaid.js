let allGuides = [];
let currentFilter = 'all';

fetch('data/firstaid.json')
  .then(response => response.json())
  .then(data => {
    allGuides = data.sort((a, b) => a.title.localeCompare(b.title));
    document.getElementById('guide-count').textContent =
      allGuides.length + ' guides available';
    renderGuides(allGuides);
  });


function renderGuides(guides) {
  const grid = document.getElementById('guides-grid');

  if (guides.length === 0) {
    grid.innerHTML = '<p style="color:#A0AEC0;text-align:center;padding:40px;">No guides found.</p>';
    return;
  }

  grid.innerHTML = guides.map(guide => `
    <div class="disease-card" onclick="openModal('${guide.id}')">
      <div class="disease-card-top">
        <h3 class="disease-card-name">${guide.title}</h3>
        <span class="urgency-badge urgency-${guide.urgency}">
          ${getUrgencyLabel(guide.urgency)}
        </span>
      </div>
      <p class="disease-card-desc">${guide.summary}</p>
      <div class="disease-card-symptoms">
        <span class="symptom-pill">${guide.category}</span>
        <span class="symptom-pill">${guide.steps.length} steps</span>
      </div>
    </div>
  `).join('');
}


function openModal(id) {
  const guide = allGuides.find(g => g.id === id);
  if (!guide) return;

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-header">
      <h2>${guide.title}</h2>
      <span class="urgency-badge urgency-${guide.urgency}">
        ${getUrgencyLabel(guide.urgency)}
      </span>
    </div>

    <p class="modal-desc">${guide.summary}</p>

    <div class="modal-section">
      <h4>Steps to follow</h4>
      <ol style="margin-left:16px;">
        ${guide.steps.map(step => `
          <li style="font-size:13px;color:#4A5568;line-height:1.7;margin-bottom:8px;">
            ${step}
          </li>
        `).join('')}
      </ol>
    </div>

    ${guide.warning ? `
      <div style="background:#FEF3C7;border-radius:6px;padding:12px 14px;margin-top:12px;">
        <p style="font-size:12px;font-weight:600;color:#92400E;margin-bottom:4px;">
          WARNING
        </p>
        <p style="font-size:13px;color:#92400E;">${guide.warning}</p>
      </div>
    ` : ''}

    ${guide.do_not ? `
      <div style="background:#FEE2E2;border-radius:6px;padding:12px 14px;margin-top:8px;">
        <p style="font-size:12px;font-weight:600;color:#991B1B;margin-bottom:4px;">
          DO NOT
        </p>
        <p style="font-size:13px;color:#991B1B;">${guide.do_not}</p>
      </div>
    ` : ''}
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
  const filtered = allGuides.filter(g => {
    const matchesName = g.title.toLowerCase().includes(search);
    const matchesUrgency = currentFilter === 'all' || g.urgency === currentFilter;
    return matchesName && matchesUrgency;
  });
  renderGuides(filtered);
});


document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    currentFilter = this.dataset.filter;

    const search = document.getElementById('filter-input').value.toLowerCase();
    const filtered = allGuides.filter(g => {
      const matchesName = g.title.toLowerCase().includes(search);
      const matchesUrgency = currentFilter === 'all' || g.urgency === currentFilter;
      return matchesName && matchesUrgency;
    });
    renderGuides(filtered);
  });
});


function getUrgencyLabel(urgency) {
  if (urgency === 'high') return 'Emergency';
  if (urgency === 'medium') return 'Urgent';
  return 'General';
}