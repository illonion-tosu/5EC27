import { createTosuWsSocket } from "../_shared/core/websocket.js"

const teamSeedLeftEl = document.getElementById("team-seed-left")
const teamFlagLeftEl = document.getElementById("team-flag-left")
const teamNameLeftEl = document.getElementById("team-name-left")
const teamSeedRightEl = document.getElementById("team-seed-right")
const teamFlagRightEl = document.getElementById("team-flag-right")
const teamNameRightEl = document.getElementById("team-name-right")
let currentTeamNameLeft, currentTeamNameRight

// Set up team info
function setTeamDetails(teamName, side) {
    const teamSeedEl = document.getElementById(`team-seed-${side}`)
    const teamFlagEl = document.getElementById(`team-flag-${side}`)
    const teamNameEl = document.getElementById(`team-name-${side}`)
    return teamName
}

const socket = createTosuWsSocket()
socket.onmessage = event => {
    const data = JSON.parse(event.data)
    console.log(data)

    // Team Info
    const teamNames = data.tourney.team
    if (currentTeamNameLeft !== teamNames.left) {
        currentTeamNameLeft = setTeamDetails(teamNames.left, "left")
    }
    if (currentTeamNameRight !== teamNames.right) {
        currentTeamNameRight = setUpTeamInfo(teamNames.right, "left")
    }
}