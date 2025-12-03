const samples = require('./parse-samples.js');

const scale = require('../index.js');
const old = require('../index.js');
const cur = require('../build-scale.js');

//console.log(old.createScaleReport);
//console.log(cur.createScaleReport);

console.log(samples[0].limitTheta.toString());

//createScaleReport(f, metric, D, levels, labeldist, mutedist)