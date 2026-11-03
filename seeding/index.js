import { loadTeamStats, findTeamStats } from "../_shared/core/data.js";

// Load team stats
let allTeamStats
let currentIndex = 0
loadTeamStats().then(teamStats => {
    allTeamStats = teamStats
    allTeamStats = allTeamStats.sort((a, b) => {
        return b.seed - a.seed
    })

    displayData()
})

// Team information
const teamFlagEl = $("#team-flag")
const teamNameEl = $("#team-name")
const seedNumberEl = $("#seed-number")

// Last year information
const lastYearPlacementEl = $("#last-year-placement")
const lastYearSeedEl = $("#last-year-seed")

// Containers
const playerContainerEl = $("#player-container")
const rankContainerEl = $("#rank-container")
const nm1ScoresContainerEl = $("#nm1-scores-container")
const nm2ScoresContainerEl = $("#nm2-scores-container")
const nm3ScoresContainerEl = $("#nm3-scores-container")
const nm4ScoresContainerEl = $("#nm4-scores-container")
const nm5ScoresContainerEl = $("#nm5-scores-container")
const hd1ScoresContainerEl = $("#hd1-scores-container")
const hd2ScoresContainerEl = $("#hd2-scores-container")
const hr1ScoresContainerEl = $("#hr1-scores-container")
const hr2ScoresContainerEl = $("#hr2-scores-container")
const dt1ScoresContainerEl = $("#dt1-scores-container")
const dt2ScoresContainerEl = $("#dt2-scores-container")
const dt3ScoresContainerEl = $("#dt3-scores-container")

/**
 * Displays all of the data shown on the overlay
 */
function displayData() {
    const currentTeam = allTeamStats[currentIndex]

    // Team information
    teamFlagEl.attr("src", `https://osuflags.omkserver.nl/${currentTeam.ISO3166Alpha2}-1000.png`)
    teamNameEl.text(currentTeam.teamName)
    seedNumberEl.text(`#${currentTeam.seed}`)

    // Last Year Information
    lastYearPlacementEl.text(`#${currentTeam.lastYearPlacement}`)
    lastYearSeedEl.text(`#${currentTeam.lastYearSeed}`)

    // Set all information regarding the players
    for (let i = 0; i < 8; i++) {
        const currentPlayer = currentTeam[`player${i + 1}`]
        playerContainerEl.children().eq(i).text(currentPlayer.name)
        rankContainerEl.children().eq(i).text(currentPlayer.rank)
        nm1ScoresContainerEl.children().eq(i).text(currentPlayer.nm1Score.toLocaleString())
        nm2ScoresContainerEl.children().eq(i).text(currentPlayer.nm2Score.toLocaleString())
        nm3ScoresContainerEl.children().eq(i).text(currentPlayer.nm3Score.toLocaleString())
        nm4ScoresContainerEl.children().eq(i).text(currentPlayer.nm4Score.toLocaleString())
        nm5ScoresContainerEl.children().eq(i).text(currentPlayer.nm5Score.toLocaleString())
        hd1ScoresContainerEl.children().eq(i).text(currentPlayer.hd1Score.toLocaleString())
        hd2ScoresContainerEl.children().eq(i).text(currentPlayer.hd2Score.toLocaleString())
        hr1ScoresContainerEl.children().eq(i).text(currentPlayer.hr1Score.toLocaleString())
        hr2ScoresContainerEl.children().eq(i).text(currentPlayer.hr2Score.toLocaleString())
        dt1ScoresContainerEl.children().eq(i).text(currentPlayer.dt1Score.toLocaleString())
        dt2ScoresContainerEl.children().eq(i).text(currentPlayer.dt2Score.toLocaleString())
        dt3ScoresContainerEl.children().eq(i).text(currentPlayer.dt3Score.toLocaleString())
    }
}