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
    
    const viewportShortSide = Math.min(viewport.width, viewport.height)
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
    
    // ===== Sunny Mode 타일 효과 조절 파라미터 =====
    // � 빳be3한 금속 타일 + 스프링 인터렉션
    const SUNNY_TILT_POWER = 1.4     // 회전 강도 (0.3~0.8) - 강철판처럼 빳빳하게
    const SUNNY_Z_LIFT = 70.0       // Z축 들림 높이 - 타일 사이로 태양이 보임
    const SUNNY_SNAP_POWER = 5.0     // 스냅 반응 속도 (4.0~6.0) - '착' 감기는 순간 가속도
    const SUNNY_SHADOW_STRENGTH = 0.6  // 그림자 강도 (0.2~0.4) - 각도 대비 강화
    const SUNNY_REACTION_RANGE = 10 // 반응 범위 (unitTileSize 배수) - 마우스 근처 타일들이 반응
    const SUNNY_TILE_OPACITY = 0.5  // 타일 투명도 (0.95~1.0) - 태양이 살짝 비치게
    const SUNNY_MAX_ROTATION = 0.56  // 최대 회전각 (라디안, 약 26도) - 판이 사라지지 않게 제한
    const SUNNY_DEAD_ZONE = 0.0      // 중앙 데드존 비율 (0~1) - 0으로 설정하여 모든 영역 반응
    const SUN_DRIFT_RANGE = viewportShortSide * 0.2 // 태양 드리프트 반경
    const SUN_DRIFT_INTERVAL_MIN = 2.0  // 드리프트 방향 전환 최소 간격 (초)
    const SUN_DRIFT_INTERVAL_MAX = 3.0  // 드리프트 방향 전환 최대 간격 (초)
    const SUN_MOUSE_CAPTURE_RADIUS = viewportShortSide * 0.3 // 마우스 제어가 활성화되는 반경
    const SUN_MOUSE_MAX_OFFSET = viewportShortSide * 0.5     // 마우스 추적 시 허용되는 최대 이동 반경
    const SUN_MOUSE_FOLLOW_SMOOTHNESS = 0.8                  // 마우스 추적 시 lerp 속도
    
    // 스프링 물리 파라미터 - 단단한 금속 자석 물리
    const SPRING_STIFFNESS = 0.4     // 스프링 강성 - 빳빳한 힘 (0.2~0.4)
    const SPRING_DAMPING = 0.4       // 스프링 감쇠 - 출렁임 제어 (0.6~0.8)
    const VELOCITY_SLEEP_THRESHOLD = 0.001  // 속도 임계값 - 작을수록 빨리 멈춤
    // ===========================================
    // ================================
    
    // [동적 딜레이 범위] 시간에 따라 변화하는 딜레이 범위
    const dynamicDelayRangeRef = useRef({
        current: DELAY_RANGE_MIN + Math.random() * (DELAY_RANGE_MAX - DELAY_RANGE_MIN),  // 현재 딜레이 범위
        timer: 0  // 변경 타이머
    })
    
    // [스프링 애니메이션] 각 타일의 현재 회전/위치 상태 저장
    const tileStatesRef = useRef<Array<{
        rotX: number
        rotY: number
        offsetZ: number
    }> | null>(null)
    
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
    const sunDriftRef = useRef({
        current: new THREE.Vector2(0, 0),
        target: new THREE.Vector2(0, 0),
        timer: 0,
        duration: SUN_DRIFT_INTERVAL_MIN + Math.random() * (SUN_DRIFT_INTERVAL_MAX - SUN_DRIFT_INTERVAL_MIN)
    })
    
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
    const { count, cols, rows, tileWorldSize, onePixelInWorld, pixelToUnit, startX, startY, unitTileSize, updateInstances } = useMemo(() => {
        // Convert pixel values to world units
        const pixelToUnit = viewport.width / size.width
        
        // 1px에 해당하는 월드 단위
        const onePixelInWorld = 1 * pixelToUnit
        
        // 전체 칸 크기 (360px)
        const unitTileSize = tileSize * pixelToUnit
        
        // 실제 타일 크기 = 격자 빡빡하게 붙임
        const tileWorldSize = unitTileSize - onePixelInWorld
        
        const width = viewport.width
        const height = viewport.height

        // Calculate number of tiles needed with padding
        const cols = Math.ceil(width / unitTileSize) + 2
        const rows = Math.ceil(height / unitTileSize) + 2

        const count = cols * rows
        
        const startX = -Math.floor(cols / 2) * unitTileSize
        const startY = -Math.floor(rows / 2) * unitTileSize

        return {
            count,
            cols,
            rows,
            tileWorldSize,
            onePixelInWorld,
            pixelToUnit,
            startX,
            startY,
            unitTileSize,
            updateInstances: (mesh: THREE.InstancedMesh) => {
                // [기본 배치만 수행] 가로폭은 rain 애니메이션에서 적용
                const tempObject = new THREE.Object3D()
                
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
            // [중요] 자동 행렬 업데이트 차단 - 수동 행렬을 지키기 위함
            meshRef.current.matrixAutoUpdate = false
            // [중요] 동적 드로우 모드로 설정 - 매 프레임 업데이트 최적화
            meshRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
            
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
        
        // [ARCHIVED] Rain mode - 아카이빙됨
        // if (weatherType === 'Rainy') {
        //     updateRainAnimation(mesh, delta)
        // }
        
        if (weatherType === 'Sunny') {
            updateSunnyAnimation(mesh, delta, state)
        }
    }
    
    // ============================================
    // [ARCHIVED] Rain 애니메이션 - 아카이빙됨
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
    
    // [ARCHIVED] Rain 타일 Material - 아카이빙됨
    /*
    const tileBasicMaterial = useMemo(() => {
        return new THREE.MeshBasicMaterial({
            color: new THREE.Color(tileColor),
            toneMapped: false,
            transparent: false
        })
    }, [tileColor])
    */
    
    // [Sunny] 타일 Material - 단순하고 깔끔하게
    const tileShaderMaterial = useMemo(() => {
        return new THREE.MeshBasicMaterial({
            color: new THREE.Color(tileColor),
            toneMapped: false,
            transparent: true,
            opacity: SUNNY_TILE_OPACITY
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
                    vec2 dir = vUv - center;
                    float dist = length(dir);
                    
                    // 정적이고 고급스러운 노이즈 (속도 감소)
                    float noiseValue = noise(vUv * 12.0 + uTime * 0.1);
                    float organicDist = dist + noiseValue * 0.025;
                    
                    // 펄스 효과
                    float radius = 0.5 + uPulse * 0.01;
                    
                    // 🌈 색수차 (Chromatic Aberration) - RGB 분리 효과
                    const float aberrationStrength = 0.015; // 색수차 강도
                    
                    // 각 색상 채널을 약간 다른 위치에서 샘플링
                    vec2 uvR = center + dir * (1.0 + aberrationStrength); // Red - 바깥쪽
                    vec2 uvG = center + dir * (1.0);                       // Green - 중앙
                    vec2 uvB = center + dir * (1.0 - aberrationStrength); // Blue - 안쪽
                    
                    float distR = length(uvR - center) + noise(uvR * 12.0 + uTime * 0.1) * 0.025;
                    float distG = organicDist;
                    float distB = length(uvB - center) + noise(uvB * 12.0 + uTime * 0.1) * 0.025;
                    
                    // 3단계 방사형 그라데이션 (순백 → 골드 → 딥오렌지) - 각 채널별로
                    vec3 innerColor = vec3(1.0, 1.0, 1.0);    // #FFFFFF 순백색 (눈부신 중앙)
                    vec3 middleColor = vec3(1.0, 0.84, 0.0);  // #FFD700 골드
                    vec3 outerColor = vec3(1.0, 0.27, 0.0);   // #FF4500 딥 오렌지
                    
                    // Red 채널
                    vec3 colorR;
                    if (distR < radius * 0.25) {
                        colorR = innerColor;
                    } else if (distR < radius * 0.55) {
                        float t = (distR - radius * 0.25) / (radius * 0.3);
                        colorR = mix(innerColor, middleColor, t);
                    } else {
                        float t = (distR - radius * 0.55) / (radius * 0.45);
                        colorR = mix(middleColor, outerColor, t);
                    }
                    
                    // Green 채널
                    vec3 colorG;
                    if (distG < radius * 0.25) {
                        colorG = innerColor;
                    } else if (distG < radius * 0.55) {
                        float t = (distG - radius * 0.25) / (radius * 0.3);
                        colorG = mix(innerColor, middleColor, t);
                    } else {
                        float t = (distG - radius * 0.55) / (radius * 0.45);
                        colorG = mix(middleColor, outerColor, t);
                    }
                    
                    // Blue 채널
                    vec3 colorB;
                    if (distB < radius * 0.25) {
                        colorB = innerColor;
                    } else if (distB < radius * 0.55) {
                        float t = (distB - radius * 0.25) / (radius * 0.3);
                        colorB = mix(innerColor, middleColor, t);
                    } else {
                        float t = (distB - radius * 0.55) / (radius * 0.45);
                        colorB = mix(middleColor, outerColor, t);
                    }
                    
                    // 색수차 합성
                    vec3 color = vec3(colorR.r, colorG.g, colorB.b);
                    
                    // ✨ 렌즈 플레어 (Lens Flare) - 외곽에 무지개 링
                    float flareRing = smoothstep(radius * 0.85, radius * 0.9, organicDist) * 
                                     (1.0 - smoothstep(radius * 0.9, radius * 1.0, organicDist));
                    
                    // 무지개 색상 (각도 기반)
                    float angle = atan(dir.y, dir.x);
                    vec3 rainbowColor = vec3(
                        0.5 + 0.5 * sin(angle * 3.0 + uTime * 2.0),
                        0.5 + 0.5 * sin(angle * 3.0 + uTime * 2.0 + 2.094),
                        0.5 + 0.5 * sin(angle * 3.0 + uTime * 2.0 + 4.188)
                    );
                    
                    // 플레어 적용 (미세하게)
                    color = mix(color, rainbowColor, flareRing * 0.3);
                    
                    // 링 형태의 블러: 중심은 투명, 가장자리에만 부드러운 빛
                    float innerFade = smoothstep(radius * 0.15, radius * 0.4, organicDist);
                    float outerFade = 1.0 - smoothstep(radius * 0.55, radius * 0.95, organicDist);
                    float alpha = pow(clamp(innerFade * outerFade, 0.0, 1.0), 1.2);
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            uniforms: {
                uTime: { value: 0 },
                uPulse: { value: 0 }
            }
        })
    }, [])

    
    // ============================================
    // Sunny 애니메이션
    // ============================================
    
    // [Sunny 애니메이션] 맑은 날씨 효과
    const updateSunnyAnimation = (mesh: THREE.InstancedMesh, delta: number, state: any) => {
        // [1] 화면 중앙(0,0) 기준 마우스 월드 좌표
        const mouseX = (state.mouse.x * viewport.width) / 2
        const mouseY = (state.mouse.y * viewport.height) / 2
        
        // [2] 태양 위치 - 중앙 기준 드리프트 + 마우스 추적
        const driftState = sunDriftRef.current
        const mouseDistanceFromCenter = Math.hypot(mouseX, mouseY)
        const isMouseControllingSun = mouseDistanceFromCenter <= SUN_MOUSE_CAPTURE_RADIUS
        if (isMouseControllingSun) {
            let targetX = mouseX
            let targetY = mouseY
            if (mouseDistanceFromCenter > SUN_MOUSE_MAX_OFFSET && mouseDistanceFromCenter > 0.00001) {
                const clampRatio = SUN_MOUSE_MAX_OFFSET / mouseDistanceFromCenter
                targetX *= clampRatio
                targetY *= clampRatio
            }
            const followLerp = 1 - Math.exp(-delta * SUN_MOUSE_FOLLOW_SMOOTHNESS)
            sunStateRef.current.sunX += (targetX - sunStateRef.current.sunX) * followLerp
            sunStateRef.current.sunY += (targetY - sunStateRef.current.sunY) * followLerp
            driftState.current.set(sunStateRef.current.sunX, sunStateRef.current.sunY)
            driftState.target.copy(driftState.current)
            driftState.timer = 0
        } else {
            driftState.timer += delta
            const needsNewTarget = driftState.timer >= driftState.duration || driftState.current.distanceTo(driftState.target) < 0.002
            if (needsNewTarget) {
                driftState.timer = 0
                driftState.duration = SUN_DRIFT_INTERVAL_MIN + Math.random() * (SUN_DRIFT_INTERVAL_MAX - SUN_DRIFT_INTERVAL_MIN)
                const angle = Math.random() * Math.PI * 2
                const radius = SUN_DRIFT_RANGE * (0.4 + Math.random() * 0.6)
                driftState.target.set(Math.cos(angle) * radius, Math.sin(angle) * radius)
            }
            const lerpAlpha = Math.min(1, delta / Math.max(0.0001, driftState.duration))
            driftState.current.lerp(driftState.target, lerpAlpha)
            sunStateRef.current.sunX = driftState.current.x
            sunStateRef.current.sunY = driftState.current.y
        }
        
        // [3] 태양 메쉬 업데이트 - 타일 바로 뒤에서 빛나게 (z=-0.5)
        if (sunMeshRef.current) {
            sunMeshRef.current.position.set(sunStateRef.current.sunX, sunStateRef.current.sunY, -0.5)
            
            // 펄스 애니메이션
            sunStateRef.current.pulsePhase += delta * 2.0
            const pulseValue = Math.sin(sunStateRef.current.pulsePhase) * 0.5 + 0.5
            
            const material = sunMeshRef.current.material as THREE.ShaderMaterial
            material.uniforms.uTime.value += delta
            material.uniforms.uPulse.value = pulseValue
        }
        
        // [4] 타일 렌더링 - 강철판 자석 물리
        
        // [타일 상태 초기화] 처음에만 실행
        if (!tileStatesRef.current) {
            tileStatesRef.current = Array.from({ length: count }, () => ({
                rotX: 0,
                rotY: 0,
                offsetZ: 0
            }))
        }
        
        const tileStates = tileStatesRef.current
        let idx = 0
        
        for (let col = 0; col < cols; col++) {
            for (let row = 0; row < rows; row++) {
                // [타일 중심 좌표] 월드 절대 좌표로 계산하여 마우스와 직접 비교
                const tileWorldX = startX + (col * unitTileSize) + unitTileSize / 2
                const tileWorldY = startY + (row * unitTileSize) + unitTileSize / 2
                
                // 마우스까지의 거리 (월드 좌표계 1:1 비교)
                const dx = mouseX - tileWorldX
                const dy = mouseY - tileWorldY
                const distance = Math.sqrt(dx * dx + dy * dy)
                
                // 목표값 초기화
                let targetRotX = 0
                let targetRotY = 0
                let targetOffsetZ = 0
                
                // 🧲 반응 범위 - 타일 1개 크기
                const maxDistance = unitTileSize * 1.0
                
                // 거리 기반 타일 반응
                if (distance < maxDistance) {
                    // 선형 influence - 단순하게
                    let influence = 1.0 - (distance / maxDistance)
                    
                    // 🛡️ 데드존 적용: 타일 중앙 영역은 회전하지 않음 (강철판 느낌)
                    if (influence < SUNNY_DEAD_ZONE) {
                        influence = 0
                    } else {
                        // 데드존 이후 부드럽게 시작
                        influence = (influence - SUNNY_DEAD_ZONE) / (1.0 - SUNNY_DEAD_ZONE)
                    }
                    
                    // 🔩 마우스 위치에 따른 직접 회전 - 위/아래 분기 처리
                    // Y축 회전: 좌우는 동일하게 (마우스 반대편이 들림)
                    let rawRotY = -(dx / unitTileSize) * SUNNY_TILT_POWER * influence
                    
                    // X축 회전: 위와 아래를 다르게!
                    let rawRotX: number
                    if (dy < 0) {
                        // 마우스가 아래쪽 → 아래 모서리 → 들리는 방향 (양수)
                        rawRotX = (dy / unitTileSize) * SUNNY_TILT_POWER * influence
                    } else {
                        // 마우스가 위쪽 → 위 모서리 → 눌리는 방향 (음수 반전)
                        rawRotX = -(dy / unitTileSize) * SUNNY_TILT_POWER * influence
                    }
                    
                    // 🔒 최대 회전각 제한 - 강철판이 사라지지 않게
                    targetRotY = Math.max(-SUNNY_MAX_ROTATION, Math.min(SUNNY_MAX_ROTATION, rawRotY))
                    targetRotX = Math.max(-SUNNY_MAX_ROTATION, Math.min(SUNNY_MAX_ROTATION, rawRotX))
                    
                    // 🚀 Z축 들림
                    targetOffsetZ = influence * influence * SUNNY_Z_LIFT
                }
                
                /*
                // [원본 로직 - 주석 처리]
                if (distance < maxDistance) {
                    // 🔩 빳be3한 금속 판 회전 - 공격적인 면 전환
                    const influence = 1.0 - (distance / maxDistance)
                    // 스냅 효과: '착' 감기는 순간 가속도
                    const snapInfluence = Math.pow(influence, SUNNY_SNAP_POWER)
                    
                    // 방향 정규화 (마운스가 있는 방향)
                    const normalizedDx = dx / unitTileSize
                    const normalizedDy = dy / unitTileSize
                    
                    // 🎯 공격적인 회전 - 단단한 면 전체가 틀어짐
                    targetRotY = -normalizedDx * snapInfluence * SUNNY_TILT_POWER
                    targetRotX = normalizedDy * snapInfluence * SUNNY_TILT_POWER
                    
                    // 🚀 튜어나오는 Z축 들림 - 사용자 쪽으로!
                    targetOffsetZ = snapInfluence * SUNNY_Z_LIFT
                }
                
                // 마우스가 없으면 targetRotX, targetRotY, targetOffsetZ는 0으로 유지
                
                // 🧲 고강도 자석 물리 - 단순 lerp로 즉각 반응
                const tileState = tileStates[idx]
                
                // 복잡한 스프링 제거, 단순 선형 보간으로 즐각 반응
                const lerpFactor = 0.2 // 20% 속도로 쫀듍하게 반응
                tileState.rotX += (targetRotX - tileState.rotX) * lerpFactor
                tileState.rotY += (targetRotY - tileState.rotY) * lerpFactor
                tileState.offsetZ += (targetOffsetZ - tileState.offsetZ) * lerpFactor
                */
                
                // 🧲 단순 lerp - 마우스 속도 무관
                const tileState = tileStates[idx]
                
                // 마우스 위에 있을 때는 느리게, 떠날 때는 빠르게
                const isMouseOver = distance < maxDistance
                const lerpSpeed = isMouseOver ? 0.12 : 0.35
                
                // 직접 lerp (velocity 누적 없음)
                tileState.rotX += (targetRotX - tileState.rotX) * lerpSpeed
                tileState.rotY += (targetRotY - tileState.rotY) * lerpSpeed
                tileState.offsetZ += (targetOffsetZ - tileState.offsetZ) * lerpSpeed
                
                // 작은 값 제거 (떨림 방지)
                if (Math.abs(tileState.rotX) < 0.0001) tileState.rotX = 0
                if (Math.abs(tileState.rotY) < 0.0001) tileState.rotY = 0
                if (Math.abs(tileState.offsetZ) < 0.01) tileState.offsetZ = 0
                
                // [수동 행렬] compose() 메서드로 중앙 축 회전 보장
                const finalMatrix = new THREE.Matrix4()
                
                // position: 타일의 월드 절대 좌표
                const position = new THREE.Vector3(
                    tileWorldX,
                    tileWorldY,
                    0.1 + tileState.offsetZ
                )
                
                // quaternion: 회전 (Euler를 Quaternion으로 변환)
                const euler = new THREE.Euler(tileState.rotX, tileState.rotY, 0, 'XYZ')
                const quaternion = new THREE.Quaternion().setFromEuler(euler)
                
                // scale: 타일 크기
                const scale = new THREE.Vector3(tileWorldSize, tileWorldSize, 1)
                
                // compose로 중앙 축 회전 보장 (빳빳한 금속판 질감)
                finalMatrix.compose(position, quaternion, scale)
                
                mesh.setMatrixAt(idx, finalMatrix)
                
                idx++
            }
        }
        
        mesh.instanceMatrix.needsUpdate = true
    }

    return (
        <>
            {/* 태양 레이어 (z=-0.5 타일 바로 뒤에서 빛나게) */}
            <mesh 
                ref={sunMeshRef} 
                position={[0, 0, -0.5]}
            >
                <circleGeometry args={[viewport.width * 0.26, 60]} />
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
    tileColor = '#f7f7f7',
    backgroundColor = '#e3e3e3',
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
