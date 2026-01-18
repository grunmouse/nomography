function isTransitiveTournament(edges) {
  const graph = new Map();
  const inDegree = new Map();
  const nodes = new Set();

  // Строим граф и степени
  for (const { outer, inner } of edges) {
    if (!graph.has(outer)) graph.set(outer, []);
    graph.get(outer).push(inner);
    inDegree.set(inner, (inDegree.get(inner) || 0) + 1);
    inDegree.set(outer, inDegree.get(outer) || 0);
    nodes.add(outer);
    nodes.add(inner);
  }

  // Топологическая сортировка
  const topoOrder = [];
  const queue = [];

  for (const node of nodes) {
    if ((inDegree.get(node) || 0) === 0) {
      queue.push(node);
    }
  }

  while (queue.length > 0) {
    if (queue.length > 1) return false; // Не линейный порядок
    const node = queue.shift();
    topoOrder.push(node);

    for (const neighbor of graph.get(node) || []) {
      inDegree.set(neighbor, inDegree.get(neighbor) - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (topoOrder.length !== nodes.size) return false; // Есть цикл

  // Проверяем, что все транзитивные рёбра присутствуют
  const indexMap = new Map();
  topoOrder.forEach((node, i) => indexMap.set(node, i));

  for (let i = 0; i < topoOrder.length; i++) {
    const from = topoOrder[i];
    for (let j = i + 1; j < topoOrder.length; j++) {
      const to = topoOrder[j];
      const hasEdge = (graph.get(from) || []).includes(to);
      if (!hasEdge) return false;
    }
  }

  return true;
}

const assert = require('assert');

describe('isTransitiveTournament', function () {
  it('должна возвращать true для пустого графа', () => {
    assert(isTransitiveTournament([]));
  });

  it('должна возвращать true для одного узла без рёбер', () => {
    assert(isTransitiveTournament([]));
  });

  it('должна возвращать true для A -> B', () => {
    assert(isTransitiveTournament([{ outer: 'A', inner: 'B' }]));
  });

  it('должна возвращать false для A -> B, B -> C (без A -> C)', () => {
    assert(!isTransitiveTournament([
      { outer: 'A', inner: 'B' },
      { outer: 'B', inner: 'C' }
    ]));
  });

  it('должна возвращать true для полной цепочки A -> B -> C', () => {
    assert(isTransitiveTournament([
      { outer: 'A', inner: 'B' },
      { outer: 'A', inner: 'C' },
      { outer: 'B', inner: 'C' }
    ]));
  });

  it('должна возвращать false при разветвлении', () => {
    assert(!isTransitiveTournament([
      { outer: 'A', inner: 'B' },
      { outer: 'A', inner: 'C' }
    ]));
  });

  it('должна возвращать false при наличии цикла', () => {
    assert(!isTransitiveTournament([
      { outer: 'A', inner: 'B' },
      { outer: 'B', inner: 'C' },
      { outer: 'C', inner: 'A' }
    ]));
  });

  it('должна возвращать true для полной цепочки из 4 узлов', () => {
    assert(isTransitiveTournament([
      { outer: 'A', inner: 'B' },
      { outer: 'A', inner: 'C' },
      { outer: 'A', inner: 'D' },
      { outer: 'B', inner: 'C' },
      { outer: 'B', inner: 'D' },
      { outer: 'C', inner: 'D' }
    ]));
  });

  it('должна возвращать false для неполной цепочки из 4 узлов', () => {
    assert(!isTransitiveTournament([
      { outer: 'A', inner: 'B' },
      { outer: 'B', inner: 'C' },
      { outer: 'C', inner: 'D' }
    ]));
  });

  it('должна возвращать false для разветвлённого графа', () => {
    assert(!isTransitiveTournament([
      { outer: 'A', inner: 'B' },
      { outer: 'A', inner: 'C' },
      { outer: 'B', inner: 'D' },
      { outer: 'C', inner: 'D' }
    ]));
  });

  it('должна возвращать false для несвязного графа', () => {
    assert(!isTransitiveTournament([
      { outer: 'A', inner: 'B' },
      { outer: 'C', inner: 'D' }
    ]));
  });
});
