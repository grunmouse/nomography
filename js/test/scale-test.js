const assert = require('assert');

const {
	createLabeled,
	createMute,
	decimalLevels,
	decimal25Levels,
	euclid
} = require('../scale.js');

describe('labeled', ()=>{
	it('log', ()=>{
		const max_length = 270;

		const tau_max = 10;
		const tau_min = 1;
		const line_count = 10;
		const lambda = max_length * line_count / 2;

		const fun = {
			x:(t)=>(lambda * Math.log10(t)),
			y:(t)=>(0)
		};
		
		const table = createLabeled(fun, euclid, [1.8,2.1], decimal25Levels, {min:3, max:6});
		
		const muteTable = [];
		console.log(table);
		
		for(let pair of table.pairsUp()){
			let gr = createMute(fun, euclid, [pair[0].a, pair[1].a], decimalLevels, {min:0.5});
			muteTable.push(gr);
			//console.log(gr.step, gr.prev);
			
			let {step, prev, min, max} = gr;
			if(step.equals(prev)){
				console.log(`${min} ${max} ${step} 2 mutegroup`);
			}
			else{
				let den = 10**(-step.e);
				let nom = prev.times(den).toNumber();
				console.log(`${min} ${max} ${step} 2 ${nom} ${den} rat mutegroup2`);
			}
		}
		//console.table(muteTable);
	});
	
});