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
    
    // [Sunny 모드] 마우스 추적 및 태양 상태
    const sunStateRef = useRef({
        mouseX: 0,
        mouseY: 0,
        sunX: 0,
        sunY: 0,
        pulsePhase: 0
    })
    const sunMeshRef = useRef<THREE.Mesh>(null)
    
    // [타일 상태] 각 타일의 들림 상태 (그림자 계산용)
    const tileStateRef = useRef<{
        offsetZ: number[]  // 각 타일의 Z축 들림 값
    }>({ offsetZ: [] })

    // Safety check for zero size to avoid Infinity
    if (size.width === 0 || size.height === 0) return null
    
    // [Sunny 모드] 마우스 추적은 useFrame에서 three의 mouse 사용

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
        
        // TODO: 날씨 타입 결정 로직
        const weatherType = 'Sunny'
        
        // [Sunny 모드] 가로 애니메이션 비활성화
        if (weatherType === 'Sunny') {
            // 모든 열의 너비를 1.0으로 고정
            const columnWidths: number[] = Array.from({ length: cols }, () => 1.0)
            rainStateRef.current.columnWidths = columnWidths
        } else {
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
        }
        
        // [2단계] 날씨 애니메이션 적용 (가로폭 보정 포함)
        updateWeatherAnimation(meshRef.current, state, delta)
    })

    // [애니메이션 구조] 날씨에 따른 타일 애니메이션
    const updateWeatherAnimation = (
        mesh: THREE.InstancedMesh, 
        state: any, 
        delta: number
    ) => {
        // TODO: 날씨 타입을 props로 받아서 분기 처리
        const weatherType = 'Sunny' // 임시로 하드코딩, 나중에 props로 변경
        
        // [ARCHIVED] Rain mode - 아카이브됨
        // if (weatherType === 'Rainy') {
        //     updateRainAnimation(mesh, delta)
        // }
        
        if (weatherType === 'Sunny') {
            updateSunnyAnimation(mesh, delta, state)
        }
    }
    
    // ============================================
    // [ARCHIVED] Rain 애니메이션 - 아카이브됨
    // ============================================
    /*
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
    */
    // ============================================
    
    // [Sunny] 타일 ShaderMaterial (모서리 그림자)
    const tileShaderMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            vertexShader: `
                attribute vec2 tileRotation; // rotX, rotY 정보
                varying vec2 vUv;
                varying vec2 vRotation;
                
                void main() {
                    vUv = uv;
                    vRotation = tileRotation;
                    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 baseColor;
                varying vec2 vUv;
                varying vec2 vRotation;
                
                void main() {
                    vec2 center = vec2(0.5, 0.5);
                    vec2 toCenter = vUv - center;
                    
                    // 회전 방향에 따른 모서리 감지
                    // vRotation.x = rotX (상하), vRotation.y = rotY (좌우)
                    float rotStrength = length(vRotation);
                    
                    if (rotStrength > 0.01) {
                        // 들린 모서리 방향 계산
                        vec2 edgeDir = normalize(vRotation);
                        
                        // UV와 회전 방향의 내적으로 모서리 판단
                        float edgeDot = dot(normalize(toCenter), edgeDir);
                        
                        // 모서리에서의 거리 (중심에서 멀수록 값이 큼)
                        float distFromCenter = length(toCenter);
                        
                        // 모서리 부근에만 그림자 적용 (들린 모서리 반대편)
                        float shadowMask = 0.0;
                        if (edgeDot < -0.1 && distFromCenter > 0.25) {
                            // 빳빳한 타일의 그림자 - 더 강하고 명확하게
                            shadowMask = smoothstep(0.25, 0.8, distFromCenter) * smoothstep(-0.1, -0.8, edgeDot);
                        }
                        
                        float shadowStrength = shadowMask * rotStrength * 0.2; // 최대 20% 어두워짐 (은은한 그림자)
                        vec3 color = baseColor * (1.0 - shadowStrength);
                        
                        gl_FragColor = vec4(color, 1.0);
                    } else {
                        // 회전 없으면 기본 색상
                        gl_FragColor = vec4(baseColor, 1.0);
                    }
                }
            `,
            uniforms: {
                baseColor: { value: new THREE.Color(tileColor) }
            },
            toneMapped: false,
            transparent: true
        })
    }, [tileColor])
    
    // [Sunny] 태양 ShaderMaterial
    const sunShaderMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform float uPulse;
                varying vec2 vUv;
                
                // 노이즈 함수
                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }
                
                float noise(vec2 st) {
                    vec2 i = floor(st);
                    vec2 f = fract(st);
                    float a = random(i);
                    float b = random(i + vec2(1.0, 0.0));
                    float c = random(i + vec2(0.0, 1.0));
                    float d = random(i + vec2(1.0, 1.0));
                    vec2 u = f * f * (3.0 - 2.0 * f);
                    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
                }
                
                void main() {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(vUv, center);
                    
                    // 정적이고 고급스러운 노이즈 (속도 감소)
                    float noiseValue = noise(vUv * 12.0 + uTime * 0.1);
                    float organicDist = dist + noiseValue * 0.025;
                    
                    // 펄스 효과
                    float radius = 0.5 + uPulse * 0.01;
                    
                    // 3단계 방사형 그라데이션 (순백 → 골드 → 딥오렌지)
                    vec3 innerColor = vec3(1.0, 1.0, 1.0);    // #FFFFFF 순백색 (눈부신 중앙)
                    vec3 middleColor = vec3(1.0, 0.84, 0.0);  // #FFD700 골드
                    vec3 outerColor = vec3(1.0, 0.27, 0.0);   // #FF4500 딥 오렌지
                    
                    vec3 color;
                    if (organicDist < radius * 0.25) {
                        color = innerColor;
                    } else if (organicDist < radius * 0.55) {
                        float t = (organicDist - radius * 0.25) / (radius * 0.3);
                        color = mix(innerColor, middleColor, t);
                    } else {
                        float t = (organicDist - radius * 0.55) / (radius * 0.45);
                        color = mix(middleColor, outerColor, t);
                    }
                    
                    // 단순화된 블러 (가시성 확보)
                    const float SUN_BLUR_INNER = 0.5;
                    const float SUN_BLUR_OUTER = 1.0;
                    const float SUN_BLUR_POWER = 1.0;
                    float alpha = 1.0 - smoothstep(radius * SUN_BLUR_INNER, radius * SUN_BLUR_OUTER, organicDist);
                    alpha = pow(alpha, SUN_BLUR_POWER);
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            uniforms: {
                uTime: { value: 0 },
                uPulse: { value: 0 }
            }
        })
    }, [])
    
    // [Sunny 애니메이션] 맑은 날씨 효과
    const updateSunnyAnimation = (mesh: THREE.InstancedMesh, delta: number, state: any) => {
        // [1] 마우스 좌표 (three.js mouse 사용)
        const mouseX = state.mouse.x * viewport.width / 2
        const mouseY = state.mouse.y * viewport.height / 2
        
        // [2] 태양 위치 - 중앙 고정 (가시성 확보용)
        // const lerpFactor = 0.8 * delta
        // const offsetX = mouseX * 0.1
        // const offsetY = mouseY * 0.1
        // sunStateRef.current.sunX += (offsetX - sunStateRef.current.sunX) * lerpFactor
        // sunStateRef.current.sunY += (offsetY - sunStateRef.current.sunY) * lerpFactor
        
        // [3] 태양 메쉬 업데이트 - 중앙 고정
        if (sunMeshRef.current) {
            sunMeshRef.current.position.set(0, 0, -1)
            
            // 펄스 애니메이션
            sunStateRef.current.pulsePhase += delta * 2.0
            const pulseValue = Math.sin(sunStateRef.current.pulsePhase) * 0.5 + 0.5
            
            const material = sunMeshRef.current.material as THREE.ShaderMaterial
            material.uniforms.uTime.value += delta
            material.uniforms.uPulse.value = pulseValue
        }
        
        // [4] 타일 렌더링 - 개별 타일 핀포인트 틸트
        const tempObject = new THREE.Object3D()
        
        // 타일 회전 정보 attribute 초기화 (첫 프레임에만)
        if (!mesh.geometry.attributes.tileRotation) {
            const rotations = new Float32Array(count * 2) // rotX, rotY
            mesh.geometry.setAttribute('tileRotation', new THREE.InstancedBufferAttribute(rotations, 2))
        }
        
        const rotations = mesh.geometry.attributes.tileRotation as THREE.InstancedBufferAttribute
        let idx = 0
        
        for (let col = 0; col < cols; col++) {
            for (let row = 0; row < rows; row++) {
                // 초기 배치와 동일한 좌표 계산 (픽셀 정렬)
                const yWorld = startY + (row * unitTileSize)
                const yPixel = Math.round(yWorld / pixelToUnit)
                const y = yPixel * pixelToUnit
                const xPixel = Math.round((startX + (col * unitTileSize)) / pixelToUnit)
                const x = xPixel * pixelToUnit
                
                // 타일 중심점
                const centerX = x + unitTileSize / 2
                const centerY = y + unitTileSize / 2
                
                // 마우스까지의 거리 (타일 중심 기준)
                const dx = mouseX - centerX
                const dy = mouseY - centerY
                const distance = Math.sqrt(dx * dx + dy * dy)
                
                // 타일 단위 반응 범위 (마우스가 올라간 타일만 강하게 반응)
                const maxDistance = unitTileSize * 1.0  // 거의 타일 크기와 동일
                
                let rotX = 0
                let rotY = 0
                let offsetZ = 0
                
                if (distance < maxDistance) {
                    // 빳빳한 플라스틱 면 전환 효과 (접히지 않고 단단하게 틀어짐)
                    const influence = 1.0 - (distance / maxDistance)
                    const snapInfluence = Math.pow(influence, 2.5)  // 더 급격한 감소로 빳빳한 스냅 효과
                    
                    // 방향 정규화 (마우스가 있는 방향)
                    const normalizedDx = dx / unitTileSize  // -0.5 ~ 0.5
                    const normalizedDy = dy / unitTileSize  // -0.5 ~ 0.5
                    
                    // 강한 회전 각도 (1.2 라디안 = 약 69도)
                    // 빳빳한 면이 확실히 틀어지는 느낌
                    const tiltPower = 1.4  // 기본 강도 증가
                    rotY = -normalizedDx * snapInfluence * tiltPower
                    rotX = normalizedDy * snapInfluence * tiltPower
                    
                    // 더 큰 입체적 들림 (35 유닛)
                    offsetZ = snapInfluence * 100.0
                }
                
                // 중심축 고정 매트릭스 (위치가 밀리지 않음)
                tempObject.position.set(centerX, centerY, 0.1 + offsetZ)
                tempObject.rotation.set(rotX, rotY, 0)
                tempObject.scale.set(tileWorldSize, tileWorldSize, 1)
                tempObject.updateMatrix()
                
                mesh.setMatrixAt(idx, tempObject.matrix)
                
                // 회전 정보 저장 (셰이더에서 모서리 그림자 계산용)
                const rotStrength = Math.sqrt(rotX * rotX + rotY * rotY)
                rotations.setXY(idx, rotX, rotY)
                
                idx++
            }
        }
        
        rotations.needsUpdate = true
        
        mesh.instanceMatrix.needsUpdate = true
    }

    return (
        <>
            {/* 태양 레이어 (z=-1 타일 뒤에 배치) */}
            <mesh 
                ref={sunMeshRef} 
                position={[0, 0, -1]}
            >
                <circleGeometry args={[Math.max(viewport.width, viewport.height) * 0.4, 64]} />
                <primitive object={sunShaderMaterial} attach="material" />
            </mesh>
            
            {/* 타일 그리드 */}
            <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
                <planeGeometry args={[1, 1]} />
                <primitive object={tileShaderMaterial} attach="material" />
            </instancedMesh>
        </>
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
