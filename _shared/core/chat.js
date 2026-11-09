/**
 * This updates the chat, based on the current chat length. If the chat length doesnt exist, or the chat length is greater than the actual chat length, all the previous chat gets cleared and the new chat information gets passed through.
 * This is mostly taken from Victim Crasher, adapted to jQuery: https://github.com/VictimCrasher/static/tree/master/WaveTournament
 * @param {number} chatLen - current length of the chat
 * @param {object} chatData - all of the chat information
 * @param {$element} $chatContainer - jquery chat container element
 * @returns 
 */
export function updateChat(chatLen, chatData, $chatContainer) {    
    // This is also mostly taken from Victim Crasher: https://github.com/VictimCrasher/static/tree/master/WaveTournament
    if (chatLen !== chatData.length) {
        if (!chatLen || chatLen > chatData.length) {
            $chatContainer.empty()
            chatLen = 0
        }

        let $messages = $()

        for (let i = chatLen; i < chatData.length; i++) {
            const { team, name, message } = chatData[i]

            const $wrapper = $("<div>", { class: "chat-message-wrapper" }).append(
                $("<span>", { class: `chat-name ${team}`, text: `${name}:` }),
                $("<span>", { class: "message-content", text: message })
            )

            $messages = $messages.add($wrapper)
        }

        $chatContainer.append($messages)
        chatLen = chatData.length
        $chatContainer.scrollTop($chatContainer[0].scrollHeight)
    }

    return chatLen
}