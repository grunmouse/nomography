
const { Digraph } = require('../graph-utils.js');

const pairs = [
  { outer: 'B', inner: 'D' },
  { outer: 'A', inner: 'B' },
  { outer: 'A', inner: 'C' },
  { outer: 'C', inner: 'D' },
];

const graph = new Digraph((edge)=>([edge.outer, edge.inner]), pairs);

const computeDepth = graph.computeDepth;

const sorted = pairs.slice().sort((a, b) => {
    return (
      computeDepth(b.inner) - computeDepth(a.inner) ||
      computeDepth(b.outer) - computeDepth(a.outer)
    );
  });
  
  console.log(sorted);