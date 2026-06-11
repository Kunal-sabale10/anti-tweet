import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { scrapeUrl } from '@/lib/scraper';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    const data = await scrapeUrl(url);
    if (!data) throw new Error('Failed to scrape URL');

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to scrape URL' }, { status: 500 });
  }
}
