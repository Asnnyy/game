import { Input } from "./input.js";
import { Game } from "./Game.js";

const canvas = document.querySelector("#game");
const overlay = document.querySelector("#overlay");
const overlayKicker = document.querySelector("#overlay-kicker");
const overlayTitle = document.querySelector("#overlay-title");
const overlayText = document.querySelector("#overlay-text");
const startBtn = document.querySelector("#start-btn");
const pauseBtn = document.querySelector("#pause-btn");
const restartBtn = document.querySelector("#restart-btn");
const scoreEl = document.querySelector("#score");
const healthEl = document.querySelector("#health");
const bestEl = document.querySelector("#best");

const input = new Input(canvas);
const game = new Game(canvas, input, updateUI);

function updateUI(s) {
  scoreEl.textContent = `${s.score} / ${s.total}`;
  healthEl.textContent = `${"♥ ".repeat(s.health)}${"♡ ".repeat(3-s.health)}`.trim();
  bestEl.textContent = s.best;
  pauseBtn.disabled = !["running", "paused"].includes(s.state);
  pauseBtn.textContent = s.state === "paused" ? "Продолжить" : "Пауза";

  if (s.state === "ready") {
    overlay.classList.remove("hidden");
    overlayKicker.textContent = "ТВОЁ ПРИКЛЮЧЕНИЕ НАЧИНАЕТСЯ";
    overlayTitle.textContent = "Лунная библиотека";
    overlayText.textContent = "Собери все три предмета и доберись до светящегося портала. Книги и коты безопасны, а призраки отнимают здоровье.";
    startBtn.textContent = "Начать игру";
  } else if (s.state === "paused") {
    overlay.classList.remove("hidden");
    overlayKicker.textContent = "МОЖНО НЕМНОГО ОТДОХНУТЬ";
    overlayTitle.textContent = "Пауза";
    overlayText.textContent = "Ведьмочка подождёт. Нажми кнопку, чтобы продолжить приключение.";
    startBtn.textContent = "Продолжить";
  } else if (s.state === "won") {
    overlay.classList.remove("hidden");
    overlayKicker.textContent = "ЗАДАНИЕ ВЫПОЛНЕНО";
    overlayTitle.textContent = "Ты нашла выход!";
    overlayText.textContent = `Собрано предметов: ${s.score} из ${s.total}. Призраки остались позади, а лунная библиотека спасена.`;
    startBtn.textContent = "Играть ещё";
  } else if (s.state === "lost") {
    overlay.classList.remove("hidden");
    overlayKicker.textContent = "ПРИКЛЮЧЕНИЕ ПРЕРВАНО";
    overlayTitle.textContent = "Нужно попробовать ещё";
    overlayText.textContent = "Призраки истощили силы ведьмочки. Перезапусти игру и попробуй пролететь над ними.";
    startBtn.textContent = "Попробовать снова";
  } else {
    overlay.classList.add("hidden");
  }
}

startBtn.addEventListener("click", () => game.start());
pauseBtn.addEventListener("click", () => game.togglePause());
restartBtn.addEventListener("click", () => game.restart());

document.addEventListener("visibilitychange", () => {
  if (document.hidden && game.state === "running") game.togglePause();
});
window.addEventListener("keyup", (event) => {
  if (event.key === "Escape" && game.state === "paused") {
    // Кнопка «Продолжить» остаётся основным способом возобновления.
  }
});
updateUI(game.getStatus());
