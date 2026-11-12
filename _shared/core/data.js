let beatmaps = []
let allBeatmaps = []
let teams = []
let teamStats = []

/**
 * Loads in the beatmaps
 * @returns {object} beatmaps
 */
export async function loadBeatmaps() {
    beatmaps = await $.getJSON("../_data/beatmaps.json")
    allBeatmaps = beatmaps.beatmaps
    return beatmaps
}

/**
 * Finds the beatmap object based on the beatmap ID
 * @param {string|number} Beatmap ID 
 * @returns {object} Returns object based on the beatmap ID
 */
export function findBeatmap(beatmapId) {
    return allBeatmaps.find(beatmap => Number(beatmap.beatmap_id) === Number(beatmapId))
}

/**
 * Loads in the teams
 * @returns {object} All Teams
 */
export async function loadTeams() {
    teams = await $.getJSON("../_data/teams.json")
    return teams
}

/**
 * Gets team object based on team name
 * @param {string} teamName 
 * @returns {object} Returns object based on team name
 */
export function findTeam(teamName) {
    return teams.find(team => team.teamName === teamName)
}

/**
 * Loads in team stats
 * @returns Team Stats
 */
export async function loadTeamStats() {
    teamStats = await $.getJSON("../_data/team-stats.json")
    return teamStats
}