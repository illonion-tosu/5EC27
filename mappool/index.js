import { loadBeatmaps, loadTeams } from "../_shared/core/data.js"
import { createTosuWsSocket } from "../_shared/core/websocket.js"


// Rounds and beatmaps
const mappoolManagementMapsEl = $("#mappool-management-maps")
const roundNameEl = $("#round-name")
let allBeatmaps
let totalPicks
loadBeatmaps().then(beatmaps => {
    roundNameEl.text(beatmaps.roundName)
    allBeatmaps = beatmaps.beatmaps

    // Create map cards
    for (let i = 0; i < allBeatmaps.length; i++) {
        createMapCard(allBeatmaps[i])
        mappoolManagementMapsEl.append(createMappoolManagementButton(allBeatmaps[i]))
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
        $("#pick-ban-map-container-left").append(createPickBanMapWrapper())
        $("#pick-ban-map-container-right").append(createPickBanMapWrapper())
    }
})

/**
 * Creates mappool management button
 * @param {object} currentMap - Current map parsed in by beatmaps.json
 * @returns {$element} - jquery button element 
 */
function createMappoolManagementButton(currentMap) {
    return $("<button>", { id: currentMap.beatmap_id }).
        data("id", currentMap.beatmap_id).
        text(`${currentMap.mod}${currentMap.order}`).
        on("click", mapClickEvent)
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
        $('<div>', { class: 'map-tile-overlay map-tile-stroke map-tile-pick-stroke' }),
        $('<div>', { class: 'map-tile-text map-tile-pick-text', text: 'Picked by Poland' }),
        $('<div>', { class: 'map-tile-custom-original-text map-tile-custom-text', text: 'CUSTOM!' }),
        $('<div>', { class: 'map-tile-custom-original-text map-tile-original-text', text: 'ORIGINAL!' })
    ).css("background-image", `url("https://assets.ppy.sh/beatmaps/${currentMap.beatmapset_id}/covers/cover.jpg")`).data("id", currentMap.beatmap_id)

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

// Next Picker
const nextPickerEl = $("#next-picker")
let currentNextPicker = "none"

/**
 * Set the next picker
 */
function setNextPicker(pickerTeam) {
    currentNextPicker = pickerTeam
    nextPickerEl.text(pickerTeam.toUpperCase())
}

// Toggle Autopick
const toggleAutopickEl = $("#toggle-autopick")
let isAutopickToggled = false

/**
 * Set the autopicker
 */
function toggleAutopick() {
    isAutopickToggled = !isAutopickToggled
    toggleAutopickEl.text(`TOGGLE AUTOPICK: ${isAutopickToggled? "ON": "OFF"}`)
    if (isAutopickToggled) {
        toggleAutopickEl.removeClass("toggle-inactive")
        toggleAutopickEl.addClass("toggle-active")
    } else {
        toggleAutopickEl.addClass("toggle-inactive")
        toggleAutopickEl.removeClass("toggle-active")
    }
}

// Current Picker
const currentPickerEl = $("#current-picker")
let currentPicker = "none"

/**
 * Set the current picker
 * @param {string} pickerTeam 
 */
function setCurrentPicker(pickerTeam) {
    currentPicker = pickerTeam
    currentPickerEl.text(pickerTeam.toUpperCase())
    document.cookie = `currentPicker=${pickerTeam}; path=/`
}

// Set Next Picker Elements
const setNextPickerLeftEl = $("#set-next-picker-left")
const setNextPickerRightEl = $("#set-next-picker-right")
const nextPickerNoneEl = $("#next-picker-none")

// Set Current Picker Elements
const setCurrentPickerLeftEl = $("#set-current-picker-left")
const setCurrentPickerRightEl = $("#set-current-picker-right")
const currentPickerNoneEl = $("#current-picker-none")

$(window).on("load", () => {
    setNextPickerLeftEl.on("click", () => setNextPicker("left"))
    setNextPickerRightEl.on("click", () => setNextPicker("right"))
    nextPickerNoneEl.on("click", () => setNextPicker("none"))
    toggleAutopickEl.on("click", toggleAutopick)
    setCurrentPickerLeftEl.on("click", () => setCurrentPicker("left"))
    setCurrentPickerRightEl.on("click", () => setCurrentPicker("right"))
    currentPickerNoneEl.on("click", () => setCurrentPicker("none"))
})