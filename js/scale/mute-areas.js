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

const { gapArea, getIntersection, getSpacing, commonTicks, joinArea, uniqueAreas, getNestedAreas } = require('./interval-utils.js');

const {metricArea} = require('./penalty.js');

/**
 * Находит минимальный шаг для начала шкалы, основываясь на расстояниях и mutedist.
 * @param {Function} distance - Функция расстояния.
 * @param {Array[2]} D - [start, end] параметра.
 * @param {*} levels - Объект уровней шкалы.
 * @param {Object} mutedist - {min, max}.
 * @returns {*} minStep - Минимальный подходящий шаг.
 */
function getMinStepStart(distance, D, levels, mutedist) {
	const oneStepLength = (start, step) => (distance(start, start[ADD](step)));

	// Длина (геометрическая) куска шкалы, который остаётся непокрытым при выборе цены деления index (для начала)
	const cutStartDistance = (index) => (distance(levels.getLimits(D, levels.getStep(index)).min, D[0]));

	const isMinorCutStart = (index) => (cutStartDistance(index) < mutedist.min);

	const minorCutStep = (isMinor) => {
		let index = levels.findPair(isMinor).inner;
		let step = levels.getStep(index);
		if (!levels.isUniversal(step)) {
			step = levels.getLessUniversalStep(step);
		}
		return step;
	};
	
	//console.log(D);
	let topStep = levels.findTop(D)
	//console.log(D[0]);
	let topStepIndex = levels.getIndex(topStep.step);
	let strongStep = levels.findLevel(D[0]);
	let preMinStep = levels.findPair((index)=>(index<=topStepIndex && oneStepLength(D[0], levels.getStep(index))<mutedist.min));
	
	if(strongStep[LT](levels.getStep(preMinStep.over))){
		let stepStart = minorCutStep(isMinorCutStart);

		let lim = levels.getLimits(D, stepStart);
		while (oneStepLength(lim.min, stepStart) > mutedist.min) {
			stepStart = levels.getStep(levels.getIndex(stepStart) - 1);
		}
		
		return stepStart;
	}
	else{
		return levels.getStep(preMinStep.inner);
	}

}

/**
 * Находит минимальный шаг для конца шкалы, основываясь на расстояниях и mutedist.
 * @param {Function} distance - Функция расстояния.
 * @param {Array[2]} D - [start, end] параметра.
 * @param {*} levels - Объект уровней шкалы.
 * @param {Object} mutedist - {min, max}.
 * @returns {*} minStep - Минимальный подходящий шаг.
 */
