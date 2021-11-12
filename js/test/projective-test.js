const assert = require('assert');

const {algo, makefun} = require('../projective.js');
const {Vector} = require('@grunmouse/math-vector');

describe('algo', ()=>{
	it('sample1', ()=>{
		const A = new Vector(1, 1);
		const B = new Vector(2, 2);
		const C = new Vector(3, 4);
		const D = new Vector(0, 4);
		
		const param = algo(A, B, C, D);
		const {R, offset} = param;
		const invR = R.inverse();
		const fun = makefun(param);
		
		assert(fun(A).eq(Vector.O(2)));
		assert(fun(B).eq(new Vector(0, 1)));
		assert(fun(D).eq(new Vector(1, 0)));
		let diff = Math.max(...fun(C).sub(new Vector(1, 1)).map(Math.abs));
		console.log(diff);
		assert(Math.log(diff)<10);
		
		console.log(invR.mul(new Vector(1, 0, 1)).fromProjective()); 
	});
});