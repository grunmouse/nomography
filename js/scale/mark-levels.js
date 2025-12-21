const {RationalNumber:Rational, ratlog} = require('../rational-number/index.js');


const {symbols:{DIV, EQ}}= require('@grunmouse/multioperator-ariphmetic');

const mod = (a, b)=>(((a % b) + b) % b); //Честный остаток

const div = (a, b)=>(Math.floor(a/b));

const Levels = require('./levels.js');

const INDEX = Levels.symIndex;

/**
 * Представляет двоично-пятеричную систему: 1, 2, 5, 10, 20, 50, ...
 */
const rational25Levels =  new Levels({
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
		if(step === 0){
			throw new Error('Incorrect step === 0');
		}
		if(INDEX in step){
			return step[INDEX];
		}
		if(step == 1 || step[EQ](1)){
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
		if(b[EQ](0)) return true;
		return b[DIV](a).isInteger();
	},	
	isUniversal(step){
		let index = this.getIndex(step);
		let part = mod(index, 3);
		return part === 0;
	}
});

const rationalHHMMSSLevels = new Levels({
	getStep(index){
		//1, 60 3600
		//5, 10, 15, 20, 30
		const toplevel = 3600;
		const levels = [1, 60];
		const sublevels = [1, 2, 5, 10, 15, 20, 30];
		
		const count = levels.length*sublevels.length;
		
		let value;
		
		if(index<0){
			value = rational25Levels.getStep(index);
		}
		else if(index>=count){
			let hindex = index - count;
			let step = rational25Levels.getStep(hindex)[MUL](toplevel);
			value = step;
			
		}
		else{
			let rank =  div(index, sublevels.length);
			let part = mod(index, sublevels.length);
			
			let step = levels[rank]*sublevels[part];
			
			value = new Rational(step);
		}
		value[INDEX] = index;
		return value;
	},
	
	getIndex(step){
		if(step === 0){
			throw new Error('Incorrect step === 0');
		}
		if(INDEX in step){
			return step[INDEX];
		}

		const toplevel = 3600;
		const levels = [1, 60];
		const sublevels = [1, 2, 5, 10, 15, 20, 30];
		
		const count = levels.length*sublevels.length;
		
		let index;
		
		if(step[LT](1)){
			index = rational25Levels.getIndex(step);
		}
		else if(step[GE](toplevel)){
			let hstep = step[DIV](toplevel);
			
			index = rational25Levels.getIndex(hstep) + count;
		}
		else{
			index = step[GE](60) ?  1: 0;
			let part = (index ? step[DIV](60) : step).valueOf();
				
			let offset = sublevels.indexOf(part);

			if(offset == -1){
				throw new Error('Error in algorithm of calculating index');
			}
			index += offset;
			
		}
		
		step[INDEX] = index;
		
		return index;
	},
	
	isUniversal(step){
		const toplevel = 3600;
		
		if(step[LT](1)){
			return rational25Levels.isUniversal(step);
		}
		else if(step[GE](toplevel)){
			let hstep = step[DIV](toplevel);
			
			return rational25Levels.isUniversal(hstep);
		}
		else{
			let index = this.getIndex(step);
			//const sublevels = [1, 2, 5, 10, 15, 20, 30];
			const legend = [true, false, true, false, false, false, true];
			
			index = mod(index(legend.length));
			
			return legend[index];
			
		}
	}
});

module.exports = {
	Levels,
	rational25Levels,
	rationalHHMMSSLevels
};