'use client'
import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js'
import { Axios } from 'axios';
import {
    GUI
} from 'three/addons/libs/lil-gui.module.min.js';
import {
    useEffect,
    useState,
    useRef
} from 'react';
import {
    OrbitControls
} from 'three/addons/controls/OrbitControls.js';
import {
    TransformControls
} from 'three/addons/controls/TransformControls.js';

const randomFloat = (from, till) => {
    return Math.random() * (till - from) + from
}

const scalingFactor = 50

function generateDot() {
    let x0 = randomFloat(-14, 14) * scalingFactor
    let y0 = randomFloat(-14, 14) * scalingFactor
    let z0 = randomFloat(-14, 14) * scalingFactor
    let sphere = new THREE.SphereGeometry(
        12,
        20,
        20
    )

    const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00
    });
        
    let sphereMesh = new THREE.Mesh(sphere, material);
    sphereMesh.position.set(x0, y0, z0)

    return ({
        "timesTemp": new Date(),
        "sticking_time": Math.floor(randomFloat(9, 4521)) * scalingFactor,
        "x0": x0,
        "y0": y0,
        "z0": z0,
        "temperature": randomFloat(264, 344) * scalingFactor,
        "x1": randomFloat(-14, 14) * scalingFactor,
        "y1": randomFloat(-13, 0) * scalingFactor,
        "z1": randomFloat(-14, 14) * scalingFactor,
        "sphere": sphere,
        "sphereMesh": sphereMesh
    })
}

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

