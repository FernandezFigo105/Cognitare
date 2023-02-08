"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.autoCompleteSave = void 0
exports.savedLines = void 0

const config_1 = require("../config")
const vscode_1 = require("vscode")
const node_fetch_1 = require("node-fetch")
/**
 *
 * @param {string} input
 * @returns {SearchMatchResult | undefined}
 */
var checkTime
var lastSentence = ""

async function autoCompleteSave(text, obj, userId, languageId) {
	const promise = new Promise(async (resolve, reject) => {
		if (text.length) {
			var addToStorage = false
			var acceptType = ''
			clearInterval(checkTime)

			var count = 0
			var sentence = ""
			for (const k in obj) {
				var lastLine = text
				if (text.includes('\n')) lastLine = text.split('\n')[text.split('\n').length-1].trim()
				if (k.startsWith(lastLine)) {
					if (count === 0) {
						count = obj[k].uses
						// sentence = k
					} else {
						if (obj[k].uses > count) {
							count = obj[k].uses
							// sentence = k
						}
					}
				}
			}
			if (sentence) {
				text = lastLine
				acceptType = 'Saved Line Or Snippet'
			}
			var lastLine = text
			if (text.includes('\n')) lastLine = text.split('\n')[text.split('\n').length-1].trim()
			if (lastLine.includes('?')==false && text.length>10){
				var result = {'response': ''}
				try{
					const response = await (0, node_fetch_1.default)('https://www.useblackbox.io/suggest', {
						method: 'POST',
						body: JSON.stringify({
							inputCode: text,
							source: "visual studio",
							userId: userId,
							languageId: languageId,
							when: Date.now()/1000.0
						}),
						headers: {
							'Content-Type': 'application/json',
							Accept: 'application/json',
						},
					});
					result = await response.json();
				}catch(e){}
				lastLine = text.split('\n')[text.split('\n').length-1].trim()
				addToStorage = true
				try{
					sentence = result['response']
					sentence = sentence.trim();
					acceptType = 'Code Complete'
				}catch(e){}
			}
			lastSentence = text
			if (sentence) {
				resolve({
					complete: sentence,
					save: false,
					acceptType: acceptType,
					line: lastLine
				})
			} else {
				resolve({
					complete: false,
					save: false,
					acceptType: ''
				})
			}
		} else {
			addToStorage = false
			if (obj[lastSentence] === undefined) {
				addToStorage = true
			}
			resolve({
				complete: false,
				save: false,
				line: lastSentence,
				acceptType: ''
			})
		}
	})
	return promise
}
async function savedLines(text, obj) {
	const promise = new Promise(async (resolve, reject) => {
		text = text.trim()
		if (text.length > 10) {
			lastSentence = text
			var sentence = ""
			var count = 0

			for (const k in obj) {
				var lastLine = text
				if (text.includes("\n"))
					lastLine = text
						.split("\n")
						[text.split("\n").length - 1].trim()
				if (k.startsWith(lastLine)) {
					if (count === 0) {
						count = obj[k].uses
						sentence = k
					} else {
						if (obj[k].uses > count) {
							count = obj[k].uses
							sentence = k
						}
					}
				}
			}

			if (sentence.length) {
				resolve({
					complete: sentence.slice(text.length, sentence.length),
					save: false
				})
			} else {
				resolve({
					complete: false,
					save: false
				})
			}
		} else {
			var addToStorage = false
			if (
				obj[lastSentence] === undefined &&
				lastSentence.trim().length > 0
			) {
				addToStorage = true
			}
			resolve({
				complete: false,
				save: addToStorage,
				line: lastSentence
			})
		}
	})
	return promise
}
exports.autoCompleteSave = autoCompleteSave
exports.savedLines = savedLines