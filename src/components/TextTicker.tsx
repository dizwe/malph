import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, type Variants } from 'framer-motion'
import '../pages/Home.css'

const texts = [
    "MALPH Works",
    "Malcolm UIUX",
    "Ralph Dev",
    "Malcolm BX",
    "Ralph Builds",
    "Dreamt Works"
]

/* 
===========================================================================
[보관용 코드] 글리치 (Glitch) 효과 - 미디어 아트 극대화 버전
- 날씨 API 연동 시 사용 예정 (예: 'Thunderstorm', 'Rain' 등)
- RGB Split, Clip-path Slicing, Pseudo-elements Ghosting
===========================================================================

// GlitchChar: 미디어 아트 수준의 극강 글리치 효과
const GlitchChar_BACKUP: React.FC<{ char: string; index: number; sentenceIndex: number }> = ({ char, index, sentenceIndex }) => {
    // [랜덤 딜레이] 0~0.5초 사이 랜덤 (더 긴 범위로 불규칙성 증가)
    const randomDelay = Math.random() * 0.5
    
    // [Clip-path 슬라이싱] 5개 조각으로 나누기 (0%, 20%, 40%, 60%, 80%, 100%)
    const slices = [
        'inset(0% 0% 80% 0%)',    // 상단 20%
        'inset(20% 0% 60% 0%)',   // 두번째 조각
        'inset(40% 0% 40% 0%)',   // 중간 조각
        'inset(60% 0% 20% 0%)',   // 네번째 조각
        'inset(80% 0% 0% 0%)',    // 하단 20%
    ]
    
    // 글리치 효과 정의
    const glitchVariants: Variants = {
        hidden: { opacity: 0, y: 0, skewX: 0, x: 0 },
        visible: () => ({
            opacity: 1,
            y: 0,
            skewX: 0,
            x: 0,
            textShadow: "0px 0px 0px rgba(0,0,0,0)",
            transition: {
                delay: randomDelay,
                duration: 0.001
            }
        }),
        glitch: () => ({
            // [깜빡임 강도] 더욱 극단적으로 (0.2까지 떨어짐)
            opacity: [1, 0.4, 1, 0.6, 0.2, 1, 0.8, 1],
            
            // [비틀림 강도] 극대화 (-35 ~ +35도)
            skewX: [0, 35, -30, 20, -35, 15, -10, 0],
            
            // [위아래 떨림] 강화 (-10 ~ +10px)
            y: [0, -8, 10, -5, 8, -3, 2, 0],
            
            // [좌우 떨림] 강화 (-12 ~ +12px)
            x: [0, 10, -12, 8, -6, 10, -4, 0],
            
            // [RGB Split 극대화] 5~10px 분리, 더 강한 색상
            textShadow: [
                "0px 0px 0px rgba(0,0,0,0)",
                "-8px 0px 0px rgba(255,0,0,0.9), 8px 0px 0px rgba(0,255,255,0.9)", // 극강 RGB Split
                "10px 3px 0px rgba(255,0,0,0.95), -7px -3px 0px rgba(0,255,255,0.95)",
                "-6px 2px 0px rgba(255,0,0,0.85), 9px -2px 0px rgba(0,255,255,0.85)",
                "7px -1px 0px rgba(255,0,0,0.8), -8px 1px 0px rgba(0,255,255,0.8)",
                "-5px 0px 0px rgba(255,0,0,0.7), 6px 0px 0px rgba(0,255,255,0.7)",
                "3px 1px 0px rgba(255,0,0,0.6), -4px -1px 0px rgba(0,255,255,0.6)",
                "0px 0px 0px rgba(0,0,0,0)"
            ],
            
            // [Clip-path Slicing] 조각들이 제각각 움직이는 효과
            clipPath: [
                'inset(0% 0% 0% 0%)',
                slices[Math.floor(Math.random() * 5)],
                slices[Math.floor(Math.random() * 5)],
                slices[Math.floor(Math.random() * 5)],
                'inset(0% 0% 0% 0%)',
                slices[Math.floor(Math.random() * 5)],
                'inset(0% 0% 0% 0%)',
            ],
            
            transition: {
                delay: randomDelay,
                // [단발적 글리치] 짧고 강렬하게 한 번만 실행
                duration: 0.15, // 0.3초로 짧게
                times: [0, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 1.0], // 더 빠른 리듬
                ease: "linear",
            }
        })
    }

    return (
        <span style={{
            display: 'inline-block',
            minWidth: char === ' ' ? '0.3em' : 'auto',
            whiteSpace: 'pre',
            verticalAlign: 'bottom',
            position: 'relative',
        }}>
            <motion.span
                key={`${char}-${sentenceIndex}`}
                custom={index}
                initial="hidden"
                animate={["visible", "glitch"]}
                variants={glitchVariants}
                onAnimationComplete={() => {
                    // 글리치 애니메이션 완료 후 클래스 제거하여 잔상 효과 종료
                }}
                style={{ 
                    display: 'inline-block',
                    position: 'relative',
                }}
                className={`glitch-char glitch-active-${sentenceIndex}`}
                data-text={char}
            >
                {char}
            </motion.span>
        </span>
    )
}

========================================================================== */

