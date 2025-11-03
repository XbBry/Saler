import React from 'react';
import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to default locale (Arabic)
  redirect('/ar');
}

export const dynamic = 'force-static';