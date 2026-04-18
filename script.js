// CSCA Practice - JavaScript with auto-updating dates

// ==================== EXAM SESSIONS DATA ====================
const examSessions = [
  {
    id: 1,
    month: "JAN",
    day: 25,
    year: 2026,
    date: new Date(2026, 0, 25, 9, 0, 0),
    registrationDeadline: new Date(2026, 0, 9, 12, 0, 0),
    status: "completed"
  },
  {
    id: 2,
    month: "MAR",
    day: 15,
    year: 2026,
    date: new Date(2026, 2, 15, 9, 0, 0),
    registrationDeadline: new Date(2026, 2, 5, 12, 0, 0),
    status: "completed"
  },
  {
    id: 3,
    month: "APR",
    day: 25,
    year: 2026,
    date: new Date(2026, 3, 25, 9, 0, 0),
    registrationDeadline: new Date(2026, 3, 9, 12, 0, 0),
    status: "upcoming"
  },
  {
    id: 4,
    month: "JUN",
    day: 27,
    year: 2026,
    date: new Date(2026, 5, 27, 9, 0, 0),
    registrationDeadline: new Date(2026, 5, 17, 12, 0, 0),
    status: "future"
  },
  {
    id: 5,
    month: "DEC",
    day: null,
    year: 2026,
    date: null,
    registrationDeadline: null,
    status: "tba"
  }
];

