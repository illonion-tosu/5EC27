let osuApi

/**
 * Initialise osu API
 */
export async function initialiseOsuApi() {
    const responseJson = await $.getJSON("../_data/osu-api.json")
    osuApi = responseJson.api
}

/**
 * Get osu API
 */
export function getOsuApi() {
    return osuApi
}