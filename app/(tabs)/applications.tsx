import { Briefcase, Plus, Search, Send, Target } from 'lucide-react-native';
import { Button, Text, useThemeColor } from 'heroui-native';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { SectionCard } from '@/components/SectionCard';
import { Tag } from '@/components/Tag';
import { scoreColor } from '@/lib/format';
import { useStore } from '@/lib/store';
import type { ApplicationStatus } from '@/lib/types';

const STATUS_TONE: Record<ApplicationStatus, 'muted' | 'info' | 'caution' | 'positive' | 'danger'> =
  {
    draft: 'muted',
    applied: 'info',
    interview: 'caution',
    offer: 'positive',
    rejected: 'danger',
  };

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  draft: 'Draft',
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
};

export default function ApplicationsTab() {
  const insets = useSafeAreaInsets();
  const [foreground] = useThemeColor(['foreground']);
  const analysis = useStore((s) => s.analysis);
  const applications = useStore((s) => s.applications);

  if (!analysis) {
    return (
      <View className="bg-background flex-1 justify-center" style={{ paddingTop: insets.top }}>
        <EmptyState
          icon={Send}
          title="Analyze your CV first"
          description="Tailored applications use your analyzed CV. Add and analyze your CV to start applying."
          actionLabel="Add my CV"
          onAction={() => router.push('/cv')}
        />
      </View>
    );
  }

  return (
    <View className="bg-background flex-1">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
      >
        {applications.length === 0 ? (
          <SectionCard>
            <EmptyState
              icon={Briefcase}
              title="No applications yet"
              description="See roles you qualify for, search live jobs, or paste a job description — OfferLab tailors your CV, writes a cover letter and scores your match."
              actionLabel="Jobs you qualify for"
              onAction={() => router.push('/matches')}
            />
            <Button variant="secondary" className="mt-1" onPress={() => router.push('/jobs')}>
              <Button.Label>Search live jobs</Button.Label>
            </Button>
            <Button
              variant="tertiary"
              className="mt-2"
              onPress={() => router.push('/application/new')}
            >
              <Button.Label>Paste a job description</Button.Label>
            </Button>
          </SectionCard>
        ) : (
          applications.map((app) => (
            <Pressable
              key={app.id}
              onPress={() => router.push({ pathname: '/application/[id]', params: { id: app.id } })}
              className="mb-3"
            >
              <SectionCard>
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-foreground text-base font-semibold">{app.jobTitle}</Text>
                    <Text className="text-muted text-sm">{app.company}</Text>
                  </View>
                  <View className="items-end">
                    <Text className={`text-xl font-bold ${scoreColor(app.matchScore)}`}>
                      {app.matchScore}%
                    </Text>
                    <Text className="text-muted text-xs">match</Text>
                  </View>
                </View>
                <View className="mt-3 flex-row items-center justify-between">
                  <Tag label={STATUS_LABEL[app.status]} tone={STATUS_TONE[app.status]} />
                  <Text className="text-muted text-xs">
                    {app.highlightedSkills.length} matched skills
                  </Text>
                </View>
              </SectionCard>
            </Pressable>
          ))
        )}
      </ScrollView>

      {applications.length > 0 ? (
        <View
          className="absolute inset-x-0 bottom-0 gap-2 px-4"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <Button onPress={() => router.push('/matches')}>
            <Target color="#fff" size={18} />
            <Button.Label>Jobs you qualify for</Button.Label>
          </Button>
          <View className="flex-row gap-2">
            <Button className="flex-1" variant="secondary" onPress={() => router.push('/jobs')}>
              <Search color={foreground} size={18} />
              <Button.Label>Search jobs</Button.Label>
            </Button>
            <Button
              className="flex-1"
              variant="tertiary"
              onPress={() => router.push('/application/new')}
            >
              <Plus color={foreground} size={18} />
              <Button.Label>Paste JD</Button.Label>
            </Button>
          </View>
        </View>
      ) : null}
    </View>
  );
}
