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
    const PAUSE_DURATION = 6.0       // 완전히 사라진 후 재생성 전 대기 시간 (초)
    const AFTER_REGEN_PAUSE = 7      // 재생성 완료 후 다음 사이클까지 대기 시간 (초)
    const DELAY_RANGE_MIN = 3.0      // 딜레이 범위 최소값 (초)
    const DELAY_RANGE_MAX = 10.0     // 딜레이 범위 최대값 (초)
    const DELAY_RANGE_CHANGE_INTERVAL = 8.0  // 딜레이 범위가 변경되는 주기 (초) - 이 시간마다 랜덤하게 변경됨
    const TILE_WIDTH_VARIATION = 1.4 // 타일 너비 변동폭 (0~1) - 0이면 균일, 1이면 최대 변동
    const COLUMN_WAVE_SPEED_1 = 0.3  // 첫 번째 파동 속도 - 느린 파동
    const COLUMN_WAVE_SPEED_2 = 0.5  // 두 번째 파동 속도 - 빠른 파동
    const AMPLITUDE_MIN = 0.1        // 열별 진폭 최소값 (거의 안 움직임)
    const AMPLITUDE_MAX = 0.4        // 열별 진폭 최대값 (많이 움직임)
    const STATIC_COLUMN_RATIO = 0.4 // 정적 구역 비율 (15% 열은 거의 움직이지 않음)
    const WIDTH_MOVE_DURATION_MIN = 2.0  // 가로 움직임 지속 시간 최소값 (초) - 쓰으으으으윽 천천히 변화
    const WIDTH_MOVE_DURATION_MAX = 4.0  // 가로 움직임 지속 시간 최대값 (초)
    const WIDTH_PAUSE_DURATION_MIN = 12.0 // 가로 멈춤 시간 최소값 (초)
    const WIDTH_PAUSE_DURATION_MAX = 14.0 // 가로 멈춤 시간 최대값 (초)
    const ROW_CASCADE_DELAY = 0.1   // 위에서 아래로 전이되는 지연 시간 (초/행)
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
        columnWidths: number[]  // 각 열의 현재 너비 스케일 (열 단위로 공유)
    }>({ progress: [], delay: [], speed: [], phase: [], originalScales: [], originalPositions: [], columnWidths: [] })
    
    // [열별 고유 시드] 성능 최적화를 위해 열별 랜덤 값을 미리 저장
    const columnSeedsRef = useRef<{
        phaseOffsets: number[]      // 각 열의 고유 위상 오프셋
        amplitudeWeights: number[]  // 각 열의 진폭 가중치 (0~1)
        speedVariations: number[]   // 각 열의 속도 변동계수 (0.7~1.3)
    }>({ phaseOffsets: [], amplitudeWeights: [], speedVariations: [] })
    
    // [열별 애니메이션 상태] 움직임/멈춤 사이클 추적
    const columnAnimStateRef = useRef<{
        isMoving: boolean[]         // 각 열이 움직이는 중인지
        timer: number[]             // 각 열의 타이머 (움직임/멈춤 시간 추적)
        duration: number[]          // 각 열의 현재 상태 지속 시간
        currentWidth: number[]      // 각 열의 현재 너비
        targetWidth: number[]       // 각 열의 목표 너비
        animProgress: number[]      // 애니메이션 진행도 (0~1)
    }>({ isMoving: [], timer: [], duration: [], currentWidth: [], targetWidth: [], animProgress: [] })

    // Safety check for zero size to avoid Infinity
    if (size.width === 0 || size.height === 0) return null

    // 픽셀 퍼펙트 설정 - pixelRatio 고정으로 1px 간격 떨림 방지
    useLayoutEffect(() => {
        // pixelRatio를 정수로 고정하여 렌더링 안정성 확보
        const pixelRatio = Math.min(Math.floor(window.devicePixelRatio), 2)
        gl.setPixelRatio(pixelRatio)
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
            cols,
            rows,
            tileWorldSize,
            onePixelInWorld,
            pixelToUnit,
            startX: -Math.floor(cols / 2) * unitTileSize,
            startY: -Math.floor(rows / 2) * unitTileSize,
            unitTileSize,
            updateInstances: (mesh: THREE.InstancedMesh) => {
                // [기본 배치만 수행] 가로폭은 rain 애니메이션에서 적용
                const tempObject = new THREE.Object3D()
                const startX = -Math.floor(cols / 2) * unitTileSize
                const startY = -Math.floor(rows / 2) * unitTileSize
                
                let idx = 0
                for (let col = 0; col < cols; col++) {
                    for (let row = 0; row < rows; row++) {
                        // 기본 위치 설정 (Y축만 픽셀 정렬)
                        const yWorld = startY + (row * unitTileSize)
                        const yPixel = Math.round(yWorld / pixelToUnit)
                        const y = yPixel * pixelToUnit
                        
                        // X 위치는 rain 애니메이션에서 계산할 것이므로 기본값만 설정
                        const x = startX + (col * unitTileSize)
                        
                        tempObject.position.set(x, y, 0)
                        tempObject.scale.set(tileWorldSize, tileWorldSize, 1)
                        tempObject.rotation.set(0, 0, 0)
                        tempObject.updateMatrix()
                        mesh.setMatrixAt(idx++, tempObject.matrix)
                    }
                }

                mesh.instanceMatrix.needsUpdate = true
            }
        }
    }, [viewport.width, viewport.height, size.width, tileSize])
    
    const { cols, rows, tileWorldSize, onePixelInWorld, pixelToUnit, startX, startY, unitTileSize } = useMemo(() => {
        const pixelToUnit = viewport.width / size.width
        const unitTileSize = tileSize * pixelToUnit
        const onePixelInWorld = 1 * pixelToUnit
        const tileWorldSize = unitTileSize - onePixelInWorld
        const width = viewport.width
        const height = viewport.height
        const cols = Math.ceil(width / unitTileSize) + 2
        const rows = Math.ceil(height / unitTileSize) + 2
        const startX = -Math.floor(cols / 2) * unitTileSize
        const startY = -Math.floor(rows / 2) * unitTileSize
        return { cols, rows, tileWorldSize, onePixelInWorld, pixelToUnit, startX, startY, unitTileSize }
    }, [viewport.width, viewport.height, size.width, tileSize])
    
    // [열별 고유 시드 초기화] cols가 변경될 때마다 새로운 랜덤 시드 생성
    useMemo(() => {
        const phaseOffsets: number[] = []
        const amplitudeWeights: number[] = []
        const speedVariations: number[] = []
        
        for (let col = 0; col < cols; col++) {
            // 각 열의 고유 위상 오프셋 (0 ~ 2π)
            phaseOffsets.push(Math.random() * Math.PI * 2)
            
            // 진폭 가중치: 15%는 정적(0에 가까움), 나머지는 0.1~1.0 범위
            const isStatic = Math.random() < STATIC_COLUMN_RATIO
            if (isStatic) {
                // 정적 열: 거의 움직이지 않음
                amplitudeWeights.push(Math.random() * 0.05)
            } else {
                // 동적 열: AMPLITUDE_MIN ~ AMPLITUDE_MAX 범위
                amplitudeWeights.push(AMPLITUDE_MIN + Math.random() * (AMPLITUDE_MAX - AMPLITUDE_MIN))
            }
            
            // 각 열의 속도 변동계수 (0.7 ~ 1.3 범위)
            speedVariations.push(0.7 + Math.random() * 0.6)
        }
        
        columnSeedsRef.current.phaseOffsets = phaseOffsets
        columnSeedsRef.current.amplitudeWeights = amplitudeWeights
        columnSeedsRef.current.speedVariations = speedVariations
    }, [cols, AMPLITUDE_MIN, AMPLITUDE_MAX, STATIC_COLUMN_RATIO])

    useLayoutEffect(() => {
        if (meshRef.current) {
            // [열 단위 너비 초기화] 각 열의 초기 너비를 1.0으로 설정
            const columnWidths = Array.from({ length: cols }, () => 1.0)
            rainStateRef.current.columnWidths = columnWidths
            
            updateInstances(meshRef.current)
            
            // [Rain 애니메이션 초기화] 각 타일의 랜덤 속성 설정 (col -> row 순서)
            const tempMatrix = new THREE.Matrix4()
            const tempPosition = new THREE.Vector3()
            const tempRotation = new THREE.Quaternion()
            const tempScale = new THREE.Vector3()
            const totalCount = cols * rows
            
            rainStateRef.current.progress = new Array(totalCount).fill(0)
            rainStateRef.current.phase = new Array(totalCount).fill('falling')
            rainStateRef.current.originalScales = []
            rainStateRef.current.originalPositions = []
            
            // 각 타일의 원래 스케일과 위치 저장 (col -> row 순서)
            for (let i = 0; i < totalCount; i++) {
                meshRef.current.getMatrixAt(i, tempMatrix)
                tempMatrix.decompose(tempPosition, tempRotation, tempScale)
                rainStateRef.current.originalScales.push(tempScale.clone())
                rainStateRef.current.originalPositions.push(tempPosition.clone())
            }
            
            // 랜덤 delay와 speed 설정
            rainStateRef.current.delay = Array.from({ length: totalCount }, () => Math.random() * dynamicDelayRangeRef.current.current)
            rainStateRef.current.speed = Array.from({ length: totalCount }, () => 0.3 + Math.random() * 0.7)
        }
    }, [updateInstances, cols, rows])

    // [구조화] 날씨별 애니메이션을 위한 빈 함수 - 나중에 구현
    useFrame((state, delta) => {
        if (!meshRef.current) return
        
        // [방어 코드] rainStateRef 초기화 전에는 리턴
        if (!rainStateRef.current.progress || rainStateRef.current.progress.length === 0) return
        
        // [1단계] 열 단위 폭 사전 계산 - 멈춤과 랜덤 속도 변화 적용
        const time = state.clock.elapsedTime
        const columnWidths: number[] = []
        
        for (let col = 0; col < cols; col++) {
            // 각 열의 상태 초기화
            if (columnAnimStateRef.current.timer[col] === undefined) {
                const amplitudeWeight = columnSeedsRef.current.amplitudeWeights[col] || 0.5
                const initialWidth = 1.0
                
                // 초기화: pause 상태로 시작 (각 열이 다른 시점에 시작하도록)
                columnAnimStateRef.current.isMoving[col] = false
                columnAnimStateRef.current.timer[col] = Math.random() * WIDTH_PAUSE_DURATION_MAX // 0 ~ 8초 사이 랜덤 시작
                columnAnimStateRef.current.duration[col] = WIDTH_PAUSE_DURATION_MIN + Math.random() * (WIDTH_PAUSE_DURATION_MAX - WIDTH_PAUSE_DURATION_MIN)
                columnAnimStateRef.current.currentWidth[col] = initialWidth
                columnAnimStateRef.current.targetWidth[col] = initialWidth
                columnAnimStateRef.current.animProgress[col] = 1.0
            }
            
            // 애니메이션 진행 및 상태 전환
            let widthScale: number
            
            if (columnAnimStateRef.current.isMoving[col]) {
                // [움직임 상태] easing으로 부드럽게 목표 너비로 이동
                const progress = columnAnimStateRef.current.animProgress[col]
                const moveDuration = columnAnimStateRef.current.duration[col]
                
                // 진행도 업데이트 (0 → 1)
                const newProgress = Math.min(1.0, progress + delta / moveDuration)
                columnAnimStateRef.current.animProgress[col] = newProgress
                
                // easeInOutCubic: 느리게 시작 → 빠르게 → 느리게 끝 (쓰으으윽 효과)
                const t = newProgress
                const eased = t < 0.5 
                    ? 4 * t * t * t 
                    : 1 - Math.pow(-2 * t + 2, 3) / 2
                
                const currentWidth = columnAnimStateRef.current.currentWidth[col]
                const targetWidth = columnAnimStateRef.current.targetWidth[col]
                widthScale = currentWidth + (targetWidth - currentWidth) * eased
                
                // [애니메이션 완료 체크] progress가 1.0에 도달하면 멈춤으로 전환
                if (newProgress >= 1.0) {
                    columnAnimStateRef.current.isMoving[col] = false
                    columnAnimStateRef.current.currentWidth[col] = targetWidth // 목표 너비 저장
                    columnAnimStateRef.current.timer[col] = 0 // 멈춤 타이머 리셋
                    columnAnimStateRef.current.duration[col] = WIDTH_PAUSE_DURATION_MIN + Math.random() * (WIDTH_PAUSE_DURATION_MAX - WIDTH_PAUSE_DURATION_MIN)
                }
            } else {
                // [멈춤 상태] 현재 너비 유지 (완전히 고정)
                widthScale = columnAnimStateRef.current.currentWidth[col]
                
                // 멈춤 타이머 업데이트
                columnAnimStateRef.current.timer[col] += delta
                
                // [멈춤 완료 체크] timer가 duration에 도달하면 움직임으로 전환
                if (columnAnimStateRef.current.timer[col] >= columnAnimStateRef.current.duration[col]) {
                    columnAnimStateRef.current.isMoving[col] = true
                    columnAnimStateRef.current.timer[col] = 0
                    columnAnimStateRef.current.animProgress[col] = 0.0
                    columnAnimStateRef.current.duration[col] = WIDTH_MOVE_DURATION_MIN + Math.random() * (WIDTH_MOVE_DURATION_MAX - WIDTH_MOVE_DURATION_MIN)
                    
                    // 새로운 목표 너비 생성 (더 큰 변동폭)
                    const amplitudeWeight = columnSeedsRef.current.amplitudeWeights[col] || 0.5
                    const variation = TILE_WIDTH_VARIATION * amplitudeWeight
                    const randomOffset = (Math.random() * 2 - 1) * variation // -variation ~ +variation
                    columnAnimStateRef.current.targetWidth[col] = Math.max(0.4, Math.min(1.6, 1.0 + randomOffset))
                }
            }
            
            columnWidths.push(widthScale)
        }
        
        // [정규화 제거] 각 열은 독립적으로 멈춤/움직임
        // viewport 중앙 정렬은 updateRainAnimation에서 처리
        rainStateRef.current.columnWidths = columnWidths
        
        // [2단계] 날씨 애니메이션 적용 (가로폭 보정 포함)
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
    
    // [Rain 애니메이션] 빗방울이 떨어지는 효과 + 가로폭 보정
    const updateRainAnimation = (mesh: THREE.InstancedMesh, delta: number) => {
        const tempMatrix = new THREE.Matrix4()
        const tempPosition = new THREE.Vector3()
        const tempRotation = new THREE.Quaternion()
        const tempScale = new THREE.Vector3()
        
        // [1단계] 누적 X 좌표 사전 계산 (1px 간격 강제) + 중앙 정렬
        const columnXPositions: number[] = []
        const columnScaledWidths: number[] = []
        
        // 먼저 전체 너비 계산
        let totalGridWidth = 0
        for (let col = 0; col < cols; col++) {
            const widthScale = rainStateRef.current.columnWidths[col] || 1.0
            const scaledTileWidth = tileWorldSize * widthScale
            columnScaledWidths.push(scaledTileWidth)
            totalGridWidth += scaledTileWidth
            if (col < cols - 1) totalGridWidth += onePixelInWorld // 간격 추가 (마지막 열 제외)
        }
        
        // 중앙 정렬을 위한 시작 X 계산
        let cumulativeX = -totalGridWidth / 2
        
        for (let col = 0; col < cols; col++) {
            const scaledTileWidth = columnScaledWidths[col]
            
            // 이 열의 중심 X 좌표 = 현재 누적 위치 + (타일 너비 / 2)
            const centerX = cumulativeX + (scaledTileWidth / 2)
            columnXPositions.push(centerX)
            
            // 다음 열을 위해 누적 (현재 너비 + 1px 간격)
            cumulativeX += scaledTileWidth + onePixelInWorld
        }
        
        // [동적 딜레이 범위 업데이트] 일정 시간마다 랜덤하게 변경
        dynamicDelayRangeRef.current.timer += delta
        if (dynamicDelayRangeRef.current.timer >= DELAY_RANGE_CHANGE_INTERVAL) {
            dynamicDelayRangeRef.current.timer = 0
            dynamicDelayRangeRef.current.current = DELAY_RANGE_MIN + Math.random() * (DELAY_RANGE_MAX - DELAY_RANGE_MIN)
        }
        
        // [2단계] 각 타일에 대해 가로폭과 세로 수축을 모두 적용
        let idx = 0
        for (let col = 0; col < cols; col++) {
            const baseX = columnXPositions[col]
            const currentColumnWidth = columnScaledWidths[col]
            
            for (let row = 0; row < rows; row++) {
                const state = rainStateRef.current
                
                // 기본 Y 위치 (픽셀 정렬)
                const yWorld = startY + (row * unitTileSize)
                const yPixel = Math.round(yWorld / pixelToUnit)
                const baseY = yPixel * pixelToUnit
                
                // Delay 처리
                if (state.delay[idx] > 0) {
                    state.delay[idx] -= delta
                    
                    // phase에 따라 delay 중 처리 분기
                    if (state.phase[idx] === 'regenerating') {
                        // regenerating 시작 전 PAUSE_DURATION: 타일 완전히 숨김 (배경 보임)
                        tempPosition.set(baseX, baseY, 0)
                        tempScale.set(currentColumnWidth, 0, 1)
                        tempRotation.set(0, 0, 0, 1)
                        tempMatrix.compose(tempPosition, tempRotation, tempScale)
                        mesh.setMatrixAt(idx, tempMatrix)
                    } else {
                        // falling 시작 전 초기 delay: 타일 정상 표시
                        tempPosition.set(baseX, baseY, 0)
                        tempScale.set(currentColumnWidth, tileWorldSize, 1)
                        tempRotation.set(0, 0, 0, 1)
                        tempMatrix.compose(tempPosition, tempRotation, tempScale)
                        mesh.setMatrixAt(idx, tempMatrix)
                    }
                    idx++
                    continue
                }
                
                const speed = state.speed[idx]
                let scaleY = 1.0
                let pivotOffset = 0
                
                // 세로 애니메이션 진행
                if (state.phase[idx] === 'falling') {
                    // [떨어지는 페이즈] scaleY: 1 → 0 (타일이 위에서부터 줄어듦)
                    // [가속도 효과] 느리게 시작하다가 점점 빠르게
                    const acceleration = state.progress[idx] * state.progress[idx]
                    state.progress[idx] += (delta / FALL_DURATION) * speed * (0.5 + acceleration * 4)
                    
                    if (state.progress[idx] >= 1) {
                        state.progress[idx] = 1
                        state.phase[idx] = 'regenerating'
                        state.delay[idx] = PAUSE_DURATION
                    }
                    
                    scaleY = 1 - state.progress[idx]
                    // [Pivot: 하단 고정] 중심을 아래로 이동
                    pivotOffset = -tileWorldSize * (1 - scaleY) * 0.5
                    
                } else if (state.phase[idx] === 'regenerating') {
                    // [재생성 페이즈] scaleY: 0 → 1 (타일이 위에서부터 아래로 채워짐)
                    // [가속도 효과] 매우 느리게 시작하다가 점점 빠르게
                    const acceleration = (1 - state.progress[idx]) * (1 - state.progress[idx])
                    state.progress[idx] -= (delta / REGEN_DURATION) * speed * (0.2 + acceleration * 6)
                    
                    if (state.progress[idx] <= 0) {
                        state.progress[idx] = 0
                        state.phase[idx] = 'falling'
                        state.delay[idx] = AFTER_REGEN_PAUSE + Math.random() * dynamicDelayRangeRef.current.current + ROW_CASCADE_DELAY * (idx % 10)
                    }
                    
                    scaleY = 1 - state.progress[idx]
                    // [Pivot: 상단 고정] 중심을 아래로 이동
                    pivotOffset = tileWorldSize * (1 - scaleY) * 0.5
                }
                
                // [매트릭스 업데이트] position, quaternion, scale을 모두 계산 후 compose
                tempPosition.set(baseX, baseY + pivotOffset, 0)
                tempScale.set(currentColumnWidth, tileWorldSize * scaleY, 1)
                tempRotation.set(0, 0, 0, 1)
                tempMatrix.compose(tempPosition, tempRotation, tempScale)
                mesh.setMatrixAt(idx, tempMatrix)
                
                idx++
            }
        }
        
        mesh.instanceMatrix.needsUpdate = true
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
