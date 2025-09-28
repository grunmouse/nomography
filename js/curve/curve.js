const binary = require("@grunmouse/binary");

const {Vector2} = require('@grunmouse/math-vector');

function getKey(vec){
	let buff = Float64Array.from(vec).buffer;
	
	let value = binary.bigint.fromBuffer(buff);
	
	return value;
}


/**
 * Утилитарные функции
 */
const sign = Math.sign;
const abs = Math.abs;

const dichotom = require('./dichotom.js');

/**
 * Представляет кривую с ассоциированными точками и методами анализа.
 * Каждая точка соответствует значениям разных функций в этой точке.
 */
class Curve {
	/**
	 * @param {string} name - Имя кривой.
	 * @param {number} value - Значение, ассоциированное с кривой.
	 */
	constructor(name, value, f, coords, points, closed=false, functions={}, tolerance={}) {
		this.name = name;
		this.value = value;
		this.equation = `${name} = ${value}`;
		this.functions = functions;
		this.tolerance = tolerance;
		this.fun = f;
		this.coords = coords; //Имена параметров, служащих координатами
		this.points = points.map((p)=>(this._calcPoint(p))); // Инициализировать массив точек
		this.closed = closed;
		this._calcTolerance();
		this._hashPoints();
		
	}
	
	_calcTolerance(){
		const keys = this.coords.concat(Object.keys(this.functions));
		const min = Object.fromEntries(keys.map(key=>([key, Infinity])));
		const points = this.points;
		let prev = points[0], len = points.length;
		for(let i=1; i<len; ++i){
			for(let key of keys){
				let diff = abs(points[i][key]-prev[key]);
				if(diff<min[key]){
					min[key] = diff;
				}
			}
		}
		for(let key of keys){
			if(!this.tolerance[key]){
				this.tolerance[key] = min[key]/128;
			}
		}
	}
	
	_hashPoints(){
		const [x,y] = this.coords;
		const points = this.points;
		const map = this._hash = new Map();
		let len = this.points.length;
		for(let i=0; i<len; ++i){
			let P = points[i];
			let V = new Vector2(P[x], P[y]);
			let key = getKey(V);
			map.set(key, P);
		}
	}
	
	_getVector(index){
		const [x,y] = this.coords;
		const P = this.points[index];
		return new Vector2(P[x], P[y]);
	}
	
	/**
	 * Проверяет, находится ли разница в именованном свойстве между двумя последовательными точками ниже порога дельта.
	 * @param {string} name - Имя свойства.
	 * @param {number} index - Индекс первой точки.
	 * @returns {boolean} True, если разница субдельта.
	 */
	 //TODO
	_isSubDelta(name, index, delta) {
		const points = this.points;
		return abs(points[index][name] - points[index + 1][name]) < delta;
	}

	/**
	 * Проверяет, достигло ли расстояние между точками по 'p' или 'eps' предела точности.
	 * @param {number} index - Индекс первой точки.
	 * @returns {boolean} True, если расстояние нулевое (точность достигнута).
	 */
	_isNullDistance(name, index) {
		const tol = 10000 * Number.EPSILON;
		const points = this.points;
		if(index ==null && typeof name === 'number'){
			index = name;
			if(index >= points.length-1) --index;
			if(index < 0) ++index;
			return this._getVector(index+1).sub(this._getVector(index)).abs()<tol;
		}
		if(index >= points.length-1) --index;
		if(index < 0) ++index;
		const index1 = index + 1;
		
		if(!points[index]){
			console.log(points.length, index);
		}
		let a = points[index][name];
		let b = points[index1][name];
		
		if (abs((a-b)/b) < tol && abs((b-a)/a) < tol) {
			return true;
		}
		return false;
	}

