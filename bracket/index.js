import { getCookie } from "../_shared/core/utils.js"

// The outgoing bracket fades out, then the incoming one fades in. Total transition = FADE_OUT_MS + FADE_IN_MS
const FADE_OUT_MS = 500
const FADE_IN_MS = 500
const DEFAULT_HOLD_SECONDS = 15
const VIEWS = ["upper", "lower"]
const LEAGUES = ["major", "minor"]

/**
 * Each round is the CSS class that positions it (see style.css)
 * and the match IDs in it, from top to bottom.
 * The match ID is also the number shown in the gold circle.
 */
const BRACKET_LAYOUT = {
    upper: [
        { round: "round-of-16-upper-bracket", matchIds: [1, 2, 3, 4, 5, 6, 7, 8] },
        { round: "quarterfinals-upper-bracket", matchIds: [13, 14, 15, 16] },
        { round: "semifinals-upper-bracket", matchIds: [23, 24] },
        { round: "finals-upper-bracket", matchIds: [28] },
        { round: "grandfinals-upper-bracket", matchIds: [30] },
    ],
    lower: [
        { round: "quarterfinals-lower-bracket", matchIds: [9, 10, 11, 12] },
        { round: "semifinals-round-1-lower-bracket", matchIds: [20, 19, 18, 17] },
        { round: "semifinals-round-2-lower-bracket", matchIds: [22, 21] },
        { round: "finals-round-1-lower-bracket", matchIds: [25, 26] },
        { round: "finals-round-2-lower-bracket", matchIds: [27] },
        { round: "lower-bracket-finals", matchIds: [29] },
    ],
}

/**
 * Load every match for a league from your data source.
 * Call setMatch once per match ID. ALL_MATCH_IDS has every ID on both brackets.
 * @param {"major"|"minor"} league
 */
async function loadLeagueData(league) {
    const res = await fetch(league === "major" ?
        "https://script.google.com/macros/s/AKfycbyyHaGAWbMahKLJTsM2kRTL2iXBw2fl37H5iPc4mGYY9XKdKef00UAc4rt9oXWWsUS5/exec" :
        "https://script.google.com/macros/s/AKfycbymvHNpWW5lPuUffQCi022g-DX9K9JtRVulP7zF1DTzHQDcROVZpQdSPJ5dBGrRKjgn/exec",
        { cache: "no-store" }
    )
    if (!res.ok) throw new Error(`Request failed: ${res.status}`)
    const data = await res.json()
    return data.filter(row => typeof row.round === "number")
}

const matchElements = new Map()

/**
 * Creates a match container and registers its elements against the match ID
 * @param {number} matchId
 * @returns {$element} Match container
 */
function createMatch(matchId) {
    const createTeam = teamNumber => $("<div>", { class: `team-container team-${teamNumber}-container` }).append(
        $("<div>", { class: "team-name" }),
        $("<div>", { class: "team-score" })
    )

    const $match = $("<div>", { class: "match-container", id: `match-${matchId}` }).append(
        createTeam(1),
        createTeam(2),
        $("<div>", { class: "match-number", text: matchId })
    )

    matchElements.set(matchId, {
        $names: $match.find(".team-name"),
        $scores: $match.find(".team-score")
    })

    return $match
}

for (const [view, rounds] of Object.entries(BRACKET_LAYOUT)) {
    const $view = $(`.bracket-view[data-bracket="${view}"]`)
    for (const { round, matchIds } of rounds) {
        $view.append($("<div>", { class: `bracket-round ${round}` }).append(matchIds.map(createMatch)))
    }
}

const ALL_MATCH_IDS = [...matchElements.keys()]

/**
 * Sets the details of one match. Any field left out is cleared.
 * @param {number|string} matchId
 * @param {{team1?: string, team2?: string, score1?: string|number, score2?: string|number}} details
 */