export default function CubeCopy () {

    const sceneRef = useRef(null);
    const dotsSecondVariant = []
    const axios = require('axios').default

    useEffect(() => {
        const newDots = [];
        let container;
        let camera, scene, renderer;
        let countDots = 1;

        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        const onUpPosition = new THREE.Vector2();
        const onDownPosition = new THREE.Vector2();

        const geometry = new THREE.BoxGeometry(20, 20, 20);
        let transformControl;

        const ARC_SEGMENTS = 200;
        const splines = {};

        const params = {
            countDots: 1,
            arRought: false,
            arSmooth: false,
            heRought: false,
            heSmooth: false,
            stickingTime: 1000,
        };

        const paramsOneDot = {
            arRought: false,
            arSmooth: false,
            heRought: false,
            heSmooth: false,
            stickingTime: 1000,
            temperature: 30,
            play: false,

        };

        init();

        async function init() {
            try{
                container = sceneRef.current;
                scene = new THREE.Scene();
                scene.background = new THREE.Color(0xf0f0f0);
                camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
                camera.position.set(0, 250, 1000);
                scene.add(camera);

                scene.add(new THREE.AmbientLight(0xf0f0f0, 3));
                const light = new THREE.SpotLight(0xffffff, 4.5);
                light.position.set(0, 1500, 200);
                light.angle = Math.PI * 0.2;
                light.decay = 0;
                light.castShadow = true;
                light.shadow.camera.near = 200;
                light.shadow.camera.far = 2000;
                light.shadow.bias = -0.000222;
                light.shadow.mapSize.width = 1024;
                light.shadow.mapSize.height = 1024;
                scene.add(light);

                const planeGeometry = new THREE.PlaneGeometry(2800, 14);
                planeGeometry.rotateX(-Math.PI / 2);
                const planeMaterial = new THREE.ShadowMaterial({
                    color: 0x000000,
                    opacity: 0.2
                });

                const plane = new THREE.Mesh(planeGeometry, planeMaterial);
                plane.position.y = -14 * scalingFactor;
                plane.receiveShadow = true;
                scene.add(plane);

                const planeGeometryTop = new THREE.PlaneGeometry(2800, 14);
                const planeTop = new THREE.Mesh(planeGeometryTop, planeMaterial);
                planeTop.position.y = 14 * scalingFactor;
                planeTop.receiveShadow = true;
                scene.add(planeTop);

                // const helper = new THREE.GridHelper(2000, 100);
                // helper.position.y = -14 * scalingFactor;
                // helper.material.opacity = 0.25;
                // helper.material.transparent = true;
                // scene.add(helper);

                // const helperTop = new THREE.GridHelper(2000, 100);
                // helperTop.position.y = 14 * scalingFactor;
                // helperTop.material.opacity = 0.25;
                // helperTop.material.transparent = true;
                // scene.add(helperTop);

                renderer = new THREE.WebGLRenderer({
                    antialias: true
                });
                renderer.setPixelRatio(window.devicePixelRatio);
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.shadowMap.enabled = true;
                container.appendChild(renderer.domElement);

                const gui = new GUI();
                gui.domElement.style.position = 'absolut'
                gui.domElement.style.right = '0'
                gui.domElement.style.top = '0'

                gui.add( params, 'countDots', 1, 10 ).step( 1 ).onChange( function ( value ) {

					countDots = value;
					initDots(value);
					render();

				} );
                gui.add( params, 'countDots').onChange(render() )
                gui.add(params, 'arRought').onChange(render);
                gui.add(params, 'arSmooth').onChange(render);
                gui.add(params, 'heRought').onChange(render);
                gui.add(params, 'heSmooth').onChange(render);


                gui.open();

                const guiRenderOneDot = new GUI();

                guiRenderOneDot.domElement.style.position = 'absolute'
                guiRenderOneDot.domElement.style.top = '0'
                guiRenderOneDot.domElement.style.left = '0'

                guiRenderOneDot.add( paramsOneDot, 'stickingTime').onChange( render )
                guiRenderOneDot.add( paramsOneDot, 'temperature').onChange( render )
                guiRenderOneDot.add(paramsOneDot, 'arRought').onChange(render);
                guiRenderOneDot.add(paramsOneDot, 'arSmooth').onChange(function(value) {
                    paramsOneDot.arRought = false; // Set 'arRought' to false
                    paramsOneDot.heSmooth = false; // Set 'heSmooth' to false
                    render(); // Call the render function
                });
                
                guiRenderOneDot.add(paramsOneDot, 'heRought').onChange(render);
                guiRenderOneDot.add(paramsOneDot, 'heSmooth').onChange(render);
                guiRenderOneDot.add(paramsOneDot, 'play').onChange(render);

                // Controls
                const controls = new OrbitControls(camera, renderer.domElement);
                controls.damping = 0.2;
                controls.addEventListener('change', render);

                transformControl = new TransformControls(camera, renderer.domElement);
                transformControl.addEventListener('change', render);
                transformControl.addEventListener('dragging-changed', function(event) {

                    controls.enabled = !event.value;

                });
                scene.add(transformControl);

                transformControl.addEventListener('objectChange', function() {

                    updateSplineOutline();

                });

                document.addEventListener('pointerdown', onPointerDown);
                document.addEventListener('pointerup', onPointerUp);
                document.addEventListener('pointermove', onPointerMove);
                window.addEventListener('resize', onWindowResize);

                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ARC_SEGMENTS * 3), 3));

                initDots(1)
                function initDots (countDots){
                    // console.log(countDots)
                    newDots.length = 0

                    for (let i = 0; i < 100; i++) {
                        const newDot = generateDot();
                        newDots.push(newDot);
                    }
                }

                const atom_info_list = newDots.map(item => ({
                    x: item.x1,
                    y: item.y1,
                    z: item.z1,
                    temperature: item.temperature,
                    sticking_time: item.sticking_time
                }));
                const newAtom = {
                    atom_info_list:atom_info_list,
                    model: "model He rough"
                }
                const response = await axios.post('http://127.0.0.1:8080/api/v1/predictAtom', {
                    "atom_info_list": atom_info_list,
                    "model": "model He rough"
                })
                if (!response.status) {
                    throw new Error('Ошибка HTTP: ' + response.status);
                }
        
                const { predicted_atoms } = response.data;
                const time = 100
                const dataToResponse = newDots.map((item, index) => ({
                    x1: item.x1,
                    y1: item.y1,
                    z1: item.z1,
                    x0: item.x0,
                    y0: item.y0,
                    z0: item.z0,
                    temperature: item.temperature,
                    sticking_time: item.sticking_time,
                    sphereMesh: item.sphereMesh,
                    x2: predicted_atoms[index].x*scalingFactor,
                    y2: predicted_atoms[index].y*scalingFactor,
                    z2: predicted_atoms[index].z*scalingFactor,
                    flafPos1: false,
                    flafPos2: false,
                    speedX1: (item.x1-item.x0)/time,
                    speedX2: (predicted_atoms[index].x*scalingFactor-item.x1)/time,
                    speedY1: (item.y1-item.y0)/time,
                    speedY2: (predicted_atoms[index].y*scalingFactor-item.y1)/time,
                    speedZ1: (item.z1-item.z0)/time,
                    speedZ2: (predicted_atoms[index].z*scalingFactor-item.z1)/time,
                }));
                newDots.length = 0
                dataToResponse.forEach(dataToResponse => {
                    newDots.push(dataToResponse)
                })
                newDots.map((dot) => {
                    scene.add(dot.sphereMesh);
                })

            }
            catch(e){
                alert(e)
            }

        }

        animate();

        function animate() {

            requestAnimationFrame(animate);
            render();

        }

        function render() {
            for (let item of newDots) {
                sleep(1);      

                if (!item.flafPos1){
                    if (Math.abs(item.x1 - item.sphereMesh.position.x) <= Math.abs(item.speedX1)) {
                        item.sphereMesh.position.x = item.x1; 
                        item.flafPos1 = true
                        item.sphereMesh.material.color.set(0xFF0000)
                        // sleep(item.sticking_time/10000);      

                    }
                    else if (item.sphereMesh.position.x + item.speedX1 <= item.x1 || item.sphereMesh.position.x + item.speedX1 >= item.x1) {
                        item.sphereMesh.position.x += item.speedX1;
                    }
                    if (Math.abs(item.y1 - item.sphereMesh.position.y) <= Math.abs(item.speedY1)) {
                        item.sphereMesh.position.y = item.y1; 
                    }
                    else if (item.sphereMesh.position.y + item.speedY1 <= item.y1 || item.sphereMesh.position.y + item.speedY1 >= item.y1) {
                        item.sphereMesh.position.y += item.speedY1;
                    }
                    if (Math.abs(item.z1 - item.sphereMesh.position.z) <= Math.abs(item.speedZ1)) {
                        item.sphereMesh.position.z = item.z1; 
                    }
                    else if (item.sphereMesh.position.z + item.speedZ1 <= item.z1 || item.sphereMesh.position.z + item.speedZ1 >= item.z1) {
                        item.sphereMesh.position.z += item.speedZ1;
                    }
                }

                else if (!item.flafPos2){

                    if (Math.abs(item.x2 - item.sphereMesh.position.x) <= Math.abs(item.speedX2)) {
                        item.sphereMesh.position.x = item.x2;
                        item.flafPos2 = true
                        item.sphereMesh.material.color.set(0x000000)
                    }
                    else if (item.sphereMesh.position.x + item.speedX2 <= item.x2 || item.sphereMesh.position.x + item.speedX2 >= item.x2) {
                        item.sphereMesh.position.x += item.speedX2;
                    }

                    if (Math.abs(item.y2 - item.sphereMesh.position.y) <= Math.abs(item.speedY2)) item.sphereMesh.position.y = item.y2;
                    else if (item.sphereMesh.position.y + item.speedY2 <= item.y2 || item.sphereMesh.position.y + item.speedY2 >= item.y2) {
                        item.sphereMesh.position.y += item.speedY2;
                    }

                    if (Math.abs(item.z2 - item.sphereMesh.position.z) <= Math.abs(item.speedZ2)) item.sphereMesh.position.z = item.z2;
                    else if (item.sphereMesh.position.z + item.speedZ2 <= item.z2 || item.sphereMesh.position.z + item.speedZ2 >= item.z2) {
                        item.sphereMesh.position.z += item.speedZ2;
                    }
                }
            }

            renderer.render(scene, camera);

        }

        function onPointerDown(event) {

            onDownPosition.x = event.clientX;
            onDownPosition.y = event.clientY;

        }

        function onPointerUp(event) {

            onUpPosition.x = event.clientX;
            onUpPosition.y = event.clientY;

            if (onDownPosition.distanceTo(onUpPosition) === 0) {

                transformControl.detach();
                render();

            }

        }

        function onPointerMove(event) {

            pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
            pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(pointer, camera);

            // const intersects = raycaster.intersectObjects( splineHelperObjects, false );

            // if ( intersects.length > 0 ) {

            // 	const object = intersects[ 0 ].object;

            // 	if ( object !== transformControl.object ) {

            // 		transformControl.attach( object );

            // 	}

            // }

        }

        function onWindowResize() {

            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            renderer.setSize(window.innerWidth, window.innerHeight);

            render();

        }
    }, [])
    return < div ref = {
        sceneRef
    }
    />
}