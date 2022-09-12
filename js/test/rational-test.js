const assert = require('assert');
const jsc = require('jsverify');
const {env} = require('@grunmouse/jsverify-env');
const Rational = require('../rational-number.js');

describe('rational-number', ()=>{
	describe('constructor', ()=>{
		it('exists', function(){
			assert.ok(Rational);
		});
		it('instanse', function(){
			let n = new Rational();
			assert.ok(n);
		});
		
		jsc.property('one args', 'posit', env, function(nom){
			let n = new Rational(nom);
			assert.equal(n.nom, BigInt(nom));
			return true;
		});
		jsc.property('two args', 'posit', 'posit', env, function(nom, den){
			let n = new Rational(nom, den);
			assert.equal(n.nom, BigInt(nom));
			assert.equal(n.den, BigInt(den));
			
			return true;
		});
	});
	
	describe('equal', ()=>{
		jsc.property('eq', 'int32', 'posit', env, function(nom, den){
			let a = new Rational(nom, den);
			let b = new Rational(nom, den);
			assert.ok(a.eq(b));
			return true;
		});		
		jsc.property('not eq', 'int32', 'posit', env, function(nom, den){
			let a = new Rational(nom, den);
			let b = new Rational(nom+1, den);
			assert.ok(!a.eq(b));
			return true;
		});
		jsc.property('simple', 'int32', 'posit', env, function(nom, den){
			let a = new Rational(nom, den);
			let b = a.simple();
			assert.ok(a.eq(b));
			return true;
		});
		jsc.property('with number', 'int32', env, function(nom){
			let a = new Rational(nom, 1);
			assert.ok(a.eq(nom));
			return true;
		});
		jsc.property('one', 'int32', env, function(nom){
			let a = new Rational(nom, nom);
			assert.ok(a.eq(1));
			return true;
		});
	});
	
	describe('add sub', ()=>{
		jsc.property('add 0', 'int32', 'posit', env, (nom, den)=>{
			let a = new Rational(nom, den);
			let b = a.add(0);
			assert.ok(a.eq(b));
			return true;
		});
		jsc.property('swap', 'int32', 'posit', 'int32', 'posit', env, (a,b,c,d)=>{
			const m = new Rational(a, b);
			const n = new Rational(c, d);
			
			let p = m, q = n;
			//swap
			p = p.add(q);
			q = p.sub(q);
			p = p.sub(q);
			
			assert.ok(p.eq(n));
			assert.ok(q.eq(m));
			
			return true;
		});
	});
});