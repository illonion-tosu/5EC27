import { updateChat } from "../_shared/core/chat.js"
import { loadBeatmaps, findBeatmap, loadTeams, findTeam } from "../_shared/core/data.js"
import { createTosuWsSocket } from "../_shared/core/websocket.js"

// Pick Map Containers
const $pickMapContainerLeft = $("#pick-map-container-left")
const $pickMapContainerRight = $("#pick-map-container-right")

// Rounds and beatmaps
const $mappoolManagementMaps = $("#mappool-management-maps")
const $roundName = $("#round-name")
let allBeatmaps
let totalPicks
loadBeatmaps().then(beatmaps => {
    $roundName.text(beatmaps.roundName)
    allBeatmaps = beatmaps.beatmaps

    // Create map cards
    for (let i = 0; i < allBeatmaps.length; i++) {
        createMapCard(allBeatmaps[i])
        $mappoolManagementMaps.append(createMappoolManagementButton(allBeatmaps[i]))
    }

    // Create picks and bans
    switch (beatmaps.roundName.toLowerCase()) {
        case "group stage": case "gs": case "ro16": case "round of 16":
            totalPicks = 5
            break
        case "quarterfinals": case "quarter finals": case "qf": case "semifinals": case "sf": case "semi finals":
            totalPicks = 6
            break
        case "finals": case "f": case "grand finals": case "gf": case "grandfinals":
            totalPicks = 7
            break
    }

    for (let i = 0; i < totalPicks; i++) {
        $pickMapContainerLeft.append(createPickBanMapWrapper())
        $pickMapContainerRight.append(createPickBanMapWrapper())
    }
})

/**
 * Creates mappool management button
 * @param {object} currentMap - Current map parsed in by beatmaps.json
 * @returns {$element} - jquery button element 
 */
function createMappoolManagementButton(currentMap) {
    return $("<button>", { id: currentMap.beatmap_id })
        .attr("data-id", currentMap.beatmap_id)
        .text(`${currentMap.mod}${currentMap.order}`)
        .on("mousedown", mapClickEvent)
        .on("contextmenu", event => event.preventDefault())
}

/**
 * Creates map card
 * @param {object} currentMap - Current map parsed in by beatmaps.json
 */
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
        $('<div>', { class: 'map-tile-overlay map-tile-stroke' }),
        $('<div>', { class: 'map-tile-text', text: 'Picked by Poland' }),
        $('<div>', { class: 'map-tile-custom-original-text map-tile-custom-text', text: 'CUSTOM!' }),
        $('<div>', { class: 'map-tile-custom-original-text map-tile-original-text', text: 'ORIGINAL!' })
    )
    .css("background-image", `url("https://assets.ppy.sh/beatmaps/${currentMap.beatmapset_id}/covers/cover.jpg")`)
    .attr("data-id", currentMap.beatmap_id)

    $(`#${currentMap.mod.toLowerCase()}-mod-section`).append($mapTile)
}

/**
 * Creates pick ban map wrapper
 * @returns {$pickBanMapWrapper} - Pick Ban Map Wrapper
 */
