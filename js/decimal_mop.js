const Decimal = require('decimal.js');


const {
	operators:{
		add,
		sub,
		neg,
		div,
		mul,
		eq,
		lt,
		gt
	}
} = require('@grunmouse/multioperator-ariphmetic');

function def(oper, method){
	oper.def(Decimal, Decimal, (a, b)=>(a[method](b)));
	oper.def(Decimal, Number, (a, b)=>(a[method](b)));
	oper.def(Number, Decimal, (a, b)=>(new Decimal(a)[method](b)));
}


def(add, 'plus');
def(sub, 'minus');
def(neg, 'negated');
def(div, 'dividedBy');
def(mul, 'times');
def(eq, 'equals');
def(lt, 'lessThan');
def(gt, 'greaterThan');