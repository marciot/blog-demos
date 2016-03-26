/* This THREE.js demo was adapted from:
 *
 *   http://solutiondesign.com/blog/-/blogs/webgl-and-three-js-texture-mappi-1/
 *
 * The idea for rendering to SVG came from:
 *
 *   http://blog.felixbreuer.net/2014/08/05/using-threejs-to-create-vector-graphics-from-3d-visualizations.html
 */
var camera;
var scene;
var renderer;
var mesh;
  
init();
animate();
  
function init() {
  
  	/* A tutorial on how to properly handling sizing for a THREE.js
  	 * that renders INSIDE a canvas element (rather than the window)
  	 * is here:
  	 *
  	 *    http://www.rioki.org/2015/04/19/threejs-resize-and-canvas.html
  	 *
  	 */
  	 
  	var canvas = document.getElementById("webgl");
	
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 70, canvas.clientWidth / canvas.clientHeight, 1, 1000);
  
    var light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 0, 1, 1 ).normalize();
    scene.add(light);
  
    var geometry = new THREE.CubeGeometry( 10, 10, 10);
    var material = new THREE.MeshLambertMaterial( { color: 0x9999ff } );
  
    mesh = new THREE.Mesh(geometry, material );
    mesh.position.z = -20;
    scene.add( mesh );
  
	/* Setting alpha to true makes the background transparent */
    renderer = new THREE.WebGLRenderer({alpha: true, canvas: canvas});
    canvas.width  = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	renderer.setViewport(0, 0, canvas.clientWidth, canvas.clientHeight);
  
    window.addEventListener( 'resize', onWindowResize, false );
    
    var button = document.getElementById("convert");
    button.addEventListener( 'click',  svgSnapshot,    false );
  
    render();
	svgSnapshot();
}
  
function animate() {
    mesh.rotation.x += .04;
    mesh.rotation.y += .02;
  
    render();
    requestAnimationFrame( animate );
}
  
function render() {
    renderer.render( scene, camera );
}
  
function onWindowResize() {
	/* The resizing code here also comes from rioki */
	var canvas = document.getElementById("webgl");
	canvas.width  = canvas.clientWidth;
  	canvas.height = canvas.clientHeight;
  	renderer.setViewport(0, 0, canvas.clientWidth, canvas.clientHeight);
  	camera.aspect = canvas.clientWidth / canvas.clientHeight;
  	camera.updateProjectionMatrix();
    render();
}

/* The following discussion on StackOverflow shows discusses how to remove all
 * elements from a DOM
 *
 *  http://stackoverflow.com/questions/3955229/remove-all-child-elements-of-a-dom-node-in-javascript
 */
		
function removeChildrenFromNode(node) {
	var fc = node.firstChild;

	while( fc ) {
		node.removeChild( fc );
		fc = node.firstChild;
	}
}

function svgSnapshot() {
	var svgContainer = document.getElementById("svg");
	removeChildrenFromNode(svgContainer);
	var width  = svgContainer.getBoundingClientRect().width;
	var height = svgContainer.getBoundingClientRect().height;
	
	svgRenderer = new THREE.SVGRenderer();
	svgRenderer.setClearColor( 0xffffff );
	svgRenderer.setSize(width,height );
	svgRenderer.setQuality( 'high' );
	svgContainer.appendChild( svgRenderer.domElement );
	svgRenderer.render( scene, camera );
	
	/* The following discussion shows how to scale an SVG to fit its contained
	 *
	 *  http://stackoverflow.com/questions/4737243/fit-svg-to-the-size-of-object-container
	 *
	 * Another useful primer is here
	 *  https://sarasoueidan.com/blog/svg-coordinate-systems/
	 */
	svgRenderer.domElement.removeAttribute("width");
	svgRenderer.domElement.removeAttribute("height");
	
	document.getElementById("source").value = svgContainer.innerHTML.replace(/<path/g,"\n<path");
}