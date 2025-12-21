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
 * Вычисляет метрическую "штрафную" функцию области: сумма квадратов отклонений расстояний от mutedist.
 * @param {*} start - Начало интервала (Rational).
 * @param {*} end - Конец.
 * @param {*} step - Шаг.
 * @param {Function} distance(a,b) - Функция расстояния.
 * @param {Object} mutedist - {min, max} - Диапазон допустимых расстояний.
 * @returns {Number} Штраф k (меньше - лучше).
 */
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

module.exports = {metricArea};