export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get('provider') || 'google';

  // In a real application, we would redirect to Google's / GitHub's OAuth authorize URL
  // Here, we simulate the redirect by sending the user to a mock callback page
  const callbackUrl = new URL('/api/auth/oauth/callback', req.url);
  callbackUrl.searchParams.set('provider', provider);
  
  return NextResponse.redirect(callbackUrl.toString());
}
