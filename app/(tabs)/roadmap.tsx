import {
  BookOpen,
  Check,
  GraduationCap,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react-native';
import { Button, Spinner, Text, useThemeColor } from 'heroui-native';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { ProgressBar } from '@/components/ProgressBar';
import { SectionCard } from '@/components/SectionCard';
import { Tag } from '@/components/Tag';
import { formatSalary } from '@/lib/format';
import { buildRoadmap, OpenAIError } from '@/lib/openai';
import { useStore } from '@/lib/store';

const IMPORTANCE_TONE = {
  critical: 'danger',
  high: 'caution',
  medium: 'info',
  low: 'muted',
} as const;

const RESOURCE_TONE = {
  course: 'brand',
  book: 'violet',
  project: 'positive',
  certification: 'caution',
  practice: 'info',
} as const;

export default function RoadmapTab() {
  const insets = useSafeAreaInsets();
  const [accent] = useThemeColor(['accent']);
  const analysis = useStore((s) => s.analysis);
  const profile = useStore((s) => s.profile);
  const roadmap = useStore((s) => s.roadmap);
  const setRoadmap = useStore((s) => s.setRoadmap);
  const toggleStep = useStore((s) => s.toggleRoadmapStep);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!analysis) return;
    setError(null);
    setLoading(true);
    try {
      const goalRole = profile?.targetRole || analysis.detectedRole;
      const result = await buildRoadmap({ analysis, goalRole });
      setRoadmap(result);
    } catch (e) {
      setError(e instanceof OpenAIError ? e.message : 'Could not build your roadmap.');
    } finally {
      setLoading(false);
    }
  };

  if (!analysis) {
    return (
      <View className="bg-background flex-1 justify-center" style={{ paddingTop: insets.top }}>
        <EmptyState
          icon={GraduationCap}
          title="Analyze your CV first"
          description="Your learning roadmap is built from your skill gaps. Add and analyze your CV to unlock it."
          actionLabel="Add my CV"
          onAction={() => router.push('/cv')}
        />
      </View>
    );
  }

  const done = roadmap ? roadmap.steps.filter((s) => s.done).length : 0;
  const progress = roadmap && roadmap.steps.length ? (done / roadmap.steps.length) * 100 : 0;

  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <SectionCard className="mb-4">
        <View className="flex-row items-start gap-3">
          <View className="bg-brand-soft mt-0.5 h-9 w-9 items-center justify-center rounded-full">
            <Target color={accent} size={18} />
          </View>
          <View className="flex-1">
            <Text className="text-foreground text-base font-bold">{analysis.detectedRole}</Text>
            <Text className="text-muted text-xs">
              {analysis.seniority} · ~{analysis.yearsExperience} yrs · CV score{' '}
              {analysis.overallScore}/100
            </Text>
          </View>
        </View>

        <Text className="text-foreground mt-3 text-sm leading-6">{analysis.oneLineSummary}</Text>

        <View className="bg-violet-soft mt-3 flex-row items-center gap-2 rounded-xl px-3 py-2.5">
          <TrendingUp color={accent} size={16} />
          <Text className="text-violet flex-1 text-xs font-medium">
            Estimated market value:{' '}
            {formatSalary(analysis.marketValue.lowAnnual, analysis.marketValue.currency)} –{' '}
            {formatSalary(analysis.marketValue.highAnnual, analysis.marketValue.currency)}
          </Text>
        </View>

        {analysis.skillGaps.length ? (
          <View className="mt-4">
            <Text className="text-foreground mb-2 text-sm font-semibold">
              Skill gaps this plan closes
            </Text>
            <View className="gap-2">
              {analysis.skillGaps.map((gap) => (
                <View key={gap.skill} className="border-border rounded-xl border p-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-foreground flex-1 pr-2 text-sm font-semibold">
                      {gap.skill}
                    </Text>
                    <Tag label={gap.importance} tone={IMPORTANCE_TONE[gap.importance]} />
                  </View>
                  <Text className="text-muted mt-1 text-xs leading-5">{gap.reason}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </SectionCard>

      {!roadmap ? (
        <SectionCard>
          <EmptyState
            icon={Sparkles}
            title="Build your learning roadmap"
            description={`A step-by-step plan to grow into ${profile?.targetRole || analysis.detectedRole}, closing your highest-impact skill gaps.`}
          />
          {error ? <Text className="text-danger mb-3 text-center text-sm">{error}</Text> : null}
          <Button onPress={generate} isDisabled={loading}>
            {loading ? <Spinner size="sm" /> : <Sparkles color="#fff" size={18} />}
            <Button.Label>{loading ? 'Building plan…' : 'Generate roadmap'}</Button.Label>
          </Button>
        </SectionCard>
      ) : (
        <>
          <SectionCard
            title={`Path to ${roadmap.goalRole}`}
            subtitle={`${done}/${roadmap.steps.length} complete · ~${roadmap.totalWeeks} weeks`}
            className="mb-4"
            right={
              <Pressable onPress={generate} hitSlop={8} disabled={loading}>
                {loading ? <Spinner size="sm" /> : <RefreshCw color={accent} size={18} />}
              </Pressable>
            }
          >
            <ProgressBar value={progress} />
          </SectionCard>

          {error ? <Text className="text-danger mb-3 text-center text-sm">{error}</Text> : null}

          {roadmap.steps.map((step, index) => (
            <SectionCard key={step.id} className="mb-3">
              <View className="flex-row items-start gap-3">
                <Pressable
                  onPress={() => toggleStep(step.id)}
                  hitSlop={8}
                  className={`mt-0.5 h-7 w-7 items-center justify-center rounded-full border-2 ${
                    step.done ? 'bg-positive border-positive' : 'border-border'
                  }`}
                >
                  {step.done ? (
                    <Check color="#fff" size={16} />
                  ) : (
                    <Text className="text-muted text-xs font-bold">{index + 1}</Text>
                  )}
                </Pressable>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text
                      className={`flex-1 pr-2 text-base font-semibold ${
                        step.done ? 'text-muted line-through' : 'text-foreground'
                      }`}
                    >
                      {step.title}
                    </Text>
                    <Tag label={`${step.durationWeeks}w`} tone="brand" />
                  </View>
                  <Text className="text-muted mt-1 text-sm leading-5">{step.description}</Text>

                  <View className="bg-violet-soft mt-2 flex-row items-center gap-1.5 rounded-lg px-2.5 py-1.5">
                    <GraduationCap color={accent} size={14} />
                    <Text className="text-violet flex-1 text-xs font-medium">{step.milestone}</Text>
                  </View>

                  {step.resources.length ? (
                    <View className="mt-3 gap-2">
                      {step.resources.map((res) => (
                        <View key={res.title} className="flex-row items-center gap-2">
                          <BookOpen color={accent} size={14} />
                          <Text className="text-foreground flex-1 text-xs" numberOfLines={1}>
                            {res.title}
                            <Text className="text-muted">
                              {' '}
                              · {res.provider} · {res.estimatedHours}h
                            </Text>
                          </Text>
                          <Tag label={res.type} tone={RESOURCE_TONE[res.type]} />
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            </SectionCard>
          ))}
        </>
      )}
    </ScrollView>
  );
}
