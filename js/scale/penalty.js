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

/*
	Требования к операции
	_sum(a, b) = _sum(b, a);
	_sum(_sum(a,b),c) = _sum(a,_sum(b,c));
	для a>b => _sum(a,c) >= _sum(b,c);
	Желательно:
	_sum(a, 0) = a
	_sum(a,b) < _sum(a+b, 0) или _sum(a,b)< a+b
*/

function _sum(a, b){
	return Math.max(a, b);
}

function penaltySum(...values){
	return values.reduce(_sum, 0);
}

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
	
	let a = max>mutedist.max ? (max-mutedist.max)/mutedist.max : 0;
	let b = min<mutedist.min ? (mutedist.min-min)/mutedist.min : 0;
	
	return _sum(a, b);
}

module.exports = {
	metricArea,
	penaltySum
};