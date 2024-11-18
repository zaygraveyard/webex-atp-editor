const body = document.body;
let idx = 0;
let openedFileName;

function getTemplate(template) {
  const fragment = template.content.cloneNode(true);
  for (const line of fragment.querySelectorAll(
    "x-question-title, x-add-answer, x-answer"
  )) {
    line.insertBefore(getTemplate(actionsTemplate), line.firstElementChild);
  }
  return fragment.childElementCount === 1
    ? fragment.firstElementChild
    : fragment;
}
function select(node) {
  const range = document.createRange();
  range.selectNodeContents(node);
  const sel = getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}
function previousOf(node, selector) {
  while (node) {
    node = node.previousElementSibling;
    if (node && node.matches(selector)) return node;
  }
  return null;
}
function nextOf(node, selector) {
  while (node) {
    node = node.nextElementSibling;
    if (node && node.matches(selector)) return node;
  }
  return null;
}

let filePickerInput = null;
function filePicker(accept, done) {
  if (!filePickerInput) {
    filePickerInput = document.createElement("input");
    filePickerInput.type = "file";
    filePickerInput.style.display = "none";
    body.appendChild(filePickerInput);
  }
  if (accept) {
    filePickerInput.setAttribute("accept", accept);
  } else {
    filePickerInput.removeAttribute("accept");
  }
  filePickerInput.onchange = function (event) {
    done(this.files);
    this.remove();
    filePickerInput = null;
  };
  filePickerInput.click();
}

function newQuestion(type, title = "Your Question", answers = []) {
  let question;
  switch (type) {
    case "mcone":
    case "mcmany":
      question = getTemplate(mconeTemplate);
      question.dataset.id = "choice-group-" + idx++;
      if (type === "mcmany") allowMany(question);
      break;
    case "text":
      question = getTemplate(textTemplate);
  }
  question.querySelector("x-question-title [contenteditable]").textContent =
    title;
  if (!Array.isArray(answers)) answers = [answers];
  for (const answer of answers) {
    if (typeof answer === "string") answer = { correct: true, text: answer };
    addAnswer(question, answer.correct, answer.text);
  }
  return question;
}
function newAnswer(question, correct = false, text = "Your Answer") {
  const type = question.dataset.type;
  let answer;
  switch (type) {
    case "mcone":
    case "mcmany":
      answer = getTemplate(mconeAnswerTemplate);
      const input = answer.querySelector("input");
      input.name = question.dataset.id;
      input.type = type === "mcone" ? "radio" : "checkbox";
      input.checked = correct;
      break;
    case "text":
      answer = getTemplate(textAnswerTemplate);
  }
  answer.querySelector("[contenteditable]").textContent = text;
  return answer;
}

function allowOne(question) {
  question.dataset.type = "mcone";
  for (const input of question.querySelectorAll("input")) {
    input.type = "radio";
  }
  return question;
}
function allowMany(question) {
  question.dataset.type = "mcmany";
  for (const input of question.querySelectorAll("input")) {
    input.type = "checkbox";
  }
  return question;
}

function getQuestionTitle(question) {
  return question.querySelector("x-question-title [contenteditable]")
    .textContent;
}
function addQuestionBefore(type, nextQuestion) {
  const question = newQuestion(type);
  if (type === "mcone" || type === "mcmany") {
    addAnswer(question);
    addAnswer(question);
  }
  body.insertBefore(question, nextQuestion);
  body.insertBefore(getTemplate(addQuestionTemplate), nextQuestion);
  return question;
}
function moveQuestionUp(question) {
  const prevQuestion = previousOf(question, "x-question");
  if (prevQuestion) {
    const prevActions = previousOf(question, "x-add-question");
    question.parentNode.insertBefore(prevQuestion, question.nextElementSibling);
    question.parentNode.insertBefore(prevActions, prevQuestion);
  }
}
function moveQuestionDown(question) {
  const nextQuestion = nextOf(question, "x-question");
  if (nextQuestion) {
    const nextActions = nextOf(question, "x-add-question");
    question.parentNode.insertBefore(nextQuestion, question);
    question.parentNode.insertBefore(nextActions, question);
  }
}
function deleteQuestion(question) {
  nextOf(question, "x-add-question").remove();
  question.remove();
}

