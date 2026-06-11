import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const snarkyResponses = [
  "Oh, another profound inquiry. Based on the incredibly rigorous analysis of the entire internet, the answer is exactly what you thought it was, but slightly more disappointing.",
  "I've computed this using 10,000 GPUs, and the result is: Yes. Probably. Maybe ask someone who actually cares.",
  "Here's the context you requested. Try not to use it to start another argument on the timeline.",
  "Grok has analyzed the timeline. Conclusion: 80% memes, 15% outrage, 5% actual information. The answer to your question falls into the 'outrage' category.",
  "Fascinating question. I've scoured the depths of human knowledge and synthesized a response: 42. It's always 42."
];

// Simple mocked streaming response
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { message } = await req.json();

    const responseText = `[Grok Analysis of "${message.substring(0, 20)}..."]\n\n` + 
      snarkyResponses[Math.floor(Math.random() * snarkyResponses.length)] + 
      "\n\n(Note: I'm a simulated Grok AI. The real one is busy learning from your posts.)";

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const words = responseText.split(' ');
        for (const word of words) {
          controller.enqueue(encoder.encode(word + ' '));
          // Simulate typing delay
          await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50));
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
