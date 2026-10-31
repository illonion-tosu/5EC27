import { loadBeatmaps, findBeatmap } from "../_shared/core/beatmaps.js"
import { loadTeams, findTeam } from "../_shared/core/teams.js"
import { createTosuWsSocket } from "../_shared/core/websocket.js"

// Round Name
const roundNameEl = $("#round-name")

// All Beatmaps
let allBeatmaps

// Load beatmaps
loadBeatmaps().then(beatmaps => {
    roundNameEl.text(beatmaps.roundName)
    allBeatmaps = beatmaps.beatmaps
})

// Load Teams
let allTeams = []
loadTeams().then(teams => { allTeams = teams })
let currentTeamNameLeft, currentTeamNameRight

/**
 * Updates the team display elements on the page.
 * @param {string} teamName - The name of the team.
 * @param {string} side - Either "left" or "right".
 * @returns {string} The updated team name.
 */
function setTeamDetails(teamName, side) {
    const currentTeam = findTeam(teamName)
    if (!currentTeam) return

    $(`#team-seed-${side}`).text(`#${currentTeam.seed}`)
    $(`#team-flag-${side}`).attr("src", `https://osuflags.omkserver.nl/${currentTeam.ISO3166Alpha2}-1000.png`)
    $(`#team-name-${side}`).text(teamName)
    return teamName
}

// Socket
const socket = createTosuWsSocket()
const $socketHub = $(socket)

$socketHub.on("message", event => {
    const data = JSON.parse(event.originalEvent.data)
    console.log(data)

    // Team Info
    const teamNames = data.tourney.team
    if (currentTeamNameLeft !== teamNames.left && allTeams) {
        currentTeamNameLeft = setTeamDetails(teamNames.left, "left")
    }
    if (currentTeamNameRight !== teamNames.right && allTeams) {
        currentTeamNameRight = setTeamDetails(teamNames.right, "right")
    }
})