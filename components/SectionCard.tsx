import type { ReactNode } from 'react';
import { Text } from 'heroui-native';
import { View } from 'react-native';

import { cn } from '@/lib/utils';

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, subtitle, right, children, className }: SectionCardProps) {
  return (
    <View
      className={cn('bg-surface border-border rounded-2xl border p-4', className)}
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      }}
    >
      {(title || right) && (
        <View className="mb-3 flex-row items-start justify-between">
          <View className="flex-1 pr-2">
            {title ? (
              <Text className="text-foreground text-base font-semibold">{title}</Text>
            ) : null}
            {subtitle ? <Text className="text-muted mt-0.5 text-xs">{subtitle}</Text> : null}
          </View>
          {right}
        </View>
      )}
      {children}
    </View>
  );
}
