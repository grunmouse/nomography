const Decimal = require('decimal.js');

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
		return value;
	},
	getIndex(step){
		if(new Decimal(step).eq(1)){
			return 0;
		}
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

module.exports = {
	toLevels,
	LevelsByFunctions,
	decimalLevels,
	decimal25Levels
};