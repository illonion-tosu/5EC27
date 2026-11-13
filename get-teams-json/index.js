const $textarea = $("#textarea")
const $button = $("#button")

/**
 * Submit teams data
 */
async function submit() {
    // Local, so pressing Submit twice doesn't download every team twice
    const teams = []
    const lines = $textarea.val().split(/\r?\n/)
    for (let i = 0; i < lines.length; i++) {
        if (!lines[i].trim()) continue

        const cells = lines[i].split("\t").map(cell => cell.trim())
        const cell = index => cells[index] ?? ""
        const player = index => {
            if (!cell(index)) return

            return {
                "id": Number(cell(index)),
                "name": cell(index + 1)
            }
        }
        const teamDetails = {
            "teamName": cell(0),
            "ISO3166Alpha2": cell(1).toUpperCase(),
            "seed": Number(cell(2)),
            "player1": player(3),
            "player2": player(5),
            "player3": player(7),
            "player4": player(9),
            "player5": player(11),
            "player6": player(13),
            "player7": player(15),
            "player8": player(17),
        }
        teams.push(teamDetails)
    }

    const jsonString = JSON.stringify(teams, null, 4)
    const blob = new Blob([jsonString], { type: "application/json" })
    const $link = $("<a>", { href: URL.createObjectURL(blob), download: "teams.json" })
    $link[0].click()
}

/**
 * Load event listener
 */
$(window).on("load", () => {
    $button.on("click", submit)
})