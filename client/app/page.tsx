'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { apiClient } from '@/src/lib/api';
import FeaturedEventsSlider from '@/src/components/events/FeaturedEventsSlider';
import type { Event } from '@/src/components/events/EventCard';
import Background from '@/src/components/ui/Background';
import Image from 'next/image';

export default function Home() {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      try {
        const response = await apiClient.get(
          '/api/events?status=published&limit=6'
        );

        if ((response as any).success && (response as any).data) {
          const events = (response as any).data.events || [];
          // Filter to only show available (future) events
          const now = new Date();
          const availableEvents = events.filter((event: Event) => {
            if (!event.date) return true;
            return new Date(event.date) >= now;
          });
          setFeaturedEvents(availableEvents.slice(0, 6));
        }
      } catch (error) {
        console.error('Error fetching featured events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedEvents();
  }, []);

  return (
    <>
      <Background />
      <div className="min-h-screen">
        {/* Hero Section with Slideshow */}
        <section className="relative py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            {/* <div className="text-center mb-8">
              <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
                Welcome to Gowra
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Discover and create amazing events
              </p>
            </div> */}

            {/* Featured Events Slideshow */}
            {loading ? (
              <div className="w-full h-[500px] bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-3xl flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
              </div>
            ) : featuredEvents.length > 0 ? (
              <FeaturedEventsSlider events={featuredEvents} />
            ) : (
              <div className="w-full h-[500px] bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-3xl flex items-center justify-center">
                <div className="text-center text-white">
                  <h3 className="text-2xl font-bold mb-2">
                    No featured events
                  </h3>
                  <p className="text-white/80">
                    Check back later for exciting events!
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
              <Link
                href="/events"
                className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
              >
                Browse All Events
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/organizer"
                className="px-8 py-4 border-2 border-purple-600 text-purple-600 font-semibold rounded-full hover:bg-purple-50 transition-all duration-300"
              >
                Create Your Event
              </Link>
            </div>
          </div>
        </section>
      </div>
      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                {/* <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"> */}
                <Image
                  src="/assets/G.png"
                  alt="Gowra"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
                {/* </div> */}
                <span className="text-xl font-bold text-gray-900">Gowra</span>
              </div>
              <p className="text-gray-600 mb-4 max-w-md">
                An event management platform that makes creating and attending
                events effortless.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                Product
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="/events"
                    className="text-gray-600 hover:text-purple-600 transition-colors"
                  >
                    Events
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                Company
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="/about"
                    className="text-gray-600 hover:text-purple-600 transition-colors"
                  >
                    About
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-600 text-sm">
                © 2025 Gowra. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
