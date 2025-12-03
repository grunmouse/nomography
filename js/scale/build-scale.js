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

const {
	RationalNumber
} = require('../rational-number/index.js');

function gapArea(obj1, obj2) {
    const s1 = obj1.start;
    const e1 = obj1.end;
    const s2 = obj2.start;
    const e2 = obj2.end;

    // Определение максимального start и минимального end
    const maxStart = s1[GE](s2) ? s1 : s2;
    const minEnd = e1[LE](e2) ? e1 : e2;

    return {
        start: maxStart,
        end: minEnd,
		steps: [obj1.step, obj2.step]
    };
}

function getIntersection(obj1, obj2) {
	const result = gapArea(obj1, obj2);
	
    // Проверка на пересечение: если maxStart > minEnd, нет пересечения
    if (result.start[GT](result.end)) {
        throw new Error("Intervals do not intersect");
    }

    return result;
}

function getSpacing(obj1, obj2) {
	const result = gapArea(obj1, obj2);
	
    // Проверка на пересечение: если maxStart > minEnd, нет пересечения
    if (result.start[LT](result.end)) {
        throw new Error("Intervals do not intersect");
    }
	

    return {
		start:result.end,
		end:result.start,
		steps:result.steps
	};
}

function greatStepOf(a, b, levels){

}

function joinArea(a, b, ext={}){
	if(a.step[EQ](b.step) && a.start[LE](b.end) && b.start[LE](a.end)){
		return {
			...ext,
			step:a.step,
			start: a.start[LE](b.start) ? a.start : b.start,
			end: a.end[GE](b.end) ? a.end : b.end,
		};
	}
	else{
		throw new Error("Intervals do not intersect");
	}
}

