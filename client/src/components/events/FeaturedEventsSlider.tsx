'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, ArrowRight, ArrowLeft } from 'lucide-react';
import { Event } from './EventCard';

interface FeaturedEventsSliderProps {
  events: Event[];
}

export default function FeaturedEventsSlider({
  events,
}: FeaturedEventsSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate slideshow every 5 seconds
  useEffect(() => {
    if (events.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % events.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [events.length]);

  if (events.length === 0) return null;

  const currentEvent = events[currentIndex];

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Date TBD';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Date TBD';
    }
  };

  const formatPrice = (price: string | null | undefined): string => {
    if (!price) return 'Free';
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return 'Free';
    return numPrice === 0 ? 'Free' : `₱${numPrice.toFixed(2)}`;
  };

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev - 1 + events.length) % events.length);
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % events.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="relative w-full h-[500px] rounded-3xl overflow-hidden shadow-2xl">
      {/* Event Image Background */}
      <div className="absolute inset-0">
        {currentEvent.image_url ? (
          <Image
            src={currentEvent.image_url}
            alt={currentEvent.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
            <Calendar className="h-32 w-32 text-white opacity-90" />
          </div>
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-12">
        <div className="max-w-3xl">
          {/* Price Badge */}
          <div className="mb-4">
            <span className="inline-block px-4 py-2 bg-white/95 backdrop-blur-sm rounded-full text-purple-600 font-bold text-lg border border-white/50">
              {formatPrice(currentEvent.price)}
            </span>
          </div>

          {/* Event Title */}
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
            {currentEvent.name}
          </h2>

          {/* Event Details */}
          <div className="space-y-2 mb-6 text-white">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span className="text-lg">{formatDate(currentEvent.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <span className="text-lg">
                {currentEvent.venue || 'Venue TBD'}
              </span>
            </div>
          </div>

          {/* CTA Button */}
          <Link href={`/events/${currentEvent.id}`}>
            <button className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl">
              View Details
              <ArrowRight className="h-5 w-5" />
            </button>
          </Link>
        </div>
      </div>

      {/* Navigation Arrows */}
      {events.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors border border-white/30"
            aria-label="Previous event"
          >
            <ArrowLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors border border-white/30"
            aria-label="Next event"
          >
            <ArrowRight className="h-6 w-6 text-white" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {events.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {events.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

