import { loadBeatmaps, loadTeams } from "../_shared/core/data.js"
import { createTosuWsSocket } from "../_shared/core/websocket.js"


// Rounds and beatmaps
const roundNameEl = $("#round-name")
let allBeatmaps
loadBeatmaps().then(beatmaps => {
    roundNameEl.text(beatmaps.roundName)
    allBeatmaps = beatmaps.beatmaps

    for (let i = 0; i < allBeatmaps.length; i++) {
        createMapCard(allBeatmaps[i])
    }
})

// Map Card
function createMapCard(currentMap) {
    const $mapTile = $('<div>', { class: 'map-tile' }).append(
        $('<div>', { class: 'map-tile-overlay map-tile-first-overlay' }),
        $('<div>', { class: 'map-tile-overlay map-tile-second-overlay' }),
        $('<img>', { class: 'map-tile-bat', src: `static/bats/${currentMap.mod}-bat.png` }),
        $('<div>', { class: 'map-tile-mod-id', text: `${currentMap.mod}${currentMap.order}` }),
        $('<div>', {
            class: 'map-tile-metadata map-tile-text-large map-tile-metadata-left map-tile-metadata-top map-tile-text-overflow',
            text: currentMap.title
        }),
        $('<div>', {
            class: 'map-tile-metadata map-tile-text-small map-tile-metadata-left map-tile-metadata-bottom map-tile-text-overflow',
            text: currentMap.version
        }),
        $('<div>', {
            class: 'map-tile-metadata map-tile-text-small map-tile-metadata-right map-tile-metadata-top',
            text: 'Mapped By'
        }),
        $('<div>', {
            class: 'map-tile-metadata map-tile-text-small map-tile-metadata-right map-tile-metadata-bottom map-tile-text-overflow map-tile-mapper',
            text: currentMap.creator
        }),
        $('<div>', { class: 'map-tile-overlay map-tile-stroke map-tile-pick-stroke' }),
        $('<div>', { class: 'map-tile-text map-tile-pick-text', text: 'Picked by Poland' }),
        $('<div>', { class: 'map-tile-custom-original-text map-tile-custom-text', text: 'CUSTOM!' }),
        $('<div>', { class: 'map-tile-custom-original-text map-tile-original-text', text: 'ORIGINAL!' })
    ).css("background-image", `url("https://assets.ppy.sh/beatmaps/${currentMap.beatmapset_id}/covers/cover.jpg")`)

    $(`#${currentMap.mod.toLowerCase()}-mod-section`).append($mapTile)
}

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

// Socket
const socket = createTosuWsSocket()
$(socket).on("message", event => {
    const data = JSON.parse(event.originalEvent.data)

    // Teams
    updateTeams(data.tourney.team)
})