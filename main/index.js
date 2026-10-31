import { loadBeatmaps, findBeatmap } from "../_shared/core/beatmaps.js"
import { loadTeams, findTeam } from "../_shared/core/teams.js"
import { delay, getModDetails, setLengthDisplay } from "../_shared/core/utils.js"
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
let allTeams
loadTeams().then(teams => { allTeams = teams })
let currentTeamNameLeft, currentTeamNameRight

/**
 * Updates the team display elements on the page.
 * @param {string} teamName - The name of the team.
 * @param {string} side - Either "left" or "right".
 * @returns {string|null} The updated team name or null if team not found.
 */
function setTeamDetails(teamName, side) {
    const currentTeam = findTeam(teamName)
    if (!currentTeam) return null

    $(`#team-seed-${side}`).text(`#${currentTeam.seed}`)
    $(`#team-flag-${side}`).attr("src", `https://osuflags.omkserver.nl/${currentTeam.ISO3166Alpha2}-1000.png`)
    $(`#team-name-${side}`).text(teamName)
}

// Now Playing
const nowPlayingBackgroundEl = $("#now-playing-background")
const nowPlayingArtistEl = $("#now-playing-artist")
const nowPlayingTitleEl = $("#now-playing-title")
const nowPlayingDifficultyEl = $("#now-playing-difficulty")
const nowPlayingMapperEl = $("#now-playing-mapper")
const nowPlayingBottomLeftVectorEl = $("#now-playing-bottom-left-vector")
const nowPlayingModEl = $("#now-playing-mod")
let currentNowPlayingId, currentNowPlayingChecksum, currentMappoolBeatmap

// Now Playing Stats — FIXED: Added missing '#' characters
const nowPlayingStatsTextCsEl = $("#now-playing-stats-text-cs")
const nowPlayingStatsTextArEl = $("#now-playing-stats-text-ar")
const nowPlayingStatsTextHpEl = $("#now-playing-stats-text-hp")
const nowPlayingStatsTextOdEl = $("#now-playing-stats-text-od")
const nowPlayingStatsLineSrEl = $("#now-playing-stats-line-sr")
const nowPlayingStatsLineBpmEl = $("#now-playing-stats-line-bpm")
const nowPlayingStatsLineLenEl = $("#now-playing-stats-line-len")
let updateStats, currentTime

// Scores
const scoreBarLeftEl = $("#score-bar-left")
const scoreBarRightEl = $("#score-bar-right")
const scoreLeftEl = $("#score-left")
const scoreRightEl = $("#score-right")
const animations = {
    scoreLeft: new CountUp(scoreLeftEl[0], 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: ".", suffix: ""}),
    scoreRight: new CountUp(scoreRightEl[0], 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: ".", suffix: ""}),
}
let currentScoreLeft, currentScoreRight

// Socket
const socket = createTosuWsSocket()
const $socketHub = $(socket)

