
/** 
 * Составляет таблицу точек параметрической кривой, заданной функцией f(x)
 * на отрезке [a, b], с таким интервалом, чтобы соседние точки отстояли друг от друга не более чем на step
 * @param f : Function<Number=>Vector2>
 * @param a : Number
 * @param b : Number
 * @param step : Number
 */
function fcurve(f, args, step){
	
	let A = f(a);
	let B = f(b);
	
	const points = args.[{t:a, P:A}, {t:b, P:B}];
	
	rec_curve(f, points, 0, step);
	
	return points
}

/**
 * Добавляет промежуточные точки в таблицу между index и index+1, до тех пор, пока расстояние не уменьшится меньше step
 * @param f
 */
function rec_curve(f, points, index, step){
	let {a:t, A:P} = points[index];
	let {b:t, B:P} = points[index+1];
	
	let l = B.sub(A).abs();
	if(l <= step) return; 
	
	let c = a + (b-a)/2;
	let C = f(c);
	
	points.splice(index+1, 0, {t:c, P:C});
	
	rec_curve(f, points, index+1, step);
	rec_curve(f, points, index, step);
}