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
        {"beatmap_id": 3625243, "mod": "NM", "order": 1, "isCustom": true, "isOriginal": true},
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
    "isCustom": true,
    "isOriginal": true
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
    <tr>
      <td>beatmaps[].isCustom</td>
      <td>Marked true if the map is a custom map. Marked false if not.</td>
      <td>boolean</td>
      <td>true</td>
    </tr>
    <tr>
      <td>beatmaps[].isOriginal</td>
      <td>Marked true if the map is an original song. Marked false if not.</td>
      <td>boolean</td>
      <td>true</td>
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
| player<Number>.id | Id of player | number | 12345678 |
| player<Number>.name | Name of player | string | "Fairy Bread" |

---

## team-stats.json

This is specifically used for the seeding scene, and will be used once throughout the whole tournament.

```json
[
    {
        "teamName": "Australia",
        "ISO3166Alpha2": "AU",
        "seed": 1,
        "lastYearSeed": 16,
        "lastYearPlacement": 1,
        "player1": {
            "name": "Shiviel",
            "nm1Score": 991559,
            "nm2Score": 645642,
            "nm3Score": 0,
            "nm4Score": 647595,
            "nm5Score": 0,
            "hd1Score": 0,
            "hd2Score": 624180,
            "hr1Score": 0,
            "hr2Score": 0,
            "dt1Score": 1034796,
            "dt2Score": 0,
            "dt3Score": 0
        },
        "player2": {
            "name": "11iq pleer",
            "nm1Score": 996549,
            "nm2Score": 984178,
            "nm3Score": 0,
            "nm4Score": 924895,
            "nm5Score": 0,
            "hd1Score": 0,
            "hd2Score": 880796,
            "hr1Score": 0,
            "hr2Score": 0,
            "dt1Score": 1004530,
            "dt2Score": 0,
            "dt3Score": 0
        },
        "player3": {
            "name": "Breast",
            "nm1Score": 0,
            "nm2Score": 675072,
            "nm3Score": 0,
            "nm4Score": 719413,
            "nm5Score": 0,
            "hd1Score": 0,
            "hd2Score": 694331,
            "hr1Score": 0,
            "hr2Score": 0,
            "dt1Score": 0,
            "dt2Score": 1080429,
            "dt3Score": 1077975
        },
        "player4": {
            "name": "origin_",
            "nm1Score": 810669,
            "nm2Score": 976414,
            "nm3Score": 0,
            "nm4Score": 696918,
            "nm5Score": 0,
            "hd1Score": 0,
            "hd2Score": 0,
            "hr1Score": 0,
            "hr2Score": 0,
            "dt1Score": 647829,
            "dt2Score": 721486,
            "dt3Score": 692620
        },
        "player5": {
            "name": "EulaFootEnjoyer",
            "nm1Score": 994377,
            "nm2Score": 0,
            "nm3Score": 0,
            "nm4Score": 0,
            "nm5Score": 0,
            "hd1Score": 0,
            "hd2Score": 0,
            "hr1Score": 0,
            "hr2Score": 0,
            "dt1Score": 0,
            "dt2Score": 1087743,
            "dt3Score": 687383
        },
        "player6": {
            "name": "RMEfan",
            "nm1Score": 0,
            "nm2Score": 0,
            "nm3Score": 0,
            "nm4Score": 0,
            "nm5Score": 0,
            "hd1Score": 0,
            "hd2Score": 0,
            "hr1Score": 0,
            "hr2Score": 0,
            "dt1Score": 0,
            "dt2Score": 0,
            "dt3Score": 0
        },
        "player7": {
            "name": "KC Aqua",
            "nm1Score": 0,
            "nm2Score": 0,
            "nm3Score": 0,
            "nm4Score": 0,
            "nm5Score": 0,
            "hd1Score": 0,
            "hd2Score": 0,
            "hr1Score": 0,
            "hr2Score": 0,
            "dt1Score": 699266,
            "dt2Score": 727275,
            "dt3Score": 1097923
        },
        "player8": {
            "name": "netraena",
            "nm1Score": 0,
            "nm2Score": 0,
            "nm3Score": 0,
            "nm4Score": 0,
            "nm5Score": 0,
            "hd1Score": 0,
            "hd2Score": 438426,
            "hr1Score": 0,
            "hr2Score": 0,
            "dt1Score": 0,
            "dt2Score": 0,
            "dt3Score": 0
        },
        "teamData": {
            "nm1": {
                "score": "3793154",
                "rank": 2
            },
            "nm2": {
                "score": "3281306",
                "rank": 3
            },
            "nm3": {
                "score": "0",
                "rank": 3
            },
            "nm4": {
                "score": "2988821",
                "rank": 2
            },
            "nm5": {
                "score": "0",
                "rank": 7
            },
            "hd1": {
                "score": "0",
                "rank": 13
            },
            "hd2": {
                "score": "2637733",
                "rank": 4
            },
            "hr1": {
                "score": "0",
                "rank": 3
            },
            "hr2": {
                "score": "0",
                "rank": 15
            },
            "dt1": {
                "score": "3386421",
                "rank": 6
            },
            "dt2": {
                "score": "3616933",
                "rank": 3
            },
            "dt3": {
                "score": "3555901",
                "rank": 2
            }
        }
    }
]
```

| Attribute | Description | Data Type | Example |
| --------- | ----------- | --------- | ------- |
| teamName | Name of team | string | "Finland" |
| ISO3166Alpha2 | 2 Letter Country Code | string | "FI" |
| seed | Team seed | number | 1 |
| lastYearSeed | Team seed, last year | number | 1 |
| lastYearPlacement | Where the team ended up, last year | number | 1 |
| player<Number>.name | Name of player | string | "Fairy Bread" |
| player<Number>.<ModId>Score | Score of the player for that Mod ID | string | 123345 |
| teamData.<ModId>.score | Score of the team | number | 123345 |
| teamData.<ModId>.rank | Rank or the team on the map | number | 1 |