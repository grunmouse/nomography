const {Matrix, SquareMatrix3} = require('@grunmouse/math-matrix');
const {Vector} = require('@grunmouse/math-vector');

/**
 * Находит матрицу, отображающую четвёрку точек ABCD на четвёрку точек (0;0),(1;0),(1;1),(0;1)
 * Возвращает промежуточные матрицы
 * @param A : Vector2
 * @param B : Vector2
 * @param C : Vector2
 * @param D : Vector2
 * @return object {R, offset, S, Alpha, Psi}
 * @property R : SquareMatrix3 - рабочая матрица R = Psi*Alpha*S
 * @property offset : Vector2 - вектор, который вычитается
 * @property S : SquareMatrix3 - соответствующая ему матрица сдвига
 * @property Alpha : SquareMatrix3 - матрица афинного преобразования в форму (0;0),(1;0),(Ca.x;Ca.y),(0;1)
 * @property Psi : SquareMatrix3 - матрица афинного преобразования из (0;0),(1;0),(Ca.x;Ca.y),(0;1) в (0;0),(1;0),(1;1),(0;1)
 */
function algo(A, B, C, D){
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
	const Ca = AS.mul(C.toProjective());
	
	const Psi = new SquareMatrix3([
		(Ca.y-1)/Ca.x + 1,	0,					0,
		0,					(Ca.x-1)/Ca.y+1,	0,
		(Ca.y-1)/Ca.x,		(Ca.x-1)/Ca.y,		1
	]);
	
	const R = Psi.mul(AS);
	return {R, Alpha, Psi, S, offset:A}
}

/**
 * Генерирует матрицу, отображающую четвёрку точек from в четвёрку точек to
 * @param from : Array[4]<Vector2>
 * @param to : Array[4]<Vector2>
 * @return SquareMatrix3
 */
function getConvertMatrix(from, to){
	const Rfrom = algo(...from).R;
	const intRto = algo(...to).R;
	const Rto = intRto.inverse();
	const R = Rto.mul(Rfrom);
	
	return R;
}

function makefun({R}){
	return function(P){
		//console.log();
		//console.log('source ',P)
		const Pp = R.mul(P.toProjective());
		//console.log('proj ',Pp)
		const ret = Pp.fromProjective();
		//console.log('result ',ret);
		return ret;
	}
}

module.exports = {
	algo,
	makefun,
	getConvertMatrix
};