import { updateChat } from "../_shared/core/chat.js"
import { loadBeatmaps, findBeatmap, loadTeams, findTeam } from "../_shared/core/data.js"
import { getStarCount, isStarOn, setDefaultStarCount, toggleStars, updateStarCount } from "../_shared/core/stars.js"
import { createTosuWsSocket } from "../_shared/core/websocket.js"

// Pick Map Containers
const $pickMapContainerLeft = $("#pick-map-container-left")
const $pickMapContainerRight = $("#pick-map-container-right")

// Team Star Containers
const $teamStarContainerLeft = $("#team-star-container-left")
const $teamStarContainerRight = $("#team-star-container-right")

// Rounds and beatmaps
const $mappoolManagementMaps = $("#mappool-management-maps")
const $roundName = $("#round-name")
let allBeatmaps
let totalPicks
const TOTAL_BANS = 2
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

    setDefaultStarCount(totalPicks * 2 - 1, $teamStarContainerLeft, $teamStarContainerRight)

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

// Ban Map Containers
const $banMapContainerLeft = $("#ban-map-container-left")
const $banMapContainerRight = $("#ban-map-container-right")

// OBS Scene Names
const PICK_TO_TRANSITION_DELAY_MS = 10000
const GAMEPLAY_SCENE_NAME = "Gameplay"
const MAPPOOL_SCENE_NAME = "Mappool"
const WINNER_SCENE_NAME = "Winner"

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

    // Check for if a map has been picked or banned already
    if ($banMapContainerLeft.add($banMapContainerRight).add($pickMapContainerLeft).add($pickMapContainerRight).children(`[data-id="${currentMapId}"]`).length > 0) {
        return
    }

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
        $mappoolSectionChild.children().eq(9).text(`${action === "ban" ? "Banned" : "picked"} by ${team === "left" ? currentTeamNameLeft : currentTeamNameRight}`)
        break
    }

    if (action === "pick") {
        scheduleSceneTransition(GAMEPLAY_SCENE_NAME, PICK_TO_TRANSITION_DELAY_MS)
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

// Toggle Autopick
const $toggleAutopick = $("#toggle-autopick")
let isAutopickToggled = false

// Next Picker
const $nextPicker = $("#next-picker")
let currentNextPicker = "none"

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
    if (currentMappoolBeatmap) {
        // Find element
        const $element = $(`#${currentNowPlayingId}`)

        // Click event
        const isAutopicked = $element.attr("data-is-autopicked") === "true"

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

// IPC State
let ipcState
let checkedWinner

let enableAutoAdvance = false
function switchAutoAdvance() {
    enableAutoAdvance = !enableAutoAdvance
    $autoAdvanceButton.text(`AUTO ADVANCE: ${enableAutoAdvance ? "ON" : "OFF"}`)
}

/**
 * If the IPC State is the same as before, do nothing
 * If the IPC State is not 4, turn checkedWinner to false and then do nothing
 * If the IPC State is 4, but checkdWinner is false, do nothing
 * If stars are not turned on, do nothing
 * If the current map is not a mappool beatmap, do nothing
 * If all guards are paseed, set the winner
 * 
 * @param {object} scores 
 * @param {number} currentIpcState 
 * @returns 
 */
function setWinner(scores, currentIpcState) {
    // Check IPC State
    if (ipcState === currentIpcState) return
    ipcState = currentIpcState

    // Checked winner
    if (ipcState !== 4) checkedWinner = false
    
    if (ipcState === 4 && !checkedWinner) {
        checkedWinner = true

        if (isStarOn() && currentMappoolBeatmap) {
            let winner = ""
            if (scores.left > scores.right) {
                winner = "red"
            } else if (scores.left < scores.right) {
                winner = "blue"
            }

            updateStarCount(winner, "plus", $teamStarContainerLeft, $teamStarContainerRight)
        }
    }

    // Scene transition
    const currentStarCount = getStarCount()
    if (ipcState === 4 && isStarOn() && currentStarCount.redStarCount < totalPicks && currentStarCount.blueStarCount < totalPicks) {
        scheduleSceneTransition(MAPPOOL_SCENE_NAME, PICK_TO_TRANSITION_DELAY_MS)
    } else if (ipcState === 4 && isStarOn() && enableAutoAdvance && (currentStarCount.redStarCount === totalPicks || currentStarCount.blueStarCount === totalPicks)) {
        scheduleSceneTransition(WINNER_SCENE_NAME, PICK_TO_TRANSITION_DELAY_MS)
    } else if ((ipcState === 2 || ipcState === 3) && enableAutoAdvance) {
        scheduleSceneTransition(GAMEPLAY_SCENE_NAME, 0)
    }
}

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

    // Score
    const scores = calculateTeamScores(data.tourney.clients, currentMappoolBeatmap)

    // Set winner
    setWinner(scores, data.tourney.ipcState)
})

