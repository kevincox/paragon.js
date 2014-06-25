// Copyright 2013-2014 Kevin Cox

/*******************************************************************************
*                                                                              *
*  This software is provided 'as-is', without any express or implied           *
*  warranty. In no event will the authors be held liable for any damages       *
*  arising from the use of this software.                                      *
*                                                                              *
*  Permission is granted to anyone to use this software for any purpose,       *
*  including commercial applications, and to alter it and redistribute it      *
*  freely, subject to the following restrictions:                              *
*                                                                              *
*  1. The origin of this software must not be misrepresented; you must not     *
*     claim that you wrote the original software. If you use this software in  *
*     a product, an acknowledgment in the product documentation would be       *
*     appreciated but is not required.                                         *
*                                                                              *
*  2. Altered source versions must be plainly marked as such, and must not be  *
*     misrepresented as being the original software.                           *
*                                                                              *
*  3. This notice may not be removed or altered from any source distribution.  *
*                                                                              *
*******************************************************************************/

"use strict";

if (typeof require == "function")
{
	var chai     = require("chai");
	var Paragon  = require("../Paragon.js");
}
var expect = chai.expect;
chai.Assertion.includeStack = true;
//chai.config.includeStack = true;

describe('Paragon', function(){
	it("should have a create function", function(){
		expect(Paragon).itself.to.respondTo("create");
	});
	it("should create should create a class", function(){
		expect(Paragon.create({})).to.be.a("function");
	});
	it("should inherit from Paragon", function(){
		var Klass = Paragon.create({});
		expect(new Klass).to.be.an.instanceof(Paragon);
	});
	it("should create it's properties", function(){
		var called = false;
		var Klass = Paragon.create({
			foo: {value: 5},
			bar: {
				get: function(){ return 27 },
				set: function(v){ expect(v).to.eql(9); called = true; },
			}
		});
		var o = new Klass;
		expect(o.foo).to.equal(5);
		expect(o.foo = 2).to.equal(2);
		expect(o.foo).to.equal(2);
		
		expect(o.bar).to.equal(27);
		expect(called).to.equal(false);
		o.bar = 9;
		expect(called).to.equal(true);
		expect(o.bar).to.equal(27); // Unchanged.
	});
	it("should call callbacks", function(){
		var called = [0, 0, 0, 0];
		var Klass = Paragon.create({
			foo: false,
			bar: {
				get: function(){},
				set: function(){},
			},
		});
		var o = new Klass;
		var f = function(v){ called[3]++ }
		
		o.foochanged.add(function(v){ expect(v).to.equal(++called[0]) });
		o.foochanged.add(function(v){ expect(v).to.equal(++called[1]) });
		o.barchanged.add(function(v){ expect(v).to.equal(++called[2]) });
		
		o.foochanged.add(f);
		o.barchanged.add(f);
		
		expect(called).to.deep.equal([0,0,0,0]);
		o.foo = 1;
		expect(called).to.deep.equal([1,1,0,1]);
		o.foo = 2;
		expect(called).to.deep.equal([2,2,0,2]);
		o.bar = 1;
		expect(called).to.deep.equal([2,2,1,3]);
		o.foo = 3;
		expect(called).to.deep.equal([3,3,1,4]);
		o.bar = 2;
		expect(called).to.deep.equal([3,3,2,5]);
	});
	it("should support computed properties", function(){
		var Klass = Paragon.create({
			first: {value: "John"},
			last:  {value: "Smith"},
			full:  {
				depends: ["first", "last"],
				get: function(){
					return this.first+" "+this.last;
				},
				set: function(val){
					var s = val.split(" ");
					this.first = s[0];
					this.last  = s[1];
				},
			},
		});
		var o = new Klass;
		
		var called = [0,0,0,0];
		o.firstchanged.add(function(){called[0]++});
		o.lastchanged.add(function(){called[1]++});
		o.fullchanged.add(function(){called[2]++});
		o.changed.add(function(){called[3]++});
		
		expect(called).to.deep.equal([0,0,0,0]);
		
		expect(o.first).to.equal("John");
		expect(o.last).to.equal("Smith");
		expect(o.full).to.equal("John Smith");
		
		expect(called).to.deep.equal([0,0,0,0]);
		
		o.first = "Kevin";
		
		expect(called).to.deep.equal([1,0,1,1]);
		
		expect(o.first).to.equal("Kevin");
		expect(o.last).to.equal("Smith");
		expect(o.full).to.equal("Kevin Smith");
		
		expect(called).to.deep.equal([1,0,1,1]);
		
		o.full = "Jane Doe";
		
		expect(called).to.deep.equal([2,1,2,2]);
		
		expect(o.first).to.equal("Jane");
		expect(o.last).to.equal("Doe");
		expect(o.full).to.equal("Jane Doe");
	});
	it("should use non-object signatures as values", function(){
		var Klass = Paragon.create({
			foo: 1,
			bar: undefined,
			baz: false,
			bop: [], // An object.
		});
		
		var o = new Klass;
		expect(o.foo).to.equal(1);
		expect(o.bar).to.equal(undefined);
		expect(o.baz).to.equal(false);
		expect(o.hasOwnProperty("bop")).to.equal(false);
	});
	it("should be class heirarchy fiendly.", function(){
		var C1 = Paragon.create({foo:{value:5},baz:{value:2}});
		var C2 = Paragon.create({bar:{value:9}}, C1);
		
		function O(){};
		O.prototype = Object.create(C1.prototype);
		
		var C3 = Paragon.create({foo:{value:4},bop:{value:17}}, O);
		
		var c1 = new C1;
		var c2 = new C2;
		var o  = new O;
		var c3 = new C3;
		
		expect(c1).to.be.an.instanceof(C1);
		expect(c1.foo).to.equal(5);
		expect(c1.baz).to.equal(2);
		
		expect(c2).to.be.an.instanceof(C2);
		expect(c2).to.be.an.instanceof(C1);
		expect(c2.foo).to.equal(5);
		expect(c2.baz).to.equal(2);
		expect(c2.bar).to.equal(9);
		
		expect(o).to.be.an.instanceof(O);
		expect(o).to.be.an.instanceof(C1);
		expect(o.foo).to.equal(5);
		expect(o.baz).to.equal(2);
		
		expect(c3).to.be.an.instanceof(C3);
		expect(c3).to.be.an.instanceof(O);
		expect(c3).to.be.an.instanceof(C1);
		expect(c3.foo).to.equal(4);
		expect(c3.baz).to.equal(2);
		expect(c3.bar).to.not.exist;
		expect(c3.bop).to.equal(17);
	});
	it("should enforce parent is a Paragon", function(){
		expect(function(){
			Paragon.create({}, Array);
		}).to.throw(TypeError);
	});
	it("should have unique values for instances", function(){
		var klass = Paragon.create({prop: "foo"});
		
		var o1 = new klass();
		var o2 = new klass();
		
		expect(o1.prop).to.equal("foo");
		expect(o2.prop).to.equal("foo");
		
		o1.prop = "bar";
		
		expect(o1.prop).to.equal("bar");
		expect(o2.prop).to.equal("foo");
	});
});
