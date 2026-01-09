const {
	controlDist
} = require('./testing-lib.js');

const samples = require('./parse-samples.js');
const {
	projMatrix
} = require('../../index.js');

const scale = require('../index.js');
const old = require('../index.js');
const cur = require('../build-scale.js');

//console.log(old.createScaleReport);
//console.log(cur.createScaleReport);

const resolveConfig = require('./resolve-config.js');

const {Vector2} = require('@grunmouse/math-vector');

function listSample(config){
	let points = Object.keys(config).filter(a=>(a.indexOf('point')===0));
	
	return points.map(name=>(name.slice(5)));s
}

const a = 180, b = 250;
const format = [
	new Vector2(0,0),
	new Vector2(0,b),
	new Vector2(a,b),
	new Vector2(a,0)
];


	samples.forEach(sample=>{
		const {A,B,C,D} = sample;
		const M = projMatrix([A,B,C,D], format);
		sample.M = M;
	});

const labeldist = {min:10, max:25}, mutedist = {min:0.7, max:2.5};


function scaleArguments(config, name){
	let pointFn = resolveConfig(config, name, 'point');
	let limits = [resolveConfig(config, name, 'min'),resolveConfig(config, name, 'max')];
	let M = config.M;
	
	return [
			(t) => (M.mul(pointFn(t).extend(1)).cut(2)),  // Общий паттерн для проекции
			scale.euclid,
			limits,
			scale.rational25Levels,
			labeldist,
			mutedist
	]

}

const scales = samples.map(config=>(listSample(config).map(name=>scaleArguments(config, name)))).flat();

let sc = cur.createScaleReport(...scales[1]);

//console.log(sc);

let res = controlDist(sc, scale.euclid, labeldist, mutedist);

console.log(res);
//createScaleReport(f, metric, D, levels, labeldist, mutedist)