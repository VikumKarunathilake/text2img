import { NextResponse } from 'next/server'
import { query } from '@/utils/db'

async function uploadToImgBB(base64Image: string): Promise<string> {
  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      key: process.env.IMGBB_API_KEY!,
      image: base64Image,
    }),
  });

  if (!response.ok) {
    throw new Error(`ImgBB API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.data.url;
}

export async function POST(req: Request) {
  const { prompt, width, height, steps, n } = await req.json()

  if (!process.env.TOGETHER_API_KEY) {
    console.error('TOGETHER_API_KEY is not set')
    return NextResponse.json({ error: 'API key is not configured' }, { status: 500 })
  }

  if (!process.env.IMGBB_API_KEY) {
    console.error('IMGBB_API_KEY is not set')
    return NextResponse.json({ error: 'ImgBB API key is not configured' }, { status: 500 })
  }

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set')
    return NextResponse.json({ error: 'Database connection is not configured' }, { status: 500 })
  }

  try {
    const response = await fetch("https://api.together.xyz/v1/images/generations", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "black-forest-labs/FLUX.1-schnell-Free",
        prompt,
        width,
        height,
        steps,
        n,
        response_format: "b64_json"
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API response error:', response.status, errorText)
      return NextResponse.json({ error: `API error: ${response.status} ${errorText}` }, { status: response.status })
    }

    const data = await response.json()
    if (!data.data || !data.data[0] || !data.data[0].b64_json) {
      console.error('Unexpected API response structure:', JSON.stringify(data))
      return NextResponse.json({ error: 'Unexpected API response structure' }, { status: 500 })
    }

    const base64Image = data.data[0].b64_json
    const imgbbUrl = await uploadToImgBB(base64Image)

    // Save to database
    const insertQuery = `
      INSERT INTO generated_images (prompt, width, height, steps, n, image_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    const values = [prompt, width, height, steps, n, imgbbUrl];
    const result = await query(insertQuery, values);

    return NextResponse.json({ image: base64Image, imgbbUrl, dbId: result.rows[0].id })
  } catch (error) {
    console.error('Error generating, uploading image, or saving to database:', error)
    return NextResponse.json({ error: 'Failed to process request: ' + (error instanceof Error ? error.message : String(error)) }, { status: 500 })
  }
}

