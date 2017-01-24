/***
 * to(elem, dur, propObj, keyframe)
 * @param elem:DOMObject	- (Required) Reference to DOM Object
 * @param dur:Number		- (Required) Animation duration in seconds
 * @param propObj:Object 	- (Required) Object with CSS properties and values
 *		  @delay:Number		- Delay the start of this animation, value in seconds.
 *		  @repeat:Boolean		- Repeated animation "yoyos" rather than repeats
 *		  @ease:String		- Set easing:
 *							  - Linear, Quad, Cubic, Quart, Quint, Expo, Back
 *							  - .easeIn, .easeOut, .easeInOut
 * @param keyframe:String	- Play animation at keyframe set with "add();"
 * @return Cues animation to specified properties
 *
 * set(elem, propObj)
 * @param elem:DOMObject	- (Required) Reference to DOM Object
 * @param propObj:Object	- (Required) Object with CSS properties and values
 * @return Sets CSS properties without animation
 *
 * add(keyframe)
 * @param keyframes:String 	- (Required) Set a keyframe as a reference for animations to play from
 * @return Drops in a "keyframe" in the timeline that can be referenced in to() method
 *
 * delay(num)
 * @param num:Number 		- (Required) Number in seconds to specify animation delay
 * @return Manual delay between animations
 *
 * setEase(ease)
 * @param ease:String		- Set default easing
 * 
 * killTimers()				- Stops all animation timers, making it possible to
 * 							  start animations from the beginning again
 *
 * Notes:
 *	- To simulate from(), use set(), followed by delay(0.05) to allow elements to move into place.
 ***/

/*
 * Constructor
 */
function Bannermator() {
	this.timeline = 0;
	this.defaultEase = "ease";

	this.animSequence = [];
	this.curAnimSeq = 0;
	this.timeouts = [];

	this.repeatSequence = [];
	this.curRepeatSeq = 0;

	this.objArray = [];
	this.keyframes = {};

	this.eventListener;
}



/*
 * Main Methods
 */
Bannermator.prototype.to = function(elem, dur, propObj, keyframe) {

	var delay = 0,
		easing = this.defaultEase,
		prop,

		obj = {},
		objRef = {},
		animObj = {},
		seqObj = {},

		repeatCount = 0;

	/*
	 * Init
	 */
	// Does this elem have an AnimationObject yet?
	if (!this.dupeCheck(elem)) {
		obj = new AnimationObject();
		obj.elem = elem;
		obj.width = elem.offsetWidth;
		obj.height = elem.offsetHeight;
		this.objArray.push(obj);
	}

	// This is the AnimationObject to use
	objRef = this.dupeCheck(elem);
	animObj = this.objArray[objRef];



	/*
	 * Gathering properties
	 */
	// Keyframe?
	if (keyframe) delay -= this.timeline - this.keyframes[keyframe];

	// Set Scale
	if (propObj.scale) {
		propObj.scaleX = propObj.scaleY = propObj.scale;
		delete propObj.scale;
	}

	// Easing?
	if (propObj.ease) easing = this.applyEase(propObj.ease);
	else { easing = this.applyEase(easing); }

	// Delay?
	if (propObj.delay) delay += propObj.delay * 1000;

	// Repeat?
	if (propObj.repeat) repeatSrcObj = this.cloneObj(animObj);
	
	// Set updated properties (this only sets css)
	for (prop in propObj) {
		if (prop != "delay" && prop != "ease") {
			animObj[prop] = propObj[prop];
		}
	}

	// Reset offset
	// animObj.offsetX = 0;
	// animObj.offsetY = 0;



	// Prep object for sequence
	animObj.timestamp = this.timeline;
	animObj.duration = dur * 1000;
	animObj.delay = delay;
	animObj.easing = easing;



	// Add to animation sequence
	seqObj = this.cloneObj(animObj);
	this.animSequence.push(seqObj);
	this.timeline += (dur * 1000) + delay;



	/*
	 * Repeat?
	 */
	repeatCount = propObj.repeat;
	if (repeatCount > 0) {

		// Add objects to repeatSequence array
		this.repeatSequence.push({
			"start"	: repeatSrcObj,
			"end"	: seqObj,
			"cycles": repeatCount
		});

		this.timeline += (dur * repeatCount) * 1000;
	}

	return this;
}

