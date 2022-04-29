const Decimal = require('decimal.js');

const toDecimal = (a)=>(new Decimal(a));

class LevelsByArray{
	constructor(arr){
		arr = arr.slice(0);
		arr.sort((a,b)=>(a-b));
		arr = arr.map(toDecimal);
		this._levels = arr;
		this._nextMap = new Map(arr.map((val, i, arr)=>([val.toString(), arr[i-1]])));
	}
	
	findTop(D){
		let max, min, step, levels = this._levels;
		for(let i = levels.length; i--;){
			let lev = levels[i];
			max = D[1].toNearest(lev, Decimal.ROUND_FLOOR);
			min = D[0].toNearest(lev, Decimal.ROUND_CEIL);
			let count = max.minus(min).dividedBy(lev);
			if(count.isPositive()){
				count = count.toNumber() + 1 + min.greaterThan(D[0]) + max.lessThan(D[1]);
				if(count >= 3){
					return  {min, max, step:lev};
				}
			}
		}
	}
	
	findLevel(value){
		let levels = this._levels;
		for(let i = levels.length; i--;){
			let lev = levels[i];
			if(Decimal.mod(value, lev).isZero()){
				return lev;
			}
		}
	}
	
	getNext(step){
		if(step.step){
			step = step.step;
		}
		return this._nextMap.get(step.toString());
	}

	getAlter(step){
		if(step.step){
			step = step.step;
		}
		return this._nextMap.get(step.toString());
	}
	
	getLess(step){
		if(step.step){
			step = step.step;
		} 
		return this._nextMap.get(step.toString());
	}
}


class LevelsByFunctions{
	/**
	 * @function getStep
	 * @param index : Integer - индекс в порядке возрастания шага
	 * @return Decimal - значение шага
	 */
	
	/**
	 * @function getIndex
	 * @param step : (Number|Decimal) - значение шага
	 * @param Integer - индекс шага
	 */
	
	/**
	 * @function hasDiv - проверяет вхождение делителя в делимое
	 * @param divisor : (Number|Decimal) - проверяемый делитель
	 * @param dividend? : (Null|Number|Decimal) - делимое, если опущено - проверяется универсальность делителя
	 * @return Boolean
	 */
	
	constructor(config){
		this.getStep = config.getStep;
		this.getIndex = config.getIndex;
		this.hasDiv = config.hasDiv;
	}
	
	getLimits(D, step){
		let max = D[1].toNearest(lev, Decimal.ROUND_FLOOR);
		let min = D[0].toNearest(lev, Decimal.ROUND_CEIL);
		return {max, min, step};
	}
	
	hasAllowStep(D, step){
		let limits = this.getLimits(D, step);
		let count = limits.max.minus(limits.min).dividedBy(step);
		if(count.isPositive()){
			count = count.toNumber() + 1 + limits.min.greaterThan(D[0]) + limits.max.lessThan(D[1]);
			if(count >= 3){
				return  true;
			}
		}
		return false;
	}
	
	_findPair(ctrl){
		let index = 0;
		let over, inner;
		if(ctrl(index)){
			inner = index;
			index+=10;
			while(ctrl(index)){
				inner = index;
				index+=10;
			}
			if(!ctrl(index)){
				over = index;
			}
		}
		else{
			over = index;
			index-=10;
			while(!ctrl(index)){
				over = index;
				index-=10;
			}
			if(ctrl(index)){
				inner = index;
			}
		}
		while(over-inner>1){
			index = (over + inner) >>> 1;
			if(ctrl(index)){
				inner = index;
			}
			else{
				over = index;
			}
		}
		return {inner, over};
	}
	
	findTop(D){
		let pair = this._findPair((index)=>(this.hasAllowStep(D, this.getStep(index))));
		return this.getLimits(D, pair.inner);
	}
	
	getLessUniversalStep(step){
		let index = this.getIndex(step);
		let step = this.getStep(++index);
		while(!this.hasDiv(step)){
			step = this.getStep(++index);
		}
		return step;
	}
	
	getStepsBetween(a, b){
		a = this.getIndex(a);
		b = this.getIndex(b);
		[a, b] = a < b ? [a, b] : [b, a];
		const steps = [];
		for(let i=a+1; i<b; ++i){
			steps.push(this.getStep(i));
		}
		return steps;
	}
	
	getLess(step){
		return this.getStep(this.getIndex(step)+1);
	}
	
		
	/**
	 * Ищет наибольший шаг, являющийся делителем
	 */
	findLevel(value){
		let pair = this._findPair((index)=>(this.hasDiv(this.getStep(index), value)));
		
		return pair.inner;
	}
}

function toLevels(obj){
	if(Array.isArray(obj)){
		return new LevelsByArray(obj);
	}
	return obj;
}

const decimalLevels = new LevelsByFunctions({
	getStep:function(index){
		if(index === 0){
			return new Decimal(1);
		}
		let hemi = index % 2;
		let exp = Math.floor(index/2);
		
		let value = Decimal.pow(10, exp);
		if(hemi === 1){
			value = value.times(5);
		}
		return value;
	},
	getIndex(step){
		if(step.eq(1)){
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
		if(b == null){
			return true;
		}
		return new Decimal(a).lessThan(b);
	}
});

module.exports = {
	toLevels,
	LevelsByFunctions
};