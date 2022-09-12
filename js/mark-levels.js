const Decimal = require('decimal.js');
const Rational = require('./rational-number.js');

const {symbols:{DIV}}= require('@grunmouse/multioperator-ariphmetic');

const mod = (a, b)=>(((a % b) + b) % b); //Честный остаток

const LevelsByFunctions = require('./levels.js');

function toLevels(obj){
	if(Array.isArray(obj)){
		return new LevelsByArray(obj);
	}
	return obj;
}

const decimalLevels = new LevelsByFunctions({
	getStep(index){
		if(index === 0){
			return new Decimal(1);
		}
		let hemi = mod(index, 2);
		let exp = Math.floor(index/2);
		
		let value = Decimal.pow(10, exp);
		if(hemi === 1){
			value = value.times(5);
		}
		return value;
	},
	getIndex(step){
		if(new Decimal(step).eq(1)){
			return 0;
		}
		let exp = Decimal.log10(step);
		let iexp = Decimal.floor(exp);
		let fexp = exp.minus(iexp);
		let index = iexp.valueOf()*2;
		if(!fexp.isZero()){
			index+=1;
		}
		return index;
	},

	hasDiv(a, b){
		return new Decimal(b).div(a).isInteger();
	},	
	
	isUniversal(step){
		return true;
	}
});

const INDEX = LevelsByFunctions.symIndex;

const decimal25Levels =  new LevelsByFunctions({
	getStep(index){
		if(index === 0){
			return new Decimal(1);
		}
		let part = mod(index, 3);
		let exp = Math.floor(index/3);
		
		let value = Decimal.pow(10, exp);
		
		if(part > 0){
			value = value.times([1,2,5][part]);
		}
		value[INDEX] = index;
		return value;
	},
	getIndex(step){
		if(INDEX in step){
			return step[INDEX];
		}
		if(new Decimal(step).eq(1)){
			return 0;
		}
		console.log('Index by log');
		console.log(step);
		let exp = Decimal.log10(step);
		let iexp = Decimal.floor(exp);
		let istep = Decimal.pow(10, iexp);
		let part = +step.div(istep);
		let fexp = exp.minus(iexp);
		let index = iexp.valueOf()*3;
		if(!fexp.isZero()){
			index += [2,5].indexOf(part)+1;
		}
		return index;
	},
	hasDiv(a, b){
		return new Decimal(b).div(a).isInteger();
	},	
	isUniversal(step){
		let exp = Decimal.log10(step);
		let iexp = Decimal.floor(exp);
		let fexp = exp.minus(iexp);
		return fexp.isZero();
	}
});
const rational25Levels =  new LevelsByFunctions({
	getStep(index){
		if(index === 0){
			return new Rational(1);
		}
		let part = mod(index, 3);
		let exp = Math.floor(index/3);
		
		let nom = 1n, den = 1n;
		if(exp>0){
			nom = 10n**BigInt(exp);
		}
		else{
			den = 10n**BigInt(-exp);
		}
		
		
		if(part > 0){
			nom = nom*([1n,2n,5n][part]);
		}
		let value = new Rational(nom, den);
		value[INDEX] = index;
		return value;
	},
	getIndex(step){
		if(INDEX in step){
			return step[INDEX];
		}
		if(step == 1 || step.eq(1)){
			return 0;
		}
		throw new Error('Empty algorithm of calculate index');
	},
	hasDiv(a, b){
		return b[DIV](a).isInteger();
	},	
	isUniversal(step){
		let index = this.getIndex(step);
		let part = mod(index, 3);
		return part === 0;
	}
});

module.exports = {
	toLevels,
	LevelsByFunctions,
	decimalLevels,
	decimal25Levels,
	rational25Levels
};