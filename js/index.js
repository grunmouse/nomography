const projective = require('./projective.js');
const affine = require('./affine.js');
const size = require('./affine-scale.js');
const scale = require('./scale.js');
const fcurve = require('./f-curve.js');

const RationalNumber = require('./rational-number.js');

const convertConfig = require('./equation/index.js').convertConfig;

module.exports = {
	fcurve,
	scale,
	RationalNumber,
	projective,
	projMatrix:projective.getConvertMatrix,
	affineMatrix:affine.getConvertMatrix,
	sizeMatrix:size.toSizeMatrix,
	convertConfig
};
