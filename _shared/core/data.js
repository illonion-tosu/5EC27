// Load showcase beatmaps
let beatmaps = []
let allBeatmaps = []
export async function loadBeatmaps() {
    const response = await axios.get("../_data/beatmaps.json")
    beatmaps = response.data
    allBeatmaps = beatmaps.beatmaps
    return beatmaps
}

export function findBeatmap(beatmapId) {
    return allBeatmaps.find(beatmap => Number(beatmap.beatmap_id) === Number(beatmapId))
}

// Load teams
let teams = []
export async function loadTeams() {
    const response = await axios.get("../_data/teams.json")
    teams = response.data
    return teams
}

export function findTeam(teamName) {
    return teams.find(team => team.teamName === teamName)
}

// Load team stats
let teamStats = []
export async function loadTeamStats() {
    const response = await axios.get("../_data/team-stats.json")
    teamStats = response.data
    return teamStats
}

export function findTeamStats(teamName) {
    return teamStats.find(team => team.teamName === teamName)
}