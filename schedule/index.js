import { loadTeams, findTeam } from "../_shared/core/data.js"

await loadTeams()

// Constants
const REFRESH_INTERVAL = 60 * 1000
const SCORE_STORAGE_KEY = "schedule-match-scores"
const MAX_MATCHES_PER_LIST = 4
const BEST_OF_BY_ROUND = {
  "group stage": 9,
  "goup stage": 9,
  "round of 16": 9,
  quarterfinals: 11,
  semifinals: 11,
  finals: 13,
  "grand finals": 13,
}

// Elements
const $refreshButton = $("#refresh-schedule")
const $comingUpMatch = $("#coming-up-match")
const $roundName = $("#round-name")
const $comingUpTeams = $("#coming-up-teams")
const $recentMatches = $("#recent-matches")
const $upcomingMatches = $("#upcoming-matches")

// Variables
let visibleMatches = []
let matchScores = {}
let selectedMatchKey = ""

// Load Saved Scores
try {
  const savedScores = localStorage.getItem(SCORE_STORAGE_KEY)
  if (savedScores) {
    const parsedScores = JSON.parse(savedScores)
    if (parsedScores && typeof parsedScores === "object" && !Array.isArray(parsedScores)) {
      matchScores = parsedScores
    } else {
      throw new TypeError("Saved match scores must be an object")
    }
  }
} catch (error) {
  console.error("Failed to load saved match scores:", error)
}

// Format Match Time
/**
 * Formats a match time in UTC
 * @param {number} timestamp
 * @returns {string} Formatted match time
 */
function formatMatchTime(timestamp) {
  const date = new Date(timestamp)
  const weekday = date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
  })
  const time = date.toLocaleTimeString("en-US", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
  return `${weekday} ${time} UTC`
}

// Get Team Flag
/**
 * Gets the team's country code, falling back to the schedule flag
 * @param {string} teamName
 * @param {string} fallbackFlag
 * @returns {string} Country code
 */
function getTeamAlpha2(teamName, fallbackFlag) {
  return findTeam(teamName)?.ISO3166Alpha2 || fallbackFlag || ""
}

// Get Team Label
/**
 * Gets the team's display label
 * @param {string} teamName
 * @param {string} fallbackFlag
 * @returns {string} Team label
 */
function getTeamLabel(teamName, fallbackFlag) {
  return getTeamAlpha2(teamName, fallbackFlag) || teamName || "TBD"
}

// Get Winning Score
/**
 * Gets the score needed to win a match
 * @param {Object} match
 * @returns {number|null} Winning score
 */
function getWinningScore(match) {
  const round = String(match.round || "").trim().toLowerCase().replace(/\s+/g, " ")
  const bestOf = BEST_OF_BY_ROUND[round]
  return bestOf ? Math.ceil(bestOf / 2) : null
}

// Get Match Score
/**
 * Gets a team's current score
 * @param {Object} match
 * @param {"red"|"blue"} side
 * @returns {number} Match score
 */
function getMatchScore(match, side) {
  const savedScore = matchScores[match.key]?.[side]
  const initialScore = match[`${side}_point`] ?? match[`${side}_score`]
  const score = Number(savedScore ?? initialScore ?? 0)
  if (!Number.isSafeInteger(score) || score < 0) return 0
  const winningScore = getWinningScore(match)
  return winningScore ? Math.min(score, winningScore) : score
}

// Get Match Scores
/**
 * Gets both teams' scores
 * @param {Object} match
 * @returns {{red: number, blue: number}} Match scores
 */
function getMatchScores(match) {
  return {
    red: getMatchScore(match, "red"),
    blue: getMatchScore(match, "blue"),
  }
}

// Create Match Row
/**
 * Creates a match row
 * @param {Object} match
 * @returns {jQuery} Match row
 */
