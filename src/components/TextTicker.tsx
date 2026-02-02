import React, { useState, useEffect } from 'react'
import { motion, type Variants } from 'framer-motion'
import '../pages/Home.css'

const texts = [
    "MALPH Works",
    "Malcolm UIUX",
    "Ralph Dev",
    "Malcolm BX",
    "Ralph Builds",
    "Dreamt Works"
]

// [현재 적용된 효과] 글리치 (Glitch)
// GlitchChar: 글자가 바뀔 때 치직거리는(Glitch) 효과를 줌
const GlitchChar: React.FC<{ char: string; index: number; sentenceIndex: number }> = ({ char, index, sentenceIndex }) => {
    // 글리치 효과 정의
    const glitchVariants: Variants = {
        hidden: { opacity: 0, y: 0, skewX: 0 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            skewX: 0,
            textShadow: "0px 0px 0px rgba(0,0,0,0)",
            transition: {
                delay: i * 0.08, // [웨이브 속도] 등장 딜레이
                duration: 0.01
            }
        }),
        glitch: (i: number) => ({
            opacity: [1, 0.8, 1, 0.9, 0.5, 1],
            skewX: [0, 20, -20, 10, -5, 0], // 비틀기
            y: [0, -3, 3, -1, 0], // 위아래 떨림
            x: [0, 2, -2, 1, 0], // 좌우 떨림
            textShadow: [
                "0px 0px 0px rgba(0,0,0,0)",
                "-2px 0px 0px rgba(255,0,0,0.7), 2px 0px 0px rgba(0,255,255,0.7)", // RGB Split
                "2px 1px 0px rgba(255,0,0,0.7), -1px -1px 0px rgba(0,255,255,0.7)",
                "0px 0px 0px rgba(0,0,0,0)"
            ],
            transition: {
                delay: i * 0.08, // [웨이브 속도] 글리치 시작 딜레이 (등장과 동기화)
                duration: 0.3, // 짧고 강렬하게
                ease: "linear",
            }
        })
    }

    return (
        <span style={{
            display: 'inline-block',
            minWidth: char === ' ' ? '0.3em' : 'auto', // 공백 너비 확보
            whiteSpace: 'pre',
            verticalAlign: 'bottom'
        }}>
            <motion.span
                key={`${char}-${sentenceIndex}`}
                custom={index} // Dynamic variants를 위해 index 전달
                initial="hidden"
                animate={["visible", "glitch"]} // 나타나면서 동시에 글리치 실행
                variants={glitchVariants}
                style={{ display: 'inline-block' }}
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
        }, 5000) // [변환 주기] 5초마다 변경

        return () => clearInterval(timer)
    }, [])

    const currentChars = texts[index].split('')

    return (
        <div className="malph-works" style={{
            overflow: 'hidden',
            height: '1.2em',
            display: 'flex',
            alignItems: 'flex-end',
            position: 'fixed',
            bottom: '30px',
            left: '30px',
            width: 'calc(100% - 60px)',
            pointerEvents: 'none',
            zIndex: 999
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-end' }} aria-label={texts[index]}>
                {currentChars.map((char, i) => (
                    // map id를 index로 고정하여 불필요한 리마운트 방지
                    <GlitchChar key={i} char={char} index={i} sentenceIndex={index} />
                ))}
            </div>
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
