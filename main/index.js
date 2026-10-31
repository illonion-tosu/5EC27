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

// Now Playing
const nowPlayingBackgroundEl = $("#now-playing-background")
const nowPlayingArtistEl = $("#now-playing-artist")
const nowPlayingTitleEl = $("#now-playing-title")
const nowPlayingDifficultyEl = $("#now-playing-difficulty")
const nowPlayingMapperEl = $("#now-playing-mapper")
let currentNowPlayingId, currentNowPlayingChecksum

// Scores
const scoreBarLeftEl = $("score-bar-left")
const scoreBarRightEl = $("score-bar-right")
const scoreLeftEl = $("score-left")
const scoreRightEl = $("score-right")

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

    // Now Playing Data
    const beatmapData = data.beatmap
    if (currentNowPlayingId !== beatmapData.id || currentNowPlayingChecksum !== beatmapData.checksum) {
        currentNowPlayingId = beatmapData.id
        currentNowPlayingChecksum = beatmapData.checksum

        const background = data.directPath?.beatmapBackground
        const url = `${window.location.origin}/Songs/${background}`
        nowPlayingBackgroundEl.css("background-image", `url("${encodeURI(url.replaceAll("\\", "/"))}")`)
        nowPlayingArtistEl.text(beatmapData.artist)
        nowPlayingTitleEl.text(beatmapData.title)
        nowPlayingDifficultyEl.text(beatmapData.version)
        nowPlayingMapperEl.text(beatmapData.mapper)
    }
})