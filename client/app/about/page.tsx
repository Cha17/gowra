'use client';

import Link from 'next/link';
import {
  Calendar,
  Users,
  CreditCard,
  Shield,
  Target,
  Heart,
  Award,
  ArrowRight,
  CheckCircle,
  Zap,
  Globe,
  Clock,
} from 'lucide-react';
import Background from '@/src/components/ui/Background';

export default function AboutPage() {
  const features = [
    {
      icon: Calendar,
      title: 'Easy Event Creation',
      description:
        'Create beautiful events in minutes with our intuitive interface and powerful tools.',
    },
    {
      icon: Users,
      title: 'Smart Registration',
      description:
        'Streamlined registration process with real-time updates and automated confirmations.',
    },
    {
      icon: CreditCard,
      title: 'Secure Payments',
      description:
        'Multiple payment options with bank-level security for safe transactions.',
    },
    {
      icon: Shield,
      title: 'Reliable Platform',
      description:
        '99.9% uptime with 24/7 support ensuring your events run smoothly.',
    },
  ];

  const stats = [
    { number: '10,000+', label: 'Events Created' },
    { number: '500,000+', label: 'Happy Attendees' },
    { number: '99.9%', label: 'Uptime' },
    { number: '24/7', label: 'Support' },
  ];

  const values = [
    {
      icon: Target,
      title: 'Innovation',
      description:
        "We constantly push the boundaries of what's possible in event management.",
    },
    {
      icon: Heart,
      title: 'Community',
      description:
        'We believe in bringing people together and creating meaningful connections.',
    },
    {
      icon: Award,
      title: 'Excellence',
      description:
        'We strive for perfection in everything we do, from code to customer service.',
    },
  ];

  const benefits = [
    'Real-time event analytics and insights',
    'Mobile-responsive design for all devices',
    'Customizable event pages and branding',
    'Automated email notifications',
    'Integration with popular tools',
    'Advanced search and filtering',
    'Multi-language support',
    'API access for developers',
  ];

  return (
    <>
      <Background />
      <div className="min-h-screen ">
        {/* Hero Section */}
        <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-w-4xl mx-auto text-center">
            {/* <div className="mb-8">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-6">
                <Calendar className="h-6 w-6 text-white" />
                <span className="text-white font-semibold">
                  About Gowra Events
                </span>
              </div>
            </div> */}

            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-8 drop-shadow-lg">
              Connecting People Through
              <span className="block bg-gradient-to-r from-purple-700 to-pink-300 bg-clip-text text-transparent">
                Amazing Events
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-gray-900/90 mb-12 leading-relaxed max-w-3xl mx-auto drop-shadow">
              We're revolutionizing the way people create, discover, and attend
              events. Our mission is to make event management effortless and
              accessible for everyone.
            </p>

            <div className="flex gap-6 items-center justify-center flex-col sm:flex-row">
              <Link
                href="/events"
                className="group flex items-center gap-3 px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-bold rounded-2xl border border-white/30 hover:bg-white hover:text-purple-600 transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                <Calendar className="h-6 w-6" />
                <span className="text-lg">Explore Events</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/register"
                className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 font-bold rounded-2xl hover:from-yellow-500 hover:to-orange-500 transition-all duration-300 transform hover:scale-105 shadow-xl text-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="group">
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                      {stat.number}
                    </div>
                    <div className="text-gray-700 font-bold text-lg">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Founded in 2024, Gowra was born from a simple idea: event
                management should be simple, powerful, and accessible to
                everyone. We started as a small team of passionate developers
                and designers who were frustrated with the complexity of
                existing event platforms.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
              <div className="prose max-w-none">
                <p className="text-gray-700 mb-6">
                  We believe that great events bring people together and create
                  lasting memories. That's why we've built a platform that
                  removes the technical barriers and lets organizers focus on
                  what matters most: creating amazing experiences.
                </p>

                <p className="text-gray-700 mb-6">
                  From small community gatherings to large corporate
                  conferences, Gowra provides the tools and reliability that
                  event organizers need. Our platform is designed with both
                  simplicity and power in mind, ensuring that anyone can create
                  professional-grade events without technical expertise.
                </p>

                <p className="text-gray-700">
                  Today, we're proud to serve thousands of event organizers
                  worldwide, helping them create memorable experiences for
                  millions of attendees. But we're just getting started - our
                  vision is to become the world's most trusted event management
                  platform.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50"></div>
          <div className="relative max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full border border-purple-200 mb-6">
                <Zap className="h-6 w-6 text-purple-600" />
                <span className="text-purple-800 font-semibold">
                  Why Choose Gowra?
                </span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Built for Modern Events
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We've crafted the perfect blend of simplicity and power to make
                event management delightful for organizers and attendees alike
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-purple-600 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed text-lg">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Our Values
              </h2>
              <p className="text-xl text-gray-600">
                The principles that guide everything we do
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <value.icon className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features List Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/70 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Platform Features
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need to create successful events
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Built for Scale
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Our platform is built on modern, reliable technology that scales
                with your needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <Zap className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Lightning Fast
                </h3>
                <p className="text-gray-600">
                  Built on Cloudflare Workers for global performance and instant
                  loading times
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <Globe className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Global Reach
                </h3>
                <p className="text-gray-600">
                  Distributed infrastructure ensures your events are accessible
                  worldwide
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <Clock className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Always Available
                </h3>
                <p className="text-gray-600">
                  99.9% uptime guarantee with real-time monitoring and instant
                  failover
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600"></div>
          <div className="absolute inset-0 bg-black/20"></div>

          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          <div className="relative max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-6">
                <Calendar className="h-6 w-6 text-white" />
                <span className="text-white font-semibold">
                  Get Started Today
                </span>
              </div>
            </div>

            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-8 drop-shadow-lg">
              Ready to Create
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Amazing Events?
              </span>
            </h2>

            <p className="text-xl lg:text-2xl text-white/90 mb-12 leading-relaxed drop-shadow">
              Join thousands of event organizers who trust Gowra to power their
              amazing events
            </p>

            <div className="flex gap-6 items-center justify-center flex-col sm:flex-row">
              <Link
                href="/register"
                className="group flex items-center gap-3 px-8 py-4 bg-white text-purple-600 font-bold rounded-2xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-xl text-lg"
              >
                <Users className="h-6 w-6" />
                <span>Start Creating Events</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/events"
                className="px-8 py-4 bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white font-bold rounded-2xl hover:bg-white hover:text-purple-600 transition-all duration-300 transform hover:scale-105 shadow-xl text-lg"
              >
                Browse Events
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
