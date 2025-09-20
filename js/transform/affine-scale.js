const convex = require('@grunmouse/convex');


/**
 * Находит такое аффинное преобразование, чтобы точки B вписались в прямоугольную область (0;0),(0;height),(width;height), (width;0)
 */
function toSizeMatrix(B, width, height){
	let area = convex.rectangleArea(B);
	let [A, C] = area;
	
	const S = new SquareMatrix3([
		1, 0, -A.x,
		0, 1, -A.y,
		0, 0, 1
	]);
	C = C.sub(A);
	const H = new SquareMatrix3([
		width/C.x, 0, 0,
		0, height/C.y, 0,
		0, 0, 1
	]);
	
	let M = H.mul(A);
	return M;
}

module.exports = {
	toSizeMatrix
}