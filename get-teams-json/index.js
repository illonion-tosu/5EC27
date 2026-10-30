const textareaEl = document.getElementById("textarea")
const buttonEl = document.getElementById("button")
async function submit() {
    // Local, so pressing Submit twice doesn't download every team twice
    const teams = []
    const textareaElValue = textareaEl.value
    const textAreaElValueSplit = textareaElValue.split(/\r?\n/)
    for (let i = 1; i < textAreaElValueSplit.length; i++) {
        if (!textAreaElValueSplit[i].trim()) continue

        const textAreaElValueSplitSplit = textAreaElValueSplit[i].split("\t").map(cell => cell.trim())
        const cell = index => textAreaElValueSplitSplit[index] ?? ""
        const teamDetails = {
            "teamName": cell(0),
            "ISO3166Alpha2": cell(1).toUpperCase(),
            "seed": Number(cell(2)),
            "player1Name": cell(3),
            "player2Name": cell(4),
            "player3Name": cell(5),
            "player4Name": cell(6),
            "player5Name": cell(7),
            "player6Name": cell(8),
            "player7Name": cell(9),
            "player8Name": cell(10),
        }
        teams.push(teamDetails)
    }

    const jsonString = JSON.stringify(teams, null, 4)
    const blob = new Blob([jsonString], { type: "application/json" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "teams.json"
    link.click()
}

window.onload = () => {
    buttonEl.addEventListener("click", submit)
}