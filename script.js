//CONSTANTS AND GLOBAL VARIABLES

const COLOR_DARK = 0;
const COLOR_LIGHT = 1;
let colorMode = COLOR_DARK;

const MODE_PRACTICE = 0;
const MODE_EXAM = 1;
let quizMode = MODE_PRACTICE;

const ORDER_RANDOM = 0;
const ORDER_INORDER = 1;
const ORDER_REVERSE = 2;
let order = ORDER_RANDOM;

const DELIMITER_OPTIONS = ['-', ',', ' ', '|', '\t'];
const DELIMITER_WORDS = ['-', ',', 'space', '|', 'tab'];
let delimiter_nmb = 4;
let delimiter = "\t";

const screen = document.getElementById("screen");

let allWordPairs = [];
let currentWordSet = [];
let answerLog = [];
let incorrectWordSet = [];

let currentQuestion = "";
let currentAnswer = "";
let inputBuffer = "";

let currentIndex = 0;
let totalAnswerCount = 0;
let currentCorrectCount = 0;
let correctAnswerCount = 0;
let numberOfHintsUsed = 0;

let timer;
let time = 0;
let focusStartTime = 0;
let sessionTimeElapsed = 0;
let countdownId = 0;
let hintTimerId = 0;

//basic settings
var autoSubmit = false;
var caseSensitivity = false;
var skipEvaluation = false;
var ignoreAccents = false;

let maxPercentage = 0; //maximum percentage where the program will stop
let currentPercentage = 0; //current percentage

let isSettingsOpen = false;
let isEditorOpen = false;
let isEvaluatingAnswer = false;
let isPracticingIncorrectWords = false;
let isHintTimeStopped = true;
let isTimeStopped = false;
let isTimePaused = true;
let isFocused = false;
let restartOnExit = true;
let hasWordPairsChanged = false;

let incorrectOnly = false;

let isMobile = false;

//UTILITY FUNCTIONS

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function shuffle(array) {
  var m = array.length, t, i;

  while (m) {

    i = Math.floor(Math.random() * m--);

    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }
}

function timeify(currentTime) {
  let seconds = 0;
  let minutes = 0;
  let formattedSeconds = "";
  minutes = Math.floor(currentTime / 60);
  seconds = currentTime % 60;
  if (seconds < 10) formattedSeconds = "0" + seconds;
  else formattedSeconds = seconds;

  return (minutes + ":" + formattedSeconds);
}

