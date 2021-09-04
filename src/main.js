const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
const cluster = require('cluster');
const express = require('express');
const cheerio = require('cheerio');
const server = express();
const axios = require("axios")
const register = new client.Registry();
collectDefaultMetrics({ register });
// collectDefaultMetrics({ register });


let gyms = [
  {
    name: "www.boulderwelt-muenchen-ost.de",
    url: "https://www.boulderwelt-muenchen-ost.de/wp-admin/admin-ajax.php",
    parser: "boulderwelt"
  },
  {
    name: "www.boulderwelt-muenchen-sued.de",
    url: "https://www.boulderwelt-muenchen-sued.de/wp-admin/admin-ajax.php",
    parser: "boulderwelt"
  },
  {
    name: "www.boulderwelt-muenchen-west.de",
    url: "https://www.boulderwelt-muenchen-west.de/wp-admin/admin-ajax.php",
    parser: "boulderwelt"
  },
  {
    name: "www.boulderwelt-dortmund.de",
    url: "https://www.boulderwelt-dortmund.de/wp-admin/admin-ajax.php",
    parser: "boulderwelt"
  },
  {
    name: "www.boulderwelt-frankfurt.de",
    url: "https://www.boulderwelt-frankfurt.de/wp-admin/admin-ajax.php",
    parser: "boulderwelt"
  },
  {
    name: "www.boulderwelt-regensburg.de",
    url: "https://www.boulderwelt-regensburg.de/wp-admin/admin-ajax.php",
    parser: "boulderwelt"
  },
]



// let level_gauge = new client.Gauge({ name: 'gym_level', help: "Current gym occupantion level in percent", labelNames: ['domain'] });
// let queueing_gauge = new client.Gauge({ name: 'gym_queueing', help: "Displays if a gym has a waiting queue at check-in", labelNames: ['domain'] });
// let flevel_gauge = new client.Gauge({ name: 'gym_flevel', help: "Max gym occupation level according to corona guidelines", labelNames: ['domain'] });
// let queue_gauge = new client.Gauge({ name: 'gym_queue', help: "Displays the amount of people that are currently waiting at check-in", labelNames: ['domain'] });
let level_gauge = new client.Gauge({ name: 'gym_level', help: "The occupation level", labelNames: ['domain'] });
let success_gauge = new client.Gauge({ name: 'gym_success', help: "Request success", labelNames: ['domain'] });

const timer = ms => new Promise(res => setTimeout(res, ms));

void async function () {
  while (true) {

    for (const gym of gyms) {

      if (gym.parser == "boulderwelt") {

        const params = new URLSearchParams();

        params.append("action", "cxo_get_crowd_indicator")

        axios.post(gym.url, params, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }).then((res) => {
          console.log("setting", gym.name);
          level_gauge.labels({ domain: gym.name }).set(res.data.level)
          success_gauge.labels({ domain: gym.name }).set(res.data.success ? 1 : 0)
        }).catch(e => {
          console.log(e);
        })
      }

      if (gym.parser == "boulderado") {
        axios.get(gym.url).then(res => {
          console.log(res.data);
          const $ = cheerio.load(res.data)
          const people = $('.actcounter [data-value]').html();
          const free = $('.freecounter [data-value]').html();
          level_head_count.labels({ domain: gym.name }).set(people)
          level_free_count.labels({ domain: gym.name }).set(free)
        })
      }
    }

    await timer(15000)
  }
}();

server.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

server.listen(5080);