const textareaEl = document.getElementById("textarea")
const buttonEl = document.getElementById("button")
async function submit() {
    // Local, so pressing Submit twice doesn't download every team twice
    const teams = []
    const textareaElValue = textareaEl.value
    const textAreaElValueSplit = textareaElValue.split(/\r?\n/)
    for (let i = 0; i < textAreaElValueSplit.length; i++) {
        if (!textAreaElValueSplit[i].trim()) continue

        const textAreaElValueSplitSplit = textAreaElValueSplit[i].split("\t").map(cell => cell.trim())
        const cell = index => textAreaElValueSplitSplit[index] ?? ""
        const player = index => {
            if (!cell(index)) return

            return {
                "name": cell(index),
                "rank": cell(index + 8),
                "nm1Score": Number(cell(index + 16)),
                "nm2Score": Number(cell(index + 24)),
                "nm3Score": Number(cell(index + 32)),
                "nm4Score": Number(cell(index + 40)),
                "nm5Score": Number(cell(index + 48)),
                "hd1Score": Number(cell(index + 56)),
                "hd2Score": Number(cell(index + 64)),
                "hr1Score": Number(cell(index + 72)),
                "hr2Score": Number(cell(index + 80)),
                "dt1Score": Number(cell(index + 88)),
                "dt2Score": Number(cell(index + 96)),
                "dt3Score": Number(cell(index + 104))
            }
        }
        const team = index => {
            if (!cell(index)) return

            return {
                "score": Number(cell(index)),
                "rank": Number(cell(index + 12))
            }
        }
        const teamDetails = {
            "teamName": cell(0),
            "ISO3166Alpha2": cell(1).toUpperCase(),
            "seed": Number(cell(2)),
            "lastYearSeed": Number(cell(3)),
            "lastYearPlacement": Number(cell(4)),
            "player1": player(5),
            "player2": player(6),
            "player3": player(7),
            "player4": player(8),
            "player5": player(9),
            "player6": player(10),
            "player7": player(11),
            "player8": player(12),
            "teamData": {
                "nm1":team(117),
                "nm2":team(118),
                "nm3":team(119),
                "nm4":team(120),
                "nm5":team(121),
                "hd1":team(122),
                "hd2":team(123),
                "hr1":team(124),
                "hr2":team(125),
                "dt1":team(126),
                "dt2":team(127),
                "dt3":team(128)
            }
        }
        teams.push(teamDetails)
    }

    const jsonString = JSON.stringify(teams, null, 4)
    const blob = new Blob([jsonString], { type: "application/json" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "team-stats.json"
    link.click()
}

window.onload = () => {
    buttonEl.addEventListener("click", submit)
}