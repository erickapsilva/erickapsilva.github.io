var loaded = false;
var loaderAnim = document.getElementById('js-loader');
var cylinder1, theModel, renderer, scene, canvas, camera;


initThree();
animate();

function initThree() {

    //url for ring model
    const MODEL_PATH = "./turqoise.gltf";
    //const MODEL_PATH = "https://aragao-web.s3.sa-east-1.amazonaws.com/testRing_01.glb";
 
    // Init the scene
    scene = new THREE.Scene();
    canvas = document.querySelector('#c');

    // Init the renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    var cameraFar = 5;
    // Add a camera
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = cameraFar;
    camera.position.x = 0;




    // Init the object loader
    var loader = new THREE.GLTFLoader();
    loader.load(MODEL_PATH, function(gltf) {
        theModel = gltf.scene;
        theModel.traverse((o) => {
            if (o.isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
            }
        });

        // Set the models initial scale   
        //theModel.scale.set(4, 4, 4);
        theModel.scale.set(0.01, 0.01, 0.01);

        theModel.rotation.x = Math.PI * 2;
        // Offset the y position a bit
        theModel.position.y = -1000;

        // Set initial textures
        // for (let object of INITIAL_MAP) {
        //     initColor(theModel, object.childID, object.mtl);
        // }
        loaderAnim.remove();
        // Add the model to the scene
        scene.add(theModel);
    }, undefined, function(error) {
        console.error(error)
    });

    // Add lights

    var hdriloader = new THREE.RGBELoader();
    hdriloader
        .setPath('textures/equirectangular/')
        .load('royal_esplanade_1k.hdr', function(texture) {

            texture.mapping = THREE.EquirectangularReflectionMapping;

            //scene.background = texture;
            scene.environment = texture;

            animate();

        });


    // Add hemisphere light to scene   
    var hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.8);
    hemiLight.position.set(0, 1, 0);
    //scene.add(hemiLight);
    const hemihelper = new THREE.HemisphereLightHelper(hemiLight, 1);
    //scene.add(hemihelper);

    // Add directional Light (and helper) to scene   
    var dirLight = new THREE.DirectionalLight(0xffffff, 10);
    dirLight.position.set(0, 1, 0);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
    const helper = new THREE.DirectionalLightHelper(dirLight, 2);
    //scene.add(helper);
    scene.add(dirLight);

    //Add point light and (helper) to scene
    var pointLight = new THREE.PointLight(0xffffff, 7, 100);
    pointLight.position.set(2, 0, 1);
    scene.add(pointLight);
    const sphereSize = 1
    const pointLightHelper = new THREE.PointLightHelper(pointLight, sphereSize);
    //scene.add(pointLightHelper);


    //Add occlusion element for the ring finger
    let geometry1 = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 32);
    let material1 = new THREE.MeshLambertMaterial({ color: 0x58c76e, emissive: 0x2ef23b }); // 0xf2ce2e 
    cylinder1 = new THREE.Mesh(geometry1, material1);
    cylinder1.material.colorWrite = false;
    scene.add(cylinder1);

}

//Loop function to update the scene
function animate() {

    renderer.render(scene, camera);
    requestAnimationFrame(animate);

    if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }

    if (theModel != null && loaded == false) {
        //initialRotation();
        //DRAG_NOTICE.classList.add('start');
    }


}


function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    var width = window.innerWidth;
    var height = window.innerHeight;
    var canvasPixelWidth = canvas.width / window.devicePixelRatio;
    var canvasPixelHeight = canvas.height / window.devicePixelRatio;

    const needResize = canvasPixelWidth !== width || canvasPixelHeight !== height;
    if (needResize) {

        renderer.setSize(width, height, false);
    }
    return needResize;

}


