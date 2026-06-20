import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Minus,
  RefreshCw,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';
import { Button, Text, useThemeColor } from 'heroui-native';
import { Alert, Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { ProgressBar } from '@/components/ProgressBar';
import { ScoreRing } from '@/components/ScoreRing';
import { SectionCard } from '@/components/SectionCard';
import { Tag } from '@/components/Tag';
import { formatSalary, importanceColor, levelToPercent } from '@/lib/format';
import { useStore } from '@/lib/store';

export default function ProfileTab() {
  const insets = useSafeAreaInsets();
  const [accent, muted] = useThemeColor(['accent', 'muted']);
  const profile = useStore((s) => s.profile);
  const analysis = useStore((s) => s.analysis);
  const resetAll = useStore((s) => s.resetAll);

  const confirmReset = () => {
    if (Platform.OS === 'web') {
      resetAll();
      return;
    }
    Alert.alert(
      'Reset OfferLab?',
      'This clears your CV, analysis, roadmap, applications and interviews.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => resetAll() },
      ],
    );
  };

  if (!profile || !analysis) {
    return (
      <View className="bg-background flex-1 justify-center" style={{ paddingTop: insets.top }}>
        <EmptyState
          icon={FileText}
          title="No analysis yet"
          description="Add and analyze your CV to see your full profile, strengths and skill gaps here."
          actionLabel="Add my CV"
          onAction={() => router.push('/cv')}
        />
      </View>
    );
  }

  const mv = analysis.marketValue;

  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <SectionCard className="mb-4">
        <View className="flex-row items-center gap-4">
          <ScoreRing score={analysis.overallScore} label="CV score" size={76} />
          <View className="flex-1">
            <Text className="text-foreground text-lg font-bold">
              {profile.fullName || analysis.detectedRole}
            </Text>
            <Text className="text-muted text-sm">{analysis.detectedRole}</Text>
            <View className="mt-2 flex-row flex-wrap gap-2">
              <Tag label={analysis.seniority} tone="violet" />
              <Tag label={`${analysis.yearsExperience} yrs`} tone="brand" />
            </View>
          </View>
        </View>
        <Text className="text-muted mt-3 text-sm leading-5">{analysis.oneLineSummary}</Text>
      </SectionCard>

      <SectionCard
        title="Market value"
        subtitle={`${mv.matchedRole} · ${mv.region}`}
        className="mb-4"
      >
        <View className="flex-row items-end gap-1">
          <Text className="text-brand text-3xl font-bold">
            {formatSalary(mv.midAnnual, mv.currency)}
          </Text>
          <Text className="text-muted mb-1 text-xs">/ yr median</Text>
        </View>
        <Text className="text-muted mt-1 text-xs">
          {formatSalary(mv.lowAnnual, mv.currency)} – {formatSalary(mv.highAnnual, mv.currency)}
        </Text>
        <Text className="text-foreground mt-3 text-sm leading-5">{mv.summary}</Text>
        <View className="mt-4 gap-2.5">
          {mv.factors.map((f) => (
            <View key={f.label} className="flex-row items-start gap-2">
              {f.impact === 'positive' ? (
                <TrendingUp color="#16a34a" size={16} />
              ) : f.impact === 'negative' ? (
                <TrendingDown color="#dc2626" size={16} />
              ) : (
                <Minus color={muted} size={16} />
              )}
              <View className="flex-1">
                <Text className="text-foreground text-xs font-semibold">{f.label}</Text>
                <Text className="text-muted text-xs leading-4">{f.note}</Text>
              </View>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Strengths" className="mb-4">
        <View className="gap-2">
          {analysis.topStrengths.map((s) => (
            <View key={s} className="flex-row items-start gap-2">
              <CheckCircle2 color="#16a34a" size={16} />
              <Text className="text-foreground flex-1 text-sm leading-5">{s}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      {analysis.weaknesses.length ? (
        <SectionCard title="Areas to improve" className="mb-4">
          <View className="gap-2">
            {analysis.weaknesses.map((s) => (
              <View key={s} className="flex-row items-start gap-2">
                <AlertCircle color="#ea9a00" size={16} />
                <Text className="text-foreground flex-1 text-sm leading-5">{s}</Text>
              </View>
            ))}
          </View>
        </SectionCard>
      ) : null}

      <SectionCard title="Skill gaps" subtitle="Prioritized for your target role" className="mb-4">
        <View className="gap-3.5">
          {analysis.skillGaps.map((gap) => (
            <View key={gap.skill}>
              <View className="mb-1 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View className={`h-2 w-2 rounded-full ${importanceColor(gap.importance)}`} />
                  <Text className="text-foreground text-sm font-medium">{gap.skill}</Text>
                </View>
                <Text className="text-muted text-xs capitalize">{gap.importance}</Text>
              </View>
              <ProgressBar value={levelToPercent(gap.currentLevel)} />
              <Text className="text-muted mt-1 text-xs leading-4">{gap.reason}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Current skills" className="mb-4">
        <View className="flex-row flex-wrap gap-2">
          {analysis.currentSkills.map((s) => (
            <Tag key={s} label={s} tone="brand" />
          ))}
        </View>
      </SectionCard>

      <View className="gap-3">
        <Button variant="secondary" onPress={() => router.push('/cv')}>
          <RefreshCw color={accent} size={18} />
          <Button.Label>Update CV & re-analyze</Button.Label>
        </Button>
        <Button variant="tertiary" onPress={confirmReset}>
          <Trash2 color={muted} size={18} />
          <Button.Label>Reset all data</Button.Label>
        </Button>
      </View>
    </ScrollView>
  );
}
