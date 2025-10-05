"use client";

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Cloud, CloudRain, CloudSnow, Sun, Wind } from 'lucide-react';

interface WelcomeHeroProps {
  name: string;
}

interface WeatherData {
  temperature: number;
  weatherCode: number;
}

const motivationalMessages = [
  "Belle journée pour faire avancer vos interventions !",
  "Prêt à conquérir cette journée ?",
  "Chaque intervention compte, bon courage !",
  "Une nouvelle journée, de nouvelles opportunités !",
  "Excellente journée de travail en perspective !",
  "Votre expertise fait la différence aujourd'hui !",
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
};

const getWeatherInfo = (code: number) => {
  if (code === 0) return { icon: Sun, text: "Temps clair", color: "text-yellow-500" };
  if (code <= 3) return { icon: Cloud, text: "Nuageux", color: "text-gray-400" };
  if (code <= 67) return { icon: CloudRain, text: "Pluvieux", color: "text-blue-400" };
  if (code <= 77) return { icon: CloudSnow, text: "Neigeux", color: "text-blue-200" };
  return { icon: Wind, text: "Venteux", color: "text-gray-500" };
};

export function WelcomeHero({ name }: WelcomeHeroProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(motivationalMessages[0]); // Default to first message
  const [isMounted, setIsMounted] = useState(false);

  const greeting = getGreeting();
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Set random message only on client-side to avoid hydration mismatch
  useEffect(() => {
    setMessage(motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]);
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Get user location for weather (default to Paris if denied)
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
        );
        const data = await response.json();
        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          weatherCode: data.current.weather_code,
        });
      } catch (error) {
        console.error('Error fetching weather:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        () => {
          // Default to Paris coordinates
          fetchWeather(48.8566, 2.3522);
        }
      );
    } else {
      // Default to Paris coordinates
      fetchWeather(48.8566, 2.3522);
    }
  }, []);

  const weatherInfo = weather ? getWeatherInfo(weather.weatherCode) : null;
  const WeatherIcon = weatherInfo?.icon;

  return (
    <Card className="relative overflow-hidden animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />

      <div className="relative p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold">
              {greeting} {name} 👋
            </h2>
            <p className="text-muted-foreground capitalize">
              Nous sommes le {today}
            </p>
          </div>

          {!isLoading && weather && weatherInfo && WeatherIcon && (
            <div className="flex items-center gap-2 text-right">
              <div>
                <p className="text-2xl font-bold">{weather.temperature}°C</p>
                <p className="text-sm text-muted-foreground">{weatherInfo.text}</p>
              </div>
              <WeatherIcon className={`h-10 w-10 ${weatherInfo.color}`} />
            </div>
          )}
        </div>

        <p className="text-lg text-muted-foreground">
          {message}
        </p>
      </div>
    </Card>
  );
}
