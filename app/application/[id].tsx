import { ChevronLeft, Copy, FileText, Trash2 } from 'lucide-react-native';
import { Button, Text, useThemeColor } from 'heroui-native';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SectionCard } from '@/components/SectionCard';
import { ScoreRing } from '@/components/ScoreRing';
import { Tag } from '@/components/Tag';
import { useStore } from '@/lib/store';
import type { ApplicationStatus } from '@/lib/types';

const STATUSES: ApplicationStatus[] = ['draft', 'applied', 'interview', 'offer', 'rejected'];
const STATUS_LABEL: Record<ApplicationStatus, string> = {
  draft: 'Draft',
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
};

export default function ApplicationDetail() {
  const insets = useSafeAreaInsets();
  const [accent, foreground, muted] = useThemeColor(['accent', 'foreground', 'muted']);
  const { id } = useLocalSearchParams<{ id: string }>();
  const app = useStore((s) => s.applications.find((a) => a.id === id));
  const updateStatus = useStore((s) => s.updateApplicationStatus);
  const remove = useStore((s) => s.removeApplication);

  if (!app) {
    return (
      <View
        className="bg-background flex-1 items-center justify-center"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-muted">Application not found.</Text>
        <Button variant="tertiary" className="mt-3" onPress={() => router.back()}>
          <Button.Label>Go back</Button.Label>
        </Button>
      </View>
    );
  }

  const handleDelete = () => {
    remove(app.id);
    router.back();
  };

  return (
    <View className="bg-background flex-1">
      <View
        className="border-border flex-row items-center justify-between border-b px-4 pb-3"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable onPress={() => router.back()} hitSlop={10} className="flex-row items-center">
          <ChevronLeft color={foreground} size={24} />
          <Text className="text-foreground text-base font-semibold">Application</Text>
        </Pressable>
        <Pressable onPress={handleDelete} hitSlop={10}>
          <Trash2 color={muted} size={20} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <SectionCard className="mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-foreground text-xl font-bold">{app.jobTitle}</Text>
              <Text className="text-muted text-sm">{app.company || 'No company'}</Text>
            </View>
            <ScoreRing score={app.matchScore} label="match" size={68} />
          </View>
        </SectionCard>

        <SectionCard title="Status" className="mb-4">
          <View className="flex-row flex-wrap gap-2">
            {STATUSES.map((s) => {
              const active = app.status === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => updateStatus(app.id, s)}
                  className={`rounded-full px-3 py-1.5 ${active ? 'bg-brand' : 'bg-default'}`}
                >
                  <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-muted'}`}>
                    {STATUS_LABEL[s]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        <SectionCard title="Tailored summary" className="mb-4">
          <Text className="text-foreground text-sm leading-6">{app.tailoredSummary}</Text>
        </SectionCard>

        <SectionCard title="Matched skills" className="mb-4">
          <View className="flex-row flex-wrap gap-2">
            {app.highlightedSkills.map((skill) => (
              <Tag key={skill} label={skill} tone="positive" />
            ))}
          </View>
        </SectionCard>

        {app.missingForRole.length ? (
          <SectionCard title="Gaps to address" className="mb-4">
            <View className="flex-row flex-wrap gap-2">
              {app.missingForRole.map((skill) => (
                <Tag key={skill} label={skill} tone="caution" />
              ))}
            </View>
          </SectionCard>
        ) : null}

        <SectionCard title="Resume bullets" className="mb-4">
          <View className="gap-2.5">
            {app.resumeBullets.map((bullet) => (
              <View key={bullet} className="flex-row gap-2">
                <View className="bg-brand mt-2 h-1.5 w-1.5 rounded-full" />
                <Text className="text-foreground flex-1 text-sm leading-6">{bullet}</Text>
              </View>
            ))}
          </View>
        </SectionCard>

        <SectionCard
          title="Cover letter"
          className="mb-4"
          right={
            <View className="flex-row items-center gap-1">
              <Copy color={accent} size={15} />
              <FileText color={accent} size={15} />
            </View>
          }
        >
          <Text className="text-foreground text-sm leading-6">{app.coverLetter}</Text>
        </SectionCard>
      </ScrollView>
    </View>
  );
}
