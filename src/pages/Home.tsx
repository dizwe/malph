import React, { useEffect, useState } from 'react'
import { fetchWeather, fetchWeatherByCurrentLocation } from '../services/weatherService'
import type { WeatherState } from '../types/weather'
import GridBackground from '../components/GridBackground'
import TextTicker from '../components/TextTicker'
import './Home.css'

const Home: React.FC = () => {
  const [weather, setWeather] = useState<WeatherState>({
    data: null,
    loading: false,
    error: null,
  })

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

  return (
    <div className="home">
      <nav className="home-nav">
        <div className="nav-left">
          {weather.data ? (
            <>
              <div style={{ fontSize: '20px'}}>Seoul, {weather.data.weather[0].main}</div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '14px', fontWeight: '300', marginTop: '-2px' }}>
                <span>{Math.round(weather.data.main.temp)}°C</span>
                <span>{weather.data.main.humidity}%</span>
                <span>{weather.data.wind.speed}m/s</span>
              </div>
            </>
          ) : (
            <div style={{ fontSize: '20px'}}>Seoul, Bzzzzzt...</div>
          )}
        </div>
        <div className="nav-right">Say Hi</div>
      </nav>
      <GridBackground tileSize={360} weatherMode="Snow" />
      <TextTicker />

      {/* Weather data will be used for design in next steps */}
      {weather.loading && <div style={{ display: 'none' }}>Loading weather...</div>}
      {weather.error && <div style={{ display: 'none' }}>Error: {weather.error}</div>}
      {weather.data && <div style={{ display: 'none' }}>Weather loaded: {weather.data.name}</div>}
    </div>
  )
}

export default Home
