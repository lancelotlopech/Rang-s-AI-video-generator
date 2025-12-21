export interface FontOption {
  name: string
  value: string
  category: 'Sans Serif' | 'Serif' | 'Display' | 'Handwriting' | 'Monospace'
  google?: boolean
}

export const fontOptions: FontOption[] = [
  // Sans Serif (Modern & Clean)
  { name: 'Inter', value: 'Inter', category: 'Sans Serif', google: true },
  { name: 'Roboto', value: 'Roboto', category: 'Sans Serif', google: true },
  { name: 'Open Sans', value: 'Open Sans', category: 'Sans Serif', google: true },
  { name: 'Lato', value: 'Lato', category: 'Sans Serif', google: true },
  { name: 'Montserrat', value: 'Montserrat', category: 'Sans Serif', google: true },
  { name: 'Poppins', value: 'Poppins', category: 'Sans Serif', google: true },
  { name: 'Raleway', value: 'Raleway', category: 'Sans Serif', google: true },
  { name: 'Nunito', value: 'Nunito', category: 'Sans Serif', google: true },
  { name: 'Quicksand', value: 'Quicksand', category: 'Sans Serif', google: true },
  { name: 'Work Sans', value: 'Work Sans', category: 'Sans Serif', google: true },
  { name: 'Ubuntu', value: 'Ubuntu', category: 'Sans Serif', google: true },
  { name: 'Rubik', value: 'Rubik', category: 'Sans Serif', google: true },
  
  // Serif (Elegant & Classic)
  { name: 'Playfair Display', value: 'Playfair Display', category: 'Serif', google: true },
  { name: 'Merriweather', value: 'Merriweather', category: 'Serif', google: true },
  { name: 'Lora', value: 'Lora', category: 'Serif', google: true },
  { name: 'Cinzel', value: 'Cinzel', category: 'Serif', google: true },
  { name: 'Bodoni Moda', value: 'Bodoni Moda', category: 'Serif', google: true },
  { name: 'Libre Baskerville', value: 'Libre Baskerville', category: 'Serif', google: true },
  { name: 'PT Serif', value: 'PT Serif', category: 'Serif', google: true },
  { name: 'Roboto Slab', value: 'Roboto Slab', category: 'Serif', google: true },
  
  // Display (Bold & Impactful)
  { name: 'Oswald', value: 'Oswald', category: 'Display', google: true },
  { name: 'Bebas Neue', value: 'Bebas Neue', category: 'Display', google: true },
  { name: 'Anton', value: 'Anton', category: 'Display', google: true },
  { name: 'Righteous', value: 'Righteous', category: 'Display', google: true },
  { name: 'Lobster', value: 'Lobster', category: 'Display', google: true },
  { name: 'Abril Fatface', value: 'Abril Fatface', category: 'Display', google: true },
  { name: 'Fjalla One', value: 'Fjalla One', category: 'Display', google: true },
  
  // Handwriting (Creative & Personal)
  { name: 'Dancing Script', value: 'Dancing Script', category: 'Handwriting', google: true },
  { name: 'Pacifico', value: 'Pacifico', category: 'Handwriting', google: true },
  { name: 'Caveat', value: 'Caveat', category: 'Handwriting', google: true },
  { name: 'Satisfy', value: 'Satisfy', category: 'Handwriting', google: true },
  { name: 'Permanent Marker', value: 'Permanent Marker', category: 'Handwriting', google: true },
  
  // Monospace (Tech & Code)
  { name: 'Roboto Mono', value: 'Roboto Mono', category: 'Monospace', google: true },
  { name: 'Space Mono', value: 'Space Mono', category: 'Monospace', google: true },
  { name: 'Fira Code', value: 'Fira Code', category: 'Monospace', google: true },
]
