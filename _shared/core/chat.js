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
        console.log($chatContainer[0])
        $chatContainer.scrollTop($chatContainer[0].scrollHeight)
    }

    return chatLen
}