// ==================== LOCALSTORAGE TRACKING ====================
function getSeenIds(subject, chapter) {
  const key = `csca_seen_${subject}_${chapter}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
}

function addSeenIds(subject, chapter, ids) {
  const key = `csca_seen_${subject}_${chapter}`;
  const current = getSeenIds(subject, chapter);
  const newIds = [...current, ...ids];
  const unique = [...new Map(newIds.map(id => [id, id])).values()];
  localStorage.setItem(key, JSON.stringify(unique));
}

function resetProgress(subject, chapter) {
  if (!confirm('Are you sure you want to reset all your practice progress? This cannot be undone.')) {
    return;
  }
  if (subject && chapter) {
    const key = `csca_seen_${subject}_${chapter}`;
    localStorage.removeItem(key);
    alert(`Progress for ${subject} - ${chapter} has been reset.`);
  } else {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('csca_seen_')) {
        localStorage.removeItem(key);
      }
    }
    localStorage.removeItem('csca_results');
    alert('All practice progress has been reset.');
  }
  if (document.getElementById('progress').classList.contains('active')) {
    renderProgressPage();
  }
  location.reload();
}

// ==================== QUESTION COUNTS & PROGRESS ====================
let totalQuestionCounts = null;

async function loadTotalQuestionCounts() {
  try {
    const res = await fetch('/examples.json');
    const data = await res.json();
    const counts = {};
    for (const subject of ['Mathematics', 'Physics', 'Chemistry']) {
      const subjectData = data[subject];
      if (subjectData && subjectData.examples) {
        for (const q of subjectData.examples) {
          const key = `${subject}_${q.chapter}`;
          counts[key] = (counts[key] || 0) + 1;
        }
      }
    }
    totalQuestionCounts = counts;
  } catch (err) {
    console.error('Failed to load question counts:', err);
  }
}

function getChapterProgress(subject, chapter) {
  const used = getSeenIds(subject, chapter).length;
  const total = totalQuestionCounts ? (totalQuestionCounts[`${subject}_${chapter}`] || 0) : 0;
  const percentage = total > 0 ? (used / total) * 100 : 0;
  return { used, total, percentage };
}

function renderProgressPage() {
  const container = document.getElementById('progress-container');
  if (!container) return;

  const averages = getAverageScores();
  const subjects = ['Mathematics', 'Physics', 'Chemistry'];
  let html = '';

  for (const subject of subjects) {
    const chapters = subjectChapters[subject === 'Mathematics' ? 'math' : subject === 'Physics' ? 'physics' : 'chemistry'];
    if (!chapters) continue;

    let chaptersHtml = '';
    for (const chapter of chapters) {
      const key = `${subject}_${chapter}`;
      const avg = averages[key];
      if (avg === undefined) {
        chaptersHtml += `
          <div class="progress-chapter-card">
            <div class="progress-chapter-header">
              <span class="progress-chapter-name">${chapter}</span>
              <span class="progress-chapter-stats">No tests taken yet</span>
            </div>
            <div class="progress-bar" style="height: 8px; margin-top: 0.5rem;">
              <div class="progress-fill" style="width: 0%; background: var(--border);"></div>
            </div>
          </div>
        `;
        continue;
      }
      let emoji = '';
      let advice = '';
      if (avg >= 80) {
        emoji = '🎉';
        advice = 'Excellent! Keep it up.';
      } else if (avg >= 60) {
        emoji = '👍';
        advice = 'Good. A little more practice will make it perfect.';
      } else if (avg >= 40) {
        emoji = '📚';
        advice = 'Needs work. Review the topics and try again.';
      } else {
        emoji = '⚠️';
        advice = 'Struggling? Focus on this chapter.';
      }
      chaptersHtml += `
        <div class="progress-chapter-card">
          <div class="progress-chapter-header">
            <span class="progress-chapter-name">${chapter} ${emoji}</span>
            <span class="progress-chapter-stats">Average: ${avg}%</span>
          </div>
          <div class="progress-bar" style="height: 8px; margin-top: 0.5rem;">
            <div class="progress-fill" style="width: ${avg}%; background: ${avg >= 70 ? '#10b981' : avg >= 50 ? '#f59e0b' : '#ef4444'};"></div>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-light); margin-top: 0.5rem;">${advice}</div>
        </div>
      `;
    }
    if (chaptersHtml) {
      html += `
        <div class="progress-subject-section">
          <div class="progress-subject-header">
            <h2>${subject}</h2>
          </div>
          <div class="progress-chapters-grid">
            ${chaptersHtml}
          </div>
        </div>
      `;
    }
  }

  if (html === '') {
    container.innerHTML = '<p>No quiz results yet. Take a practice test to see your progress!</p>';
  } else {
    container.innerHTML = html;
  }
}

// Helper to escape HTML
function escapeHtml(str) {
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// ==================== EXAM COUNTDOWNS ====================
function updateSessionStatuses(now) {
  let foundUpcoming = false;
  for (let i = 0; i < examSessions.length; i++) {
    const session = examSessions[i];
    if (!session.date) {
      session.status = "tba";
      continue;
    }
    if (session.date < now) {
      session.status = "completed";
    } else if (!foundUpcoming) {
      session.status = "upcoming";
      foundUpcoming = true;
    } else {
      session.status = "future";
    }
  }
}

function getNextExam() {
  for (const session of examSessions) {
    if (session.status === "upcoming") return session;
  }
  return null;
}

function renderExamDatesGrid() {
  const grid = document.querySelector('.exam-dates-grid');
  if (!grid) return;
  const now = new Date();
  updateSessionStatuses(now);
  grid.innerHTML = examSessions.map(session => {
    const statusClass = session.status;
    const statusText = {
      completed: "Completed",
      upcoming: "Next Exam",
      future: "Upcoming",
      tba: "To Be Announced"
    }[session.status] || "";
    const regDeadlineHtml = (session.status === "upcoming" && session.registrationDeadline)
      ? `<div class="reg-deadline">Register by ${session.registrationDeadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>`
      : "";
    return `
      <div class="exam-date-card ${statusClass}">
        <div class="session-badge">Session ${session.id}</div>
        <div class="date-calendar">
          <div class="cal-month">${session.month}</div>
          <div class="cal-day">${session.day || "TBA"}</div>
        </div>
        <div class="exam-info">
          <div class="exam-day">${session.date ? session.date.toLocaleDateString('en-US', { weekday: 'long' }) : "TBA"}</div>
          <div class="exam-status ${statusClass}">${statusText}</div>
          ${regDeadlineHtml}
        </div>
      </div>
    `;
  }).join('');
}

let examCountdownInterval = null;
let registrationCountdownInterval = null;

function updateExamCountdown() {
  const nextExam = getNextExam();
  if (!nextExam || !nextExam.date) {
    const countdownEl = document.getElementById('exam-countdown');
    if (countdownEl) countdownEl.innerHTML = '<p class="countdown-expired">No upcoming exams scheduled</p>';
    return;
  }
  const now = new Date().getTime();
  const examTime = nextExam.date.getTime();
  const distance = examTime - now;
  const countdownEl = document.getElementById('exam-countdown');
  if (!countdownEl) return;
  if (distance < 0) {
    renderExamDatesGrid();
    updateExamCountdown();
    return;
  }
  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);
  const daysEl = document.getElementById('exam-days');
  const hoursEl = document.getElementById('exam-hours');
  const minutesEl = document.getElementById('exam-minutes');
  const secondsEl = document.getElementById('exam-seconds');
  if (daysEl) daysEl.textContent = days;
  if (hoursEl) hoursEl.textContent = hours;
  if (minutesEl) minutesEl.textContent = minutes;
  if (secondsEl) secondsEl.textContent = seconds;
}

function updateRegistrationCountdown() {
  const nextExam = getNextExam();
  if (!nextExam || !nextExam.registrationDeadline) {
    const countdownEl = document.getElementById('registration-countdown');
    if (countdownEl) {
      countdownEl.innerHTML = '<p class="countdown-expired">No open registration</p>';
      const cardEl = document.querySelector('.countdown-card.urgent');
      if (cardEl) {
        cardEl.classList.remove('urgent');
        cardEl.classList.add('expired');
      }
    }
    return;
  }
  const now = new Date().getTime();
  const deadlineTime = nextExam.registrationDeadline.getTime();
  const distance = deadlineTime - now;
  const countdownEl = document.getElementById('registration-countdown');
  const cardEl = document.querySelector('.countdown-card.urgent');
  if (!countdownEl) return;
  if (distance < 0) {
    countdownEl.innerHTML = '<p class="countdown-expired">Registration closed!</p>';
    if (cardEl) {
      cardEl.classList.remove('urgent');
      cardEl.classList.add('expired');
    }
    return;
  }
  if (cardEl && !cardEl.classList.contains('urgent')) {
    cardEl.classList.add('urgent');
    cardEl.classList.remove('expired');
  }
  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);
  const daysEl = document.getElementById('reg-days');
  const hoursEl = document.getElementById('reg-hours');
  const minutesEl = document.getElementById('reg-minutes');
  const secondsEl = document.getElementById('reg-seconds');
  if (daysEl) daysEl.textContent = days;
  if (hoursEl) hoursEl.textContent = hours;
  if (minutesEl) minutesEl.textContent = minutes;
  if (secondsEl) secondsEl.textContent = seconds;
}

function initCountdowns() {
  renderExamDatesGrid();
  updateExamCountdown();
  updateRegistrationCountdown();
  if (examCountdownInterval) clearInterval(examCountdownInterval);
  if (registrationCountdownInterval) clearInterval(registrationCountdownInterval);
  examCountdownInterval = setInterval(() => {
    updateExamCountdown();
    updateRegistrationCountdown();
  }, 1000);
}

// ==================== PAGE NAVIGATION ====================
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('navLinks').classList.remove('open');
  window.scrollTo(0, 0);

  if (pageId === 'progress') {
    renderProgressPage();
  }
}

function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}

function toggleFaq(element) {
  const faqItem = element.parentElement;
  faqItem.classList.toggle('open');
}

// ==================== PRACTICE PAGE ====================
let practiceState = {
  subject: null,
  testType: null,
  chapter: null,
  questionCount: null,
  timeLimit: null,
  questions: [],
  currentQuestion: 0,
  answers: [],
  startTime: null,
  timerInterval: null
};

const subjectNames = {
  math: 'Mathematics',
  physics: 'Physics',
  chemistry: 'Chemistry'
};

const apiSubjectNames = {
  math: 'Mathematics',
  physics: 'Physics',
  chemistry: 'Chemistry'
};

const subjectChapters = {
  math: [
    "Sets and Inequalities",
    "Functions",
    "Geometry and Algebra",
    "Probability and Statistics"
  ],
  physics: [
    "Mechanics",
    "Electromagnetism",
    "Thermodynamics",
    "Optics",
    "Modern Physics"
  ],
  chemistry: [
    "Basic Chemical Concepts and Calculations",
    "Properties and Reactions of Substances",
    "Chemical Theories and Laws",
    "Chemical Experiments and Applications"
  ]
};

const testConfig = {
  chapter: {
    10: { time: 12 },
    20: { time: 24 }
  },
  mock: {
    48: { time: 60 }
  }
};

function selectSubject(subject) {
  practiceState.subject = subject;
  document.getElementById('step-subject').classList.add('hidden');
  document.getElementById('step-type').classList.remove('hidden');
}

function selectTestType(type) {
  practiceState.testType = type;
  if (type === 'chapter') {
    const chapterContainer = document.getElementById('chapter-options');
    const chapters = subjectChapters[practiceState.subject];
    chapterContainer.innerHTML = chapters.map((ch, i) => `
      <div class="chapter-option" onclick="selectChapter('${ch}')">
        <span class="chapter-number">${i + 1}</span>
        <span class="chapter-name">${ch}</span>
      </div>
    `).join('');
    document.getElementById('chapter-subtitle').textContent = `Choose a chapter in ${subjectNames[practiceState.subject]}:`;
    document.getElementById('step-type').classList.add('hidden');
    document.getElementById('step-chapter').classList.remove('hidden');
  } else {
    const optionsContainer = document.getElementById('question-options');
    optionsContainer.innerHTML = `
      <div class="question-option" onclick="selectQuestions(48)">
        <span class="option-icon">🎯</span>
        <span class="option-label">48 Questions</span>
        <span class="option-time">60 minutes</span>
      </div>
    `;
    document.getElementById('step-type').classList.add('hidden');
    document.getElementById('step-questions').classList.remove('hidden');
  }
}

function selectChapter(chapter) {
  practiceState.chapter = chapter;
  const optionsContainer = document.getElementById('question-options');
  optionsContainer.innerHTML = `
    <div class="question-option" onclick="selectQuestions(10)">
      <span class="option-icon">📝</span>
      <span class="option-label">10 Questions</span>
      <span class="option-time">12 minutes</span>
    </div>
    <div class="question-option" onclick="selectQuestions(20)">
      <span class="option-icon">📚</span>
      <span class="option-label">20 Questions</span>
      <span class="option-time">24 minutes</span>
    </div>
  `;
  document.getElementById('step-chapter').classList.add('hidden');
  document.getElementById('step-questions').classList.remove('hidden');
}

async function selectQuestions(count) {
  practiceState.questionCount = count;
  practiceState.timeLimit = testConfig[practiceState.testType][count].time;

  document.getElementById('step-questions').classList.add('hidden');
  document.getElementById('confirm-subject').textContent = subjectNames[practiceState.subject];
  const chapterDisplay = practiceState.testType === 'chapter' ? practiceState.chapter : 'Full Syllabus (Mock)';
  document.getElementById('confirm-chapter').textContent = chapterDisplay;
  document.getElementById('confirm-count').textContent = count;
  document.getElementById('confirm-time').textContent = `${practiceState.timeLimit} minutes`;

  // Add progress display for chapter‑wise tests
  const confirmCard = document.querySelector('#step-confirm .confirm-card');
  let existingProgress = confirmCard.querySelector('.progress-display');
  if (existingProgress) existingProgress.remove();

  if (practiceState.testType === 'chapter' && practiceState.chapter && totalQuestionCounts) {
    const progress = getChapterProgress(practiceState.subject, practiceState.chapter);
    const progressHtml = `
      <div class="progress-display" style="margin-top: 1rem; padding: 0.75rem; background: var(--bg); border-radius: 8px;">
        <div style="font-size: 0.9rem; margin-bottom: 0.25rem;">📊 Your progress: ${progress.used} out of ${progress.total} unique questions used in this chapter</div>
        <div class="progress-bar" style="height: 8px; background: var(--border); border-radius: 4px; overflow: hidden;">
          <div class="progress-fill" style="width: ${progress.percentage}%; height: 100%; background: var(--primary);"></div>
        </div>
        ${progress.used === progress.total ? '<p style="color: #f59e0b; margin-top: 0.5rem; font-size: 0.85rem;">⚠️ You have used all questions. Some may repeat.</p>' : ''}
      </div>
    `;
    const progressDiv = document.createElement('div');
    progressDiv.innerHTML = progressHtml;
    confirmCard.appendChild(progressDiv.firstChild);
  }

  document.getElementById('step-confirm').classList.remove('hidden');

  const startBtn = document.getElementById('start-quiz-btn');
  const newStartBtn = startBtn.cloneNode(true);
  startBtn.parentNode.replaceChild(newStartBtn, startBtn);
  newStartBtn.addEventListener('click', () => startQuizGeneration());
}

async function startQuizGeneration() {
  document.getElementById('step-confirm').classList.add('hidden');
  document.getElementById('loading-count').textContent = practiceState.questionCount;
  document.getElementById('loading-subject').textContent = subjectNames[practiceState.subject];
  document.getElementById('step-loading').classList.remove('hidden');

  try {
    let excludeIds = [];
    if (practiceState.testType === 'chapter' && practiceState.chapter) {
      excludeIds = getSeenIds(practiceState.subject, practiceState.chapter);
    }

    const apiBody = {
      subject: apiSubjectNames[practiceState.subject],
      numQuestions: practiceState.questionCount,
      testType: practiceState.testType,
      excludeIds: excludeIds,
    };
    if (practiceState.testType === 'chapter') {
      apiBody.chapter = practiceState.chapter;
    }

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiBody),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to generate questions');

    practiceState.questions = data.questions;
    practiceState.answers = new Array(practiceState.questionCount).fill(null);
    practiceState.currentQuestion = 0;
    practiceState.startTime = Date.now();

    if (practiceState.testType === 'chapter' && practiceState.chapter) {
      const newIds = data.questions.map(q => q.id);
      addSeenIds(practiceState.subject, practiceState.chapter, newIds);
    }

    if (data.usedFallback) {
      alert('Note: You have completed all unique questions for this chapter. Some questions may repeat.');
    }

    startQuiz();
  } catch (error) {
    alert('Error: ' + error.message);
    restartPractice();
  }
}

function startQuiz() {
  document.getElementById('step-loading').classList.add('hidden');
  document.getElementById('step-quiz').classList.remove('hidden');
  document.getElementById('quiz-subject').textContent = subjectNames[practiceState.subject];
  document.getElementById('quiz-type').textContent = practiceState.testType === 'chapter' ? 'Chapter Wise' : 'Full Mock';
  renderQuestion(0);
  startTimer();
  updateProgress();
}

function renderQuestion(index) {
  const container = document.getElementById('quiz-content');
  const q = practiceState.questions[index];
  container.innerHTML = `
    <div class="question-card">
      <div class="question-number">Question ${q.number} of ${practiceState.questionCount}</div>
      <div class="question-text">${q.text}</div>
      <div class="options-list">
        ${q.options.map((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          const isSelected = practiceState.answers[index] === i;
          return `
            <div class="option-item ${isSelected ? 'selected' : ''}" onclick="selectAnswer(${index}, ${i})">
              <span class="option-marker">${letter}</span>
              <span class="option-text">${opt.replace(/^[A-D]\)\s*/, '')}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
  updateNavigationButtons();
}

function selectAnswer(questionIndex, optionIndex) {
  practiceState.answers[questionIndex] = optionIndex;
  renderQuestion(questionIndex);
}

function updateNavigationButtons() {
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const submitBtn = document.getElementById('submit-btn');
  if (practiceState.currentQuestion === 0) {
    prevBtn.classList.add('hidden');
  } else {
    prevBtn.classList.remove('hidden');
  }
  if (practiceState.currentQuestion === practiceState.questionCount - 1) {
    nextBtn.classList.add('hidden');
    submitBtn.classList.remove('hidden');
  } else {
    nextBtn.classList.remove('hidden');
    submitBtn.classList.add('hidden');
  }
}

function prevQuestion() {
  if (practiceState.currentQuestion > 0) {
    practiceState.currentQuestion--;
    renderQuestion(practiceState.currentQuestion);
    updateProgress();
  }
}

function nextQuestion() {
  if (practiceState.currentQuestion < practiceState.questionCount - 1) {
    practiceState.currentQuestion++;
    renderQuestion(practiceState.currentQuestion);
    updateProgress();
  }
}

function updateProgress() {
  const progress = ((practiceState.currentQuestion + 1) / practiceState.questionCount) * 100;
  document.getElementById('progress-fill').style.width = progress + '%';
  document.getElementById('progress-text').textContent = `Question ${practiceState.currentQuestion + 1} of ${practiceState.questionCount}`;
}

function startTimer() {
  let timeRemaining = practiceState.timeLimit * 60;
  updateTimerDisplay(timeRemaining);
  practiceState.timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay(timeRemaining);
    if (timeRemaining <= 0) {
      clearInterval(practiceState.timerInterval);
      submitQuiz();
    }
  }, 1000);
}

function updateTimerDisplay(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  const timerDisplay = document.getElementById('timer-display');
  timerDisplay.textContent = display;
  if (seconds < 60) {
    timerDisplay.classList.add('warning');
  } else {
    timerDisplay.classList.remove('warning');
  }
}

function submitQuiz() {
  clearInterval(practiceState.timerInterval);

  let correct = 0;
  let wrong = 0;
  let unanswered = 0;
  const details = [];

  practiceState.questions.forEach((q, i) => {
    const userAnswerIndex = practiceState.answers[i];
    const userAnswerLetter = userAnswerIndex !== null ? String.fromCharCode(65 + userAnswerIndex) : null;
    const isCorrect = (userAnswerLetter === q.correctAnswer);
    if (userAnswerLetter === null) {
      unanswered++;
    } else if (isCorrect) {
      correct++;
    } else {
      wrong++;
    }
    details.push({
      number: i + 1,
      text: q.text,
      userAnswer: userAnswerLetter || 'Not answered',
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      isCorrect,
      wasAnswered: userAnswerLetter !== null
    });
  });

  // --- STORE RESULT (FIXED) ---
  const result = {
    subject: subjectNames[practiceState.subject],   // Full name: Mathematics, Physics, Chemistry
    chapter: practiceState.testType === 'chapter' ? practiceState.chapter : 'Full Mock',
    score: correct,
    total: practiceState.questionCount,
    date: new Date().toISOString(),
  };
  const stored = localStorage.getItem('csca_results');
  const results = stored ? JSON.parse(stored) : [];
  results.push(result);
  // Keep only last 50 results to avoid bloating localStorage
  if (results.length > 50) results.shift();
  localStorage.setItem('csca_results', JSON.stringify(results));

  const timeTaken = Math.floor((Date.now() - practiceState.startTime) / 1000);
  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;

  document.getElementById('score-value').textContent = `${correct}/${practiceState.questionCount}`;
  document.getElementById('correct-value').textContent = correct;
  document.getElementById('wrong-value').textContent = wrong;
  document.getElementById('unanswered-value').textContent = unanswered;
  document.getElementById('time-value').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  let detailsHtml = `<div class="results-details"><h3>Question Review</h3>`;
  details.forEach(d => {
    let statusClass = d.isCorrect ? 'correct' : (d.wasAnswered ? 'wrong' : 'unanswered');
    let statusIcon = d.isCorrect ? '✅' : (d.wasAnswered ? '❌' : '⚠️');
    detailsHtml += `
      <div class="result-question-card ${statusClass}">
        <div class="result-q-header">
          <span class="result-q-num">Question ${d.number}</span>
          <span class="result-status">${statusIcon} ${d.isCorrect ? 'Correct' : (d.wasAnswered ? 'Wrong' : 'Unanswered')}</span>
        </div>
        <div class="result-q-text">${d.text}</div>
        <div class="result-answers">
          <div class="result-user-answer">Your answer: ${d.userAnswer}</div>
          <div class="result-correct-answer">Correct answer: ${d.correctAnswer}</div>
        </div>
        ${!d.isCorrect ? `<div class="result-explanation"><strong>Explanation:</strong> ${d.explanation}</div>` : ''}
      </div>
    `;
  });
  detailsHtml += `</div>`;

  const resultsContainer = document.getElementById('step-results');
  const existingActions = resultsContainer.querySelector('.results-actions');
  const existingDetails = resultsContainer.querySelector('.results-details');
  if (existingDetails) existingDetails.remove();
  const detailsDiv = document.createElement('div');
  detailsDiv.innerHTML = detailsHtml;
  existingActions.insertAdjacentElement('afterend', detailsDiv.firstChild);

  document.getElementById('step-quiz').classList.add('hidden');
  document.getElementById('step-results').classList.remove('hidden');
}

function getAverageScores() {
  const stored = localStorage.getItem('csca_results');
  if (!stored) return {};
  const results = JSON.parse(stored);
  const chapterScores = {};
  const chapterCounts = {};
  for (const r of results) {
    const key = `${r.subject}_${r.chapter}`;
    const percent = (r.score / r.total) * 100;
    chapterScores[key] = (chapterScores[key] || 0) + percent;
    chapterCounts[key] = (chapterCounts[key] || 0) + 1;
  }
  const averages = {};
  for (const key in chapterScores) {
    averages[key] = Math.round(chapterScores[key] / chapterCounts[key]);
  }
  return averages;
}

function goBack(stepId) {
  if (stepId === 'step-type') {
    document.getElementById('step-type').classList.add('hidden');
    document.getElementById('step-subject').classList.remove('hidden');
  } else if (stepId === 'step-chapter') {
    document.getElementById('step-chapter').classList.add('hidden');
    document.getElementById('step-type').classList.remove('hidden');
  } else if (stepId === 'step-questions') {
    document.getElementById('step-questions').classList.add('hidden');
    if (practiceState.testType === 'chapter' && practiceState.chapter) {
      document.getElementById('step-chapter').classList.remove('hidden');
    } else {
      document.getElementById('step-type').classList.remove('hidden');
    }
  } else if (stepId === 'step-confirm') {
    document.getElementById('step-confirm').classList.add('hidden');
    document.getElementById('step-questions').classList.remove('hidden');
  }
}

function restartPractice() {
  if (practiceState.timerInterval) clearInterval(practiceState.timerInterval);
  practiceState = {
    subject: null, testType: null, chapter: null, questionCount: null, timeLimit: null,
    questions: [], currentQuestion: 0, answers: [], startTime: null, timerInterval: null
  };
  document.getElementById('step-subject').classList.add('hidden');
  document.getElementById('step-type').classList.add('hidden');
  document.getElementById('step-chapter').classList.add('hidden');
  document.getElementById('step-questions').classList.add('hidden');
  document.getElementById('step-loading').classList.add('hidden');
  document.getElementById('step-quiz').classList.add('hidden');
  document.getElementById('step-results').classList.add('hidden');
  document.getElementById('step-subject').classList.remove('hidden');
  document.getElementById('step-confirm').classList.add('hidden');
}

// ==================== INITIALIZE ====================
// ==================== INITIALIZE (UNIFIED) ====================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize EmailJS
  emailjs.init('fmVeJ741iON96mvvX');

  initCountdowns();
  loadTotalQuestionCounts();

  // WeChat modal
  const wechatModal = document.getElementById('wechatModal');
  document.querySelectorAll('.wechat-trigger').forEach(tr => {
    tr.addEventListener('click', e => { e.preventDefault(); wechatModal.style.display = 'flex'; });
  });
  document.querySelector('.modal-close')?.addEventListener('click', () => wechatModal.style.display = 'none');
  window.addEventListener('click', e => { if (e.target === wechatModal) wechatModal.style.display = 'none'; });

  // ---------- FEEDBACK MODAL ----------
  const feedbackBtn = document.getElementById('openFeedbackBtn');
  const feedbackModal = document.getElementById('feedbackModal');
  const feedbackForm = document.getElementById('feedbackForm');
  const submitBtn = document.getElementById('submitFeedbackBtn');
  const statusDiv = document.getElementById('feedbackStatus');

  // Open modal
  if (feedbackBtn) {
    feedbackBtn.addEventListener('click', () => {
      feedbackModal.style.display = 'flex';
    });
  }

  // Close modal with X button
  const modalCloseBtn = document.querySelector('#feedbackModal .modal-close');
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => {
      feedbackModal.style.display = 'none';
      feedbackForm.reset();
      statusDiv.className = 'feedback-status';
      statusDiv.style.display = 'none';
    });
  }

  // Submit form
  if (feedbackForm) {
  feedbackForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    statusDiv.className = 'feedback-status'; // hides any previous message

    const templateParams = {
      from_name: document.getElementById('feedbackName').value.trim() || 'Anonymous',
      reply_to: document.getElementById('feedbackEmail').value.trim() || '',
      message: document.getElementById('feedbackMessage').value.trim(),
      timestamp: new Date().toLocaleString()
    };

    // Validation
    if (!templateParams.message || templateParams.message.length < 5) {
      statusDiv.textContent = 'Please enter a message (at least 5 characters).';
      statusDiv.classList.add('error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
      return;
    }

    try {
      await emailjs.send('service_z2fgseq', 'template_dguupqy', templateParams);
      // ✅ Only show success after email is sent
      statusDiv.textContent = 'Thank you! Your feedback has been sent.';
      statusDiv.classList.add('success');
      feedbackForm.reset();
    } catch (error) {
      console.error('EmailJS error:', error);
      statusDiv.textContent = 'Error: Unable to send feedback. Please try again.';
      statusDiv.classList.add('error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    }
  });
}

  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === feedbackModal) {
      feedbackModal.style.display = 'none';
      feedbackForm.reset();
      statusDiv.className = 'feedback-status';
      statusDiv.style.display = 'none';
    }
  });
});

// Generic modal helpers (for Terms/Privacy)
function openModal(modalId) {
  document.getElementById(modalId).style.display = 'flex';
}
function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Feedback Modal
function openFeedbackModal() {
    document.getElementById('feedbackModal').style.display = 'flex';
}

function closeFeedbackModal() {
    document.getElementById('feedbackModal').style.display = 'none';
    document.getElementById('feedbackForm').reset();
    document.getElementById('feedbackStatus').className = 'feedback-status';
    document.getElementById('feedbackStatus').style.display = 'none';
}