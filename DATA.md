# Data File Structure

Data files are stored in _data/, which are not located within this repo (see .gitignore).
This file will describe the structure of the _data/ files that are being used for the tournament.

---

## beatmaps-base.json

beatmaps-base.json will be used to make the beatmaps.json file, to be used in various scenes.
This may include the mappool scene and the gameplay scene.

`
{
    "roundName": "Grand Finals",
    "beatmaps": [
        {"beatmap_id": 3625243, "mod": "NM", "order": 1},
    ]
}
`

| Attribute | Description | Data Type | Example |
| --------- | ----------- | --------- | ------- |
| roundName | The round of the mappool that is used | String | "Grand Finals" |
| beatmaps | A list of beatmap objects | list(object) | "beatmaps": [{"beatmap_id": 3625243, "mod": "NM", "order": 1, "MWSCustom": false}] |
| beatmaps[].beatmap_id | The beatmap ID of the map | Number | 3625243 |
| beatmaps[].mod | The mod of the map | String | "NM" |
| beatmaps[].order | The number of the map, in relation to the mod. Will be combined with beatmaps[].mod for labels. | Number | 1 |