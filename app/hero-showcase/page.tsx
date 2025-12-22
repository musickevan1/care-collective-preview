'use client'

import { ReactElement, useState } from 'react'
import Image from 'next/image'

const HERO_IMAGE_OPTIONS = [
  {
    id: 1,
    category: 'Family Caregiving',
    title: 'Adult Daughter Hugging Senior Father',
    description: 'Warm embrace, natural lighting, shows emotional bond of caregiving',
    url: 'https://www.georgetownhomecare.com/wp-content/uploads/2022/04/628258429-768x432.jpeg',
    source: 'Georgetown Home Care',
  },
  {
    id: 2,
    category: 'Family Caregiving',
    title: 'Family on Couch Together',
    description: 'Multi-generational, warm home setting, smiling faces',
    url: 'https://www.focusonthefamily.com/wp-content/uploads/2019/09/caring-for-aging-parents-68082d2a3decf.webp',
    source: 'Focus on the Family',
  },
  {
    id: 3,
    category: 'Family Caregiving',
    title: 'Mother and Daughter at Home',
    description: 'Intimate, personal connection between generations',
    url: 'https://media.istockphoto.com/id/1128343966/photo/mother-and-daughter-at-home.jpg?s=612x612&w=0&k=20&c=FHPZ0iidJgX-sdLZsIPMX5ejJLUGsevp6_P6w3kKpcM=',
    source: 'iStock',
  },
  {
    id: 4,
    category: 'Hands / Symbolic',
    title: 'Caregiver Holding Elderly Hands',
    description: 'Intimate, supportive, focuses on the caring gesture',
    url: 'https://media.istockphoto.com/id/941789828/photo/home-caregiver-showing-support-for-elderly-patient.jpg?s=612x612&w=0&k=20&c=Pt2YxYwiG2AB1jylZfBeTFnqS-2aqzUrRH4Kejt49n4=',
    source: 'iStock',
  },
  {
    id: 5,
    category: 'Hands / Symbolic',
    title: 'Companion Hands Close-up',
    description: 'Simple, emotional, universal symbol of support',
    url: 'https://media.gettyimages.com/id/1181715776/photo/companion.jpg?s=612x612&w=0&k=20&c=dOYmPtjPN40-W6pa43sVvsMhsGUmxjNQYVUaGYc5Dkw=',
    source: 'Getty Images',
  },
  {
    id: 6,
    category: 'Hands / Symbolic',
    title: 'Supportive Hand Hold',
    description: 'Warm lighting, gentle supportive gesture',
    url: 'https://media.istockphoto.com/id/863549736/photo/youre-in-my-hands-now.jpg?s=612x612&w=0&k=20&c=lZagU37KsLt3hEOKt5v1cAXCvRe-y1eMugsLtxZ_3Lk=',
    source: 'iStock',
  },
  {
    id: 7,
    category: 'Companionship',
    title: 'Caregiver and Senior Having Coffee',
    description: 'Natural, relaxed, shows companionship aspect',
    url: 'https://media.istockphoto.com/id/1444971252/photo/caretaker-with-senior-man-enjoying-coffee-break.jpg?s=612x612&w=0&k=20&c=8VpHB8zJk-GYExJLsCopJzSf-XqN_bAmYq3QoQ79fCk=',
    source: 'iStock',
  },
  {
    id: 8,
    category: 'Companionship',
    title: 'Happy Senior Woman Relaxing',
    description: 'Positive, independent, warm natural light',
    url: 'https://media.istockphoto.com/id/1296176645/photo/happy-smiling-senior-woman-relaxing-at-home.jpg?s=612x612&w=0&k=20&c=C3vGXCkmljy5K2R4GvPXD-v8x-uElle5trO1pzAjLOg=',
    source: 'iStock',
  },
  {
    id: 9,
    category: 'Multi-generational',
    title: 'Three Generations Together',
    description: 'Shows community and family support network',
    url: 'https://media.istockphoto.com/id/1328420681/photo/therapeutic-activities-for-three-generation-families.jpg?s=612x612&w=0&k=20&c=5LqVk8-rNh9jfy_SQoyrnB7qBQprC8PY1K4Bt-lUclo=',
    source: 'iStock',
  },
  {
    id: 10,
    category: 'Multi-generational',
    title: 'Happy Family Embracing',
    description: 'Joy, love, family bonding moment',
    url: 'https://thumbs.dreamstime.com/b/parents-children-embracing-talking-laughing-home-happy-elderly-adult-enjoy-leisure-time-joy-love-family-bonding-322153924.jpg',
    source: 'Dreamstime',
  },
]

