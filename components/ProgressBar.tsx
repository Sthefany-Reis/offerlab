import { View } from 'react-native';

import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  barClassName?: string;
}

export function ProgressBar({ value, className, barClassName }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <View className={cn('bg-default h-2.5 w-full overflow-hidden rounded-full', className)}>
      <View
        className={cn('bg-brand h-full rounded-full', barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </View>
  );
}