/**
 * Set the next picker
 */
function setNextPicker(pickerTeam) {
    currentNextPicker = pickerTeam
    $nextPicker.text(pickerTeam.toUpperCase())
}

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

// Star Section Elements
const $starSectionLeftPlus = $("#star-section-left-plus")
const $starSectionLeftMinus = $("#star-section-left-minus")
const $starSectionRightPlus = $("#star-section-right-plus")
const $starSectionRightMinus = $("#star-section-right-minus")

// Toggle Stars
const $toggleStars = $("#toggle-stars")
const $toggleStarsText = $("#toggle-stars-text")

// Mappool override section
const $mappoolOverrideColumn = $("#mappool-override-column")
const $mappoolOverrideActionSelect = $("#mappool-override-action-select")

// Auto Advanced Button
const $autoAdvanceButton = $('#auto-advance-button')


$(window).on("load", () => {
    $setNextPickerLeft.on("click", () => setNextPicker("left"))
    $setNextPickerRight.on("click", () => setNextPicker("right"))
    $nextPickerNone.on("click", () => setNextPicker("none"))
    $toggleAutopick.on("click", toggleAutopick)
    $starSectionLeftPlus.on("click", () => updateStarCount("red", "plus", $teamStarContainerLeft, $teamStarContainerRight))
    $starSectionLeftMinus.on("click", () => updateStarCount("red", "minus", $teamStarContainerLeft, $teamStarContainerRight))
    $starSectionRightPlus.on("click", () => updateStarCount("blue", "plus", $teamStarContainerLeft, $teamStarContainerRight))
    $starSectionRightMinus.on("click", () => updateStarCount("blue", "minus", $teamStarContainerLeft, $teamStarContainerRight))
    $toggleStars.on("click", () => toggleStars($toggleStarsText, $toggleStars, $teamStarContainerLeft, $teamStarContainerRight))
    $mappoolOverrideActionSelect.on("click", () => mappoolOverrideChangeAction())
    $autoAdvanceButton.on("click", () => switchAutoAdvance())
})

function mappoolOverrideChangeAction() {
    const mappoolOverrideAction = $mappoolOverrideActionSelect.val()

    // Remove last elements
    $mappoolOverrideColumn.children().slice(3).remove()

    const action = (mappoolOverrideAction === "setBan" || mappoolOverrideAction === "removeBan") ? "Ban" : "Pick"

    // Create h2 for which action or pick
    $mappoolOverrideColumn.append(createH2Title(`Which ${action}?`))

    // Create select
    const actionsPerTeam = action === "Ban" ? TOTAL_BANS : $pickMapContainerLeft.children().length
    const $whichActionSelect = $("<select>", {
        class: "mappool-override-select",
        id: "which-action-select",
        size: actionsPerTeam * 2
    }).on("change", setMappoolOverrideInformation)

    // Create options
    for (let i = 0; i < actionsPerTeam; i++) {
        const $redOption = $("<option>", { value: `left|${i}`, text: `Left ${action} ${i + 1}` })
        const $blueOption = $("<option>", { value: `right|${i}`, text: `Right ${action} ${i + 1}` })
        $whichActionSelect.append($redOption, $blueOption)
    }

    // Append select
    $mappoolOverrideColumn.append($whichActionSelect)

    // Setting map
    if (mappoolOverrideAction === "setBan" || mappoolOverrideAction === "setPick") {
        // Which Map
        $mappoolOverrideColumn.append(createH2Title("Which Map?"))

        // Select all maps
        const $beatmapsContainer = $("<div>", { class: "mappool-override-beatmaps-container" })

        for (let i = 0; i < allBeatmaps.length; i++) {
            $("<div>", {
                class: "mappool-override-beatmaps",
                id: allBeatmaps[i].beatmap_id,
                text: `${allBeatmaps[i].mod}${allBeatmaps[i].order}`
            }).on("click", mappoolOverrideSelectMap).appendTo($beatmapsContainer)
        }

        $mappoolOverrideColumn.append($beatmapsContainer)
    }

    // Apply Changes Button
    const $sidebarButtonContainer = $("<div>", { class: "sidebar-button-container" })
    $mappoolOverrideColumn.append($sidebarButtonContainer)

    const $applyChangesButton = $("<button>", { id: "apply-changes", text: "APPLY CHANGES" })
        .css("font-size", "1rem")
    $sidebarButtonContainer.append($applyChangesButton)

    const handlers = {
        setBan: mappoolOverrideSetBan,
        removeBan: mappoolOverrideRemoveBan,
        setPick: mappoolOverrideSetPick,
        removePick: mappoolOverrideRemovePick
    }
    const currentApplyChangesHandler = handlers[mappoolOverrideAction]

    if (currentApplyChangesHandler) $applyChangesButton.on("click", currentApplyChangesHandler)
}

