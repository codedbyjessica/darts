import React, { useEffect, useRef, useState } from "react"
import { OrbitControls } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Controllers, VRButton, XR, XRButton } from "@react-three/xr"
import Experience from "../scenes/experience"
import "twin.macro"
import Layout from "../components.js/Layout"


const IndexPage = () => {
	const canvasRef = useRef()
	const cameraRef = useRef()

	useEffect(() => {
		console.log('canvasRef', canvasRef)
	}, [canvasRef])

	return (
		<Layout>
			<XRButton
				mode={'VR'}
				sessionInit={{ optionalFeatures: ["depth-sensing"] }}
			>
				{(status) => `WebXR ${status}`}
			</XRButton>
			<Canvas 
				tw="!h-[90vh]"
				ref={canvasRef}
			>
				<color attach="background" args={['#808080']} />
				<perspectiveCamera
					ref={cameraRef}
					makeDefault
					position={[0, 5, 0]}
				/>
				<XR>
					<Controllers />
					<OrbitControls
						enableDamping={true}
						enabled={false}
					/>

					<Experience canvasRef={canvasRef} cameraRef={cameraRef} />

					<ambientLight intensity={2.5} />
					<directionalLight castShadow position={[0, 10, 0]} intensity={1.25} />
				</XR>
				
			</Canvas>
		</Layout>
	)
}

export default IndexPage

export const Head = () => <title>Home Page</title>