function setMatch(matchId, { team1 = "", team2 = "", score1 = "", score2 = "" } = {}) {
    const match = matchElements.get(Number(matchId))
    if (!match) return

    match.$names.eq(0).text(team1)
    match.$names.eq(1).text(team2)
    match.$scores.eq(0).text(score1)
    match.$scores.eq(1).text(score2)
}

/**
 * Clears every match on both brackets
 */
function clearAllMatches() {
    for (const matchId of ALL_MATCH_IDS) setMatch(matchId)
}

// Settings
const SETTING_COOKIES = {
    league: "bracketLeague",
    autoCycle: "bracketAutoCycle",
    fade: "bracketFade",
    holdSeconds: "bracketHoldSeconds",
}

const settings = {
    league: LEAGUES.includes(getCookie(SETTING_COOKIES.league)) ? getCookie(SETTING_COOKIES.league) : "major",
    autoCycle: getCookie(SETTING_COOKIES.autoCycle) !== "false",
    fade: getCookie(SETTING_COOKIES.fade) !== "false",
    holdSeconds: Number(getCookie(SETTING_COOKIES.holdSeconds)) || DEFAULT_HOLD_SECONDS,
}

/**
 * Updates a setting and saves it to its cookie (kept for a year)
 * @param {keyof settings} key
 * @param {*} value
 */
function saveSetting(key, value) {
    settings[key] = value
    document.cookie = `${SETTING_COOKIES[key]}=${value}; path=/; max-age=31536000`
}

// View Switching
document.documentElement.style.setProperty("--fade-out-ms", `${FADE_OUT_MS}ms`)
document.documentElement.style.setProperty("--fade-in-ms", `${FADE_IN_MS}ms`)

const $overlay = $("#overlay")
const $views = $(".bracket-view")
let currentView = null
let cycleTimeout, nextSwitchAt

/**
 * Shows a bracket view.
 * With fade on, the current view fades out, then the new one fades in (timing is handled in style.css).
 * With fade off, or on first load, it cuts straight to the new view.
 * @param {"upper"|"lower"} view
 */
function showView(view) {
    if (view !== currentView) {
        const animate = settings.fade && currentView !== null

        $overlay.toggleClass("no-fade", !animate)
        $views.each((_, element) => $(element).toggleClass("active", element.dataset.bracket === view))
        currentView = view
    }

    renderSidebar()
    scheduleNextCycle()
}

/**
 * Restarts the hold timer. The hold counts from when the view is fully visible.
 */
function scheduleNextCycle() {
    clearTimeout(cycleTimeout)
    nextSwitchAt = null

    if (settings.autoCycle) {
        const delayMs = settings.holdSeconds * 1000 + (settings.fade ? FADE_OUT_MS + FADE_IN_MS : 0)
        nextSwitchAt = Date.now() + delayMs
        cycleTimeout = setTimeout(() => showView(getNextView()), delayMs)
    }

    renderCountdown()
}

// Switching View
const getNextView = () => VIEWS[(VIEWS.indexOf(currentView) + 1) % VIEWS.length]
let leagueSwapToken = 0

/**
 * Switches league: fades the matches out, swaps in the new league's data, and fades them back in.
 * Clicking the current league again reloads its data.
 * @param {"major"|"minor"} league
 */
async function setLeague(league) {
    const token = ++leagueSwapToken
    saveSetting("league", league)
    renderSidebar()

    // Fade
    if (settings.fade) {
        $overlay.addClass("swapping-league")
        await new Promise(resolve => setTimeout(resolve, FADE_OUT_MS))
        if (token !== leagueSwapToken) return
    }

    // Get new matches
    clearAllMatches()
    try {
        const matches = await loadLeagueData(league)
        if (token === leagueSwapToken) renderMatches(matches)
    } catch (error) {
        console.error(`Failed to load ${league} league data`, error)
    }

    // Remove swapping class after fade-in
    if (token === leagueSwapToken) $overlay.removeClass("swapping-league")

    // Set league text information
    const leagueText = league === "major" ? "Major League" : "Minor League"
    $(`.bracket-view[data-bracket="upper"] .league-text`).text(leagueText)
    $(`.bracket-view[data-bracket="lower"] .league-text`).text(leagueText)
}

