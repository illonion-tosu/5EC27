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