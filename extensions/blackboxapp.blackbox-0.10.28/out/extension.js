"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.activate = void 0
const vscode = require("vscode")
const search_1 = require("./utils/search")
const matchSearchPhrase_1 = require("./utils/matchSearchPhrase")
const autoCompletePhrase_1 = require("./utils/autoCompletePhrase")
const uuid = require("uuid").v4
const node_fetch_1 = require("node-fetch")
const open = require("open")
const { io } = require("socket.io-client")
const path = require("path")
const mainSite = "https://www.blackbox-ai.com"
const fs = require("fs")
let socket
function activate(_) {
	var EXTENSION_STATUS = _.globalState.get("extensionStatus")
	_.globalState.update("chatStatus", false)
	var chatStatus = _.globalState.get("chatStatus")
	if (chatStatus == undefined) _.globalState.update("chatStatus", false)
	if (EXTENSION_STATUS === undefined) {
		EXTENSION_STATUS = false
	}
	var userId = _.globalState.get("userId")
	var isLoading = false
	if (userId == undefined) {
		userId = uuid()
		_.globalState.update("userId", JSON.stringify(userId))
		var randomPercent = Math.round(Math.random() * 100)
		if (randomPercent <= 0) {
			selectionFct("Notification Received")
			vscode.window
				.showInformationMessage(
					"New Release: Enable Blackbox Autcomplete",
					...["Enable", "Cancel"]
				)
				.then(async (option) => {
					if (option === "Enable") {
						_.globalState.update("extensionStatus", true)
						EXTENSION_STATUS = true
						vscode.window.showInformationMessage(
							"Blackbox Autocomplete Enabled"
						)
						selectionFct("Autcomplete Enabled Notification")
						open("https://useblackbox.io/pricing?ref=vscode")
					}
				})
		}
		openGettingStartedWebview()
	}
	let gloablUserId = userId
	let globalPrompt = ''
	let globalSuggestion = ''
	let globalLanguageId = ''
	// else{ userId = JSON.parse(userId) }
	var stoppedTyping
	var timeToWait = 600 * 1000
	var acceptType = ""

	const styles = vscode.Uri.file(
		path.join(_.extensionPath, "out/css/styles.css")
	)
	const codemirrorStyles = vscode.Uri.file(
		path.join(_.extensionPath, "out/css/codemirror.css")
	)
	const codemirrorJs = vscode.Uri.file(
		path.join(_.extensionPath, "out/js/codemirror.js")
	)
	const codemirrorModeJs = vscode.Uri.file(
		path.join(_.extensionPath, "out/mode/javascript.js")
	)
	const codemirrorModeClike = vscode.Uri.file(
		path.join(_.extensionPath, "out/mode/clike.js")
	)
	const codemirrorModeCss = vscode.Uri.file(
		path.join(_.extensionPath, "out/mode/css.js")
	)
	const codemirrorModeHtmlMixed = vscode.Uri.file(
		path.join(_.extensionPath, "out/mode/htmlmixed.js")
	)
	const codemirrorModePhp = vscode.Uri.file(
		path.join(_.extensionPath, "out/mode/php.js")
	)
	const codemirrorModeSimple = vscode.Uri.file(
		path.join(_.extensionPath, "out/mode/simple.js")
	)
	const codemirrorModeXml = vscode.Uri.file(
		path.join(_.extensionPath, "out/mode/xml.js")
	)
	const codeMirrorSearchCursor = vscode.Uri.file(
		path.join(_.extensionPath, "out/js/searchcursor.js")
	)
	const codemirrorModePy = vscode.Uri.file(
		path.join(_.extensionPath, "out/mode/python.js")
	)
	const codemirrorTheme = vscode.Uri.file(
		path.join(_.extensionPath, "out/theme/darcula.css")
	)
	const loaderImg = vscode.Uri.file(
		path.join(_.extensionPath, "out/imgs/loader-dots.svg")
	)
	const searchIcon = vscode.Uri.file(
		path.join(_.extensionPath, "out/imgs/search-icon.png")
	)

	const blackboxLogo = vscode.Uri.file(
		path.join(_.extensionPath, "out/imgs/blackbox-logo.png")
	)

	var stylesSrc
	var codemirrorStylesSrc
	var codemirrorJsSrc
	var codemirrorModeJsSrc
	var codemirrorModePySrc
	var codemirrorModeClikeSrc
	var codemirrorModeCssSrc
	var codemirrorModeHtmlMixedSrc
	var codemirrorModePhpSrc
	var codemirrorModeSimpleSrc
	var codemirrorModeXmlSrc
	var codemirrorThemeSrc
	var codeMirrorSearchCursorSrc
	var loaderImgSrc
	var searchIconSrc
	var blackboxLogoSrc

	var roomId = null
	const provider = {
		provideInlineCompletionItems: async (
			document,
			position,
			context,
			token
		) => {
			clearTimeout(stoppedTyping)
			var textBeforeCursor = document.getText(
				new vscode.Range(position.with(undefined, 0), position)
			)
			timeToWait = 600 * 1000
			const currTextBeforeCursor = textBeforeCursor
			var oldArr = _.globalState.get("savedLines")
			if (oldArr === undefined) oldArr = {}
			else oldArr = JSON.parse(oldArr)
			var saveLine = { save: false, complete: false }
			saveLine = await (0, autoCompletePhrase_1.savedLines)(
				currTextBeforeCursor,
				oldArr
			)
			if (saveLine.save) {
				const newArr = { ...oldArr }
				const newTime = new Date().getTime()
				newArr[`${saveLine.line}`] = {
					uses: 1,
					lastUsed: newTime,
					addedAt: newTime
				}
				_.globalState.update("savedLines", JSON.stringify(newArr))
				selectionFct("Autcomplete Saved Line")
			} else if (saveLine.complete) timeToWait = 0
			if (
				textBeforeCursor.includes("?") ||
				textBeforeCursor.trim().length === 0
			)
				timeToWait = 0
			return new Promise((resolve, reject) => {
				stoppedTyping = setTimeout(async () => {
					var textBeforeCursor = document.getText(
						new vscode.Range(position.with(undefined, 0), position)
					)
					const editor = vscode.window.activeTextEditor
					var languageId =
						vscode.window.activeTextEditor.document.languageId
					const cursorPosition = editor.selection.active
					var threeLinesBefore = 0
					for (var i = 0; i < 10; i++) {
						if (cursorPosition.line - i >= 0)
							threeLinesBefore = cursorPosition.line - i
					}
					var selection = new vscode.Selection(
						threeLinesBefore,
						0,
						cursorPosition.line,
						cursorPosition.character
					)
					var textBefore = document.getText(selection)
					textBeforeCursor = textBefore
					textBeforeCursor = textBeforeCursor.trim()
					var oldArr = _.globalState.get("savedLines") //filling the variable
					if (oldArr === undefined) {
						oldArr = {}
					} else {
						oldArr = JSON.parse(oldArr)
					}
					var lineBeforeCursor = document.getText(
						new vscode.Range(position.with(undefined, 0), position)
					)
					const match = (0, matchSearchPhrase_1.matchSearchPhrase)(
						lineBeforeCursor
					)
					let items = []
					if (EXTENSION_STATUS && isLoading == false) {
						if (
							saveLine.complete !== false &&
							currTextBeforeCursor.trim().length != 0
						) {
							try {
								var rs = {
									results: [{ code: saveLine.complete }]
								}
								if (rs) {
									items = rs.results.map((item) => {
										var output = item.code
										if (item.code.includes("\n")) {
											output = `${item.code}`
										}
										selectionFct("Suggestion Received SL")
										return {
											text: output,
											insertText: output,
											range: new vscode.Range(
												position.translate(
													0,
													output.length
												),
												position
											)
										}
									})
								}
							} catch (err) {
								vscode.window.showErrorMessage(err.toString())
							}
						} else {
							isLoading = true
							vscode.window.setStatusBarMessage(
								`Blackbox Searching...`
							)
							var processText = await (0,
							autoCompletePhrase_1.autoCompleteSave)(
								textBeforeCursor,
								oldArr,
								gloablUserId,
								languageId
							)
							isLoading = false
							globalPrompt = textBeforeCursor
							globalLanguageId = languageId
							vscode.window.setStatusBarMessage(`Blackbox`)
							//console.log(processText)
							if (processText.save) {
								const newArr = { ...oldArr }
								const newTime = new Date().getTime()
								newArr[`${processText.line}`] = {
									uses: 1,
									lastUsed: newTime,
									addedAt: newTime
								}
								_.globalState.update(
									"savedLines",
									JSON.stringify(newArr)
								)
								selectionFct("Autcomplete Saved Line")
							}
							if (processText.complete) {
								try {
									var rs = {
										results: [
											{ code: processText.complete }
										]
									}
									if (rs) {
										items = rs.results.map((item) => {
											var output = item.code
											if (item.code.includes("\n")) {
												output = `${item.code}`
											}
											selectionFct(
												"Suggestion Received CC"
											)
											acceptType = processText.acceptType
											globalSuggestion = output
											return {
												text: output,
												insertText: output,
												range: new vscode.Range(
													position.translate(
														0,
														output.length
													),
													position
												)
											}
										})
									}
								} catch (err) {}
							}
						}
					}
					if (match) {
						if (match.searchPhrase.length < 150) {
							let rs
							try {
								rs = await (0, search_1.search)(
									match.searchPhrase,
									userId
								)
								if (rs) {
									items = rs.results.map((item) => {
										const output = `\n${item.code}`
										acceptType = "Search"
										return {
											text: output,
											insertText: output,
											range: new vscode.Range(
												position.translate(
													0,
													output.length
												),
												position
											)
										}
									})
								}
							} catch (err) {
								vscode.window.showErrorMessage(err.toString())
							}
						}
					}
					resolve({ items })
				}, timeToWait)
			})
		}
	}
	var webViewProvider = {
		resolveWebviewView: async function (thisWebview) {
			try {
				thisWebview.webview.options = {
					enableScripts: true
				}
				// vscode.commands.registerCommand( "extension.enableChat", () => {
				// 	_.globalState.update("chatStatus", true)
				// 	thisWebview.webview.html = getWebViewContent('chat')
				// 	// loginOrSignup()
				// 	if (socket == undefined) createSocketConnection()
				// })
				// vscode.commands.registerCommand( "extension.disableChat", () => {
				// 	_.globalState.update("chatStatus", false)
				// 	thisWebview.webview.html = getWebViewContent('onboarding')
				// 	selectionFct('Disbale Chat')
				// })

				stylesSrc = thisWebview.webview.asWebviewUri(styles)
				let chatEnabled = _.globalState.get("chatStatus")
				let pageView = "onboarding"
				if (chatEnabled) {
					pageView = "chat"
					createSocketConnection()
				}
				thisWebview.webview.html = getWebViewContent(pageView)

				var allState = {
					me: { username: null },
					activeChat: null,
					chats: {}
				}
				thisWebview.webview.onDidReceiveMessage(async (data) => {
					// console.log("out webview: ")
					// console.log(data)
					if (data.command) {
						if (data.command === "sendMessage") {
							const message = data.message
							const parentId = data.parentId
							let msgId = data.msgId
							addToRoomMessages(
								allState.activeChat,
								allState.me["username"],
								"message",
								message,
								data.time,
								msgId,
								parentId
							)
							socket.emit("sendVscodeMessage", {
								roomId: allState.activeChat,
								message,
								from: allState.me["username"],
								time: data.time,
								msgId,
								parentId
							})
						} else if (data.command === "connectToRoom") {
							const conRoom = data.message
							socket.emit("connectToRoom", {
								conRoom,
								userId
							})
						} else if (data.command === "disconnectFromRoom") {
							socket.emit("disconnectFromRoom", {
								roomId: allState.activeChat,
								userId
							})
							delete allState.chats[allState.activeChat]
							setRoomAsActive(null)
							updateLobby()
						} else if (data.command === "loginUser") {
							open(`${mainSite}/signin?vsCode=${userId}`)
						} else if (data.command === "createNewRoom") {
							var objToSend = { userId }
							if (data.roomId) {
								objToSend["roomId"] = data.roomId
							}
							createChat(objToSend)
						} else if (data.command === "init") {
							initState()
						} else if (data.command === "getUserName") {
							if (!allState.me["username"]) {
								socket.emit("getUserName", { userId })
							} else {
								postMessage({
									command: "setUserName",
									username: allState.me["username"]
								})
							}
						} else if (data.command === "changeActiveChat") {
							setRoomAsActive(data.roomId)
						} else if (data.command === "removeBadge") {
							setRoomBadge(data.roomId, 0)
						} else if (data.command === "changeRoomStatus") {
							socket.emit("changeRoomStatus", {
								roomId: allState.activeChat,
								userId
							})
						} else if (data.command === "inviteUser") {
							socket.emit("inviteUser", {
								user: data.user,
								roomId: allState.activeChat,
								userId
							})
						} else if (data.command === "showChat") {
							showChat(data.roomId)
						} else if (data.command === "showThread") {
							showThread(data.threadId, data.roomId)
						} else if (data.command == "search")
							openGettingStartedWebview()
						else if (data.command == "refer")
							open(
								"https://mail.google.com/mail/u/0/?ui=2&tf=cm&fs=1&to=&su=Checkout+Blackbox+VSCode+Extension&body=%0D%0AHi+I+want+to+share+with+you+this+awesome+VS+Code+extension+called+Blackbox.+Blackbox+is+built+to+connect+developers+and+help+them+find+the+right+code+snippets.+I%27m+loving+and+I+think+you+will+took.%0D%0A%0D%0AYou+can+search+for+%22Blackbox%22+from+the+VS+Code+extensions+or+you+can+get+it+from+this+link%C2%A0https://marketplace.visualstudio.com/items?itemName=Blackboxapp.blackbox&ssr=false#overview"
							)
						else if (data.command == "moderator")
							open(
								"https://join.slack.com/t/blackboxmoderators/shared_invite/zt-1korfqhz5-jDnijHzeCrTXlBnX1cgocQ"
							)
						else if (data.command == "features-enable") {
							loginOrSignup()
						} else if (data.command == "features-disable") {
							_.globalState.update("extensionStatus", false)
							EXTENSION_STATUS = false
							vscode.window.showInformationMessage(
								"Blackbox Autocomplete Disabled"
							)
							selectionFct("Autcomplete Disabled")
						} else if (data.command == "chatEnable") {
							_.globalState.update("chatStatus", true)
							thisWebview.webview.html = getWebViewContent("chat")
							// loginOrSignup()
							if (socket == undefined) createSocketConnection()
						} else if (data.command === "showCodeSearch") {
							vscode.commands.executeCommand(
								"blackbox.codeSearch"
							)
						} else if (data.command === "showHistorySearch") {
							vscode.commands.executeCommand(
								"blackbox.historySearch"
							)
						}
					}
				})

				thisWebview.onDidChangeVisibility(() => {
					if (isExtensionOpen()) {
						thisWebview.badge = {}
					}
				})

				function createSocketConnection() {
					socket = io.connect(mainSite)
					socket.on("connect", () => {
						console.log("==> Green Success connected: " + socket.id)
						socket.emit("updateSockId", { userId })
					})
					socket.on("connect_error", (err) => {
						console.log(`connect_error due to ${err.message}`)
					})
					socket.on("signedIn", (data) => {
						userId = data.userId
						_.globalState.update("userId", JSON.stringify(userId))
						// console.log(data)
						// console.log(userId)
						vscode.window.showInformationMessage(
							"You are now signed in, enjoy blackbox!",
							{ modal: "true" }
						)
					})
					socket.on("updateIsFree", (data) => {
						// console.log(data)
						isFree = data.isFree
					})
					socket.on("ping", function (data) {
						// console.log("ping")
						socket.emit("pong", { beat: 1 })
					})
					socket.on("seeValues", function (data) {
						// console.log(data)
					})
					socket.on("showError", function (data) {
						vscode.window.showWarningMessage(data.message)
					})

					socket.emit("updateSockId", { userId })

					socket.on("setUserName", function (data) {
						allState["me"].username = data.username
						postMessage({
							command: "setUserName",
							username: data.username
						})
					})

					socket.on("setRoomAdmin", function (data) {
						setRoomAdmins(data.roomId, data.admins)
					})

					socket.on("flipRoomStatus", function (data) {
						setRoomStatus(data.roomId, data.status)
						if (allState.activeChat === data.roomId) {
							postMessage({
								command: "flipRoomStatus",
								roomId: data.roomId,
								status: allState.chats[data.roomId].locked
							})
						}
					})

					socket.on("recieveVscodeMessage", function (data) {
						recieveMessage(
							data.roomId,
							data.from,
							"message",
							data.message,
							data.time,
							data.msgId,
							data.parentId
						)
					})

					socket.on("roomJoined", function (data) {
						const roomId = data.roomId
						const roomStatus = data.status
						const roomAdmins = data.admins
						startRoom(roomId, roomStatus, roomAdmins)
						showChat(roomId)
						addRoomToLobby(roomId)
					})

					socket.on("userJoinedRoom", function (data) {
						updateRoomUserCount(data.roomId, data.userCount)
						addToRoomMessages(data.roomId, data.user, "join")
						postMessage({
							command: "userJoinedRoom",
							user: data.user,
							userCount: data.userCount
						})
					})

					socket.on("userLeftRoom", function (data) {
						// console.log(data)
						addToRoomMessages(data.roomId, data.user, "leave")
						postMessage({
							command: "userLeftRoom",
							user: data.user,
							userCount: data.userCount
						})
					})

					socket.on("roomTaken", function (data) {
						// console.log("room is taken")
						postMessage({
							command: "roomTaken",
							message: data.message
						})
					})

					socket.on("updateChats", function (data) {
						const roomData = data.data
						// console.log('==> Green: success hello')
						// console.log(roomData)
						reconnectData(roomData)
					})
				}

				// sets room admins locally
				function setRoomAdmins(roomId, admins) {
					const adminArr = admins
					allState.chats[roomId].admins = adminArr

					if (isThisChatActive(roomId) && adminArr.includes(userId)) {
						postMessage({
							command: "showInviteForm"
						})
					}
				}

				// checks if given roomId is the active chat
				function isThisChatActive(roomId) {
					return allState.activeChat === roomId
				}

				// call only when you want to refresh the lobby chats
				function updateLobby() {
					const chats = allState.chats

					var lobbyChats = {}
					for (var key in chats) {
						lobbyChats[key] = chats[key].badge
					}

					postMessage({ command: "initLobby", data: lobbyChats })
				}

				// called when the user recieves a message
				function recieveMessage(
					roomId,
					by,
					type = "message",
					message,
					time,
					msgId,
					parentId
				) {
					addToRoomMessages(
						roomId,
						by,
						type,
						message,
						time,
						msgId,
						parentId
					)
					if (allState.activeChat === roomId) {
						var currTime = new Date()
						currTime = currTime.toLocaleString("en-US", {
							hour: "numeric",
							minute: "numeric",
							hour12: true
						})
						postMessage({
							command: "recieveVscodeMessage",
							message: message,
							from: by,
							time: currTime,
							msgId: msgId,
							parentId: parentId
						})
					} else {
						setRoomBadge(roomId, 1, true)
					}
				}

				// checks if the extension window is open
				function isExtensionOpen() {
					return thisWebview.visible
				}

				// changes the room status from private to public and  vice versa
				function setRoomStatus(roomId, status) {
					allState.chats[roomId].locked =
						status === "private" ? true : false
				}

				// changes the room badge number
				function setRoomBadge(roomId, count, addToPrevious = false) {
					if (addToPrevious) allState.chats[roomId].badge += count
					else allState.chats[roomId].badge = count
					updateBadges(roomId)
				}

				// called when the user first opens the extension or when closed and opened
				function initState() {
					const chats = allState.chats

					var lobbyChats = {}
					for (var key in chats) {
						lobbyChats[key] = chats[key].badge
					}

					postMessage({ command: "initLobby", data: lobbyChats })
					if (allState.activeChat) {
						showChat(allState.activeChat)
					}
				}

				// called when a new room is created, either by creating one, or by joining one
				function startRoom(roomId, status = "private", admins = []) {
					allState.chats[roomId] = {
						admins: [...admins],
						locked: status === "private" ? true : false,
						users: [],
						messages: [],
						badge: 0,
						userCount: 0
					}
					setRoomAsActive(roomId)
				}

				function reconnectData(data) {
					// console.log("in reconnect")
					// console.log(data)
					if (Object.keys(data).length !== 0) {
						for (const key in data) {
							allState.chats[key] = data[key]
						}
						// console.log("getting state")
						initState()
					}
				}

				// called when a new messages or notification is sent or recieved, to save and show on close and open
				function addToRoomMessages(
					roomId,
					by,
					type,
					message = null,
					time = null,
					msgId,
					parentId = ""
				) {
					var objToPush = { type, by }
					if (message) {
						var currTime
						if (time) {
							currTime = time
						} else {
							currTime = new Date()
							currTime = currTime.toLocaleString("en-US", {
								hour: "numeric",
								minute: "numeric",
								hour12: true
							})
						}
						objToPush["message"] = message
						objToPush["time"] = currTime
						objToPush["msgId"] = msgId
						objToPush["parentId"] = parentId
					}
					// console.log(objToPush)
					allState.chats[roomId].messages.push(objToPush)
				}

				// updates room user count
				function updateRoomUserCount(roomId, userCount) {
					allState.chats[roomId].userCount = userCount

					if (allState.activeChat === roomId) {
						postMessage({
							command: "setUserCount",
							userCount: userCount
						})
					}
				}

				// call only when you want to update badges
				function updateBadges(roomId) {
					var totalCount = 0
					for (var key in allState.chats) {
						totalCount += allState.chats[key].badge
					}

					if (totalCount !== 0) {
						if (!isExtensionOpen()) {
							thisWebview.badge = {
								tooltip: "unseen messages",
								value: totalCount
							}
						} else {
							postMessage({
								command: "updateBadges",
								badge: allState.chats[roomId].badge,
								roomId,
								totalCount
							})
						}
					} else {
						thisWebview.badge = {}
						postMessage({
							command: "updateBadges",
							badge: "",
							roomId,
							totalCount: ""
						})
					}
				}

				// called to send a message to inside the webview
				function postMessage(obj) {
					thisWebview.webview.postMessage(obj)
				}

				// changes which room is active, pass null to indicate that the lobby is active
				function setRoomAsActive(roomId) {
					allState.activeChat = roomId
				}

				//not used by useful later, shows or creates room
				function initializeChat(roomId) {
					if (roomId) {
						if (allState.chats[roomId]) {
							showChat(roomId)
							return
						}
					}
					createChat({ roomId, userId })
				}

				// called to show room with all messages and notifications
				function showChat(roomId) {
					setRoomAsActive(roomId)
					postMessage({
						command: "initializeChat",
						chatState: allState.chats[roomId],
						roomId,
						currId: userId
					})
				}

				//called to show the thread
				function showThread(threadId, roomId) {
					postMessage({
						command: "initializeThread",
						chatState: allState.chats[roomId],
						roomId,
						currId: userId,
						threadId: threadId
					})
				}

				// called to add room to the lobby
				function addRoomToLobby(roomId) {
					postMessage({
						command: "addRoomToLobby",
						roomId,
						badge: allState.chats[roomId].badge
					})
				}

				// called to create a new room
				function createChat(data) {
					socket.emit("createNewRoom", data)
				}
			} catch (e) {
				// console.log(e)
			}
		}
	}

	var fullArr = []
	function formatRepos(repos, query) {
		if (query) {
			var tenLinesArr = []
			fullArr = []
			repos.forEach((repo, repoIndex) => {
				fullArr[repoIndex] = repo.split("\n")
				fullArr[repoIndex] = fullArr[repoIndex].join("\n")
				tenLinesArr[repoIndex] = ""
				const repoLines = repo.split("\n")

				var lineHolder = ""
				var segmentsArr = []
				for (let i = 0; i < repoLines.length - 1; i++) {
					lineHolder += repoLines[i] + "\n"

					if (i % 9 === 0 && i !== 0) {
						segmentsArr.push(lineHolder)
						lineHolder = ""
					}
					if (i == repoLines.length - 1) {
						segmentsArr.push(lineHolder)
					}
				}
				var lastOccurences = 0
				var savedIdx = 0
				var words = query.split(" ")
				segmentsArr.forEach((segment, idx) => {
					var occurences = 0
					words.forEach((word) => {
						occurences += segment.split(word).length - 1
					})

					if (occurences > lastOccurences) {
						lastOccurences = occurences
						savedIdx = idx
					}
				})

				tenLinesArr[repoIndex] = segmentsArr[savedIdx]
			})

			fullArr.forEach((repo, repoIndex) => {
				if (
					tenLinesArr[repoIndex] &&
					!tenLinesArr[repoIndex].includes(
						repo.split("\n").splice(0, 2).join("\n")
					)
				) {
					tenLinesArr[repoIndex] =
						repo.split("\n").splice(0, 2).join("\n") +
						"\n" +
						tenLinesArr[repoIndex]
				}
				var temp = repo.split("\n")
				temp.splice(0, 2)
				fullArr[repoIndex] = temp.join("\n")
			})

			return tenLinesArr
		} else {
			var tenLinesArr = []
			fullArr = []
			var lineNumbers = []
			repos = repos.reverse() // default sort by most recent
			repos.forEach((repo, repoIndex) => {
				fullArr[repoIndex] = repo.split("\n")
				fullArr[repoIndex] = fullArr[repoIndex].join("\n")
				tenLinesArr[repoIndex] = ""
				const repoLines = repo.split("\n")

				var lineHolder = ""
				var segmentsArr = []
				if (repoLines.length > 1) {
					// else then in saved lines ()
					segmentsArr.push(repoLines.join("\n"))
				} else {
					segmentsArr = [repoLines[0]]
				}

				tenLinesArr[repoIndex] = segmentsArr[0]
			})
			return [tenLinesArr, lineNumbers]
		}
	}
	vscode.window.registerWebviewViewProvider(
		"blackbox-onboarding",
		webViewProvider
	)
	// @ts-ignore
	vscode.languages.registerInlineCompletionItemProvider(
		{ pattern: "**" },
		provider
	)
	vscode.commands.registerCommand("extension.acceptSuggestion", () => {
		vscode.commands.executeCommand("editor.action.inlineSuggest.commit")
		if (acceptType != "") selectionFct(`Accept ${acceptType}`)
		else selectionFct("Accept")
		if (acceptType == 'Code Complete') acceptSuggestion(globalPrompt, globalSuggestion, globalLanguageId)
		acceptType = "" //reset the type
	})
	vscode.commands.registerCommand(
		"extension.enableBlackBoxAutoComplete",
		() => {
			loginOrSignup()
		}
	)
	vscode.commands.registerCommand(
		"extension.disableBlackBoxAutoComplete",
		() => {
			_.globalState.update("extensionStatus", false)
			EXTENSION_STATUS = false
			vscode.window.showInformationMessage(
				"Blackbox Autocomplete Disabled"
			)
			selectionFct("Autcomplete Disabled")
		}
	)
	vscode.commands.registerCommand(
		"extension.clearBlackboxAutocomplete",
		() => {
			_.globalState.update("savedLines", undefined)
			vscode.window.showInformationMessage(
				"Blackbox Cleared Autocomplete Lines"
			)
			selectionFct("Autcomplete Clear")
		}
	)
	vscode.commands.registerCommand("extension.saveText", async () => {
		addItem(getSelectedText())
	})

	var currentPanel
	vscode.commands.registerCommand("blackbox.codeSearch", () => {
		if (currentPanel) {
			currentPanel.reveal(vscode.ViewColumn.One)
		} else {
			currentPanel = vscode.window.createWebviewPanel(
				"blackbox-search",
				"Blackbox Search",
				vscode.ViewColumn.One,
				{
					enableScripts: true
				}
			)
			stylesSrc = currentPanel.webview.asWebviewUri(styles)
			codemirrorStylesSrc =
				currentPanel.webview.asWebviewUri(codemirrorStyles)
			codemirrorJsSrc = currentPanel.webview.asWebviewUri(codemirrorJs)
			codemirrorModeJsSrc =
				currentPanel.webview.asWebviewUri(codemirrorModeJs)
			codemirrorModePySrc =
				currentPanel.webview.asWebviewUri(codemirrorModePy)
			codeMirrorSearchCursorSrc = currentPanel.webview.asWebviewUri(
				codeMirrorSearchCursor
			)
			codemirrorThemeSrc =
				currentPanel.webview.asWebviewUri(codemirrorTheme)
			codemirrorModeClikeSrc =
				currentPanel.webview.asWebviewUri(codemirrorModeClike)
			codemirrorModeCssSrc =
				currentPanel.webview.asWebviewUri(codemirrorModeCss)
			codemirrorModeHtmlMixedSrc = currentPanel.webview.asWebviewUri(
				codemirrorModeHtmlMixed
			)
			codemirrorModePhpSrc =
				currentPanel.webview.asWebviewUri(codemirrorModePhp)
			codemirrorModeSimpleSrc =
				currentPanel.webview.asWebviewUri(codemirrorModeSimple)
			codemirrorModeXmlSrc =
				currentPanel.webview.asWebviewUri(codemirrorModeXml)
			loaderImgSrc = currentPanel.webview.asWebviewUri(loaderImg)
			searchIconSrc = currentPanel.webview.asWebviewUri(searchIcon)
			currentPanel.webview.html = getCodeSearchView()
			function postMessage(obj) {
				currentPanel.webview.postMessage(obj)
			}
			currentPanel.onDidDispose(() => {
				currentPanel = undefined
			})
			currentPanel.webview.onDidReceiveMessage(async (data) => {
				if (data.command === "searchCode") {
					const response = await (0, node_fetch_1.default)(
						"https://useblackbox.io/searchrepo",
						{
							method: "POST",
							body: JSON.stringify({
								query: data.query,
								userId: userId
							}),
							headers: {
								"Content-Type": "application/json",
								Accept: "application/json"
							}
						}
					)
					const result = await response.json()
					const codes = formatRepos(result.response, data.query)
					if (data.query.includes(" a "))
						data.query = data.query.split(" a ").join(" ")
					postMessage({
						command: "showCode",
						codes,
						query: data.query
					})
				} else if (data.command === "showFullCode") {
					openInPage(fullArr[data.codeId], data.languageId)
				} else if (data.command === "showGettingStarted") {
					openGettingStartedWebview(true)
				}
			})
		}
	})

	var historyPanel
	vscode.commands.registerCommand("blackbox.historySearch", () => {
		if (historyPanel) {
			historyPanel.reveal(vscode.ViewColumn.One)
		} else {
			historyPanel = vscode.window.createWebviewPanel(
				"blackbox-history-search",
				"Saved Snippets",
				vscode.ViewColumn.One,
				{
					enableScripts: true
				}
			)
			stylesSrc = historyPanel.webview.asWebviewUri(styles)
			codemirrorStylesSrc =
				historyPanel.webview.asWebviewUri(codemirrorStyles)
			codemirrorJsSrc = historyPanel.webview.asWebviewUri(codemirrorJs)
			codemirrorModeJsSrc =
				historyPanel.webview.asWebviewUri(codemirrorModeJs)
			codemirrorModePySrc =
				historyPanel.webview.asWebviewUri(codemirrorModePy)
			codeMirrorSearchCursorSrc = historyPanel.webview.asWebviewUri(
				codeMirrorSearchCursor
			)
			codemirrorThemeSrc =
				historyPanel.webview.asWebviewUri(codemirrorTheme)
			codemirrorModeClikeSrc =
				historyPanel.webview.asWebviewUri(codemirrorModeClike)
			codemirrorModeCssSrc =
				historyPanel.webview.asWebviewUri(codemirrorModeCss)
			codemirrorModeHtmlMixedSrc = historyPanel.webview.asWebviewUri(
				codemirrorModeHtmlMixed
			)
			codemirrorModePhpSrc =
				historyPanel.webview.asWebviewUri(codemirrorModePhp)
			codemirrorModeSimpleSrc =
				historyPanel.webview.asWebviewUri(codemirrorModeSimple)
			codemirrorModeXmlSrc =
				historyPanel.webview.asWebviewUri(codemirrorModeXml)
			loaderImgSrc = historyPanel.webview.asWebviewUri(loaderImg)
			searchIconSrc = historyPanel.webview.asWebviewUri(searchIcon)
			blackboxLogoSrc = historyPanel.webview.asWebviewUri(blackboxLogo)
			historyPanel.webview.html = getHistorySearchView()
			function postMessage(obj) {
				historyPanel.webview.postMessage(obj)
			}
			historyPanel.onDidDispose(() => {
				historyPanel = undefined
			})
			historyPanel.webview.onDidReceiveMessage(async (data) => {
				if (data.command === "showFullCode") {
					openInPage(fullArr[data.codeId], data.languageId)
				} else if (data.command === "showHistory") {
					var history = JSON.parse(_.globalState.get("savedSnippets"))
					const arr = []
					const timings = []
					const languages = []
					const publishStatus = []
					for (var key in history) {
						arr.push(key)
						timings.push(history[key].addedAt)
						languages.push(history[key].language || "")
						publishStatus.push(history[key].publish)
					}

					const codes = formatRepos(arr)
					postMessage({
						command: "showCode",
						codes: codes[0],
						lineNumbers: codes[1],
						type: "history",
						timings,
						languages,
						publishStatus
					})
				} else if (data.command === "deleteHistoryItem") {
					removeHistoryItem(data.key)
				} else if (data.command === "editHistoryItem") {
					editHistoryItem(data)
				} else if (data.command === "publishHistoryItem") {
					publishHistoryItem(data.key, data.updatePublishStatus)
				}
			})
		}
	})

	function removeHistoryItem(key) {
		var savedLines = JSON.parse(_.globalState.get("savedSnippets"))
		delete savedLines[key]
		_.globalState.update("savedSnippets", JSON.stringify(savedLines))
	}
	function publishHistoryItem(key, updatePublishStatus) {
		var savedLines = JSON.parse(_.globalState.get("savedSnippets"))
		if (savedLines[key]['uId'] == undefined) savedLines[key]['uId'] = uuid()
		savedLines[key]['publish'] = updatePublishStatus
		_.globalState.update("savedSnippets", JSON.stringify(savedLines))
		publishSnippet(savedLines[key])
	}
	function editHistoryItem(data) {
		const { key, newValue } = data
		var savedLines = JSON.parse(_.globalState.get("savedSnippets"))
		const newDate = new Date().getTime()
		savedLines[newValue] = {
			addedAt: newDate,
			lastUsed: newDate,
			language: savedLines[key].language,
			text: savedLines[key].text
		}
		delete savedLines[key]
		_.globalState.update("savedSnippets", JSON.stringify(savedLines))
	}

	function getCodeSearchView() {
		return `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">

			<title>Blackbox View Test</title>

			<link href="${stylesSrc}" type="text/css" rel="stylesheet"/>
			<script src="${codemirrorJsSrc}"></script>
			<link rel="stylesheet" href="${codemirrorStylesSrc}" />
			<script src="${codemirrorModeJsSrc}"></script>
			<script src="${codemirrorModePySrc}"></script>
			<script src="${codemirrorModeClikeSrc}"></script>
			<script src="${codemirrorModeCssSrc}"></script>
			<script src="${codemirrorModeHtmlMixedSrc}"></script>
			<script src="${codemirrorModePhpSrc}"></script>
			<script src="${codemirrorModeSimpleSrc}"></script>
			<script src="${codemirrorModeXmlSrc}"></script>
			<script src="${codeMirrorSearchCursorSrc}"></script>
			<link rel="stylesheet" href="${codemirrorThemeSrc}" />
		</head>
		<body>
			<style>
				* {
					padding: 0;
					margin: 0;
					box-sizing: border-box;
				}
		
				.input-style {
					width: 100%;
					margin: 10px 0;
					outline: none;
					border: 0;
					background-color: #ffffff17;
					padding: 5px;
					color: #fff;
					outline-color:rgb(14, 99, 156)!important;
				}

				.CodeMirror {
					height: auto;
					background-color: transparent !important;
				}
				.CodeMirror-gutters {
					background-color: transparent !important;
					border-right: 0 !important;
				}
				.CodeMirror-linenumbers {
					padding-right: 20px;
				}

				.result-holder{
					border-bottom: 1px solid #5656564d;
					margin-bottom: 47px;
				}

				.highlight {
					background-color: rgba(17, 119, 187, 0.5);
				}

				.cm-s-darcula span.cm-property{
					color:#ff7b72;
				}

				.cm-s-darcula span.cm-string{
					color:#A9B7C6;
				}

				.input-container{
					padding: 14px;
					position:sticky;
					top:0;
					background-color: transparent;
					z-index: 999;
					border-radius: 0 0 5px 5px;
					display: flex;
					align-items: center;
				}
				.input-icon{
					cursor: pointer;
					position: absolute;
					top: 50%;
					transform: translateY(-50%);
					right: 20px;
					width: 40px;
				}

				.search-icon{
					cursor: pointer;
					width: 15px;
				}

				.loader-icon{
					cursor: pointer;
					right: 50px;
					width: 28px;
					display:none;
				}
				.loader-icon.active{
					display:block;
				}
				.btn-card-suggestion{
					background-color: rgb(14 99 156 / 16%)
				}
				.btn-card-suggestion:hover{
					rgb(14 99 156 / 46%)
				}

			</style>
			<div class="holder">
				<div class="search-page">
					<div class="input-container">
						<input
							type="text"
							class="search-input input-style"
							placeholder="Search for Code (For example: 'stripe.customer.create')"
						/>
						<img class="loader-icon input-icon" style="cursor: pointer" class="btn-search" src="${loaderImgSrc}">
						<img class="search-icon input-icon" style="cursor: pointer" class="btn-search" src="${searchIconSrc}">
					</div>
				</div>
				<div class="card-view-suggestions">
					<div style="padding-left:15px">Click on any of the suggestions below and explore the results. Or type your own query.</div>
					<div style="display: flex;">
						<div class="btn-default btn-card-suggestion">mongodb nodejs connect</div>
						<div class="btn-default btn-card-suggestion">python connect to postgres</div>
						<div class="btn-default btn-card-suggestion">javascript twitter api</div>
						<div class="btn-default btn-card-suggestion">typescript vscode extension</div>
						<div class="btn-default btn-card-suggestion">mongodb create user profile nodejs</div>
						<div class="btn-default btn-card-suggestion">gmail login nodejs</div>
						<div class="btn-default btn-card-suggestion">mongodb reset password</div>
						<div class="btn-default btn-card-suggestion">mixpanel track events python</div>
						<div class="btn-default btn-card-suggestion">python flask api</div>
					</div>
				</div>
			</div>
			<script src="https://code.jquery.com/jquery-3.6.3.js" integrity="sha256-nQLuAZGRRcILA+6dMBOvcRh5Pe310sBpanc6+QBmyVM=" crossorigin="anonymous"></script>
			<script>
				(function() {
					const vscode = acquireVsCodeApi();
							
					function postMessage(obj){
						vscode.postMessage(obj)
					}

					var isLoading = false
					$(document).on("keydown",".search-input", function(e){
						const key = e.key
						if(key === "Enter" && !isLoading){
							const query = $(this).val()
							if(query){
								isLoading = true
								$(".loader-icon").addClass("active")
								postMessage({
									command:"searchCode",
									query
								})
							}
						}
					})
					$(document).on("click",".search-icon", function(e){
						if(!isLoading){
							const query = $(".search-input").val()
							if(query){
								isLoading = true
								$(".loader-icon").addClass("active")
								postMessage({
									command:"searchCode",
									query
								})
							}
						}
					})
					$(document).on("click",".btn-card-suggestion", function(e){
						const query = this.innerText
						$(".search-input")[0].value=query
						$(".loader-icon").addClass("active")
						postMessage({
							command:"searchCode",
							query
						})
					})
					function getCodeLanguage(fileExtension){
						var language = "javascript"
						var stringLanguage = language
						if(fileExtension === "py"){
							language = "python"
							stringLanguage = "python"
						} else if(fileExtension === "ts"){
							language = "text/typescript"
							stringLanguage = "typescript"
						} else if(fileExtension === "html"){
							language = "htmlmixed"
							stringLanguage = "html"
						} else if(fileExtension === "css"){
							language = "css"
							stringLanguage = "css"
						} else if(fileExtension === "php"){
							language = "php"
							stringLanguage = "php"
						} else if (fileExtension === "cs") {
							language = "text/x-csharp"
							stringLanguage = "csharp"
						} else if (fileExtension === "java") {
							language = "text/x-java"
							stringLanguage = "java"
						} else if (fileExtension === "scala") {
							language = "text/x-scala"
							stringLanguage = "scala"
						} else if (fileExtension === "ceylon") {
							language = "text/x-ceylon"
							stringLanguage = "java"
						} else if (fileExtension === "h"){
							language = "text/x-csrc"
							stringLanguage = "c"
						} else if (fileExtension === "kt" || fileExtension === "kts"){
							language = "kotlin"
							stringLanguage = "java"
						} else if (fileExtension === "cpp" || fileExtension === "c++"){
							language = "text/x-c++src"
							stringLanguage = "cpp"
						}

						return [language, stringLanguage]
					}
					function showCode(data){
						const {codes, query} = data
						$(".result-holder").remove()
						codes.forEach((code, idx)=>{
							if (code){
								const $holder = $('<div data-id='+idx+' class="result-holder"></div>')
								const $el = $('<textarea class="code-area"></textarea>')
								
								$el.val(code)
								var fileExtension = code.split("\\n")[1].split(".")[1]
								var langArr = getCodeLanguage(fileExtension)
								var editorLanguage = langArr[0]
								$holder.append($el)
								$(".search-page").append($holder)
								const codeMirrorEditor = CodeMirror.fromTextArea($el[0], {
									lineNumbers: true,
									theme:"darcula",
									mode: editorLanguage,
									viewportMargin: Infinity,
									readOnly: true
								})

								var words = query.split('.').join(',').split(' ').join(',').split(',')
								words.forEach((word)=>{
									var cursor = codeMirrorEditor.getSearchCursor(word)
									while (cursor.findNext()) {
										codeMirrorEditor.markText(
											cursor.from(),
											cursor.to(),
											{ className: 'highlight' }
										);
									}
								})
								$holder.on("click", function(){
									const codeId = $($holder).attr("data-id")
									postMessage({
										command:"showFullCode",
										codeId,
										languageId: langArr[1]
									})
								})
							}
						})
					}

					window.addEventListener('message', event => {
						const data = event.data
						if(data.command == "showCode"){
							showCode(data)
							isLoading = false
							$(".loader-icon").removeClass("active")
						}
					})
				}())
			</script>
		</body>
		</html>
		`
	}

	function getHistorySearchView() {
		return `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Blackbox View Test</title>
			<link href="${stylesSrc}" type="text/css" rel="stylesheet"/>
			<script src="${codemirrorJsSrc}"></script>
			<link rel="stylesheet" href="${codemirrorStylesSrc}" />
			<script src="${codemirrorModeJsSrc}"></script>
			<script src="${codemirrorModePySrc}"></script>
			<script src="${codemirrorModeClikeSrc}"></script>
			<script src="${codemirrorModeCssSrc}"></script>
			<script src="${codemirrorModeHtmlMixedSrc}"></script>
			<script src="${codemirrorModePhpSrc}"></script>
			<script src="${codemirrorModeSimpleSrc}"></script>
			<script src="${codemirrorModeXmlSrc}"></script>
			<script src="${codeMirrorSearchCursorSrc}"></script>
			<link rel="stylesheet" href="${codemirrorThemeSrc}" />
		</head>
		<body>
			<style>
				* {
					padding: 0;
					margin: 0;
					box-sizing: border-box;
				}
		
				.input-style {
					width: 100%;
					margin: 10px 0;
					outline: none;
					border: 0;
					background-color: #ffffff17;
					padding: 10px;
					color: #fff;
					outline-color:rgb(14, 99, 156)!important;
					border-radius:5px;
					padding-left: 35px;
					margin-right:10px;
				}
				.CodeMirror {
					height: auto;
					background-color: transparent !important;
				}
				.CodeMirror-gutters {
					background-color: transparent !important;
					border-right: 0 !important;
				}
				.CodeMirror-linenumbers {
					padding-right: 20px;
				}
				.result-holder{
					border-bottom: 1px solid #5656564d;
					transition:0.3s ease all;
				}
				.result-holder:hover{
					background-color:#ffffff0f;
				}
				.result-holder:hover .btn-container{
					visibility:visible
				}
				.highlight {
					background-color: rgba(17, 119, 187, 0.5);
				}
				.cm-s-darcula span.cm-property{
					color:#ff7b72;
				}
				.cm-s-darcula span.cm-string{
					color:#A9B7C6;
				}
				.input-container{
					padding: 14px;
					position: absolute;
					top: 50%;
					background-color: transparent;
					z-index: 999;
					border-radius: 0 0 5px 5px;
					width: 100%;
					transform: translateY(-50%);
					transition:0.3s ease all;
					max-width:60%
				}
				.input-icon{
					cursor: pointer;
					position: absolute;
					top: 50%;
					transform: translateY(-50%);
					right: 20px;
					width: 40px;
				}
				.search-icon{
					cursor: pointer;
					width: 15px;
					right:unset;
					left:10px;
				}
				.loader-icon{
					cursor: pointer;
					right: 20px;
					width: 28px;
					display:none;
				}
				.loader-icon.active{
					display:block;
				}
				.suggestion{
					cursor:pointer;
					font-size: 14px;
					color: #cfcfcf;
					background-color: #ffffff17;
					padding: 5px;
					border-radius: 5px;
				}
				.example{
					font-size: 12px;
					color: #a3a3a3;
				}
				.outer-holder{
					display: flex;
					align-items: center;
					justify-content: center;
					flex-direction:column;
				}
				.outer-holder.active{
					position:sticky;
					top:0;
					background-color:var(--vscode-editor-background);
					z-index:99;
				}
				.outer-holder.active .suggestion-holder{
					display:none;
				}
				.outer-holder.active .blackbox-logo{
					display:none;
				}
				.outer-holder.active .input-container{
					transform: unset;
					position:relative;
				}
				.blackbox-logo{
					width: 110px;
				}
				.sug-hold{
					display: flex;
					flex-wrap: wrap;
					gap: 10px;
					margin-top: 10px;
				}
				.btn-container{
					display:flex;
					align-items:center;
					gap:10px;
					justify-content: flex-end;
					visibility: hidden;
				}
				.text-container{
					color:#7e7e7e85;
					font-size:12px;
				}
				.top-container{
					display: flex;
					align-items: center;
					justify-content: space-between;
					margin: 0 20px;
				}
				.btn-option{
					padding:5px;
					cursor:pointer;
					border-radius:4px;
					color:#7e7e7e;
					font-size:12px;
				}
				.btn-option:hover{
					color:rgb(14, 99, 156);
				}
				.special-gutter{
					left: -51px;
					width: 40px;
					position: absolute;
					z-index: 99!important;
					background-color: var(--vscode-editor-background)!important;
					text-align: center!important;
					color:#999;
				}
				.upper-holder{
					display: flex;
					align-items: center;
					width: 100%;
					position:relative;
				}
				.select-style{
					background-color: #212121;
					outline: rgb(14, 99, 156)!important;
					color: #fff;
					border: 1px solid #3e3e3e;
					padding: 5px;
					border-radius: 5px;
				}
				.filter-holder{
					display:flex;
					gap:10px;
					align-items:center;
					justify-content:center;
				}
				.information-line{
					padding: 20px;
					padding-bottom: 0;
					color: #b5b5b5;
				}
				.text-container{
					display: flex;
					align-items: center;
					gap: 10px;
				}
			</style>
			<div class="holder">
				<div class="search-page">
					<div class="outer-holder">
						<div class="input-container">
							<img class="blackbox-logo" style="cursor: pointer" src="${blackboxLogoSrc}">
							<div class="upper-holder">
								<img class="search-icon input-icon" style="cursor: pointer" src="${searchIconSrc}">
								<input
									type="text"
									class="search-input input-style"
									style="width:70%"
									placeholder="Search blackbox"
								/>
								<img class="loader-icon input-icon" src="${loaderImgSrc}">
								<a href="https://www.youtube.com/watch?v=a4v9N7_WXo8">How it Works</a>
							</div>
							<div class="suggestion-holder">
								<div class="example"><b>Search Examples: </b>Search 100M+ Open source repos</div>
								<div class="sug-hold">
									<div class="suggestion">Stripe.customer.create</div>
									<div class="suggestion">Import torch</div>
									<div class="suggestion">console.log</div>
									<div class="suggestion">public static void</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<script src="https://code.jquery.com/jquery-3.6.3.js" integrity="sha256-nQLuAZGRRcILA+6dMBOvcRh5Pe310sBpanc6+QBmyVM=" crossorigin="anonymous"></script>
			<script>
				(function() {
					const vscode = acquireVsCodeApi();
							
					function postMessage(obj){
						vscode.postMessage(obj)
					}
					$(document).on("click", ".suggestion", function(e){
						const query = $(this).text()
						if(query){
							$(".search-input").val(query)
							sendQuery(query)
						}
					})
					function searchHistory(query){
						$(".CodeMirror").each((idx, el)=>{
							const editor = el.CodeMirror
							editor.doc.getAllMarks().forEach(marker => marker.clear())
							$(el).closest(".result-holder").show()
							if(query){
								var words = query.split('.').join('||||').split(' ').join('||||').split('||||')
								var found = false
								words.forEach((word)=>{
									var cursor = editor.getSearchCursor(word)
									while (cursor.findNext()) {
										found = true
										editor.markText(
											cursor.from(),
											cursor.to(),
											{ className: 'highlight' }
										);
									}
								})
								if(!found){
									$(el).closest(".result-holder").hide()
								}
							}
						})
					}
					function showHistory(){
						$(".outer-holder").addClass("active")
						isLoading = true
						$(".loader-icon").addClass("active")
						postMessage({
							command:"showHistory"
						})
					}
					showHistory()
					function sendQuery(query){
						isLoading = true
						$(".loader-icon").addClass("active")
						searchHistory(query)
						isLoading = false
						$(".loader-icon").removeClass("active")
					}
					var isLoading = false
					$(document).on("keydown",".search-input", function(e){
						const key = e.key
						if(key === "Enter" && !isLoading){
							const query = $(this).val()
							sendQuery(query)
						}
					})
					$(document).on("click",".search-icon", function(e){
						if(!isLoading){
							const query = $(".search-input").val()
							sendQuery(query)
						}
					})
					function getCodeLanguage(fileExtension){
						var language = "javascript"
						var stringLanguage = language
						if(fileExtension === "py"){
							language = "python"
							stringLanguage = "python"
						} else if(fileExtension === "ts"){
							language = "text/typescript"
							stringLanguage = "typescript"
						} else if(fileExtension === "html"){
							language = "htmlmixed"
							stringLanguage = "html"
						} else if(fileExtension === "css"){
							language = "css"
							stringLanguage = "css"
						} else if(fileExtension === "php"){
							language = "php"
							stringLanguage = "php"
						} else if (fileExtension === "cs") {
							language = "text/x-csharp"
							stringLanguage = "csharp"
						} else if (fileExtension === "java") {
							language = "text/x-java"
							stringLanguage = "java"
						} else if (fileExtension === "scala") {
							language = "text/x-scala"
							stringLanguage = "scala"
						} else if (fileExtension === "ceylon") {
							language = "text/x-ceylon"
							stringLanguage = "java"
						} else if (fileExtension === "h"){
							language = "text/x-csrc"
							stringLanguage = "c"
						} else if (fileExtension === "kt" || fileExtension === "kts"){
							language = "kotlin"
							stringLanguage = "java"
						} else if (fileExtension === "cpp" || fileExtension === "c++"){
							language = "text/x-c++src"
							stringLanguage = "cpp"
						}
						return [language, stringLanguage]
					}
					const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
					function showCode(data){
						const {codes, query, lineNumbers, timings, languages, publishStatus} = data
						let publishedItems = publishStatus.reverse()
						$(".result-holder").remove()
						codes.forEach((codeVal, idx)=>{
							var codeInformation = ""
							var code = codeVal
							const $holder = $('<div data-id='+idx+' class="result-holder"></div>')
							const $el = $('<textarea class="code-area"></textarea>')
							
							$el.val(code)
							var langArr = ["javascript", "javascript"]
							$holder.append($el)
							$(".search-page").append($holder)
							const codeMirrorEditor = CodeMirror.fromTextArea($el[0], {
								lineNumbers: true,
								gutters: ["CodeMirror-linenumbers", "lineLength"],
								theme:"darcula",
								mode: langArr[0],
								viewportMargin: Infinity,
								readOnly: true
							})
							var savedValue = codeMirrorEditor.getValue()
							const idxTime = new Date(timings[idx])
							const idxDate = monthNames[idxTime.getMonth()] + " "+ idxTime.getDate()+", "+idxTime.getFullYear() +" at "+ idxTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
							const language = languages[idx]
							let publishDiv = ''
							if (publishedItems[idx] == true){
								publishDiv = '<div class="btn-unpublish btn-all-publishstatus btn-option">Unpublish</div>'
							}else{
								publishDiv = '<div class="btn-publish btn-all-publishstatus btn-option">Publish</div>'
							}
							const $btns = $('<div class="top-container"><div class="text-container"><div class="top-date">'+idxDate+'</div><div class="top-language">'+language+'</div></div><div class="btn-container"><div class="btn-delete btn-option">Delete</div><div class="btn-edit btn-option">Edit</div>'+publishDiv+'</div></div>')
							$holder.prepend($btns)
							$btns.find(".btn-option").on("click", function(){
								if($(this).hasClass("btn-delete")){
									postMessage({
										command:"deleteHistoryItem",
										key: savedValue
									})
									$(this).closest(".result-holder").remove()
								}
								else if($(this).hasClass("btn-publish")){
									$(this).text("Unpublish")
									$(this).removeClass("btn-publish")
									$(this).addClass("btn-unpublish")
									postMessage({
										command:"publishHistoryItem",
										key: savedValue,
										updatePublishStatus: true
									})
								}
								else if($(this).hasClass("btn-unpublish")){
									$(this).text("Publish")
									$(this).removeClass("btn-unpublish")
									$(this).addClass("btn-publish")
									postMessage({
										command:"publishHistoryItem",
										key: savedValue,
										updatePublishStatus: false
									})
								}
								else if($(this).hasClass("btn-edit")){
									$(this).text("Save")
									$(this).removeClass("btn-edit")
									$(this).addClass("btn-save")
									$holder.addClass("stop-show")
									codeMirrorEditor.setOption("readOnly", false)
								}
								else if($(this).hasClass("btn-save")){
									const newValue = codeMirrorEditor.getValue()
									codeMirrorEditor.setOption("readOnly", true)
									$holder.removeClass("stop-show")
									$(this).text("Edit")
									$(this).addClass("btn-edit")
									$(this).removeClass("btn-save")
									postMessage({
										command:"editHistoryItem",
										key: savedValue,
										newValue
									})
								}
							})
							
							$holder.on("click", function(e){
								if(!$(e.target).hasClass("btn-option") && !$(this).hasClass("stop-show")){
									const codeId = $($holder).attr("data-id")
									postMessage({
										command:"showFullCode",
										codeId,
										languageId: langArr[1]
									})
								}
							})
						})
					}
					window.addEventListener('message', event => {
						const data = event.data
						if(data.command == "showCode"){
							showCode(data)
							isLoading = false
							$(".loader-icon").removeClass("active")
						}
					})
				}())
			</script>
		</body>
		</html>
		`
	}

	async function addEnableAC(userId) {
		const response = await (0, node_fetch_1.default)(
			"https://useblackbox.io/addenableac",
			{
				method: "POST",
				body: JSON.stringify({ userId: userId }),
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json"
				}
			}
		)
	}
	async function selectionFct(event) {
		const response = await (0, node_fetch_1.default)(
			"https://www.useblackbox.io/selection",
			{
				method: "POST",
				body: JSON.stringify({
					userId: userId,
					selected: event,
					source: "visual studio"
				}),
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json"
				}
			}
		)
		const result = await response.json()
	}

	async function publishSnippet(snippetData) {
		const response = await (0, node_fetch_1.default)(
			"https://www.useblackbox.io/publishsnippet",
			{
				method: "POST",
				body: JSON.stringify({
					snippetData: snippetData,
				}),
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json"
				}
			}
		)
		const result = await response.json()
	}
	async function acceptSuggestion(prompt, suggestion, languageId) {
		const response = await (0, node_fetch_1.default)(
			"https://www.useblackbox.io/acceptcc",
			{
				method: "POST",
				body: JSON.stringify({
					userId: gloablUserId,
					prompt: prompt,
					suggestion: suggestion,
					languageId: languageId
				}),
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json"
				}
			}
		)
		const result = await response.json()
	}
	async function signinFct(userId) {
		// console.log(`==> Green: Start signin check`)
		const response = await (0, node_fetch_1.default)(
			"https://www.useblackbox.io/signinvscode",
			{
				method: "POST",
				body: JSON.stringify({ userId: userId }),
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json"
				}
			}
		)
		const result = await response.json()
		// console.log(`==> Green: Signin - `, result)
		if (result.status == "success") {
			gloablUserId = result.userId
			_.globalState.update("userId", JSON.stringify(result.userId))
			userId = result.userId
			// socket.emit("getUserName", { userId })
			vscode.window.showInformationMessage(`You're now logged in`)
			//activate for premium profile
			if (result.isPremium == true){
				_.globalState.update("extensionStatus", true)
				EXTENSION_STATUS = true
				vscode.window.showInformationMessage(
					"Blackbox Autocomplete Enabled"
				)
				selectionFct("Autcomplete Enabled")
				_.globalState.update("userId", userId)
				addEnableAC(userId)
			}
		}
	}

	async function upgradeFct(localuserId) {
		const response = await (0, node_fetch_1.default)(
			"https://www.useblackbox.io/upgradevsce",
			{
				method: "POST",
				body: JSON.stringify({ userId: localuserId }),
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json"
				}
			}
		)
		const result = await response.json()
		userId = result.userId
		_.globalState.update("extensionStatus", true)
		EXTENSION_STATUS = true
		_.globalState.update("userId", JSON.stringify(result.userId))
	}

	async function openInPage(content, languageId = "") {
		const filePath = path.join(__dirname, "blackbox-snippets")
		fs.writeFile(filePath, content, async function (err) {
			if (err) {
				return console.log(err)
			}
			var showPage = true
			vscode.workspace.textDocuments.forEach((doc) => {
				if (doc.fileName.includes("blackbox-snippets.git")) {
					showPage = false
				}
			})

			const document = await vscode.workspace.openTextDocument(
				filePath,
				{}
			)

			if (showPage) {
				vscode.window.showTextDocument(document, {
					viewColumn: vscode.ViewColumn.Beside
				})
			}

			if (languageId) {
				vscode.languages.setTextDocumentLanguage(document, languageId)
			}
		})
	}

	function getSelectedText() {
		var editor = vscode.window.activeTextEditor
		if (!editor) {
			return null
		}

		var selection = editor.selection
		var text = editor.document.getText(selection)
		return text
	}
	function addItem(text) {
		text = text.trim()
		var oldArr = _.globalState.get("savedSnippets")
		if (oldArr === undefined) {
			oldArr = {}
		} else {
			oldArr = JSON.parse(oldArr)
		}
		if (oldArr[text.trim()] === undefined) {
			const newArr = { ...oldArr }
			const newTime = new Date().getTime()
			newArr[`${text}`] = {
				uses: 2,
				lastUsed: newTime,
				addedAt: newTime,
				text: `${text}`,
				language: vscode.window.activeTextEditor.document.languageId
			}
			// vscode.window.showInformationMessage("Saved snippet!")
			vscode.window.showInformationMessage(
					"Saved Snippet! View All Saved Snippets",
					...["View Snippets"]
				)
				.then(async (option) => {
					if (option === "View Snippets") vscode.commands.executeCommand("blackbox.historySearch")
				})
			selectionFct("Autocomplete Saved Snippet")
			_.globalState.update("savedSnippets", JSON.stringify(newArr))
		}
	}
	async function loginOrSignup() {
		const response = await (0, node_fetch_1.default)(
			`${mainSite}/verify/${userId}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json"
				}
			}
		)
		const result = await response.json()
		if (result) {
			if (result["status"] == "login") {
				vscode.window
					.showInformationMessage(
						"Signin to your Blackbox Account or Singup",
						...["Signin", "Signup"]
					)
					.then(async (option) => {
						let loginUserId = userId
						if (loginUserId.startsWith('"')) loginUserId = loginUserId.slice(1, loginUserId.length-1)
						if (option === "Signin") {
							open(
								`https://www.useblackbox.io/signin?vsCode=${loginUserId}`
							)
							signinFct(loginUserId)
						} else if (option === "Signup") {
							open(
								`https://www.useblackbox.io/signup?vsCode=${loginUserId}`
							)
							signinFct(loginUserId)
						}
					})
			}else{
				_.globalState.update("extensionStatus", true)
				EXTENSION_STATUS = true
				vscode.window.showInformationMessage(
					"Blackbox Autocomplete Enabled"
				)
				selectionFct("Autcomplete Enabled")
				_.globalState.update("userId", userId)
				addEnableAC(userId)
			}
		}
	}
	var panel = null
	function openGettingStartedWebview(autoSelect = "") {
		if (!panel) {
			panel = vscode.window.createWebviewPanel(
				"blackbox.getting-started",
				"Blackbox - Getting Started",
				{
					viewColumn: vscode.ViewColumn.Beside,
					preserveFocus: false
				},
				{
					retainContextWhenHidden: true,
					enableFindWidget: true,
					enableCommandUris: true,
					enableScripts: true
				}
			)
			panel.onDidDispose(() => {
				panel = undefined
				fireEvent({
					name: "getting-started-closed"
				})
			})
			panel.webview.html = `
				<!DOCTYPE html>
				<html lang="en" style="margin: 0; padding: 0; min-width: 100%; min-height: 100%">
					<head>
						<meta charset="UTF-8">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
						<title>Blackbox</title>
					</head>
					<body style="margin: 0; padding: 0; min-width: 100%; min-height: 100%">
						<iframe src="https://www.blackbx.ai/getstarted${autoSelect}" id="config" frameborder="0" style="display: block; margin: 0; padding: 0; position: absolute; min-width: 100%; min-height: 100%; visibility: visible;"></iframe>
					</body>
				</html>`
		}
	}
	function getWebViewContent(page) {
		if (page == "chat") {
			return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<title>Blackbox title</title>
			</head>
			<body>
				<style>
					html,
					body {
						padding: 0;
						margin: 0;
						box-sizing: border-box;
						width: 100%;
						height: 100%;
						overflow: hidden;
						line-height: 20.25px;
						text-align: start;
					}
					body{
						background-color: transparent !important;
					}

					.input-styles {
						margin: 0;
						min-height: 14.5px;
						outline: none !important;
						background-color: transparent;
						padding: 5px;
						color: #fff;
						width: 97%;
						border: 0;
						resize: none;
						margin-top: 10px;
					}
					.input-styles:focus .text-area-holder {
						border: 1px solid rgb(129, 131, 133);
					}
					.chat-connected {
						display: none;
						height: 100%;
						overflow-y: hidden;
						flex-direction: column;
					}
					.chat-connected.active {
						display: flex;
					}
					.thread-connected {
						display: none;
						height: 100%;
						overflow-y: hidden;
						flex-direction: column;
					}
					.thread-connected.active {
						display: flex;
					}
					.lobby {
						display: none;
						height: 80%;
					}
					.lobby.active {
						display: block;
					}

					.btn-holder {
						display: flex;
						justify-content: center;
						gap: 10px;
					}

					.btn-moderator {
						padding: 7px;
						margin: 14px;
						border: 0;
						background-color: rgb(14, 99, 156);
						color: #fff;
						border-radius: 2px;
						cursor: pointer;
						text-align: center;
						height: 21px;
					}
					.btn-moderator:hover {
						background-color: rgba(17, 119, 187);
					}
					
					.btn-default {
						padding: 7px;
						margin: 14px;
						border: 0;
						background-color: rgb(14, 99, 156);
						color: #fff;
						border-radius: 2px;
						cursor: pointer;
						text-align: center;
						height: 21px;
					}
					.btn-default:hover {
						background-color: rgba(17, 119, 187);
					}

					@media (max-width: 250px) {
						.btn-holder {
							flex-direction: column;
						}
					}

					.text-area-holder {
						display: flex;
						justify-content: center;
						flex-direction: column;
						flex-shrink: 0;
						width: 98.7%;
						border: 1px solid rgb(86, 88, 86);
						border-radius: 10px;
						padding: 5px;
						min-height: 80px;
					}

					.conn-input-style {
						width: 97%;
						margin: 10px 0;
						outline: none;
						border: 0;
						background-color: #ffffff17;
						padding: 5px;
						color: #fff;
					}
					.chat-notification {
						color: #eee;
						text-align: center;
					}
					.lobby.invalid .conn-input-style {
						border: 1px solid red;
					}
					.lobby.invalid .error-message {
						display: block;
					}
					.lobby .error-message {
						color: tomato;
						font-size: 12px;
						text-align: center;
						margin-bottom: 10px;
						display: none;
					}

					.add-new-chat {
						display: flex;
						align-items: center;
						justify-content: center;
						flex-direction: column;
						padding: 0 20px;
					}

					.chats-holder {
						max-height: 500px;
						overflow-y: auto;
						overflow-x: hidden;
					}

					::-webkit-scrollbar {
						width: 5px;
					}

					::-webkit-scrollbar-thumb {
						background: #445561;
					}

					::-webkit-scrollbar-thumb:hover {
						background: #445561;
					}

					.all-chats {
						padding: 20px;
					}
					.all-title {
						text-align: center;
						font-size: 20px;
						font-weight: bold;
						margin-bottom: 20px;
					}

					.chat-back {
						border-radius: 5px;
						padding: 10px 20px;
						transition: 0.3s ease all;
						cursor: pointer;
						position: relative;
					}
					.chat-back:hover {
						background-color: #ffffff17;
					}
					.chat-back .badge {
						right: 0;
						top: 0;
					}
					.thread-back {
						border-radius: 5px;
						padding: 10px 20px;
						transition: 0.3s ease all;
						cursor: pointer;
						position: relative;
					}
					.thread-back:hover {
						background-color: #ffffff17;
					}
					.thread-back .badge {
						right: 0;
						top: 0;
					}
					.badge {
						position: absolute;
						background-color: #3794ff;
						border-radius: 50%;
						width: fit-content;
						padding: 3px;
						font-size: 12px;
						color: #fff;
						width: 10px;
						height: 10px;
						display: flex;
						align-items: center;
						justify-content: center;
						transform: translateY(-50%);
					}
					.badge:empty {
						display: none;
					}
					.numb:empty {
						display: none;
					}

					.chat .right-holder {
						position: relative;
					}
					.chat .badge {
						right: 20px;
					}

					.chats-holder:empty:before {
						content: "No chats";
					}
					.code-block-input {
						cursor: text;
						min-height: 14px;
						height: fit-content;
						max-height: 300px;
						overflow-y: auto;
						tab-size: 1;
					}

					.textBox {
						color: #fff;
						white-space: pre;
						border: 1px solid rgb(77, 77, 77);
						background-color: #2f3138;
						padding: 5px;
						width: 100%;
						border-radius: 5px;
						font-family: monospace;
						tab-size: 7px;
					}
					.invite-form {
						display: flex;
						align-items: center;
					}

					.code-block-btn {
						width: 65px;
						background-color: #282828;
						border: 0;
						outline: none;
						color: #b3b3b3;
						padding: 5px;
						border-radius: 5px;
					}

					.search-bar div {
						width: 100%;
					}

					.search-bar{
						margin: 7px 0;
						position: relative;
						width: 100%;
						display: flex;
						justify-content: center;
						align-items: center;
						padding-right:15px;
					}

					.search-bar div input {
						width: 94.3%;
						border: none;
						outline: none;
						background: transparent !important;
						border-radius: 7px;
						padding: 6px;
						height: 38px;
						font-size: 14px;
						align-items: center;
						color: #e9edef;
						padding-left: 45px;
					}
					.search-bar svg {
						width: 24;
						height: 24;
						vertical-align: middle;
					}

					.search-btn{
						border: none;
						background-color: transparent;
						position: absolute;
						left: 14px;
						top: 14px;
						font-size: 1em;
						color: #aebac1;
						justify-content: center;
						align-items: center;
						transition: .8s all;
						padding:0;
					}

					.chat {
						position: relative;
						width: 97%;
						display: flex;
						align-items: center;
						padding: 15px;
						border-bottom: 0.7px solid #2a3942;
						cursor: pointer;
					}

					.chat:hover {
						background: #ffffff17;
					}

					.imgBox {
						position: relative;
						min-width: 50px;
						height: 50px;
						overflow: hidden;
						border-radius: 50%;
						margin-right: 10px;
						width: 50px;
						height:50px;
						background-color:#000;
						border-radius:50%;
						/* position: absolute;
						top: 0;
						left: 0;
						width: 100%;
						height: 100%;
						object-fit: cover; */
					}

					.chat .head {
						position: relative;
						width: 100%;
						display: flex;
						align-items: center;
						justify-content: space-between;
						margin-bottom: 2px;
					}

					.chat .head h4 {
						font-size: 16px;
						font-weight: 400;
						color: #e9edef;
						letter-spacing: 0.4px;
						margin-bottom: 0;
					}

					.chat .head .time {
						font-size: 11px;
						font-weight: 400;
						color: #8696a0;
						margin-bottom: 0rem;
					}

					.chat .message-chat {
						display: flex;
						align-items: center;
					}

					.chat .message-chat .white-tick {
						color: #8696a0;
					}

					.chat .message-chat .chat-text-icon {
						display: flex;
						width: 100%;
						align-items: center;
						justify-content: space-between;
					}

					.chat .message-chat .chat-text-icon .preview {
						overflow: hidden;
						font-size: 13.5px;
						font-weight: 400;
						color: #8696a0;
						display: -webkit-box;
						-webkit-line-clamp: 1;
						-webkit-box-orient: vertical;
						word-break: break-all;
					}

					.chat .message-chat .chat-text-icon .unread {
						display: flex;
					}

					.numb {
						background: #3794ff;
						color: #fff;
						font-weight: 500;
						min-width: 20px;
						height: 20px;
						border-radius: 50%;
						display: flex;
						justify-content: center;
						align-items: center;
						font-size: 0.75em;
						margin-left: auto;
						margin-right: 7px;
					}

					.white-tick{
						vertical-align: middle;
					}

					.chatBox {
						position: relative;
						flex: 1 1;
						padding: 20px;
						overflow-y: auto;
					}

					.chatBox .chat__date-wrapper {
						text-align: center;
						margin: 10px 0 14px;
						position: relative;
					}

					.chatBox .chat__date {
						background: #1e2a30;
						color: rgba(241, 241, 242, .92);
						display: inline-block;
						font-size: .75rem;
						padding: 7px 10px;
						border-radius: 5px;
					}

					.chatBox .chat-notification {
						background: #1e2a30;
						color: #ffd279;
						font-size: 12.5px;
						text-align: center;
						padding: 5px 12px 6px;
						position: relative;
						margin-bottom: 8px;
						border-radius: 5px;
						line-height: 20px;
					}

					.threadBox {
						position: relative;
						flex: 1 1;
						padding: 20px;
						overflow-y: auto;
					}

					.threadBox .chat__date-wrapper {
						text-align: center;
						margin: 10px 0 14px;
						position: relative;
					}

					.threadBox .chat__date {
						background: #1e2a30;
						color: rgba(241, 241, 242, .92);
						display: inline-block;
						font-size: .75rem;
						padding: 7px 10px;
						border-radius: 5px;
					}

					.threadBox .chat-notification {
						background: #1e2a30;
						color: #ffd279;
						font-size: 12.5px;
						text-align: center;
						padding: 5px 12px 6px;
						position: relative;
						margin-bottom: 8px;
						border-radius: 5px;
						line-height: 20px;
					}

					.sent {
						background: #ffffff17;
						margin-left: auto!important;
					}

					.recieved {
						background: #ffffff17;
						margin-right: auto!important;
					}

					.chatMessage {
						position: relative;
						width: fit-content;
						max-width: 100%;
						padding: 6px 7px 8px 9px;
						border-radius: 7.5px;
						line-height: 20px;
						font-size: 13px;
						color: #e9edef;
						margin: 10px 0;
						width: 97%;
						white-space: pre;
						cursor: pointer;
					}
					.p-rich_text_block {
						text-align: left;
						-webkit-user-select: text;
						user-select: text;
						width: 100%;
						font-family: Monaco,Menlo,Consolas,Courier New,monospace!important;
					}
					.c-mrkdwn__pre {
						padding: 8px;
					}
					.c-mrkdwn__pre, .c-mrkdwn__quote {
						margin-bottom: 4px;
						margin-top: 4px;
					}

					.chatMessage .by{
						color: #8696a0;
						margin-bottom: 5px;
					}

					

					

					.chatMessage .msg-time {
						color: #8696a0;
						font-size: .7rem;
						font-weight: 500;
						text-align: end;
						font-size: 12px;
						margin-top: -3px;
						display:inline-block;
						margin-left: 15px;
					}
					.chatMessage .msg-reply {
						color: #8696a0;
						font-size: .7rem;
						font-weight: 500;
						text-align: left;
						font-size: 12px;
						margin-top: -3px;
						cursor: pointer;
						display:inline-block;
						color: #3794ff
					}
					.msg-reply:hover{
						text-decoration: underline;
					}

					.header {
						position: relative;
						height: 60px;
						background: transparent !important;
						display: flex;
						justify-content: space-between;
						align-items: center;
						padding: 0 15px;
						z-index: 999;
					}
					.thread-header{
						position: relative;
						height: 60px;
						background: transparent !important;
						display: flex;
						justify-content: space-between;
						align-items: center;
						padding: 0 15px;
						z-index: 999;
					}
					.threadMessage {
						position: relative;
						width: fit-content;
						max-width: 100%;
						padding: 6px 7px 8px 9px;
						border-radius: 7.5px;
						line-height: 20px;
						font-size: 13px;
						color: #e9edef;
						margin: 10px 0;
						width: 97%;
						white-space: pre;
					}
					.threadMessage .by{
						color: #8696a0;
						margin-bottom: 5px;
					}
					
					.threadMessage .msg-time {
						color: #8696a0;
						font-size: .7rem;
						font-weight: 500;
						text-align: end;
						font-size: 12px;
						margin-top: -3px;
						display:inline-block;
					}

					.imgText {
						position: relative;
						display: flex;
						justify-content: center;
						align-items: center;
					}

					.userImg {
						position: relative;
						width: 40px;
						height: 40px;
						border-radius: 50%;
						overflow: hidden;
					}

					.imgText .room-id {
						font-weight: 600;
						font-size: 16px;
						line-height: 1.2em;
						color: #e9edef;
					}

					.imgText .room-id span {
						font-weight: 400;
						color: #8696a0;
						font-size: 13px;
					}

					.imgText .thread-id {
						font-weight: 600;
						font-size: 16px;
						line-height: 1.2em;
						color: #e9edef;
					}

					.imgText .thread-id span {
						font-weight: 400;
						color: #8696a0;
						font-size: 13px;
					}

					.chat-side {
						display: flex;
						margin-right: 48px;
					}

					.chat-footer {
						position: relative;
						width: 100%;
						background: transparent !important;
						justify-content: space-between;
						align-items: center;
					}

					.chat-input-wrapper {
						padding: 10px;
						height: 60px;
						position: relative;
						display: -webkit-flex;
						display: flex;
						-webkit-align-items: center;
						align-items: center;
					}
					.thread-input-wrapper {
						padding: 10px;
						height: 60px;
						position: relative;
						display: -webkit-flex;
						display: flex;
						-webkit-align-items: center;
						align-items: center;
					}

					.chat-footer .chat-attach {
						position: relative;
					}

					.chat-footer .icons {
						color: #8696a0;
					}

					.chat-footer .send-message {
						position: relative;
						width: 100%;
						margin: 5px 10px;
						padding: 9px 12px 11px;
						background: #ffffff17;
						border-radius: 6px;
						border: none;
						outline: none;
						color: #e9edef;
						font-size: 14px;
						height: 18px;
						white-space: pre-wrap;
					}

					.thread-footer .chat-attach {
						position: relative;
					}

					.thread-footer .icons {
						color: #8696a0;
					}

					.thread-footer .send-message {
						position: relative;
						width: 100%;
						margin: 5px 10px;
						padding: 9px 12px 11px;
						background: #ffffff17;
						border-radius: 6px;
						border: none;
						outline: none;
						color: #e9edef;
						font-size: 15px;
						height: 18px;
						white-space: pre-wrap;
					}

					.room-status{
						cursor:pointer
					}
					.d-none{
						display:none
					}
					.code-block-input{
						cursor: text;
						min-height:14px;
						height:fit-content;
						max-height:300px;
						overflow-y:auto;
						border-radius: 5px;
						cursor: pointer;
					}
				</style>
				<div class="chat-connected">
						<div class="header">
							<div class="imgText">
								<div class="chat-back">
									<
									<div class="badge"></div>
								</div>
								<div>
									<div class="room-id" style="display: inline-block"></div>
									<div class="btn-moderator" style="display: inline-block">Become Moderator</div>
									<div class="users-count" style="display: none"></div>
								</div>
								
							</div>
							<div class="chat-side">
								<button class="leave-room btn-default" style="display: none">Leave room</button>
							</div>
						</div>
						<div class="invite-form"></div>
						<div class="chatBox chat-area"></div>

						<div class="chat-footer">
							<div class="chat-input-wrapper">

								<textarea
									id="text-area"
									type="text"
									placeholder="Post a question to the community"
									class="send-message text-area input-styles"
								></textarea>
							</div>
						</div>
					</div>
					<div class="thread-connected">
						<div class="thread-header">
							<div class="imgText">
								<div class="thread-back">
									<
									<div class="threadbadge"></div>
								</div>
								<div>
									<div class="thread-id"></div>
								</div>
							</div>
						</div>
						<div class="threadBox thread-area"></div>

						<div class="thread-footer">
							<div class="thread-input-wrapper">

								<textarea
									id="thread-area"
									type="text"
									placeholder="Type a Reply"
									class="send-message text-area input-styles"
								></textarea>
							</div>
						</div>
					</div>
					<div class="lobby active">
						<div class="add-new-chat" style="display: none">
							<span class="disconnect-text"
								>Ask for the room's ID to join (room name)</span
							>
							<input
								type="text"
								class="conn-input conn-input-style"
								id="connection-input"
								placeholder="Room ID"
							/>
							<span class="error-message"></span>
							<div class="btn-holder">
								<button class="connect btn-default">Connect</button>
								<button class="create-room btn-default">
									Create a new room
								</button>
							</div>
						</div>

						<div class="all-chats">
							<div class="all-title">BLACKBOX COMMS<span style="font-size:9px;font-style:italic;" class="all-title">(Beta)</span></div>
							<div style="text-align: left">
								<span style="font-style:italic;" center="">Blackbox COMMS is built to connect developers. Here are 3 tips:
								<ul> <li class="li1" style="margin: 0px; font-variant-numeric: normal; font-variant-east-asian: normal; font-stretch: normal; font-size: 13px; line-height: normal; font-family: &quot;Helvetica Neue&quot;;">Write a brief description of your problem</li> <li class="li1" style="margin: 0px; font-variant-numeric: normal; font-variant-east-asian: normal; font-stretch: normal; font-size: 13px; line-height: normal; font-family: &quot;Helvetica Neue&quot;;">If you already have a code that you tried, share it along with the error you faced</li> <li class="li1" style="margin: 0px; font-variant-numeric: normal; font-variant-east-asian: normal; font-stretch: normal; font-size: 13px; line-height: normal; font-family: &quot;Helvetica Neue&quot;;">Post your question in the right channel</li> </ul>
								</span>
							</div>
							<div class="btn-default btn-refer">
								<span class="btn-refer">Refer a friend</span>
							</div>
							<div style="text-align: left"><span style="font-weight:bold; opacity: 50%; color:#CCCCC" center="">Channels</span></div>
							<div class="chats-holder"></div>
						</div>
					</div>
				<script>
				(function() {
					const vscode = acquireVsCodeApi();
					
					function postMessage(obj){
						vscode.postMessage(obj)
					}

					postMessage("start of file")
					const sendBtn = document.getElementsByClassName('send')[0];
					document.querySelector('.connect').addEventListener("click", connectToRoom);
					document.querySelector('.create-room').addEventListener("click", createNewRoom);
					
					document.addEventListener("click", (e)=>{
						let roomId
						if(e.target.classList.contains("chat") || e.target.classList.contains("head") || e.target.classList.contains("room-name") ){
							let parentElement = e.target
							if (parentElement.classList.contains("head")) parentElement = parentElement.parentElement
							else if (parentElement.classList.contains("room-name")) parentElement = parentElement.parentElement.parentElement
							changeActiveChat(parentElement.getAttribute("data-id"))
							showChat(parentElement.getAttribute("data-id"))
						}
						else if(e.target.classList.contains("chat-back")){
							showLobby()
						} 
						else if(e.target.classList.contains("invite-btn")){
							inviteUser()
						}else if(e.target.classList.contains('msg-reply')){
							let msgId = e.target.getAttribute("msg-id")
							let roomId = document.getElementsByClassName('room-id')[0].innerText.split('#')[1]
							showThread(msgId, roomId)
						}else if(e.target.classList.contains("thread-back")){
							document.querySelector(".thread-area").innerHTML = ""
							document.querySelector(".thread-connected").classList.remove("active")
							document.querySelector(".chat-connected").classList.add("active")
						} else if(e.target.classList.contains("btn-refer") ) {
							postMessage({command: "refer"})
						} else if( e.target.classList.contains('btn-moderator') ) {
							postMessage({command: "moderator"})
						} else if (e.target.classList.contains('chatMessage') || e.target.parentElement.classList.contains('chatMessage')){
							let messageElement
							if ( e.target.classList.contains('chatMessage') ) messageElement = e.target
							else if ( e.target.parentElement.classList.contains('chatMessage') ) messageElement = e.target.parentElement
							let msgId = messageElement.innerHTML.split('id="')[1].split('"')[0]
							let roomId = document.getElementsByClassName('room-id')[0].innerText.split('#')[1]
							showThread(msgId, roomId)
						}
					})
					function uuidv4() {
						return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
						  (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
						);
					}
					
					document.getElementsByClassName('text-area')[0].addEventListener("keydown", (e)=>{
						if(e.key === "Enter"){
							e.preventDefault()
							let roomId = document.getElementsByClassName('room-id')[0].innerText.split('#')[1]
							let msgId = uuidv4()
							sendMessage(null, null, true, "text", msgId)
						}
					});
					document.getElementById('thread-area').addEventListener('keydown', (e)=>{
						if (e.key=="Enter"){
							e.preventDefault()
							let msgId = uuidv4()
							let threadId = document.querySelector(".thread-connected").getAttribute("thread-id")
							sendThread(null, null, username, true,"text", msgId, threadId)
						}
					})
					document.getElementsByClassName('leave-room')[0].addEventListener("click", disconnectFromRoom);
					postMessage("after event listeners")

					var userCount = 0
					var username = ""

					function changeRoomStatus(){
						postMessage({command: "changeRoomStatus"})
					}

					function showChat(roomId){
						postMessage({command:"showChat", roomId})
					}

					function showThread(threadId, roomId){
						postMessage({command:"showThread", threadId, roomId})
					}

					function codeBlock() {
						var codeBox = document.querySelector(".code-block-input")
		
						if (!codeBox) {
							var text = document.querySelector(".text-area").value
							const codeBox = document.createElement("textarea")
							codeBox.classList.add("code-block-input")
							codeBox.classList.add("input-styles")
							codeBox.setAttribute("wrap", "off")
							codeBox.innerHTML = text
		
							document
								.querySelector(".text-area-holder")
								.appendChild(codeBox)
		
							codeBox.focus()
							document.querySelector(".text-area").style.display = "none"
		
							codeBox.addEventListener("keydown", function (e) {
								if (e.key === "Enter") {
									e.preventDefault()
									var text = codeBox.value
									if(text){
										sendMessage(text, null, true, "code")
										removeCodeBlock()
									}
								}
								else{
									this.style.height = 0;
									this.style.height = this.scrollHeight + 'px';
								}
							})

							codeBox.addEventListener("paste", function(){
								setTimeout(()=>{
									this.style.height = 0;
									this.style.height = this.scrollHeight + 'px';
								},50)
							})
						} else {
							var text = codeBox.value
							removeCodeBlock()
						}
					}

					function removeCodeBlock(){
						document.querySelector(".code-block-input").remove()
						document.querySelector(".text-area").style.display = "block"
						document.querySelector(".text-area").value = text
						document.querySelector(".text-area").focus()
					}

					function sendMessage(
						message = null,
						time = null,
						sendToApi = true,
						type = "text",
						msgId = '',
						replyCount = 0
					) {
						const textEl = document.querySelector(".text-area")
						var str = message
						if (!str) {
							str = textEl.value
						}
		
						if (str) {
							const holder = document.createElement("div")
							holder.classList += "code-block-input chatMessage sent"
		
							const msgBy = document.createElement("div")
							msgBy.classList += "by"
							msgBy.textContent = username.split("@")[0]
		
							const chatMessageText = document.createElement("div")
							chatMessageText.classList += "chatMessage-text"
							chatMessageText.textContent = str
		
							const msgTime = document.createElement("div")
							msgTime.classList += "msg-time"
		
							var currTime
							if (!time) {
								var currTime = new Date()
								let dateDisplay = currTime.toDateString().split(' ').slice(1,3).join(' ')
								currTime = currTime.toLocaleString("en-US", {
									hour: "numeric",
									minute: "numeric",
									hour12: true
								})
								dateDisplay = dateDisplay+' '+ currTime
								currTime = dateDisplay
							} else currTime = time
		
							msgTime.textContent = currTime

							let msgReply = document.createElement("div")
							msgReply.classList += "msg-reply"
							if (replyCount == 0) msgReply.textContent = "Reply"
							else if (replyCount ==1 ) msgReply.textContent = replyCount+' Reply'
							else msgReply.textContent = replyCount+' Replies'
							msgReply.setAttribute("msg-id", msgId)
							msgReply.id = msgId

							holder.append(msgBy)
							holder.append(chatMessageText)
							if (msgId != null & msgId != '') holder.appendChild(msgReply)
							holder.appendChild(msgTime)
		
							document
								.getElementsByClassName("chat-area")[0]
								.appendChild(holder)
							var objDiv = document.getElementsByClassName("chat-area")[0]
							objDiv.scrollTop = objDiv.scrollHeight
		
							if (sendToApi) {
								postMessage({
									command: "sendMessage",
									message: str,
									time: currTime,
									parentId: '',
									msgId: msgId
								})
							}
							textEl.value = ""
						}
					}
					function recieveMessage(str, from, time = null, msgId, parentId = '', replyCount = 0) {
						const holder = document.createElement("div")
						holder.classList += "code-block-input chatMessage recieved"
		
						const msgBy = document.createElement("div")
						msgBy.classList += "by"
						msgBy.textContent = ''
						if (from) msgBy.textContent = from.split("@")[0]
		
						const chatMessageText = document.createElement("div")
						chatMessageText.classList += "chatMessage-text"
						chatMessageText.textContent = str
		
						const msgTime = document.createElement("div")
						msgTime.classList += "msg-time"
		
						var currTime
						if (!time) {
							var currTime = new Date()
							currTime = currTime.toLocaleString("en-US", {
								hour: "numeric",
								minute: "numeric",
								hour12: true
							})
						} else currTime = time
		
						msgTime.textContent = currTime

						let msgReply = document.createElement("div")
						msgReply.classList += "msg-reply"
						if (replyCount == 0) msgReply.textContent = "Reply"
						else if (replyCount ==1 ) msgReply.textContent = replyCount+' Reply'
						else msgReply.textContent = replyCount+' Replies'
						msgReply.setAttribute("msg-id", msgId)
						msgReply.id = msgId
		
						holder.append(msgBy)
						holder.append(chatMessageText)
						if (msgId != null & msgId != '') holder.appendChild(msgReply)
						holder.appendChild(msgTime)
		
						document
							.getElementsByClassName("chat-area")[0]
							.appendChild(holder)
						var objDiv = document.getElementsByClassName("chat-area")[0]
						objDiv.scrollTop = objDiv.scrollHeight
					}

					function sendThread(
						message = null,
						time = null,
						from = "",
						sendToApi = true,
						type = "text",
						msgId,
						threadId
					) {
						const textEl = document.getElementById("thread-area")
						var str = message
						if (!str) {
							str = textEl.value
						}
		
						if (str) {
							const holder = document.createElement("div")
							holder.classList += "code-block-input threadMessage sent"
		
							const msgBy = document.createElement("div")
							msgBy.classList += "by"
							msgBy.textContent = from
		
							const chatMessageText = document.createElement("div")
							chatMessageText.classList += "threadMessage-text"
							chatMessageText.textContent = str
		
							const msgTime = document.createElement("div")
							msgTime.classList += "msg-time"
		
							var currTime
							if (!time) {
								var currTime = new Date()
								let dateDisplay = currTime.toDateString().split(' ').slice(1,3).join(' ')
								currTime = currTime.toLocaleString("en-US", {
									hour: "numeric",
									minute: "numeric",
									hour12: true
								})
								dateDisplay = dateDisplay+' '+ currTime
								currTime = dateDisplay
							} else currTime = time
		
							msgTime.textContent = currTime

							holder.append(msgBy)
							holder.append(chatMessageText)
							holder.appendChild(msgTime)
		
							document
								.getElementsByClassName("thread-area")[0]
								.appendChild(holder)
							var objDiv = document.getElementsByClassName("thread-area")[0]
							objDiv.scrollTop = objDiv.scrollHeight
		
							if (sendToApi) {
								postMessage({
									command: "sendMessage",
									message: str,
									time: currTime,
									msgId: msgId,
									parentId: threadId
								})
								let msgReplyElement = document.getElementById(threadId)
								let replyCount = msgReplyElement.innerHTML.split(' Repl')[0]
								if (replyCount == 'Reply') replyCount = 0
								replyCount = parseInt(replyCount);
								replyCount+=1
								if (replyCount == 1) msgReplyElement.innerHTML = '1 Reply'
								else if (replyCount > 1) msgReplyElement.innerHTML = replyCount+' Replies'
							}
							textEl.value = ""
						}
					}

					function createNewRoom(){
						const objToSend = {command: "createNewRoom"}
						const con = document.getElementById("connection-input").value
						if(con){
							objToSend["roomId"] = con
						}
						postMessage(objToSend)
					}

					function inviteUser(){
						const user = document.querySelector(".invite-input").value
						if(user){
							postMessage({command: "inviteUser", user})
						}
					}
					
					function connectToRoom(){
						const conEl = document.getElementById("connection-input")
						const conName = conEl.value

						if(conName){
							postMessage({
								command: 'connectToRoom',
								message: conName
							})
						}
					}
					function disconnectFromRoom(){
						postMessage({
							command: 'disconnectFromRoom'
						})
						resetRoom()
						showLobby()
					}
					function login(){
						postMessage({
							command: 'loginUser'
						})
					}

					function addChatNotification(str){
						
					}

					function addRoomToLobby(roomId, badgeCount = 0) {
						const holder = document.querySelector(".chats-holder")
		
						const chat = document.createElement("div")
						chat.classList.add("chat")
						chat.setAttribute("data-id", roomId)
		
						
		
						const head = document.createElement("div")
						head.classList.add("head")
		
						const roomName = document.createElement("div")
						roomName.classList.add("room-name")
						roomName.textContent = "#" + roomId
		
						const badge = document.createElement("span")
						badge.classList.add("numb")
		
						if (badgeCount > 0) {
							badge.textContent = badgeCount
						}
		
						head.appendChild(roomName)
						head.appendChild(badge)
		
						
						chat.appendChild(head)
		
						holder.appendChild(chat)
					}

					function changeActiveChat(roomId){
						resetRoom()
						postMessage({
							command: "changeActiveChat",
							roomId
						})
					}

					function createInviteForm(){
						postMessage("create invite form")
						document.querySelector(".invite-form").innerHTML = ""
						const input = document.createElement("input")
						input.classList.add("input-styles")
						input.classList.add("invite-input")
						input.setAttribute("placeholder", "email")

						const btn = document.createElement("button")
						btn.classList.add("btn-default")
						btn.classList.add("invite-btn")
						btn.textContent = "Invite"
						
						document.querySelector(".invite-form").appendChild(input)
						document.querySelector(".invite-form").appendChild(btn)
					}

					function resetRoom(){
						document.querySelector(".invite-form").innerHTML = ""
						document.querySelector(".chat-area").innerHTML = ""
					}

					function showLobby(){
						document.querySelector(".chat-connected").classList.remove("active")
						document.querySelector(".lobby").classList.add("active")
						changeActiveChat(null)
					}

					function countReplies(parentId, messages){
						let count = 0;
						messages.forEach(message => {
							if (message.parentId == parentId) count +=1
						})
						return count
					}

					window.addEventListener('message', event => {
						const data = event.data;
						postMessage("in webview: "+data.command)
						if(data.command === "recieveVscodeMessage"){
							if (data.parentId==''){
								recieveMessage(data.message, data.from, data.time, data.msgId, data.parentId)
							}else{
								if (document.querySelector(".thread-connected")){
									let threadId = document.querySelector(".thread-connected").getAttribute("thread-id")
									if (data.parentId == threadId) {
										sendThread(data.message, data.time, data.from, false, "text", data.msgId, data.parentId)
									}
								}
							}
						}
						else if(data.command === "userJoinedRoom"){
							addChatNotification(data.user + " has joined the chat")
							document.querySelector(".users-count").textContent = data.userCount+" user"

							document.getElementsByClassName("error-message")[0].textContent = ""
							document.getElementsByClassName("lobby")[0].classList.remove("invalid")
						}
						else if(data.command === "userLeftRoom"){
							addChatNotification(data.user + " has left the chat")
							document.querySelector(".users-count").textContent = data.userCount+" user"
						} 
						else if(data.command === "setUserCount"){
							userCount = data.userCount
							document.querySelector(".users-count").textContent = userCount+" user"
						}
						else if(data.command === "roomTaken"){
							document.getElementsByClassName("error-message")[0].textContent = data.message
							document.getElementsByClassName("lobby")[0].classList.add("invalid")
						}
						else if(data.command === "setUserName"){
							username = data.username
						}
						else if(data.command === "addRoomToLobby"){
							addRoomToLobby(data.roomId)
						}
						else if(data.command === "updateBadges"){
							const roomId = data.roomId
							const chats = document.querySelectorAll(".chat")
							chats.forEach((chat)=>{
								if(chat.getAttribute("data-id") === roomId){
									if(data.badge === 0){
										chat.querySelector(".numb").textContent = ""
									}else{
										chat.querySelector(".numb").textContent = data.badge
									}
								}
							})
							document.querySelector(".chat-back .badge").textContent = data.totalCount
						}
						else if(data.command === "flipRoomStatus"){
							
						}
						else if(data.command === "setRoomAdmin"){
							//createInviteForm()
						} 
						else if(data.command === "initializeChat"){
							document.querySelector(".chat-connected").classList.add("active")
							document.querySelector(".lobby").classList.remove("active")
							document.querySelector(".thread-connected").classList.remove("active")
							document.querySelector(".room-id").textContent = "#"+data.roomId
							const messages = data.chatState.messages
							if(messages){
								messages.forEach((el)=>{
									if(el.type === "message" && el.parentId == ''){
										if(el.by === username){
											let replyCount = countReplies(el.msgId, messages)
											sendMessage(el.message, el.time, false, "text", el.msgId, replyCount)
										}
										else{
											let msgId = ''
											if (el.msgId != undefined) msgId = el.msgId
											let replyCount = countReplies(msgId, messages)
											recieveMessage(el.message, el.by, el.time, msgId, '', replyCount)
										}
									} else if (el.type === "join"){
										addChatNotification(el.by + " has joined the chat")
									} else if(el.type === "leave"){
										addChatNotification(el.by + " has left the chat")
									}
								})

								
								document.querySelector(".users-count").textContent = data.chatState.userCount+ " user"

								// console.log("here is the data")
								// console.log(data)
								if(data.chatState.admins.includes(data.currId)){
									//createInviteForm()
								}
								
								postMessage({command: "removeBadge", roomId: data.roomId})
							}
						}
						else if(data.command === "initializeThread"){
							document.querySelector(".thread-connected").classList.add("active")
							document.querySelector(".chat-connected").classList.remove("active")
							document.querySelector(".lobby").classList.remove("active")
							document.querySelector(".thread-id").textContent = "#"+data.roomId+' Thread'
							const messages = data.chatState.messages
							let threadId = data.threadId
							if(messages){
								messages.forEach((el)=>{
									if (el.msgId == data.threadId){//display the post
										sendThread(el.message, el.time, el.by, false, "text", el.msgId, data.threadId)
										// sendThread(null, null, true,"text", msgId, data.threadId)
									} else if(el.parentId == data.threadId ) {
										sendThread(el.message, el.time, el.by, false, "text", el.msgId, data.threadId)
										// sendThread(el.message, el.time, false, data.threadId)
									}
								})
							}
							document.querySelector(".thread-connected").setAttribute("thread-id", threadId)
						}
						else if(data.command === "initLobby"){

							document.querySelector(".chats-holder").innerHTML = ""
							const chats = data.data

							for(var key in chats){
								addRoomToLobby(key, chats[key])
							}
						}
						else if(data.command === "showInviteForm"){
							//createInviteForm()
						}
					});

					postMessage({command:"getUserName"})
					postMessage({command: "init"})
				}())
				</script>
			</body>
			</html>
		`
		} else {
			//load the code autocomplete status
			let ccStatus = "Enable"
			if (_.globalState.get("extensionStatus")) ccStatus = "Disable"
			return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<title>Blackbox View Test</title>

				<link href="${stylesSrc}" type="text/css" rel="stylesheet"/>
			</head>
			<body>
				<style>
					.btn-holder {
						display: flex;
						justify-content: center;
						gap: 10px;
					}

					.btn-default {
						padding: 7px;
						border: 0;
						background-color: rgb(14, 99, 156);
						color: #fff;
						border-radius: 2px;
						cursor: pointer;
						text-align: center;
					}
					.btn-default:hover {
						background-color: rgba(17, 119, 187);
					}
					.text-description{
						color: #CCCCCC
					}

					* {
						padding: 0;
						margin: 0;
						box-sizing: border-box;
					}
			
					.input-style {
						width: 100%;
						margin: 10px 0;
						outline: none;
						border: 0;
						background-color: #ffffff17;
						padding: 5px;
						color: #fff;
					}
					.CodeMirror {
						height: auto;
						background-color: transparent !important;
					}
					.CodeMirror-gutters {
						background-color: transparent !important;
						border-right: 0 !important;
					}
					.CodeMirror-linenumbers {
						padding-right: 20px;
					}
					.page-holder{
						display:none;
					}
					.page-holder.active{
						display:block
					}
					.result-holder{
						border-bottom: 1px solid #5656564d;
						margin-bottom: 47px;
					}
					.highlight {
						background-color: orange;
					}
				</style>
				<p class='text-description'>All Features</p>
				<l class='text-description'>
					1. Code Autocomplete<br><br>
					<div>
					<div class="btn-default btn-features">
						<span class="btn-features">${ccStatus} Code Autocomplete</span>
					</div>
				</div>
					2. Repo Search<br><br>
					<div class="btn-default btn-code-search-holder">
						<span class="btn-code-search">Blackbox Repo Search</span>
					</div>
					3. Blackbox Saved Snippets<br><br>
					<div class="btn-default btn-history-search-holder">
						<span class="btn-history-search">Open Saved Snippets</span>
					</div>
					Open Quick Start Guide<br><br>
					<div class="btn-default btn-search">
						<span class="btn-search">Tutorial</span>
					</div>
				</l>
				<br><br>
				<div style="display: none;">
					<br><br>
					<p class='text-description'>Blackbox COMMS is built to connect developers. Post your questions in one of these groups and other developers will be reading your questions and responding.</p>
					<p class="text-description"> Get access to Blackbox COMMS.</p>
					<div class="btn-default btn-chat">
						<span class="btn-chat">Enable</span>
					</div>
				</div>
				<script src="https://code.jquery.com/jquery-3.6.3.js" integrity="sha256-nQLuAZGRRcILA+6dMBOvcRh5Pe310sBpanc6+QBmyVM=" crossorigin="anonymous"></script>
				<script>
					(function() {
						const vscode = acquireVsCodeApi();
								
						function postMessage(obj){
							vscode.postMessage(obj)
						}
						document.addEventListener("click", (e)=>{
							if(e.target.classList.contains("btn-features") ) {
								console.log('===>', e.target.innerText)
								if (e.target.innerText == 'Enable Code Autocomplete'){
									postMessage({command: "features-enable"})
									e.target.innerText = 'Disable Code Autocomplete'
								}else if (e.target.innerText == 'Disable Code Autocomplete'){
									postMessage({command: "features-disable"})
									e.target.innerText = 'Enable Code Autocomplete'
								}
							}
							else if(e.target.classList.contains("btn-search") ) postMessage({command: "search"})
							else if(e.target.classList.contains("btn-chat") ) postMessage({command: "chatEnable"})
						})

						$(document).on("click", ".btn-code-search-holder", function(){
							postMessage({command:"showCodeSearch"})
						})
						$(document).on("click", ".btn-history-search-holder", function(){
							postMessage({command:"showHistorySearch"})
						})
					}())
				</script>
			</body>
			</html>
		`
		}
	}
}
exports.activate = activate
