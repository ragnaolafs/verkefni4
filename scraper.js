require('dotenv').config();
require('isomorphic-fetch');
const cheerio = require('cheerio');
const redis = require('redis');
const util = require('util');

const redisOptions = {
  url: 'redis://127.0.0.1:6379/0'
}

const client = redis.createClient(redisOptions);

const asyncGet = util.promisify(client.get).bind(client);
const asyncSet = util.promisify(client.set).bind(client);
const asyncKeys = util.promisify(client.keys).bind(client);
const asyncDel = util.promisify(client.del).bind(client);

/* todo require og stilla dót */

/**
 * Listi af sviðum með „slug“ fyrir vefþjónustu og viðbættum upplýsingum til
 * að geta sótt gögn.
 */
const departments = [
  {
    name: 'Félagsvísindasvið',
    slug: 'felagsvisindasvid',
  },
  {
    name: 'Heilbrigðisvísindasvið',
    slug: 'heilbrigdisvisindasvid',
  },
  {
    name: 'Hugvísindasvið',
    slug: 'hugvisindasvid',
  },
  {
    name: 'Menntavísindasvið',
    slug: 'menntavisindasvid',
  },
  {
    name: 'Verkfræði- og náttúruvísindasvið',
    slug: 'verkfraedi-og-natturuvisindasvid',
  },
];




/**
 * Sækir svið eftir `slug`. Fáum gögn annaðhvort beint frá vef eða úr cache.
 *
 * @param {string} slug - Slug fyrir svið sem skal sækja
 * @returns {Promise} Promise sem mun innihalda gögn fyrir svið eða null ef það finnst ekki
 */
async function getTests(slug) {
  /* todo */
  const departmentTests = [];
  let key = '1';
  let response = await fetch('https://ugla.hi.is/Proftafla/View/ajax.php?sid=2027&a=getProfSvids&proftaflaID=37&svidID=5&notaVinnuToflu=0');;
  if (slug === 'felagsvisindasvid') {
    key = '2';
    response = await fetch('https://ugla.hi.is/Proftafla/View/ajax.php?sid=2027&a=getProfSvids&proftaflaID=37&svidID=1&notaVinnuToflu=0');
  }
  else if (slug === 'heilbrigdisvisindasvid') {
    key = 'dept2';
    response = await fetch('https://ugla.hi.is/Proftafla/View/ajax.php?sid=2027&a=getProfSvids&proftaflaID=37&svidID=2&notaVinnuToflu=0');
  }
  else if (slug === 'hugvisindasvid') {
    key = 'dept3';
    response = await fetch('https://ugla.hi.is/Proftafla/View/ajax.php?sid=2027&a=getProfSvids&proftaflaID=37&svidID=3&notaVinnuToflu=0');
  }
  else if (slug === 'menntavisindasvid') {
    key = 'dept4';
    response = await fetch('https://ugla.hi.is/Proftafla/View/ajax.php?sid=2027&a=getProfSvids&proftaflaID=37&svidID=4&notaVinnuToflu=0');
  }
  else if (slug === 'verkfraedi-og-natturuvisindasvid') {
    key = 'dept5';
    response = await fetch('https://ugla.hi.is/Proftafla/View/ajax.php?sid=2027&a=getProfSvids&proftaflaID=37&svidID=5&notaVinnuToflu=0');
  }
  
  //const cached = await asyncGet(key);
  //console.log('',cached)

  /*if (cached) {
    return JSON.parse(cached);
  }*/

  const text = await response.json();  

  const $ = cheerio.load(text.html);

  

  const h3s = $('h3')
  h3s.each((i, el) => {
    const h3 = $(el);
    //console.log(h3.text())
    departmentTests.push( { heading: h3.text().trim(), tests: [] } );
    const data = h3.next('table').find('tbody')
    const tests = [];
    data.each((k, el1) => {
      const tr = $(el1).find('tr');
      tr.each((j, el2) => {
        const td = $(el2).find('td');
        const array = [];
        td.each((h, el3) => {
          array.push($(el3).text().trim());
        });
        departmentTests[i].tests.push({
          course: array[0],
          name: array[1],
          type: array[2],
          students: Number(array[3]),
          date: array[4],
        });
      });
    });
    //console.log(departmentTests[i])
  });
  //await asyncSet(key, JSON.stringify(departmentTests));
  //await asyncSet(key, departmentTests);
  return departmentTests;
  
}

/**
 * Hreinsar cache.
 *
 * @returns {Promise} Promise sem mun innihalda boolean um hvort cache hafi verið hreinsað eða ekki.
 */
async function clearCache() {
  /* todo */
  await asyncDel.apply(client, '2');
}

/**
 * Sækir tölfræði fyrir öll próf allra deilda allra sviða.
 *
 * @returns {Promise} Promise sem mun innihalda object með tölfræði um próf
 */
async function getStats() {
  const stats = [];
  let count = 0;
  let minStudents = Infinity;
  let maxStudents = 0;
  let numStudents = 0;
  for (var i = 0; i < departments.length; i += 1) {
    const departmentTests = await getTests(departments[i].slug);
    for (var j = 0; j < departmentTests.length; j += 1) {
      count += departmentTests[j].tests.length;
      for (var k = 0; k < departmentTests[j].tests.length; k += 1) {
        minStudents = Math.min(minStudents, departmentTests[j].tests[k].students);
        maxStudents = Math.max(maxStudents, departmentTests[j].tests[k].students);
        numStudents += departmentTests[j].tests[k].students;
      }
    }
  }
  const averageStudents = numStudents/count;
  stats.push( { 
    min: minStudents, 
    max: maxStudents, 
    numTests: count, 
    numStudents,
    averageStudents 
   });
  return stats;
}

module.exports = {
  departments,
  getTests,
  clearCache,
  getStats,
};
