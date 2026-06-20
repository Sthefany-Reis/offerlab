import { Text } from 'heroui-native';
import { View } from 'react-native';

import { cn } from '@/lib/utils';

type Tone = 'brand' | 'violet' | 'positive' | 'caution' | 'info' | 'danger' | 'muted';

const toneMap: Record<Tone, { bg: string; text: string }> = {
  brand: { bg: 'bg-brand-soft', text: 'text-brand' },
  violet: { bg: 'bg-violet-soft', text: 'text-violet' },
  positive: { bg: 'bg-positive-soft', text: 'text-positive' },
  caution: { bg: 'bg-caution-soft', text: 'text-caution' },
  info: { bg: 'bg-info-soft', text: 'text-info' },
  danger: { bg: 'bg-danger/10', text: 'text-danger' },
  muted: { bg: 'bg-default', text: 'text-muted' },
};

interface TagProps {
  label: string;
  tone?: Tone;
  className?: string;
}

export function Tag({ label, tone = 'muted', className }: TagProps) {
  const c = toneMap[tone];
  return (
    <View className={cn('rounded-full px-2.5 py-1', c.bg, className)}>
      <Text className={cn('text-xs font-medium', c.text)}>{label}</Text>
    </View>
  );
}