function createMatchRow(match) {
  const $row = $("<div>")
  const $time = $("<div>")
  const scores = getMatchScores(match)
  const winningScore = getWinningScore(match)

  $time.addClass("match-time").text(formatMatchTime(match.time))
  const isSelected = match.key === selectedMatchKey
  $row.addClass(`match schedule-match-row${isSelected ? " selected" : ""}`)
    .data("matchKey", match.key)
    .attr({ role: "button", "aria-pressed": String(isSelected), tabindex: 0 })

  const teams = [
    {
      name: match.red_team,
      flag: getTeamAlpha2(match.red_team, match.red_flag),
      side: "red",
    },
    {
      name: match.blue_team,
      flag: getTeamAlpha2(match.blue_team, match.blue_flag),
      side: "blue",
    },
  ]

  teams.forEach(team => {
    const $box = $("<div>")
    const $flag = $("<div>")
    const $name = $("<div>")
    const $score = $("<div>")
    const isWinner = winningScore !== null && scores[team.side] >= winningScore

    $box.addClass(`match-box ${team.side}${isWinner ? " win" : ""}`)
    $flag.addClass("match-flag")
      .css("background-image", team.flag
        ? `url("https://osuflags.omkserver.nl/${encodeURIComponent(team.flag)}-1000.png")`
        : "none")
      .attr("aria-label", team.flag ? `${team.flag} flag` : "")
    $name.addClass(`match-team${isWinner ? " win" : ""}`).text(getTeamLabel(team.name, team.flag))
    $score.addClass(`match-score${isWinner ? " win" : ""}`)
      .text(scores[team.side])
      .prop("hidden", false)
      .data("matchKey", match.key)
      .attr({ role: "button", tabindex: 0, title: "Left-click to add a point; right-click to subtract" })
      .attr(
        "aria-label",
        `${getTeamLabel(team.name, team.flag)} score: ${scores[team.side]}${winningScore ? ` of ${winningScore} to win` : ""}. Left-click to add a point; right-click to subtract.`,
      )

    $box.append($flag, $name, $score)
    $row.append($box)
  })

  $row.append($time)
  return $row
}

// Render Match Lists
/**
 * Renders recent and upcoming matches
 * @param {number} [now=Date.now()]
 */
function renderMatchLists(now = Date.now()) {
  const recentMatches = visibleMatches
    .filter(match => Number.isFinite(match.time) && match.time > 0 && match.time <= now)
    .sort((a, b) => b.time - a.time)
    .slice(0, MAX_MATCHES_PER_LIST)
  const upcomingMatches = visibleMatches
    .filter(match => match.time > now)
    .sort((a, b) => a.time - b.time)
    .slice(0, MAX_MATCHES_PER_LIST)

  $recentMatches.empty()
  $upcomingMatches.empty()

  if (recentMatches.length === 0) {
    const $empty = $("<div>").addClass("schedule-match-empty")
    $recentMatches.append($empty)
  } else {
    recentMatches.forEach(match => $recentMatches.append(createMatchRow(match)))
  }

  if (upcomingMatches.length === 0) {
    const $empty = $("<div>").addClass("schedule-match-empty").text("")
    $upcomingMatches.append($empty)
  } else {
    upcomingMatches.forEach(match => $upcomingMatches.append(createMatchRow(match)))
  }
}

// Display Match
/**
 * Updates the selected match display
 * @param {Object|null} match
 */