$socketHub.on("message", async event => {
    const data = JSON.parse(event.originalEvent.data)
    console.log(data)

    const teamNames = data.tourney.team
    if (currentTeamNameLeft !== teamNames.left && allTeams) {
        setTeamDetails(teamNames.left, "left")
        currentTeamNameLeft = teamNames.left
    }
    if (currentTeamNameRight !== teamNames.right && allTeams) {
        setTeamDetails(teamNames.right, "right")
        currentTeamNameRight = teamNames.right
    }

    // Now Playing Data
    const beatmapData = data.beatmap
    if (currentNowPlayingId !== beatmapData.id || currentNowPlayingChecksum !== beatmapData.checksum) {
        currentNowPlayingId = beatmapData.id
        currentNowPlayingChecksum = beatmapData.checksum
        updateStats = false

        const background = data.directPath?.beatmapBackground
        const url = `${window.location.origin}/Songs/${background}`
        nowPlayingBackgroundEl.css("background-image", `url("${encodeURI(url.replaceAll("\\", "/"))}")`)
        nowPlayingArtistEl.text(beatmapData.artist)
        nowPlayingTitleEl.text(beatmapData.title)
        nowPlayingDifficultyEl.text(beatmapData.version)
        nowPlayingMapperEl.text(beatmapData.mapper)

        currentMappoolBeatmap = findBeatmap(currentNowPlayingId)
        if (currentMappoolBeatmap) {
            nowPlayingBottomLeftVectorEl.attr("src", `static/vectors/${currentMappoolBeatmap.mod}-vector.png`)
            nowPlayingModEl.text(`${currentMappoolBeatmap.mod}${currentMappoolBeatmap.order}`)

            const stats = getModDetails(
                Number(currentMappoolBeatmap.diff_size),
                Number(currentMappoolBeatmap.diff_approach),
                Number(currentMappoolBeatmap.diff_overall),
                Number(currentMappoolBeatmap.diff_drain),
                Number(currentMappoolBeatmap.bpm),
                Number(currentMappoolBeatmap.total_length),
                currentMappoolBeatmap.mod
            )

            nowPlayingStatsTextCsEl.text(stats.cs.toFixed(1))
            nowPlayingStatsTextArEl.text(stats.ar.toFixed(1))
            nowPlayingStatsTextHpEl.text(stats.hp.toFixed(1))
            nowPlayingStatsTextOdEl.text(stats.od.toFixed(1))
            nowPlayingStatsLineSrEl.text(Number(currentMappoolBeatmap.difficultyrating).toFixed(2))
            nowPlayingStatsLineBpmEl.text(stats.bpm.toFixed(0))
            nowPlayingStatsLineLenEl.text(setLengthDisplay(stats.len))
        } else {
            nowPlayingBottomLeftVectorEl.attr("src", "static/vectors/NO-vector.png")
            nowPlayingModEl.text(``)

            currentTime = Date.now()
            updateStats = true
        }
    }

    const statsData = beatmapData.stats
    if (updateStats && Date.now() > 250 + currentTime) {
        updateStats = false
        nowPlayingStatsTextCsEl.text(statsData.cs.converted.toFixed(1))
        nowPlayingStatsTextArEl.text(statsData.ar.converted.toFixed(1))
        nowPlayingStatsTextHpEl.text(statsData.hp.converted.toFixed(1))
        nowPlayingStatsTextOdEl.text(statsData.od.converted.toFixed(1))
        nowPlayingStatsLineSrEl.text(statsData.stars.total.toFixed(2))
        nowPlayingStatsLineBpmEl.text(statsData.bpm.common.toFixed(0))
        nowPlayingStatsLineLenEl.text(setLengthDisplay(Math.round((beatmapData.time.lastObject - beatmapData.time.firstObject) / 1000)))
    }

    // Scores
    currentScoreLeft = 0
    currentScoreRight = 0

    const clients = data.tourney.clients
    for (let i = 0; i < clients.length; i++) {
        const client = clients[i]
        let score = client.play.score
        if (currentMappoolBeatmap &&
            currentMappoolBeatmap.mod === "FM" &&
            client.mods.name.includes("EZ") &&
            currentMappoolBeatmap.EZMultiplier
        ) {
            score *= currentMappoolBeatmap.EZMultiplier
        }
        if (client.team === "left") currentScoreLeft += score
        else currentScoreRight += score
    }

    animations.scoreLeft.update(currentScoreLeft)
    animations.scoreRight.update(currentScoreRight)

    if (currentScoreLeft > currentScoreRight) {
        scoreLeftEl.addClass("score-lead")
        scoreRightEl.removeClass("score-lead")
    } else if (currentScoreLeft === currentScoreRight) {
        scoreLeftEl.removeClass("score-lead")
        scoreRightEl.removeClass("score-lead")
    } else if (currentScoreLeft < currentScoreRight) {
        scoreLeftEl.removeClass("score-lead")
        scoreRightEl.addClass("score-lead")  
    }
})