	/**
	 * Находит экстремум (максимум или минимум) для заданного yName с использованием итеративного уточнения.
	 * @param {string} yName - Имя y-свойства.
	 * @param {Function} control - Функция для проверки точности (возвращает true, если уточнение завершено).
	 * @param {boolean} isMaximum - true для поиска максимума, false для минимума (по умолчанию true).
	 * @param {number|null} startIndex - Индекс, с которого начинать уточнение (опционально; если null, используется индекс найденного экстремума).
	 * @returns {Object} Точка экстремума.
	 */
	_extremum(yName, control, isMaximum = true, startIndex = null) {
		const points = this.points;
		const getY = (index) => points[index][yName];
		const len = points.length;

		// Функция сравнения: для максимума a > b, для минимума a < b
		const compare = isMaximum ? (a, b) => a > b : (a, b) => a < b;

		// Шаг 1: Найти начальный экстремум по всему массиву
		if(startIndex == null){
			let extremum = getY(0);
			let extremumIndex = 0;
			for (let i = 1; i < len; ++i) {
				const y = getY(i);
				if (compare(y, extremum)) {
					extremum = y;
					extremumIndex = i;
				}
			}
			startIndex = extremumIndex;
		}

		// Шаг 2: Определить индекс для начала уточнения
		let refineIndex = startIndex;
		if (refineIndex < 0 || refineIndex >= len) {
			throw new Error("startIndex вне диапазона массива");
		}
		if (refineIndex === 0 || refineIndex === len - 1) {
			return points[refineIndex];  // Если на краю, уточнение не нужно
		}

		// Шаг 3: Итеративное уточнение
		let curIndex = refineIndex - 1;
		while (!control(curIndex)) {
			this._newPoint(curIndex + 1);
			this._newPoint(curIndex);
			++curIndex;
			refineIndex = curIndex + 1;
			/*
			(a, b) => a < b
			if (getY(curIndex) < getY(minIndex)) {
				--curIndex;
			} else if (getY(curIndex + 2) < getY(minIndex)) {
				curIndex = minIndex;
			}
			*/
			if (compare(getY(curIndex), getY(refineIndex))) {
				--curIndex;
			} 
			else if (compare(getY(curIndex + 2), getY(refineIndex))) {
				curIndex = refineIndex;
			}
		}
		refineIndex = curIndex + 1;
		return points[refineIndex];
	}
	
	/**
	 * Возвращает пару индексов, которые останутся неизменными при добавлении точек между ними
	 * Первый отсчитывается от начала, второй - от конца.
	 */
	invariantIndex(a, b){
		const len = this.points.length;
		if(a<0){
			a = a + len;
		}
		if(b>0){
			b = b - len;
		}
		return [a,b];
	}
	
	/**
	 * Находит точки, где yName равно yValue, используя дихотомию.
	 * @param {string} yName - Имя y-свойства.
	 * @param {number} yValue - Целевое значение.
	 * @param {Function} control - Функция для проверки точности.
	 * @returns {Array} Массив точек, где yName равно yValue.
	 */
	_find(yName, yValue, control, a=0, b=-1) {
		const points = this.points;
		const getY = (index) => points[index][yName];
		const dich = (index) => {
			//Предполагается, что точка лежит между index и index+1
			let curIndex = index;
			while (!control(curIndex)) {
				let d = sign(getY(curIndex + 1) - getY(curIndex)); //признак возрастания
				this._newPoint(curIndex);
				let Y = getY(curIndex + 1);
				if (Y === yValue) {
					//Нашлось значение
					++curIndex;
					break;
				}
				if(sign(yValue-Y) === d) {
					//d>0 && yValue>Y || d<0 && yValue<Y
					//d>0 && sign(yValue-Y)>0 || d<0 && sign(yValue-Y)<0
					//следующий ищем после Y
					++curIndex;
				}
				if(sign(getY(curIndex) - yValue) * sign(getY(curIndex + 1) - yValue) != -1){
					debugger;
					throw new Error('Ошибка в алгоритме');
				}
			}
			return points[curIndex];
		};
		const p = [];
		if(b<0){
			b = b+points.length;
		}
		let i = b;
		if(getY(i)===yValue) p.push(points[i]);
		--i;
		for (; i >= a; --i) {
			const A = getY(i);
			if(A===yValue) p.push(points[i]);
			const B = getY(i+1);

			if (sign(A - yValue) * sign(B - yValue) == -1) {
				p.push(dich(i));
			}
		}
		return p;
	}

