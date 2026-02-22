import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import logoX from '../assets/logo_x.svg'
import logoXwh from '../assets/logo_x_wh.svg'

interface LoadingScreenProps {
    onLoadingComplete: () => void
    minDuration?: number
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadingComplete, minDuration = 1500 }) => {
    const [progress, setProgress] = useState(0)
    const [gridSegments, setGridSegments] = useState<{
        type: 'h' | 'v',
        fixedPos: number,
        startPos: number,
        length: number,
        id: number,
        origin: string
    }[]>([])
    const [sentenceIndex, setSentenceIndex] = useState(0)

    const sentences = [
        "how's where you are",
        "Malcolm X Ralph"
    ]

    // 초기 그리드 조각 계산
    useEffect(() => {
        const segments: { type: 'h' | 'v', fixedPos: number, startPos: number, length: number, id: number, origin: string }[] = []
        const gridSpacing = 240
        const segmentLength = 60
        const width = window.innerWidth
        const height = window.innerHeight

        let id = 0
        const hOrigins = ['left', 'right']
        const vOrigins = ['top', 'bottom']

        for (let y = 0; y <= height; y += gridSpacing) {
            for (let x = 0; x < width; x += segmentLength) {
                segments.push({
                    type: 'h',
                    fixedPos: y,
                    startPos: x,
                    length: Math.min(segmentLength, width - x),
                    id: id++,
                    origin: hOrigins[Math.floor(Math.random() * 2)]
                })
            }
        }

        for (let x = 0; x <= width; x += gridSpacing) {
            for (let y = 0; y < height; y += segmentLength) {
                segments.push({
                    type: 'v',
                    fixedPos: x,
                    startPos: y,
                    length: Math.min(segmentLength, height - y),
                    id: id++,
                    origin: vOrigins[Math.floor(Math.random() * 2)]
                })
            }
        }

        const shuffled = [...segments].sort(() => Math.random() - 0.5)
        setGridSegments(shuffled)
    }, [])

    useEffect(() => {
        const startTime = Date.now()

        const updateProgress = () => {
            const currentTime = Date.now()
            const elapsed = currentTime - startTime

            // t = 0 ~ 1 사이의 선형 비율
            const t = Math.min(elapsed / minDuration, 1)

            // 가속도 적용 (Ease-in): 처음엔 느리고 갈수록 빨라짐
            // Math.pow(t, 1.7)을 통해 자연스러운 가속감 구현
            const easedT = Math.pow(t, 1.7)
            const nextProgress = Math.min(Math.floor(easedT * 100), 100)

            setProgress(nextProgress)

            if (nextProgress < 100) {
                requestAnimationFrame(updateProgress)
            } else {
                setTimeout(onLoadingComplete, 1000)
            }
        }

        const animationId = requestAnimationFrame(updateProgress)
        return () => cancelAnimationFrame(animationId)
    }, [minDuration, onLoadingComplete])

    // 문구 사이클링 로직
    useEffect(() => {
        const timer = setInterval(() => {
            setSentenceIndex((prev) => (prev + 1) % sentences.length)
        }, 2500) // 3초마다 문구 교체 (애니메이션 시간 고려)

        return () => clearInterval(timer)
    }, [sentences.length])

    const visibleSegmentsCount = Math.floor((progress / 100) * gridSegments.length)
    const currentSegments = gridSegments.slice(0, visibleSegmentsCount)

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: '#222222',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#f7f7f7',
                fontFamily: "'MuseoModerno', sans-serif",
                userSelect: 'none',
                overflow: 'hidden'
            }}
        >
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {currentSegments.map(seg => (
                    <motion.div
                        key={seg.id}
                        initial={seg.type === 'h' ? { scaleX: 0, opacity: 0 } : { scaleY: 0, opacity: 0 }}
                        animate={seg.type === 'h' ? { scaleX: 1, opacity: 1 } : { scaleY: 1, opacity: 1 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        style={{
                            position: 'absolute',
                            backgroundColor: '#343434',
                            transformOrigin: seg.origin,
                            ...(seg.type === 'h' ? {
                                top: seg.fixedPos,
                                left: seg.startPos,
                                width: seg.length,
                                height: '1px'
                            } : {
                                left: seg.fixedPos,
                                top: seg.startPos,
                                height: seg.length,
                                width: '1px'
                            })
                        }}
                    />
                ))}
            </div>

            <div style={{ height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={sentenceIndex}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.08
                                }
                            },
                            exit: {
                                opacity: 0,
                                transition: { duration: 0.5 }
                            }
                        }}
                        style={{
                            fontSize: '24px',
                            fontWeight: 300,
                            letterSpacing: '0',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        {sentences[sentenceIndex].split("").map((char, index) => {
                            if (char === 'X' && sentences[sentenceIndex].includes("Malcolm X")) {
                                return (
                                    <motion.span
                                        key={index}
                                        variants={{
                                            hidden: { opacity: 0, y: 8 },
                                            visible: { opacity: 1, y: 0 }
                                        }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        style={{ display: 'inline-flex', alignItems: 'center', margin: '0 1px' }}
                                    >
                                        <img src={logoXwh} alt="X" style={{ height: '18px', width: 'auto' }} />
                                    </motion.span>
                                )
                            }
                            return (
                                <motion.span
                                    key={index}
                                    variants={{
                                        hidden: { opacity: 0, y: 8 },
                                        visible: { opacity: 1, y: 0 }
                                    }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    style={{ display: 'inline-block', whiteSpace: 'pre' }}
                                >
                                    {char === " " ? "\u00A0" : char}
                                </motion.span>
                            )
                        })}
                    </motion.div>
                </AnimatePresence>
            </div>

            <motion.div
                style={{
                    fontSize: '20px',
                    fontWeight: 300,
                    opacity: 0.8,
                    zIndex: 1,
                    marginTop: '12px'
                }}
            >
                {progress}%
            </motion.div>
        </motion.div>
    )
}

export default LoadingScreen
