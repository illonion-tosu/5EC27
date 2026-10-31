import { loadTeams, findTeam } from "../_shared/core/teams.js"
import { createTosuWsSocket } from "../_shared/core/websocket.js"

// Load Teams
let allTeams = []
loadTeams().then(teams => { allTeams = teams })
let currentTeamNameLeft, currentTeamNameRight

// Set up team info
function setTeamDetails(teamName, side) {
    const teamSeedEl = document.getElementById(`team-seed-${side}`)
    const teamFlagEl = document.getElementById(`team-flag-${side}`)
    const teamNameEl = document.getElementById(`team-name-${side}`)

    const currentTeam = findTeam(teamName)
    if (!currentTeam) return

    teamSeedEl.textContent = `#${currentTeam.seed}`
    teamFlagEl.setAttribute("src", `https://osuflags.omkserver.nl/${currentTeam.ISO3166Alpha2}-1000.png`)
    teamNameEl.textContent = teamName
    return teamName
}

const socket = createTosuWsSocket()
socket.onmessage = event => {
    const data = JSON.parse(event.data)
    console.log(data)

    // Team Info
    const teamNames = data.tourney.team
    if (currentTeamNameLeft !== teamNames.left && allTeams) {
        currentTeamNameLeft = setTeamDetails(teamNames.left, "left")
    }
    if (currentTeamNameRight !== teamNames.right && allTeams) {
        currentTeamNameRight = setTeamDetails(teamNames.right, "right")
    }
}