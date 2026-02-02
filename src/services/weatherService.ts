import type { WeatherData } from '../types/weather'

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather'

export interface FetchWeatherParams {
    city?: string
    lat?: number
    lon?: number
    units?: 'metric' | 'imperial' | 'standard'
    lang?: string
}

/**
 * Fetch current weather data from OpenWeatherMap API
 * @param params - Parameters for fetching weather data
 * @returns Promise with weather data
 */
export async function fetchWeather(params: FetchWeatherParams): Promise<WeatherData> {
    const { city, lat, lon, units = 'metric', lang = 'ko' } = params

    if (!API_KEY) {
        throw new Error('OpenWeatherMap API key is not configured. Please set VITE_OPENWEATHER_API_KEY in your .env file.')
    }

    // Build query parameters
    const queryParams = new URLSearchParams({
        appid: API_KEY,
        units,
        lang,
    })

    // Add location parameters
    if (city) {
        queryParams.append('q', city)
    } else if (lat !== undefined && lon !== undefined) {
        queryParams.append('lat', lat.toString())
        queryParams.append('lon', lon.toString())
    } else {
        throw new Error('Either city name or coordinates (lat, lon) must be provided')
    }

    const url = `${BASE_URL}?${queryParams.toString()}`

    try {
        const response = await fetch(url)

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
        }

        const data: WeatherData = await response.json()
        return data
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to fetch weather data: ${error.message}`)
        }
        throw new Error('Failed to fetch weather data: Unknown error')
    }
}

/**
 * Fetch weather data using browser's geolocation
 * @param units - Temperature units (default: metric)
 * @param lang - Language for weather description (default: ko)
 * @returns Promise with weather data
 */
export async function fetchWeatherByCurrentLocation(
    units: 'metric' | 'imperial' | 'standard' = 'metric',
    lang: string = 'ko'
): Promise<WeatherData> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser'))
            return
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const data = await fetchWeather({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                        units,
                        lang,
                    })
                    resolve(data)
                } catch (error) {
                    reject(error)
                }
            },
            (error) => {
                reject(new Error(`Geolocation error: ${error.message}`))
            }
        )
    })
}
