let diseases = [];

// Load disease data
fetch('data/diseases.json')
  .then(response => response.json())
  .then(data => {
    diseases = data;
    console.log('Loaded', diseases.length, 'diseases');
  });

// ─── STAGE 1: Initial search ───────────────────────────────
function searchDiseases(userInput) {
  const userSymptoms = userInput.toLowerCase()
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const scored = diseases.map(disease => {
    const diseaseSymptoms = disease.symptoms.map(s => s.toLowerCase());
    let matchCount = 0;

    userSymptoms.forEach(userSym => {
      diseaseSymptoms.forEach(diseaseSym => {
        if (diseaseSym.includes(userSym) || userSym.includes(diseaseSym)) {
          matchCount++;
        }
      });
    });

    const matchPercent = Math.round((matchCount / disease.symptoms.length) * 100);
    return { ...disease, matchCount, matchPercent };
  });

  return scored
    .filter(d => d.matchCount > 0)
    .sort((a, b) => b.matchPercent - a.matchPercent);
}

// ─── STAGE 2: Generate follow-up questions ─────────────────
function generateFollowUpQuestions(topDiseases, confirmedSymptoms) {
  const questionSymptoms = new Set();

  // Collect differentiating symptoms from top diseases
  topDiseases.slice(0, 5).forEach(disease => {
    if (disease.differentiating_symptoms) {
      disease.differentiating_symptoms.forEach(sym => {
        const symLower = sym.toLowerCase();
        // Only ask about symptoms not already confirmed
        const alreadyConfirmed = confirmedSymptoms.some(cs =>
          cs.toLowerCase().includes(symLower) || symLower.includes(cs.toLowerCase())
        );
        if (!alreadyConfirmed) {
          questionSymptoms.add(sym);
        }
      });
    }
  });

  // Return max 4 questions
  return Array.from(questionSymptoms).slice(0, 4);
}

// ─── STAGE 3: Refine results based on answers ──────────────
function refineResults(topDiseases, answeredSymptoms, deniedSymptoms) {
  return topDiseases.map(disease => {
    let score = disease.matchPercent;
    const diseaseSymptoms = disease.symptoms.map(s => s.toLowerCase());
    const diffSymptoms = (disease.differentiating_symptoms || []).map(s => s.toLowerCase());

    // Boost score for confirmed differentiating symptoms
    answeredSymptoms.forEach(sym => {
      const symLower = sym.toLowerCase();
      if (diffSymptoms.some(ds => ds.includes(symLower) || symLower.includes(ds))) {
        score += 20;
      } else if (diseaseSymptoms.some(ds => ds.includes(symLower) || symLower.includes(ds))) {
        score += 10;
      }
    });

    // Penalize score for denied differentiating symptoms
    deniedSymptoms.forEach(sym => {
      const symLower = sym.toLowerCase();
      if (diffSymptoms.some(ds => ds.includes(symLower) || symLower.includes(ds))) {
        score -= 25;
      }
    });

    return { ...disease, refinedScore: Math.max(0, score) };
  })
  .sort((a, b) => b.refinedScore - a.refinedScore)
  .filter(d => d.refinedScore > 0);
}

