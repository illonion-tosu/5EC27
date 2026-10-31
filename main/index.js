import { loadBeatmaps, findBeatmap } from "../_shared/core/beatmaps.js"
import { loadTeams, findTeam } from "../_shared/core/teams.js"
import { getModDetails, setLengthDisplay } from "../_shared/core/utils.js"
import { createTosuWsSocket } from "../_shared/core/websocket.js"

// Rounds and beatmaps
const roundNameEl = $("#round-name")
loadBeatmaps().then(beatmaps => {
    roundNameEl.text(beatmaps.roundName)
})

// Teams
let allTeams
loadTeams().then(teams => { allTeams = teams })
let currentTeamNameLeft, currentTeamNameRight

/**
 * Updates the team display elements (seed, flag, name) for one side
 * @param {string} teamName - The team name as reported by the tourney client
 * @param {"left"|"right"} side - Which side of the overlay to update
 * @returns {string|null} The team name if the team was found, otherwise null
 */
function setTeamDetails(teamName, side) {
    const currentTeam = findTeam(teamName)
    if (!currentTeam) return null

    $(`#team-seed-${side}`).text(`#${currentTeam.seed}`)
    $(`#team-flag-${side}`).attr("src", `https://osuflags.omkserver.nl/${currentTeam.ISO3166Alpha2}-1000.png`)
    $(`#team-name-${side}`).text(teamName)
    return teamName
}

/**
 * Refreshes both team panels if the team names have changed
 * Does nothing until the teams list has loaded
 * @param {{left: string, right: string}} teamNames - data.tourney.team
 */
function updateTeams(teamNames) {
    if (!allTeams) return

    if (currentTeamNameLeft !== teamNames.left) {
        setTeamDetails(teamNames.left, "left")
        currentTeamNameLeft = teamNames.left
    }
    if (currentTeamNameRight !== teamNames.right) {
        setTeamDetails(teamNames.right, "right")
        currentTeamNameRight = teamNames.right
    }
}

const nowPlayingBackgroundEl = $("#now-playing-background")
const nowPlayingArtistEl = $("#now-playing-artist")
const nowPlayingTitleEl = $("#now-playing-title")
const nowPlayingDifficultyEl = $("#now-playing-difficulty")
const nowPlayingMapperEl = $("#now-playing-mapper")
const nowPlayingBottomLeftVectorEl = $("#now-playing-bottom-left-vector")
const nowPlayingModEl = $("#now-playing-mod")

const nowPlayingStatsTextCsEl = $("#now-playing-stats-text-cs")
const nowPlayingStatsTextArEl = $("#now-playing-stats-text-ar")
const nowPlayingStatsTextHpEl = $("#now-playing-stats-text-hp")
const nowPlayingStatsTextOdEl = $("#now-playing-stats-text-od")
const nowPlayingStatsLineSrEl = $("#now-playing-stats-line-sr")
const nowPlayingStatsLineBpmEl = $("#now-playing-stats-line-bpm")
const nowPlayingStatsLineLenEl = $("#now-playing-stats-line-len")

const TOSU_STATS_DELAY = 250

let currentNowPlayingId
let currentNowPlayingChecksum
let currentMappoolBeatmap
let updateStats = false
let currentTime = 0

/**
 * Writes beatmap stats to the stats panel
 * @param {{cs: number, ar: number, hp: number, od: number, sr: number, bpm: number, len: number}} stats
 * `len` is the map length in seconds
 */
function renderStats(stats) {
    nowPlayingStatsTextCsEl.text(stats.cs.toFixed(1))
    nowPlayingStatsTextArEl.text(stats.ar.toFixed(1))
    nowPlayingStatsTextHpEl.text(stats.hp.toFixed(1))
    nowPlayingStatsTextOdEl.text(stats.od.toFixed(1))
    nowPlayingStatsLineSrEl.text(stats.sr.toFixed(2))
    nowPlayingStatsLineBpmEl.text(stats.bpm.toFixed(0))
    nowPlayingStatsLineLenEl.text(setLengthDisplay(stats.len))
}

/**
 * Updates the now-playing panel when the beatmap ID or checksum changes
 * Mappool maps use stats from the mappool (with mods applied)
 * other maps schedule a delayed read from tosu via `updateStats`
 * @param {Object} beatmapData - data.beatmap
 * @param {Object|undefined} directPath - data.directPath
 */