function displayMatch(match) {
  const $boxes = $comingUpMatch.find(".match-box")

  if (!match) {
    $boxes.each((_, box) => {
      const $box = $(box)
      $box.find(".match-flag").css("background-image", "none")
      const $team = $box.find(".match-team").text("—")
      const $score = $box.find(".match-score")
      $box.removeClass("win")
      $team.removeClass("win")
      $score.removeClass("win").prop("hidden", true).removeAttr("role tabindex")
    })
    $roundName.text("No match selected")
    $comingUpTeams.text("")
    return
  }

  const teams = [
    {
      name: match.red_team,
      flag: getTeamAlpha2(match.red_team, match.red_flag),
      side: "red",
    },
    {
      name: match.blue_team,
      flag: getTeamAlpha2(match.blue_team, match.blue_flag),
      side: "blue",
    },
  ]
  const scores = getMatchScores(match)
  const winningScore = getWinningScore(match)

  teams.forEach((team, index) => {
    const $box = $boxes.eq(index)
    const $flag = $box.find(".match-flag")
    const $team = $box.find(".match-team")
    const $score = $box.find(".match-score")

    $flag.css("background-image", team.flag
      ? `url("https://osuflags.omkserver.nl/${encodeURIComponent(team.flag)}-1000.png")`
      : "none")
    $flag.attr("aria-label", team.flag ? `${team.flag} flag` : "")
    $team.text(getTeamLabel(team.name, team.flag))
    $score.text(scores[team.side]).prop("hidden", false)
      .attr({ role: "button", tabindex: 0, title: "Left-click to add a point; right-click to subtract" })
    const isWinner = winningScore !== null && scores[team.side] >= winningScore
    $box.toggleClass("win", isWinner)
    $team.toggleClass("win", isWinner)
    $score.toggleClass("win", isWinner)
    $score.attr(
      "aria-label",
      `${getTeamLabel(team.name, team.flag)} score: ${$score.text()}${winningScore ? ` of ${winningScore} to win` : ""}. Left-click to add a point; right-click to subtract.`,
    )
  })

  $roundName.text(match.round || "Match")
  $comingUpTeams.text(`${match.red_team} vs ${match.blue_team}`)
}

// Select Match
/**
 * Selects a match
 * @param {string} matchKey
 */
function selectMatch(matchKey) {
  const match = visibleMatches.find(item => item.key === matchKey)
  if (!match) return

  selectedMatchKey = match.key
  displayMatch(match)
  for (const $container of [$recentMatches, $upcomingMatches]) {
    $container.find(".schedule-match-row").each((_, row) => {
      const $row = $(row)
      const isSelected = $row.data("matchKey") === selectedMatchKey
      $row.toggleClass("selected", isSelected).attr("aria-pressed", String(isSelected))
    })
  }
}

// Change Score
/**
 * Changes a team's score and saves it
 * @param {string} matchKey
 * @param {"red"|"blue"} side
 * @param {number} amount
 */
function changeScore(matchKey, side, amount) {
  const match = visibleMatches.find(item => item.key === matchKey)
  if (!match) return

  const scores = getMatchScores(match)
  const winningScore = getWinningScore(match)
  if (
    amount > 0 &&
    winningScore !== null &&
    (scores.red >= winningScore || scores.blue >= winningScore)
  ) {
    return
  }

  scores[side] = Math.max(0, scores[side] + amount)
  matchScores[match.key] = scores
  try {
    localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(matchScores))
  } catch (error) {
    console.error("Failed to save match score:", error)
  }
  if (selectedMatchKey === match.key) {
    displayMatch(match)
  }
  renderMatchLists()
}

// Get Score Control
/**
 * Gets the score control from an event target
 * @param {EventTarget|null} target
 * @returns {jQuery} Score control, or an empty collection
 */
function getScoreControl(target) {
  return target && target.nodeType === 1 ? $(target).closest(".match-score") : $()
}

// Change Score From Event
/**
 * Changes a score from an event
 * @param {Event} event
 * @param {number} amount
 * @returns {boolean} Whether a score control was targeted
 */
function changeScoreFromEvent(event, amount) {
  const $score = getScoreControl(event.target)
  if (!$score.length) return false

  const matchKey = $score.data("matchKey") || selectedMatchKey
  const side = $score.closest(".match-box").hasClass("red") ? "red" : "blue"
  changeScore(matchKey, side, amount)
  return true
}

