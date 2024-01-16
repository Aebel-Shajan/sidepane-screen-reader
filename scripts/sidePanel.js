import * as utils from "./utils.js"
import * as tts from "./tts.js"
import EasySpeech from "./node_modules/easy-speech/dist/EasySpeech.js"
import * as highlights from "./highlights.js";
await EasySpeech.init() // required

const elements = {
	previewTextContainer: document.querySelector("#preview-text-container"),
	previewText: document.querySelector("#preview-text"),
	clearContents: document.querySelector("#clear-contents"),
	playPause: document.querySelector("#play-pause-toggle"),
	stopButton: document.querySelector("#stop"),
	voiceSelect: document.querySelector("select")

}
let voices = tts.populateVoiceList(elements.voiceSelect, EasySpeech.voices());
let selectedVoice = voices[0];
let currentSentenceIndex = 0;
let state = "stopped"

highlights.setup(elements.previewTextContainer);

elements.clearContents.addEventListener("click", () => {
	elements.previewText.value = "";
	highlights.unhighlightText(elements.previewTextContainer);
})

elements.playPause.addEventListener("click", () => {
	switch (state) {
		case "paused":
			resumeSpeak();
			break;
		case "playing":
			pauseSpeak();
			break;
		case "stopped":
			startSpeak(0);
			break;
		default:
			state = "stopped";
			break;
	}
});

elements.stopButton.addEventListener("click", () => {
	stopSpeak();
});

elements.voiceSelect.addEventListener("change", () => {
	const selectedOption =
		elements.voiceSelect.selectedOptions[0].getAttribute("data-name");

	for (let i = 0; i < voices.length; i++) {
		if (voices[i].name === selectedOption) {
			selectedVoice = voices[i];
			break;
		}
	}
})


async function startSpeak(sentenceStartIndex) {
	function encodeHTML(str) {
		var tempDiv = document.createElement('div');
		tempDiv.textContent = str;
		return tempDiv.innerHTML;
	}

	let sentences = utils.splitTextIntoSentences(encodeHTML(elements.previewText.value), 20);
	console.log(sentences);
	let totalCharLength = 0;
	if (sentences.length && sentenceStartIndex < sentences.length) {
		utils.setButtonState(elements.playPause, "pause");
		elements.previewText.setAttribute("disabled", "disabled");
		elements.clearContents.setAttribute("disabled", "disabled");
		try {
			state = "playing"
			for (let i = 0; i < sentenceStartIndex; i++) {
				totalCharLength += sentences[i].length;
			}
			for (let sentenceIndex = sentenceStartIndex; sentenceIndex < sentences.length; sentenceIndex++) {
				currentSentenceIndex = sentenceIndex;
				const spokenSentence = sentences[sentenceIndex];
				selectPreviewText(totalCharLength, totalCharLength + spokenSentence.length);
				totalCharLength += spokenSentence.length;
				await EasySpeech.speak({
					text: spokenSentence,
					voice: selectedVoice, // optional, will use a default or fallback
					pitch: 1,
					rate: 1,
					volume: 1
				})
			}
		} catch {}
		if (state !== "paused") {
			stopSpeak();
		}
	}
}

function selectPreviewText(startIndex, endIndex) {
	highlights.highlightText(elements.previewTextContainer, startIndex, endIndex);
	elements.previewText.removeAttribute("disabled");
	// move to start pos
	elements.previewText.selectionStart = elements.previewText.selectionEnd = startIndex;
	elements.previewText.blur();
	elements.previewText.focus();
	// Disable the textarea again
	elements.previewText.setAttribute("disabled", "disabled");
}

function pauseSpeak() {
	state = "paused"
	console.log("paused")
	utils.setButtonState(elements.playPause, "play");
	EasySpeech.cancel();
}
function resumeSpeak() {
	state = "playing"
	console.log(currentSentenceIndex)
	console.log("resumed");
	utils.setButtonState(elements.playPause, "pause");
	startSpeak(currentSentenceIndex);
}

function stopSpeak() {
	state = "stopped"
	console.log("error/ended")
	utils.setButtonState(elements.playPause, "play");
	elements.previewText.removeAttribute("disabled");
	elements.clearContents.removeAttribute("disabled");
	highlights.unhighlightText(elements.previewTextContainer);
	currentSentenceIndex = 0;
	EasySpeech.cancel();
}