/* 
===========================================================================
[보관용 코드] 무중력 일렁임 (Floating Skew) - Windy 날씨용
// WindyChar: 바람에 날리는 듯한 사인파 부유 효과 + 마우스 인터랙션
const WindyChar: React.FC<{ 
    char: string;
    sentenceIndex: number;
    mouseX: any;
    mouseY: any;
}> = ({ char, sentenceIndex, mouseX, mouseY }) => {
    const charRef = useRef<HTMLSpanElement>(null)
    
    // [마우스 반응] 실제 DOM 위치를 한 번만 저장 (floating 중에도 이 기준 위치 사용)
    const [basePosition, setBasePosition] = useState({ x: 0, y: 0 })
    
    useEffect(() => {
        // visible 애니메이션이 종료된 후 한 번만 위치 저장
        const timer = setTimeout(() => {
            if (charRef.current) {
                const rect = charRef.current.getBoundingClientRect()
                setBasePosition({
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2
                })
            }
        }, 1200) // visible 애니메이션 1초 + 여유 0.2초
        
        return () => clearTimeout(timer)
    }, [sentenceIndex]) // sentenceIndex가 바꽈 때마다 새로 계산
    
    // [Push Away 효과] 마우스 반대 방향으로 밀림
    const pushX = useTransform([mouseX], ([mx]) => {
        if (basePosition.x === 0) return 0
        const dx = basePosition.x - (mx as number)
        const dist = Math.sqrt(dx * dx)
        if (dist > 40 || dist === 0 || !isFinite(dist)) return 0
        return (dx / dist) * 100 * (1 - dist / 200)
    })
    
    const pushY = useTransform([mouseY], ([my]) => {
        if (basePosition.y === 0) return 0
        const dy = basePosition.y - (my as number)
        const dist = Math.sqrt(dy * dy)
        if (dist > 40 || dist === 0 || !isFinite(dist)) return 0
        return (dy / dist) * 0 * (1 - dist / 200)
    })
    
    // [회전 효과] Y축 회전
    const rotateY = useTransform([mouseX], ([mx]) => {
        if (basePosition.x === 0) return 0
        const dx = (mx as number) - basePosition.x
        if (Math.abs(dx) > 100 || !isFinite(dx)) return 0
        return dx * 0.1
    })
    
    // [스프링으로 부드럽게]
    const smoothPushX = useSpring(pushX, { stiffness: 200, damping: 50 })
    const smoothPushY = useSpring(pushY, { stiffness: 200, damping: 50 })
    const smoothRotateY = useSpring(rotateY, { stiffness: 100, damping: 80 })
    
    // [바람 강도] 랜덤으로 바람의 세기 결정 (0.7~1.3)
    const windStrength = 1 + Math.random() * 3
    
    // [랜덤 딜레이] 순차가 아닌 완전 랜덤으로 (무중력 느낌)
    const randomDelay = Math.random() * 0.8
    
    // [랜덤 Skew 범위] -5deg ~ 10deg
    const randomSkew = -5 + Math.random() * 15
    
    // [랜덤 시작 위치] 화면 여러 곳에서 떠오르는 느낌
    const randomStartY = -30 + Math.random() * 60 // -30 ~ 30
    const randomStartX = -40 + Math.random() * 80 // -40 ~ 40
    const randomStartSkew = -15 + Math.random() * 30 // -15 ~ 15
    
    const windyVariants: Variants = {
        // [랜덤 시작] 화면 곳곳에서 페이드인
        hidden: { 
            opacity: 0, 
            y: randomStartY, 
            x: randomStartX,
            skewX: randomStartSkew,
        },
        // [자연스러운 등장] 랜덤 딜레이로 제멋대로 나타남
        visible: {
            opacity: 1,
            y: 0,
            x: 0,
            skewX: 0,
            transition: {
                delay: randomDelay,
                duration: 1,
                ease: "easeOut"
            }
        },
        // [사인파 부유] 무한 반복되는 위아래 + 좌우 일렁임
        floating: {
            y: [0, -2 * windStrength, 0, 2 * windStrength, 0],
            x: [0, 7 * windStrength, 0, -1 * windStrength, 0],
            skewX: [0, randomSkew * 0.3, 0, -randomSkew * 0.2, 0],
            transition: {
                delay: randomDelay,
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                repeatType: "loop",
                ease: "linear",
            }
        },
        // [Exit: 지속적인 움직임 + 페이드아웃] 투명해진 후에도 계속 움직임
        exit: {
            opacity: [null, null, 0.7, 0.4, 0.2, 0, 0, 0],
            y: [
                null, 
                null, 
                -1 * windStrength, 
                0.5 * windStrength, 
                -0.3 * windStrength,
                0.8 * windStrength,
                -1.2 * windStrength,
                2 * windStrength
            ],
            x: [
                null, 
                null, 
                0.5 * windStrength, 
                -0.3 * windStrength, 
                0.5 * windStrength,
                -0.8 * windStrength,
                1 * windStrength,
                -1.5 * windStrength
            ],
            skewX: [
                null, 
                null, 
                randomSkew * 0.05, 
                -randomSkew * 0.03, 
                randomSkew * 0.04,
                -randomSkew * 0.06,
                randomSkew * 0.08,
                0
            ],
            transition: {
                delay: 0,
                duration: 4.0,
                ease: "linear",
                times: [0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.8, 1.0]
            }
        }
    }

    return (
        <span
            ref={charRef}
            style={{
                display: 'inline-block',
                minWidth: char === ' ' ? '0.3em' : 'auto',
                whiteSpace: 'pre',
                verticalAlign: 'bottom',
            }}
        >
            <motion.span
                key={`${char}-${sentenceIndex}`}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={windyVariants}
                style={{ 
                    display: 'inline-block',
                    willChange: 'transform',
                }}
            >
                <motion.span
                    animate="floating"
                    variants={windyVariants}
                    style={{ 
                        display: 'inline-block',
                        x: smoothPushX,
                        y: smoothPushY,
                        rotateY: smoothRotateY,
                    }}
                >
                    {char}
                </motion.span>
            </motion.span>
        </span>
    )
}
===========================================================================
*/

