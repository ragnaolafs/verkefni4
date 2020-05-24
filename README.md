# Verkefni 4 – okkar eigið apis.is

[apis.is](https://apis.is) verkefnið nýtir scraping til að gera aðgengileg gögn frá íslenskum vefjum. Í þessu verkefni ætlum við að útbúa okkar eigin vefþjónustu ofan á [próftöflu gögn HÍ fyrir vormisseri 2018](https://ugla.hi.is/Proftafla/View/index.php?view=proftaflaYfirlit&sid=2030&proftaflaID=37). Þar sem gögnin breytast lítið skulu þau vera geymd (cached) í redis í a.m.k. 2 klukkustundir. Einnig skal birta smá tölfræði um prófatöflurnar.

## Próftöflur

Sækja skal gögn með [`fetch`](https://github.com/matthew-andrews/isomorphic-fetch) og vinna úr þeim með [`cheerio`](https://github.com/cheeriojs/cheerio).

Úr gögnum skal vinna allar deildir innan sviðs með heiti og fyrir hvert próf:

* Heiti námskeiðs
* Númer námskeiðs
* Tegund prófs
* Fjölda í prófi sem tölu
* Dagsetning prófs

Gefið er API í `scraper.js`.

## Tölfræði

Fyrir öll svið í `departments` skal sækja gögn og ítra í hverjum hverja deild og hvert próf og finna:

* Heildarfjölda prófa
* Heildarfjölda í öllum prófum
* Meðalfjölda nemenda í prófi með tveim aukastöfum
* Fjölda nemenda í prófi með fæstum nemendum
* Fjölda nemenda í prófi með flestum nemendum

## Caching

Þegar sækja á próftöflu þarf fyrst að athuga hvort til sé eintak af henni í cache, annaðhvort má geyma „hrá gögn“ frá vef eða niðurstöðu úr því að vinna þau. Ef gögn eru til í cache skal þeim skilað í stað þess að sækja af vef. Tengjast skal redis með [`redis`](https://github.com/NodeRedis/node_redis) og nota `REDIS_URL` til að tengjast redis og `REDIS_EXPIRE` til að vita hve lengi eigi að geyma gögnin.

Bjóða skal uppá möguleika á að hreinsa öll gögn úr cache, þá skal finna alla lykla sem búið er að geyma í redis (því er æskilegt er að hafa prefix á lyklum) og þeim eytt.

## API

`GET` á `/` sýnir lista af sviðum ásamt slóð á próftöflu sviðs ásamt slóðum á virkni til að hreinsa cache og á tölfræði, t.d.

```json
{
  "elapsed": 1.460164,
  "departments": [
    {
      "name": "Félagsvísindasvið",
      "link": "/felagsvisindasvid"
    },
    ...
  ],
  "clearCache": "/clearCache",
  "stats": "/stats"
}
```

`GET` á `/:department` sýnir lista af deildum innan sviðs með heiti og hreiðruðum lista af prófum þeirrar deildar, t.d. `/

```json
{
  "elapsed": 2070.243954,
  "tests": [
    {
      "heading": "Iðnaðarverkfræði-, vélaverkfræði- og tölvunarfræðideild",
      "tests": [
        {
          "course": "VÉL202G",
          "name": "Burðarþolsfræði",
          "type": "Skriflegt",
          "students": 83,
          "date": "Þri. 24 apr. 2018 kl. 09:00 - 12:00"
        },
        ...
      ]
    },
    ...
  ]
},
```

`GET` á `/clearCache` hreinsar cache skv. lýsingu að ofan og skilar `true` eða `false` eftir því hvort það gekk, t.d.

```json
{
  "elapsed": 1.532079,
  "cleared": true
}
```

`GET` á `/stats` skilar tölfræði um prófatöflur skv. lýsingu að ofan, t.d.


```json
{
  "elapsed": 1180.035303,
  "stats": {
    "min": 1,
    "max": 276,
    "numTests": 422,
    "numStudents": 18038,
    "averageStudents": "42.74"
  }
}
```

Fyrir hvert kall er tekinn tími á því hve lengi kallið tók og því skilað sem millisekúndum í svari undir `elapsed`.


Express vefþjónn keyrir með `npm start`.

