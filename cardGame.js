// I Declare War — clean demo version
// Uses https://www.deckofcardsapi.com/
// Rules: each round draws 1 card each. Tie triggers "war":
// burn 3 cards each (face-down) then draw 1 card each (face-up) to decide.

const API = "https://www.deckofcardsapi.com/api/deck";

const score1El = document.getElementById("score1");
const score2El = document.getElementById("score2");
const remainingEl = document.getElementById("remaining");

const card1Img = document.getElementById("card1");
const card2Img = document.getElementById("card2");
const label1El = document.getElementById("label1");
const label2El = document.getElementById("label2");

const statusEl = document.getElementById("status");
const drawBtn = document.getElementById("drawBtn");
const resetBtn = document.getElementById("resetBtn");

let deckId = null;
let score1 = 0;
let score2 = 0;
let gameOver = false;

init();

drawBtn.addEventListener("click", onDraw);
resetBtn.addEventListener("click", init);

async function init() {
  deckId = null;
  score1 = 0;
  score2 = 0;
  gameOver = false;

  updateScores();
  setCard(card1Img, label1El, null);
  setCard(card2Img, label2El, null);

  statusEl.textContent = "Shuffling deck…";
  drawBtn.disabled = true;

  try {
    const data = await fetchJson(`${API}/new/shuffle/?deck_count=1`);
    deckId = data.deck_id;

    remainingEl.textContent = String(data.remaining ?? 52);
    statusEl.textContent = 'Ready. Click “Draw” to start.';
    drawBtn.disabled = false;
  } catch (err) {
    statusEl.textContent = "Could not initialize deck. Try again.";
    console.error(err);
  }
}

async function onDraw() {
  if (!deckId || gameOver) return;

  drawBtn.disabled = true;

  try {
    // draw 2 cards (1 for each player)
    const round = await drawCards(2);
    remainingEl.textContent = String(round.remaining);

    const p1 = round.cards[0];
    const p2 = round.cards[1];

    setCard(card1Img, label1El, p1);
    setCard(card2Img, label2El, p2);

    const v1 = valueToNumber(p1.value);
    const v2 = valueToNumber(p2.value);

    if (v1 > v2) {
      score1 += 1;
      statusEl.textContent = "Player 1 wins the round.";
      updateScores();
    } else if (v2 > v1) {
      score2 += 1;
      statusEl.textContent = "Player 2 wins the round.";
      updateScores();
    } else {
      statusEl.textContent = "WAR! Burning 3 cards each…";
      await resolveWar();
    }

    await maybeEndGame();
  } catch (err) {
    statusEl.textContent = "Draw failed. Try again.";
    console.error(err);
  } finally {
    if (!gameOver) drawBtn.disabled = false;
  }
}

async function resolveWar() {
  // Need up to 8 cards total for a war resolution:
  // burn 3 + flip 1 for each player = 4 each
  const remaining = await getRemaining();
  if (remaining < 8) {
    // Not enough cards to do a full war: end game based on score so far.
    statusEl.textContent =
      "Not enough cards left to complete WAR. Ending game…";
    return;
  }

  // Burn 6 cards (3 each). They do not affect score directly.
  await drawCards(6);

  // Flip 2 cards (one each) to decide war
  const warFlip = await drawCards(2);
  remainingEl.textContent = String(warFlip.remaining);

  const p1 = warFlip.cards[0];
  const p2 = warFlip.cards[1];

  setCard(card1Img, label1El, p1);
  setCard(card2Img, label2El, p2);

  const v1 = valueToNumber(p1.value);
  const v2 = valueToNumber(p2.value);

  if (v1 > v2) {
    score1 += 2; // war win feels bigger than a normal round
    statusEl.textContent = "Player 1 wins the WAR (+2).";
    updateScores();
  } else if (v2 > v1) {
    score2 += 2;
    statusEl.textContent = "Player 2 wins the WAR (+2).";
    updateScores();
  } else {
    // war again!
    statusEl.textContent = "Another tie… WAR continues!";
    await resolveWar();
  }
}

async function maybeEndGame() {
  const remaining = await getRemaining();

  if (remaining === 0) {
    gameOver = true;
    drawBtn.disabled = true;

    if (score1 > score2) statusEl.textContent = "Game over — Player 1 wins!";
    else if (score2 > score1) statusEl.textContent = "Game over — Player 2 wins!";
    else statusEl.textContent = "Game over — It’s a tie!";
  }
}

function updateScores() {
  score1El.textContent = String(score1);
  score2El.textContent = String(score2);
}

function setCard(imgEl, labelEl, card) {
  if (!card) {
    imgEl.style.display = "none";
    imgEl.removeAttribute("src");
    imgEl.alt = "No card drawn yet";
    labelEl.textContent = "—";
    return;
  }

  imgEl.src = card.image;
  imgEl.alt = `${card.value} of ${card.suit}`;
  imgEl.style.display = "block";
  labelEl.textContent = `${card.value} of ${capitalize(card.suit)}`;
}

function valueToNumber(value) {
  switch (value) {
    case "ACE":
      return 14;
    case "KING":
      return 13;
    case "QUEEN":
      return 12;
    case "JACK":
      return 11;
    default:
      return Number(value);
  }
}

function capitalize(s) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function drawCards(count) {
  const url = `${API}/${deckId}/draw/?count=${count}`;
  const data = await fetchJson(url);

  // If deck is exhausted unexpectedly, end game gracefully
  if (!data.success) throw new Error("Deck draw unsuccessful");
  if (Array.isArray(data.cards) && data.cards.length < count) {
    // not enough cards to draw — treat as end
    return { ...data, remaining: data.remaining ?? 0 };
  }

  return data;
}

async function getRemaining() {
  // Draw response includes remaining, but war burn draws also change it.
  // This endpoint returns current deck state.
  const data = await fetchJson(`${API}/${deckId}`);
  return Number(data.remaining ?? 0);
}
