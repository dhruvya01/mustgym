export const GYM_THEMES = [
  {
    id: 'kinetic-orange',
    name: 'Kinetic Orange',
    colors: {
      '--theme-primary': '#ff8f6f',
      '--theme-primary-dim': '#ff734a',
      '--theme-primary-container': '#ff7851',
      '--theme-on-primary': '#5c1400',
    }
  },
  {
    id: 'cyber-cyan',
    name: 'Cyber Cyan',
    colors: {
      '--theme-primary': '#22d3ee',
      '--theme-primary-dim': '#06b6d4',
      '--theme-primary-container': '#0891b2',
      '--theme-on-primary': '#083344',
    }
  },
  {
    id: 'toxic-green',
    name: 'Toxic Green',
    colors: {
      '--theme-primary': '#4ade80',
      '--theme-primary-dim': '#22c55e',
      '--theme-primary-container': '#16a34a',
      '--theme-on-primary': '#14532d',
    }
  },
  {
    id: 'crimson-rage',
    name: 'Crimson Rage',
    colors: {
      '--theme-primary': '#fb7185',
      '--theme-primary-dim': '#f43f5e',
      '--theme-primary-container': '#e11d48',
      '--theme-on-primary': '#4c0519',
    }
  },
  {
    id: 'amethyst-power',
    name: 'Amethyst Power',
    colors: {
      '--theme-primary': '#a78bfa',
      '--theme-primary-dim': '#8b5cf6',
      '--theme-primary-container': '#7c3aed',
      '--theme-on-primary': '#2e1065',
    }
  },
  {
    id: 'gold-standard',
    name: 'Gold Standard',
    colors: {
      '--theme-primary': '#fbbf24',
      '--theme-primary-dim': '#f59e0b',
      '--theme-primary-container': '#d97706',
      '--theme-on-primary': '#451a03',
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
