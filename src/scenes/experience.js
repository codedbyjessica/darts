import React, { useEffect, useRef, useState } from "react"
import { PerspectiveCamera } from "@react-three/drei";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useXR } from "@react-three/xr";
import { useControls } from "leva";
import * as THREE from "three";
import { degToRad } from "three/src/math/MathUtils";

const maxDartNumber = 6 
const boardZ = -8
const dartShootingZ = 5
const boardWidth = 44
const boardHeight = 24

const dartLength = 0.5

const defaultCameraPos = [0, 0, 12]

let isDragging = false
let dartNumber = 0
const dartsReleased = []
const dartsLanded = []

// gotta be here because of rerenders
const dartRefsArr = []
for (let i = 0; i <= maxDartNumber; i++) {
    dartRefsArr.push(React.createRef());
}

const DartsExperience = ({canvasRef, playerName, scores, setScores}) => {
    console.log('render')
    const dartBoard = useLoader(THREE.TextureLoader, '/images/dartboard.png')
    const dartsRoom = useLoader(THREE.TextureLoader, '/images/dartsroom.jpg')

	const cameraRef = useRef()
    const groupRef = useRef()
	const boardRef = useRef()
    const dartRef = useRef(dartRefsArr)

    const { scene } = useThree()
    
    const { isPresenting, player, controllers } = useXR()

    const [activeController, setActiveController] = useState(null)
    const [currentScore, setCurrentScore] = useState()

    const [velocity, setVelocity] = useState(new THREE.Vector3())
    
    const raycaster = new THREE.Raycaster();

    const params = {
        bendAngleDeg: { value: 0, min: 0, max: 90, step: 1 },
    };
    
    const { bendAngleDeg } = useControls(params);

    const resetDartNumber = () => {
        if (dartNumber + 1 > maxDartNumber - 1) {
            dartNumber = 0
            dartsReleased.splice(0, dartsReleased.length)
            dartsLanded.splice(0, dartsLanded.length)
        } else {
            dartNumber += 1
        }
    }

    const handleMouseDown = () => {
        isDragging = true
    };

    const handleMouseUp = () => {
        isDragging = false
        setVelocity(getNewVelocity(velocity))
        shootDart()
    };

    const handleMouseMove = (event, isTouch) => {
        // console.log("handleMouseMove", scene)
        if (dartRef.current[dartNumber].current) {
            if (isDragging) {
                const rect = canvasRef.current.getBoundingClientRect();

                // if using current obj, need to adjust because its not centered
                const objProblems = 0.675
                
                const mouse = {
                    x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
                    y: -((event.clientY - rect.top) / rect.height) * 2 + 1,
                };

                if (isTouch) {
                    mouse.x = (event.changedTouches[0].clientX / window.innerWidth) * 2 - 1 - objProblems;
                    mouse.y = -(event.changedTouches[0].clientY / window.innerHeight) * 2 + 1;
                }

                raycaster.setFromCamera(mouse, cameraRef.current);

                const intersects = raycaster.intersectObjects(scene.children);
                // console.log(intersects)
                if (intersects.length > 0) {
                    // todo here, need to see based on camera...
                    const boardOffset = 2
                    const position = intersects[0].point;
                    const minX = -boardWidth/2 + boardOffset
                    const maxX = boardWidth/2 - boardOffset
                    const minY = 0 + boardOffset
                    const maxY = boardHeight - boardOffset
                
                    const constrainedPosition = new THREE.Vector3(
                        position.x,
                        position.y,
                        // Math.min(Math.max(position.x, minX), maxX),
                        // Math.min(Math.max(position.y, minY), maxY),
                        dartShootingZ
                    );

                    dartRef.current[dartNumber].current.position.x = constrainedPosition.x
                    dartRef.current[dartNumber].current.position.y = constrainedPosition.y
                    dartRef.current[dartNumber].current.position.z = constrainedPosition.z
                }
            }
        }

    };

    const onSelectStart = controller => {
        setActiveController(controller)
    }
    
    const onSelectEnd = () => {
        setActiveController(null)
    }

    const buildController = data => {
        let geometry, material;
    
        switch ( data.targetRayMode ) {

            case 'tracked-pointer':
    
                geometry = new THREE.BufferGeometry();
                geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0, 0, 0, - 1 ], 3 ) );
                geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( [ 0.5, 0.5, 0.5, 0, 0, 0 ], 3 ) );
    
                material = new THREE.LineBasicMaterial( { vertexColors: true, blending: THREE.AdditiveBlending } );
    
                return new THREE.Line( geometry, material );
    
            case 'gaze':
    
                geometry = new THREE.RingGeometry( 0.02, 0.04, 32 ).translate( 0, 0, - 1 );
                material = new THREE.MeshBasicMaterial( { opacity: 0.5, transparent: true } );
                return new THREE.Mesh( geometry, material );
    
        }
    
    }

    const getNewVelocity = (velocity, activeController) => {
        const velocityMultiplier = 3;
        const newVelocity = velocity
        newVelocity.x = ( Math.random() - 0.5 ) * 2 * velocityMultiplier;
        newVelocity.y = ( Math.random() - 0.5 ) * 2 * velocityMultiplier;
        newVelocity.z = ( Math.random() - 9 ) * velocityMultiplier;
        if (activeController) {
            newVelocity.applyQuaternion( activeController.quaternion );
        }
        return newVelocity
    }

    const shootDart = () => {
        dartsReleased.push(dartNumber)
    }

    const setUpControllers = controller => {
        controller.addEventListener( 'selectstart', () => onSelectStart(controller));
        controller.addEventListener( 'selectend', () => onSelectEnd());
        controller.addEventListener( 'connected', event => {
            controller.add( buildController( event.data ) );
        } );
        controller.addEventListener( 'disconnected', () =>{
            controller.remove( controller.children[ 0 ] );
        } );
    }


    const setUpWebEvents = () => {
        canvasRef.current.addEventListener('mousedown', () => handleMouseDown());
        canvasRef.current.addEventListener('mouseup', () => handleMouseUp());
        canvasRef.current.addEventListener('mousemove', event => handleMouseMove(event));

        canvasRef.current.addEventListener('touchstart', () => handleMouseDown());
        canvasRef.current.addEventListener('touchend', () => handleMouseUp());
        canvasRef.current.addEventListener('touchmove', event => handleMouseMove(event, true));
    }

    const destroyWebEvents = () => {
        canvasRef.current.removeEventListener('mousedown', () => handleMouseDown());
        canvasRef.current.removeEventListener('mouseup', () => handleMouseUp());
        canvasRef.current.removeEventListener('mousemove', () => handleMouseMove());

        canvasRef.current.removeEventListener('touchstart', () => handleMouseDown());
        canvasRef.current.removeEventListener('touchend', () => handleMouseUp());
        canvasRef.current.removeEventListener('touchmove', () => handleMouseMove());
    }

    useEffect(() => {
        if (activeController) {
            console.log('activecontroller')
            dartRef.current[dartNumber].current.position.x = activeController.position.x
            dartRef.current[dartNumber].current.position.y = activeController.position.y
            dartRef.current[dartNumber].current.position.z = activeController.position.z

            setVelocity(getNewVelocity(velocity, activeController))
            shootDart()

        }
    }, [activeController])
    
	useEffect(() => {
        const controllersExist = controllers.length > 0 && controllers[0] && controllers[1] && controllers[0].controller && controllers[1].controller;
        if (controllersExist) {
            setUpControllers(controllers[0].controller)
            setUpControllers(controllers[1].controller)
        }
	}, [controllers]);

    useEffect(() => {
        if (canvasRef.current) {
            setUpWebEvents()
        }
        return () => {    
            if (canvasRef.current) {
                destroyWebEvents()
            }
        };
    }, [canvasRef.current])

    useEffect(() => {
        const newScores = scores
        newScores.push()
        newScores.sort((a, b) => a.distance - b.distance)
        console.log('current score updated', newScores)
        setScores(newScores)
    }, [currentScore])


    useFrame((_, delta) => {   
        const dartIsTriggered = dartRef.current[dartNumber].current && dartsReleased.includes(dartNumber) && !dartsLanded.includes(dartNumber)
        if (dartIsTriggered) {
            const dartIsFiring = dartRef.current[dartNumber].current.position.z >= (boardZ + dartLength)
            if (dartIsFiring) {
                cameraRef.current.position.y = dartRef.current[dartNumber].current.position.y
                cameraRef.current.position.z = dartRef.current[dartNumber].current.position.z + 2

                dartRef.current[dartNumber].current.position.z += velocity.z * delta

                // if has a bend, bend at half way
                if (bendAngleDeg !== 0 && dartRef.current[dartNumber].current.position.z <= - ((dartRef.current[dartNumber].current.position.z - boardZ)/2 + boardZ + dartLength)) {
                    const newX = Math.abs(velocity.z * Math.tan(degToRad(bendAngleDeg)) )
                    
                    dartRef.current[dartNumber].current.position.x += newX * delta
                    cameraRef.current.position.x = dartRef.current[dartNumber].current.position.x
                }

                if (isPresenting) {
                    dartRef.current[dartNumber].current.position.x += velocity.x * delta
                    dartRef.current[dartNumber].current.position.y += velocity.y * delta
                }
                
            } else {
                // dart has landed
                if (playerName.trim() !== "") {       
                    const boardCenter = new THREE.Vector3(0, boardHeight/2, boardZ)
                    const distance = dartRef.current[dartNumber].current.position.distanceTo(boardCenter)
                    setCurrentScore({playerName: playerName, distance: distance})
                    console.log('score updated')
                }

                dartsLanded.push(dartNumber)
                resetDartNumber()
                setTimeout(() => {
                    cameraRef.current.position.x = defaultCameraPos[0] 
                    cameraRef.current.position.y = defaultCameraPos[1] 
                    cameraRef.current.position.z = defaultCameraPos[2] 
                }, 1000);
            }
        }
        
    })


    // useEffect(() => {
    //     if (player) player.position.set(0, 3, 4);
    // }, [isPresenting])

    const colors = ["red", "orange", "yellow", "green", "blue", "purple"]

	return (
        <>
            <PerspectiveCamera
                ref={cameraRef}
                makeDefault
                position={defaultCameraPos}
            />
            <group ref={groupRef}> 
                {[...Array(maxDartNumber)].map((_, i) => {
                    return (
                    <mesh ref={dartRef.current[i]} key={i} position={[i - maxDartNumber/2 + 0.5, 0, 0]} castShadow rotation={[ -Math.PI*0.5, 0, 0]}>
                        <coneGeometry args={[0.1, dartLength, 8]} />
                        <meshStandardMaterial color={colors[i]} />
                    </mesh>

                    )
                })}

                <mesh ref={boardRef} receiveShadow position={[0, -2, boardZ-0.1]}>
                    <boxGeometry args={[boardWidth, boardHeight, 0.01]} />
                    <meshStandardMaterial 
                        color={0xeeeeee} 
                        map={dartsRoom}
                    />
                </mesh>
                <mesh receiveShadow position={[0, 2.7, boardZ]} rotation={[ Math.PI*0.5, Math.PI*0.5, 0]} >
                    <cylinderGeometry args={[2.1, 2.1, 0.1, 30]} />
                    <meshStandardMaterial 
                        color={0xeeeeee} 
                        map={dartBoard}
                    />
                </mesh>

            </group>
        </>
	)
}

export default DartsExperience