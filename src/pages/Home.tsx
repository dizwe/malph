import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchWeather, fetchWeatherByCurrentLocation } from '../services/weatherService'
import type { WeatherState } from '../types/weather'
import GridBackground from '../components/GridBackground'
import type { WeatherMode } from '../components/GridBackground'
import TextTicker from '../components/TextTicker'
import ScrambleText from '../components/ScrambleText'
import LoadingScreen from '../components/LoadingScreen'
import './Home.css'
import LogoS from '../assets/logo_mxrw.svg';
import PlusBtn from '../assets/plus_btn.svg';

const Home: React.FC = () => {
  const [weather, setWeather] = useState<WeatherState>({
    data: null,
    loading: false,
    error: null,
  })
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false)
  const [selectedWeatherMode, setSelectedWeatherMode] = useState<WeatherMode | 'Live'>('Live')
  const [scrambleTrigger, setScrambleTrigger] = useState(0)
  const [isSiteLoading, setIsSiteLoading] = useState(true)
  const [entranceTrigger, setEntranceTrigger] = useState(0)
  const [knockTrigger, setKnockTrigger] = useState(0)
  const [subtextWeatherMode, setSubtextWeatherMode] = useState<WeatherMode | null>(null)
  const [subText, setSubText] = useState("How's where you are?")
  const weatherStatusRef = useRef<HTMLDivElement>(null)

  // 서브텍스트 키워드 매핑 테이블
  const weatherKeywords: Record<string, string[]> = {
    Sunny: [
      'sun', 'sunny', 'happy', 'bright', 'hot', 'warm', 'light', 'clear', 'smile', 'joy', 'summer', 'day', 'gold',
      'sunshine', 'radiant', 'gleam', 'heat', 'sweat', 'shining', 'outdoor', 'picnic', 'dazzling', 'azure',
      '태양', '밝은', '행복', '더운', '덥다', '맑은', '맑아', '햇빛', '화창', '햇살', '쨍쨍', '무더위', '눈부신', '따뜻',
      '따사로운', '파란하늘', '나들이', '덥네', '건조', '빛나는', '덥'
    ],
    Rainy: [
      'rain', 'rainy', 'sad', 'blue', 'wet', 'storm', 'thunderstorm', 'cry', 'umbrella', 'dripping', 'tears', 'shower',
      'water', 'drizzle', 'downpour', 'puddle', 'lightning', 'humidity', 'melancholy', 'soaked', 'damp', 'gloomy',
      '비', '슬픈', '우울', '폭풍', '소나기', '장마', '빗소리', '주룩주룩', '번개', '우천', '눅눅', '축축', '젖음', '습해',
      '보슬비', '천둥', '강우', '눈물', '꾸물꾸물'
    ],
    Snow: [
      'snow', 'snowy', 'cold', 'ice', 'winter', 'frozen', 'chill', 'white', 'flake', 'freeze', 'frost', 'mountain',
      'ski', 'blizzard', 'shiver', 'polar', 'chilly', 'flurry', 'icicle', 'sled', 'christmas', 'festive',
      '눈', '추운', '겨울', '얼음', '함박눈', '꽁꽁', '한파', '진눈깨비', '고드름', '썰매', '추워', '춥다', '쌀쌀', '첫눈',
      '만년설', '빙판', '추위', '화이트', '춥'
    ],
    Fog: [
      'fog', 'foggy', 'mist', 'cloud', 'cloudy', 'gray', 'dark', 'mysterious', 'lonely', 'quiet', 'dream', 'haze',
      'smoke', 'ghost', 'dust', 'blur', 'overcast', 'vague', 'dim', 'shadowy', 'smog', 'pollution', 'obscure',
      '안개', '흐린', '구름', '몽환', '흐려', '안보여', '자욱', '미세먼지', '뿌연', '캄캄', '스산', '어둑', '먼지', '찌뿌둥',
      '희미', '황사', '매연', '답답'
    ]
  }

  const handleSubtextChange = (text: string) => {
    const lowerText = text.toLowerCase()

    if (text === "How's where you are?") {
      setSubtextWeatherMode(null)
      return
    }

    // 키워드 매칭 확인
    for (const [mode, keywords] of Object.entries(weatherKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        setSubtextWeatherMode(mode as WeatherMode)
        return
      }
    }

    setSubtextWeatherMode(null)
  }

  // subText 변화에 따른 배경 모드 업데이트
  useEffect(() => {
    handleSubtextChange(subText)
  }, [subText])

  // 실제 날씨 데이터를 4가지 배경 모드로 매핑하는 함수
  const getWeatherModeFromData = (weatherData: any): WeatherMode => {
    if (!weatherData) return 'Snow'
    const main = weatherData.weather[0].main

    switch (main) {
      case 'Clear': return 'Sunny'
      case 'Rain':
      case 'Drizzle':
      case 'Thunderstorm': return 'Rainy'
      case 'Snow': return 'Snow'
      default: return 'Fog'
    }
  }

  // 최종적으로 배경에 전달할 모드 결정 (서브텍스트 모드 우선)
  const displayWeatherMode = subtextWeatherMode || (selectedWeatherMode === 'Live'
    ? getWeatherModeFromData(weather.data)
    : selectedWeatherMode as WeatherMode)

  useEffect(() => {
    // Fetch weather data on component mount
    const loadWeather = async () => {
      setWeather({ data: null, loading: true, error: null })

      try {
        try {
          const data = await fetchWeatherByCurrentLocation()
          setWeather({ data, loading: false, error: null })
        } catch {
          const data = await fetchWeather({ city: 'Seoul' })
          setWeather({ data, loading: false, error: null })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load weather'
        setWeather({ data: null, loading: false, error: errorMessage })
      }
    }

    loadWeather()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        weatherStatusRef.current &&
        !weatherStatusRef.current.contains(event.target as Node)
      ) {
        setIsWeatherModalOpen(false)
      }
    }

    if (isWeatherModalOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isWeatherModalOpen])

  return (
    <div className="home">
      <AnimatePresence mode="wait">
        {isSiteLoading && (
          <LoadingScreen
            key="loader"
            onLoadingComplete={() => {
              setIsSiteLoading(false)
              setEntranceTrigger(prev => prev + 1)
            }}
            minDuration={6000} // 최소 로딩 시간
          />
        )}
      </AnimatePresence>

      <nav className="home-nav">
        <div className="nav-left">
          <div
            ref={weatherStatusRef}
            className="weather-status-container"
            style={{ position: 'relative' }}
          >
            Seoul, {weather.data ? (
              <span
                className="weather-status"
                onClick={() => setIsWeatherModalOpen(!isWeatherModalOpen)}
                onMouseEnter={() => setScrambleTrigger(prev => prev + 1)}
              >
                <ScrambleText
                  text={weather.data.weather[0].main}
                  trigger={entranceTrigger + scrambleTrigger}
                />
              </span>
            ) : (
              <span>Bzzzzzt...</span>
            )}

            <AnimatePresence>
              {isWeatherModalOpen && (
                <motion.div
                  className="weather-selector-modal"
                  initial={{ opacity: 0, y: -16, x: 60 }}
                  animate={{ opacity: 1, y: -8, x: 60 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  <div
                    className={`weather-option ${selectedWeatherMode === 'Live' ? 'active' : ''}`}
                    onClick={() => { setSelectedWeatherMode('Live'); setIsWeatherModalOpen(false); setSubText("How's where you are?"); }}
                  >Live</div>
                  <div className="weather-option" onClick={() => { setSelectedWeatherMode('Sunny'); setIsWeatherModalOpen(false); setSubText("How's where you are?"); }}>Sunny</div>
                  <div className="weather-option" onClick={() => { setSelectedWeatherMode('Rainy'); setIsWeatherModalOpen(false); setSubText("How's where you are?"); }}>Rainy</div>
                  <div className="weather-option" onClick={() => { setSelectedWeatherMode('Snow'); setIsWeatherModalOpen(false); setSubText("How's where you are?"); }}>Snowy</div>
                  <div className="weather-option" onClick={() => { setSelectedWeatherMode('Fog'); setIsWeatherModalOpen(false); setSubText("How's where you are?"); }}>Cloudy</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="nav-left-sub">
            {weather.data ? (
              <>
                <span>{Math.round(weather.data.main.temp)}°C</span>
                <span>{weather.data.main.humidity}%</span>
                <span>{weather.data.wind.speed}m/s</span>
              </>
            ) : (
              <>
                <span>Bzz</span>
                <span>zzzz</span>
                <span>zzzzt..</span>
              </>
            )}
          </div>
        </div>
        <div className="nav-right">
          <img
            src={LogoS}
            alt="X Logo"
            style={{
              // width: '0.8em',
              height: '26px',
              verticalAlign: 'middle',
              display: 'inline-block',
            }}
          />
        </div>
      </nav>
      <nav className="bottom-info">
        <div className="bottom-info-left-group">
          <div className="bottom-info-left">
            <ScrambleText text="Korea" trigger={entranceTrigger} />
          </div>
          <div className="bottom-info-left">
            <ScrambleText text="©2026 MARPH Works" trigger={entranceTrigger} />
          </div>
        </div>
        <div className="bottom-info-center">
          <ScrambleText text="Build Anything. Everything." trigger={entranceTrigger} />
        </div>
        <div className="bottom-info-right-group">
          <a
            href="mailto:contact@malph.app"
            className="bottom-info-right bottom-info-link-regular"
            style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}
          >
            Say Hi
          </a>
          <div className="bottom-info-right-dash"></div>
          <a
            href="mailto:contact@malph.app"
            className="bottom-info-right bottom-info-link"
            onMouseEnter={() => setKnockTrigger(prev => prev + 1)}
            style={{ width: '156px', textAlign: 'left', textDecoration: 'none', color: 'inherit', display: 'inline-block' }}
          >
            <ScrambleText text="Knock on MARPH Works" trigger={entranceTrigger + knockTrigger} />
          </a>
        </div>
      </nav>

      <GridBackground weatherMode={displayWeatherMode} />
      <TextTicker subText={subText} setSubText={setSubText} />

      {/* Weather data will be used for design in next steps */}
      {weather.loading && <div style={{ display: 'none' }}>Loading weather...</div>}
      {weather.error && <div style={{ display: 'none' }}>Error: {weather.error}</div>}
      {weather.data && <div style={{ display: 'none' }}>Weather loaded: {weather.data.name}</div>}
    </div>
  )
}

export default Home
