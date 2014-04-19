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
+function(root, factory){
	"use strict";
	
	if (typeof define == "function" && define.amd) { // AMD
		define(["jssignals1"], factory);
	} else if (typeof module == "object" && module.exports) { // Node
		module.exports = factory(
			require("signals")
		);
	} else {
		root.Paragon = factory(signals);
	}
}(this, function ParagonFactory(jssig){
	"use strict";
	
	/** merge src into dest.
	 * 
	 * A deep merging function.  There must be no null values.  dest is
	 * overwritten in case of conflicts.
	 */
	function merge(dest, src) {
		for (var k in src) {
			if (typeof src[k] == "object" && typeof dest[k] == "object")
				merge(dest[k], src[k]);
			else
				dest[k] = src[k];
		}
	}
	
	/** Single change map.
	 * 
	 * This is used so that change events don't keep bouncing around computed
	 * properties.  It will be false when outside of an update or a set of
	 * properties that have been updated already.
	 */
	var alreadychanged = false;
	
	/** Create a property description.
	 * 
	 * Creates a description using the spec in sig.  This description will be
	 * passed to Object.defineProperty.
	 */
	function mkprop(name, sig) {
		//console.log("mkprop", name, sig);
		var value = sig.value;
		var hasvalue = sig.hasOwnProperty("value");
		var get = sig.get || ( hasvalue? function(){return value} : undefined );
		var set = sig.set || ( hasvalue? function(nv){value = nv} : undefined );
		
		return {
			get: get,
			set: set && function paragonmodel_set(val){
				var prev = this[name];
				
				// Set up a signal "session".
				var root = !alreadychanged;
				if (root) alreadychanged = {};
				alreadychanged[name] = 1;
				
				set.call(this, val);
				// console.log("Model changed", val, name, prev, this);
				
				this[name+"changed"].dispatch(val, name, prev, this);
				
				// If we are the root clean up.
				if (root) {
					this.changed.dispatch(val, name, prev, this);
					alreadychanged = false;
				}
			},
			enumerable: true,
		};
	}
	
	/** link a dependent property to its source.
	 */
	function link(self, source, dests) {
		self[source+"changed"].add(function(val, name, prev, model){
			for (var k in dests) {
				if (!alreadychanged[k]) {
					alreadychanged[k+"changed"] = 1;
					self[k+"changed"].dispatch(val, k, prev, model);
				}
			}
		});
	}
	
	/** Used to pass the dependency map down the constructors.
	 */
	var magicemittersarg = {};
	
	/** The Paragon base class.
	 */
	function Paragon(){
		var props = {};
		var sigs = magicemittersarg;
		for (var k in sigs) {
			this[k+"changed"] = new jssig.Signal();
			link(this, k, sigs[k]);
		}
		
		Object.defineProperties(this, props);
		
		magicemittersarg = {};
	}
	Object.defineProperties(Paragon, {
		/** Create a Paragon Model.
		 * 
		 * The first argument is a spec.  It is an object consisting of a
		 * property for each property to create on the model.  The value for
		 * each property is an object with the following keys.
		 * 
		 * - value: If present this is used as the initial value of the property.
		 * - get: If value is not provided this is used as a getter for the
		 *        property.
		 * - set: If value is not provided this is used as the setter for the
		 *        property.
		 * - depends: If present it is an array of properties that this computed
		 *            property depends on.
		 * 
		 * The second argument is options and specifies the parent class.  If
		 * not provided this defaults to Paragon.  Please note that this class
		 * **must** be a descendant of Paragon.
		 * 
		 * Returns a class.
		 */
		create: {
			value: function Paragon_create(spec, parent){
				spec   = spec   || {};
				parent = parent || Paragon;
				
				if (!(Object.create(parent.prototype) instanceof Paragon))
					throw new TypeError("Parent must inherit from Paragon");
				
				var emitters = {"":1};
				var props = {
					"constructor": {"value":ParagonModel},
				};
				
				for (var k in spec) {
					if (typeof spec[k] != "object") spec[k] = {value:spec[k]};
					props[k] = mkprop(k, spec[k]);
					emitters[k] = {};
				}
				
				for (var k in spec) {
					var d = spec[k].depends;
					if (Array.isArray(d)) {
						for (var i = d.length; i--; ) {
							emitters[d[i]][k] = 1;
						}
					}
				}
				
				function ParagonModel(){
					merge(magicemittersarg, emitters);
					parent.apply(this, arguments);
				}
				ParagonModel.prototype = Object.create(parent.prototype, props);
				
				return ParagonModel;
			},
		},
	});
	Object.preventExtensions(Paragon);
	Object.preventExtensions(Paragon.prototype);
	
	return Paragon;
});
