// Constants
const WORDS_URL = "data/words.json";
const MAX_WRONG_GUESSES = 6;
const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

// Object: holds the state and rules of one game
class HangmanGame {
	constructor(secretWord, hintText) {
		this.secretWord = secretWord.toLowerCase();
		this.hintText = hintText;
		this.guessedLetters = new Set();
		this.wrongGuessCount = 0;
	}

	hasGuessed(letter) {
		return this.guessedLetters.has(letter);
	}

	// Returns true when the letter is in the word, false when it is not
	guessLetter(letter) {
		this.guessedLetters.add(letter);

		if (this.secretWord.includes(letter)) {
			return true;
		}

		this.wrongGuessCount++;
		return false;
	}

	isWon() {
		return [...this.secretWord].every((letter) => this.guessedLetters.has(letter));
	}

	isLost() {
		return this.wrongGuessCount >= MAX_WRONG_GUESSES;
	}

	isOver() {
		return this.isWon() || this.isLost();
	}
}

// Page elements
const hangmanImage = document.getElementById("hangman-image");
const wrongCountLabel = document.getElementById("wrong-count");
const maxWrongLabel = document.getElementById("max-wrong");
const hintLabel = document.getElementById("hint-text");
const wordDisplay = document.getElementById("word-display");
const guessForm = document.getElementById("guess-form");
const guessInput = document.getElementById("guess-input");
const keyboard = document.getElementById("keyboard");
const resultBox = document.getElementById("result");
const resultMessage = document.getElementById("result-message");
const playAgainButton = document.getElementById("play-again");

let wordList = [];
let currentGame = null;

// Functions
async function loadWords() {
	const response = await fetch(WORDS_URL);

	if (!response.ok) {
		throw new Error("Could not load words: " + response.status);
	}

	wordList = await response.json();
}

function pickRandomEntry() {
	const randomIndex = Math.floor(Math.random() * wordList.length);
	return wordList[randomIndex];
}

function buildKeyboard() {
	keyboard.innerHTML = "";

	for (const letter of ALPHABET) {
		const keyButton = document.createElement("button");
		keyButton.type = "button";
		keyButton.className = "key";
		keyButton.id = "key-" + letter;
		keyButton.textContent = letter;
		keyButton.addEventListener("click", () => handleGuess(letter));
		keyboard.appendChild(keyButton);
	}
}

function renderWord(revealAll = false) {
	wordDisplay.innerHTML = "";

	for (const letter of currentGame.secretWord) {
		const slot = document.createElement("span");
		slot.className = "letter-slot";

		if (currentGame.hasGuessed(letter)) {
			slot.textContent = letter;
			slot.classList.add("is-revealed");
		} else if (revealAll) {
			slot.textContent = letter;
			slot.classList.add("is-missed");
		}

		wordDisplay.appendChild(slot);
	}
}

function renderFigure() {
	const wrongGuesses = currentGame.wrongGuessCount;
	hangmanImage.src = "images/hangman-" + wrongGuesses + ".jpg";
	hangmanImage.alt = "Hangman drawing, " + wrongGuesses + " of " + MAX_WRONG_GUESSES + " mistakes";
	wrongCountLabel.textContent = wrongGuesses;
}

// JavaScript animation: fade and slide the result box in
function animateResultBox() {
	resultBox.animate(
		[
			{ opacity: 0, transform: "translateY(16px) scale(0.95)" },
			{ opacity: 1, transform: "translateY(0) scale(1)" }
		],
		{ duration: 500, easing: "ease-out" }
	);
}

// JavaScript animation: pop the newly revealed letters
function animateRevealedLetters(letter) {
	const slots = wordDisplay.querySelectorAll(".letter-slot");

	slots.forEach((slot) => {
		if (slot.textContent === letter) {
			slot.animate(
				[
					{ transform: "scale(0.4)", opacity: 0 },
					{ transform: "scale(1.25)", opacity: 1 },
					{ transform: "scale(1)", opacity: 1 }
				],
				{ duration: 350, easing: "ease-out" }
			);
		}
	});
}

function setGuessingEnabled(isEnabled) {
	guessInput.disabled = !isEnabled;

	keyboard.querySelectorAll(".key").forEach((keyButton) => {
		const letter = keyButton.textContent;

		if (!isEnabled) {
			keyButton.disabled = true;
		} else {
			keyButton.disabled = currentGame.hasGuessed(letter);
		}
	});
}

function showResult() {
	const didWin = currentGame.isWon();

	resultBox.hidden = false;
	resultBox.classList.toggle("is-win", didWin);
	resultBox.classList.toggle("is-loss", !didWin);

	if (didWin) {
		resultMessage.textContent = "You won! The word was \"" + currentGame.secretWord + "\".";
	} else {
		resultMessage.textContent = "You lost. The word was \"" + currentGame.secretWord + "\".";
		renderWord(true);
	}

	animateResultBox();
	setGuessingEnabled(false);
}

function handleGuess(rawLetter) {
	const letter = rawLetter.toLowerCase();

	if (!currentGame || currentGame.isOver()) {
		return;
	}

	if (!ALPHABET.includes(letter) || currentGame.hasGuessed(letter)) {
		return;
	}

	const isCorrect = currentGame.guessLetter(letter);
	const keyButton = document.getElementById("key-" + letter);

	keyButton.disabled = true;
	keyButton.classList.add(isCorrect ? "is-correct" : "is-wrong");

	renderWord();
	renderFigure();

	if (isCorrect) {
		animateRevealedLetters(letter);
	}

	if (currentGame.isOver()) {
		showResult();
	}
}

function startNewGame() {
	const entry = pickRandomEntry();

	currentGame = new HangmanGame(entry.word, entry.hint);
	hintLabel.textContent = currentGame.hintText;
	maxWrongLabel.textContent = MAX_WRONG_GUESSES;
	resultBox.hidden = true;
	guessInput.value = "";

	buildKeyboard();
	renderWord();
	renderFigure();
	setGuessingEnabled(true);
	guessInput.focus();
}

// Events
guessForm.addEventListener("submit", (event) => {
	event.preventDefault();
});

guessInput.addEventListener("input", () => {
	const typedLetter = guessInput.value;
	guessInput.value = "";

	if (typedLetter) {
		handleGuess(typedLetter);
	}
});

playAgainButton.addEventListener("click", startNewGame);

// Start
loadWords()
	.then(startNewGame)
	.catch((error) => {
		hintLabel.textContent = "Sorry, the word list could not be loaded. Run this page from a web server.";
		console.error(error);
	});