// Render Schedule
/**
 * Renders the schedule and selects a match
 * @param {Object[]} matches
 */
function renderSchedule(matches) {
  const now = Date.now()
  const previousSelectedKey = selectedMatchKey

  visibleMatches = matches
    .filter(match => match.time > 0)
    .sort((a, b) => a.time - b.time)
  const selectedMatch = visibleMatches.find(match => match.key === previousSelectedKey)
  const defaultMatch =
    selectedMatch ||
    visibleMatches.find(match => match.time > now) ||
    [...visibleMatches].reverse().find(match => match.time <= now)

  selectedMatchKey = defaultMatch?.key || ""
  renderMatchLists(now)
  displayMatch(defaultMatch || null)
}

// Load Schedule List
/**
 * Loads and renders the schedule
 * @param {boolean} [resetSavedScores=false]
 */
async function loadScheduleList(resetSavedScores = false) {
  try {
    const response = await fetch("https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnSpVeUOgWjaU35w50VVeUZC-XaBpGu2g5wI8cSKYpiiYYmGttLlQcvQkXpGL60Kvcg5hLzkBeWtIWYlphTxPVniE5QW6I-hKOSz8a0ygjExbjn0Gbt3VOCEFOcPvb4LCz7SQRnVGNzmbvvZc8GaBFl9oVpx1wPbpCFIdCGpq8iqnjibRj9EXCg3Yb01Iq-FM9q9GYHB_DxYOK25qV4nSnveQYRf76LgQ49hcQAXHOOBD9QElYyWQm_P103A39Zk8e8gveOcGxjVVe8fT4-eAry75Qtqrg&lib=MNMMBfhWrpIwG2KiL1Y_qr7n_u9v4y-7z", { cache: "no-store" })
    if (!response.ok) throw new Error(`Request failed: ${response.status}`)
    const matches = await response.json()

    if (!Array.isArray(matches)) {
      throw new TypeError("Schedule data must be an array")
    }

    const scheduledMatches = matches
      .filter(match => match && typeof match === "object")
      .map(match => ({
        ...match,
        key: JSON.stringify([match.time, match.red_team, match.blue_team, match.round]),
        time: Number(match.time),
      }))
      .filter(match => Number.isFinite(match.time) && match.time > 0)

    if (matches.length > 0 && !scheduledMatches.some(match => match.time > 0)) {
      throw new TypeError("Schedule data must include a positive match timestamp")
    }

    if (resetSavedScores) {
      localStorage.removeItem(SCORE_STORAGE_KEY)
      matchScores = {}
    }

    renderSchedule(scheduledMatches)
  } catch (error) {
    console.error("Failed to load schedule:", error)
    const matchListContainers = [$recentMatches, $upcomingMatches]
    matchListContainers.forEach($container => {
      const $error = $("<div>").addClass("schedule-match-empty").text("Unable to load matches")
      $container.empty().append($error)
    })
  }
}

// Event Listeners
$comingUpMatch.on("click", event => changeScoreFromEvent(event, 1))

/**
 * Selects the clicked match and updates its score when needed
 * @param {MouseEvent} event
 */
function handleMatchListClick(event) {
  const $row = $(event.target).closest(".schedule-match-row")
  if (!$row.length || !$.contains(event.currentTarget, $row[0])) return

  selectMatch($row.data("matchKey"))
  changeScoreFromEvent(event, 1)
}

$recentMatches.on("click", handleMatchListClick)
$upcomingMatches.on("click", handleMatchListClick)

const scoreContainers = [$comingUpMatch, $recentMatches, $upcomingMatches]
scoreContainers.forEach($container => {
  $container.on("contextmenu", event => {
    if (changeScoreFromEvent(event, -1)) {
      event.preventDefault()
    }
  })

})

$refreshButton.on("click", () => loadScheduleList(true))
loadScheduleList()
window.setInterval(loadScheduleList, REFRESH_INTERVAL)