// ─── STAGE 4: Display final results ───────────────────────
function displayResults(results, isRefined = false) {
  const container = document.getElementById('results-container');
  const section = document.getElementById('results-section');

  if (results.length === 0) {
    container.innerHTML = `
      <p style="color:#A0AEC0;text-align:center;padding:30px;">
        No matching conditions found. Try different symptoms.
      </p>
    `;
    section.style.display = 'block';
    return;
  }

  const topResults = isRefined ? results.slice(0, 3) : results.slice(0, 5);

  container.innerHTML = topResults.map((disease, index) => `
    <div class="result-card ${index === 0 && isRefined ? 'top-result' : ''}">
      <div class="result-top">
        <h3 class="result-name">
          ${index === 0 && isRefined ? '🎯 Most likely: ' : ''}${disease.name}
        </h3>
        <span class="urgency-badge urgency-${disease.urgency}">
          ${getUrgencyLabel(disease.urgency)}
        </span>
      </div>

      ${isRefined ? `
        <div class="confidence-row">
          <span class="confidence-label">Confidence</span>
          <div class="match-bar-bg">
            <div class="match-bar-fill" style="width:${Math.min(disease.refinedScore, 100)}%"></div>
          </div>
          <span class="match-percent">${Math.min(disease.refinedScore, 100)}%</span>
        </div>
      ` : `
        <div class="match-bar-row">
          <span class="match-label">Symptom match</span>
          <div class="match-bar-bg">
            <div class="match-bar-fill" style="width:${disease.matchPercent}%"></div>
          </div>
          <span class="match-percent">${disease.matchPercent}%</span>
        </div>
      `}

      <p class="result-description">${disease.description}</p>

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

// ─── FOLLOW-UP UI ──────────────────────────────────────────
function showFollowUpQuestions(questions, topDiseases, confirmedSymptoms) {
  const container = document.getElementById('results-container');
  const section = document.getElementById('results-section');

  const answeredSymptoms = [];
  const deniedSymptoms = [];

  container.innerHTML = `
    <div class="followup-box">
      <div class="followup-header">
        <h3>Let me ask a few more questions</h3>
        <p>Answer yes or no to help narrow down the diagnosis</p>
      </div>
      <div class="followup-questions" id="followup-questions">
        ${questions.map((q, i) => `
          <div class="followup-question" id="fq-${i}">
            <p class="question-text">Do you have <strong>${q}</strong>?</p>
            <div class="question-btns">
              <button class="q-btn q-yes" onclick="answerQuestion(${i}, '${q}', true)">
                Yes
              </button>
              <button class="q-btn q-no" onclick="answerQuestion(${i}, '${q}', false)">
                No
              </button>
              <button class="q-btn q-unsure" onclick="answerQuestion(${i}, '${q}', null)">
                Not sure
              </button>
            </div>
          </div>
        `).join('')}
      </div>
      <div id="followup-progress" style="display:none;">
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" id="progress-fill"></div>
        </div>
        <p id="progress-text" style="font-size:12px;color:#A0AEC0;margin-top:6px;text-align:center;"></p>
      </div>
    </div>
  `;

  section.style.display = 'block';

  let answeredCount = 0;
  const totalQuestions = questions.length;

  // Make answerQuestion available globally
  window.answerQuestion = function(index, symptom, isYes) {
    const qDiv = document.getElementById(`fq-${index}`);
    qDiv.querySelectorAll('.q-btn').forEach(b => b.disabled = true);

    if (isYes === true) {
      answeredSymptoms.push(symptom);
      qDiv.style.borderColor = '#10B981';
      qDiv.querySelector('.q-yes').style.background = '#10B981';
      qDiv.querySelector('.q-yes').style.color = 'white';
    } else if (isYes === false) {
      deniedSymptoms.push(symptom);
      qDiv.style.borderColor = '#EF4444';
      qDiv.querySelector('.q-no').style.background = '#EF4444';
      qDiv.querySelector('.q-no').style.color = 'white';
    } else {
      qDiv.style.borderColor = '#F59E0B';
      qDiv.querySelector('.q-unsure').style.background = '#F59E0B';
      qDiv.querySelector('.q-unsure').style.color = 'white';
    }

    answeredCount++;

    // Show progress
    document.getElementById('followup-progress').style.display = 'block';
    const pct = Math.round((answeredCount / totalQuestions) * 100);
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('progress-text').textContent =
      `${answeredCount} of ${totalQuestions} questions answered`;

    // When all questions answered show refined results
    if (answeredCount === totalQuestions) {
      setTimeout(() => {
        const refined = refineResults(topDiseases, answeredSymptoms, deniedSymptoms);
        displayResults(refined, true);
      }, 800);
    }
  };
}

// ─── URGENCY LABEL ─────────────────────────────────────────
function getUrgencyLabel(urgency) {
  if (urgency === 'high') return 'Go to hospital';
  if (urgency === 'medium') return 'See clinic soon';
  return 'Manageable at home';
}

// ─── MAIN SEARCH TRIGGER ───────────────────────────────────
document.getElementById('search-btn').addEventListener('click', function() {
  const input = document.getElementById('symptom-input').value.trim();
  if (input === '') return;

  const confirmedSymptoms = input.toLowerCase().split(',').map(s => s.trim());
  const results = searchDiseases(input);

  if (results.length === 0) {
    displayResults([]);
    return;
  }

  // Generate follow-up questions from top matches
  const questions = generateFollowUpQuestions(results, confirmedSymptoms);

  if (questions.length > 0) {
    // Show initial results briefly then ask follow-ups
    showFollowUpQuestions(questions, results, confirmedSymptoms);
  } else {
    // No follow-up questions needed — show results directly
    displayResults(results);
  }
});

// Enter key support
document.getElementById('symptom-input').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') document.getElementById('search-btn').click();
});

// Symptom tag buttons
document.querySelectorAll('.symptom-tag').forEach(tag => {
  tag.addEventListener('click', function() {
    const input = document.getElementById('symptom-input');
    const tagText = this.textContent.toLowerCase();
    if (!input.value.includes(tagText)) {
      input.value = input.value ? input.value + ', ' + tagText : tagText;
    }
    this.classList.toggle('selected');
  });
});