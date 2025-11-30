// Interactive Quiz App
// - Questions embedded below
// - Saves progress to localStorage key "quiz.state.v1"

const STORAGE_KEY = 'quiz.state.v1';

const questions = [
  {
    id: 1,
    q: "Which data type is used to create a variable that should store text in JavaScript?",
    options: ["String", "int", "float", "char"],
    answer: 0,
    explanation: "In JavaScript, text is stored in String type."
  },
  {
    id: 2,
    q: "HTML stands for:",
    options: ["HyperText Markup Language", "HighText Machine Language", "Hyperlink Text Mark Language", "Hyper Tool Multi Language"],
    answer: 0,
    explanation: "HTML stands for HyperText Markup Language."
  },
  {
    id: 3,
    q: "Which CSS property controls the text size?",
    options: ["font-style", "text-size", "font-size", "text-style"],
    answer: 2,
    explanation: "Use font-size to control the size of text in CSS."
  },
  {
    id: 4,
    q: "Which built-in method removes the last element from an array in JavaScript?",
    options: ["pop()", "last()", "remove()", "shift()"],
    answer: 0,
    explanation: "pop() removes the last element; shift() removes the first."
  },
  {
    id: 5,
    q: "Which HTML element is used to specify a footer for a document or section?",
    options: ["<bottom>", "<footer>", "<section-footer>", "<foot>"],
    answer: 1,
    explanation: "The <footer> element represents a footer for its nearest sectioning content."
  },
  {
    id: 6,
    q: "Which symbol is used for comments in single-line JavaScript?",
    options: ["<!-- -->", "/* */", "//", "##"],
    answer: 2,
    explanation: "Use // for single-line comments in JavaScript."
  },
  {
    id: 7,
    q: "Which tag is used to include JavaScript in an HTML page?",
    options: ["<script>", "<javascript>", "<js>", "<code>"],
    answer: 0,
    explanation: "The <script> tag is used to embed JavaScript."
  },
  {
    id: 8,
    q: "Which HTML attribute is used to define inline styles?",
    options: ["class", "styles", "style", "css"],
    answer: 2,
    explanation: "Use the style attribute to apply inline CSS."
  },
  {
    id: 9,
    q: "Which property is used to change the background color in CSS?",
    options: ["color", "bgcolor", "background-color", "backgroundColor"],
    answer: 2,
    explanation: "background-color is the CSS property; backgroundColor is JS style property."
  },
  {
    id: 10,
    q: "In CSS, how do you select an element with id 'main'?",
    options: ["#main", ".main", "main", "*main"],
    answer: 0,
    explanation: "Use #main to select by id."
  },
  {
    id: 11,
    q: "Which operator is used to assign a value to a variable?",
    options: ["=", "==", "===", ":"],
    answer: 0,
    explanation: "The single equals sign = is the assignment operator."
  },
  {
    id: 12,
    q: "Which HTML element is used to display a numbered list?",
    options: ["<ol>", "<ul>", "<li>", "<dl>"],
    answer: 0,
    explanation: "<ol> creates an ordered (numbered) list; <ul> is unordered."
  }
];

// app state
let state = {
  currentIndex: 0,
  answers: Array(questions.length).fill(null), // store index of selected option or null
  finished: false
};

// load state from storage if any
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){ const parsed = JSON.parse(raw);
      // validate basic shape
      if(parsed && Array.isArray(parsed.answers) && typeof parsed.currentIndex === 'number'){
        state = parsed;
      }
    }
  }catch(e){ console.warn('Could not load state', e); }
}

// persist state
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

// DOM refs
const questionWrap = document.getElementById('questionWrap');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const progressText = document.getElementById('progressText');
const progressBarFill = document.querySelector('#progressBar .fill');
const resultCard = document.getElementById('resultCard');
const resultScoreLine = document.getElementById('scoreLine');
const percentLine = document.getElementById('percentLine');
const breakdownEl = document.getElementById('breakdown');
const retakeBtn = document.getElementById('retakeBtn');
const exportBtn = document.getElementById('exportBtn');

