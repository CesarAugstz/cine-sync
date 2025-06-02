'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Film } from 'lucide-react';
import RoomStatus from './room/room-status';

export default function Navigation() {
  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Film className="h-6 w-6" />
            <span className="text-xl font-bold">GialloFilms</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <RoomStatus />
          </div>
        </div>
      </div>
    </nav>
  );
}