function getMinStepEnd(distance, D, levels, mutedist) {
	const oneStepLength = (start, step) => (distance(start, start[SUB](step)));

	// Длина (геометрическая) куска шкалы, который остаётся непокрытым при выборе цены деления index (для конца)
	const cutEndDistance = (index) => (distance(levels.getLimits(D, levels.getStep(index)).max, D[1]));

	const isMinorCutEnd = (index) => (cutEndDistance(index) < mutedist.min);

	const minorCutStep = (isMinor) => {
		let index = levels.findPair(isMinor).inner;
		let step = levels.getStep(index);
		if (!levels.isUniversal(step)) {
			step = levels.getLessUniversalStep(step);
		}
		return step;
	};

	let stepEnd = minorCutStep(isMinorCutEnd);

	let lim = levels.getLimits(D, stepEnd);
	while (oneStepLength(lim.max, stepEnd) > mutedist.min) {
		stepEnd = levels.getStep(levels.getIndex(stepEnd) - 1);
	}

	return stepEnd;
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
 * Собирает список областей с хорошими шагами для mute штрихов.
 * @param {Array[2]} D - [start, end].
 * @param {*} firstStep - Начальный шаг.
 * @param {Function} distance - Расстояние.
 * @param {*} levels - Уровни.
 * @param {Object} mutedist - Диапазон.
 * @param {boolean} rev - Если true, обход от конца к началу (D[1] к D[0]).
 * @returns {Array} Список областей: [{start, end, step, inc, OPER}].
 */
function collectAreas(D, firstStep, distance, levels, mutedist, rev = false){
	// Определяем направление обхода
	const [startPoint, endPoint] = rev ? [D[1], D[0]] : [D[0], D[1]];
	const OPER_DEFAULT = rev ? SUB : ADD;

	function condByOper(OPER, eq){
		switch(OPER){
			case ADD: return eq ? GE : GT;
			case SUB: return eq ? LE : LT;
			default: throw new Error('Unsupported operation ' + OPER);
		}
	}
	
	function operByLimits(start, end){
		if(start[LT](end)){
			return ADD;
		}
		else if(start[GT](end)){
			return SUB;
		}
		else{
			throw new Error(`Incorrect start: ${start}; end: ${end}.`);
		}
	}
	
	/**
	 * Трассирует шаги начиная со start до limit c шагом step, в направлении OPER, с разрешением пропустить в начале шаги определённого инкремента (step)
	 * @param start : RationalNumber
	 * @param limit : RationalNumber
	 * @param step : RationalNumber
	 * @param skip = -1|0|+1 - разрешает пропускать деления в начале (начиная со start) если они -1 - слишком маленькие, +1 - слишком большие, 0 - запрещает пропускать
	 */
	function traceSteps(start, limit, step, skip){
		if(start[EQ](limit)){
			return {start, end:limit, step, inc:0, overlimit:true};
		}
		let OPER = operByLimits(start, limit);
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

	// Определяем операцию для поиска общей отметки в зависимости от направления
	const COMMON_MARK_OPER = rev ? ADD : SUB;
	
	let start = startPoint;
	let step = firstStep;
	let result = [];
	let area = traceSteps(start, endPoint, step, false);
	result.push(area);
	while(true){
		let stepIndex = levels.getIndex(area.step) + area.inc;
		step = levels.getStep(stepIndex);
		start = findCommonMark(area.end, area.step, step, COMMON_MARK_OPER); // Идём назад по area и ищем точку общую для area.step и step
		area = traceSteps(start, endPoint, step, -area.inc);
		
		// Проверяем нельзя ли расширить новую область в сторону начала (с учётом направления)
		let prevArea = traceSteps(area.start, startPoint, step, false);
		area = joinArea(prevArea, area, {inc:area.inc, overlimit: area.overlimit}); // Если можно, расширяем (закомментировано как в оригинале)
		
		if(area.start[EQ](area.end) && !area.overlimit){
			//console.log(area);
			debugger;
		}
		else{
			result.push(area);
		}
		
		// Условие завершения с учётом направления
		const completionCondition = area.end[GE](endPoint);
		if(completionCondition || area.overlimit){
			break;
		}
	}
	return result;
}



/**
 * Функция для заданной шкалы находит отрезки с хорошим шагом немых штрихов
 *
 * @param distance : Function(a, b)=>Number - функция расстояния между точками шкалы в принятой метрике
 * @param D : Array[2]<Number> - отрезок значений параметра, отображаемый на шкалу
 * @param levels : Levels - хорошие кратности параметра для штрихов.
 * @param mutedist : Object
 * @property mutedist.min : Number - наименьшее разрешённое расстояние между немыми штрихами
 * @property mutedist.max : Number - наибольшее допустимое расстояние между немыми штрихами
 *
 */
function muteArea(distance, D, levels, mutedist){
	let maxStepLimits = levels.findTop(D); //Наибольшее значение шага, отмечаемое на данном интервале хотя бы одним штрихом.
	
	let minStep = getMinStepStart(distance, D, levels, mutedist);
	//console.log(minStep);

	const startSteps = startingSteps(minStep, distance, D, levels, mutedist);
	
	//console.log(minStep);
	//console.log(startSteps);
	//console.log(startSteps);
	let limits = startSteps[0];
	//console.log(limits);
	/*
		Правила сортировки: первым идёт тот, который начинается раньше. Из двух с общим началом первым идёт более длинный
	*/
	const sortArea = (a,b)=>(a.start[SUB](b.start).valueOf() || b.end[SUB](a.end).valueOf() );
	
	let areas = collectAreas([limits.min, limits.max], limits.step, distance, levels, mutedist);
	
	areas = uniqueAreas(areas);
	
	return areas;
}

/**
 * Разрешает пару вложенных отрезков
 */
function resolveNested(link, distance, levels, mutedist, labeldist){
	let {inner, outer} = link;
	if(inner.step[GE](outer.step)){
		return {action:"remove inner", removed:inner};
	}
	else if(distance(inner.start, inner.end)<labeldist.min){
		return {action:"remove inner", removed:inner};
	}
	else{
		let {ticks, lcmStep} = commonTicks(getIntersection(inner, outer), levels);
		let last = ticks.length-1;
		if(ticks.length<2 || distance(ticks[0], ticks[last])<labeldist.min){
			return {action:"remove inner", removed:inner};
		}
		else{
			let starts = ticks.filter((a)=>(distance(a, ticks[last])>=labeldist.min));
			let pairs = starts.map((start)=>([start, ticks.find((a)=>(distance(start,a)>=labeldist.min))]));
			
			//Приемлемые точки для концов отрезка B1 и B2, так, чтобы на пересечениях с отрезком A были хорошие точки
			let lastStart = pairs[pairs.length-1][0], firstEnd = pairs[0][1]; 
			
			if(lastStart[GT](firstEnd)){
				//Отрезок A настолько длинный, что не создаёт проблем при выборе границ
				[lastStart, firstEnd] = [firstEnd, lastStart]; //Пусть пока так. Хотя было бы неплохо выбрать наилучший участок отрезка A
			}
			
			let B1, B2, created = [];
			
			if(outer.start[EQ](inner.start)){
				//Не создаём B1
			}
			else{
				//Надо ещё проверить, остаются ли от B достаточно длинные куски
				if(distance(outer.start, lastStart)<labeldist.min){
					//Невозможно создать B1
					//Проверить возможность не создавать B1
					return {action:"remove inner", removed:inner};
				}
				else{
					B1 = {...outer, end:lastStart};
					created.push(B1);
				}
			}
			
			if(outer.end[EQ](inner.end)){
				//Не создаём B2
			}
			else{
				if(distance(outer.end, firstEnd)<labeldist.min){
					//Невозможно создать B2
					//Проверить возможность не создавать B2
					return {action:"remove inner", removed:inner};
				}
				else{
					B2 = {...outer, start:firstEnd};
					created.push(B2);
				}
			}
			
			
			return {
				action:"split outer", 
				removed:outer, 
				created: created
			};
		}
	}
	
}

function resolveManyNested(links, distance, levels, mutedist, labeldist){
	
}

module.exports = {muteArea, collectAreas, startingSteps, resolveNested};