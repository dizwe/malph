import React, { useLayoutEffect, useRef, useMemo } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface GridBackgroundProps {
    gridSize?: number
    lineColor?: string
    backgroundColor?: string
}

const GridInstances: React.FC<{ gridSize: number; lineColor: string }> = ({ gridSize, lineColor }) => {
    const { viewport, size } = useThree()
    const meshRef = useRef<THREE.InstancedMesh>(null)

    // Safety check for zero size to avoid Infinity
    if (size.width === 0 || size.height === 0) return null

    // Calculate lines based on viewport size
    const { count, updateInstances } = useMemo(() => {
        // Convert pixel values to world units
        // viewport.width is world units, size.width is pixels
        const pixelToUnit = viewport.width / size.width
        const unitGridSize = gridSize * pixelToUnit
        const unitThickness = 1 * pixelToUnit

        const width = viewport.width
        const height = viewport.height

        // Calculate number of lines needed with padding
        const cols = Math.ceil(width / unitGridSize) + 2
        const rows = Math.ceil(height / unitGridSize) + 2

        const count = cols + rows

        return {
            count,
            updateInstances: (mesh: THREE.InstancedMesh) => {
                const tempObject = new THREE.Object3D()
                let idx = 0

                // Vertical lines
                const startX = -Math.floor(cols / 2) * unitGridSize
                for (let i = 0; i < cols; i++) {
                    const x = startX + (i * unitGridSize)
                    // Position
                    tempObject.position.set(x, 0, 0)
                    // Scale: width is 1 pixel (unitThickness), height covers viewport
                    tempObject.scale.set(unitThickness, height * 2, 1)
                    tempObject.rotation.set(0, 0, 0)
                    tempObject.updateMatrix()
                    mesh.setMatrixAt(idx++, tempObject.matrix)
                }

                // Horizontal lines
                const startY = -Math.floor(rows / 2) * unitGridSize
                for (let i = 0; i < rows; i++) {
                    const y = startY + (i * unitGridSize)
                    tempObject.position.set(0, y, 0)
                    // Scale: width covers viewport, height is 1 pixel (unitThickness)
                    tempObject.scale.set(width * 2, unitThickness, 1)
                    tempObject.rotation.set(0, 0, 0)
                    tempObject.updateMatrix()
                    mesh.setMatrixAt(idx++, tempObject.matrix)
                }

                mesh.instanceMatrix.needsUpdate = true
            }
        }
    }, [viewport.width, viewport.height, size.width, gridSize])

    useLayoutEffect(() => {
        if (meshRef.current) {
            updateInstances(meshRef.current)
        }
    }, [updateInstances])

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial color={lineColor} />
        </instancedMesh>
    )
}

const GridBackground: React.FC<GridBackgroundProps> = ({
    gridSize = 360,
    lineColor = '#EBEBEB',
    backgroundColor = '#f7f7f7',
}) => {
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0, // Reset to 0 to be visible
            backgroundColor,
        }}>
            <Canvas
                orthographic
                camera={{
                    zoom: 1,
                    position: [0, 0, 100],
                    near: 0.1,
                    far: 1000,
                }}
                style={{ width: '100%', height: '100%' }}
                resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
            >
                <GridInstances gridSize={gridSize} lineColor={lineColor} />
            </Canvas>
        </div>
    )
}

export default GridBackground
