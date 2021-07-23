const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
const cluster = require('cluster');
const express = require('express');
const server = express();
const axios = require("axios")
const register = new client.Registry();
collectDefaultMetrics({ register });
// collectDefaultMetrics({ register });


let boulderwelt_domains = [
  "www.boulderwelt-muenchen-ost.de",
  "www.boulderwelt-muenchen-sued.de",
  "www.boulderwelt-muenchen-west.de",
]



let level_gauge = new client.Gauge({ name: 'boulderwelt_level', help: "boulderwelt response key", labelNames: ['domain'] });
let flevel_gauge = new client.Gauge({ name: 'boulderwelt_flevel', help: "boulderwelt response key", labelNames: ['domain'] });
let isqueue_gauge = new client.Gauge({ name: 'boulderwelt_isqueue', help: "boulderwelt response key", labelNames: ['domain'] });
let queue_gauge = new client.Gauge({ name: 'boulderwelt_queue', help: "boulderwelt response key", labelNames: ['domain'] });
let percent_gauge = new client.Gauge({ name: 'boulderwelt_percent', help: "boulderwelt response key", labelNames: ['domain'] });
let success_gauge = new client.Gauge({ name: 'boulderwelt_success', help: "boulderwelt response key", labelNames: ['domain'] });

const timer = ms => new Promise(res => setTimeout(res, ms));

void async function () {
  while (true) {

    for (const boulderwelt of boulderwelt_domains) {
      const params = new URLSearchParams();

      params.append("action", "cxo_get_crowd_indicator")

      axios.post("https://" + boulderwelt + "/wp-admin/admin-ajax.php", params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).then((res) => {
        console.log("setting", boulderwelt);
        level_gauge.labels({ domain: boulderwelt }).set(res.data.level)
        flevel_gauge.labels({ domain: boulderwelt }).set(res.data.flevel)
        isqueue_gauge.labels({ domain: boulderwelt }).set(res.data.isqueue ? 1 : 0)
        queue_gauge.labels({ domain: boulderwelt }).set(res.data.queue)
        percent_gauge.labels({ domain: boulderwelt }).set(res.data.percent)
        success_gauge.labels({ domain: boulderwelt }).set(res.data.success ? 1 : 0)
      }).catch(e => {
        console.log(e);
      })
    }

    await timer(3000)
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