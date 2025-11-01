'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/src/lib/api';
import { toast } from 'sonner';
import {
  CheckCircle,
  Download,
  Calendar,
  MapPin,
  Users,
  ArrowRight,
  Share2,
  Mail,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import Background from '@/src/components/ui/Background';
import { useAuthContext } from '@/src/components/providers/NeonAuthProvider';

interface TicketData {
  id: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
  ticketType: string;
  price: number;
  qrCode: string;
  issuedAt: string;
}

export default function PaymentSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthContext();
  const orderId = params.orderId as string;

  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchTicketData();
    }
  }, [orderId]);

  const fetchTicketData = async () => {
    try {
      setLoading(true);
      // This would fetch the ticket data from the backend
      // For now, we'll simulate the data
      const mockTicketData: TicketData = {
        id: orderId,
        eventName: 'Sample Event',
        eventDate: '2024-01-15T18:00:00Z',
        eventVenue: 'Sample Venue',
        ticketType: 'General Admission',
        price: 100.0,
        qrCode: 'mock-qr-code',
        issuedAt: new Date().toISOString(),
      };

      setTicketData(mockTicketData);
    } catch (error) {
      console.error('Error fetching ticket data:', error);
      toast.error('Failed to load ticket information');
    } finally {
      setLoading(false);
    }
  };

  const downloadTicket = () => {
    // This would generate and download a PDF ticket
    toast.success('Ticket download started');
  };

  const shareTicket = () => {
    if (navigator.share) {
      navigator.share({
        title: `My ticket for ${ticketData?.eventName}`,
        text: `I'm going to ${ticketData?.eventName}!`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Ticket link copied to clipboard');
    }
  };

  const sendEmailTicket = () => {
    // This would send the ticket via email
    toast.success('Ticket sent to your email');
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Date TBD';
    }
  };

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <Background />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Please log in to view your ticket</p>
            <Link
              href="/login"
              className="text-purple-600 hover:text-purple-500 mt-2 inline-block"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Background />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your ticket...</p>
          </div>
        </div>
      </>
    );
  }

  if (!ticketData) {
    return (
      <>
        <Background />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Ticket not found</p>
            <Link
              href="/events"
              className="text-purple-600 hover:text-purple-500 mt-2 inline-block"
            >
              Back to Events
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Background />
      <div className="min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600">
              Your ticket has been issued and is ready to use
            </p>
          </div>

          {/* Ticket Card */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {ticketData.eventName}
              </h2>
              <p className="text-purple-600 font-semibold">
                {ticketData.ticketType}
              </p>
            </div>

            {/* Event Details */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center text-gray-700">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center mr-3">
                  <Calendar className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-sm font-medium">
                  {formatDate(ticketData.eventDate)}
                </span>
              </div>

              <div className="flex items-center text-gray-700">
                <div className="flex-shrink-0 w-8 h-8 bg-pink-50 rounded-full flex items-center justify-center mr-3">
                  <MapPin className="h-4 w-4 text-pink-600" />
                </div>
                <span className="text-sm font-medium">
                  {ticketData.eventVenue}
                </span>
              </div>

              <div className="flex items-center text-gray-700">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center mr-3">
                  <Users className="h-4 w-4 text-orange-600" />
                </div>
                <span className="text-sm font-medium">
                  ₱{ticketData.price.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Ticket QR Code */}
            <div className="text-center">
              <div className="bg-white rounded-xl p-4 inline-block shadow-lg">
                <img
                  src={`data:image/png;base64,${ticketData.qrCode}`}
                  alt="Ticket QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Show this QR code at the event entrance
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={downloadTicket}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
            >
              <Download className="h-5 w-5" />
              Download Ticket PDF
            </button>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={shareTicket}
                className="flex items-center justify-center gap-2 py-2 px-4 bg-blue-100 text-blue-700 font-medium rounded-xl hover:bg-blue-200 transition-all duration-200"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>

              <button
                onClick={sendEmailTicket}
                className="flex items-center justify-center gap-2 py-2 px-4 bg-green-100 text-green-700 font-medium rounded-xl hover:bg-green-200 transition-all duration-200"
              >
                <Mail className="h-4 w-4" />
                Email
              </button>
            </div>

            <Link href="/tickets" className="block">
              <button className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all duration-200">
                View All Tickets
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>

          {/* Next Steps */}
          <div className="mt-8 bg-green-50/80 backdrop-blur-sm rounded-xl p-4">
            <h4 className="font-semibold text-green-900 mb-2">What's Next?</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Save this ticket to your phone or print it out</li>
              <li>• Arrive at the venue 15 minutes before the event starts</li>
              <li>• Show your QR code at the entrance</li>
              <li>• Check your email for event updates and reminders</li>
            </ul>
          </div>

          {/* Back to Events */}
          <div className="text-center mt-8">
            <Link
              href="/events"
              className="inline-flex items-center text-purple-600 hover:text-purple-500 font-medium"
            >
              <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              Discover More Events
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
