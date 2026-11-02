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

/**
 * Displays all of the data shown on the overlay
 */
function displayData() {
    const currentTeam = allTeamStats[currentIndex]

    // Team information
    teamFlagEl.attr("src", `https://osuflags.omkserver.nl/${currentTeam.ISO3166Alpha2}-1000.png`)
    teamNameEl.text(currentTeam.teamName)
    seedNumberEl.text(`#${currentTeam.seed}`)

    lastYearPlacementEl.text(`#${currentTeam.lastYearPlacement}`)
    lastYearSeedEl.text(`#${currentTeam.lastYearSeed}`)
}