Bannermator.prototype.set = function(elem, propObj) {
	var prop,
		obj = {},
		objRef = {},
		animObj = {};

	// Does this elem have an AnimationObject yet?
	if (!this.dupeCheck(elem)) {
		obj = new AnimationObject();
		obj.elem = elem;
		obj.width = elem.offsetWidth;
		obj.height = elem.offsetHeight;
		this.objArray.push(obj);
	}

	// This is the AnimationObject to use
	objRef = this.dupeCheck(elem);
	animObj = this.objArray[objRef];

	// Set Scale
	if (propObj.scale) {
		propObj.scaleX = propObj.scaleY = propObj.scale;
		delete propObj.scale;
	}

	// Set updated properties
	for (prop in propObj) {
		if (prop === "x") {
			// animObj.offsetX = propObj[prop];
			animObj[prop] = propObj[prop];
		} else if (prop === "y") {
			// animObj.offsetY = propObj[prop];
			animObj[prop] = propObj[prop];
		}
		else animObj[prop] = propObj[prop];
	}

	// Prep object for sequence
	animObj.timestamp = this.timeline;
	animObj.duration = 0;
	animObj.delay = 0;

	// Add to animation sequence
	seqObj = this.cloneObj(animObj);

	this.animSequence.push(seqObj);

	// Reset timeline because timeout is sequential when "set" is used
	this.timeline = 0;

	return this;
}

Bannermator.prototype.add = function(kf) {
	this.keyframes[kf] = this.timeline;
	return this;
}

Bannermator.prototype.delay = function(num) {
	this.timeline += num * 1000;
	return this;
}

Bannermator.prototype.endAnim = function() {
	this.drawIt(this.curAnimSeq);
	// console.log(this.animSequence);
}

Bannermator.prototype.setEase = function(ease) {
	this.defaultEase = ease;
}



/*
 * Utility Methods
 */
Bannermator.prototype.drawIt = function(sequenceID) {
	if (sequenceID < this.animSequence.length) {
		var _this = this,

			animObj = this.animSequence[sequenceID],
			dur = animObj.duration / 1000,
			delay = animObj.delay,
			repeat = animObj.repeat,
			timestamp = animObj.timestamp,
			easing = animObj.easing;


		// Sequential timeout if "set" method is used
		if (dur == 0) {
			_this.timeouts.push(setTimeout(function() {
				_this.setTransforms(animObj, dur, easing);

				// Progress to next sequence
				_this.curAnimSeq++;
				_this.drawIt(_this.curAnimSeq);

			}, timestamp + delay));



		// Drop in timeouts based on timestamp
		} else {
			if (repeat) {

				_this.timeouts.push(setTimeout(function() {
					var repeatStart = _this.repeatSequence[_this.curRepeatSeq].start,
						repeatEnd = _this.repeatSequence[_this.curRepeatSeq].end,
						repeatDur = repeatEnd.duration / 1000,
						repeatEasing = repeatEnd.easing;

					var i = 0,
						cycle = true;

					for (; i < repeat; i++) {
						if (cycle) {
							_this.timeouts.push(setTimeout(function() {
								_this.setTransforms(repeatStart, repeatDur, repeatEasing);
							}, (repeatDur*1000) * (i+1)));
							cycle = false;



						} else {
							_this.timeouts.push(setTimeout(function() {
								_this.setTransforms(repeatEnd, repeatDur, repeatEasing);
							}, (repeatDur*1000) * (i+1)));
							cycle = true;
						}
					}

					_this.curRepeatSeq++;
				}, timestamp + delay));
			}

			_this.timeouts.push(setTimeout(function() {
				_this.setTransforms(animObj, dur, easing);
			}, timestamp + delay));
			// console.log(delay);

			// Progress to next sequence
			this.curAnimSeq++;
			this.drawIt(_this.curAnimSeq);
		}
	}
}

Bannermator.prototype.setTransforms = function(animObj, dur, easing, setFunc) {

	var elem = animObj.elem;

	// Set transforms
	transforms = "translate3d(" + animObj.x + "px, " + animObj.y + "px, " + animObj.z + "px) rotateX(" + animObj.rotateX + "deg) rotateY(" + animObj.rotateY + "deg) rotateZ(" + animObj.rotateZ + "deg) scale3d(" + animObj.scaleX + ", " + animObj.scaleY + ", 1) skewX(" + animObj.skewX + "deg) skewY(" + animObj.skewY + "deg)";
	// transforms = "translate3d(" + (animObj.x + animObj.offsetX) + "px, " + (animObj.y + animObj.offsetY) + "px, " + animObj.z + "px) rotateX(" + animObj.rotateX + "deg) rotateY(" + animObj.rotateY + "deg) rotateZ(" + animObj.rotateZ + "deg) scale3d(" + animObj.scaleX + ", " + animObj.scaleY + ", 1) skewX(" + animObj.skewX + "deg) skewY(" + animObj.skewY + "deg)";

	// Apply changes
	elem.style.opacity = animObj.opacity;

	if (animObj.width) elem.style.width = animObj.width + "px";
	if (animObj.height) elem.style.height = animObj.height + "px";

	elem.style.transition = dur + "s all " + easing;
	elem.style.OTransition = dur + "s all " + easing;
	elem.style.msTransition = dur + "s all " + easing;
	elem.style.MozTransition = dur + "s all " + easing;
	elem.style.WebkitTransition = dur + "s all " + easing;

	// elem.style.WebkitTransition = dur + "s all " + easing;
	// elem.style.MozTransition = dur + "s all " + easing;
	// elem.style.msTransition = dur + "s all " + easing;
	// elem.style.OTransition = dur + "s all " + easing;
	// elem.style.transition = dur + "s all " + easing;

	elem.style.transform = transforms;
	elem.style.OTransform = transforms;
	elem.style.msTransform = transforms;
	elem.style.MozTransform = transforms;
	elem.style.WebkitTransform = transforms;

	// console.log(animObj.opacity + " " + transforms);
	// console.log(animObj);

	/*// Set up listener
	var transitionEvent = this.whichTransitionEvent();
	elem.addEventListener(transitionEvent, setFunc);*/
}

