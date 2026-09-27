import { db, ref, onValue } from './firebase.js';

// Elements
const liveClock = document.getElementById('liveClock');
const liveDate = document.getElementById('liveDate');
const visionMissionSection = document.getElementById('visionMissionSection');
const visionTextElem = document.getElementById('visionText');
const missionTextElem = document.getElementById('missionText');
const dailyPhrasesSection = document.getElementById('dailyPhrasesSection');
const phrasesContainer = document.getElementById('phrasesContainer');
const lastMinuteSpeechSection = document.getElementById('lastMinuteSpeechSection');
const lastMinuteSpeechTextElem = document.getElementById('lastMinuteSpeechText');
const departmentsGrid = document.getElementById('departmentsGrid');

// Live Time Function (Malaysia / Local)
function updateClock() {
  const now = new Date();
  if (liveClock) {
    liveClock.textContent = now.toLocaleTimeString('en-MY', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }
  if (liveDate) {
    liveDate.textContent = now.toLocaleDateString('en-MY', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}
setInterval(updateClock, 1000);
updateClock();

// Format multiline text and bullets cleanly
function formatContent(text) {
  if (!text || text.trim() === '') return '<p class="empty-entry">Pending update...</p>';
  
  const lines = text.split('\n');
  let formattedHtml = '';
  let inList = false;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
      if (!inList) {
        formattedHtml += '<ul class="entry-list">';
        inList = true;
      }
      formattedHtml += `<li>${escapeHtml(trimmed.substring(1).trim())}</li>`;
    } else if (trimmed.length > 0) {
      if (inList) {
        formattedHtml += '</ul>';
        inList = false;
      }
      formattedHtml += `<p class="entry-paragraph">${escapeHtml(trimmed)}</p>`;
    }
  });

  if (inList) formattedHtml += '</ul>';
  return formattedHtml;
}

function escapeHtml(string) {
  const div = document.createElement('div');
  div.innerText = string;
  return div.innerHTML;
}

// Render incoming Firebase state to DOM
function updateUI(data) {
  if (!data) return;

  const config = data.config || {};
  const departments = data.departments || {};

  // 1. Vision & Mission
  if (config.showVisionMission && (config.visionText || config.missionText)) {
    visionMissionSection.style.display = 'grid';
    visionTextElem.textContent = config.visionText || '';
    missionTextElem.textContent = config.missionText || '';
  } else {
    visionMissionSection.style.display = 'none';
  }

  // 2. Daily Phrases
  if (config.showDailyPhrases && Array.isArray(config.phrases) && config.phrases.length > 0) {
    dailyPhrasesSection.style.display = 'flex';
    phrasesContainer.innerHTML = config.phrases
      .map(phrase => `<span class="phrase-pill">${escapeHtml(phrase)}</span>`)
      .join('');
  } else {
    dailyPhrasesSection.style.display = 'none';
  }

  // 3. Last Minute Speech / Announcement
  if (config.showLastMinuteSpeech && config.lastMinuteSpeechText && config.lastMinuteSpeechText.trim() !== '') {
    lastMinuteSpeechSection.style.display = 'flex';
    lastMinuteSpeechTextElem.textContent = config.lastMinuteSpeechText;
  } else {
    lastMinuteSpeechSection.style.display = 'none';
  }

  // 4. Department Cards
  const deptKeys = Object.keys(departments);
  if (deptKeys.length === 0) {
    departmentsGrid.innerHTML = '<div class="empty-state">No departments registered.</div>';
    return;
  }

  departmentsGrid.innerHTML = deptKeys.map(deptName => {
    const info = departments[deptName] || {};
    const updateHtml = formatContent(info.update);
    const showQnA = config.showQnA !== false;
    const hasQuestion = info.question && info.question !== 'N/A' && info.question.trim() !== '';

    return `
      <article class="dept-card">
        <header class="dept-header">
          <h3 class="dept-name">${escapeHtml(deptName)}</h3>
        </header>
        <div class="dept-body">
          <div class="dept-section">
            <span class="section-title">MONTHLY UPDATE</span>
            <div class="section-content">${updateHtml}</div>
          </div>
          ${showQnA ? `
            <div class="dept-section qna-section ${hasQuestion ? 'has-question' : ''}">
              <span class="section-title">Q&A / REQUEST</span>
              <div class="section-content">
                <p class="question-text">${escapeHtml(info.question || 'N/A')}</p>
              </div>
            </div>
          ` : ''}
        </div>
      </article>
    `;
  }).join('');
}

// Initialize Realtime Firebase Listener
const rootRef = ref(db, '/');
onValue(rootRef, (snapshot) => {
  const data = snapshot.val();
  updateUI(data);
}, (error) => {
  console.error("Firebase connection failed:", error);
  departmentsGrid.innerHTML = `<div class="error-state">Failed to connect to real-time feed: ${error.message}</div>`;
});