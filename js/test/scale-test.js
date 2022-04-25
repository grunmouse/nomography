const assert = require('assert');

const {
	createLabeled
} = require('../scale.js');

describe('labeled', ()=>{
	it('log', ()=>{
		const lambda = 30/Math.log(10);
		const fun = {
			x:(t)=>(lambda*Math.log(t)),
			y:()=>(0)
		};
		
		const table = createLabeled(fun, [1,1000], [0.5,1,5,10,50,100,500], {min:3, max:6});
		
		console.log(table);
	});
});