Bannermator.prototype.cloneObj = function(obj) {
	var newObj = {};
	for (prop in obj) {
		newObj[prop] = obj[prop]
	}
	return newObj;
}

Bannermator.prototype.applyEase = function(ease) {
	if (ease === "default") 				{ return "ease"; }

	else if (ease === "Linear") 			{ return "linear"; }
	else if (ease === "Linear.easeIn") 		{ return "ease-in"; }
	else if (ease === "Linear.easeOut") 	{ return "ease-out"; }
	else if (ease === "Linear.easeInOut") 	{ return "ease-in-out"; }

	else if (ease === "Quad.easeIn") 		{ return "cubic-bezier(0.550, 0.085, 0.680, 0.530)"; }
	else if (ease === "Quad.easeOut") 		{ return "cubic-bezier(0.250, 0.460, 0.450, 0.940)"; }
	else if (ease === "Quad.easeInOut") 	{ return "cubic-bezier(0.455, 0.030, 0.515, 0.955)"; }

	else if (ease === "Cubic.easeIn") 		{ return "cubic-bezier(0.550, 0.055, 0.675, 0.190)"; }
	else if (ease === "Cubic.easeOut") 		{ return "cubic-bezier(0.215, 0.610, 0.355, 1.000)"; }
	else if (ease === "Cubic.easeInOut") 	{ return "cubic-bezier(0.645, 0.045, 0.355, 1.000)"; }

	else if (ease === "Quart.easeIn") 		{ return "cubic-bezier(0.895, 0.030, 0.685, 0.220)"; }
	else if (ease === "Quart.easeOut") 		{ return "cubic-bezier(0.165, 0.840, 0.440, 1.000)"; }
	else if (ease === "Quart.easeInOut") 	{ return "cubic-bezier(0.770, 0.000, 0.175, 1.000)"; }

	else if (ease === "Quint.easeIn") 		{ return "cubic-bezier(0.755, 0.050, 0.855, 0.060)"; }
	else if (ease === "Quint.easeOut") 		{ return "cubic-bezier(0.230, 1.000, 0.320, 1.000)"; }
	else if (ease === "Quint.easeInOut") 	{ return "cubic-bezier(0.860, 0.000, 0.070, 1.000)"; }

	else if (ease === "Expo.easeIn") 		{ return "cubic-bezier(0.950, 0.050, 0.795, 0.035)"; }
	else if (ease === "Expo.easeOut") 		{ return "cubic-bezier(0.190, 1.000, 0.220, 1.000)"; }
	else if (ease === "Expo.easeInOut") 	{ return "cubic-bezier(1.000, 0.000, 0.000, 1.000)"; }

	else if (ease === "Back.easeIn") 		{ return "cubic-bezier(0.600, -0.280, 0.735, 0.045)"; }
	else if (ease === "Back.easeOut") 		{ return "cubic-bezier(0.175, 0.885, 0.320, 1.275)"; }
	else if (ease === "Back.easeInOut") 	{ return "cubic-bezier(0.680, -0.550, 0.265, 1.550)"; }
}

Bannermator.prototype.dupeCheck = function(elem) {
	var objCount = this.objArray.length,
		i = 0;

	if (objCount > 0) {
		for (; i < objCount; i++) {
			if (elem === this.objArray[i].elem) return i;
		}
	} else {
		return false;
	}
}

Bannermator.prototype.killTimers = function() {
	var i = 0;
	for (; i < this.timeouts.length; i++) {
		window.clearTimeout(this.timeouts[i]);
	}
}



/*
 * Animation Object
 */
function AnimationObject() {
	this.elem = "";
	this.timestamp = 0;
	this.duration = 0;
	this.delay = 0;

	this.x = 0;
	this.y = 0;
	this.z = 0;

	this.rotateX = 0;
	this.rotateY = 0;
	this.rotateZ = 0;

	this.scaleX = 1;
	this.scaleY = 1;
	this.scale = 1;
	
	this.skewX = 0;
	this.skewY = 0;

	this.width = 0;
	this.height = 0;
	this.opacity = 1;

	this.easing = "ease";

	// this.offsetX = 0;
	// this.offsetY = 0;
}

// AnimationObject.prototype.repeats = function(startObj, endObj) {
// 	this.startPos = startObj;
// 	this.endPos = endObj;
// }