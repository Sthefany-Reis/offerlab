import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react-native';
import { Button, Text, useThemeColor } from 'heroui-native';
import { View } from 'react-native';

interface EmptyStateProps {
  icon: ComponentType<LucideProps>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const [accent] = useThemeColor(['accent']);
  return (
    <View className="items-center justify-center px-6 py-10">
      <View className="bg-brand-soft mb-4 h-16 w-16 items-center justify-center rounded-2xl">
        <Icon color={accent} size={30} />
      </View>
      <Text className="text-foreground text-center text-lg font-semibold">{title}</Text>
      <Text className="text-muted mt-1.5 max-w-xs text-center text-sm leading-5">
        {description}
      </Text>
      {actionLabel && onAction ? (
        <Button className="mt-5" onPress={onAction}>
          <Button.Label>{actionLabel}</Button.Label>
        </Button>
      ) : null}
    </View>
  );
}
