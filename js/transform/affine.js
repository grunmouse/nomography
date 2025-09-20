const {Matrix, SquareMatrix3} = require('@grunmouse/math-matrix');
const {Vector} = require('@grunmouse/math-vector');

/**
 * Находит матрицу, отображающую тройку точек ABD на тройку точек (0;0),(1;0),(0;1)
 * Возвращает промежуточные матрицы
 * @param A : Vector2
 * @param B : Vector2
 * @param D : Vector2
 * @return object {R, offset, S, Alpha}
 * @property R : SquareMatrix3 - рабочая матрица R = Alpha*S
 * @property offset : Vector2 - вектор, который вычитается
 * @property S : SquareMatrix3 - соответствующая ему матрица сдвига
 * @property Alpha : SquareMatrix3 - матрица афинного преобразования в форму (0;0),(1;0),(0;1)
 */
function algo(A, B, D){
	const S = new SquareMatrix3([
		1, 0, -A.x,
		0, 1, -A.y,
		0, 0, 1
	]);
	const Bs = B.sub(A);
	const Ds = D.sub(A);
	
	const invAlpha = new SquareMatrix3([
		Ds.x, Bs.x, 0,
		Ds.y, Bs.y, 0,
		0, 0, 1
	]);
	
	const Alpha = invAlpha.inverse();
	
	const AS = Alpha.mul(S);
	return {R:AS, Alpha, S, offset:A}
}

/**
 * Генерирует матрицу, отображающую тройку точек from в тройку точек to
 * @param from : Array[3]<Vector2>
 * @param to : Array[3]<Vector2>
 * @return SquareMatrix3
 */
function getConvertMatrix(from, to){
	const Rfrom = algo(...from).R;
	const invRto = algo(...to).R;
	const Rto = invRto.inverse();
	const R = Rto.mul(Rfrom);
	
	return R;
}

module.exports = {
	getConvertMatrix
};