function addAnswer(question, correct = false, text = "Your Answer") {
  if (question.dataset.type === "text" && question.querySelector("x-answer")) {
    return null;
  }

  const answer = newAnswer(question, correct, text);
  question.insertBefore(answer, question.lastElementChild);
  return answer;
}
function getAnswerChecked(answer) {
  const input = answer.querySelector("input");
  return input ? input.checked : true;
}
function getAnswerText(answer) {
  return answer.querySelector("[contenteditable]").textContent;
}
function moveAnswerUp(answer) {
  const prevAnswer = previousOf(answer, "x-answer");
  if (prevAnswer) {
    answer.parentNode.insertBefore(prevAnswer, answer.nextElementSibling);
  }
}
function moveAnswerDown(answer) {
  const nextAnswer = nextOf(answer, "x-answer");
  if (nextAnswer) {
    answer.parentNode.insertBefore(nextAnswer, answer);
  }
}
function deleteAnswer(answer) {
  answer.remove();
}

function moveUp(node) {
  const focus = document.activeElement;
  switch (node.tagName.toLowerCase()) {
    case "x-question":
    case "x-question-title":
      moveQuestionUp(node.closest("x-question"));
      break;
    case "x-answer":
      moveAnswerUp(node);
      break;
  }
  if (focus) focus.focus();
}
function moveDown(node) {
  const focus = document.activeElement;
  switch (node.tagName.toLowerCase()) {
    case "x-question":
    case "x-question-title":
      moveQuestionDown(node.closest("x-question"));
      break;
    case "x-answer":
      moveAnswerDown(node);
      break;
  }
  if (focus) focus.focus();
}
function deleteItem(node) {
  const question = node.closest("x-question");
  switch (node.tagName.toLowerCase()) {
    case "x-question":
    case "x-question-title": {
      const focus =
        nextOf(question, "x-question") ||
        previousOf(question, "x-question") ||
        question.previousElementSibling.querySelector(
          "[data-type=" +
            (question.dataset.type === "text" ? "text" : "mcone") +
            "]"
        );
      deleteQuestion(question);
      focus.focus();
      break;
    }
    case "x-answer":
      deleteAnswer(node.closest("x-answer"));
      question.querySelector(".add-choice, .add-answer").focus();
      break;
  }
}
function clear() {
  for (const e of body.querySelectorAll(
    "x-question, x-add-question:not(:first-of-type)"
  )) {
    e.remove();
  }
}

function loadATP(string) {
  string = string.replace(
    /(<ANSWER)([^>]*>[^<]*)(<\/ANSWER>)/i,
    '$1 MARKEDCORRECT="true"$2$3'
  );
  const parser = new DOMParser();
  const atp = parser.parseFromString(string, "application/xml");
  const poll = atp.documentElement;

  if (poll.tagName === "parsererror") {
    throw new Error(poll.textContent);
  }

  clear();
  anonymous.checked = poll.getAttribute("TYPE") === "anonymous";
  noanswer.checked = poll.getAttribute("NOANSWER") !== "no";
  timer.checked = poll.getAttribute("SHOWTIMER") !== "no";
  const alarm = poll.getAttribute("ALARM");
  if (alarm && alarm.indexOf(":") !== -1) {
    const [hours, minutes] = alarm.split(":").map((v) => parseInt(v, 10));
    timerHours.value = hours.toString().padStart(2, 0);
    timerMinutes.value = minutes.toString().padStart(2, 0);
  } else {
    timerHours.value = "00";
    timerMinutes.value = "00";
  }
  for (const q of poll.querySelectorAll("QUESTION")) {
    const type = q.getAttribute("TYPE").toLowerCase();
    const title = q.getAttribute("TITLE");
    const question = newQuestion(type, title);

    for (const a of q.querySelectorAll("ANSWER")) {
      addAnswer(
        question,
        a.getAttribute("ISCORRECT").toLowerCase() === "true",
        a.textContent
      );
    }

    body.append(question);
    body.append(getTemplate(addQuestionTemplate));
  }
}
async function loadATPFile(file) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onerror = (event) => {
      reject(fileReader.error);
    };
    fileReader.onload = (event) => {
      try {
        resolve(loadATP(fileReader.result));
      } catch (error) {
        reject(error);
      }
    };
    openedFileName = file.name;
    fileReader.readAsText(file);
  });
}

