import { loadTeamStats } from "../_shared/core/data.js";

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
const scoresSummary = $(".scores-summary")
const ALL_MOD_IDS = [ "nm1", "nm2", "nm3", "nm4", "nm5", "hd1", "hd2", "hr1", "hr2", "dt1", "dt2", "dt3" ]

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

    // Scores Summary
    for (let i = 0; i < scoresSummary.length; i++) {
        const scoresSumamryEl = scoresSummary.eq(i)
        const scoreSummaryChildren = scoresSumamryEl.children()
        const rankEl = scoreSummaryChildren.eq(0)
        const scoreEl = scoreSummaryChildren.eq(1)

        const teamRank = currentTeam.teamData[`${ALL_MOD_IDS[i]}`].rank

        // Set text
        rankEl.text(`#${teamRank}`)
        scoreEl.text(currentTeam.teamData[`${ALL_MOD_IDS[i]}`].score.toLocaleString())

        // Set class
        scoresSumamryEl.removeClass('scores-summary-third')
        scoresSumamryEl.removeClass('scores-summary-second')
        scoresSumamryEl.removeClass('scores-summary-first')

        switch(teamRank) {
            case 3:
                scoresSumamryEl.addClass('scores-summary-third')
                break
            case 2: 
                scoresSumamryEl.addClass('scores-summary-second')
                break
            case 1:
                scoresSumamryEl.addClass('scores-summary-first')
                break
        }
    }
}

// Buttons
const nextTeamEl = $("#next-team")
const previousTeamEl = $("#previous-team")

// When DOM is ready
$(function(){
    nextTeamEl.on("click", () => { clickEvent("plus") })
    previousTeamEl.on("click", () => { clickEvent("minus") })
})

/**
 * Adds or minuses 1 to the current index
 * If outside of allTeamStats length
 * Calls displayData
 * @param {*} action 
 */
function clickEvent(action) {
    if (action === "plus") currentIndex++
    else if (action === "minus") currentIndex--

    if (currentIndex < 0) currentIndex = allTeamStats.length - 1
    if (currentIndex === allTeamStats.length) currentIndex = 0

    displayData()
}