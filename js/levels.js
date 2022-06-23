const Decimal = require('decimal.js');

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
	 * @function isUniversal - проверяет универсальность делителя для всех больших делителей
	 * @param divisor : (Number|Decimal) - проверяемый делитель
	 * @return Boolean
	 */
	 
	/**
	 * @function hasDiv - проверяет вхождение делителя в делимое
	 * @param divisor - проверяемый делитель
	 * @param dividend - проверяемое делимое
	 * @return Boolean
	 */

	constructor(config){
		this.getStep = config.getStep;
		this.getIndex = config.getIndex;
		this.isUniversal = config.isUniversal;
		this.hasDiv = config.hasDiv;
	}

	/**
	 * Находит для разбивки деления ценой max на деления ценой min варианты цены промежуточных делений
	 */
	findSepVars(max, min){
		if(!this.hasDiv(min, max)){
			return [];
		}
		let minIndex = this.getIndex(min), maxIndex = this.getIndex(max);
		if(maxIndex === minIndex){
			return [];
		}
		if(maxIndex - minIndex === 1){
			return [[max, min]];
		}
		let zwischen = [];
		byindex:for(let i = maxIndex-1; i>minIndex; i--){
			let step = this.getStep(i);
			if(this.isUniversal(step)){
				zwischen.push(step);
				break byindex;
			}
			if(this.hasDiv(step, max) && this.hasDiv(min, step)){
				for(let great of zwischen){
					if(this.hasDiv(step, great)){
						continue byindex;
					}
				}
				zwischen.push(step);
			}
		}
		
		if(zwischen.length === 0){
			return [[max, min]];
		}
		
		let result = [];
		for(let step of zwischen){
			let tails = this.findSepVars(step, min);
			for(let tail of tails){
				let res = [max].concat(tail);
				result.push(res);
			}
		}
		
		return result;
	}
	
	getLimits(D, step){
		let max = D[1].toNearest(step, Decimal.ROUND_FLOOR);
		let min = D[0].toNearest(step, Decimal.ROUND_CEIL);
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
	
	/** 
	 * Ищет минимальную вилку, такую, что ctrl(over)=== false && ctrl(inner)===true
	 * @param ctrl : Function<Integer => Boolean> - полумонотонно убывает на целых числах (полагая, что true>false)
	 * @return {inner:Integet, over:integer}
	 */
	findPair(ctrl){
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
			index = Math.floor((over + inner)/2);
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
		let pair = this.findPair((index)=>(this.hasAllowStep(D, this.getStep(index))));
		return this.getLimits(D, this.getStep(pair.inner));
	}
	
	/**
	 * Находит деления, которые являются делителями переданного, но не являются делителями друг друга
	 */
	getLessStepVariants(sourceStep){
		let result = [];
		let index = this.getIndex(sourceStep);
		byindex:while(true){
			--index;
			let step = this.getStep(index);
			if(this.hasDiv(step, sourceStep)){
				if(this.isUniversal(step)){
					if(result.length === 0){
						result.push(step);
					}
					break byindex;
				}
				
				for(let gr of result){
					if(this.hasDiv(step, gr)){
						continue byindex;
					}
				}
				result.push(step);
			}
		}
		
		return result;
	}
	
	getLessNStepVariants(sourceStep, n){
		if(n < 1){
			throw new RangeError('n < 1');
		}
		const map = new Map();
		const getVariants = (step)=>{
			if(map.has(step)){
				return map.get(step);
			}
			else{
				let result = this.getLessStepVariants(step);
				map.set(step, result);
				return result;
			}
		};
		
		let queue = this.getLessStepVariants(sourceStep).map((val)=>([val]));
		
		if(n === 1){
			return queue;
		}
		
		let result = [];
		for(let i = 0; i<queue.length; ++i){
			let item = queue[i];
			let last = item[item.length-1];
			let next = getVariants(last);
			for(let step of next){
				let new_item = item.concat(step);
				if(new_item.length < n){
					queue.push(new_item);
				}
				else{
					result.push(new_item);
				}
			}
		}
		
		return result;
	}
	
	getLessUniversalStep(step){
		let index = this.getIndex(step);
		step = this.getStep(--index);
		while(!this.isUniversal(step)){
			step = this.getStep(--index);
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
		return this.getStep(this.getIndex(step)-1);
	}
	
		
	/**
	 * Ищет наибольший шаг, являющийся делителем
	 */
	findLevel(value){
		let pair = this.findPair((index)=>(this.hasDiv(this.getStep(index), value)));
		
		return this.getStep(pair.inner);
	}
	
	generateArgs(D, step){
		const {min, max}  = this.getLimits(D, step);
		
		let args = [];
		for(let x = min; x.lessThan(max); x = x.plus(step)){
			args.push(x);
		}
		args.push(max);
		if(max.lessThan(D[1])){
			args.push(D[1]);
		}
		if(min.greaterThan(D[0])){
			args.unshift(D[0]);
		}
		return args;		
	}
}

module.exports = LevelsByFunctions;