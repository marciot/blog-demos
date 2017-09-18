/*
 * There are a lot of THREE.js Earth rendering demos on the web,
 * but what sets this one apart is that is uses a GLSL shader to
 * show the Earth lit up at night using imagery from the Blue
 * Marble collection from NASA:
 *
 *    http://visibleearth.nasa.gov
 *
 */ 
const degreesToRadians = Math.PI / 180;
const axisTilt         = 23.5;
const earthRPM         = 0.5;
const cloudRPM         = 0.2;
const sunRPM           = 0.25;
const starsRPM         = 0.25;
const sunDistance      = 1e4;

function onLoad() {
    var clock  = new THREE.Clock();
    var canvas = document.getElementById("webgl");
        
    /* Setting alpha to allow the LensFlare to work */
    var renderer = new THREE.WebGLRenderer({alpha: true, canvas: canvas});
    canvas.width  = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    renderer.setViewport(0, 0, canvas.clientWidth, canvas.clientHeight);
    
    var camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 5, sunDistance*1.1);
    var scene = new THREE.Scene();
    
    var animationCallback = setupScene(scene, camera);
    
    function onWindowResize() {
        var canvas = document.getElementById('webgl');
        canvas.width  = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        renderer.setViewport(0, 0, canvas.clientWidth, canvas.clientHeight);
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
    }
    window.addEventListener('resize', onWindowResize, false);
    
    function animate() {
        var t = clock.getElapsedTime();
        animationCallback(t);
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    animate();
}

function setupScene(scene, camera) {
    var textureLoader = new THREE.TextureLoader();
    
    var sun = new THREE.PointLight( 0xffffff, 5 );
    scene.add(sun);
    
    var starsTexture = textureLoader.load('textures/stars512.jpg');
    var dayTexture   = textureLoader.load('textures/land_shallow_topo_2048.jpg');
    var nightTexture = textureLoader.load('textures/land_ocean_ice_lights_2048.jpg');
    var cloudTexture = textureLoader.load('textures/cloud_combined_2048.jpg');
    
    starsTexture.wrapS = THREE.RepeatWrapping;
    starsTexture.wrapT = THREE.RepeatWrapping;
    
    // Stretch star texture by PI along circumference so the
    // stars maintain their aspect ratio.
    
    starsTexture.repeat.set(4 * Math.PI, 4);
    cloudTexture.wrapS = THREE.RepeatWrapping;
    cloudTexture.wrapT = THREE.RepeatWrapping;
    
    var starsMaterial = new THREE.MeshBasicMaterial({
        map:         starsTexture,
        side:        THREE.BackSide
    });
    
    var earthMaterial = new THREE.ShaderMaterial( {
        vertexShader:   earthVertexShader,
        fragmentShader: earthFragmentShader,
        uniforms: {
            dayTexture:     {type:"t", value: dayTexture},
            nightTexture:   {type:"t", value: nightTexture},
            sunPosition:    {type:"v3", value: new THREE.Vector3()}
        }
    } );
    
    var cloudMaterial = new THREE.MeshPhongMaterial({
        transparent:    true,
        alphaMap:       cloudTexture,
        side:           THREE.DoubleSide,
        
        // Give clouds a slight glow at night, so they are visible
        emissive:       new THREE.Color(0x181818), 
        
        // Specular reflection causes an orange glow on the clouds
        // at dawn on the transition from dark to light.
        shininess:      5,
        specular:       new THREE.Color(0xFF8800)
    });
    
    var stars = new THREE.Mesh(new THREE.SphereGeometry(sunDistance*1.1), starsMaterial);
    scene.add(stars);
    
    var earth = new THREE.Object3D();
    scene.add(earth);
    
    camera.position.z = 20;
    
    var geometry = new THREE.SphereGeometry( 7, 40, 40 );
    var surface = new THREE.Mesh(geometry, earthMaterial);
    earth.add(surface);
    
    /* The cloud layer is rendered as a shell that is slightly larger
       than the Earth, using an additive blend to overlay the clouds
       on land. This also gives a nice halo effect when illuminated
       from behind */
    var clouds = new THREE.Mesh(geometry, cloudMaterial);
    clouds.scale.set(1.005, 1.005, 1.005);
    surface.add(clouds);
        
    // Give the globe the tilt
    earth.rotation.z = -axisTilt * degreesToRadians;
    
    // Add lens flare
    var textureFlare0 = textureLoader.load( "textures/lensflare/lensflare0.png" );
	var textureFlare1 = textureLoader.load( "textures/lensflare/lensflare1.png" );
    
    var flareColor = new THREE.Color( 0xffffff );
    var lensFlare = new THREE.LensFlare( textureFlare0, 200, 0.0, THREE.AdditiveBlending, flareColor );

    lensFlare.add( textureFlare1, 60, 0.6,   THREE.AdditiveBlending );
    lensFlare.add( textureFlare1, 70, 0.7,   THREE.AdditiveBlending );
    lensFlare.add( textureFlare1, 120, 0.9,  THREE.AdditiveBlending );
    lensFlare.add( textureFlare1, 70, 1.0,   THREE.AdditiveBlending );
    scene.add( lensFlare );
    
    function animationCallback(t) {
        const toRadsPerSec = Math.PI * 2 * 1/60;
        stars.rotation.y   = -starsRPM * toRadsPerSec * t;
        surface.rotation.y = -earthRPM * toRadsPerSec * t;
        clouds.rotation.y  = -cloudRPM * toRadsPerSec * t;
        sun.position.x     =  Math.sin(sunRPM * toRadsPerSec * t) * sunDistance;
        sun.position.y     = -Math.cos(sunRPM * toRadsPerSec * t) * sunDistance/10;
        sun.position.z     = -Math.cos(sunRPM * toRadsPerSec * t) * sunDistance;
        earthMaterial.uniforms.sunPosition.value.copy( sun.position );
        lensFlare.position.copy( sun.position );
    }
    return animationCallback;
}

var earthVertexShader = `
    varying vec2 vUV;
    varying vec3 vPos;
    varying vec3 vNormal;
    varying vec3 vSunPosition;

    uniform vec3 sunPosition;

    void main() {
      vUV          = uv;
      vSunPosition = (viewMatrix      * vec4(sunPosition, 1.0)).xyz;
      vPos         = (modelViewMatrix * vec4(position,    1.0)).xyz;
      vNormal      = normalMatrix * normal;
      gl_Position  = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
`;

var earthFragmentShader = `
    varying vec2      vUV;
    varying vec3      vPos;
    varying vec3      vNormal;
    varying vec3      vSunPosition;

    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;

    void main() {
        vec3  lightDirection = normalize(vPos - vSunPosition);
        float Idiff = clamp(dot(-lightDirection, vNormal), 0.0, 1.0);
        
        // Use a diffuse shading model, but the value is used
        // to blend colors from the day and night textures.

        vec4 dayColor   = texture2D(dayTexture,   vUV);
        vec4 nightColor = texture2D(nightTexture, vUV);
        gl_FragColor = mix(nightColor, dayColor, Idiff);
    }
`;