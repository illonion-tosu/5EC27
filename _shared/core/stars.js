import { getCookie } from "../core/utils.js"

let redStarCount = 0
let blueStarCount = 0
let totalBestOf = 0
let firstTo = 0

/**
 * Toggles the stars on and off, and displays it in text / changes its classes
 * After toggling, the stars get rendered
 * @param {$element} buttonText Button text element
 * @param {$element} button Button element
 * @param {$element} redTeamStarContainer Container for red stars
 * @param {$element} blueTeamStarContainer Container for blue stars
 */
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

/**
 * Update the star count
 * @param {"red"|"blue"} side red / blue
 * @param {"plus"|"minus"} action plus / minus
 * @param {$element} redTeamStarContainer Container for red stars
 * @param {$element} blueTeamStarContainer Container for blue stars
 * @param {string} redTeamName red team anme
 * @param {string} blueTeamName blue team name
 */
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

/**
 * Saves the star count
 */
function saveStarCount() {
    document.cookie = `redStarCount=${redStarCount}; path=/`
    document.cookie = `blueStarCount=${blueStarCount}; path=/`
    document.cookie = `totalBestOf=${totalBestOf}; path=/`
    document.cookie = `firstTo=${firstTo}; path=/`
}

/**
 * Get the star count
 * @returns {object} Gets the star count
 */
export function getStarCount() {
    return { "redStarCount": getCookie("redStarCount"), "blueStarCount": getCookie("blueStarCount") }
}

/**
 * Sets the default star count
 * Red and blue stars is 0
 * Sets the best of based on parameter
 * saves the first to based on the best of
 * @param {*} bestOf Match Best Of
 * @param {$element} redTeamStarContainer Container for red stars
 * @param {$element} blueTeamStarContainer Container for blue stars
 */
export function setDefaultStarCount(bestOf, redTeamStarContainer, blueTeamStarContainer) {
    redStarCount = 0
    blueStarCount = 0
    totalBestOf = bestOf
    firstTo = Math.ceil(totalBestOf / 2)
    saveStarCount()
    renderStars(redTeamStarContainer, blueTeamStarContainer)
}

/**
 * Toggle the star containers on or off
 * @param {$element} redTeamStarContainer Container for red stars
 * @param {$element} blueTeamStarContainer Container for blue stars
 */
export function toggleStarContainers(redTeamStarContainer, blueTeamStarContainer) {
    const isOn = getCookie("toggleStarContainers") === "true"
    $(redTeamStarContainer).css("display", isOn ? "flex" : "none")
    $(blueTeamStarContainer).css("display", isOn ? "flex" : "none")
}

/**
 * Checks for if the star is turned on
 * @returns {"true"|"false"} returns whether the star is turned on
 */
export function isStarOn() {
    return getCookie("toggleStarContainers") === "true"
}

/**
 * Render the stars through iterating images
 * @param {$element} redTeamStarContainer Container for red stars
 * @param {$element} blueTeamStarContainer Container for blue stars
 */
export function renderStars(redTeamStarContainer, blueTeamStarContainer) {
    const renderStarCountRed = Number(getCookie("redStarCount"))
    const renderStarCountBlue = Number(getCookie("blueStarCount"))
    const renderFirstTo = Number(getCookie("firstTo"))

    const $redContainer = $(redTeamStarContainer).empty()
    const $blueContainer = $(blueTeamStarContainer).empty()
    iterateStarImages(renderStarCountRed, $redContainer, renderFirstTo)
    iterateStarImages(renderStarCountBlue, $blueContainer, renderFirstTo)
}

/**
 * Inserts generated image into star container
 * @param {number} starCount Star count - used to determine if the image should be the "fill" or "empty" image
 * @param {$element} $starContainer Either the container for red or blue stars
 * @param {number} firstTo Match First To 
 */
function iterateStarImages(starCount, $starContainer) {
    for (let i = 0; i < firstTo; i++) {
        $starContainer.append(createStarImage(i < starCount ? "fill" : "empty"))
    }
}
/**
 * Creates a div with the class of "star-wrapper", with an image in the middle based on the status
 * @param {"fill"|"empty"} status Fill / Empty
 * @returns 
 */
function createStarImage(status) {
    return $("<div>", { class: "star-wrapper" }).append(
        $("<img>", { src: `../_shared/assets/star/star-${status}.png` })
    )
}