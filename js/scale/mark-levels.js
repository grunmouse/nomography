const {RationalNumber:Rational, ratlog} = require('../rational-number/index.js');


const {symbols:{DIV}}= require('@grunmouse/multioperator-ariphmetic');

const mod = (a, b)=>(((a % b) + b) % b); //Честный остаток

const LevelsByFunctions = require('./levels.js');

const INDEX = LevelsByFunctions.symIndex;

/**
 * Представляет двоично-пятеричную систему: 1, 2, 5, 10, 20, 50, ...
 */
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
		console.log('Index by log');
		console.log(step);
		//iexp - целая часть десятичного логарифма step
		//step = part * 10**iexp
		let {x: part, y: iexp} = ratlog(step, new Rational(10));
		
		let index = Number(iexp) * 3;
		part = part.valueOf();
		
		let offset = [1,2,5].indexOf(part);
		if(offset == -1){
			throw new Error('Error in algorithm of calculating index');
		}
		index += offset;
		
		step[INDEX] = index;
		
		return index;
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
	LevelsByFunctions,
	rational25Levels
};