const assert = require('assert');

const {
	createLabeled,
	createMute
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
		
		const levels = [0.001, 0.005, 0.01, 0.05, 0.1, 0.5];
		
		const table = createLabeled(fun, [1,10], levels, {min:3, max:8});
		
		const muteTable = [];
		for(let i=1; i<table.length; ++i){
			let gr = createMute(fun, [table[i-1].a, table[i].a], levels, {min:0.5});
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