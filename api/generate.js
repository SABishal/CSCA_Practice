const examples = require('../examples.json');

// Preprocess: assign a unique, stable ID to each question
// ID format: `${subject}_${chapter}_${index}`
function assignIds(subject, subjectData) {
  subjectData.examples.forEach((q, idx) => {
    // Create a sanitized chapter name (remove spaces and special chars)
    const chapterKey = q.chapter.replace(/[^a-zA-Z0-9]/g, '_');
    q.id = `${subject}_${chapterKey}_${idx}`;
  });
}

// Assign IDs for all subjects
for (const subject of ['Mathematics', 'Physics', 'Chemistry']) {
  if (examples[subject]) assignIds(subject, examples[subject]);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { subject, numQuestions, testType, chapter, excludeIds = [] } = req.body;

    if (!subject || !numQuestions || !testType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const validSubjects = ['Mathematics', 'Physics', 'Chemistry'];
    if (!validSubjects.includes(subject)) {
      return res.status(400).json({ error: 'Invalid subject' });
    }

    const subjectData = examples[subject];
    if (!subjectData || !subjectData.examples || subjectData.examples.length === 0) {
      return res.status(400).json({ error: `No questions found for subject: ${subject}` });
    }

    let availableQuestions = subjectData.examples;

    // Filter by chapter
    if (testType === 'chapter' && chapter) {
      availableQuestions = availableQuestions.filter(q => q.chapter === chapter);
      if (availableQuestions.length === 0) {
        return res.status(400).json({ error: `No questions found for chapter: ${chapter}` });
      }
    }

    // Exclude previously seen questions
    const excludeSet = new Set(excludeIds);
    const unseenQuestions = availableQuestions.filter(q => !excludeSet.has(q.id));
    
    let selectedQuestions;
    let usedFallback = false;
    if (unseenQuestions.length >= numQuestions) {
      selectedQuestions = unseenQuestions;
    } else {
      // Not enough unseen questions – allow repeats (fallback to all questions)
      usedFallback = true;
      selectedQuestions = availableQuestions;
      console.warn(`Not enough unseen questions for ${subject}/${chapter}. Using all questions.`);
    }

    // Randomly select
    const shuffled = [...selectedQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const selected = shuffled.slice(0, Math.min(numQuestions, shuffled.length));

    const questions = selected.map((q, idx) => ({
      id: q.id,
      number: idx + 1,
      difficulty: q.difficulty,
      text: q.text,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    }));

    return res.status(200).json({
      success: true,
      subject,
      testType,
      chapter: chapter || 'All Chapters',
      questionCount: questions.length,
      questions,
      usedFallback,  // optional flag to inform frontend
    });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};