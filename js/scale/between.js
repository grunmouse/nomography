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

const {MapOfMap, MapOfSet} = require('@grunmouse/special-map');

const {fillArea} = require('./interval-utils.js');

function betweenPoints(start, end, mutestep, distance, levels, labeldist){
	let stepStart = levels.findLevel(start), stepEnd = levels.findLevel(end);
	let step;

	if(stepStart[EQ](stepEnd)){
		step = stepStart;
	}
	else{
		step = stepStart[GT](stepEnd) ? stepEnd : stepStart;
		let altStep = stepStart[LT](stepEnd) ? stepStart : stepEnd;
		
		if(!levels.hasDiv(step, altStep)){
			console.log(`less universal ${step}, ${altStep}`);
			step = levels.getLessUniversalStep(step);
		}
	}
	
	if(!levels.hasDiv(mutestep, step)){
		throw new Error('Невалидный шаг. Проверить логику');
	}
	
	let edges = getGraph(start, end, step, distance, labeldist);
	
	let paths = findAllPaths(edges, start, end);
	
	
	let points = paths[0];
	
	//Надо сделать выбор лучшего варианта
	
	return points;

}

/**
 * @param start : Rational - начальная точка
 * @param step : Rational - цена деления
 * @param distance : Function<(any, any)=>Number> - функция геометрической длины деления (инкапсулирует нелинейность)
 * @param labeldist : {min:Number, max:Number} - условия на расстояние между надписанными штрихами
 * @param OPER : <ADD|SUB> - ключ метода, реализующего арифметическую операцию
 * @return Array<Rational> - массив точек, находящихся на расстояниях labeldist от start, в направлении OPER
 */
function findEdges(start, step, distance, labeldist, OPER){
	let result = [];
	let b = start;
	while(true){
		b = b[OPER](step);
		let d = distance(start, b);
		if(d>labeldist.max){
			break;
		}
		if(d>=labeldist.min){
			result.push(b);
		}
	}
	return result;
}

/**
 * Составляет граф достижимых точек из start, при условии labeldist
 * @param start : Rational - начальная точка
 * @param end : Rational - предел трассирования (точки после него сохраняем, но от них дальше не ищем)
 * @param step : Rational - цена деления
 * @param distance : Function<(any, any)=>Number> - функция геометрической длины деления (инкапсулирует нелинейность)
 * @param labeldist : {min:Number, max:Number} - условия на расстояние между надписанными штрихами
 * @return Array<Array[2]<Rational>> - массив пар точек, являющихся рёбрами искомого графа
 */
function traceGraph(start, end, step, distance, labeldist){
	const rev = start[GT](end);
	const OPER = rev ? SUB : ADD;
	const COND = OPER === ADD ? LE : GE;
	let edges = [];
	let queue = [start];
	let setQueue = new Set();
	for(let i=0; i<queue.length; ++i){
		let current = queue[i];
		let next = findEdges(current, step, distance, labeldist, OPER);
		for(let n of next){
			if(rev){
				edges.push([n, current]);
			}
			else{
				edges.push([current, n]);
			}
			let key = n.simple().toString();
			if(n[COND](end) && !setQueue.has(key)){
				queue.push(n);
				setQueue.add(key);
			}
		}
	}
	return edges;
}

function getGraph(start, end, step, distance, labeldist){
	const middle = start[ADD](end)
	const graph1 = traceGraph(start, end, step, distance, labeldist);
	const invMap = new MapOfSet();
	graph1.forEach((edge)=>{
		let [a, b] = edge;
		invMap.add(b.simple().toString(), edge);
	});
	const graph2 = [];
	
	let queue = [end];
	let setQueue = new Set([end.simple().toString()]);
	for(let i=0; i<queue.length; ++i){
		let current = queue[i];
		let edges = invMap.get(current.simple().toString());
		if(edges){
			for(let edge of edges){
				let [a,b] = edge;
				graph2.push(edge);
				let key = a.simple().toString();
				if(!setQueue.has(key)){
					queue.push(a);
					setQueue.add(key);
				}
			}
		}
	}
	
	return graph2;
}

function findAllPaths(edges, startNode, endNode) {
	// 1. Построим список смежности из массива дуг для удобства
	const adj = new Map();
	for (const [u, v] of edges) {
		let key = u.simple().toString();
		if (!adj.has(key)) {
			adj.set(key, []);
		}
		adj.get(key).push(v);
	}

	const allPaths = [];
	const currentPath = [];

	// 2. Рекурсивная функция DFS
	function dfs(currentNode) {
		currentPath.push(currentNode); // Добавляем текущую вершину в путь

		// Если достигли конечной вершины
		if (currentNode[EQ](endNode)) {
			allPaths.push([...currentPath]); // Добавляем копию пути в результат
		} else {
			// Если у текущей вершины есть соседи
			const neighbors = adj.get(currentNode.simple().toString());
			if (neighbors) {
				for (const neighbor of neighbors) {
					dfs(neighbor); // Рекурсивно вызываем DFS для соседа
				}
			}
		}

		// 3. Возврат (бэктрекинг): удаляем вершину при выходе из ветки
		currentPath.pop();
	}

	dfs(startNode); // Начинаем поиск с начальной вершины
	return allPaths;
}

module.exports = betweenPoints;