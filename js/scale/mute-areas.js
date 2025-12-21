const inspect = Symbol.for('nodejs.util.inspect.custom');

const {
	symbols:{
		ADD,
		SUB,
		NEG,
		DIV,
		MUL,
		MOD,
		EQ,
		LT,
		GT,
		LE,
		GE
	}
} = require('@grunmouse/multioperator-ariphmetic');

const { gapArea, getIntersection, getSpacing, joinArea } = require('./interval-utils.js');

const {metricArea} = require('./penalty.js');

/**
 * Находит минимальный шаг для шкалы, основываясь на расстояниях и mutedist.
 * @param {Function} distance - Функция расстояния.
 * @param {Array[2]} D - [start, end] параметра.
 * @param {*} levels - Объект уровней шкалы.
 * @param {Object} mutedist - {min, max}.
 * @returns {*} minStep - Минимальный подходящий шаг.
 */
function getMinStep(distance, D, levels, mutedist){
	const stepLengthInc = (start, step)=>(distance(start, start[ADD](step)));

	const isMinorDistance = (a, b)=>(distance(a,b)<mutedist.min);
	
	const isMinorCutStart = (index)=>(isMinorDistance(levels.getLimits(D, levels.getStep(index)).min, D[0]));
	const isMinorCutEnd = (index)=>(isMinorDistance(levels.getLimits(D, levels.getStep(index)).max, D[1]));


	/*
		функции isMinor скорее всего ложны при больших шагах и, скорее всего верны - при малых.
		т.е. 
		isMinor(major) = false
		isMinor(minor) = true
		полагая, что true>false
		isMinor(major) < isMinor(minor)
		Значит функция полумонотонно убывает
	*/
	
	const minorCutStep = (isMinor)=>{
		let index = levels.findPair(isMinor).inner;
		let step = levels.getStep(index);
		if(!levels.isUniversal(step)){
			step = levels.getLessUniversalStep(step);
		}
		return step;
	}

	let stepStart = minorCutStep(isMinorCutStart);
	let stepEnd = minorCutStep(isMinorCutEnd);
	
	let minStep = stepStart[LT](stepEnd) ? stepStart : stepEnd;

	let lim = levels.getLimits(D, minStep);
	while(stepLengthInc(lim.min, minStep)>mutedist.min){
		minStep = levels.getStep(levels.getIndex(minStep)-1);
	}
	
	return minStep;
}

/**
 * Собирает список областей с хорошими шагами для mute штрихов.
 * @param {Array[2]} D - [start, end].
 * @param {*} firstStep - Начальный шаг.
 * @param {Function} distance - Расстояние.
 * @param {*} levels - Уровни.
 * @param {Object} mutedist - Диапазон.
 * @returns {Array} Список областей: [{start, end, step, inc, OPER}].
 */