function updateNowPlaying(beatmapData, directPath) {
    if (currentNowPlayingId === beatmapData.id && currentNowPlayingChecksum === beatmapData.checksum) return

    currentNowPlayingId = beatmapData.id
    currentNowPlayingChecksum = beatmapData.checksum
    updateStats = false

    // Metadata
    const background = directPath?.beatmapBackground
    const url = `${window.location.origin}/Songs/${background}`
    nowPlayingBackgroundEl.css("background-image", `url("${encodeURI(url.replaceAll("\\", "/"))}")`)
    nowPlayingArtistEl.text(beatmapData.artist)
    nowPlayingTitleEl.text(beatmapData.title)
    nowPlayingDifficultyEl.text(beatmapData.version)
    nowPlayingMapperEl.text(beatmapData.mapper)

    // Check for mappool map
    currentMappoolBeatmap = findBeatmap(currentNowPlayingId)
    if (!currentMappoolBeatmap) {
        nowPlayingBottomLeftVectorEl.attr("src", "static/vectors/NO-vector.png")
        nowPlayingModEl.text("")

        currentTime = Date.now()
        updateStats = true
        return
    }

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

    renderStats({
        cs: stats.cs,
        ar: stats.ar,
        hp: stats.hp,
        od: stats.od,
        sr: Number(currentMappoolBeatmap.difficultyrating),
        bpm: stats.bpm,
        len: stats.len,
    })
}

/**
 * For maps outside the mappool, renders tosu's stats once TOSU_STATS_DELAY has passed
 * Runs only once per beatmap change
 * @param {Object} beatmapData - data.beatmap
 */
function updateTosuStats(beatmapData) {
    if (!updateStats || Date.now() <= currentTime + TOSU_STATS_DELAY) return
    updateStats = false

    const statsData = beatmapData.stats
    renderStats({
        cs: statsData.cs.converted,
        ar: statsData.ar.converted,
        hp: statsData.hp.converted,
        od: statsData.od.converted,
        sr: statsData.stars.total,
        bpm: statsData.bpm.common,
        len: Math.round((beatmapData.time.lastObject - beatmapData.time.firstObject) / 1000),
    })
}

// Scores
const scoreBarLeftEl = $("#score-bar-left")
const scoreBarRightEl = $("#score-bar-right")
const scoreLeftEl = $("#score-left")
const scoreRightEl = $("#score-right")

// Score Bar constants
const SCORE_BAR_MAX_WIDTH = 960
const SCORE_BAR_MAX_DIFFERENCE = 1_000_000
const SCORE_BAR_EXPONENT = 1.4

// CountUp
const countUpOptions = { useEasing: true, useGrouping: true, separator: ",", decimal: ".", suffix: "" }
const animations = {
    scoreLeft: new CountUp(scoreLeftEl[0], 0, 0, 0, 0.2, countUpOptions),
    scoreRight: new CountUp(scoreRightEl[0], 0, 0, 0, 0.2, countUpOptions),
}

/**
 * Sums each team's scores
 * On FM maps, EZ scores are multiplied by the map's EZMultiplier (a tournament rule, not a bug)
 * @param {Array<Object>} clients - data.tourney.clients
 * @param {Object|undefined} mappoolBeatmap - The current mappool entry, if any
 * @returns {{left: number, right: number}}
 */
function calculateTeamScores(clients, mappoolBeatmap) {
    const scores = { left: 0, right: 0 }
    const applyEZMultiplier = mappoolBeatmap?.mod === "FM" && mappoolBeatmap.EZMultiplier

    for (const client of clients) {
        let score = client.play.score
        if (applyEZMultiplier && client.mods.name.includes("EZ")) {
            score *= mappoolBeatmap.EZMultiplier
        }

        if (client.team === "left") scores.left += score
        else scores.right += score
    }

    return scores
}

/**
 * Resizes the score bars and toggles the `score-lead` class on the leading team
 * Leading score bar is shown
 * "score-lead" goes to whoever is leading
 * @param {number} left - Left team's total score
 * @param {number} right - Right team's total score
 */
function updateScoreBar(left, right) {
    const differencePercent = Math.min(Math.abs(left - right) / SCORE_BAR_MAX_DIFFERENCE, 1)
    const barWidth = Math.pow(differencePercent, SCORE_BAR_EXPONENT) * SCORE_BAR_MAX_WIDTH

    const leftLeads = left > right
    const rightLeads = right > left

    scoreBarLeftEl.css("width", `${leftLeads ? barWidth : 0}px`)
    scoreBarRightEl.css("width", `${rightLeads ? barWidth : 0}px`)

    scoreLeftEl.toggleClass("score-lead", leftLeads)
    scoreRightEl.toggleClass("score-lead", rightLeads)
}


// Socket
const socket = createTosuWsSocket()
$(socket).on("message", event => {
    const data = JSON.parse(event.originalEvent.data)

    // Teams
    updateTeams(data.tourney.team)

    // Now Playing + Stats
    updateNowPlaying(data.beatmap, data.directPath)
    updateTosuStats(data.beatmap)

    // Score
    const scores = calculateTeamScores(data.tourney.clients, currentMappoolBeatmap)
    animations.scoreLeft.update(scores.left)
    animations.scoreRight.update(scores.right)
    updateScoreBar(scores.left, scores.right)
})