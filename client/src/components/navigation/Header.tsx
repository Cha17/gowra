'use client';

import { useAuthContext } from '@/src/components/providers/NeonAuthProvider';
import { useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Home,
  Calendar,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  Plus,
} from 'lucide-react';
import Background from '../ui/Background';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export default function Header() {
  const { user, logout, isAuthenticated, isAdmin } = useAuthContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      console.log('🔄 Starting logout process...');
      const result = await logout();

      if (result.success) {
        toast.success('Logged out successfully');

        // Force a page refresh to ensure all components update
        console.log('🔄 Redirecting to home page...');
        router.push('/');

        // Force refresh after a short delay to ensure state is cleared
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } else {
        console.error('❌ Logout failed:', result.error);
        toast.error('Logout failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
      toast.error(
        'Logout failed: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  };

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'About', href: '/about', icon: User },
  ];

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50">
        <Background />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Image
                  src="/assets/G.png"
                  alt="Gowra Logo"
                  width={40}
                  height={40}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  priority
                />
                <span className="text-xl font-bold text-gray-900">Gowra</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map(item => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Auth Section */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center space-x-2 h-auto p-2 hover:bg-gray-100"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {user?.name?.charAt(0) ||
                            user?.email?.charAt(0) ||
                            'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-gray-700">
                        {user?.name || user?.email}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 bg-white border border-gray-200 shadow-lg rounded-lg"
                  >
                    <DropdownMenuLabel className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold leading-none text-gray-900">
                            {user?.name || 'User'}
                          </p>
                          {user?.role === 'organizer' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                              🎯 Organizer
                            </span>
                          )}
                        </div>
                        <p className="text-xs leading-none text-gray-500">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      asChild
                      className="px-3 py-2 hover:bg-blue-50 focus:bg-blue-50"
                    >
                      <Link
                        href="/dashboard"
                        className="cursor-pointer text-gray-700 hover:text-blue-600"
                      >
                        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                        My Events & Registrations
                      </Link>
                    </DropdownMenuItem>

                    {/* Organizer Features */}
                    {user?.role === 'organizer' ? (
                      <>
                        <DropdownMenuItem
                          asChild
                          className="px-3 py-2 hover:bg-purple-50 focus:bg-purple-50"
                        >
                          <Link
                            href="/organizer"
                            className="cursor-pointer text-gray-700 hover:text-purple-600"
                          >
                            <Building2 className="w-4 h-4 mr-2 text-purple-500" />
                            Manage My Events
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          asChild
                          className="px-3 py-2 hover:bg-purple-50 focus:bg-purple-50"
                        >
                          <Link
                            href="/organizer/events"
                            className="cursor-pointer text-gray-700 hover:text-purple-600"
                          >
                            <Plus className="w-4 h-4 mr-2 text-purple-500" />
                            My Events
                          </Link>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem
                        asChild
                        className="px-3 py-2 hover:bg-purple-50 focus:bg-purple-50"
                      >
                        <Link
                          href="/organizer/upgrade"
                          className="cursor-pointer text-gray-700 hover:text-purple-600"
                        >
                          <Building2 className="w-4 h-4 mr-2 text-purple-500" />
                          Become Organizer
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                      asChild
                      className="px-3 py-2 hover:bg-blue-50 focus:bg-blue-50"
                    >
                      <Link
                        href="/profile"
                        className="cursor-pointer text-gray-700 hover:text-blue-600"
                      >
                        <User className="w-4 h-4 mr-2 text-gray-500" />
                        Profile
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      asChild
                      className="px-3 py-2 hover:bg-blue-50 focus:bg-blue-50"
                    >
                      <Link
                        href="/settings"
                        className="cursor-pointer text-gray-700 hover:text-blue-600"
                      >
                        <Settings className="w-4 h-4 mr-2 text-gray-500" />
                        Settings
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 focus:bg-red-50 px-3 py-2"
                    >
                      <LogOut className="w-4 h-4 mr-2 text-red-500" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="bg-blue-950 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
                {navigation.map(item => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}

                {/* Mobile Auth Section */}
                <div className="pt-4 border-t border-gray-200">
                  {isAuthenticated ? (
                    <div className="space-y-2">
                      <div className="px-3 py-2">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.name}
                        </p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                      <Link
                        href="/dashboard"
                        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Calendar className="w-5 h-5" />
                        <span>Dashboard</span>
                      </Link>
                      <Link
                        href="/profile"
                        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="w-5 h-5" />
                        <span>Profile</span>
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings className="w-5 h-5" />
                        <span>Settings</span>
                      </Link>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false);
                        }}
                        className="w-full justify-start text-red-600 hover:text-red-700"
                      >
                        <LogOut className="w-5 h-5 mr-2" />
                        Sign out
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        href="/login"
                        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="w-5 h-5" />
                        <span>Sign in</span>
                      </Link>
                      <Link
                        href="/register"
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="w-5 h-5" />
                        <span>Sign up</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
