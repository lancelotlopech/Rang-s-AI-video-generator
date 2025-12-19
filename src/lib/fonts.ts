export interface FontOption {
  name: string
  value: string
  google?: boolean
}

export const fontOptions: FontOption[] = [
  // System
  { name: 'System (SF Pro)', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  
  // Sans Serif
  { name: 'Inter', value: 'Inter', google: true },
  { name: 'Roboto', value: 'Roboto', google: true },
  { name: 'Open Sans', value: 'Open Sans', google: true },
  { name: 'Lato', value: 'Lato', google: true },
  { name: 'Montserrat', value: 'Montserrat', google: true },
  { name: 'Poppins', value: 'Poppins', google: true },
  { name: 'Raleway', value: 'Raleway', google: true },
  { name: 'Nunito', value: 'Nunito', google: true },
  { name: 'Ubuntu', value: 'Ubuntu', google: true },
  { name: 'Rubik', value: 'Rubik', google: true },
  
  // Serif
  { name: 'Playfair Display', value: 'Playfair Display', google: true },
  { name: 'Merriweather', value: 'Merriweather', google: true },
  { name: 'Lora', value: 'Lora', google: true },
  { name: 'PT Serif', value: 'PT Serif', google: true },
  { name: 'Roboto Slab', value: 'Roboto Slab', google: true },
  
  // Display / Modern
  { name: 'Oswald', value: 'Oswald', google: true },
  { name: 'Bebas Neue', value: 'Bebas Neue', google: true },
  { name: 'Anton', value: 'Anton', google: true },
  { name: 'Fjalla One', value: 'Fjalla One', google: true },
  
  // Handwriting
  { name: 'Dancing Script', value: 'Dancing Script', google: true },
  { name: 'Pacifico', value: 'Pacifico', google: true },
  { name: 'Caveat', value: 'Caveat', google: true },
  
  // Monospace
  { name: 'Roboto Mono', value: 'Roboto Mono', google: true },
  { name: 'Space Mono', value: 'Space Mono', google: true },
]
