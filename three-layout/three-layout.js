/* This THREE.js demo was adapted from:
 *
 *   http://solutiondesign.com/blog/-/blogs/webgl-and-three-js-texture-mappi-1/
 *
 */
var camera;
var scene;
var renderer;
var mesh;
var motionEnabled = true;
  
function init() {
  
	/* A tutorial on how to properly handling sizing for a THREE.js
	 * that renders INSIDE a canvas element (rather than the window)
	 * is here:
	 *
	 *    http://www.rioki.org/2015/04/19/threejs-resize-and-canvas.html
	 *
	 */
	 
	var canvas = document.getElementById("webgl");
	camera = new THREE.PerspectiveCamera( 70, canvas.clientWidth / canvas.clientHeight, 1, 1000);
  
	scene  = new THREE.Scene();
	var light = new THREE.AmbientLight( 0x555555 );
	scene.add(light);
	
	var light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 0, 1, 1 ).normalize();
	scene.add(light);
  
	var geometry = new THREE.CubeGeometry(10, 10, 10);
	var material = new THREE.MeshLambertMaterial( { color: 0x9999ff } );
  
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.z = -20;
	scene.add( mesh );
  
	/* Setting alpha to true allows the canvas to be styled with CSS */
	renderer = new THREE.WebGLRenderer({alpha: true, canvas: canvas});
	canvas.width  = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	renderer.setViewport(0, 0, canvas.clientWidth, canvas.clientHeight);
	
	window.addEventListener( 'resize', onWindowResize, false );
}

function animate() {
	if(motionEnabled) {
		mesh.rotation.x += .040;
		mesh.rotation.y += .025;
  
		render();
	}
	requestAnimationFrame( animate );
}
  
function render() {
	renderer.render( scene, camera );
}

function toggleRotation() {
	motionEnabled = !motionEnabled;
}

function onLoad() {
	init();
	animate();
}

function onWindowResize() {
	/* The resizing code here also comes from rioki */
	var canvas = document.getElementById('webgl');
	canvas.width  = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	renderer.setViewport(0, 0, canvas.clientWidth, canvas.clientHeight);
	camera.aspect = canvas.clientWidth / canvas.clientHeight;
	camera.updateProjectionMatrix();
	render();
}