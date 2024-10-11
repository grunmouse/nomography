const RationalNumber = require('./rational-number.js');
const {
	bigint
} = require('@grunmouse/binary');

/**
 * Целая часть двоичного логарифма отношения b/a
 * @param b : BigInt
 * @param a : BigInt
 */
function ilog2frac(b, a){
	const n = bigint.ilog2(b);
	const m = bigint.ilog2(a);
	
	let p = n - m;
	
	//2**m * b < 2**n * a
	let cond = (b<<m) < (a<<n);
	if(cond){
		p = p - 1n;
	}
	
	return p;
}


function findy(a, b, c, d, ymin, ymax){
	/*
	Действует дополнительное соглашение, что c > d
	*/
	if(d > c){
		throw new Error('Некорректное использование findy: c/d<1');
	}
	
	/*	
		Реслизует проверку найденного y
		@return 0 - значение подошло
				-1 - значение нужно уменьшить
				1 - значение нужно увеличить
	*/
	function cond(y){
		//TODO проверить логику
		/*
			Проверяемая функция:
			f(y) = a/b * (d/c)**y;
			
			Первое условие
			1 <= f(y)
			Второе условие
			f(y) < c/d
			
			Т.к. d/c<1, функция f(y) убывает.
			Если y будет слишком большим - нарушится первое условие.
			Если y будет слишком маленьким - нарушится второе условие.
			
			Преобразование первого условия:
			1 <= a/b * (d/c)**y; - исходный вариант
			b * c**y <= a * d**y;
			
			1 <= a/b * (c/d)**(-y); - вариант для отрицательного y
			b * d**(-y) <= a * c**(-y);
			
			Преобразование второго условия:
			a/b * (d/c)**y < c/d; - исходный вариант
			a * d**(y+1) < b * c**(y+1);
			
			a/b * (c/d)**(-y) < c/d; - вариант для отрицательного y
			a * c**(-y)/d**(-y) < b * c/d;
			a * c**(-y) < b * c * d**(-y-1);
			a * c**(-y-1) < b * d**(-y-1);
			
		*/
		if(y < 0n){
			//Первое условие
			if(b * d**(-y) <= a * c**(-y)){
				//Второе условие
				if(a * c**(-y-1n) < b * d**(-y-1n)){
					return 0;
				}
				else{
					//y слишком маленький
					return 1; //увеличить
				}
			}
			else{
				//y слишком большой
				return -1; //уменьшить
			}
		}
		else{
			//Первое условие
			if(b * c**y <= a * d**y){
				//Второе условие
				if(a * d**(y+1n) < b * c**(y+1n)){
					return 0;
				}
				else{
					//y слишком маленький
					return 1; //увеличить
				}
			}
			else{
				//y слишком большой
				return -1; //уменьшить
			}
			
		}
	}

	let lmin = cond(ymin);
	if(lmin === 0){
		return ymin;
	}
	else if(lmin === -1){
		throw new Error('сломался findy lmin');
	}
	let lmax = cond(ymax);
	if(lmax === 0){
		return lmax;
	}
	else if(lmax === 1){
		throw new Error('сломался findy lmax');
	}
	
	while(true){
		if(ymax - ymin < 2n){
			throw new Error('сломался findy range');
		}
		let ymid = (ymax + ymin)/2n;
		let lmid = cond(ymid);
		if(lmid == 0){
			return ymid;
		}
		else if(lmid === -1){
			ymax = ymid;
		}
		else if(lmid === 1){
			ymin = ymid;
		}
	}
}

/**
 * @param value : RationalNumber
 * @param base : RationalNumber
 * @return {x, y} : value = x * base**y \land y = floor(log(value)/log(base))
 */
function ratlog(value, base){

	if(value.le(0)){
		throw new RangeError('log(0)');
	}
	if(base.le(0)){
		throw new RangeError('log base 0');
	}
	if(base.eq(1)){
		throw new RangeError('log base 1');
	}
	
	const a = value.nom, b = value.den;
	const c = base.nom, d = base.den;
	
	if(d > c){
		let {y, x} = ratlog(value.inv(), base.inv());
		x = x.inv();
		
		return {y, x};
	}
	
	const p = ilog2frac(a, b);
	const q = ilog2frac(c, d);
	let umax, umin;
	
	if(p == 0n && q == 0n){
		let u = Math.log2(value.toNumber())/Math.log2(base.toNumber());
		umax = BigInt(Math.ceiling(u));
		umin = BigInt(Math.floor(u));
	}
	else if(p == 0n && q != 0n){
		umax = 1n;
		umin = 0n;
	}
	else if(p != 0n && q == 0n){
		let _q = Math.log2(base.toNumber());
		
		umin = new RationalNumber(p, _q).floor();
		umax = new RationalNumber(p+1n, _q).ceil();
	}
	else{
		umin = new RationalNumber(p, q + 1n).floor();
		umax = new RationalNumber(p, q).ceil() + 2n;
	}
	
	let y = findy(a, b, c, d, umin-1n, umax);
	
	let x;
	if(y<0n){
		x = new RationalNumber(a*c**(-y), b*d**(-y)).simple();
	}
	else{
		x = new RationalNumber(a*d**y, b*c**y).simple();
	}
	
	return {y, x};
}

module.exports = {
	ratlog,
	ilog2frac
};