// Set Mappool Override Information
let mappoolOverrideTeam, mappoolOverrideTileNumber
function setMappoolOverrideInformation() {
    [mappoolOverrideTeam, mappoolOverrideTileNumber] = $("#which-action-select").val().split("|")
}

// Mappool Override Select Map
let mappoolOverrideMap
function mappoolOverrideSelectMap() {
    mappoolOverrideMap = this.id
    $(".mappool-override-beatmaps").css({ backgroundColor: "transparent", color: "white" })
    $(this).css({ backgroundColor: "#C2C2C2", color: "#26272B" })
}

// Mappool Override Set Ban
function mappoolOverrideSetBan() {
    if (!mappoolOverrideTeam || !mappoolOverrideTileNumber || !mappoolOverrideMap) return

    // Get current map
    const currentMap = findBeatmap(mappoolOverrideMap)
    if (!currentMap) return

    // Get Containers
    const $currentBanContainer = $(mappoolOverrideTeam === "left" ? $banMapContainerLeft : $banMapContainerRight)

    // Get rid of previous information
    const $child = $currentBanContainer.children().eq(Number(mappoolOverrideTileNumber))
    const previousId = $child.attr("data-id")
    const $previousMappoolSectionChild = $(`.mod-section > [data-id="${previousId}"]`).first()
    $previousMappoolSectionChild.removeClass("map-tile-banned")
    $previousMappoolSectionChild.children().eq(2).attr("src", `static/bats/${currentMap.mod}-bat.png`)
    $previousMappoolSectionChild.children().eq(8).css("opacity", "0")
    $previousMappoolSectionChild.children().eq(9).css("opacity", "0")

    // Set information
    $child.attr("data-id", mappoolOverrideMap)
    $child.children().eq(0).attr("src", `static/bats/${currentMap.mod}-bat.png`)
    $child.children().eq(1).text(`${currentMap.mod}${currentMap.order}`)

    // Set middle mappool information
    const $mappoolSectionChild = $(`.mod-section > [data-id="${mappoolOverrideMap}"]`).first()
    $mappoolSectionChild.addClass("map-tile-banned")
    $mappoolSectionChild.children().eq(2).attr("src", `static/bats/BANNED-bat.png`)
    $mappoolSectionChild.children().eq(8).css("opacity", "1")
    $mappoolSectionChild.children().eq(9).css("opacity", "1")
    $mappoolSectionChild.children().eq(9).text(`Banned by ${mappoolOverrideTeam === "left" ? currentTeamNameLeft : currentTeamNameRight}`)
}

// Mappool Override Remove Ban
function mappoolOverrideRemoveBan() {
    if (!mappoolOverrideTeam || !mappoolOverrideTileNumber) return

    // Get Containers
    const $currentBanContainer = $(mappoolOverrideTeam === "left" ? $banMapContainerLeft : $banMapContainerRight)

    // Get rid of previous information
    const $child = $currentBanContainer.children().eq(Number(mappoolOverrideTileNumber))
    const previousId = $child.attr("data-id")
    const currentMap = findBeatmap(previousId)

    // For mappool in the middle
    const $previousMappoolSectionChild = $(`.mod-section > [data-id="${previousId}"]`).first()
    $previousMappoolSectionChild.removeClass("map-tile-banned")
    $previousMappoolSectionChild.children().eq(2).attr("src", `static/bats/${currentMap.mod}-bat.png`)
    $previousMappoolSectionChild.children().eq(8).css("opacity", "0")
    $previousMappoolSectionChild.children().eq(9).css("opacity", "0")

    // For the actual child
    $child.attr("data-id", "")
    $child.children().eq(0).attr("src", "")
    $child.children().eq(1).text("")
}