	_refine(index, h_max){
		const points = this.points;
		if(index === 0 || index >= points.length-1){
			return true;
		}
		let A = this._getVector(index-1);
		let B = this._getVector(index);
		let C = this._getVector(index+1);
		let AB = B.sub(A);
		let ortAC = C.sub(A).ort();
		let ortH = ortAC.rotOrto(1);
		let h = abs(AB.dot(ortH));
		
		if(h>h_max){
			let absBC = C.sub(B).abs();
			let absAB = AB.abs();
			if(absAB < absBC){
				//Делим BC
				this._newPoint(index);
				//С = point[index+2]
				for(let i=index+2; i>=index; --i){
					this._refine(i, h_max)
				}
			}
			else if(absAB > absBC){
				this._newPoint(index-1);
				for(let i=index+1; i>=index-1; --i){
					this._refine(i, h_max)
				}
			}
			else{
				this._newPoint(index);
				this._newPoint(index-1);
				for(let i=index+3; i>=index-1; --i){
					this._refine(i, h_max)
				}
			}
			return false;
		}
		return true;
	}
	
	/**
	 * Улучшить кривую до необходимой гладкости
	 */
	refine(h_max){
		let cond = false, n = 100;
		while(!cond && n>0){
			cond = true;
			for(let i=this.points.length-2; i>0; --i){
				cond = this._refine(i, h_max) && cond;
			}
			n--;
		}
		return cond;
	}
	
	_generalize(a, b, h_min){
		if(b-a<=1) return;
		const A = this._getVector(a);
		const B = this._getVector(b);
		const ortH = B.sub(A).ort().rotOrto(1);
		const getH = (index)=>(abs(this._getVector(index).sub(A).dot(ortH)));
		const points = this.points;
		
		let h_max = 0, index;
		for(let i=a+1; i<b; ++i){
			if(points[i].protect){
				index = i;
				break;
			}
			let h = getH(i);
			if(h>h_max){
				h_max = h;
				index = i;
			}
		}
		//console.log(h_max);
		//console.log(h_min);
		if(h_max>h_min || this.points[index].protect){
			this._generalize(index, b, h_min);
			this._generalize(a, index, h_min);
		}
		else{
			this.points.splice(a+1, b-a-1);
		}
	}
	
	/**
	 * Оптимизировать кривую, с контролем гладкости
	 */
	generalize(h_min){
		this._generalize(0, this.points.length-1, h_min);
		this._hashPoints();
	}
	
	/**
	 * Уточняет максимальную точку для заданного yName, кэшируя результат.
	 * @param {string} yName - Имя y-свойства.
	 * @returns {Object} Максимальная точка.
	 */
	maximum(yName, index) {
		const control = (index) => this._isNullDistance(index) || this._isNullDistance(index + 1);
		return this._extremum(yName, control, true, index);
	}

	/**
	 * Уточняет минимальную точку для заданного yName, кэшируя результат.
	 * @param {string} yName - Имя y-свойства.
	 * @returns {Object} Минимальная точка.
	 */
	minimum(yName, index) {
		const control = (index) => this._isNullDistance(index) || this._isNullDistance(index + 1);
		return this._extremum(yName, control, false, index);
	}

	/**
	 * Находит точки, где yName равно yValue.
	 * @param {string} yName - Имя y-свойства.
	 * @param {number} yValue - Целевое значение.
	 * @returns {Array} Массив точек.
	 */
	find(yName, yValue, a, b) {
		return this._find(
			yName,
			yValue,
			(index) => this._isNullDistance(index) || this._isNullDistance(index - 1),
			a, b
		);
	}

