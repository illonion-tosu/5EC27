import { loadBeatmaps, loadTeams, findTeam } from "../_shared/core/data.js"
import { getCookie } from "../_shared/core/utils.js"

loadTeams()

// Elements
const $roundName = $("#round-name")
const $teamName = $("#team-name")
const $teamFlag = $("#team-flag")

// Variables
let previousTeam

// Roud Name
loadBeatmaps().then((beatmaps) => {
    $roundName.text(beatmaps.roundName)
})

// Set Team Data
setInterval(() => {
    const team = findTeam(getCookie("winnerTeam"))

    if (team && team !== previousTeam) {
        // Set team name and flag
        $teamName.text(team.teamName)
        $teamFlag.attr("src", `https://osuflags.omkserver.nl/${team.ISO3166Alpha2}-1000.png`)

        // Set player names
        for (let i = 0; i < 8; i++) {
            const player = team[`player${i + 1}`]
            $(`#player-name-${i + 1}`).text(player.name)
        }

        previousTeam = team
    }
}, 200)