function metricArea(start, end, step, distance, mutedist){
	let prev = start, next = prev[ADD](step);
	let min = Infinity, max = 0;
	for(;next[LE](end);prev = next, next = prev[ADD](step)){
		let d = distance(prev, next);
		if(d<min){
			min = d;
		}
		if(d>max){
			max = d;
		}
	}
	
	let k =0;
	if(max>mutedist.max){
		k += (max-mutedist.max)**2/mutedist.max**2;
	}
	if(min<mutedist.min){
		k += (min-mutedist.min)**2/mutedist.min**2;
	}
	
	return k;
	
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
	
	//const distance = (a, b)=>(metric(fun(a),fun(b)));
	
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
		let index = levels.findPair(isMinorCutStart).inner;
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
	
	function startingSteps(minStep){
		const minIndex = levels.getIndex(minStep);
		const range = D[1][SUB](D[0]);
		let index = levels.getIndex(minStep);
		let steps = [], pos = D[0];
		for(;steps.length === 0 && pos[LE](D[1]); pos=pos[ADD](minStep)){
			let index = minIndex;
			for(; true; ++index){
				let step = levels.getStep(index);
				if(step[GT](range)){
					break;
				}
				if(levels.hasDiv(step, pos)){
					let dist = stepLengthInc(pos, step);
					//console.log(pos,step, dist);
					if(dist>mutedist.max){
						break;
					}
					if(dist<mutedist.min){
						continue;
					}
					let limits = {min:pos, max:new RationalNumber(D[1]).floorBy(step), step};
					steps.push(limits);
				}
			}
		}
		return steps;
	}
	
	function traceSteps(start, limit, step, OPER, skip){
		let end = start, prev = start, inc = 0;
		while(true){
			let next = prev[OPER](step);
			if(next[GT](limit)){
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
			return {start:end, end:start, step, inc, OPER}
		}
		else{
			return {start, end, step, inc, OPER}
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
	
	function collectAreas(D, firstStep){
		let start = D[0];
		let step = firstStep;
		let result = [];
		let area = traceSteps(start, D[1], step, ADD, false);
		result.push(area);
		while(true){
			let stepIndex = levels.getIndex(area.step) + area.inc;
			step = levels.getStep(stepIndex);
			start = findCommonMark(area.end, area.step, step, SUB);
			area = traceSteps(start, D[1], step, ADD, -area.inc);
			let prevArea = traceSteps(area.start, D[0], step, SUB, false);
			area = joinArea(prevArea, area, {inc:area.inc});
			result.push(area);
			if(area.end[GE](D[1])){
				break;
			}
		}
		return result;
	}
	
	const startSteps = startingSteps(minStep);
	//console.log(startSteps);
	let limits = startSteps[0];
	
	return collectAreas([limits.min, limits.max], limits.step);
}

function computeCommonTicks(intersect, levels) {
    const { start, end, steps } = intersect;
    const step1 = steps[0];
    const step2 = steps[1];

    // Проверка на пустой интервал или недействительные шаги
    if (start[GT](end) || !step1 || !step2) return {ticks:[]};

    // Вычисление LCM шагов
    const lcmStep = RationalNumber.LCM(step1, step2);

    // Список общих штрихов
    const commonTicks = [];

    // Находим первый v >= start, который кратен lcmStep
    let current = start;
    
    // Проверяем, делится ли current на lcmStep
    if (!levels.hasDiv(lcmStep, current)) {
        const remainder = current[MOD](lcmStep);  // remainder как RationalNumber
        // Если remainder равно 0 (что выше проверяется), пропускаем
        // Иначе, добавляем разницу до следующего кратного
        const diff = lcmStep[SUB](remainder);
        current = current.add(diff);

        // Если после добавления current > end, нет общих штрихов
        if (current[GT](end)) {
			return {ticks:[], lcmStep};
		}
    }

    // Добавляем текущий, если он в пределах
    if (current[LE](end)) {
        commonTicks.push(current);
    }

    // Теперь добавляем последующие, увеличивая на lcmStep
    current = current.add(lcmStep);

    // Цикл, пока current <= end
    while (current[LE](end)) {
        commonTicks.push(current);
        current = current.add(lcmStep);
    }

    return {ticks:commonTicks, lcmStep};
}

function makePoints(areas, levels){
	/*
	@typedef Point : object
	@property x : Number?
	@property y : Number?
	@property a : RationalNumber
	@property muteGroup : Object?
	@property mutegroup.min : RationalNumber
	@property mutegroup.max : RationalNumber
	@property mutegroup.step : RationalNumber
	@property mutegroup.levels : 1 | 2 
	@property mutegroup.two : Boolean? levels===2
	@property mutegroup.prev : RationalNumber?
	*/
	
	let points = [{a:areas[0].start}].concat(areas.map((area, i)=>{
		let next = areas[i+1];
		let a = area.end;
		let step = area.step;
		let common;
		if(next){
			let intersect = getIntersection(area, next);
			common = computeCommonTicks(intersect, levels);
			a = common.ticks[0];
			if(!a){
				let nextstart = next.start.floorBy(common.lcmStep);
				let areaend = area.end.ceilBy(common.lcmStep);
				common.ticks = [
					nextstart,
					areaend
				];
			}
		}
		return {
			a,
			alt:common,
			step
		}
	}));
	
	return points;
}

function resolveUnknownPoints(points, distance, mutedist){
	for(let i=1; i<points.length-1; ++i){
		if(points[i].a == null){
			let current = points[i], next = points[i+1], prev = points[i-1];
			let {ticks, lcmStep} = current.alt;
			
			let curk = metricArea(prev.a, ticks[1], lcmStep, distance, mutedist);
			let nextk = metricArea(ticks[0], next.a, lcmStep, distance, mutedist);
			
			if(nextk<curk){
				current.a = ticks[0];
			}
			else{
				current.a = ticks[1];
			}
		}
	}
	
	return points;
}

function convertToScaleReport(points, fun,  metric, levels, labeldist){
	/*
	@typedef Point : object
	@property x : Number?
	@property y : Number?
	@property a : RationalNumber
	@property muteGroup : Object?
	@property muteGroup.min : RationalNumber
	@property muteGroup.max : RationalNumber
	@property muteGroup.step : RationalNumber
	@property muteGroup.levels : 1 | 2 
	@property muteGroup.two : Boolean? levels===2
	@property muteGroup.prev : RationalNumber?
	*/
	
	const repPoints = points.map((p, i)=>{
		let point = fun(p.a);
		point.a = p.a;
		if(p.step){
			point.muteGroup = {
				min: points[i-1].a,
				max: a,
				step: p.step,
				levels: 1
			};
		}
	});
	
	let scale = new PointsBase(repPoints,  metric, levels, labeldist);
	
	return scale;
}

function wrapFunction(f){
	let fun;
	if(typeof f == "function"){
		fun = (a)=>{
			let v = f(a);
			if(Array.isArray(v)){
				return {a, x:v[0], y:v[1]};
			}
			else if(!isNaN(v.x*v.y)){
				return {a, x:v.x, y:v.y};
			}
			else{
				throw new Error(`Invalid function return ${v}`);
			}
		};
	}
	else if(typeof f.x == "function" && typeof f.y == "function"){
		fun = (a)=>({a, x:f.x(a), y:f.y(a)});
	}
	else{
		throw new TypeError(`Incorrect argument type f ${typeof f}`);
	}
	return fun;
}

function createScaleReport(f, metric, D, levels, labeldist, mutedist){
	const fun = wrapFunction(f);
	
	let areas = muteArea(distance, D, levels, mutedist);
	let points = makePoints(areas, levels);
	points = resolveUnknownPoints(points, distance, mutedist);
	return convertToScaleReport(points, fun,  metric, levels, labeldist);
}


module.exports = {
	muteArea,
	commonTicks:computeCommonTicks,
	getIntersection,
	makePoints,
	resolveUnknownPoints,
	convertToScaleReport,
	createScaleReport
};