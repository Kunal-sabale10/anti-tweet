import * as cheerio from 'cheerio';

export async function scrapeUrl(url: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AntiTweetBot/1.0; +http://localhost:3000)'
      }
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    
    const html = await res.text();
    const $ = cheerio.load(html);

    const getMeta = (property: string) => {
      return $(`meta[property="${property}"]`).attr('content') || $(`meta[name="${property}"]`).attr('content') || '';
    };

    const title = getMeta('og:title') || $('title').text() || '';
    const description = getMeta('og:description') || getMeta('description') || '';
    const image = getMeta('og:image') || '';

    return {
      url,
      title: title.slice(0, 100),
      description: description.slice(0, 200),
      image
    };
  } catch {
    return null;
  }
}
