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
  const weatherStatusRef = useRef<HTMLDivElement>(null)

  // 실제 날씨 데이터를 4가지 배경 모드로 매핑하는 함수
  const getWeatherModeFromData = (weatherData: any): WeatherMode => {
    if (!weatherData) return 'Snow'
    const main = weatherData.weather[0].main

    switch (main) {
      case 'Clear':
        return 'Sunny'
      case 'Rain':
      case 'Drizzle':
      case 'Thunderstorm':
        return 'Rainy'
      case 'Snow':
        return 'Snow'
      case 'Clouds':
      case 'Mist':
      case 'Haze':
      case 'Fog':
      case 'Smoke':
      case 'Dust':
      case 'Sand':
      case 'Ash':
      case 'Squall':
      case 'Tornado':
      default:
        return 'Fog'
    }
  }

  // 최종적으로 배경에 전달할 모드 결정
  const displayWeatherMode = selectedWeatherMode === 'Live'
    ? getWeatherModeFromData(weather.data)
    : selectedWeatherMode

  useEffect(() => {
    // Fetch weather data on component mount
    const loadWeather = async () => {
      setWeather({ data: null, loading: true, error: null })

      try {
        // Try fetching by current location first
        try {
          const data = await fetchWeatherByCurrentLocation()
          setWeather({ data, loading: false, error: null })
          console.log('Weather data (Current Location):', data)
        } catch {
          // Fallback to Seoul if location fails (e.g. permission denied)
          console.log('Location access denied or failed, falling back to Seoul')
          const data = await fetchWeather({ city: 'Seoul' })
          setWeather({ data, loading: false, error: null })
          console.log('Weather data (Seoul):', data)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load weather'
        setWeather({ data: null, loading: false, error: errorMessage })
        console.error('Weather error:', error)
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
            style={{ fontSize: '20px', position: 'relative' }}
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
                    onClick={() => { setSelectedWeatherMode('Live'); setIsWeatherModalOpen(false); }}
                  >Live</div>
                  <div className="weather-option" onClick={() => { setSelectedWeatherMode('Sunny'); setIsWeatherModalOpen(false); }}>Sunny</div>
                  <div className="weather-option" onClick={() => { setSelectedWeatherMode('Rainy'); setIsWeatherModalOpen(false); }}>Rainy</div>
                  <div className="weather-option" onClick={() => { setSelectedWeatherMode('Snow'); setIsWeatherModalOpen(false); }}>Snowy</div>
                  <div className="weather-option" onClick={() => { setSelectedWeatherMode('Fog'); setIsWeatherModalOpen(false); }}>Cloudy</div>
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
          <div className="bottom-info-right">
            <ScrambleText text="Say Hi" trigger={entranceTrigger} />
          </div>
          <div className="bottom-info-right-dash"></div>
          <div className="bottom-info-right">
            <ScrambleText text="Knock on Marph Works" trigger={entranceTrigger} />
          </div>
        </div>
      </nav>

      <GridBackground weatherMode={displayWeatherMode} />
      <TextTicker />

      {/* Weather data will be used for design in next steps */}
      {weather.loading && <div style={{ display: 'none' }}>Loading weather...</div>}
      {weather.error && <div style={{ display: 'none' }}>Error: {weather.error}</div>}
      {weather.data && <div style={{ display: 'none' }}>Weather loaded: {weather.data.name}</div>}
    </div>
  )
}

export default Home
