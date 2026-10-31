import { loadTeams, findTeam } from "../_shared/core/teams.js"
import { createTosuWsSocket } from "../_shared/core/websocket.js"

// Load Teams
let allTeams = []
loadTeams().then(teams => { allTeams = teams })
let currentTeamNameLeft, currentTeamNameRight

// Set up team info
function setTeamDetails(teamName, side) {
    const currentTeam = findTeam(teamName)
    if (!currentTeam) return

    $(`#team-seed-${side}`).text(`#${currentTeam.seed}`)
    $(`#team-flag-${side}`).attr("src", `https://osuflags.omkserver.nl/${currentTeam.ISO3166Alpha2}-1000.png`)
    $(`#team-name-${side}`).text(teamName)
    return teamName
}

const socket = createTosuWsSocket()
const $socketHub = $(socket)

$socketHub.on("message" = event => {
    const data = $.parseJSON(event.originalEvent.data)
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