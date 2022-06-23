const assert = require('assert');
const jsc = require('jsverify');
const {env} = require('@grunmouse/jsverify-env');
const Decimal = require('decimal.js');

const {
	toLevels, 
	LevelsByFunctions, 
	decimalLevels, 
	decimal25Levels
	} = require('../mark-levels.js');

describe('mark-levels', ()=>{
	describe('decimal25Levels', ()=>{
		jsc.property('index<=>step', 'int16', env, (index)=>{
			const level = decimal25Levels;
			return level.getIndex(level.getStep(index)) === index;
		});
		describe('getStepsBetween', ()=>{
			it('10, 1', ()=>{
				let vars = decimal25Levels.getStepsBetween(new Decimal(10), new Decimal(1));
				assert.deepEqual(vars, [new Decimal(2), new Decimal(5)]);
			});
		});
		describe('findSepVars', ()=>{
			it('10, 1', ()=>{
				let vars = decimal25Levels.findSepVars(new Decimal(10), new Decimal(1));
				assert.deepEqual(vars, [[10,5,1],[10,2,1]].map(arr=>arr.map(v=>(new Decimal(v)))));
			});
		});
	});
	
	describe('binaryLevels', ()=>{
		const level = new LevelsByFunctions({
			getStep(index){
				return 2**index;
			},
			getIndex(step){
				return Math.log2(step);
			},
			isUniversal(){
				return true;
			}
		});
		
		it('create ok', ()=>{
			assert(level);
		});
		
		jsc.property('index<=>step', env.int(-55, 55), env, (index)=>{
			return level.getIndex(level.getStep(index)) === index;
		});

	});
});