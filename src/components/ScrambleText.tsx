import React, { useState, useEffect, useRef } from 'react'

interface ScrambleTextProps {
    text: string
    trigger?: any
    className?: string
    style?: React.CSSProperties
}

const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?/~"
const BLOCKS = "█&*()=[]{}|"

const ScrambleText: React.FC<ScrambleTextProps> = ({ text, trigger, className, style }) => {
    return (
        <span className={className} style={{ display: 'inline-flex', ...style }}>
            {text.split('').map((char, i) => (
                <ScrambleChar
                    key={`${i}-${trigger}`}
                    char={char}
                    index={i}
                />
            ))}
        </span>
    )
}

interface ScrambleCharProps {
    char: string
    index: number
}

const ScrambleChar: React.FC<ScrambleCharProps> = ({ char, index }) => {
    const [displayChar, setDisplayChar] = useState(char)
    const timeoutRef = useRef<number | null>(null)
    const countRef = useRef(0)

    const speedBase = 60
    const speedIncrement = 30
    const steps = 3
    const stagger = 40

    useEffect(() => {
        countRef.current = 0

        if (char === ' ' || char === '\u00A0') {
            setDisplayChar('\u00A0')
            return
        }

        const startDelay = index * stagger

        const run = () => {
            const delay = speedBase + (countRef.current * speedIncrement)
            timeoutRef.current = window.setTimeout(() => {
                countRef.current++
                if (countRef.current > steps) {
                    setDisplayChar(char)
                } else {
                    const charSet = countRef.current < steps / 2 ? BLOCKS : SYMBOLS
                    setDisplayChar(charSet[Math.floor(Math.random() * charSet.length)])
                    run()
                }
            }, delay)
        }

        timeoutRef.current = window.setTimeout(run, startDelay)
        return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
    }, [char, index])

    return (
        <span style={{
            display: 'inline-block',
            minWidth: char === ' ' ? '0.3em' : 'auto',
            whiteSpace: 'pre'
        }}>
            {displayChar}
        </span>
    )
}

export default ScrambleText
