import React, { useLayoutEffect, useRef, useMemo, useEffect } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface GridBackgroundProps {
    tileSize?: number
    tileColor?: string
    backgroundColor?: string
}

// Scene 배경색을 설정하는 컴포넌트
const SceneBackground: React.FC<{ color: string }> = ({ color }) => {
    const { scene } = useThree()
    
    useEffect(() => {
        scene.background = new THREE.Color(color)
    }, [scene, color])
    
    return null
}

const TileInstances: React.FC<{ tileSize: number; tileColor: string }> = ({ tileSize, tileColor }) => {
    const { viewport, size, gl } = useThree()
    const meshRef = useRef<THREE.InstancedMesh>(null)
    
    // ===== 조절 가능한 파라미터 =====
    const FALL_DURATION = 0.6        // 떨어지는 애니메이션 시간 (초) - 작을수록 빠름
    const REGEN_DURATION = 0.6       // 재생성 애니메이션 시간 (초) - 작을수록 빠름
    const PAUSE_DURATION = 5.0       // 완전히 사라진 후 재생성 전 대기 시간 (초)
    const AFTER_REGEN_PAUSE = 7      // 재생성 완료 후 다음 사이클까지 대기 시간 (초)
    const DELAY_RANGE_MIN = 3.0      // 딜레이 범위 최소값 (초)
    const DELAY_RANGE_MAX = 15.0     // 딜레이 범위 최대값 (초)
    const DELAY_RANGE_CHANGE_INTERVAL = 8.0  // 딜레이 범위가 변경되는 주기 (초) - 이 시간마다 랜덤하게 변경됨
    const TILE_WIDTH_VARIATION = 0.3 // 타일 너비 변동폭 (0~1) - 0이면 균일, 1이면 최대 변동
    const WIDTH_CHANGE_SPEED_MIN = 0.01  // 너비 변화 속도 최소값 - 작을수록 느림
    const WIDTH_CHANGE_SPEED_MAX = 0.03  // 너비 변화 속도 최대값 - 클수록 빠름
    const WIDTH_CHANGE_DELAY_MIN = 2.0   // 너비 변화 시작 딜레이 최소값 (초)
    const WIDTH_CHANGE_DELAY_MAX = 8.0   // 너비 변화 시작 딜레이 최대값 (초)
    const FALL_DISTANCE = 0.05       // 떨어질 때 Y축 이동 거리 (비율) - 클수록 많이 떨어짐
    const ROW_CASCADE_DELAY = 0.05   // 위에서 아래로 전이되는 지연 시간 (초/행)
    // ================================
    
    // [동적 딜레이 범위] 시간에 따라 변화하는 딜레이 범위
    const dynamicDelayRangeRef = useRef({
        current: DELAY_RANGE_MIN + Math.random() * (DELAY_RANGE_MAX - DELAY_RANGE_MIN),  // 현재 딜레이 범위
        timer: 0  // 변경 타이머
    })
    
    // [Rain 애니메이션 상태] 각 타일의 애니메이션 진행 상태 추적
    const rainStateRef = useRef<{
        progress: number[]      // 0~1: 애니메이션 진행도 (0=완전, 1=사라짐)
        delay: number[]         // 각 타일의 시작 지연 시간
        speed: number[]         // 각 타일의 애니메이션 속도
        phase: ('falling' | 'regenerating')[]  // 현재 페이즈
        originalScales: THREE.Vector3[]  // 각 타일의 원래 스케일 저장
        originalPositions: THREE.Vector3[]  // 각 타일의 원래 위치 저장
        widthScales: number[]   // 각 타일의 너비 스케일 팩터
        widthTargets: number[]  // 각 타일의 목표 너비 스케일
        widthSpeeds: number[]   // 각 타일의 너비 변화 속도
        widthDelays: number[]   // 각 타일의 너비 변화 시작 딜레이
    }>({ progress: [], delay: [], speed: [], phase: [], originalScales: [], originalPositions: [], widthScales: [], widthTargets: [], widthSpeeds: [], widthDelays: [] })
    
    // 너비 업데이트가 필요한지 추적
    const needsWidthUpdateRef = useRef(false)

    // Safety check for zero size to avoid Infinity
    if (size.width === 0 || size.height === 0) return null

    // 픽셀 퍼펙트 설정
    useLayoutEffect(() => {
        gl.setPixelRatio(window.devicePixelRatio)
    }, [gl])

    // Calculate tiles based on viewport size
    const { count, updateInstances } = useMemo(() => {
        // Convert pixel values to world units
        const pixelToUnit = viewport.width / size.width
        
        // 1px에 해당하는 월드 단위
        const onePixelInWorld = 1 * pixelToUnit
        
        // 전체 칸 크기 (360px)
        const unitTileSize = tileSize * pixelToUnit
        
        // 실제 타일 크기 = (전체 칸 크기) - (1px에 해당하는 월드 단위)
        const tileWorldSize = unitTileSize - onePixelInWorld
        
        const width = viewport.width
        const height = viewport.height

        // Calculate number of tiles needed with padding
        const cols = Math.ceil(width / unitTileSize) + 2
        const rows = Math.ceil(height / unitTileSize) + 2

        const count = cols * rows

        return {
            count,
            updateInstances: (mesh: THREE.InstancedMesh, widthScales: number[]) => {
                const tempObject = new THREE.Object3D()
                let idx = 0

                // 좌측 하단 기준점
                const startX = -Math.floor(cols / 2) * unitTileSize
                const startY = -Math.floor(rows / 2) * unitTileSize

                for (let row = 0; row < rows; row++) {
                    let xOffset = 0 // 각 행의 누적 x 오프셋
                    
                    for (let col = 0; col < cols; col++) {
                        // 이 타일의 너비 스케일 팩터 가져오기
                        const widthScale = widthScales[idx] || 1.0
                        const scaledTileWidth = tileWorldSize * widthScale
                        
                        // Y 위치 계산
                        const yWorld = startY + (row * unitTileSize)
                        const yPixel = Math.round(yWorld / pixelToUnit)
                        const y = yPixel * pixelToUnit
                        
                        // X 위치는 누적 오프셋 사용 (픽셀 정렬)
                        const xWorld = startX + xOffset
                        const xPixel = Math.round(xWorld / pixelToUnit)
                        const x = xPixel * pixelToUnit
                        
                        tempObject.position.set(x, y, 0)
                        tempObject.scale.set(scaledTileWidth, tileWorldSize, 1)
                        tempObject.rotation.set(0, 0, 0)
                        tempObject.updateMatrix()
                        mesh.setMatrixAt(idx++, tempObject.matrix)
                        
                        // 다음 타일의 시작 위치 계산 (현재 타일 너비 + 1px 간격)
                        xOffset += scaledTileWidth + onePixelInWorld
                    }
                }

                mesh.instanceMatrix.needsUpdate = true
            }
        }
    }, [viewport.width, viewport.height, size.width, tileSize])

    useLayoutEffect(() => {
        if (meshRef.current) {
            // [너비 스케일 팩터 생성] 각 타일의 랜덤 너비 생성
            const totalCount = count
            const widthScales = Array.from({ length: totalCount }, () => {
                // 1.0을 중심으로 ±TILE_WIDTH_VARIATION 범위에서 랜덤 생성
                return 1.0 + (Math.random() - 0.5) * 2 * TILE_WIDTH_VARIATION
            })
            rainStateRef.current.widthTargets = widthScales.map(() => 1.0 + (Math.random() - 0.5) * 2 * TILE_WIDTH_VARIATION)
            rainStateRef.current.widthSpeeds = Array.from({ length: totalCount }, () => WIDTH_CHANGE_SPEED_MIN + Math.random() * (WIDTH_CHANGE_SPEED_MAX - WIDTH_CHANGE_SPEED_MIN))
            rainStateRef.current.widthDelays = Array.from({ length: totalCount }, () => WIDTH_CHANGE_DELAY_MIN + Math.random() * (WIDTH_CHANGE_DELAY_MAX - WIDTH_CHANGE_DELAY_MIN))
            
            rainStateRef.current.widthScales = widthScales
            
            updateInstances(meshRef.current, widthScales)
            
            // [Rain 애니메이션 초기화] 각 타일의 랜덤 속성 설정
            const tempMatrix = new THREE.Matrix4()
            const tempPosition = new THREE.Vector3()
            const tempRotation = new THREE.Quaternion()
            const tempScale = new THREE.Vector3()
            
            rainStateRef.current.progress = new Array(totalCount).fill(0)
            rainStateRef.current.phase = new Array(totalCount).fill('falling')
            rainStateRef.current.originalScales = []
            rainStateRef.current.originalPositions = []
            
            // 각 타일의 원래 스케일과 위치 저장
            for (let i = 0; i < totalCount; i++) {
                meshRef.current.getMatrixAt(i, tempMatrix)
                tempMatrix.decompose(tempPosition, tempRotation, tempScale)
                rainStateRef.current.originalScales.push(tempScale.clone())
                rainStateRef.current.originalPositions.push(tempPosition.clone())
            }
            
            // 랜덤 delay와 speed 설정
            rainStateRef.current.delay = Array.from({ length: totalCount }, () => Math.random() * dynamicDelayRangeRef.current.current) // 초기 랜덤 지연
            rainStateRef.current.speed = Array.from({ length: totalCount }, () => 0.3 + Math.random() * 0.7) // 0.3~1.0 랜덤 속도
        }
    }, [updateInstances, count, DELAY_RANGE_MIN, DELAY_RANGE_MAX, TILE_WIDTH_VARIATION])

    // [구조화] 날씨별 애니메이션을 위한 빈 함수 - 나중에 구현
    useFrame((state, delta) => {
        if (!meshRef.current) return
        
        // [너비 애니메이션 업데이트] 각 타일의 너비를 목표값으로 부드럽게 변경
        let widthChanged = false
        for (let i = 0; i < rainStateRef.current.widthScales.length; i++) {
            // 딜레이 처리
            if (rainStateRef.current.widthDelays[i] > 0) {
                rainStateRef.current.widthDelays[i] -= delta
                continue
            }
            
            const current = rainStateRef.current.widthScales[i]
            const target = rainStateRef.current.widthTargets[i]
            const speed = rainStateRef.current.widthSpeeds[i]
            
            // 목표에 가까워지면 새로운 목표 설정 및 새로운 딜레이 부여
            if (Math.abs(current - target) < 0.01) {
                rainStateRef.current.widthTargets[i] = 1.0 + (Math.random() - 0.5) * 2 * TILE_WIDTH_VARIATION
                rainStateRef.current.widthDelays[i] = WIDTH_CHANGE_DELAY_MIN + Math.random() * (WIDTH_CHANGE_DELAY_MAX - WIDTH_CHANGE_DELAY_MIN)
            } else {
                // 목표값으로 부드럽게 이동
                const diff = target - current
                rainStateRef.current.widthScales[i] += diff * speed
                widthChanged = true
            }
        }
        
        // 너비가 변경되었으면 타일 위치 재계산 및 originalScales/Positions 업데이트
        if (widthChanged) {
            updateInstances(meshRef.current, rainStateRef.current.widthScales)
            
            // originalScales와 originalPositions를 새로운 너비에 맞춰 업데이트
            const tempMatrix = new THREE.Matrix4()
            const tempPosition = new THREE.Vector3()
            const tempRotation = new THREE.Quaternion()
            const tempScale = new THREE.Vector3()
            
            for (let i = 0; i < meshRef.current.count; i++) {
                meshRef.current.getMatrixAt(i, tempMatrix)
                tempMatrix.decompose(tempPosition, tempRotation, tempScale)
                rainStateRef.current.originalScales[i].copy(tempScale)
                rainStateRef.current.originalPositions[i].copy(tempPosition)
            }
        }
        
        // 여기에 날씨별 애니메이션 로직 추가 예정
        updateWeatherAnimation(meshRef.current, state, delta)
    })

    // [애니메이션 구조] 날씨에 따른 타일 애니메이션
    const updateWeatherAnimation = (
        mesh: THREE.InstancedMesh, 
        _state: any, 
        delta: number
    ) => {
        // TODO: 날씨 타입을 props로 받아서 분기 처리
        const weatherType = 'Rainy' // 임시로 하드코딩, 나중에 props로 변경
        
        if (weatherType === 'Rainy') {
            updateRainAnimation(mesh, delta)
        }
    }
    
    // [Rain 애니메이션] 빗방울이 떨어지는 효과
    const updateRainAnimation = (mesh: THREE.InstancedMesh, delta: number) => {
        const tempMatrix = new THREE.Matrix4()
        const tempPosition = new THREE.Vector3()
        const tempRotation = new THREE.Quaternion()
        const tempScale = new THREE.Vector3()
        
        let needsUpdate = false
        
        // [동적 딜레이 범위 업데이트] 일정 시간마다 랜덤하게 변경
        dynamicDelayRangeRef.current.timer += delta
        if (dynamicDelayRangeRef.current.timer >= DELAY_RANGE_CHANGE_INTERVAL) {
            dynamicDelayRangeRef.current.timer = 0
            dynamicDelayRangeRef.current.current = DELAY_RANGE_MIN + Math.random() * (DELAY_RANGE_MAX - DELAY_RANGE_MIN)
        }
        
        for (let i = 0; i < mesh.count; i++) {
            const state = rainStateRef.current
            
            // Delay 처리
            if (state.delay[i] > 0) {
                state.delay[i] -= delta
                continue
            }
            
            // 원래 스케일과 위치 가져오기
            const originalScale = state.originalScales[i]
            const originalPosition = state.originalPositions[i]
            const speed = state.speed[i]
            
            // 애니메이션 진행
            if (state.phase[i] === 'falling') {
                // [떨어지는 페이즈] scaleY: 1 → 0 (타일이 위에서부터 줄어듦)
                // [가속도 효과] progress를 제곱하여 점점 빨라지는 효과
                const acceleration = state.progress[i] * state.progress[i] // 가속도 (0→1이 점점 빨라짐)
                state.progress[i] += (delta / FALL_DURATION) * speed * (1.5 + acceleration * 2)
                
                if (state.progress[i] >= 1) {
                    state.progress[i] = 1
                    // 완전히 사라짐, 재생성 페이즈로 전환
                    state.phase[i] = 'regenerating'
                    state.delay[i] = PAUSE_DURATION // 잠시 대기
                }
                
                // scaleY 계산 (1 → 0)
                const scaleY = 1 - state.progress[i]
                
                // [Pivot: 하단 고정] 타일의 아래쪽을 고정하고 위에서 줄어듦
                // 중심이 아래로 이동: offset = -height * (1 - scaleY) / 2
                const pivotOffset = -originalScale.y * (1 - scaleY) * 0.5
                
                tempScale.set(originalScale.x, originalScale.y * scaleY, originalScale.z)
                tempPosition.set(originalPosition.x, originalPosition.y + pivotOffset, originalPosition.z)
                
                needsUpdate = true
                
            } else if (state.phase[i] === 'regenerating') {
                // [재생성 페이즈] scaleY: 0 → 1 (타일이 위에서부터 아래로 채워짐)
                // [가속도 효과] progress가 1→0으로 감소하므로, (1-progress)²를 사용하여 끝으로 갈수록 빨라짐
                const acceleration = (1 - state.progress[i]) * (1 - state.progress[i]) // 가속도 (progress가 0에 가까워질수록 빨라짐)
                state.progress[i] -= (delta / REGEN_DURATION) * speed * (1.5 + acceleration * 2)
                
                if (state.progress[i] <= 0) {
                    state.progress[i] = 0
                    // 완전히 복구됨, 다시 떨어지는 페이즈로 전환
                    state.phase[i] = 'falling'
                    // 새로운 랜덤 delay 설정 (현재 동적 딜레이 범위 사용)
                    state.delay[i] = AFTER_REGEN_PAUSE + Math.random() * dynamicDelayRangeRef.current.current + ROW_CASCADE_DELAY * (i % 10) // 행별 cascade
                }
                
                // scaleY 계산 (0 → 1)
                const scaleY = 1 - state.progress[i]
                
                // [Pivot: 상단 고정] 타일의 위쪽에서 시작해서 아래로 채워짐
                // 중심이 아래로 이동: offset = height * (1 - scaleY) / 2
                const pivotOffset = originalScale.y * (1 - scaleY) * 0.5
                
                tempScale.set(originalScale.x, originalScale.y * scaleY, originalScale.z)
                tempPosition.set(originalPosition.x, originalPosition.y + pivotOffset, originalPosition.z)
                
                needsUpdate = true
            }
            
            // 매트릭스 업데이트
            if (needsUpdate) {
                tempRotation.set(0, 0, 0, 1) // 기본 회전
                tempMatrix.compose(tempPosition, tempRotation, tempScale)
                mesh.setMatrixAt(i, tempMatrix)
            }
        }
        
        if (needsUpdate) {
            mesh.instanceMatrix.needsUpdate = true
        }
    }

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial 
                color={tileColor}
                toneMapped={false}
            />
        </instancedMesh>
    )
}

const GridBackground: React.FC<GridBackgroundProps> = ({
    tileSize = 360,
    tileColor = '#F7F7F7',
    backgroundColor = '#EBEBEB',
}) => {
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
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
                dpr={[1, 2]}
                gl={{
                    antialias: false,
                    alpha: false,
                }}
                resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
            >
                <SceneBackground color={backgroundColor} />
                <TileInstances tileSize={tileSize} tileColor={tileColor} />
            </Canvas>
        </div>
    )
}

export default GridBackground
