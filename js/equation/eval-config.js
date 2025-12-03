const vm = require('vm');

const {Vector2} = require('@grunmouse/math-vector');

const {RationalNumber} = require('../rational-number/index.js');

const radian = (deg)=>(deg*Math.PI/180);
const degrees = (x)=>(x*180/Math.PI);

const Degrees = {
	sin:(a)=>Math.sin(radian(a)),
	cos:(a)=>Math.cos(radian(a)),
	tan:(a)=>Math.tan(radian(a)),
	atan:(a)=>(degrees(Math.atan(a))),
	asin:(a)=>(degrees(Math.asin(a))),
	acos:(a)=>(degrees(Math.acos(a)))
};

const context = {
	PI:Math.PI,
	E:Math.E,
	Math,
	Degrees,
	RationalNumber,
	Vector2:(x,y)=>(new Vector2(x.valueOf(), y.valueOf()))
}

function evalConfig(js){
	const script = new vm.Script(js)

	const config = {
		module:{exports:{}},
		...context
	};
	vm.createContext(config);
	script.runInContext(config);
	
	//console.log(config.module.exports);

	return config.module.exports;
}

module.exports = evalConfig;