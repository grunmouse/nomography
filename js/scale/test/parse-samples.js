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

function * mulArrays(a, b, oper){
	for(let y of b) for(let x of a){
		yield oper(x,y)
	}
}

function parseSample(code, a, b){
	let samples = code.split(/\r\n===+\r\n/g);
	
	samples = samples.map(sample=>{
		let parts = sample.split(/\r\n\*\*\*+\r\n/g);
		parts = parts.map(part=>(part.split(/\r\n\+\+\++\r\n/g)));
		
		let variants = parts.reduce((akk, part)=>([...mulArrays(akk, part, (x,y)=>(x+'\r\n\r\n'+y))]), ['']);
		
		return variants;
	}).flat()
	
	samples = samples.map((config)=>(evalConfig(convertConfig(config).js)));
	
	return samples;
}

let samples = parseSample(fs.readFileSync('sample.txt', {encoding:'utf8'}));

module.exports = samples;