// [현재 적용된 효과] 글리치 (Glitch) 효과
const GlitchChar: React.FC<{ char: string; index: number; sentenceIndex: number }> = ({ char, index, sentenceIndex }) => {
    // [랜덤 딜레이] 0~0.5초 사이 랜덤 (더 긴 범위로 불규칙성 증가)
    const randomDelay = Math.random() * 0.5
    
    // [Clip-path 슬라이싱] 5개 조각으로 나누기 (0%, 20%, 40%, 60%, 80%, 100%)
    const slices = [
        'inset(0% 0% 80% 0%)',    // 상단 20%
        'inset(20% 0% 60% 0%)',   // 두번째 조각
        'inset(40% 0% 40% 0%)',   // 중간 조각
        'inset(60% 0% 20% 0%)',   // 네번째 조각
        'inset(80% 0% 0% 0%)',    // 하단 20%
    ]
    
    // 글리치 효과 정의
    const glitchVariants: Variants = {
        hidden: { opacity: 0, y: 0, skewX: 0, x: 0 },
        visible: () => ({
            opacity: 1,
            y: 0,
            skewX: 0,
            x: 0,
            textShadow: "0px 0px 0px rgba(0,0,0,0)",
            transition: {
                delay: randomDelay,
                duration: 0.001
            }
        }),
        glitch: () => ({
            // [깜빡임 강도] 더욱 극단적으로 (0.2까지 떨어짐)
            opacity: [1, 0.4, 1, 0.6, 0.2, 1, 0.8, 1],
            
            // [비틀림 강도] 극대화 (-35 ~ +35도)
            skewX: [0, 35, -30, 20, -35, 15, -10, 0],
            
            // [위아래 떨림] 강화 (-10 ~ +10px)
            y: [0, -8, 10, -5, 8, -3, 2, 0],
            
            // [좌우 떨림] 강화 (-12 ~ +12px)
            x: [0, 10, -12, 8, -6, 10, -4, 0],
            
            // [RGB Split 극대화] 5~10px 분리, 더 강한 색상
            textShadow: [
                "0px 0px 0px rgba(0,0,0,0)",
                "-8px 0px 0px rgba(255,0,0,0.9), 8px 0px 0px rgba(0,255,255,0.9)", // 극강 RGB Split
                "10px 3px 0px rgba(255,0,0,0.95), -7px -3px 0px rgba(0,255,255,0.95)",
                "-6px 2px 0px rgba(255,0,0,0.85), 9px -2px 0px rgba(0,255,255,0.85)",
                "7px -1px 0px rgba(255,0,0,0.8), -8px 1px 0px rgba(0,255,255,0.8)",
                "-5px 0px 0px rgba(255,0,0,0.7), 6px 0px 0px rgba(0,255,255,0.7)",
                "3px 1px 0px rgba(255,0,0,0.6), -4px -1px 0px rgba(0,255,255,0.6)",
                "0px 0px 0px rgba(0,0,0,0)"
            ],
            
            // [Clip-path Slicing] 조각들이 제각각 움직이는 효과
            clipPath: [
                'inset(0% 0% 0% 0%)',
                slices[Math.floor(Math.random() * 5)],
                slices[Math.floor(Math.random() * 5)],
                slices[Math.floor(Math.random() * 5)],
                'inset(0% 0% 0% 0%)',
                slices[Math.floor(Math.random() * 5)],
                'inset(0% 0% 0% 0%)',
            ],
            
            transition: {
                delay: randomDelay,
                // [단발적 글리치] 짧고 강렬하게 한 번만 실행
                duration: 0.15, // 0.3초로 짧게
                times: [0, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 1.0], // 더 빠른 리듬
                ease: "linear",
            }
        })
    }

    return (
        <span style={{
            display: 'inline-block',
            minWidth: char === ' ' ? '0.3em' : 'auto',
            whiteSpace: 'pre',
            verticalAlign: 'bottom',
            position: 'relative',
        }}>
            <motion.span
                key={`${char}-${sentenceIndex}`}
                custom={index}
                initial="hidden"
                animate={["visible", "glitch"]}
                variants={glitchVariants}
                onAnimationComplete={() => {
                    // 글리치 애니메이션 완료 후 클래스 제거하여 잔상 효과 종료
                }}
                style={{ 
                    display: 'inline-block',
                    position: 'relative',
                }}
                className={`glitch-char glitch-active-${sentenceIndex}`}
                data-text={char}
            >
                {char}
            </motion.span>
        </span>
    )
}

