
const {
	operators:{
		add,
		sub,
		neg,
		div,
		mul,
		pow,
		eq,
		lt,
		gt
	}
} = require('@grunmouse/multioperator-ariphmetic');

const {
	bigint,
	float64
} = require('@grunmouse/binary');

/**
 * @param a : BigInt
 * @param m : BigInt
 */
function mfloor(a, m){
	return (a/m)*m;
}

function mceil(a, m){
	let b = mfloor(a,m);
	return b<a ? b+m : a;
}

function NOD(a, b){
	while(a != b){
		if(a > b){
			a = a - b;
		}
		else{
			b = b - a;
		}
	}
	return a;
}

class RationalNumber {
	constructor(nom, den){
		if(nom instanceof RationalNumber){
			return nom;
		}
		if(den == null){
			if(typeof nom === 'number'){
				if(Number.isInteger(nom)){
					nom = BigInt(nom);
					den = 1n;
				}
				else{
					let {sign, sizedMant, sizedExp} = float64.decompFloat64(nom);
					//abs(V) = sizedMant * 2**sizedExp = sizedMant / (2**(-sizedExp))
					nom = sign*sizedMant;
					den = 1n<<(-sizedExp);
				}
			}
			else{
				den = 1n;
			}
		}
		else{
			den = BigInt(den);
			nom = BigInt(nom);
		}
		if(den<0n){
			nom = -nom;
			den = -den;
		}
		this.nom = nom;
		this.den = den;
	}
	
	sign(){
		return this.nom < 0n ? -1 : this.nom > 0n ? 1 : 0;
	}
	
	simple(){
		if(this.nom === 0n){
			return this.den === 1n ? this : new this.constructor(0n, 1n);
		}
		let nod = NOD(this.nom < 0n ? -this.nom : this.nom, this.den);
		
		return nod > 1n ? new this.constructor(this.nom/nod, this.den/nod) : this;
	}
	
	inv(){
		return new this.constructor(this.den, this.nom);
	}
	
	isPositive(){
		return this.nom >= 0n;
	}
	
	isInteger(){
		return this.den === 1n || this.simple().den === 1n;
	}
	
	isZero(){
		return this.nom === 0n;
	}
	
	isOne(){
		return this.nom !== 0n && this.nom === this.den;
	}
	
	valueOf(){
		let {nom, den} = this.simple();
		let lg = Math.max(bigint.ilog2(nom), bigint.ilog2(den));
		if(lg > 52n){
			let offset = lg - 52n;
			nom = nom >> offset;
			den = den >> offset;
		}
		return Number(nom)/Number(den);
	}
	
	toNumber(){
		return this.valueOf();
	}
	
	floorBy(m){
		const Ctor = this.constructor;
		if(m == null){
			m = new Ctor(1n, 1n);
		}
		else if(!m instanceof this.constructor){
			m = new Ctor(m, 1n);
		}
		
		let den = this.den * m.den;
		
		let nom = mfloor(this.nom*m.den, m.nom*this.den);
		
		return new Ctor(nom, den);
	}	
	
	ceilBy(m){
		const Ctor = this.constructor;
		if(m == null){
			m = new Ctor(1n, 1n);
		}
		else if(!m instanceof this.constructor){
			m = new Ctor(m, 1n);
		}
		
		let den = this.den * m.den;
		
		let nom = mceil(this.nom*m.den, m.nom*this.den);
		
		return new Ctor(nom, den);
	}
	toNearest(m, rounding){
		if(rounding === 3){
			//ROUND_FLOOR
			return this.floorBy(m);
		}
		else if(rounding === 2){
			//ROUND_CEIL
			return this.ceilBy(m);
		}
		else{
			throw new Error(`Rounding ${rounding} is not support`);
		}
	}
	
	floor(){
		let f = this.floorBy().simple();
		if(f.isInteger()){
			return f.nom;
		}
		else{
			throw new Error('Сломался floor');
		}
	}
	
	ceil(){
		let f = this.ceilBy().simple();
		if(f.isInteger()){
			return f.nom;
		}
		else{
			throw new Error('Сломался ceil');
		}
	}
}

const Ctor = RationalNumber;

/**
 * Добавляет бинарную операцию над RationalNumber,
 * RationalNumber и BigInt
 * RationalNumber и Number
 */
function defWithConvert(oper, fun){
	const OPER = oper.valueOf();
	oper.def(Ctor, Ctor, fun);
	oper.def(Ctor, BigInt, (a, b)=>(a[OPER](new Ctor(b))));
	oper.def(Ctor, Number, (a, b)=>(a[OPER](new Ctor(b))));
	oper.def(BigInt, Ctor, (a, b)=>((new Ctor(a))[OPER](b)));
	oper.def(Number, Ctor, (a, b)=>((new Ctor(a))[OPER](b)));
}

defWithConvert(add, (a, b)=>{
	let den = a.den * b.den;
	let nom = a.nom * b.den + b.nom * a.den;
	return new Ctor(nom, den);
});
add.useName(Ctor);

defWithConvert(sub, (a, b)=>{
	let den = a.den * b.den;
	let nom = a.nom * b.den - b.nom * a.den;
	return new Ctor(nom, den);
});
sub.useName(Ctor);

neg.def(Ctor, (a)=>(new Ctor(-a.nom, a.den)));
neg.useName(Ctor);

defWithConvert(mul, (a, b)=>(new Ctor(a.nom*b.nom, a.den*b.den)));

defWithConvert(div, (a, b)=>(new Ctor(a.nom*b.den, a.den*b.nom)));

mul.useName(Ctor);
div.useName(Ctor);

defWithConvert(eq, (a, b)=>{
	return a.nom * b.den === b.nom * a.den;
});
eq.useName(Ctor);

defWithConvert(lt, (a, b)=>{
	return a.nom * b.den < b.nom * a.den;
});
lt.useName(Ctor);

defWithConvert(gt, (a, b)=>{
	return a.nom * b.den > b.nom * a.den;
});
gt.useName(Ctor);

pow.def(Ctor, BigInt, (a, p)=>{
	return new Ctor(a.nom**p, a.den**p);
});

pow.def(Ctor, Number, (a, p)=>{
	return a[pow](BigInt(p));
});

pow.useName(Ctor);
module.exports = RationalNumber;