function removeAccents(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

//UI DISPLAY AND TRANSITION HELPERS

async function hide(className, sleepTime = 300) {
  const elements = document.querySelectorAll(className);

  for (const el of elements) {
    el.style.opacity = "0";
    el.style.visibility = "hidden";
    if (sleepTime != 0) {
      await sleep(sleepTime);
    }
    el.classList.add('hide');
  }
}

function show(className) {
  const elements = document.querySelectorAll(className);

  for (const el of elements) {
    el.style.visibility = "visible";
    el.style.opacity = "1";
    el.classList.remove('hide');
  }
}

function toggleButton(buttonID) {
  document.getElementById(buttonID).classList.add("on");
}

//SETTINGS MANAGEMENT

function toggleSettingsPanel() {
  if (isSettingsOpen) {
    close_settings();
  }
  else {
    open_settings();
  }
}

async function close_settings() {

  isSettingsOpen = false;
  enableInput(true);
  hide('.options');
  show('asked');
  show('.input-box');
}

function open_settings() {
  close_editor();
  stop_focus();
  isSettingsOpen = true;
  enableInput(false);

  show('.options');
  hide('asked');
  hide('.input-box');
}

function refreshSettings() {
  document.querySelectorAll('.button').forEach(el => {
    el.classList.remove("on");
  });

  if (autoSubmit) toggleButton('inst-feedback-on');
  else toggleButton('inst-feedback-off');

  if (caseSensitivity) toggleButton('case-sen-on');
  else toggleButton('case-sen-off');

  if (skipEvaluation) toggleButton('auto-next-on');
  else toggleButton('auto-next-off');

  if (ignoreAccents) toggleButton('ignore-accents-on');
  else toggleButton('ignore-accents-off');

  if (quizMode === MODE_PRACTICE) toggleButton('mode-practice');
  else toggleButton('mode-exam');

  if (order === ORDER_RANDOM) toggleButton('order-random');
  else if (order === ORDER_INORDER) toggleButton('order-inorder');
  else toggleButton('order-postorder');

  if (time === 0) toggleButton('time-off');
  else if (time === 30) toggleButton('time-30');
  else if (time === 60) toggleButton('time-60');
  else if (time === 120) toggleButton('time-120');
  else toggleButton('time-300');

  if (maxPercentage === 0) toggleButton('percentage-off');
  else if (maxPercentage === 50) toggleButton('percentage-50');
  else if (maxPercentage === 60) toggleButton('percentage-60');
  else if (maxPercentage === 80) toggleButton('percentage-80');
  else toggleButton('percentage-90');

  if (colorMode === COLOR_LIGHT) toggleButton('colors-light');
  else toggleButton('colors-dark');

  saveSettings();
}

function toggleSetting(propName, value) {
  window[propName] = value;
  refreshSettings();
  if (propName === "order") {
    initializeSession();
  }
}

function setOrder(order_number) {
  order = order_number;

  initializeSession();
}

function setTime(time_number) {
  time = time_number;


  document.querySelector('.time-left').textContent = timeify(time);

  if (time === 0) {
    countup(0);
  }
  else {
    countdown(time - 1);
  }

  refreshSettings();
}

function setMode(mode_number) {
  quizMode = mode_number;

  if (quizMode === MODE_EXAM) {
    hide('.percentage');
    maxPercentage = 0;
    isPracticingIncorrectWords = false;
  }
  else if (quizMode === MODE_PRACTICE) {
    show('.percentage');
  }
  initializeSession();
}

function setPercentage(percentage_number) {
  maxPercentage = percentage_number

  if (percentage_number != 0 && quizMode === MODE_EXAM) {
    setMode(MODE_PRACTICE);
  }

  refreshSettings();
}

function setColorMode(number) {
  colorMode = number;
  const c = document.documentElement.style;
  if (colorMode === COLOR_DARK) {
    c.setProperty('--color-text', 'white');
    c.setProperty('--color-text-primary', 'rgb(184, 184, 184)');
    c.setProperty('--color-text-secondary', 'rgb(120, 120, 120)');

    c.setProperty('--color-background-dark', 'rgb(36, 36, 36)');
    c.setProperty('--color-background-light', 'rgb(44, 46, 49)');
    c.setProperty('--color-background-main', 'rgb(50, 52, 55)');

    c.setProperty('--color-error', 'lightcoral');
    c.setProperty('--color-success', 'rgb(187, 255, 187)');
  }
  else if (colorMode === COLOR_LIGHT) {
    c.setProperty('--color-text', 'rgb(26, 26, 26)');
    c.setProperty('--color-text-primary', 'rgb(44, 44, 44)');
    c.setProperty('--color-text-secondary', 'rgb(106, 106, 106)');

    c.setProperty('--color-background-dark', 'rgb(220, 220, 220)');
    c.setProperty('--color-background-light', 'rgb(245, 245, 243)');
    c.setProperty('--color-background-main', 'rgb(209, 204, 197)');

    c.setProperty('--color-error', 'rgb(214, 37, 37)');
    c.setProperty('--color-success', 'rgb(40, 167, 69)');


  }
  refreshSettings();
}

//EDITOR MANAGEMENT

function toggleEditorPanel() {
  if (isEditorOpen) {
    close_editor();
  }
  else {
    open_editor();
  }
}

function open_editor() {
  close_settings();
  stop_focus();
  isEditorOpen = true;
  enableInput(false);
  hasWordPairsChanged = false;
  show('.editor');
}

function close_editor() {
  isEditorOpen = false;
  hide('.editor');
  if (restartOnExit) {
    applyEditorChanges();
    restartOnExit = false;
  }
}

function applyEditorChanges() {
  if (document.querySelector(".editor-input-box").value.length != 0) {
    enableInput(true);
    stop_focus();
  }
  initializeSession();
}

function parseInputWords(text) {
  const lines = text.trim().split('\n');
  oldWords = allWordPairs.slice();

  allWordPairs = lines
    .map(line => line.trim())
    .map(line => line.split(delimiter))
    .filter(parts => parts.length >= 2 && parts[0] && parts[1])
    .map(parts => ({
      a: parts[0].trim(),
      b: parts[1].trim()
    }));

  if (oldWords != allWordPairs) {
    updateWordCount();
    saveWords();
    restartOnExit = true;
  }
}

function setEditorPlaceholder(delimiter_char) {
  document.querySelector(".editor-input-box").placeholder = "copy, upload or type your words here\n\nexample:\n"
    + "\napple" + delimiter_char + "alma\n"
    + "bathroom" + delimiter_char + "fürdőszoba\n"
    + "teacher" + delimiter_char + "tanár\n"
    + "box" + delimiter_char + "doboz\n"
    + "something" + delimiter_char + "valami\n"
    + "green" + delimiter_char + "zöld\n"
}

function change_delimiter() {
  let db = document.querySelector('.delimiter-button');
  if (delimiter_nmb < 4) delimiter_nmb++;
  else delimiter_nmb = 0;

  delimiter = DELIMITER_OPTIONS[delimiter_nmb];
  db.textContent = "delimiter: " + DELIMITER_WORDS[delimiter_nmb];

  console.log(db.textContent);
  parseInputWords(document.querySelector(".editor-input-box").value);
  setEditorPlaceholder(delimiter);
}

function updateWordCount() {
  if (allWordPairs.length === 1) {
    document.querySelector(".words-loaded").textContent = "1 word";
  }
  else {
    document.querySelector(".words-loaded").textContent = allWordPairs.length + " words";
  }
}

document.querySelector(".editor-input-box").addEventListener("input", function () {
  clearTimeout(timer);
  timer = setTimeout(() => {
    parseInputWords(this.value);
  }, 200);
});

document.querySelector(".editor-input-box").addEventListener("keydown", function (e) {
  if (e.key === "Tab") {
    e.preventDefault();

    const el = this;
    const start = el.selectionStart;
    const end = el.selectionEnd;

    el.value = el.value.substring(0, start) + "\t" + el.value.substring(end);

    el.selectionStart = el.selectionEnd = start + 1;
  }
});

//INPUT AND KEY HANDLING

function keyHandler(event) {
  if (!isFocused) {
    start_focus();
  }
  else if (isEvaluatingAnswer) {
    if (event.key === "Enter" || event.key === " ") {
      stop_evaluate();
    }
  }
  else {
    if (event.key === "Backspace") {
      inputBuffer = inputBuffer.slice(0, -1);
    } else if (event.key === "Enter") {
      checkanswer(inputBuffer);
    } else if (event.key === "Tab") {
      event.preventDefault();
      hint();
    } else if (event.key.length === 1) {
      inputBuffer += event.key;
    }
    if (inputBuffer.length === currentAnswer.length && autoSubmit) {
      checkanswer(inputBuffer);
    }
    screen.textContent = inputBuffer;
  }
}

function mobileInputHandler(event) {
  const hiddenInput = event.target;

  for (let char of hiddenInput.value) {
    if (char === "\n" || char === "\r") {
      checkanswer(inputBuffer);
      inputBuffer = "";
    } else {
      inputBuffer += char;
    }
  }

  if (inputBuffer.length === currentAnswer.length && autoSubmit) {
    checkanswer(inputBuffer);
  }

  screen.textContent = inputBuffer;

  hiddenInput.value = "";
}

function hiddenInputKeyDownHandler(event) {
  if (event.key === "Backspace") {
    inputBuffer = inputBuffer.slice(0, -1);
  }
  else if (event.key === "Enter") {
    if (isEvaluatingAnswer) {
      stop_evaluate();
    }
    else {
      checkanswer(inputBuffer);
      inputBuffer = "";
    }
  }
  screen.textContent = inputBuffer;
}

function enableInput(bool) {
  const hiddenInput = document.getElementById("hidden-input");

  if (bool && allWordPairs.length !== 0) {
    if (isMobile) {
      hiddenInput.addEventListener("input", mobileInputHandler);
      hiddenInput.addEventListener("keydown", hiddenInputKeyDownHandler);
      document.removeEventListener("keydown", keyHandler);
    } else {
      document.addEventListener("keydown", keyHandler);
      hiddenInput.removeEventListener("input", mobileInputHandler);
      hiddenInput.removeEventListener("keydown", hiddenInputKeyDownHandler);
    }
    show(".focus-click-area");
  } else {
    document.removeEventListener("keydown", keyHandler);
    hiddenInput.removeEventListener("input", mobileInputHandler);
    hiddenInput.removeEventListener("keydown", hiddenInputKeyDownHandler);
    hide(".focus-click-area");
  }
}

document.getElementById("screen").addEventListener("click", () => {
  if (!isFocused) start_focus();
  document.getElementById("hidden-input").focus();
});

//QUIZ FLOW LOGIC

function initializeSession() {
  currentIndex = 0;
  correctAnswerCount = 0;
  numberOfHintsUsed = 0;
  sessionTimeElapsed = 0;
  isHintTimeStopped = false;
  answerLog = [];
  show('#finish-button');
  show('#pause-button');

  if (quizMode === MODE_EXAM) {
    document.querySelector('.logo').classList.remove('practice');
    document.querySelector('.logo').classList.add('exam');
  }
  else {
    document.querySelector('.logo').classList.remove('exam');
    document.querySelector('.logo').classList.add('practice');
  }

  setTime(time);
  setCurrentWords();

  if (time === 0) {
    countup(0);
  }
  else {
    countdown(time - 1);
  }

  sessionStartTime = Date.now();

  if (quizMode === MODE_PRACTICE) { // practice
    show('.percentage');
    currentCorrectCount = 0; //start value, checkanswer() changes it
    totalAnswerCount = currentIndex; //start value, checkanswer() changes it
    setScore();
  }
  else { // exam
    hide('.percentage', 0);
    currentCorrectCount = 0; //start value, setNextPair() changes it
    totalAnswerCount = currentWordSet.length; //fix value
    setScore();
  }

  loadNextQuestion();
  refreshSettings();
}

function setScore() {
  document.querySelector(".correct-per-all").textContent = currentCorrectCount + "/" + totalAnswerCount;
  if (quizMode === MODE_EXAM) return;
  if (totalAnswerCount === 0) { currentPercentage = 0; }
  else currentPercentage = Math.floor(currentCorrectCount / totalAnswerCount * 100);
  document.querySelector(".percentage").textContent = currentPercentage + "%";
}

function loadNextQuestion() {
  if (allWordPairs.length === 0) {
    console.warn("No word pairs loaded.");
    isHintTimeStopped = true;
    document.querySelector('.asked').textContent = "enter your words in the editor!";
    document.querySelector('.logo').classList.remove('practice');
    document.querySelector('.logo').classList.remove('exam');
    hide('#pause-button');
    hide('#finish-button');
    return;
  }

  switch (quizMode) {

    case 0: //practice mode
      if (currentIndex === currentWordSet.length) {
        currentIndex = 0;
        setCurrentWords();
      }
      break;
    case 1: //exam mode
      if (currentIndex === currentWordSet.length) {

        finishExam();
        return;
      }
      else {
        currentCorrectCount += 1;
        setScore();
      }
      break;

  }

  if (currentIndex >= currentWordSet.length) {
    console.warn("No more word pairs at index:", currentIndex);
    finishExam();
    return;
  }

  currentQuestion = currentWordSet[currentIndex].a;
  currentAnswer = currentWordSet[currentIndex].b;
  console.log(currentWordSet[currentIndex]);
  document.querySelector(".asked").textContent = currentQuestion;
  hintTimer();
  currentIndex += 1;
}

function setCurrentWords() {
  if (isPracticingIncorrectWords) {
    currentWordSet = incorrectWordSet.slice();
  }
  else {
    currentWordSet = allWordPairs.slice();
  }
  switch (order) {
    case 0: //random
      shuffle(currentWordSet);
      break;
    case 1: //inorder
      break;
    case 2: //postorder
      currentWordSet.reverse();
      break;
  }
}

function checkanswer(guess) {
  let is_correct = true;
  guess = String(guess);
  let cAnswer = currentAnswer;
  let cGuess = guess;

  if (caseSensitivity == false) {
    cGuess = cGuess.toLowerCase();
    cAnswer = cAnswer.toLowerCase();
  }

  if (ignoreAccents === true) {
    cGuess = removeAccents(cGuess);
    cAnswer = removeAccents(cAnswer);
  }

  if (cGuess == cAnswer) {
    is_correct = true;

  }
  else { is_correct = false; }

  if (quizMode === MODE_PRACTICE) {
    if (is_correct) currentCorrectCount++;
    totalAnswerCount += 1;
    setScore();
  }
  answerLog.push({
    question: currentQuestion,
    answer: currentAnswer,
    guess: guess,
    is_correct: is_correct
  });

  if (is_correct) {
    feedback_green('correct');
    correctAnswerCount += 1;
    loadNextQuestion();
    if (maxPercentage != 0 && currentPercentage >= maxPercentage) {
      finishExam();

    }
  }
  else {
    if (skipEvaluation) {
      feedback_red('incorrect');
      loadNextQuestion();
    }
    else {
      start_evaluate(guess);
    }
  }


  inputBuffer = "";
}

//EVALUATION AND FEEDBACK

async function feedback_green(message = 'correct') {
  document.getElementById('correct').textContent = message;
  hide('#incorrect');
  show('#correct');
  await sleep(1150);
  hide('#correct');
}

async function feedback_red(message = 'incorrect') {
  document.getElementById('incorrect').textContent = message;
  hide('#correct');
  show('#incorrect');
  await sleep(1150);
  hide('#incorrect');
}

function start_evaluate(guess) {
  isEvaluatingAnswer = true;
  show('.answer-evaluation');
  hide('#correct');
  show('#ev');
  document.querySelector('.correct').textContent = currentAnswer;
  document.querySelector('.guess').textContent = guess;
  console.log("in_evaluation: " + isEvaluatingAnswer);
  isHintTimeStopped = true;
  document.querySelector('.hint-text').style.display = 'none';
}

function stop_evaluate() {
  isEvaluatingAnswer = false;
  screen.textContent = '';
  hide('.answer-evaluation');
  hide('#ev',);
  console.log("in_evaluation: " + isEvaluatingAnswer);
  isHintTimeStopped = false;
  document.querySelector('.hint-text').style.display = 'block';
  loadNextQuestion();
}

//FOCUS AND TIMER CONTROL

function toggleFocus() {
  const b = document.getElementById("pause-button");
  ;
  if (isFocused) {
    stop_focus();
  }
  else {
    start_focus();
  }
}

function start_focus() {
  isFocused = true;
  focusStartTime = Date.now();
  hide(".focus-text");
  document.querySelector('.blur').classList.remove('on');
  isTimePaused = false;
  hintTimer();
  document.getElementById("pause-icon").textContent = "\u23F8";
  document.getElementById("pause-button-tooltip").textContent = "pause";

  // Focus the hidden input for mobile
  const hiddenInput = document.getElementById("hidden-input");
  hiddenInput.value = ""; // reset
  hiddenInput.focus();
}


function stop_focus() {
  if (allWordPairs.length != 0) {
    isFocused = false;
    if (focusStartTime > 0) {
      sessionTimeElapsed += Date.now() - focusStartTime;
      focusStartTime = 0;
    }
    show(".focus-text");
    document.querySelector('.blur').classList.add('on');
    isTimePaused = true;
    isHintTimeStopped = true;
    document.getElementById("pause-icon").textContent = "\u23F5";
    document.getElementById("pause-button-tooltip").textContent = "resume";
  }
}

async function hintTimer() {
  /* different from other show/hide stuff, do not remove */
  document.querySelector('.hint-text').classList.remove('show');
  let currentTime = 8;
  const thisCountdownID = ++hintTimerId;
  while (currentTime != 0 && !isHintTimeStopped && thisCountdownID === hintTimerId) {
    await sleep(1000);
    currentTime -= 1;
  }
  if (thisCountdownID === hintTimerId && !isHintTimeStopped && isFocused && !isMobile) {
    /* different from other show/hide stuff, do not remove */
    document.querySelector('.hint-text').classList.add('show');
  }
}

async function countdown(currentTime) {
  let start = 0;
  const thisCountdownID = ++countdownId;
  while (currentTime != 0 && !isTimeStopped && thisCountdownID === countdownId) {
    start = Date.now();
    document.querySelector(".time-left").textContent = timeify(currentTime);
    await sleep(1000 - Date.now() + start);
    currentTime -= 1;
    while (isTimePaused) {
      await sleep(250);
    }
  }
  if (thisCountdownID === countdownId && !isTimeStopped) {
    document.querySelector(".time-left").textContent = "0:00";
    finishExam();
  }
}

async function countup(currentTime) {
  let start = 0;
  const thisCountdownID = ++countdownId;
  while (!isTimeStopped && thisCountdownID === countdownId) {
    start = Date.now();
    document.querySelector(".time-left").textContent = timeify(currentTime);
    await sleep(1000 - Date.now() + start);
    currentTime += 1;
    while (isTimePaused) {
      await sleep(250);
    }
  }
}

//SESSION CONTROL

function new_exam() {
  enableInput(true);
  show('.stats');
  document.querySelector('.stats').style.display = "flex";
  hide('.exam-summary');
  show('.asked');
  hide('.title');
  show('.focus-text');
  hide('.answer-evaluation');
  show('#finish-button');
  show('#pause-button');
  incorrectOnly = false;
  setMode(1);
  incorrectWordSet = [];
  document.querySelector('.hint-text').style.display = "block";
}

function practice_incorrect() {

  enableInput(true);
  show('.stats');
  document.querySelector('.stats').style.display = "flex";
  hide('.exam-summary');
  show('.asked');
  hide('.title');
  show('.focus-text');
  hide('.answer-evaluation');
  show('#finish-button');
  show('#pause-button');
  incorrectOnly = false;
  isPracticingIncorrectWords = true;
  document.querySelector('.hint-text').style.display = "block";
  setMode(0);
}

function toggleSummaryView() {
  if (incorrectOnly) {
    incorrectOnly = false;

    show('.correct');
    document.getElementById('toggle-view').textContent = "show all";
  }
  else {
    incorrectOnly = true;

    hide('.correct', 0);
    document.getElementById('toggle-view').textContent = "show incorrect only";
  }
}

function finishExam() {
  enableInput(false);
  stop_focus();
  hide('.focus-text');

  hide('#finish-button');
  hide('#pause-button');
  hide('.stats');
  show('.exam-summary');
  document.querySelector('.exam-summary').style.display = "flex";
  hide('.asked');
  show('.title');
  document.querySelector('.hint-text').style.display = "none";

  const summary = document.querySelector('.summary-entry-container');
  summary.innerHTML = "";

  document.querySelector('.title').textContent = "summary";


  answerLog.forEach((entry, index) => {
    const entryDiv = document.createElement('div');
    entryDiv.className = 'summary-entry';

    if (entry.is_correct) {
      entryDiv.innerHTML = `<correct>Question ${index + 1}:</correct><br>`;
      entryDiv.classList.add('correct');
    }
    else {
      entryDiv.innerHTML = `<incorrect>Question ${index + 1}:</incorrect><br>`;
      incorrectWordSet.push({
        a: entry.question,
        b: entry.answer
      });
    }


    entryDiv.innerHTML += `
      Question: ${entry.question} <br>
      Answer: ${entry.answer}<br>
      Guess: ${entry.guess}<br>
    `;

    summary.appendChild(entryDiv);
  })

  if (incorrectWordSet.length === 0) {
    document.getElementById('practice_incorrect').style.display = 'none';
  }
  else {
    document.getElementById('practice_incorrect').style.display = 'inline-block';
  }

  let answeredCount = answerLog.length;
  currentCorrectCount = answeredCount - incorrectWordSet.length;
  document.getElementById('summary-score').textContent = currentCorrectCount + "/" + totalAnswerCount;

  if (totalAnswerCount === 0) { currentPercentage = 0; }
  else currentPercentage = Math.floor(currentCorrectCount / totalAnswerCount * 100);
  document.getElementById('summary-percent').textContent = currentPercentage + "%";

  document.getElementById('summary-time').textContent = timeify(Math.round(sessionTimeElapsed / 1000));

  document.getElementById('summary-hints').textContent = numberOfHintsUsed;

  /*
  Funkciók:
  -Rossz válaszoknál ki van jelölve a rossz rész (aláhúzás vagy piros)
  */


}

//HINT

function hint() {
  numberOfHintsUsed++;
  if (inputBuffer.length < currentAnswer.length) {
    inputBuffer += currentAnswer[inputBuffer.length];
    screen.textContent = inputBuffer;
  }
  else {
    checkanswer(inputBuffer);
  }
}

//FILE I/O

function loadFromLocalStorage() {
  let saved = localStorage.getItem("settings");
  if (saved) {
    try {
      const s = JSON.parse(saved);
      autoSubmit = s.auto_submit;
      caseSensitivity = s.case_sensitivity;
      skipEvaluation = s.skip_evaluation;
      ignoreAccents = s.ignore_accents;
      quizMode = s.quizMode;
      order = s.order;
      time = s.time;
      maxPercentage = s.max_percentage;
      colorMode = s.color_mode
      setColorMode(colorMode);
    } catch (e) {
      console.warn("Failed to load saved settings.");
    }
  }

  saved = localStorage.getItem("words");
  if (saved) {
    try {
      allWordPairs = JSON.parse(saved);
      setCurrentWords();
      setMode(quizMode);
      enableInput(true);
      isHintTimeStopped = false;
    } catch (e) {
      console.warn("Failed to load saved words.");
    }
  }

  saved = localStorage.getItem("delimiter");
  if (saved) {
    try {
      delimiter = saved;

      let box = "";

      allWordPairs.forEach((entry) => {
        box += entry.a + delimiter + entry.b + "\n";
      });
      box = box.slice(0, -1);
      document.querySelector('.editor-input-box').value = box;

      updateWordCount();
      change_delimiter(delimiter);
    } catch (e) {
      console.warn("Failed to load delimiter.")
    }
  }
}

function saveSettings() {
  const settings = {
    auto_submit: autoSubmit,
    case_sensitivity: caseSensitivity,
    skip_evaluation: skipEvaluation,
    ignore_accents: ignoreAccents,
    quizMode,
    order,
    time,
    max_percentage: maxPercentage,
    color_mode: colorMode
  };
  localStorage.setItem('settings', JSON.stringify(settings));
}

function saveWords() {
  localStorage.setItem('words', JSON.stringify(allWordPairs));
  localStorage.setItem('delimiter', delimiter);
}

document.getElementById('file-upload').addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const read = new FileReader();

  read.onload = function () {
    document.querySelector(".editor-input-box").value = read.result;
    parseInputWords(read.result);
  };

  read.readAsText(file);
});

//PAGE LOADING

window.addEventListener("beforeunload", () => {
  saveSettings();
  saveWords();
});

async function loadPage() {
  if (navigator.userAgentData) {
    isMobile = navigator.userAgentData.mobile;
  } else {
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent);
  }

  if (isMobile) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'styles/mobile.css';
    document.head.appendChild(link);
    document.querySelector('.focus-text').textContent = "click here to focus";
  }

  loadFromLocalStorage();
  setEditorPlaceholder(delimiter);
  refreshSettings();
  hide('.title', 0);
  hide('.answer-evaluation', 0);
  hide('.exam-summary', 0);
  hide('.editor', 0);
  hide('.options', 0);

  if (allWordPairs.length === 0) {
    hide(".focus-text");
    document.querySelector('.blur').classList.remove('on');

    hide('#pause-button');
    hide('#finish-button');
  }
  else {
    show(".focus-text");
    document.querySelector('.blur').classList.add('on');
  }

  await sleep(300);
  hide('.loader');
}

loadPage();