const TextTicker: React.FC = () => {
    const [index, setIndex] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % texts.length)
        }, 8000) // [변환 주기] 5초마다 변경

        return () => clearInterval(timer)
    }, [])

    const currentChars = texts[index].split('')

    return (
        <div 
            className="malph-works" 
            style={{
                overflow: 'visible',
                height: '1.2em',
                display: 'flex',
                alignItems: 'flex-end',
                position: 'fixed',
                bottom: '30px',
                left: '30px',
                width: 'calc(100% - 60px)',
                pointerEvents: 'none',
                zIndex: 999
            }}
        >
            <AnimatePresence mode="sync">
                <div
                    key={index}
                    style={{
                        position: 'absolute',
                        left: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'flex-end'
                    }}
                    aria-label={texts[index]}
                >
                    {currentChars.map((char, i) => (
                        <GlitchChar 
                            key={`${char}-${i}-${index}`} 
                            char={char}
                            index={i}
                            sentenceIndex={index}
                        />
                    ))}
                </div>
            </AnimatePresence>
        </div>
    )
}

export default TextTicker

/* 
===========================================================================
[보관용 코드] 스크램블 (Scramble) 효과
- 왼쪽부터 오른쪽으로 순차적으로 문자가 랜덤하게 바뀌는 효과
- 날씨나 상황에 따라 효과를 교체하고 싶을 때 사용하세요.
===========================================================================

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

const ScrambleChar: React.FC<{ char: string; index: number }> = ({ char, index }) => {
    const [displayChar, setDisplayChar] = useState(char)
    const timeoutRef = useRef<number | null>(null)
    const countRef = useRef(0)

    useEffect(() => {
        countRef.current = 0
        if (char === ' ') {
            setDisplayChar('\u00A0')
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            return
        }
        if (timeoutRef.current) clearTimeout(timeoutRef.current)

        // [웨이브 속도] 낮을수록 빠름 / 높을수록 느림 (기본 300)
        const startDelay = index * 300

        const startScramble = () => {
            setDisplayChar(letters[Math.floor(Math.random() * letters.length)])
            const runScramble = () => {
                // [속도 조절] 50: 기본속도, 20: 텐션
                const delay = 50 + (countRef.current * 20)
                timeoutRef.current = window.setTimeout(() => {
                    countRef.current++
                    if (countRef.current > 12) {
                        setDisplayChar(char)
                    } else {
                        setDisplayChar(letters[Math.floor(Math.random() * letters.length)])
                        runScramble()
                    }
                }, delay)
            }
            runScramble()
        }
        
        timeoutRef.current = window.setTimeout(startScramble, startDelay)
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [char, index])

    return (
        <span style={{ display: 'inline-block', whiteSpace: 'pre' }}>
            <motion.span
                key={displayChar}
                initial={{ opacity: 0.5, filter: "blur(1px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.4 }}
                style={{ display: 'inline-block' }}
            >
                {displayChar}
            </motion.span>
        </span>
    )
}

// ScrambleChar를 사용하는 TextTicker 버전
// const TextTickerScramble: React.FC = () => {
//     ... (ScrambleChar 사용 부분) ...
//     {currentChars.map((char, i) => (
//          <motion.span key={i} style={{ display: 'inline-block' }}>
//              <ScrambleChar char={char} index={i} />
//          </motion.span>
//     ))}
//     ...
// }
*/
