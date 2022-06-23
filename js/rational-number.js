
const {
	operators:{
		add,
		sub,
		neg,
		div,
		mul,
		eq
	}
} = require('@grunmouse/multioperator-ariphmetic');


function NOD(a, b){
	while(a != b){
		if(a<b){
			a = a % b;
		}
		else{
			b = b % a;
		}
	}
	return a;
}

class RationalNumber {
	constructor(nom, den){
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
		return this.nom < 0n ? -1 : this.nom > 0n ? : 1 : this.nom;
	}
	
	simple(){
		let nod = NOD(this.nom < 0n ? -this.nom : this.nom, this.den);
		
		return nod > 1n ? new this.constructor(this.nom/nod, this.den/nod) : this;
	}
	
	isInteger(){
		return this.den === 1n || this.simple().den === 1n;
	}
	
	valueOf(){
		let {nom, den} = this.simple();
		return Number(nom)/Number(den);
	}
}

const Ctor = RationalNumber;

add.def(Ctor, (a, b)=>{
	let den = a.den * b.den;
	let nom = a.nom * b.den + b.nom * a.den;
	return new Ctor(nom, den);
});
add.useName(Ctor);

sub.def(Ctor, (a, b)=>{
	let den = a.den * b.den;
	let nom = a.nom * b.den - b.nom * a.den;
	return new Ctor(nom, den);
});
sub.useName(Ctor);

neg.def(Ctor, (a)=>(new Ctor(-a.nom, a.den)));
neg.useName(Ctor);

mul.def(Ctor, (a, b)=>(new Ctor(a.nom*b.nom, a.den*b.den)));
div.def(Ctor, (a, b)=>(new Ctor(a.nom*b.den, a.den*b.nom)));
mul.useName(Ctor);
div.useName(Ctor);

eq.def(Ctor, (a, b)=>{
	return a.nom * b.den === b.nom * a.den;
});
eq.useName(Ctor);


module.exports = RationalNumber;
