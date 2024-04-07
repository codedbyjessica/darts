import React, { useRef, useState } from "react"
import { OrbitControls } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Controllers, XR, XRButton } from "@react-three/xr"
import "twin.macro"
import DartsExperience from "../scenes/experience"
import Layout from "../components/Layout"

const IndexPage = () => {
	const canvasRef = useRef()
    const playerNameInputRef = useRef()

    const [playerName, setPlayerName] = useState("")
    const [scores, setScores] = useState([])

	return (
		<Layout>
            <div tw="absolute z-10 top-8 left-0 w-full">
                <input onChange={e => setPlayerName(e.target.value)} ref={playerNameInputRef} id="playerName" name="playerName" value={playerName} />
                {scores.length > 0 && <div>
                    <div tw="text-center">High Scores</div>
                    {scores.map((score, i) => {
                        return (
                            <div key={i} tw="flex w-full">
                                <div tw="w-1/2">{score.playerName}</div>
                                <div tw="w-1/2">{Math.floor((2 - score.distance) * 100)}</div>
                            </div>
                        )
                    })}
                </div>}
            </div>
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
				<XR>
					<Controllers />
					<OrbitControls
						enableDamping={true}
                        enableZoom={false}
						enabled={false}
					/>

                    <DartsExperience canvasRef={canvasRef} playerName={playerName} scores={scores} setScores={setScores} />

					<ambientLight intensity={5} />
					<directionalLight castShadow position={[0, 10, 0]} intensity={1.25} />
				</XR>
				
			</Canvas>
		</Layout>
	)
}

export default IndexPage

export const Head = () => <title>Home Page</title>