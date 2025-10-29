
const scale = require('./scale/index.js');
const fcurve = require('./f-curve.js');

const {RationalNumber} = require('./rational-number/index.js');

const convertConfig = require('./equation/index.js').convertConfig;

const transform = require('./transform/index.js');

const Curve = require('./curve/curve.js');

module.exports = {
	fcurve,
	scale,
	Curve,
	RationalNumber,
	...transform,
	convertConfig,
	makePS:require('./make-ps.js')
};
