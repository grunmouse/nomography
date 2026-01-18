const {MapOfSet, MapOfMap} = require('@grunmouse/special-map');

class Digraph {
	constructor(converter, edges, nodes){
		if(!converter.call){
			nodes = edges;
			edges = converter;
			converter = (a)=>(a);
		}
		this.converter = converter;
		this._originalEdges = edges;
		this.edges = edges.map(converter);
		if(nodes){
			this.nodes = new Set(nodes);
		}
		else{
			this.nodes = new Set(this.edges.flat());
		}
		
		this._init();
	}
	
	_init(){
		const children = this._children = new MapOfSet();
		const parents = this._parents = new MapOfSet();
		const reach = this._reachMatrix = new MapOfMap();
		
		for(let [p, c] of this.edges){
			children.add(p, c);
			parents.add(c, p);
			reach.set(p,c, true);
		}
		
		// Алгоритм Флойда-Уоршелла
		for(let k of this.nodes){
			for(let i of this.nodes){
				for(let j of this.nodes){
					reach.set(i, j, reach.get(i, j) || (reach.get(i, k) && reach.get(k, j)));
				}
			}
		}	
	}
	
	clone(){
		let graph = new Digraph(this.converter, [], []);
		graph.nodes = this.nodes;
		graph.edges = this.edges;
		
		graph._init();
		
		return graph;
	}
	
	addLeaf(edge){
		edge = this.converter(edge);
		this.nodes.add(edge[1]);
		this._addLeaf(edge);
	}
	
	_addLeaf(edge){
		this.edges.push(edge);
		const [parent, leaf] = edge;
		this._children.add(parent, leaf);
		this._parents.add(leaf, parent);
		this._reachMatrix.set(parent, leaf, true);
		
		//Добавление транзитивных замыканий
		for(let pp of this._parents.get(parent)){
			this._addLeaf([pp,leaf]);
		}
	}
	
	removeLeaf(leaf){
		if(this._children.get(leaf).size()>0){
			throw new Error('node is not a leaf');
		}
		
		for(let parent of this._parents.get(leaf)){
			this._children.get(parent).delete(leaf);
			this._reachMatrix.set(parent, leaf, false);
		}
		
		this.nodes.delete(leaf);
		
		this.edges = this.edges.filter((edge)=>(edge[1]!==leaf));
	}
	
	get hasAlternativePath(){
		return (edge)=>{
			const [ outer, inner ] = this.converter(edge);
			const reach = this._reachMatrix;

			for(let k of this._children.get(outer)){
				if( k!==outer && k !== inner){
					if(reach.get(outer, k) && reach.get(k, inner)){
					  return true;
					}
				}
			}
			
			return false;
		}
	}
	
	get computeDepth(){
		const depthMemo = new Map();
		const reverseGraph = this._parents;
		
		return function computeDepth(node) {
			if (depthMemo.has(node)) return depthMemo.get(node);

			let parents = reverseGraph.get(node);
			let maxDepth = 0;
			if(reverseGraph.has(node)){
				for(let parent of reverseGraph.get(node)){
					let depth = computeDepth(parent)+1;
					if(depth > maxDepth){
						maxDepth = depth;
					}
				}
			}

			depthMemo.set(node, maxDepth);
			return maxDepth;
		}
	}
}


module.exports = {
	Digraph
};