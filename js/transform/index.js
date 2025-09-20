const projective = require('./projective.js');
const affine = require('./affine.js');
const size = require('./affine-scale.js');

module.exports = {
	projective,
	projMatrix:projective.getConvertMatrix,
	affineMatrix:affine.getConvertMatrix,
	sizeMatrix:size.toSizeMatrix
}