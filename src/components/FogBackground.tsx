import React, { useRef, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface FogBackgroundProps {
    unitTileSize: number
}

const FogBackground: React.FC<FogBackgroundProps> = ({ unitTileSize }) => {
    const { viewport } = useThree()
    const meshRef = useRef<THREE.Mesh>(null)

    // 스무스한 마우스 추적을 위한 상태
    const smoothMouseRef = useRef(new THREE.Vector2(9999, 9999))

    // ===== 안개 배경 파라미터 =====
    // [드리프트 애니메이션]
    const FOG_DRIFT_SPEED_X = 0.020   // X축 흐름 속도 (0.005~0.02) - 매우 느리게
    const FOG_DRIFT_SPEED_Y = 0.021   // Y축 흐름 속도 (0.005~0.02) - 매우 느리게
    const FOG_ROTATION_SPEED = 0.03  // 회전 속도 (0.002~0.01) - 거의 정적

    // [노이즈 패턴 - 거대한 구름]
    const FOG_NOISE_SCALE = 1.5       // 노이즈 크기 (0.5~2.0, 작을수록 거대한 구름)
    const FOG_OCTAVES = 4             // FBM 옥타브 수 (2~4, 적을수록 뭉쳐 보임)
    const FOG_CONTRAST = 2.5          // 대비 강도 (1.0~2.5, 높을수록 짙은 구름)

    // [색상]
    const FOG_BASE_COLOR = '#f0f0f0'  // 기본색 (밝은 안개)
    const FOG_DARK_COLOR = '#d8d8d8'  // 안개색 (더 어둡고 묵직한 구름)
    const FOG_CLEAR_COLOR = '#ebebeb' // 깨끗한 배경색 (마우스 영역)

    // [마우스 인터랙션]
    const FOG_CLEAR_RADIUS = unitTileSize * 1.5  // 마우스 영향 반경 (2.0~5.0)
    const FOG_CLEAR_SMOOTHNESS = 0.5  // 클리어 존 부드러움 (0.3~0.7, 작을수록 날카로움)
    const FOG_MOUSE_FOLLOW_SPEED = 3.0  // 마우스 추적 속도 (1.0~10.0, 작을수록 느림)
    // ================================

    // 셰이더 머티리얼
    const fogShaderMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            transparent: false,
            depthWrite: true,
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector2(9999, 9999) }, // 초기값: 화면 밖
                uResolution: { value: new THREE.Vector2(viewport.width, viewport.height) },
                uClearRadius: { value: FOG_CLEAR_RADIUS },
                uNoiseScale: { value: FOG_NOISE_SCALE },
                uBaseColor: { value: new THREE.Color(FOG_BASE_COLOR) },
                uDarkColor: { value: new THREE.Color(FOG_DARK_COLOR) },
                uClearColor: { value: new THREE.Color(FOG_CLEAR_COLOR) }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vWorldPosition;
                
                void main() {
                    vUv = uv;
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * viewMatrix * worldPosition;
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform vec2 uMouse;
                uniform vec2 uResolution;
                uniform float uClearRadius;
                uniform float uNoiseScale;
                uniform vec3 uBaseColor;
                uniform vec3 uDarkColor;
                uniform vec3 uClearColor;
                
                varying vec2 vUv;
                varying vec3 vWorldPosition;
                
                // Simplex 2D 노이즈 함수
                vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
                
                float snoise(vec2 v) {
                    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                                       -0.577350269189626, 0.024390243902439);
                    vec2 i  = floor(v + dot(v, C.yy) );
                    vec2 x0 = v -   i + dot(i, C.xx);
                    vec2 i1;
                    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                    vec4 x12 = x0.xyxy + C.xxzz;
                    x12.xy -= i1;
                    i = mod(i, 289.0);
                    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                    + i.x + vec3(0.0, i1.x, 1.0 ));
                    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                      dot(x12.zw,x12.zw)), 0.0);
                    m = m*m ;
                    m = m*m ;
                    vec3 x = 2.0 * fract(p * C.www) - 1.0;
                    vec3 h = abs(x) - 0.5;
                    vec3 ox = floor(x + 0.5);
                    vec3 a0 = x - ox;
                    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                    vec3 g;
                    g.x  = a0.x  * x0.x  + h.x  * x0.y;
                    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                    return 130.0 * dot(m, g);
                }
                
                // FBM (Fractional Brownian Motion) - 거대한 구름 덩어리
                float fbm(vec2 st) {
                    float value = 0.0;
                    float amplitude = 0.5;  // 더 강한 진폭
                    float frequency = 1.0;  // 더 낮은 주파수 (큰 패턴)
                    
                    // 3개 옥타브 - 뭉쳐 보이게
                    for (int i = 0; i < 3; i++) {
                    value += amplitude * snoise(st);
                    st *= 2.0;      // 주파수 증가
                    amplitude *= 0.5; // 진폭 감소
                    }
                    
                    return value;
                }
                
                // 2D 회전 매트릭스
                mat2 rotate2d(float angle) {
                    float s = sin(angle);
                    float c = cos(angle);
                    return mat2(c, -s, s, c);
                }
                
                void main() {
                    // 1. 드리프트 애니메이션 - 매우 천천히 흐르는 안개
                    vec2 driftUv = vUv * 1.0;
                    driftUv += vec2(uTime * 0.05, uTime * 0.04);
                    driftUv = rotate2d(uTime * 0.009) * driftUv;
                    
                    // 2. FBM 노이즈로 거대한 구름 패턴 생성
                    float noiseValue = fbm(driftUv);
                    noiseValue = noiseValue * 0.5 + 0.5; // 0~1 범위로 정규화
                    
                    // 3. 대비 강화 - 구름이 더 묵직하게
                    float originalNoise = noiseValue;
                    noiseValue = pow(noiseValue, 2.5);
                    noiseValue = smoothstep(0.35, 0.65, noiseValue);
                    
                    // 4. 마우스 인터랙션 - 불규칙한 마스크 (손으로 닦아내는 느낌)
                    // 마스크용 노이즈 (더 큰 스케일로 불규칙한 경계)
                    vec2 maskNoiseUv = vWorldPosition.xy * 0.3;
                    float maskNoise = fbm(maskNoiseUv) * 0.5 + 0.5;
                    
                    // 거리 계산에 노이즈 왜곡 추가
                    float distToMouse = distance(vWorldPosition.xy, uMouse);
                    float distortedDist = distToMouse + (maskNoise - 0.5) * uClearRadius * 0.4;
                    
                    // 경계를 2배 더 넓게 (부드러운 페이드)
                    float clearMask = smoothstep(uClearRadius * 2.0, uClearRadius * 0.3, distortedDist);
                    
                    // 5. 안개 농도 조절 (빛이 아닌 안개만 걷힘)
                    // clearMask가 높을수록 대비와 농도를 낮춤
                    float adjustedContrast = mix(3.5, 1.0, clearMask); // 대비 감소
                    float adjustedNoise = pow(originalNoise, adjustedContrast);
                    adjustedNoise = smoothstep(0.35, 0.65, adjustedNoise);
                    
                    // 6. 기본색과 안개색 블렌딩
                    vec3 fogColor = mix(uDarkColor, uBaseColor, adjustedNoise);
                    
                    // 7. 최종 색상 (단색이 아닌 안개 패턴 유지)
                    vec3 finalColor = fogColor;
                    
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `
        })
    }, [viewport.width, viewport.height, FOG_CLEAR_RADIUS, FOG_NOISE_SCALE, FOG_BASE_COLOR, FOG_DARK_COLOR, FOG_CLEAR_COLOR])

    // 애니메이션 루프
    useFrame((state, delta) => {
        if (!meshRef.current) return

        const material = meshRef.current.material as THREE.ShaderMaterial

        // 시간 업데이트
        material.uniforms.uTime.value += delta

        // 실제 마우스 좌표 (viewport 좌표계)
        const targetMouseX = (state.mouse.x * viewport.width) / 2
        const targetMouseY = (state.mouse.y * viewport.height) / 2

        // 스무스하게 따라가는 마우스 좌표 (lerp)
        smoothMouseRef.current.x = THREE.MathUtils.lerp(
            smoothMouseRef.current.x,
            targetMouseX,
            delta * FOG_MOUSE_FOLLOW_SPEED
        )
        smoothMouseRef.current.y = THREE.MathUtils.lerp(
            smoothMouseRef.current.y,
            targetMouseY,
            delta * FOG_MOUSE_FOLLOW_SPEED
        )

        // 스무스한 마우스 좌표를 셰이더에 전달
        material.uniforms.uMouse.value.set(smoothMouseRef.current.x, smoothMouseRef.current.y)

        // 해상도 업데이트 (리사이즈 대응)
        material.uniforms.uResolution.value.set(viewport.width, viewport.height)
    })

    return (
        <mesh ref={meshRef} position={[0, 0, -1]}>
            <planeGeometry args={[viewport.width * 1.2, viewport.height * 1.2]} />
            <primitive object={fogShaderMaterial} attach="material" />
        </mesh>
    )
}

export default FogBackground
