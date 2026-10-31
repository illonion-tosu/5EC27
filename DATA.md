# Data File Structure

Data files are stored in _data/, which are not located within this repo (see .gitignore).
This file will describe the structure of the _data/ files that are being used for the tournament.

---

## beatmaps-base.json

beatmaps-base.json will be used to make the beatmaps.json file, to be used in various scenes.
This may include the mappool scene and the gameplay scene.

```json
{
    "roundName": "Grand Finals",
    "beatmaps": [
        {"beatmap_id": 3625243, "mod": "NM", "order": 1},
    ]
}
```

<table>
  <thead>
    <tr>
      <th>Attribute</th>
      <th>Description</th>
      <th>Data Type</th>
      <th>Example</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>roundName</td>
      <td>The round of the mappool that is used</td>
      <td>string</td>
      <td>"Grand Finals"</td>
    </tr>
    <tr>
      <td>beatmaps</td>
      <td>A list of beatmap objects</td>
      <td>list(object)</td>
      <td>
        <pre><code>[
  {
    "beatmap_id": 3625243,
    "mod": "NM",
    "order": 1,
    "MWSCustom": false
  }
]</code></pre>
      </td>
    </tr>
    <tr>
      <td>beatmaps[].beatmap_id</td>
      <td>The beatmap ID of the map</td>
      <td>number</td>
      <td>3625243</td>
    </tr>
    <tr>
      <td>beatmaps[].mod</td>
      <td>The mod of the map</td>
      <td>string</td>
      <td>"NM"</td>
    </tr>
    <tr>
      <td>beatmaps[].order</td>
      <td>The number of the map, in relation to the mod. Will be combined with beatmaps[].mod for labels.</td>
      <td>number</td>
      <td>1</td>
    </tr>
  </tbody>
</table>

---

## teams.json

teams.json will have all of the team information inside, to be used for various scenes.
This will include the mappool and gameplay scene, as well as a number of others

```json
[
    {
        "teamName": "Finland",
        "ISO3166Alpha2" : "FI",
        "seed" : 1,
        "playerX" : {
            "id": 12345678,
            "name": "Fairy Bread
        },
    }
]
```

| Attribute | Description | Data Type | Example |
| --------- | ----------- | --------- | ------- |
| teamName | Name of team | string | "Finland" |
| ISO3166Alpha2 | 2 Letter Country Code | string | "FI" |
| seed | Team seed | number | 1 |
| playerX.id | Id of player | number | 12345678 |
| playerX.name | Name of player | string | "Fairy Bread" |