	_newPoint(index){
		const {points, value, coords} = this;
		const a = this._getVector(index);
		const b = this._getVector(index+1);
		const m = a.add(b).div(2);
		const d = b.sub(a).rotOrto(1);
		
		const xy = (t)=>m.add(d.mul(t));
		const f = (t)=>{
			let X = xy(t);
			return this.fun(X.x, X.y);
		}
		
		let t = dichotom(f, this.value, -1, 1, Number.EPSILON*this.value);
		
		let X = xy(t);
		
		let key = getKey(X);
		if(this._hash.has(key)){
			let exIndex = points.indexOf(this._hash.get(key));
			console.log(d.abs());
			if(abs(index-exIndex)>1){
				console.log(this._getVector(exIndex).sub(a).abs());
				throw new Error(`Heresy ${index} ${exIndex}`);
			}
			return;
		}
		
		//Заинлайнил создание новой точки
		let point = {};
		coords.forEach((name, index)=>{point[name]=X[index];});
		point = this._calcPoint(point);
		this.points.splice(index + 1, 0, point);
		
		this._hash.set(key, point);
	}

	/**
	 * Вычисляет точку.
	 * @returns {Object} Вычисленная точка.
	 */
	_calcPoint(coord) {
		const [x,y] = this.coords;
		let point = {...coord};
		for(let [name, fun] of Object.entries(this.functions)){
			point[name] = fun(point[x],point[y]);
		}
		return point;
	}

	limits(yName, a=0, b=-1){
		let min = Infinity, max = -Infinity;
		const points = this.points, len = points.length;
		if(b<0){
			b = b+len;
		}
		for(let i=a; i<=b; ++i){
			let value = points[i][yName];
			if(value<min) min = value;
			if(value>max) max = value;
		}
		return [min,max];
	}
	
	analyse(yName){
		let points = this.points, len = points.length;
		let parts = [], ext = [], curSign = Math.sign(points[1][yName] - points[0][yName]), curPart = {begin:0, sign:curSign};
		parts.push(curPart);
		for(let i=1; i<len-1; ++i){
			let d = points[i+1][yName] - points[i][yName];
			let nextSign = Math.sign(d);
			if(curSign != nextSign){
				curPart.last = i;
				ext.push({index:i, type:[curSign, nextSign]});
				curSign = nextSign;
				curPart = {begin:i, sign:curSign};
				parts.push(curPart);
			}
		}
		curPart.last = len-1;
		return {parts, ext};
	}

	precisionExtremums(funnames){
		const control = (index) => this._isNullDistance(index) || this._isNullDistance(index + 1); //Для экстремума надо так
		let exts = [];
		for(let funname of funnames){
			let report = this.analyse(funname);
			for(let ext of report.ext){
				ext.isMaximum = ext.type[0]>ext.type[1];
				ext.funname = funname;
				exts.push(ext);
			}
		}
		exts.sort((a,b)=>(b.index-a.index)); //По убыванию индексов
		for(let ext of exts){
			let point = this._extremum(ext.funname, control, ext.isMaximum, ext.index);
			point.protect = true;
		}
	}

	slice(begin, end){
		let points;
		if(this.closed){
			let len = this.points.length;
			if(begin<0) begin+=len;
			if(isNaN(end)) end = len;
			if(end<0) end+=len;
			if(end<=begin){
				points = this.points.slice(begin).concat(this.points.slice(0, end));
			}
			else{
				points = this.points.slice(begin, end);
			}
		}
		else{
			points = this.points.slice(begin, end);
		}
		return new Curve(this.name, this.value, this.fun, this.coords, points, false, this.functions);
	}
	
	/**
	 * Вставляет кривую между двумя точками. Предполагается, что концы кривой совпадают с этими точками
	 */
	merge(index, curve){
		points = curve.points.slice(1,-1).map((p)=>(this._calcPoint(p))); // Инициализировать массив точек
		this.points.splice(index+1, 0, points);
	}
}

module.exports = Curve;