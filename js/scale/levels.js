const Rational = require('../rational-number/index.js').RationalNumber;

const {
	symbols:{
		ADD,
		SUB,
		NEG,
		DIV,
		MUL,
		EQ,
		LT,
		GT,
		LE,
		GE
	}
} = require('@grunmouse/multioperator-ariphmetic');

/**
 * @class Levels
 * класс, представляющий множество хороших цен делений
 * часть методов передаётся в конструктор для определения в экземпляре
 */

class Levels{
	/**
	 * @function getStep
	 * @param index : Integer - индекс в порядке возрастания шага
	 * @return Rational - значение шага
	 */
	
	/**
	 * @function getIndex
	 * @param step : (Number|Rational) - значение шага
	 * @param Integer - индекс шага
	 */
	
	/**
	 * @function isUniversal - проверяет универсальность делителя для всех больших делителей
	 * @param divisor : (Number|Rational) - проверяемый делитель
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
		
		if(config.getLimits){
			this.getLimits = config.getLimits;
		}
		if(config.generateArgs){
			this.generateArgs = config.generateArgs;
		}
		
	}

	/**
	 * Находит для разбивки деления ценой max на деления ценой min варианты цены промежуточных делений
	 * @return Array<Array<as max>>
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
	
	/**
	 * Отсекает концы диапазона, до значений кратных шагу
	 * @param D : Array(2)<Number|Rational>
	 * @param step : Rational
	 * @return Object
	 * @property max : Rational
	 * @property min : Rational
	 * @property step : Rational === step
	 */
	getLimits(D, step){
		let max = new Rational(D[1]).floorBy(step);
		let min = new Rational(D[0]).ceilBy(step);
		return {max, min, step};
	}
	
	/**
	 * Проверяет, является ли step хорошим шагом для разбиения интервала D
	 * Арифметическая прогрессия 0 + step*i должна включать хотябы две внутренние точки интервала D
	 */
	hasAllowStep(D, step){
		let limits = this.getLimits(D, step);
		return limits.max[GT](limits.min);
	}
	
	/** 
	 * Ищет минимальную вилку, такую, что over>inner && ctrl(over)=== false && ctrl(inner)===true 
	 * @param ctrl : Function<Integer => Boolean> - полумонотонно убывает на целых числах (полагая, что true>false)
	 * @return {inner:Integer, over:integer}
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
	
	/**
	 * Находит для интервала D наибольший хороший шаг
	 * @param D : Array(2)<Number|Rational>
	 * @return Object
	 * @property max : Rational
	 * @property min : Rational
	 * @property step : Rational === step
	 */
	findTop(D){
		let pair = this.findPair((index)=>(this.hasAllowStep(D, this.getStep(index))));
		return this.getLimits(D, this.getStep(pair.inner));
	}
	
	/**
	 * Находит деления, которые являются делителями переданного, но не являются делителями друг друга
	 * @param sourceStep : Rational
	 * @return Array<Rational>
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
	
	getGreatUniversalStep(step){
		let index = this.getIndex(step);
		step = this.getStep(++index);
		while(!this.isUniversal(step)){
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
		return this.getStep(this.getIndex(step)-1);
	}
	
		
	/**
	 * Ищет наибольший шаг, являющийся делителем
	 */
	findLevel(value){
		if(value[EQ](0)){
			return Infinity;
		}
		let pair = this.findPair((index)=>(this.hasDiv(this.getStep(index), value)));
		
		return this.getStep(pair.inner);
	}
	
	/**
	 * Возвращает массив знаний для штрихов шкалы.
	 * @param D - интервал, который нужно разбить
	 * @param step - цена деления
	 */
	generateArgs(D, step){
		const {min, max}  = this.getLimits(D, step);
		
		let args = [];
		for(let x = min; x[LT](max); x = x[ADD](step)){
			args.push(x);
		}
		args.push(max);
		if(max[LT](D[1])){
			args.push(D[1]);
		}
		if(min[GT](D[0])){
			args.unshift(D[0]);
		}
		return args;
	}
}

Levels.symIndex = Symbol();

module.exports = Levels;