// render current question
function renderQuestion(){
  const i = state.currentIndex;
  const qObj = questions[i];
  progressText.textContent = `Question ${i+1} / ${questions.length}`;
  progressBarFill.style.width = `${Math.round(((i)/ (questions.length)) * 100)}%`;

  // build HTML
  questionWrap.innerHTML = `
    <div class="q-title">${escapeHTML(qObj.q)}</div>
    <div class="options" role="list" id="optionsList"></div>
  `;

  const optionsList = document.getElementById('optionsList');
  qObj.options.forEach((opt, idx)=>{
    const selected = state.answers[i] === idx;
    const div = document.createElement('label');
    div.className = `option ${selected ? 'selected' : ''}`;
    div.innerHTML = `
      <input type="radio" name="opt" value="${idx}" ${selected ? 'checked' : ''} aria-checked="${selected}" />
      <div class="opt-text">${escapeHTML(opt)}</div>
    `;
    // clicking label selects
    div.addEventListener('click', (e)=>{
      const radio = div.querySelector('input[type=radio]');
      radio.checked = true;
      handleSelect(idx);
    });
    optionsList.appendChild(div);
  });

  // enable/disable nav
  prevBtn.disabled = i === 0;
  nextBtn.disabled = i === questions.length - 1;
  // if finished hide quiz area? we keep until submit
}

// handle selection
function handleSelect(optionIndex){
  state.answers[state.currentIndex] = optionIndex;
  saveState();
  // visually mark selected option
  document.querySelectorAll('.option').forEach((el, idx)=> el.classList.toggle('selected', idx === optionIndex));
}

// navigation
prevBtn.addEventListener('click', ()=>{
  state.currentIndex = Math.max(0, state.currentIndex - 1);
  renderQuestion();
  saveState();
});
nextBtn.addEventListener('click', ()=>{
  state.currentIndex = Math.min(questions.length - 1, state.currentIndex + 1);
  renderQuestion();
  saveState();
});

// submit quiz -> calculate score and show review
submitBtn.addEventListener('click', ()=>{
  // ensure at least one answer? we allow partial attempts
  state.finished = true;
  saveState();
  showResults();
});

// compute score and show
function showResults(){
  // hide quiz area and show results
  document.getElementById('quizArea').hidden = true;
  resultCard.hidden = false;

  const answered = state.answers.filter(a=>a!==null).length;
  let correct = 0;
  const lines = [];
  questions.forEach((q, idx)=>{
    const sel = state.answers[idx];
    const isCorrect = sel === q.answer;
    if(isCorrect) correct++;
    lines.push({ idx: idx+1, q: q.q, selected: sel, selectedText: sel===null ? '(no answer)' : q.options[sel], correctIndex: q.answer, correctText: q.options[q.answer], correct: isCorrect, explanation: q.explanation||'' });
  });

  resultScoreLine.textContent = `${correct} correct out of ${questions.length} (${answered} answered)`;
  const pct = Math.round((correct / questions.length) * 100);
  percentLine.textContent = `Score: ${pct}%`;

  // breakdown
  breakdownEl.innerHTML = '';
  lines.forEach(line=>{
    const d = document.createElement('div');
    d.className = 'break-item ' + (line.correct ? 'correct' : 'wrong');
    d.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><strong>Q${line.idx}.</strong> ${escapeHTML(line.q)}</div>
        <div style="text-align:right">${line.correct ? '<strong>Correct</strong>' : '<strong>Wrong</strong>'}</div>
      </div>
      <div style="margin-top:8px">
        <div><strong>Your answer:</strong> ${escapeHTML(line.selectedText)}</div>
        <div><strong>Correct answer:</strong> ${escapeHTML(line.correctText)}</div>
        ${line.explanation ? `<div class="muted" style="margin-top:6px"><em>${escapeHTML(line.explanation)}</em></div>` : ''}
      </div>
    `;
    breakdownEl.appendChild(d);
  });

  // update progress bar to full
  document.querySelector('#progressBar .fill').style.width = '100%';
}

// retake
retakeBtn.addEventListener('click', ()=>{
  state = { currentIndex: 0, answers: Array(questions.length).fill(null), finished: false };
  saveState();
  // show quiz area again
  document.getElementById('quizArea').hidden = false;
  resultCard.hidden = true;
  renderQuestion();
});

// export CSV
exportBtn.addEventListener('click', ()=>{
  const rows = [['Q#','Question','Your Answer','Correct Answer','Result']];
  questions.forEach((q, i)=>{
    const sel = state.answers[i];
    const your = sel === null ? '' : q.options[sel];
    const corr = q.options[q.answer];
    const res = sel === q.answer ? 'Correct' : 'Wrong';
    rows.push([i+1, q.q, your, corr, res]);
  });
  const csv = rows.map(r => r.map(cell => `"${(cell+'').replaceAll('"','""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quiz-results.csv';
  a.click();
  URL.revokeObjectURL(url);
});

// helpers
function escapeHTML(s){ return (s||'').toString().replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

// initialization
loadState();
if(state.finished){
  // if finished show results
  document.getElementById('quizArea').hidden = true;
  showResults();
} else {
  renderQuestion();
}
