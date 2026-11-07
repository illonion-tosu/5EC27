import { delay } from "../_shared/core/utils.js"
import { initialiseOsuApi, getOsuApi } from "../_shared/core/apis.js"

const $downloadingData = $("#downloading-data")
const $button = $("#button")

async function getBeatmaps() {
    // Local, so pressing the button twice doesn't duplicate every beatmap
    const allBeatmapsJson = []
    const baseJson = await $.getJSON("../_data/beatmaps-base.json")
    const allBeatmaps = baseJson.beatmaps

    for (let i = 0; i < allBeatmaps.length; i++) {
        // Set mod number
        let modNumber = 0
        if (allBeatmaps[i].mod.includes("HR")) modNumber += 16
        if (allBeatmaps[i].mod.includes("EZ")) modNumber += 2
        if (allBeatmaps[i].mod.includes("DT")) modNumber = 64

        // Get API response
        const apiJson = await $.getJSON(
            `https://osu.ppy.sh/api/get_beatmaps?k=${getOsuApi()}&b=${allBeatmaps[i].beatmap_id}&mods=${modNumber}`
        )
        await delay(1000)

        $downloadingData.text(`Downloading Data: ${i + 1} / ${allBeatmaps.length}`)

        const map = apiJson[0]
        const beatmap = {
            // "approved": map.approved,
            // "approved_date": map.approved_date,
            "artist": map.artist,
            // "artist_unicode": map.artist_unicode,
            // "audio_unavailable": map.audio_unavailable,
            "beatmap_id": map.beatmap_id,
            "beatmapset_id": map.beatmapset_id,
            "bpm": map.bpm,
            // "count_normal": map.count_normal,
            // "count_slider": map.count_slider,
            // "count_spinner": map.count_spinner,
            "creator": map.creator,
            // "creator_id": map.creator_id,
            // "diff_aim": map.diff_aim,
            "diff_approach": map.diff_approach,
            "diff_drain": map.diff_drain,
            "diff_overall": map.diff_overall,
            "diff_size": map.diff_size,
            // "diff_speed": map.diff_speed,
            "difficultyrating": map.difficultyrating,
            // "download_unavailable": map.download_unavailable,
            // "favourite_count": map.favourite_count,
            // "file_md5": map.file_md5,
            // "genre_id": map.genre_id,
            // "hit_length": map.hit_length,
            // "language_id": map.language_id,
            // "last_update": map.last_update,
            // "max_combo": map.max_combo,
            // "mode": map.mode,
            // "packs": map.packs,
            // "passcount": map.passcount,
            // "playcount": map.playcount,
            // "rating": map.rating,
            // "source": map.source,
            // "storyboard": map.storyboard,
            // "submit_date": map.submit_date,
            // "tags": map.tags,
            "title": map.title,
            // "title_unicode": map.title_unicode,
            "total_length": map.total_length,
            "version": map.version,
            // "video": map.video
        }

        beatmap.mod = allBeatmaps[i].mod
        beatmap.order = allBeatmaps[i].order
        beatmap.isCustom = allBeatmaps[i].isCustom
        beatmap.isOriginal = allBeatmaps[i].isOriginal

        allBeatmapsJson.push(beatmap)
    }

    const fullJson = {
        "roundName": baseJson.roundName,
        "beatmaps": allBeatmapsJson
    }

    const jsonString = JSON.stringify(fullJson, null, 4)
    const blob = new Blob([jsonString], { type: "application/json" })
    const $link = $("<a>", { href: URL.createObjectURL(blob), download: "beatmaps.json" })
    $link[0].click()
}

async function initialise() {
    $button.prop("disabled", true)
    await initialiseOsuApi()
    await getBeatmaps()
    $button.prop("disabled", false)
}

$(window).on("load", () => {
    $button.on("click", initialise)
})