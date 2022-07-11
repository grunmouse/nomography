
const {
	operators:{
		add,
		sub,
		neg,
		div,
		mul,
		eq,
		lt,
		gt
	}
} = require('@grunmouse/multioperator-ariphmetic');

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
		nom = BigInt(nom);
		if(den == null){
			den = 1n;
		}
		den = BigInt(den);
		if(den<0n){
			nom = -nom;
			den = -den;
		}
		this.nom = nom;
		this.den = den;
	}
	
	sign(){
		return this.nom < 0n ? -1 : this.nom > 0n ? 1 : this.nom;
	}
	
	simple(){
		if(this.nom === 0n){
			return this.den === 1n ? this : new this.constructor(0n, 1n);
		}
		let nod = NOD(this.nom < 0n ? -this.nom : this.nom, this.den);
		
		return nod > 1n ? new this.constructor(this.nom/nod, this.den/nod) : this;
	}
	
	isPositive(){
		return this.nom >= 0n;
	}
	
	isInteger(){
		return this.den === 1n || this.simple().den === 1n;
	}
	
	isZero(){
		return this.den === 0n;
	}
	
	valueOf(){
		let {nom, den} = this.simple();
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
}

const Ctor = RationalNumber;

function defWithConvert(oper, fun){
	const OPER = oper.valueOf();
	oper.def(Ctor, Ctor, fun);
	oper.def(Ctor, BigInt, (a, b)=>(a[OPER](new Ctor(b))));
	oper.def(Ctor, Number, (a, b)=>(a[OPER](new Ctor(b))));
	oper.def(BigInt, Ctor, (a, b)=>((new Ctor(a))[OPER](b)));
	oper.def(Number, Ctor, (a, b)=>((new Ctor(b))[OPER](b)));
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


module.exports = RationalNumber;
