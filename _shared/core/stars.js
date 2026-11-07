import { getCookie } from "../core/utils.js"

let redStarCount = 0
let blueStarCount = 0
let totalBestOf = 0
let firstTo = 0

// Toggle stars
export function toggleStars(buttonText, button, redTeamStarContainer, blueTeamStarContainer) {
    const $buttonText = $(buttonText)
    const $button = $(button)

    let isOn = $buttonText.text().trim().toLowerCase() === "on"
    $buttonText.text(isOn ? "OFF" : "ON")

    $button.toggleClass("toggle-active", !isOn).toggleClass("toggle-inactive", isOn)

    isOn = $buttonText.text().trim().toLowerCase() === "on"
    document.cookie = `toggleStarContainers=${isOn}; path=/`

    toggleStarContainers(redTeamStarContainer, blueTeamStarContainer)
    renderStars(redTeamStarContainer, blueTeamStarContainer)
}

export function updateStarCount(side, action, redTeamStarContainer, blueTeamStarContainer, redTeamName, blueTeamName) {
    // Update star count
    if (side === "red" && action === "plus") redStarCount++
    else if (side === "red" && action === "minus") redStarCount--
    else if (side === "blue" && action === "plus") blueStarCount++
    else if (side === "blue" && action === "minus") blueStarCount--

    // Ensure star count is following restrictions
    if (redStarCount > firstTo) redStarCount = firstTo
    else if (redStarCount < 0) redStarCount = 0
    if (blueStarCount > firstTo) blueStarCount = firstTo
    else if (blueStarCount < 0) blueStarCount = 0

    saveStarCount()
    renderStars(redTeamStarContainer, blueTeamStarContainer)

    // Set winner details
    const currentWinner = redStarCount > blueStarCount ? redTeamName : blueStarCount > redStarCount ? blueTeamName : "none"
    document.cookie = `currentWinner=${currentWinner}; path=/`
}

// Save Star Count
function saveStarCount() {
    document.cookie = `redStarCount=${redStarCount}; path=/`
    document.cookie = `blueStarCount=${blueStarCount}; path=/`
    document.cookie = `totalBestOf=${totalBestOf}; path=/`
    document.cookie = `firstTo=${firstTo}; path=/`
}

// Get Star Count
export function getStarCount() {
    return { "redStarCount": getCookie("redStarCount"), "blueStarCount": getCookie("blueStarCount") }
}

// Set default star count
export function setDefaultStarCount(bestOf, redTeamStarContainer, blueTeamStarContainer) {
    redStarCount = 0
    blueStarCount = 0
    totalBestOf = bestOf
    firstTo = Math.ceil(totalBestOf / 2)
    saveStarCount()
    renderStars(redTeamStarContainer, blueTeamStarContainer)
}

// Display Stars
export function toggleStarContainers(redTeamStarContainer, blueTeamStarContainer) {
    const isOn = getCookie("toggleStarContainers") === "true"
    $(redTeamStarContainer).css("display", isOn ? "flex" : "none")
    $(blueTeamStarContainer).css("display", isOn ? "flex" : "none")
}

// Get isStarOn
export function isStarOn() {
    return getCookie("toggleStarContainers") === "true"
}

// Set Star Count Display
export function renderStars(redTeamStarContainer, blueTeamStarContainer) {
    const renderStarCountRed = Number(getCookie("redStarCount"))
    const renderStarCountBlue = Number(getCookie("blueStarCount"))
    const renderFirstTo = Number(getCookie("firstTo"))

    const $redContainer = $(redTeamStarContainer).empty()
    const $blueContainer = $(blueTeamStarContainer).empty()
    iterateStarImages(renderStarCountRed, $redContainer, renderFirstTo)
    iterateStarImages(renderStarCountBlue, $blueContainer, renderFirstTo)
}

function iterateStarImages(starCount, $starContainer, firstTo) {
    for (let i = 0; i < firstTo; i++) {
        $starContainer.append(createStarImage(i < starCount ? "fill" : "empty"))
    }
}

function createStarImage(status) {
    return $("<div>", { class: "star-wrapper" }).append(
        $("<img>", { src: `../_shared/assets/star/star-${status}.png` })
    )
}