var anim = new Bannermator();
var box1 = document.getElementById("box1");
var box2 = document.getElementById("box2");
var box3 = document.getElementById("box3");
var box4 = document.getElementById("box4");

anim.set(box1, {x:500, z:250})
	.set(box2, {x:200, y:200})
	.set(box3, {x:200, y:200})
	.set(box4, {x:200, y:200})




	.to(box1, 0.5, {x:100, y:50, z:-500, opacity:1, ease:"Expo.easeInOut"})
	.to(box1, 2, {scale:2, ease:"Expo.easeInOut"})
	.to(box1, 2, {scale:1, ease:"Expo.easeInOut"})

	.add("Test")

	.to(box2, 0.5, {x:0, y:100, opacity:1}, "Test")
	.to(box3, 0.5, {x:125, y:15, scaleX:0.5, opacity:1, delay:0.25}, "Test")


	.to(box1, 0.5, {y:500, ease:"Back.easeOut", delay:0.25, scale:2, repeat:4}, "Test")

	.delay(-2.5)
	.add("Test2")

	.to(box4, 0.5, {x:250, y:20, opacity:1, ease:"Expo.easeInOut"}, "Test2")
	.to(box2, 1, {x:300, y:150, z:0, rotateY:45, opacity:1, delay:0.25, ease:"Back.easeOut"}, "Test2")

	.endAnim();
