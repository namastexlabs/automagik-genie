import { Tone, HeadingAccent } from './view-model';

export const palette = {
  accent: {
    primary: '#8B5CF6',
    secondary: '#14B8A6',
    warning: '#F97316',
    danger: '#F43F5E',
    muted: '#94A3B8'
  },
  foreground: {
    default: '#E2E8F0',
    muted: '#CBD5F5',
    placeholder: '#64748B'
  },
  background: {
    panel: '#111827'
  }
} as const;

export function toneToColor(tone: Tone): string | undefined {
  switch (tone) {
    case 'default':
      return palette.foreground.default;
    case 'muted':
      return palette.foreground.muted;
    case 'success':
      return palette.accent.secondary;
    case 'warning':
      return palette.accent.warning;
    case 'danger':
      return palette.accent.danger;
    case 'info':
      return palette.accent.primary;
    default:
      return undefined;
  }
}

export function accentToColor(accent?: HeadingAccent): string | undefined {
  if (!accent) return palette.foreground.default;
  if (accent === 'primary') return palette.accent.primary;
  if (accent === 'secondary') return palette.accent.secondary;
  if (accent === 'muted') return palette.accent.muted;
  return palette.foreground.default;
}
