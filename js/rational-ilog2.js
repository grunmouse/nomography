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
	function cond(y){
		const bcy = b*c**y;
		const ady = a*d**y;
		
		if(ady < bcy){
			return 1;
		}
		const bcy1 = bcy*c;
		const ady1 = ady*d;
		if(ady1 >= bcy1){
			return -1;
		}
		
		return 0;
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
			ymax = ymid;
		}
	}
}

/**
 * @param value : RationalNumber
 * @param base : RationalNumber
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
	
	let x = new RationalNumber(a*d**y, b*c**y).simple();
	
	return {y, x};
}

module.exports = {
	ratlog,
	ilog2frac
};