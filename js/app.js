// Step 1 — Load the disease data from your JSON file
let diseases = [];

fetch('data/diseases.json')
  .then(response => response.json())
  .then(data => {
    diseases = data;
    console.log('Diseases loaded:', diseases.length);
  });


// Step 2 — The search function
function searchDiseases(userInput) {

  // Split what the user typed into individual words
  // toLowerCase makes everything small so FEVER and fever both match
  const userSymptoms = userInput.toLowerCase().split(',').map(s => s.trim());

  // For each disease, count how many symptoms match what the user typed
  const results = diseases.map(disease => {
    let matchCount = 0;

    userSymptoms.forEach(userSymptom => {
      disease.symptoms.forEach(diseaseSymptom => {
        if (diseaseSymptom.includes(userSymptom) || userSymptom.includes(diseaseSymptom)) {
          matchCount++;
        }
      });
    });

    // Calculate match percentage
    const matchPercent = Math.round((matchCount / disease.symptoms.length) * 100);

    return {
      ...disease,
      matchCount,
      matchPercent
    };
  });

  // Filter out diseases with zero matches
  // Sort by highest match percentage first
  return results
    .filter(d => d.matchCount > 0)
    .sort((a, b) => b.matchPercent - a.matchPercent);
}


// Step 3 — Display results on the page
function displayResults(results) {
  const container = document.getElementById('results-container');
  const section = document.getElementById('results-section');

  // If nothing found
  if (results.length === 0) {
    container.innerHTML = `
      <p style="color:#888; text-align:center; padding: 20px;">
        No matching conditions found. Try different symptoms.
      </p>
    `;
    section.style.display = 'block';
    return;
  }

  // Build a card for each result
  container.innerHTML = results.map(disease => `
    <div class="result-card">
      <div class="result-top">
        <h3 class="result-name">${disease.name}</h3>
        <span class="urgency-badge urgency-${disease.urgency}">
          ${getUrgencyLabel(disease.urgency)}
        </span>
      </div>

      <p class="result-description">${disease.description}</p>

      <div class="match-bar-row">
        <span class="match-label">Symptom match</span>
        <div class="match-bar-bg">
          <div class="match-bar-fill" style="width: ${disease.matchPercent}%"></div>
        </div>
        <span class="match-percent">${disease.matchPercent}%</span>
      </div>

      <div class="result-details">
        <p><strong>Spreads through:</strong> ${disease.spreads}</p>
        <div class="prevention-list">
          <strong>Prevention:</strong>
          <ul>
            ${disease.prevention.map(tip => `<li>${tip}</li>`).join('')}
          </ul>
        </div>
        <div class="urgency-box urgency-box-${disease.urgency}">
          ${disease.urgency_reason}
        </div>
      </div>
    </div>
  `).join('');

  section.style.display = 'block';
}


// Step 4 — Helper function for urgency labels
function getUrgencyLabel(urgency) {
  if (urgency === 'high') return 'Go to hospital';
  if (urgency === 'medium') return 'See clinic soon';
  return 'Manageable at home';
}


// Step 5 — Connect the search button to the functions
document.getElementById('search-btn').addEventListener('click', function() {
  const input = document.getElementById('symptom-input').value.trim();
  if (input === '') return;
  const results = searchDiseases(input);
  displayResults(results);
});


// Step 6 — Allow pressing Enter key to search
document.getElementById('symptom-input').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    document.getElementById('search-btn').click();
  }
});


// Step 7 — Symptom tag buttons
document.querySelectorAll('.symptom-tag').forEach(tag => {
  tag.addEventListener('click', function() {
    const input = document.getElementById('symptom-input');
    const tagText = this.textContent.toLowerCase();

    // Add tag to input if not already there
    if (!input.value.includes(tagText)) {
      input.value = input.value 
        ? input.value + ', ' + tagText 
        : tagText;
    }

    this.classList.toggle('selected');
  });
});