/**
 * Fills in every match from the rows returned by loadLeagueData
 * @param {Array<{round: number, team_a: string, team_b: string, score_a: string|number, score_b: string|number}>} matches
 */
function renderMatches(matches) {
    clearAllMatches()
    for (const row of matches) {
        setMatch(row.round, {
            team1: row.team_a,
            team2: row.team_b,
            score1: row.score_a,
            score2: row.score_b,
        })
    }
}

/**
 * Re-fetches the current league and updates the matches in place, with no fade.
 * The old data stays on screen until the new data arrives.
 */
async function refreshData() {
    const token = leagueSwapToken
    const league = settings.league
    $refreshButton.prop("disabled", true).text("REFRESHING...")

    try {
        const matches = await loadLeagueData(league)
        // Skip if the league was switched while this was loading
        if (token === leagueSwapToken) renderMatches(matches)
        $refreshButton.text("REFRESH")
    } catch (error) {
        console.error(`Failed to refresh ${league} league data`, error)
        $refreshButton.text("REFRESH FAILED - RETRY")
    }

    $refreshButton.prop("disabled", false)
}

/* ---------------------------------------------------------------------------
 * Sidebar
 * ------------------------------------------------------------------------- */

const $leagueButtons = $(".league-button")
const $viewButtons = $(".view-button")
const $toggleAutoCycle = $("#toggle-auto-cycle")
const $toggleAutoCycleText = $("#toggle-auto-cycle-text")
const $toggleFade = $("#toggle-fade")
const $toggleFadeText = $("#toggle-fade-text")
const $holdSecondsInput = $("#hold-seconds-input")
const $cycleCountdown = $("#cycle-countdown")
const $refreshButton = $("#refresh-button")

/**
 * Sets a toggle button's text and colour
 * @param {$element} $button
 * @param {$element} $buttonText
 * @param {boolean} isOn
 */
function renderToggle($button, $buttonText, isOn) {
    $buttonText.text(isOn ? "ON" : "OFF")
    $button.toggleClass("toggle-active", isOn).toggleClass("toggle-inactive", !isOn)
}

/**
 * Renders every sidebar control from the current settings
 */
function renderSidebar() {
    $leagueButtons.each((_, button) => $(button).toggleClass("toggle-active", button.dataset.league === settings.league))
    $viewButtons.each((_, button) => $(button).toggleClass("toggle-active", button.dataset.view === currentView))
    renderToggle($toggleAutoCycle, $toggleAutoCycleText, settings.autoCycle)
    renderToggle($toggleFade, $toggleFadeText, settings.fade)
    $holdSecondsInput.val(settings.holdSeconds)
}

/**
 * Shows how long until the next switch
 */
function renderCountdown() {
    if (!nextSwitchAt) {
        $cycleCountdown.text("Auto cycle is off")
        return
    }
    const secondsLeft = Math.max(0, Math.ceil((nextSwitchAt - Date.now()) / 1000))
    $cycleCountdown.text(`Switching to ${getNextView().toUpperCase()} in ${secondsLeft}s`)
}
setInterval(renderCountdown, 250)

$leagueButtons.on("click", event => setLeague(event.currentTarget.dataset.league))
$viewButtons.on("click", event => showView(event.currentTarget.dataset.view))
$refreshButton.on("click", refreshData)

$toggleAutoCycle.on("click", () => {
    saveSetting("autoCycle", !settings.autoCycle)
    renderSidebar()
    scheduleNextCycle()
})

$toggleFade.on("click", () => {
    saveSetting("fade", !settings.fade)
    renderSidebar()
})

$holdSecondsInput.on("change", () => {
    const holdSeconds = Math.round(Number($holdSecondsInput.val()))
    if (holdSeconds >= 1) {
        saveSetting("holdSeconds", holdSeconds)
        scheduleNextCycle()
    }
    renderSidebar()
})

// Start
showView(VIEWS[0])
setLeague(settings.league)
