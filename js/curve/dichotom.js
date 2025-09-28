/**
 * Утилитарные функции
 */
const sign = Math.sign;
const abs = Math.abs;

function dichotom(f, y, a, b, delta){
	var A = f(a), B, x, Y, d, k, n=10000;
	if(abs(A-y)<delta){
		return a;
	}
	B = f(b);
	if(abs(B-y)<delta){
		return b;
	}
	if(A>y && B>y || A<y && B<y){
		return undefined;
	}
	d = B-A;
	x = (a+b)/2;
	Y=f(x);
	while(abs(Y-y)>=delta && --n && (x>a && x<b) ){
		k = (Y-y)*d;
		if(k>0){
			B=Y;
			b=x;
		}
		else{
			A=Y;
			a=x;
		}
		x = (a+b)/2;
		Y=f(x);
	}

	return n && !isNaN(Y) ? x : undefined;
}

function expandInterval(f, y, a, b, delta) {
	//[a,b] = ensureLimits(f, a, b);
	let A = f(a), B = f(b);
	const Y = [A,B]; //Учёт всех пройденных точек
	const X = [a,b]; //Учёт всех пройденных точек
	
	let step_a = step_b = b-a;
	
	//Процедуры увеличения пределов
	//Побочные эффекты 
	// меняют a, b, A, B, step_a, step_b
	//добавляют значения 
	/**
	 * увеличение b
	 * меняет b, B, step_b
	 * добавляет значения в конец X, Y
	 */
	function incB(){
		let q = b+step_b;
		let Q = f(q);
		if(isNaN(Q)){
			step_b /= 2;
		}
		else{
			b = q;
			B = Q;
			Y.push(B);
			X.push(b);
			step_b *= 2;
		}
		return Q;
	}
	/**
	 * уменьшение a
	 * меняет a, A, step_a
	 * добавляет значения в начало X, Y
	 */
	function decA(){
		let p = a-step_a;
		let P = f(p);
		if(isNaN(P)){
			step_a /= 2;
		}
		else{
			a = p;
			A = P;
			Y.unshift(A);
			X.unshift(a);
			step_a *=2;
		}
		return P;
	}
	
	let tol = 8*delta;
	while(abs(A-B)<tol){
		let P = decA()
		let Q = incB()

		if(isNaN(Q) && isNaN(P) && abs(Q-P)<tol){
			break;
		}
	}
	
	let d = sign(B-A); //Признак возрастания
	//Цель sing(B-y) === sign(y-A) === sign(B - A)
	while(sign(B-y)!==sign(y-A)){ //y не между A и B
		if(sign(B-y) !== d){
			incB();
		}
		if(sign(y-A) !== d){
			decA();
		}
		d = sign(B-A);
	}
	
	
	return [a,b];
}

/**
 * Находит
 */
function ensureLimits(f, a, b){
	let A = f(a);
	let B = f(b);
	while(isNaN(A)){
		a = (a+b)/2;
		A = f(a);
	}
	while(isNaN(B)){
		b = (a+b)/2;
		B = f(b);
	}
	return [a,b];
}

module.exports = function(f, y, a, b, delta){
	[a,b] = ensureLimits(f, a, b);
	[a,b] = expandInterval(f, y, a, b, delta);
	return dichotom(f, y, a, b, delta);
}