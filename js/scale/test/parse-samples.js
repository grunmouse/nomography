const {
	scale, 
	RationalNumber,
	convertConfig,
	evalConfig,
	projMatrix,
	makePS,
	build
} = require('../../index.js');

const fs = require('fs');

function parseSample(code){
	let samples = code.split("\r\n***\r\n");
	
	samples = samples.map((config)=>(evalConfig(convertConfig(config).js)));
	
	return samples;
}

let samples = parseSample(fs.readFileSync('sample.txt', {encoding:'utf8'}));

module.exports = samples;