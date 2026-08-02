/** @type {import('tailwindcss').Config} */
// Intégration NON destructive dans l'app CRA existante :
// - prefix 'tw-' : aucune collision avec les classes CSS maison.
// - preflight désactivé : aucun reset global (le CSS existant n'est pas touché).
// Les tokens premium sont définis (scopés) dans src/theme-premium.css sous .design-premium.
module.exports = {
  prefix: 'tw-',
  important: '.design-premium',
  corePlugins: { preflight: false },
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--gu-border))',
        input: 'hsl(var(--gu-input))',
        ring: 'hsl(var(--gu-ring))',
        background: 'hsl(var(--gu-background))',
        foreground: 'hsl(var(--gu-foreground))',
        primary: { DEFAULT: 'hsl(var(--gu-primary))', foreground: 'hsl(var(--gu-primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--gu-secondary))', foreground: 'hsl(var(--gu-secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--gu-muted))', foreground: 'hsl(var(--gu-muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--gu-accent))', foreground: 'hsl(var(--gu-accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--gu-destructive))', foreground: 'hsl(var(--gu-destructive-foreground))' },
        success: { DEFAULT: 'hsl(var(--gu-success))' },
        card: { DEFAULT: 'hsl(var(--gu-card))', foreground: 'hsl(var(--gu-card-foreground))' },
        gold: { DEFAULT: 'hsl(var(--gu-gold))', soft: 'hsl(var(--gu-gold-soft))' },
      },
      borderRadius: {
        xl: 'calc(var(--gu-radius) + 4px)',
        lg: 'var(--gu-radius)',
        md: 'calc(var(--gu-radius) - 4px)',
        sm: 'calc(var(--gu-radius) - 8px)',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'] },
      boxShadow: {
        glass: '0 1px 0 0 rgba(255,255,255,0.05) inset, 0 20px 40px -24px rgba(0,0,0,0.6)',
        gold: '0 8px 30px -8px hsl(var(--gu-gold) / 0.45)',
      },
      keyframes: {
        'gu-fade-up': { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'gu-pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 hsl(var(--gu-gold) / 0.4)' },
          '70%': { boxShadow: '0 0 0 10px hsl(var(--gu-gold) / 0)' },
          '100%': { boxShadow: '0 0 0 0 hsl(var(--gu-gold) / 0)' },
        },
      },
      animation: {
        'gu-fade-up': 'gu-fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'gu-pulse-ring': 'gu-pulse-ring 2.2s cubic-bezier(0.66,0,0,1) infinite',
      },
    },
  },
  plugins: [],
}