function collectAreas(D, firstStep, distance, levels, mutedist){
	
	function condByOper(OPER, eq){
		switch(OPER){
			case ADD: return eq ? GE : GT;
			case SUB: return eq ? LE : LT;
			default: throw new Error('Unsupported operation ' + OPER);
		}
	}
	
	function traceSteps(start, limit, step, OPER, skip){
		let end = start, prev = start, inc = 0, overlimit;
		let COND = condByOper(OPER);
		while(true){
			let next = prev[OPER](step);
			if(next[COND](limit)){
				overlimit = true;
				break;
			}
			let dist = distance(prev, next);
			if(dist>mutedist.max){
				inc = -1; //Если длина слишком большая, шаг надо уменьшить
			}
			else if(dist<mutedist.min){
				inc = 1; //Если длина слишком маленькая, шаг надо увеличить
			}
			else{
				inc = 0; //Если длина в пределах, то надо сбросить inc
			}
			if(inc){
				if(skip == inc){ //Предполагается, что skip противоположен ожидаемому inc
					//Если 
					prev = start = next;
					continue;
				}
				else{
					break;
				}
			}
			end = prev = next;
			skip = false
		}
		if(end[LT](start)){
			return {start:end, end:start, step, inc, OPER, overlimit}
		}
		else{
			return {start, end, step, inc, OPER, overlimit}
		}
	}
	
	function findCommonMark(start, step, step1, OPER){
		let current = start;
		while(true){
			if(levels.hasDiv(step1, current)){
				return current;
			}
			current = current[OPER](step);
		}
	}
	
	let start = D[0];
	let step = firstStep;
	let result = [];
	let area = traceSteps(start, D[1], step, ADD, false);
	result.push(area);
	while(true){
		let stepIndex = levels.getIndex(area.step) + area.inc;
		step = levels.getStep(stepIndex);
		start = findCommonMark(area.end, area.step, step, SUB);	//идём по area назад и ищем точку общую для area.step и step
		area = traceSteps(start, D[1], step, ADD, -area.inc);
		let prevArea = traceSteps(area.start, D[0], step, SUB, false); //Проверяем нельзя ли расширить новую область в сторону начала
		//area = joinArea(prevArea, area, {inc:area.inc, overlimit: area.overlimit}); //Если можно, расширяем
		
		if(area.start[EQ](area.end) && !area.overlimit){
			//console.log(area);
			debugger;
		}
		else{
			result.push(area);
		}
		if(area.end[GE](D[1]) ||  area.overlimit){
			break;
		}
	}
	return result;
}

/**
 * Найти начальные позиции и шаги для шкалы, начиная с minStep.
 * @param {*} minStep - Минимальный шаг.
 * @param {Function} distance - Расстояние.
 * @param {Array[2]} D - Диапазон.
 * @param {*} levels - Уровни.
 * @param {Object} mutedist - Диапазон.
 * @returns {Array} Список начальных лимитов: [{min, max, step}].
 */
function startingSteps(minStep, distance, D, levels, mutedist){

	const minIndex = levels.getIndex(minStep);
	const range = D[1][SUB](D[0]);
	let index = levels.getIndex(minStep);
	let steps = [], pos = D[0];
	//
	for(;steps.length === 0 && pos[LE](D[1]); pos=pos[ADD](minStep)){
		let index = minIndex;
		for(; true; ++index){
			let step = levels.getStep(index);
			if(step[GT](range)){
				break;
			}
			if(levels.hasDiv(step, pos)){
				let dist = distance(pos, pos[ADD](step));
				//console.log(pos,step, dist);
				if(dist>mutedist.max){
					break;
				}
				if(dist<mutedist.min){
					continue;
				}
				let limits = {min:pos, max:D[1], step};
				steps.push(limits);
			}
		}
	}
	return steps;
}

/**
 * Функция для заданной шкалы находит отрезки с хорошим шагом немых штрихов
 *
 * @param fun : Function - уравнение шкалы, отображает параметр на координату
 * @param metric : Function({x,y}, {x,y})=>Number - функция расстояния между точками в принятой метрике
 * @param D : Array[2]<Number> - отрезок значений параметра, отображаемый на шкалу
 * @param levels : Levels - хорошие кратности параметра для штрихов.
 * @param mutedist : Object
 * @property mutedist.min : Number - наименьшее разрешённое расстояние между немыми штрихами
 * @property mutedist.max : Number - наибольшее допустимое расстояние между немыми штрихами
 *
 */
function muteArea(distance, D, levels, mutedist){
	let maxStepLimits = levels.findTop(D); //Наибольшее значение шага, отмечаемое на данном интервале хотя бы одним штрихом.
	
	let minStep = getMinStep(distance, D, levels, mutedist);
	

	const startSteps = startingSteps(minStep, distance, D, levels, mutedist);
	//console.log(startSteps);
	let limits = startSteps[0];
	
	return collectAreas([limits.min, limits.max], limits.step, distance, levels, mutedist);
}

module.exports = {muteArea, collectAreas, startingSteps};