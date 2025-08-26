'use client';

import Link from 'next/link';
import { Calendar, ArrowRight, Shield, Users, CreditCard } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <section className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            About Gowra
          </h1>
          <p className="text-lg text-gray-600 mb-10">
            Gowra helps you create, promote, and manage events with ease.
            Simple, fast, and reliable.
          </p>
          <div className="flex gap-4 items-center justify-center">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-full hover:bg-purple-700 transition-colors"
            >
              Explore Events
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/organizer"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-purple-600 text-purple-600 font-semibold rounded-full hover:bg-purple-600 hover:text-white transition-colors"
            >
              Become an Organizer
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-12 mx-80">
          {/* Feature 1 */}
          <div className="group p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
              Easy Event Creation
            </h3>
            <p className="text-gray-600 text-center">
              Create beautiful events in minutes with our intuitive interface
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center">
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-pink-200 transition-colors">
              <Users className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
              Smart Registration
            </h3>
            <p className="text-gray-600 text-center">
              Streamlined registration process with real-time updates
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
              <CreditCard className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
              Secure Payments
            </h3>
            <p className="text-gray-600 text-center">
              Multiple payment options with bank-level security
            </p>
          </div>

          {/* Feature 4 */}
          <div className="group p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
              Reliable Platform
            </h3>
            <p className="text-gray-600 text-center">
              99.9% uptime with 24/7 support for peace of mind
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
