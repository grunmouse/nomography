const projective = require('./projective.js');
const affine = require('./affine.js');
const size = require('./affine-scale.js');
const scale = require('./scale.js');
const fcurve = require('./f-curve.js');

module.exports = {
	fcurve,
	scale,
	projective,
	projMatrix:projective.getConvertMatrix,
	affineMatrix:affine.getConvertMatrix,
	sizeMatrix:size.toSizeMatrix
}