function createPickBanMapWrapper() {
    const $pickBanMapWrapper = $('<div>', { class: 'pick-ban-map-wrapper' }).append(
        $('<img>', { class: 'pick-ban-map-image' }),
        $('<div>', { class: 'pick-ban-map-text' })
    )

    return $pickBanMapWrapper
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
 * Map Click Event
 */
function mapClickEvent(event) {
    // Figure out whether it is a pick or ban
    const currentMapId = $(this).attr("data-id")
    const currentMap = findBeatmap(currentMapId)
    if (!currentMap) return

    // Team
    let team
    if (event.button === 0) team = "left"
    else if (event.button === 2) team = "right"
    if (!team) return

    // Action
    let action = "pick"
    if (event.ctrlKey) action = "ban"

    const $currentContainer = (team === "left" && action === "ban") ? $banMapContainerLeft :
                              (team === "right" && action === "ban") ? $banMapContainerRight :
                              (team === "left" && action === "pick") ? $pickMapContainerLeft :
                              $pickMapContainerRight
    
    for (let i = 0; i < $currentContainer.children().length; i++) {
        const $child = $currentContainer.children().eq(i)

        // Set ban image and text
        if ($child.attr("data-id") !== undefined) continue
        $child.attr("data-id", currentMapId)
        $child.children().eq(0).attr("src", `static/bats/${currentMap.mod}-bat.png`)
        $child.children().eq(1).text(`${currentMap.mod}${currentMap.order}`)

        const $mappoolSectionChild = $(`.mod-section > [data-id="${currentMapId}"]`).first()
        $mappoolSectionChild.css("background-image", `url("https://assets.ppy.sh/beatmaps/${currentMap.beatmapset_id}/covers/cover.jpg")`)
        $mappoolSectionChild.addClass(action === "pick" ? "map-tile-picked" : "map-tile-banned")
        action === "ban" && $mappoolSectionChild.children().eq(2).attr("src", `static/bats/BANNED-bat.png`)
        $mappoolSectionChild.children().eq(8).css("opacity", "1")
        $mappoolSectionChild.children().eq(9).css("opacity", "1")
        $mappoolSectionChild.children().eq(9).text(`${action === "ban" ? "Banned" : "picked"} by ${team === "left" ? "LEFT" : "RIGHT"}`)
        break
    }
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

let currentNowPlayingId, currentNowPlayingChecksum, currentMappoolBeatmap

/**
 * Updates the now-playing panel when the beatmap ID or checksum changes
 * Mappool maps use stats from the mappool (with mods applied)
 * other maps schedule a delayed read from tosu via `updateStats`
 * @param {Object} beatmapData - data.beatmap
 * @param {Object|undefined} directPath - data.directPath
 */
function updateNowPlaying(beatmapData) {
    if (currentNowPlayingId === beatmapData.id && currentNowPlayingChecksum === beatmapData.checksum) return
    if (!allBeatmaps) return

    currentNowPlayingId = beatmapData.id
    currentNowPlayingChecksum = beatmapData.checksum

    // Check for mappool map
    currentMappoolBeatmap = findBeatmap(currentNowPlayingId)
    console.log(currentMappoolBeatmap)
    if (currentMappoolBeatmap) {
        // Find element
        const $element = $(`#${currentNowPlayingId}`)

        // Click event
        const isAutopicked = $element.attr("data-is-autopicked") === "true"

        console.log(isAutopickToggled, $element.length, !isAutopicked)

        if (isAutopickToggled && $element.length && !isAutopicked) {
            // Check if autopicked already
            const event = new MouseEvent("mousedown", {
                bubbles: true,
                cancelable: true,
                view: window,
                button: (currentNextPicker === "left") ? 0 : 2
            })
            $element[0].dispatchEvent(event)
            $element.attr("data-is-autopicked", "true")

            if (currentNextPicker === "left") setNextPicker("right")
            else if (currentNextPicker === "right") setNextPicker("left")
        }
    }
}

// Ban Map Containers
const $banMapContainerLeft = $("#ban-map-container-left")
const $banMapContainerRight = $("#ban-map-container-right")

/* Chat */
const $chatDisplay = $("#chat-display")
let chatLen

// Socket
const socket = createTosuWsSocket()
$(socket).on("message", event => {
    const data = JSON.parse(event.originalEvent.data)

    // Teams
    updateTeams(data.tourney.team)

    // Chat
    const chatData = data.tourney.chat
    if (chatLen !== chatData.length) {
        chatLen = updateChat(chatLen, chatData, $chatDisplay)
    }

    // Now Playing + Stats
    updateNowPlaying(data.beatmap)
})

// Next Picker
const $nextPicker = $("#next-picker")
let currentNextPicker = "none"

/**
 * Set the next picker
 */
function setNextPicker(pickerTeam) {
    currentNextPicker = pickerTeam
    $nextPicker.text(pickerTeam.toUpperCase())
}

// Toggle Autopick
const $toggleAutopick = $("#toggle-autopick")
let isAutopickToggled = false

/**
 * Set the autopicker
 */
function toggleAutopick() {
    isAutopickToggled = !isAutopickToggled
    $toggleAutopick.text(`TOGGLE AUTOPICK: ${isAutopickToggled? "ON": "OFF"}`)
    if (isAutopickToggled) {
        $toggleAutopick.removeClass("toggle-inactive")
        $toggleAutopick.addClass("toggle-active")
    } else {
        $toggleAutopick.addClass("toggle-inactive")
        $toggleAutopick.removeClass("toggle-active")
    }
}

// Set Next Picker Elements
const $setNextPickerLeft = $("#set-next-picker-left")
const $setNextPickerRight = $("#set-next-picker-right")
const $nextPickerNone = $("#next-picker-none")

$(window).on("load", () => {
    $setNextPickerLeft.on("click", () => setNextPicker("left"))
    $setNextPickerRight.on("click", () => setNextPicker("right"))
    $nextPickerNone.on("click", () => setNextPicker("none"))
    $toggleAutopick.on("click", toggleAutopick)
})