import { loadBeatmaps, findBeatmap, loadTeams, findTeam } from "../_shared/core/data.js"
import { getModDetails, setLengthDisplay } from "../_shared/core/utils.js"
import { createTosuWsSocket } from "../_shared/core/websocket.js"
import { renderStars, toggleStarContainers } from "../_shared/core/stars.js"

// Rounds and beatmaps
const $roundName = $("#round-name")
loadBeatmaps().then(beatmaps => {
    $roundName.text(beatmaps.roundName)
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

const $nowPlayingBackground = $("#now-playing-background")
const $nowPlayingArtist = $("#now-playing-artist")
const $nowPlayingTitle = $("#now-playing-title")
const $nowPlayingDifficulty = $("#now-playing-difficulty")
const $nowPlayingMapper = $("#now-playing-mapper")
const $nowPlayingBottomLeftVector = $("#now-playing-bottom-left-vector")
const $nowPlayingMod = $("#now-playing-mod")

const $nowPlayingStatsTextCs = $("#now-playing-stats-text-cs")
const $nowPlayingStatsTextAr = $("#now-playing-stats-text-ar")
const $nowPlayingStatsTextHp = $("#now-playing-stats-text-hp")
const $nowPlayingStatsTextOd = $("#now-playing-stats-text-od")
const $nowPlayingStatsLineSr = $("#now-playing-stats-line-sr")
const $nowPlayingStatsLineBpm = $("#now-playing-stats-line-bpm")
const $nowPlayingStatsLineLen = $("#now-playing-stats-line-len")

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
    $nowPlayingStatsTextCs.text(stats.cs.toFixed(1))
    $nowPlayingStatsTextAr.text(stats.ar.toFixed(1))
    $nowPlayingStatsTextHp.text(stats.hp.toFixed(1))
    $nowPlayingStatsTextOd.text(stats.od.toFixed(1))
    $nowPlayingStatsLineSr.text(stats.sr.toFixed(2))
    $nowPlayingStatsLineBpm.text(stats.bpm.toFixed(0))
    $nowPlayingStatsLineLen.text(setLengthDisplay(stats.len))
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
    $nowPlayingBackground.css("background-image", `url("${encodeURI(url.replaceAll("\\", "/"))}")`)
    $nowPlayingArtist.text(beatmapData.artist)
    $nowPlayingTitle.text(beatmapData.title)
    $nowPlayingDifficulty.text(beatmapData.version)
    $nowPlayingMapper.text(beatmapData.mapper)

    // Check for mappool map
    currentMappoolBeatmap = findBeatmap(currentNowPlayingId)
    if (!currentMappoolBeatmap) {
        $nowPlayingBottomLeftVector.attr("src", "static/vectors/NO-vector.png")
        $nowPlayingMod.text("")

        currentTime = Date.now()
        updateStats = true
        return
    }

    $nowPlayingBottomLeftVector.attr("src", `static/vectors/${currentMappoolBeatmap.mod}-vector.png`)
    $nowPlayingMod.text(`${currentMappoolBeatmap.mod}${currentMappoolBeatmap.order}`)

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
const $scoreBarLeft = $("#score-bar-left")
const $scoreBarRight = $("#score-bar-right")
const $scoreLeft = $("#score-left")
const $scoreRight = $("#score-right")

// Score Bar constants
const SCORE_BAR_MAX_WIDTH = 960
const SCORE_BAR_MAX_DIFFERENCE = 1_000_000
const SCORE_BAR_EXPONENT = 1.4

// CountUp
const countUpOptions = { useEasing: true, useGrouping: true, separator: ",", decimal: ".", suffix: "" }
const animations = {
    scoreLeft: new CountUp($scoreLeft[0], 0, 0, 0, 0.2, countUpOptions),
    scoreRight: new CountUp($scoreRight[0], 0, 0, 0, 0.2, countUpOptions),
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

    $scoreBarLeft.css("width", `${leftLeads ? barWidth : 0}px`)
    $scoreBarRight.css("width", `${rightLeads ? barWidth : 0}px`)

    $scoreLeft.toggleClass("score-lead", leftLeads)
    $scoreRight.toggleClass("score-lead", rightLeads)
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

const $teamStarContainerLeft = $("#team-star-container-left")
const $teamStarContainerRight = $("#team-star-container-right")
setInterval(() => {
    renderStars($teamStarContainerLeft, $teamStarContainerRight)
    toggleStarContainers($teamStarContainerLeft, $teamStarContainerRight)
}, 200)