///// MediaPipe hand tracking code
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);
    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            console.log("pos8 ", landmarks[14]);
            // landmarks.forEach((landmark, index) => {
            //     if (index != 14) {
            //         landmark.visibility = false;
            //     }
            // });
            //drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
            //drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });
            var pos_pixel_x = (landmarks[14].x * window.innerWidth);
            var pos_pixel_y = (landmarks[14].y * window.innerHeight);
            //console.log("position0 ", pos_pixel_x);
            get3dPos([pos_pixel_x, pos_pixel_y], landmarks[14].z);
            get3dRot([landmarks[13].x, landmarks[13].y, landmarks[15].x, landmarks[15].y]);
            scaleRing([landmarks[13].x, landmarks[13].y, landmarks[15].x, landmarks[15].y]);
            updateOcclusion();
        }
    }
    canvasCtx.restore();
}

const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.3.1632795355/${file}`;
        
    }
});
hands.setOptions({
    maxNumHands: 2,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
hands.onResults(onResults);

const camera2 = new Camera(videoElement, {
    onFrame: async() => {
        await hands.send({ image: videoElement });
    },
    width: 1280,
    height: 720
});
camera2.start();




//Get the 3d position of the object based on the tracking data
function get3dPos(coord, zvalue) {
    var vec = new THREE.Vector3(); // create once and reuse
    var pos = new THREE.Vector3(); // create once and reuse
    console.log("position0.5 ", coord);
    vec.set(
        2 * (coord[0] / window.innerWidth) - 1,
        1 - 2 * (coord[1] / window.innerHeight),
        0.5);
    console.log("vec1 ", vec);
    vec.unproject(camera);
    console.log("vec2 ", vec);
    vec.sub(camera.position).normalize();
    var distance = -camera.position.z / vec.z;
    console.log("distance ", distance);
    pos.copy(camera.position).add(vec.multiplyScalar(distance));
    console.log("position1 ", pos);
    positionObject(pos, zvalue);

}


//Update the position of the object to match the 3d pos
function positionObject(position, z) {
    //console.log("position2 ", position);
    var factor = 50;
    var pos = new THREE.Vector3().copy(theModel.position);
    var target = new THREE.Vector3(position.x, position.y - 0.2);
    theModel.position.copy(target);
}

//Update the rotation of the object to match the finger orientation - it calculates the angle between two points in the ring finger
function get3dRot(coords) {
    console.log("ccc", coords)
    var point1 = new THREE.Vector2();
    var point2 = new THREE.Vector2();
    point1.set(coords[0], coords[1]);
    point2.set(coords[2], coords[3]);
    var x_delta = point1.x - point2.x;
    var y_delta = point1.y - point2.y;
    console.log("x", x_delta)
    var angle = Math.asin((y_delta) / Math.sqrt(x_delta * x_delta + y_delta * y_delta));
    console.log("angle ", 90 - angle * (180 / Math.PI))
    theModel.rotation.y = -Math.PI / 2 + angle;
}

//Update the scale of the ring - it uses a custom function to approximate the size based on the pixel distance between two tracking points
function scaleRing(coords) {

    var point1 = new THREE.Vector2();
    var point2 = new THREE.Vector2();
    point1.set(coords[0], coords[1]);
    point2.set(coords[2], coords[3]);
    var x_delta = point1.x - point2.x;
    var y_delta = point1.y - point2.y;
    var distance = Math.sqrt(x_delta * x_delta + y_delta * y_delta);
    console.log("distance ", distance);
    //Exponential approximation
    //var factor = 3.8 * (1 + 2.3) ** distance;
    //Linear approximation
    var factor = 0.98 * distance + 0.01;
    var new_scale = new THREE.Vector3(factor, factor, factor);
    console.log("aaaa", theModel.scale.x);
    theModel.scale.copy(new_scale);
}

//Update the occlusion element to follow the finger
function updateOcclusion() {

    cylinder1.position.copy(theModel.position);
    cylinder1.position.z = -0.2;
    var offset_euler = new THREE.Euler(Math.PI / 2, 0, 0);
    var offset_quat = new THREE.Quaternion();
    cylinder1.quaternion.copy(theModel.quaternion);
    cylinder1.quaternion.multiply(offset_quat.setFromEuler(offset_euler));
    cylinder1.scale.copy(theModel.scale);
}