function CircularImage({ src, alt }: { src: string; alt: string }): ReactElement {
  const [error, setError] = useState(false)
  
  return (
    <div className="relative inline-block">
      {/* Outer dusty rose ring - like Kinderground */}
      <div className="w-64 h-64 md:w-80 md:h-80 rounded-full p-3 bg-gradient-to-br from-dusty-rose/60 to-dusty-rose/40 shadow-xl">
        <div className="w-full h-full rounded-full overflow-hidden bg-cream">
          {error ? (
            <div className="w-full h-full flex items-center justify-center bg-sage/20 text-sage-dark">
              <span className="text-sm text-center px-4">Image failed to load</span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt}
              className="w-full h-full object-cover"
              onError={() => setError(true)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function HeroPreview({ image }: { image: typeof HERO_IMAGE_OPTIONS[0] }): ReactElement {
  return (
    <div className="bg-background min-h-[500px] flex items-center py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            {/* Left: Text Content */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
                <span className="text-brown block">Southwest Missouri</span>
                <span className="text-brown block">CARE Collective</span>
              </h1>
              <p className="text-xl md:text-2xl text-brown font-bold mb-4">
                <span className="font-extrabold">C</span>aregiver{' '}
                <span className="font-extrabold">A</span>ssistance and{' '}
                <span className="font-extrabold">R</span>esource{' '}
                <span className="font-extrabold">E</span>xchange
              </p>
              <p className="text-lg text-foreground/80 max-w-xl mb-6">
                A network of family caregivers in Southwest Missouri who support each other through practical help and shared resources.
              </p>
              <button className="bg-sage text-white px-8 py-4 text-lg font-bold rounded-full hover:bg-sage-dark transition-all">
                Join Our Community →
              </button>
            </div>
            
            {/* Right: Circular Image */}
            <div className="flex-shrink-0">
              <CircularImage src={image.url} alt={image.title} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HeroShowcasePage(): ReactElement {
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  
  const categories = [...new Set(HERO_IMAGE_OPTIONS.map(img => img.category))]
  
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-navy text-white py-6 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold">Hero Image Showcase</h1>
          <p className="text-white/80">Click any image to see it in the hero layout (Kinderground-style)</p>
        </div>
      </header>
      
      {/* Selected Image Preview */}
      {selectedImage !== null && (
        <div className="border-b-4 border-sage">
          <div className="bg-sage/10 py-4">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sage-dark font-bold">Preview:</span>{' '}
                  <span className="text-brown font-semibold">
                    {HERO_IMAGE_OPTIONS.find(img => img.id === selectedImage)?.title}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="text-sage-dark hover:text-sage font-semibold"
                >
                  ✕ Close Preview
                </button>
              </div>
            </div>
          </div>
          <HeroPreview image={HERO_IMAGE_OPTIONS.find(img => img.id === selectedImage)!} />
        </div>
      )}
      
      {/* Image Grid by Category */}
      <main className="py-12">
        <div className="container mx-auto px-4">
          {categories.map(category => (
            <div key={category} className="mb-16">
              <h2 className="text-2xl font-bold text-brown mb-2">{category}</h2>
              <div className="h-1 w-24 bg-sage mb-8" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {HERO_IMAGE_OPTIONS.filter(img => img.category === category).map(image => (
                  <div 
                    key={image.id}
                    className={`bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 ${
                      selectedImage === image.id ? 'ring-4 ring-sage' : ''
                    }`}
                    onClick={() => setSelectedImage(image.id)}
                  >
                    {/* Circular preview */}
                    <div className="p-6 bg-cream flex justify-center">
                      <div className="w-48 h-48 rounded-full p-2 bg-gradient-to-br from-dusty-rose/50 to-dusty-rose/30">
                        <div className="w-full h-full rounded-full overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={image.url}
                            alt={image.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Info */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-brown">{image.title}</h3>
                        <span className="text-xs bg-sage/10 text-sage-dark px-2 py-1 rounded-full whitespace-nowrap">
                          #{image.id}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/70 mb-3">{image.description}</p>
                      <p className="text-xs text-foreground/50">Source: {image.source}</p>
                    </div>
                    
                    {/* Select indicator */}
                    <div className="px-5 pb-5">
                      <button 
                        className={`w-full py-2 rounded-lg font-semibold transition-all ${
                          selectedImage === image.id 
                            ? 'bg-sage text-white' 
                            : 'bg-sage/10 text-sage-dark hover:bg-sage/20'
                        }`}
                      >
                        {selectedImage === image.id ? '✓ Selected' : 'Click to Preview'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Instructions */}
          <div className="mt-12 p-6 bg-navy/5 rounded-2xl">
            <h3 className="font-bold text-brown mb-2">How to Use This Page</h3>
            <ol className="list-decimal list-inside space-y-2 text-foreground/70">
              <li>Browse the images below - they&apos;re shown in circular frames like they&apos;d appear in the hero</li>
              <li>Click any image card to see a full hero preview at the top of the page</li>
              <li>Note the image number (e.g., #4) when you find one you like</li>
              <li>Let me know which number(s) you prefer!</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  )
}
