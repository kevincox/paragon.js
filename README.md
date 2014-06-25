# Paragon

[![Build Status](https://travis-ci.org/kevincox/paragon.js.svg?branch=master)](https://travis-ci.org/kevincox/paragon.js)

Paragon is a simple model class.  It is designed to be elegant and simple.  You
could almost say it is perfect.

Does the following make you sick?

```js
	obj.attr("foo", "bar"); // Set foo to bar.
	obj.attr("foo");        // Get foo.
```

Don't you wish you could write it in plain js?

```js
	obj.foo = "bar";
	obj.foo;
```

That is Paragon's API.  Now for a more complete example.

```js
	// Note: never actually handle names like this.
	var Person = Paragon.create({
		first: {value: "John"},
		last:  {value: "Smith"},
		full: {
			depends: ["first", "last"],
			get: function(){
				return this.first+" "+this.last;
			},
			set: function(val){
				var s = val.split();
				this.first = s[0];
				this.last  = s[1];
			},
		},
	});
	
	// Instantiate.
	var me = new Person;
	
	// Subscribe.
	me.changed.add(function(){ console.log("Person Changed!") });
	me.lastchanged.add(function(last){
		console.log("Last name has changed to "+last);
	});
	
	me.first = "Kevin";
	//=> Person Changed!
	
	console.log(me.full); //=> "Kevin Smith"
	
	me.full = "Joe Schmoe";
	//=> Last name has changed to Schmoe
	//=> Person changed.
```

## API

### Paragon.create(props, parent)

Creates a new Paragon subclass using props.  If parent is provided it will be
used as the parent but it must inherit (directly or indirectly) from Paragon.
If you inherit from a Paragon model you must call it's constructor.  It does not
require any arguments but if any are provided those arguments will be passed up
through constructor chain.

The props object is an object with properties to be available in the class.
Each value can have the following properties.

- value: If provided used as the initial value for the property.
- get: If value is not provided get is used as the getter.  It is called with
       no arguments with `this` set to the instance.  It must return the
       property value.
- set: If value is not provided set is used as the setter.  It is called with
       one argument with `this` set to the instance.
- depends: An array of values that this computed property uses.  If any of these
       properties are modified this property will be considered modified as
       well (and an event will be triggered).

### Paragon Models

The models will have the properties specified during creation.  In addition to
these properties a `{prop}changed` property will be created for each.  This is a
[js-signals](https://millermedeiros.github.io/js-signals/) event emitter.  It
will be called whenever its respective property changes.

Additionally there will be `changed` event emitter which will be called whenever
any property on the model is changed.

### Events

The callbacks will be called with the following arguments.

```js
function callback(newval, prop, oldval, model) {/* ... */}
```

- newval: The new value of the property.
- prop: The name of the property.
- oldval: The previous value of the property.
- model: The model instance that was changed.

Note that `model[prop] === newval`.

For most events `prop` will be the name of the property listening to.  The
exception is when listening to all properties (via the `changed` emitter) in
which case `prop` will be the name of the changed property.

## Tests

Paragon has a test suite.  Tests are run on every push.  If you are submitting
patches you will need to submit tests that fail before your patch is applied and
pass afterwards (AKA your patch makes the tests pass).  Don't worry about it
when making a pull request but just understand that you will need to add them
before it is accepted.

To run the test locally run `mocha` inside the root of the repo.  You can
also run them in a browser by opening `test/test.html`.

## Hosted Script

To help increase the odds of caching I am recommending the following URLs for
the script they are all hosted on CDNs for quick close access.  If you are not
combining Paragon into your scripts it is highly recommended that you use the
links below.  The links are HTTPS but HTTP is also available.

- [paragon-1.1.0.js](https://kevincox-cdn.appspot.com/Paragon-1.1.0.min)
- [paragon-1.0.1.js](https://kevincox-cdn.appspot.com/Paragon-1.0.1.min)

## Questions?

Feel free to contact me at [kevincox@kevincox.ca](mailto:kevincox@kevincox.ca).