// Mappool Override Set Pick
function mappoolOverrideSetPick() {
    if (!mappoolOverrideTeam || !mappoolOverrideTileNumber || !mappoolOverrideMap) return

    // Get current map
    const currentMap = findBeatmap(mappoolOverrideMap)
    if (!currentMap) return

    // Set map information
    const $currentMappoolContainer = $(mappoolOverrideTeam === "left" ? $pickMapContainerLeft : $pickMapContainerRight)

    // Get rid of previous information
    const $child = $currentMappoolContainer.children().eq(Number(mappoolOverrideTileNumber))
    const previousId = $child.attr("data-id")
    const $previousMappoolSectionChild = $(`.mod-section > [data-id="${previousId}"]`).first()
    $previousMappoolSectionChild.removeClass("map-tile-picked", "map-tile-banned")
    $previousMappoolSectionChild.children().eq(2).attr("src", `static/bats/${currentMap.mod}-bat.png`)
    $previousMappoolSectionChild.children().eq(8).css("opacity", "0")
    $previousMappoolSectionChild.children().eq(9).css("opacity", "0")

    // Set information
    $child.attr("data-id", mappoolOverrideMap)
    $child.children().eq(0).attr("src", `static/bats/${currentMap.mod}-bat.png`)
    $child.children().eq(1).text(`${currentMap.mod}${currentMap.order}`)

    // Set middle mappool information
    const $mappoolSectionChild = $(`.mod-section > [data-id="${mappoolOverrideMap}"]`).first()
    $mappoolSectionChild.addClass("map-tile-picked")
    $mappoolSectionChild.children().eq(2).attr("src", `static/bats/${currentMap.mod}-bat.png`)
    $mappoolSectionChild.children().eq(8).css("opacity", "1")
    $mappoolSectionChild.children().eq(9).css("opacity", "1")
    $mappoolSectionChild.children().eq(9).text(`Picked by ${mappoolOverrideTeam === "left" ? currentTeamNameLeft : currentTeamNameRight}`)
}

// Mappool Override Remove Pick
function mappoolOverrideRemovePick() {
    if (!mappoolOverrideTeam || !mappoolOverrideTileNumber) return

    // Set map informationf
    const $currentMappoolContainer = $(mappoolOverrideTeam === "left" ? $pickMapContainerLeft : $pickMapContainerRight)

    // Get rid of previous information
    const $child = $currentMappoolContainer.children().eq(Number(mappoolOverrideTileNumber))
    const previousId = $child.attr("data-id")
    const currentMap = findBeatmap(previousId)

    // For mappool in the middle
    const $previousMappoolSectionChild = $(`.mod-section > [data-id="${previousId}"]`).first()
    $previousMappoolSectionChild.removeClass("map-tile-banned")
    $previousMappoolSectionChild.children().eq(2).attr("src", `static/bats/${currentMap.mod}-bat.png`)
    $previousMappoolSectionChild.children().eq(8).css("opacity", "0")
    $previousMappoolSectionChild.children().eq(9).css("opacity", "0")

    // For the actual child
    $child.attr("data-id", "")
    $child.children().eq(0).attr("src", "")
    $child.children().eq(1).text("")
}

// Create h2 title
function createH2Title(text) {
    return $("<h2>", { text })
}

// OBS Information
const $sceneCollection = $('#sceneCollection')
const $autoAdvanceTimerContainer = $('#autoAdvanceTimer')
const $autoAdvanceTimerLabel = $('#autoAdvanceTimerLabel')

let sceneTransitionTimeoutID

$autoAdvanceTimerContainer.css('opacity', '0')

const obsGetCurrentScene = window.obsstudio?.getCurrentScene ?? (() => {})
const obsGetScenes = window.obsstudio?.getScenes ?? (() => {})
const obsSetCurrentScene = window.obsstudio?.setCurrentScene ?? (() => {})

obsGetScenes(scenes => {
    for (const scene of scenes) {
        const $clone = $($('#sceneButtonTemplate').prop('content')).clone()
        $clone.find('div')
            .first()
            .attr('id', `scene__${scene}`)
            .text(`GO TO: ${scene}`)
            .on('click', () => obsSetCurrentScene(scene))
        $sceneCollection.append($clone)
    }

    obsGetCurrentScene(scene => {
        $(document.getElementById(`scene__${scene.name}`)).addClass('active-scene')
    })
})

function scheduleSceneTransition(targetSceneName, delay) {
    const createTransitionTask = (duration) => setTimeout(() => {
        obsGetCurrentScene((currentScene) => {
            if (currentScene.name === targetSceneName) {
                $autoAdvanceTimerLabel.text(`Already on ${targetSceneName}\n`);
                return
            }
            obsSetCurrentScene(targetSceneName)
            $autoAdvanceTimerContainer.css('opacity', '0')
        })
    }, duration)

    // use global timeout for this overlay, the pick/ban style doesn't lend to repeated pick events so
    // no point in idempotence
    clearTimeout(sceneTransitionTimeoutID)
    sceneTransitionTimeoutID = createTransitionTask(delay)

    const autoadvance_timer_time = new CountUp('autoAdvanceTimerTime',
        delay / 1000,
        0,
        1,
        delay / 1000,
        {useEasing: false, suffix: 's'}
    )
    autoadvance_timer_time.start()
    $autoAdvanceTimerContainer.css('opacity', '1')
    $autoAdvanceTimerLabel.text(`Switching to ${targetSceneName} in`)
}