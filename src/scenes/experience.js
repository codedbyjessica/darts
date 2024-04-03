import { PerspectiveCamera } from "@react-three/drei";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useXR } from "@react-three/xr";
import React, { useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three";

const maxDartNumber = 6 
const boardDistance = 5
const boardWidth = 8
const boardHeight = 8

const defaultCameraPos = [0, 2, 12]

let isDragging = false
let dartNumber = 0


const Experience = ({canvasRef}) => {
    console.log('render')
    const dartBoard = useLoader(THREE.TextureLoader, '/images/dartboard.png') 
    dartBoard.repeat.set(2, 2); 
    dartBoard.offset.set(-0.5, -0.75);


	const cameraRef = useRef()
    const groupRef = useRef()
	const boardRef = useRef()
    const dartRef = useRef([React.createRef(), React.createRef(), React.createRef(), React.createRef(), React.createRef(), React.createRef(), React.createRef()])
    // const dartRef = useRef([])
    // useMemo(() => {
    //     for (let i = 0; i <= maxDartNumber; i++) {
    //         dartRef.current.push(React.createRef());
    //     }
    // })

    const { scene } = useThree()
    
    const { isPresenting, player, controllers } = useXR()

    // const [dartNumber, setDartNumber] = useState(0)
    const [activeController, setActiveController] = useState(null)
    const [dartAnimationPlaying, setDartAnimationPlaying] = useState(false)
    // const [isDragging, setIsDragging] = useState(false)

    const [velocity, setVelocity] = useState(new THREE.Vector3())
    
    const raycaster = new THREE.Raycaster();

    const resetDartNumber = () => {
        console.log('current dart', dartNumber)
        if (dartNumber + 1 > maxDartNumber) {
            console.log("next dart", 0)
            // setDartNumber(0)
            dartNumber = 0
        } else {
            console.log("next dart", dartNumber + 1)
            // setDartNumber(dartNumber + 1)
            dartNumber += 1
        }
    }

    const handleMouseDown = () => {
        if (!dartAnimationPlaying) {
            console.log('handleMouseDown')
            // setIsDragging(true);
            isDragging = true
        }
    };

    const handleMouseUp = () => {
        if (!dartAnimationPlaying) {
            console.log('handleMouseUp')
            // setIsDragging(false);
            isDragging = false
            setVelocity(getNewVelocity(velocity))
            shootDart()
        }
    };

    const handleMouseMove = (event, isTouch) => {
        console.log("handleMouseMove", scene)
        if (!dartAnimationPlaying && dartRef.current[dartNumber].current) {
            if (isDragging) {
                const rect = canvasRef.current.getBoundingClientRect();
                
                const mouse = {
                    x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
                    y: -((event.clientY - rect.top) / rect.height) * 2 + 1,
                };

                if (isTouch) {
                    mouse.x = (event.changedTouches[0].clientX / window.innerWidth) * 2 - 1;
                    mouse.y = -(event.changedTouches[0].clientY / window.innerHeight) * 2 + 1;
                }


                raycaster.setFromCamera(mouse, cameraRef.current);
                // const intersects = raycaster.intersectObject(boardRef.current);

                const intersects = raycaster.intersectObjects(scene.children);
                console.log(intersects)
                if (intersects.length > 0) {
                    const position = intersects[0].point;
                    const minX = -boardWidth/2
                    const maxX = boardWidth/2
                    const minY = 0
                    const maxY = boardHeight
                
                    const constrainedPosition = new THREE.Vector3(
                        Math.min(Math.max(position.x, minX), maxX),
                        Math.min(Math.max(position.y, minY), maxY),
                        // position.x,
                        // position.y,
                        boardDistance + 3
                    );

                    dartRef.current[dartNumber].current.position.x = constrainedPosition.x
                    dartRef.current[dartNumber].current.position.y = constrainedPosition.y
                    dartRef.current[dartNumber].current.position.z = constrainedPosition.z
                }
            } else {
                // dartRef.current[dartNumber].current.position.x = dartNumber - maxDartNumber/2
                // dartRef.current[dartNumber].current.position.y = 0
                // dartRef.current[dartNumber].current.position.z = 0
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

    const betweenNextDartTime = 1000;

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
        setTimeout(() => {
            setDartAnimationPlaying(true)
        }, 100);

        setTimeout(() => {
            setDartAnimationPlaying(false)
            resetDartNumber()
            cameraRef.current.position.x = defaultCameraPos[0] 
            cameraRef.current.position.y = defaultCameraPos[1] 
            cameraRef.current.position.z = defaultCameraPos[2] 
        }, betweenNextDartTime);

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
        document.addEventListener('mousedown', () => handleMouseDown());
        document.addEventListener('mouseup', () => handleMouseUp());
        document.addEventListener('mousemove', event => handleMouseMove(event));

        document.addEventListener('touchstart', () => handleMouseDown());
        document.addEventListener('touchend', () => handleMouseUp());
        document.addEventListener('touchmove', event => handleMouseMove(event, true));
    }

    const destroyWebEvents = () => {
        document.removeEventListener('mousedown', () => handleMouseDown());
        document.removeEventListener('mouseup', () => handleMouseUp());
        document.removeEventListener('mousemove', () => handleMouseMove());

        document.removeEventListener('touchstart', () => handleMouseDown());
        document.removeEventListener('touchend', () => handleMouseUp());
        document.removeEventListener('touchmove', () => handleMouseMove());
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
        console.log('isdragging', isDragging)
        setUpWebEvents()
        return () => {    
            destroyWebEvents()
        };
    }, [])


    useFrame((_, delta) => {   
        if (dartAnimationPlaying && dartRef.current[dartNumber].current) {
            if (dartRef.current[dartNumber].current.position.z >= -boardDistance) {
                dartRef.current[dartNumber].current.position.z += velocity.z * delta
                cameraRef.current.position.z = dartRef.current[dartNumber].current.position.z + 5

                if (isPresenting) {
                    dartRef.current[dartNumber].current.position.x += velocity.x * delta
                    dartRef.current[dartNumber].current.position.y += velocity.y * delta
                }
            }
        }
    })

    // useEffect(() => {
    //     if (player) player.position.set(0, 3, 4);
    // }, [isPresenting])
    const colors = ["red", "orange", "yellow", "green", "blue", "purple"]

    useEffect(() => {
        console.log("useeffect", dartNumber)
    }, [dartNumber])

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
                        <coneGeometry args={[0.1, 0.5, 8]} />
                        {/* <boxGeometry args={[1, 1, 1]} /> */}
                        <meshStandardMaterial color={colors[i]} />
                    </mesh>
                    )
                })}

                <mesh ref={boardRef} receiveShadow position={[0, boardHeight/2, -boardDistance]}>
                    <boxGeometry args={[boardWidth, boardHeight, 0.01]} />
                    <meshStandardMaterial 
                        color={0xeeeeee} 
                        map={dartBoard}
                    />
                </mesh>
            </group>
        </>
	)
}

export default Experience