'use client'

import { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import Image from 'next/image'

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('')
  const [width, setWidth] = useState(512)
  const [height, setHeight] = useState(512)
  const [steps, setSteps] = useState(4)
  const [n, setN] = useState(1)
  const [image, setImage] = useState('')
  const [imgbbUrl, setImgbbUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generateImage = useCallback(async () => {
    setLoading(true)
    setError('')
    setImage('')
    setImgbbUrl('')
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, width, height, steps, n }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image')
      }

      if (!data.image) {
        throw new Error('No image data received')
      }

      setImage(`data:image/png;base64,${data.image}`)
      setImgbbUrl(data.imgbbUrl)
    } catch (err) {
      setError(`An error occurred: ${err instanceof Error ? err.message : String(err)}`)
      console.error('Error details:', err)
    } finally {
      setLoading(false)
    }
  }, [prompt, width, height, steps, n])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Image Generator</h1>
      <div className="grid gap-4">
        <div>
          <Label htmlFor="prompt">Prompt</Label>
          <Input
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here"
          />
        </div>
        <div>
          <Label htmlFor="width">Width: {width}px</Label>
          <Slider
            id="width"
            min={256}
            max={1792}
            step={8}
            value={[width]}
            onValueChange={(value) => setWidth(value[0])}
          />
        </div>
        <div>
          <Label htmlFor="height">Height: {height}px</Label>
          <Slider
            id="height"
            min={256}
            max={1792}
            step={8}
            value={[height]}
            onValueChange={(value) => setHeight(value[0])}
          />
        </div>
        <div>
          <Label htmlFor="steps">Steps: {steps}</Label>
          <Slider
            id="steps"
            min={1}
            max={4}
            value={[steps]}
            onValueChange={(value) => setSteps(value[0])}
          />
        </div>
        <div>
          <Label htmlFor="n">Number of Images: {n}</Label>
          <Slider
            id="n"
            min={1}
            max={1}
            value={[n]}
            onValueChange={(value) => setN(value[0])}
          />
        </div>
        <Button onClick={generateImage} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Image'}
        </Button>
        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <h3 className="font-bold">Error:</h3>
            <p>{error}</p>
          </div>
        )}
        {image && (
          <div className="mt-4">
            <h2 className="text-xl font-bold mb-2">Generated Image:</h2>
            <Image src={image} alt="Generated image" width={width} height={height} />
          </div>
        )}
        {imgbbUrl && (
          <div className="mt-4">
            <h2 className="text-xl font-bold mb-2">ImgBB URL:</h2>
            <a href={imgbbUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">
              {imgbbUrl}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

