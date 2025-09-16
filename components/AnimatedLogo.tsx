'use client'
import { useState, useEffect, useRef } from 'react'

interface AnimatedLogoProps {
  className?: string
  fps?: number
  autoPlay?: boolean
}

export function AnimatedLogo({ 
  className = '', 
  fps = 30,
  autoPlay = true 
}: AnimatedLogoProps) {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const imageCache = useRef<HTMLImageElement[]>([])
  
  // Total frames (0000 to 0120 = 121 frames)
  const totalFrames = 121
  const frameDuration = 1000 / fps // milliseconds per frame

  // Preload all images
  useEffect(() => {
    const loadImages = async () => {
      const promises = []
      
      for (let i = 0; i < totalFrames; i++) {
        const frameNumber = i.toString().padStart(4, '0')
        const img = new Image()
        img.src = `/animated-logo/kling_20250910_Image_to_Video_looping_lo_1483_${frameNumber}.png`
        promises.push(
          new Promise<HTMLImageElement>((resolve, reject) => {
            img.onload = () => resolve(img)
            img.onerror = reject
          })
        )
      }
      
      try {
        const loadedImages = await Promise.all(promises)
        imageCache.current = loadedImages
        setImagesLoaded(true)
      } catch (error) {
        console.error('Failed to load animated logo frames:', error)
      }
    }
    
    loadImages()
  }, [totalFrames])

  // Animation loop
  useEffect(() => {
    if (!autoPlay || !imagesLoaded) return

    intervalRef.current = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % totalFrames)
    }, frameDuration)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoPlay, imagesLoaded, frameDuration, totalFrames])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  if (!imagesLoaded) {
    // Loading state - show static logo
    return (
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-[var(--hl-cyan)]/10 to-[var(--hl-azure)]/10 rounded-2xl animate-pulse w-full h-full`}>
        <img 
          src="/HELP.png" 
          alt="HELP Logo Loading" 
          className="w-3/4 h-3/4 object-contain opacity-50"
        />
      </div>
    )
  }

  const frameNumber = currentFrame.toString().padStart(4, '0')
  const currentImageSrc = `/animated-logo/kling_20250910_Image_to_Video_looping_lo_1483_${frameNumber}.png`

  return (
    <div className={`${className} w-full h-full`}>
      <img 
        src={currentImageSrc}
        alt="HELP Animated Logo"
        className="w-full h-full object-contain"
      />
    </div>
  )
}
