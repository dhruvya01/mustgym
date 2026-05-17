export const GYM_THEMES = [
  {
    id: 'kinetic-orange',
    name: 'Kinetic Orange',
    colors: {
      '--color-primary': '#ff8f6f',
      '--color-primary-dim': '#ff734a',
      '--color-primary-container': '#ff7851',
      '--color-on-primary': '#5c1400',
    }
  },
  {
    id: 'cyber-cyan',
    name: 'Cyber Cyan',
    colors: {
      '--color-primary': '#22d3ee',
      '--color-primary-dim': '#06b6d4',
      '--color-primary-container': '#0891b2',
      '--color-on-primary': '#083344',
    }
  },
  {
    id: 'toxic-green',
    name: 'Toxic Green',
    colors: {
      '--color-primary': '#4ade80',
      '--color-primary-dim': '#22c55e',
      '--color-primary-container': '#16a34a',
      '--color-on-primary': '#14532d',
    }
  },
  {
    id: 'crimson-rage',
    name: 'Crimson Rage',
    colors: {
      '--color-primary': '#fb7185',
      '--color-primary-dim': '#f43f5e',
      '--color-primary-container': '#e11d48',
      '--color-on-primary': '#4c0519',
    }
  },
  {
    id: 'amethyst-power',
    name: 'Amethyst Power',
    colors: {
      '--color-primary': '#a78bfa',
      '--color-primary-dim': '#8b5cf6',
      '--color-primary-container': '#7c3aed',
      '--color-on-primary': '#2e1065',
    }
  },
  {
    id: 'gold-standard',
    name: 'Gold Standard',
    colors: {
      '--color-primary': '#fbbf24',
      '--color-primary-dim': '#f59e0b',
      '--color-primary-container': '#d97706',
      '--color-on-primary': '#451a03',
    }
  }
];

export const applyTheme = (themeId: string) => {
  const theme = GYM_THEMES.find(t => t.id === themeId) || GYM_THEMES[0];
  const root = document.documentElement;
  
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};
