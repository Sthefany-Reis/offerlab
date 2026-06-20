import { Text } from 'heroui-native';
import { View } from 'react-native';

import { cn } from '@/lib/utils';

interface ScoreRingProps {
  score: number; // 0-100
  label?: string;
  size?: number;
  className?: string;
}

/**
 * Lightweight circular score indicator built from two stacked arcs.
 * Uses a conic-style approximation with a colored ring segment.
 */
export function ScoreRing({ score, label, size = 84, className }: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const color = clamped >= 75 ? 'text-positive' : clamped >= 50 ? 'text-caution' : 'text-danger';
  const ringColor =
    clamped >= 75 ? 'border-positive' : clamped >= 50 ? 'border-caution' : 'border-danger';

  return (
    <View className={cn('items-center', className)} style={{ width: size }}>
      <View
        className={cn('items-center justify-center rounded-full border-4', ringColor)}
        style={{ width: size, height: size }}
      >
        <View className="bg-default absolute inset-0 rounded-full opacity-30" />
        <Text className={cn('text-2xl font-bold', color)}>{clamped}</Text>
      </View>
      {label ? <Text className="text-muted mt-1.5 text-center text-xs">{label}</Text> : null}
    </View>
  );
}
