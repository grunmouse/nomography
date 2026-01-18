
const { Digraph } = require('../graph-utils.js');

// Пример использования:
const edges = [
    { outer: 'A', inner: 'B' },
    { outer: 'B', inner: 'C' },
    { outer: 'A', inner: 'C' }, // Это транзитивное замыкание
    { outer: 'C', inner: 'D' },
    { outer: 'A', inner: 'D' }, // Это тоже транзитивное замыкание
];

const graph = new Digraph((edge)=>([edge.outer, edge.inner]), edges);

const hasAlternativePath = graph.hasAlternativePath;

let markedEdges = edges.map((edge)=>{
	return {
		...edge,
		isTransitiveClosure: hasAlternativePath(edge)
	}
});

console.log(markedEdges);