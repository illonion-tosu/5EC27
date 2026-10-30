// Load showcase beatmaps
let teams = []
export async function loadTeams() {
    const response = await axios.get("../../_data/teams.json")
    teams = response.data
    return teams
}

export function findTeam(teamName) {
    return teams.find(team => team.teamName === teamName)
}