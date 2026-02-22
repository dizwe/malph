import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface LoadingScreenProps {
    onLoadingComplete: () => void
    minDuration?: number
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadingComplete, minDuration = 1500 }) => {
    const [progress, setProgress] = useState(0)
    const [gridSegments, setGridSegments] = useState<{
        type: 'h' | 'v',
        fixedPos: number, // 가로선일땐 y, 세로선일땐 x
        startPos: number, // 선이 시작되는 위치
        length: number,
        id: number,
        origin: string
    }[]>([])

    // 초기 그리드 조각 계산
    useEffect(() => {
        const segments: { type: 'h' | 'v', fixedPos: number, startPos: number, length: number, id: number, origin: string }[] = []
        const gridSpacing = 240
        const segmentLength = 60 // 조각 하나당 길이
        const width = window.innerWidth
        const height = window.innerHeight

        let id = 0
        const hOrigins = ['left', 'right']
        const vOrigins = ['top', 'bottom']

        // 가로 선들을 조각으로 분할
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

        // 세로 선들을 조각으로 분할
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

        // 모든 조각을 무작위로 섞음
        const shuffled = [...segments].sort(() => Math.random() - 0.5)
        setGridSegments(shuffled)
    }, [])

    useEffect(() => {
        const startTime = Date.now()

        const updateProgress = () => {
            const currentTime = Date.now()
            const elapsed = currentTime - startTime
            const nextProgress = Math.min(Math.floor((elapsed / minDuration) * 100), 100)

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

    // 현재 퍼센트에 따라 보여줄 조각의 개수 결정
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
            {/* 그리드 배경 레이어 (조각들) */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {currentSegments.map(seg => (
                    <motion.div
                        key={seg.id}
                        initial={seg.type === 'h' ? { scaleX: 0, opacity: 0 } : { scaleY: 0, opacity: 0 }}
                        animate={seg.type === 'h' ? { scaleX: 1, opacity: 1 } : { scaleY: 1, opacity: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
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

            <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                    visible: {
                        transition: {
                            staggerChildren: 0.13
                        }
                    }
                }}
                style={{
                    fontSize: '24px',
                    fontWeight: 300,
                    marginBottom: '4px',
                    letterSpacing: '0',
                    display: 'flex',
                    zIndex: 1 // 그리드 위에 표시
                }}
            >
                {"how's where you are".split("").map((char, index) => (
                    <motion.span
                        key={index}
                        variants={{
                            hidden: { opacity: 0, y: 8 },
                            visible: { opacity: 1, y: 0 }
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        style={{ display: 'inline-block', whiteSpace: 'pre' }}
                    >
                        {char === " " ? "\u00A0" : char}
                    </motion.span>
                ))}
            </motion.div>

            <motion.div
                style={{
                    fontSize: '20px',
                    fontWeight: 300,
                    opacity: 0.8,
                    zIndex: 1 // 그리드 위에 표시
                }}
            >
                {progress}%
            </motion.div>
        </motion.div>
    )
}

export default LoadingScreen
