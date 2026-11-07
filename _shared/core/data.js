// Load showcase beatmaps
let beatmaps = []
let allBeatmaps = []
export async function loadBeatmaps() {
    beatmaps = await $.getJSON("../_data/beatmaps.json")
    allBeatmaps = beatmaps.beatmaps
    return beatmaps
}

export function findBeatmap(beatmapId) {
    return allBeatmaps.find(beatmap => Number(beatmap.beatmap_id) === Number(beatmapId))
}

// Load teams
let teams = []
export async function loadTeams() {
    teams = await $.getJSON("../_data/teams.json")
    return teams
}

export function findTeam(teamName) {
    return teams.find(team => team.teamName === teamName)
}

// Load team stats
let teamStats = []
export async function loadTeamStats() {
    teamStats = await $.getJSON("../_data/team-stats.json")
    return teamStats
}