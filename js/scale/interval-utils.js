const inspect = Symbol.for('nodejs.util.inspect.custom');

const {zOrder} = require('@grunmouse/binary');

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

/**
 * Вычисляет область пересечения или зазора между двумя объектами (интервалами) с шагами.
 * @param {Object} obj1 - Первый объект: {start, end, step} (RationalNumber).
 * @param {Object} obj2 - Второй объект: аналогично obj1.
 * @returns {Object} {start: max start, end: min end, steps: [step1, step2]}
 */
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

/**
 * Вычисляет пересечение двух интервалов, выбрасывает ошибку если нет пересечения.
 * @param {Object} obj1 - См. gapArea.
 * @param {Object} obj2 - См. gapArea.
 * @returns {Object} Пересечение: {start, end, steps}
 * @throws {Error} Если интервалы не пересекаются.
 */
function getIntersection(obj1, obj2) {
	const result = gapArea(obj1, obj2);
	
	// Проверка на пересечение: если maxStart > minEnd, нет пересечения
	if (result.start[GT](result.end)) {
		throw new Error("Intervals do not intersect");
	}

	return result;
}

/**
 * Вычисляет зазор между двумя непересекающимися интервалами (start > end после разворота).
 * @param {Object} obj1 - См. gapArea.
 * @param {Object} obj2 - См. gapArea.
 * @returns {Object} Зазор: {start: min end, end: max start, steps}
 * @throws {Error} Если интервалы пересекаются.
 */
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

/**
 * Объединяет два интервала, если они имеют одинаковый шаг и пересекаются.
 * @param {Object} a - {start, end, step}
 * @param {Object} b - Аналогично a.
 * @param {Object} ext - Дополнительные свойства для объединенного объекта.
 * @returns {Object} Объединенный интервал.
 * @throws {Error} Если интервалы не подходят для объединения.
 */
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

/**
 * Вычисляет общие штрихи (ticks) на пересечении двух шагов, используя LCM.
 * @param {Object} intersect - Пересечение: {start, end, steps: [step1, step2]}.
 * @param {*} levels - Уровни (не используется в коде).
 * @returns {Object} {ticks: Array<Rational>, lcmStep: LCM шагов}.
 */
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


function fillArea(area){
	const {start, end, step} = area;
	
	let p = [];
	for(let a = start; a[GE](end); a[ADD](step)){
		p.push({a});
	}
	
	return p;
}

const sortArea =  (a,b)=>(a.start[SUB](b.start).valueOf() || b.end[SUB](a.end).valueOf() );

function uniqueAreas(areas){
	areas = areas.slice(0).sort(sortArea);
	let last = areas[0];
	const result = [last];
	for(let i=1;i<areas.length; ++i){
		let current = areas[i];
		if(current.start[EQ](last.start) && current.end[EQ](last.end)){
			if(current.step[EQ](last.step)){
				//Тождественны
			}
			else{
				//Совпадают интервалы с разным шагом
				//Предпочитаем - с меньшим шагом, но альтернативный шаг запоминаем
				let step = current.step[LT](last.step) ? current.step : last.step;
				let altSteps = last.altSteps || [last.step];
				altSteps.push(current.step);
				last.step = step;
				last.altSteps = altSteps;
			}
		}
		else{
			last = current;
			result.push(current);
		}
	}
	return result;
}

/**
 * Принимает массив уникальных отрезков (равные отрезки обработаны раньше)
 * возвращает массив компонент свзяности графа вхождения отрезков друг в друга
 * @param areas : Array<{start, end, step, ...any}>
 * @return Array<{inner:Area, outer:Area}> - Area - член массива areas
 */
function getNestedAreas(areas){
	const inners = [];
	for(let a of areas){
		for(let b of areas){
			if(a !== b){
				if(a.start[GE](b.start) && a.end[LE](b.end)){
					inners.push({outer:b, inner:a});
				}
			}
		}
	}
	const components = [];
	const comp = new Map();
	for(let link of inners){
		let cmp = comp.get(link.inner) || comp.get(link.outer);
		if(comp.has(link.inner)){
			let cmp = comp.get(link.inner);
			if(comp.has(link.outer)){
				let cmp2 = comp.get(link.outer);
				if(cmp2 !== cmp){
					cmp.push(link, ...cmp2);
					for(let lnk of cmp2){
						comp.set(lnk.inner, cmp);
						comp.set(lnk.outer, cmp);
					}
					components.splice(components.indexOf(cmp2), 1);
				}
				else{
					throw new Error("Unexpected: both nodes already in same component");
				}
			}
			else{
				cmp.push(link);
				comp.set(link.outer, cmp);
			}
		}
		else if(comp.has(link.outer)){
			let cmp = comp.get(link.outer);
			cmp.push(link);
			comp.set(link.inner, cmp);
		}
		else{
			let cmp = [link];
			components.push(cmp);
			comp.set(link.inner, cmp);
			comp.set(link.outer, cmp);
		}
	}
	
	return components;
}


module.exports = { gapArea, getIntersection, getSpacing, joinArea , commonTicks:computeCommonTicks, fillArea, uniqueAreas, getNestedAreas, sortArea};