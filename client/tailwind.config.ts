import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core palette
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        
        // Primary colors (Futuristic Blue/Purple)
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          light: 'hsl(var(--primary-light))',
          dark: 'hsl(var(--primary-dark))',
          glow: 'hsl(var(--primary-glow))',
        },
        
        // Secondary colors (Neon Cyan/Teal)
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          light: 'hsl(var(--secondary-light))',
          dark: 'hsl(var(--secondary-dark))',
        },
        
        // Accent colors (Electric Pink)
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          subtle: 'hsl(var(--accent-subtle))',
        },
        
        // Utility colors
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        
        destructive: 'hsl(var(--destructive))',
        'destructive-foreground': 'hsl(var(--destructive-foreground))',
        
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        
        // Futuristic specific
        glass: 'hsl(var(--glass))',
        'glass-border': 'hsl(var(--glass-border))',
        glow: 'hsl(var(--glow))',
        hologram: 'hsl(var(--hologram))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 4s ease-in-out infinite',
        'hologram-shimmer': 'hologram-shimmer 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'theme-icon-in': 'theme-icon-in 0.4s cubic-bezier(0.34, 1.4, 0.64, 1) forwards',
        'theme-glow-in': 'theme-glow-in 0.35s ease-out forwards',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'hologram-shimmer': {
          '0%, 100%': { 
            backgroundPosition: '0% 50%',
            opacity: '0.9'
          },
          '50%': { 
            backgroundPosition: '100% 50%',
            opacity: '1'
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'theme-icon-in': {
          '0%': { opacity: '0', transform: 'scale(0.75) rotate(-20deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
        'theme-glow-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      transitionTimingFunction: {
        'theme-smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      backdropBlur: {
        'glass': '12px',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
export default config