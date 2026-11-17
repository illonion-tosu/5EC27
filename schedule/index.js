const RECENT_MATCH_WINDOW = 2 * 60 * 60 * 1000
const REFRESH_INTERVAL = 60 * 1000
const MAX_SELECTABLE_MATCHES = 5
const SCORE_STORAGE_KEY = "schedule-match-scores"
const BEST_OF_BY_ROUND = {
  "group stage": 9,
  "goup stage": 9,
  "round of 16": 9,
  quarterfinals: 11,
  semifinals: 11,
  finals: 13,
  "grand finals": 13,
}

const $matchSelector = document.querySelector("#match-selector")
const $refreshButton = document.querySelector("#refresh-schedule")
const $comingUpMatch = document.querySelector("#coming-up-match")
const $roundName = document.querySelector("#round-name")
const $comingUpTeams = document.querySelector("#coming-up-teams")
const $recentMatches = document.querySelector("#recent-matches")
const $upcomingMatches = document.querySelector("#upcoming-matches")
let visibleMatches = []
let matchScores = {}
let selectedMatchKey = ""

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

function formatMatchTime(timestamp) {
  return new Date(timestamp).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getWinningScore(match) {
  const round = String(match.round || "").trim().toLowerCase().replace(/\s+/g, " ")
  const bestOf = BEST_OF_BY_ROUND[round]
  return bestOf ? Math.ceil(bestOf / 2) : null
}

function getMatchScore(match, side) {
  const savedScore = matchScores[match.key]?.[side]
  const initialScore = match[`${side}_point`] ?? match[`${side}_score`]
  const score = Number(savedScore ?? initialScore ?? 0)
  if (!Number.isSafeInteger(score) || score < 0) return 0
  const winningScore = getWinningScore(match)
  return winningScore ? Math.min(score, winningScore) : score
}

function getMatchScores(match) {
  return {
    red: getMatchScore(match, "red"),
    blue: getMatchScore(match, "blue"),
  }
}

function createMatchRow(match) {
  const $row = document.createElement("div")
  const scores = getMatchScores(match)
  const winningScore = getWinningScore(match)

  $row.className = "match"
  $row.title = `${formatMatchTime(match.time)} — ${match.round || "Match"}`

  const teams = [
    { name: match.red_team, flag: match.red_flag, side: "red" },
    { name: match.blue_team, flag: match.blue_flag, side: "blue" },
  ]

  teams.forEach(team => {
    const $box = document.createElement("div")
    const $flag = document.createElement("div")
    const $name = document.createElement("div")
    const $score = document.createElement("div")
    const isWinner = winningScore !== null && scores[team.side] >= winningScore

    $box.className = `match-box ${team.side}${isWinner ? " win" : ""}`
    $flag.className = "match-flag"
    $flag.style.backgroundImage = team.flag
      ? `url("https://osuflags.omkserver.nl/${encodeURIComponent(team.flag)}-1000.png")`
      : "none"
    $flag.setAttribute("aria-label", team.flag ? `${team.flag} flag` : "")
    $name.className = `match-team${isWinner ? " win" : ""}`
    $name.textContent = team.flag || team.name || "TBD"
    $score.className = `match-score${isWinner ? " win" : ""}`
    $score.textContent = scores[team.side]
    $score.hidden = false
    $score.dataset.matchKey = match.key
    $score.setAttribute("role", "button")
    $score.setAttribute("tabindex", "0")
    $score.title = "Left-click to add a point; right-click to subtract"
    $score.setAttribute(
      "aria-label",
      `${team.name || "Team"} score: ${scores[team.side]}${winningScore ? ` of ${winningScore} to win` : ""}. Left-click to add a point; right-click to subtract.`,
    )

    $box.append($flag, $name, $score)
    $row.append($box)
  })

  return $row
}

function renderMatchLists(now = Date.now()) {
  const recentMatches = visibleMatches
    .filter(match => match.time <= now && match.time > now - RECENT_MATCH_WINDOW)
    .sort((a, b) => b.time - a.time)
  const upcomingMatches = visibleMatches
    .filter(match => match.time > now)
    .sort((a, b) => a.time - b.time)

  $recentMatches.replaceChildren()
  $upcomingMatches.replaceChildren()

  if (recentMatches.length === 0) {
    const $empty = document.createElement("div")
    $empty.className = "schedule-match-empty"
    $recentMatches.append($empty)
  } else {
    recentMatches.forEach(match => $recentMatches.append(createMatchRow(match)))
  }

  if (upcomingMatches.length === 0) {
    const $empty = document.createElement("div")
    $empty.className = "schedule-match-empty"
    $empty.textContent = "No upcoming matches"
    $upcomingMatches.append($empty)
  } else {
    upcomingMatches.forEach(match => $upcomingMatches.append(createMatchRow(match)))
  }
}

function displayMatch(match) {
  const $boxes = $comingUpMatch.querySelectorAll(".match-box")

  if (!match) {
    $boxes.forEach($box => {
      $box.querySelector(".match-flag").style.backgroundImage = "none"
      const $team = $box.querySelector(".match-team")
      $team.textContent = "—"
      const $score = $box.querySelector(".match-score")
      $box.classList.remove("win")
      $team.classList.remove("win")
      $score.classList.remove("win")
      $score.hidden = true
      $score.removeAttribute("role")
      $score.removeAttribute("tabindex")
    })
    $roundName.textContent = "No match selected"
    $comingUpTeams.textContent = ""
    return
  }

  const teams = [
    { name: match.red_team, flag: match.red_flag, side: "red" },
    { name: match.blue_team, flag: match.blue_flag, side: "blue" },
  ]
  const scores = getMatchScores(match)
  const winningScore = getWinningScore(match)

  teams.forEach((team, index) => {
    const $box = $boxes[index]
    const $flag = $box.querySelector(".match-flag")
    const $team = $box.querySelector(".match-team")
    const $score = $box.querySelector(".match-score")

    $flag.style.backgroundImage = team.flag
      ? `url("https://osuflags.omkserver.nl/${encodeURIComponent(team.flag)}-1000.png")`
      : "none"
    $flag.setAttribute("aria-label", team.flag ? `${team.flag} flag` : "")
    $team.textContent = team.flag || team.name || "TBD"
    $score.textContent = scores[team.side]
    $score.hidden = false
    $score.setAttribute("role", "button")
    $score.setAttribute("tabindex", "0")
    $score.title = "Left-click to add a point; right-click to subtract"
    const isWinner = winningScore !== null && scores[team.side] >= winningScore
    $box.classList.toggle("win", isWinner)
    $team.classList.toggle("win", isWinner)
    $score.classList.toggle("win", isWinner)
    $score.setAttribute(
      "aria-label",
      `${team.name || "Team"} score: ${$score.textContent}${winningScore ? ` of ${winningScore} to win` : ""}. Left-click to add a point; right-click to subtract.`,
    )
  })

  $roundName.textContent = match.round || "Match"
  $comingUpTeams.textContent = `${match.red_team || "TBD"} vs ${match.blue_team || "TBD"}`
}

function renderMatchSelector(matches, selectedKey, emptyMessage = "No scheduled matches") {
  $matchSelector.replaceChildren()

  if (matches.length === 0) {
    const $empty = document.createElement("div")
    $empty.className = "schedule-selector-empty"
    $empty.textContent = emptyMessage
    $matchSelector.append($empty)
    return
  }

  matches.forEach(match => {
    const $option = document.createElement("div")
    const $time = document.createElement("div")
    const $teams = document.createElement("div")
    const $round = document.createElement("div")
    const isSelected = match.key === selectedKey
    const status = match.time <= Date.now() ? " — STARTED" : ""

    $option.className = "schedule-match-option"
    $option.dataset.matchKey = match.key
    $option.setAttribute("role", "button")
    $option.setAttribute("aria-pressed", String(isSelected))
    $option.setAttribute("tabindex", "0")
    $time.className = "schedule-match-option-time"
    $time.textContent = formatMatchTime(match.time)
    $teams.className = "schedule-match-option-teams"
    $teams.textContent = `${match.red_team || "TBD"} vs ${match.blue_team || "TBD"}`
    $round.className = "schedule-match-option-round"
    $round.textContent = `${match.round || "Match"}${status}`
    $option.append($time, $teams, $round)
    $matchSelector.append($option)
  })
}

function selectMatch(matchKey) {
  const match = visibleMatches.find(item => item.key === matchKey)
  if (!match) return

  selectedMatchKey = match.key
  displayMatch(match)
  renderMatchSelector(
    visibleMatches.slice(0, MAX_SELECTABLE_MATCHES),
    selectedMatchKey,
  )
  const $selectedOption = [...$matchSelector.querySelectorAll(".schedule-match-option")].find(
    $option => $option.dataset.matchKey === selectedMatchKey,
  )
  $selectedOption?.focus()
}

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

function getScoreControl(target) {
  return target instanceof Element ? target.closest(".match-score") : null
}

function changeScoreFromEvent(event, amount) {
  const $score = getScoreControl(event.target)
  if (!$score) return false

  const matchKey = $score.dataset.matchKey || selectedMatchKey
  const side = $score.closest(".match-box").classList.contains("red") ? "red" : "blue"
  changeScore(matchKey, side, amount)
  return true
}

function renderSchedule(matches) {
  const now = Date.now()
  const previousSelectedKey = selectedMatchKey

  visibleMatches = matches
    .filter(match => match.time > now - RECENT_MATCH_WINDOW)
    .sort((a, b) => a.time - b.time)
  renderMatchLists(now)

  const selectableMatches = visibleMatches.slice(0, MAX_SELECTABLE_MATCHES)
  if (selectableMatches.length === 0) {
    selectedMatchKey = ""
    renderMatchSelector([])
    displayMatch(null)
    return
  }

  const selectedMatch = selectableMatches.find(match => match.key === previousSelectedKey)
  const defaultMatch =
    selectedMatch ||
    selectableMatches.find(match => match.time > now) ||
    selectableMatches[0]

  selectedMatchKey = defaultMatch.key
  renderMatchSelector(selectableMatches, selectedMatchKey)
  displayMatch(defaultMatch)
}

async function loadScheduleList() {
  try {
    const matches = await $.getJSON("../_data/schedule.json")

    if (!Array.isArray(matches)) {
      throw new TypeError("Schedule data must be an array")
    }

    renderSchedule(
      matches
        .filter(match => match && typeof match === "object")
        .map(match => ({
          ...match,
          key: JSON.stringify([match.time, match.red_team, match.blue_team, match.round]),
          time: Number(match.time),
        }))
        .filter(match => Number.isFinite(match.time)),
    )
  } catch (error) {
    console.error("Failed to load schedule:", error)
    renderMatchSelector([], "", "Unable to load schedule")
    const matchListContainers = [$recentMatches, $upcomingMatches]
    matchListContainers.forEach($container => {
      const $error = document.createElement("div")
      $error.className = "schedule-match-empty"
      $error.textContent = "Unable to load matches"
      $container.replaceChildren($error)
    })
  }
}

$comingUpMatch.addEventListener("click", event => changeScoreFromEvent(event, 1))
$recentMatches.addEventListener("click", event => changeScoreFromEvent(event, 1))
$upcomingMatches.addEventListener("click", event => changeScoreFromEvent(event, 1))

const scoreContainers = [$comingUpMatch, $recentMatches, $upcomingMatches]
scoreContainers.forEach($container => {
  $container.addEventListener("contextmenu", event => {
    if (changeScoreFromEvent(event, -1)) {
      event.preventDefault()
    }
  })

  $container.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      if (changeScoreFromEvent(event, 1)) event.preventDefault()
    } else if (event.key === "-" || event.key === "ArrowDown") {
      if (changeScoreFromEvent(event, -1)) event.preventDefault()
    }
  })
})

$matchSelector.addEventListener("click", event => {
  const $option =
    event.target instanceof Element ? event.target.closest("[data-match-key]") : null
  if ($option && $matchSelector.contains($option)) {
    selectMatch($option.dataset.matchKey)
  }
})

$matchSelector.addEventListener("keydown", event => {
  if (event.key !== "Enter" && event.key !== " ") return
  const $option =
    event.target instanceof Element ? event.target.closest("[data-match-key]") : null
  if (!$option || !$matchSelector.contains($option)) return

  event.preventDefault()
  selectMatch($option.dataset.matchKey)
})

$refreshButton.addEventListener("click", loadScheduleList)
loadScheduleList()
window.setInterval(loadScheduleList, REFRESH_INTERVAL)
