import { ChevronRight, FileClock, Plus, Trash2 } from 'lucide-react-native';
import { Button, Text, useThemeColor } from 'heroui-native';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { SectionCard } from '@/components/SectionCard';
import { Tag } from '@/components/Tag';
import { useStore } from '@/lib/store';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function CvHistoryScreen() {
  const [muted, accent] = useThemeColor(['muted', 'accent']);
  const cvHistory = useStore((s) => s.cvHistory);
  const restoreCvHistory = useStore((s) => s.restoreCvHistory);
  const removeCvHistory = useStore((s) => s.removeCvHistory);

  const open = (id: string) => {
    restoreCvHistory(id);
    router.push('/(tabs)/profile');
  };

  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 40, paddingHorizontal: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="mb-4 flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-foreground text-2xl font-bold">CV history</Text>
          <Text className="text-muted mt-1 text-sm">
            Every CV analysis you&apos;ve run, newest first.
          </Text>
        </View>
        <Button onPress={() => router.push('/cv')}>
          <Plus color="#fff" size={16} />
          <Button.Label>New analysis</Button.Label>
        </Button>
      </View>

      {cvHistory.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={FileClock}
            title="No analyses yet"
            description="Run a CV analysis to start building your history. Each run is saved here so you can revisit it."
            actionLabel="Analyze my CV"
            onAction={() => router.push('/cv')}
          />
        </SectionCard>
      ) : (
        <View className="gap-3">
          {cvHistory.map((entry) => (
            <View key={entry.id} className="bg-surface border-border rounded-2xl border">
              <Pressable
                onPress={() => open(entry.id)}
                className="flex-row items-center gap-3 p-4 active:opacity-70"
              >
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-foreground text-base font-semibold" numberOfLines={1}>
                      {entry.detectedRole}
                    </Text>
                    <Tag label={entry.seniority} tone="brand" />
                  </View>
                  <Text className="text-muted mt-1 text-xs">
                    {entry.targetRole ? `Target: ${entry.targetRole}` : 'No target role set'} ·{' '}
                    {formatDate(entry.createdAt)}
                  </Text>
                </View>
                <View className="items-center">
                  <Text className="text-brand text-lg font-bold">{entry.overallScore}</Text>
                  <Text className="text-muted text-[10px]">score</Text>
                </View>
                <ChevronRight color={accent} size={18} />
              </Pressable>
              <Pressable
                onPress={() => removeCvHistory(entry.id)}
                hitSlop={6}
                className="border-border flex-row items-center justify-center gap-1.5 border-t py-2 active:opacity-70"
              >
                <Trash2 color={muted} size={13} />
                <Text className="text-muted text-xs font-semibold">Remove</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
