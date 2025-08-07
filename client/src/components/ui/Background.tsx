'use client';

interface BackgroundProps {
  variant?: 'default' | 'minimal' | 'intense';
  className?: string;
}

export default function Background({
  variant = 'default',
  className = '',
}: BackgroundProps) {
  const variants = {
    default: {
      base: 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100',
      blobs: [
        {
          size: 'w-full h-full',
          position: 'top-0 right-0',
          colors: 'from-indigo-200 via-purple-200 to-pink-200',
          duration: '8s',
          delay: '0s',
        },
        {
          size: 'w-[1000px] h-[1000px]',
          position: 'bottom-0 left-0',
          colors: 'from-red-200 via-gray-100 to-blue-100',
          duration: '12s',
          delay: '2s',
        },
        {
          size: 'w-[600px] h-[600px]',
          position: 'bottom-0 left-0',
          colors: 'from-slate-100 via-teal-100 to-blue-100',
          duration: '10s',
          delay: '4s',
        },
        {
          size: 'w-[300px] h-[300px]',
          position: 'bottom-[10px] left-0',
          colors: 'from-green-200 via-cyan-200 to-fuchsia-300',
          duration: '6s',
          delay: '1s',
        },
        {
          size: 'w-[400px] h-[400px]',
          position: 'top-1/4 right-1/4',
          colors: 'from-yellow-200 via-orange-200 to-red-200',
          duration: '15s',
          delay: '3s',
        },
        {
          size: 'w-[500px] h-[500px]',
          position: 'top-1/2 right-0',
          colors: 'from-purple-200 via-pink-200 to-rose-200',
          duration: '9s',
          delay: '5s',
        },
      ],
    },
    minimal: {
      base: 'bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50',
      blobs: [
        {
          size: 'w-[800px] h-[800px]',
          position: 'top-0 right-0',
          colors: 'from-blue-200 via-purple-200 to-pink-200',
          duration: '10s',
          delay: '0s',
        },
        {
          size: 'w-[600px] h-[600px]',
          position: 'bottom-0 left-0',
          colors: 'from-indigo-200 via-purple-200 to-pink-200',
          duration: '12s',
          delay: '3s',
        },
      ],
    },
    intense: {
      base: 'bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900',
      blobs: [
        {
          size: 'w-full h-full',
          position: 'top-0 right-0',
          colors: 'from-purple-400 via-pink-400 to-indigo-400',
          duration: '8s',
          delay: '0s',
        },
        {
          size: 'w-[1000px] h-[1000px]',
          position: 'bottom-0 left-0',
          colors: 'from-blue-400 via-cyan-400 to-teal-400',
          duration: '12s',
          delay: '2s',
        },
        {
          size: 'w-[600px] h-[600px]',
          position: 'bottom-0 left-0',
          colors: 'from-pink-400 via-rose-400 to-red-400',
          duration: '10s',
          delay: '4s',
        },
        {
          size: 'w-[300px] h-[300px]',
          position: 'bottom-[10px] left-0',
          colors: 'from-green-400 via-emerald-400 to-teal-400',
          duration: '6s',
          delay: '1s',
        },
        {
          size: 'w-[400px] h-[400px]',
          position: 'top-1/4 right-1/4',
          colors: 'from-yellow-400 via-orange-400 to-red-400',
          duration: '15s',
          delay: '3s',
        },
        {
          size: 'w-[500px] h-[500px]',
          position: 'top-1/2 right-0',
          colors: 'from-purple-400 via-violet-400 to-indigo-400',
          duration: '9s',
          delay: '5s',
        },
      ],
    },
  };

  const currentVariant = variants[variant];

  return (
    <div className={`fixed inset-0 -z-20 ${className}`}>
      {/* Main background gradient */}
      <div className={`fixed inset-0 ${currentVariant.base} -z-20`} />

      {/* Animated blobs */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        {currentVariant.blobs.map((blob, index) => (
          <div
            key={index}
            className={`blob ${blob.size} rounded-[999px] absolute ${blob.position} blur-3xl bg-opacity-60 bg-gradient-to-r ${blob.colors} animate-pulse`}
            style={{
              animationDuration: blob.duration,
              animationDelay: blob.delay,
            }}
          />
        ))}
      </div>
    </div>
  );
}
