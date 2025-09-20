const assert = require('assert');

const {
	createLabeled,
	createMute,
	//decimalLevels,
	decimal25Levels,
	rational25Levels,
	createScaleReport,
	
	euclid
} = require('../scale/index.js');

describe('labeled', ()=>{
	it('case (sub 1 .. over 5)', ()=>{
		const fun = (val)=>{
			return {
				x:val*10,
				y:0
			}
		};
		let lim = [0.8, 5.1];
		const table = createScaleReport(fun, euclid, lim, rational25Levels, {min:3, max:6}, {min:0.5});
		console.log(table);
	});

});