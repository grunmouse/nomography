const inspect = Symbol.for('nodejs.util.inspect.custom');

const {
	operators:{
		add,
		sub,
		neg,
		div,
		mod,
		mul,
		pow,
		eq,
		lt,
		gt,
		le,
		ge
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
			a = a % b;
			if(a === 0n) a = b;
		}
		else{
			b = b % a;
			if(b === 0n) b = a;
		}
	}
	return a;
}

BigInt.max = (...arr)=>arr.reduce((akk, a)=>(a > akk ? a : akk));
BigInt.min = (...arr)=>arr.reduce((akk, a)=>(a < akk ? a : akk));

class RationalNumber {
	/**
	 * Парсит десятичную дробь
	 */
	static parseDecimal(str){
		let [m,e] = str.split(/e/i);
		let [a,b] = m.split('.');
		e = e==null ? 0 : -parseInt(e);
		if(b==null){
			b = "";
		}
		else{
			e+=b.length;
		}
		m = a+b;
		let den = b ? new RationalNumber(10).pow(e) : 1;
		let nom = new RationalNumber(BigInt(m));
		return nom.div(den);
	}
	
	static LCM(ab, cd){
		// LCM(a/b, c/d) = (a*c) / GCD(a*c, b*d) 
		let a = ab.nom, b = ab.den;
		let c = cd.nom, d = cd.den;
		
		let result = new RationalNumber(a*c, NOD(a*d, b*c));
		
		return result.simple();
	}
	
	constructor(nom, den){
		if(nom instanceof RationalNumber){
			return nom;
		}
		if(den == null){
			if(typeof nom === 'number' || nom instanceof Number){
				if(Number.isInteger(nom)){
					nom = BigInt(nom);
					den = 1n;
				}
				else{
					let {sign, sizedMant, sizedExp} = float64.decomp(nom);
					//abs(V) = sizedMant * 2**sizedExp = sizedMant / (2**(-sizedExp))
					nom = sizedMant;
					if(sign){
						nom = -nom;
					}
					den = 1n<<(-sizedExp);
				}
			}
			else if(typeof nom === 'bigint' || nom instanceof BigInt){
				den = 1n;
			}
			else if(typeof nom === 'object' && nom.nom != null){
				return new RationalNumber(nom.nom, nom.den);
			}
			else{
				throw new TypeError('Incorrect value for convert to RationalNumber');
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
		if(nom == 0n){
			den = 1n;
		}

		this.nom = nom;
		this.den = den;
	}
	
	serialize(){
		let {nom, den} = this;
		let code = `{nom:${nom.toString()}n, den:${den.toString()}n, valueOf:function(){return ${this.valueOf()};}}`;
		return code;
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
		return this.nom===0n || this.den === 1n || this.simple().den === 1n;
	}
	
	isFinite(){
		return this.den !== 0n;
	}
	
	isNaN(){
		return this.den === 0n && this.nom === 0n;
	}
	
	isZero(){
		return this.nom === 0n;
	}
	
	isOne(){
		return this.nom !== 0n && this.nom === this.den;
	}
	
	valueOf(){
		if(this.isNaN()){
			return NaN;
		}
		if(!this.isPositive()){
			return - this.neg().valueOf()
		}
		
		let {nom, den} = this.simple();
		if(nom === 0n){
			return 0;
		}
		if(den === 0n){
			if(nom === 0n){
				return NaN;
			}
			else{
				return Infinity;
			}
		}
		let lg = BigInt.max(bigint.ilog2(nom), bigint.ilog2(den));
		if(lg > 52n){
			let offset = lg - 52n;
			nom = nom >> offset;
			den = den >> offset;
		}
		return Number(nom)/Number(den);
	}
	
	toString(){
		return this.nom.toString()+'/'+this.den.toString();
	}
	
	[inspect](depth, options, inspect){
		let name = this.constructor.name;
		
		return options.stylize('( ', 'special')
			+ inspect(this.nom, options) + '/' + inspect(this.den, options)
			+ ' = ' + inspect(+this, options)
			+ options.stylize(' )', 'special');
	}		
	
	toNumber(){
		return this.valueOf();
	}
	
	join(separator){
		separator = separator || ' ';
		return this.nom + separator + this.den;
	}
	
	floorBy(m){
		if(!this.isPositive()){
			return this.neg().ceilBy(m).neg();
		}

		const Ctor = this.constructor;
		if(m == null){
			m = new Ctor(1n, 1n);
		}
		else if(!(m instanceof Ctor)){
			m = new Ctor(m, 1n);
		}
		
		let den = this.den * m.den;
		
		let nom = mfloor(this.nom*m.den, m.nom*this.den);
		
		return new Ctor(nom, den).simple();
	}	
	
	ceilBy(m){
		if(!this.isPositive()){
			return this.neg().floorBy(m).neg();
		}

		const Ctor = this.constructor;
		if(m == null){
			m = new Ctor(1n, 1n);
		}
		else if(!(m instanceof Ctor)){
			m = new Ctor(m, 1n);
		}
		
		let den = this.den * m.den;
		
		let nom = mceil(this.nom*m.den, m.nom*this.den);

		return new Ctor(nom, den).simple();
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
		let f = this.floorBy();
		if(f.isInteger()){
			return f.nom;
		}
		else{
			throw new Error('Сломался floor');
		}
	}
	
	ceil(){
		let f = this.ceilBy();
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
	return new Ctor(nom, den).simple();
});
add.useName(Ctor);

defWithConvert(sub, (a, b)=>{
	let den = a.den * b.den;
	let nom = a.nom * b.den - b.nom * a.den;
	return new Ctor(nom, den).simple();
});
sub.useName(Ctor);

neg.def(Ctor, (a)=>(new Ctor(-a.nom, a.den)));
neg.useName(Ctor);

defWithConvert(mul, (a, b)=>(new Ctor(a.nom*b.nom, a.den*b.den)));

defWithConvert(div, (a, b)=>(new Ctor(a.nom*b.den, a.den*b.nom)));

defWithConvert(mod, (a, b)=>(a[sub](a.floorBy(b))));

mul.useName(Ctor);
div.useName(Ctor);
mod.useName(Ctor);

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

defWithConvert(le, (a, b)=>{
	return a.nom * b.den <= b.nom * a.den;
});
le.useName(Ctor);

defWithConvert(ge, (a, b)=>{
	return a.nom * b.den >= b.nom * a.den;
});
ge.useName(Ctor);

pow.def(Ctor, BigInt, (a, p)=>{
	if(p<0n){
		return a.inv().pow(-p);
	}
	else{
		return new Ctor(a.nom**p, a.den**p);
	}
});

pow.def(Ctor, Number, (a, p)=>{
	return a[pow](BigInt(p));
});

pow.useName(Ctor);
module.exports = RationalNumber;
