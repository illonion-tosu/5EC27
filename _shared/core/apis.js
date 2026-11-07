// Load osu! api
let osuApi
export async function initialiseOsuApi() {
    const responseJson = await $.getJSON("../_data/osu-api.json")
    osuApi = responseJson.api
}

// Get osu! api
export function getOsuApi() {
    return osuApi
}