function getATP() {
  const atp = document.implementation.createDocument(null, "POLL", null);
  const poll = atp.createElement("POLL");
  poll.setAttribute("TYPE", anonymous.checked ? "anonymous" : "named");
  poll.setAttribute("SHOWTIMER", timer.checked ? "yes" : "no");
  poll.setAttribute("ALARM", timerHours.value + ":" + timerMinutes.value);
  poll.setAttribute("NOANSWER", noanswer.checked ? "yes" : "no");
  poll.appendChild(atp.createTextNode("\n\n"));

  for (const question of body.querySelectorAll("x-question")) {
    const q = poll.appendChild(atp.createElement("QUESTION"));
    q.setAttribute("TYPE", question.dataset.type);
    q.setAttribute("TITLE", getQuestionTitle(question));

    for (const answer of question.querySelectorAll("x-answer")) {
      q.appendChild(atp.createTextNode("\n  "));
      const a = q.appendChild(atp.createElement("ANSWER"));
      a.setAttribute("ISCORRECT", getAnswerChecked(answer));
      a.textContent = getAnswerText(answer);
    }
    q.appendChild(atp.createTextNode("\n"));
    poll.appendChild(atp.createTextNode("\n\n"));
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n${poll.outerHTML}`;
}

body.append(getTemplate(addQuestionTemplate));

{
  function saveInSession() {
    try {
      sessionStorage.setItem('lastATP', getATP());
      sessionStorage.setItem('lastATPName', openedFileName);
    } catch (error) {
      /*ignore*/
    }
  }
  function loadFromSession() {
    try {
      loadATP(sessionStorage.getItem('lastATP'));
      openedFileName = sessionStorage.getItem('lastATPName');
    } catch (error) {
      /*ignore*/
    }
  }
  addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      saveInSession();
    }
  });
  addEventListener('pagehide', saveInSession);
  loadFromSession();
}
{
  let uncheckTimeout;
  addEventListener("change", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.type === "radio") {
      clearTimeout(uncheckTimeout);
    }
  });
  addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.type === "radio") {
      uncheckTimeout = setTimeout(() => (target.checked = false), 0);
    }
  });
}
addEventListener("focusout", (event) => {
  const ce = event.target.closest("[contenteditable]");
  if (ce) {
    ce.textContent = ce.textContent;
  }
});
addEventListener("keydown", (event) => {
  const tag = event.target.tagName.toLowerCase();
  if (tag === "x-question" || tag === "x-answer") {
    switch (event.key) {
      case "ArrowDown":
        if (event.shiftKey) {
          moveDown(event.target);
        } else {
          const next = nextOf(event.target, tag);
          if (next) next.focus();
        }
        break;
      case "ArrowUp":
        if (event.shiftKey) {
          moveUp(event.target);
        } else {
          const previous = previousOf(event.target, tag);
          if (previous) previous.focus();
        }
        break;
      case "Enter":
        select(event.target.querySelector("[contenteditable]"));
        break;
      case "Backspace":
      case "Delete":
        deleteItem(event.target);
        break;
      default:
        return;
    }
  } else if (
    event.key === "Enter" &&
    event.target.closest("[contenteditable]")
  ) {
    event.target.closest("x-answer, x-question").focus();
  } else {
    return;
  }

  event.preventDefault();
});
addEventListener("click", (event) => {
  const target = event.target;
  switch (target.className) {
    case "add-question":
      select(
        addQuestionBefore(
          target.dataset.type,
          target.parentNode.nextElementSibling
        ).querySelector("x-question-title [contenteditable]")
      );
      break;
    case "add-answer":
      select(
        addAnswer(target.closest("x-question")).querySelector(
          "[contenteditable]"
        )
      );
      break;
    case "up":
      moveUp(target.parentNode);
      break;
    case "down":
      moveDown(target.parentNode);
      break;
    case "delete":
      deleteItem(target.parentNode);
      break;
    case "allow-one":
      allowOne(target.closest("x-question"));
      break;
    case "allow-many":
      allowMany(target.closest("x-question"));
      break;
  }
});

async function openATPFile(file) {
  try {
    await loadATPFile(file);
  } catch (error) {
    alert(error.message);
  }
}
newAtp.onclick = () => {
  clear();
};
openAtp.onclick = () => {
  filePicker(".atp", (files) => openATPFile(files[0]));
};
saveAtp.onclick = () => {
  const atp = getATP();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([atp], { type: "application/xml" }));
  a.download = openedFileName || "poll.atp";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

{
  let count = 0;

  addEventListener('dragenter', (event) => {
    event.preventDefault();

    if (count++ === 0) {
      dropTarget.classList.add('is-over');
    }
  });
  addEventListener('dragover', (event) => {
    event.preventDefault();
  });
  addEventListener('dragleave', (event) => {
    event.preventDefault();

    if (--count === 0) {
      dropTarget.classList.remove('is-over');
    }
  });
  addEventListener('drop', (event) => {
    event.preventDefault();

    count = 0;
    dropTarget.classList.remove('is-over');

    const dt = event.dataTransfer;

    if (dt && dt.items) {
      for (const item of dt.items) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file && file.name.toLowerCase().endsWith('.atp')) {
            return openATPFile(file);
          }
        }
      }
    } else if (dt && dt.files) {
      for (const file of dt.files) {
        if (file && file.name.toLowerCase().endsWith('.atp')) {
          return openATPFile(file);
        }
      }
    }
  });
}
