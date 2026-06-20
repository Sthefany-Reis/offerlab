import {
  ArrowRight,
  Award,
  Briefcase,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from 'lucide-react-native';
import { Button, Spinner, Text, useThemeColor } from 'heroui-native';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { EmptyState } from '@/components/EmptyState';
import { SectionCard } from '@/components/SectionCard';
import { Tag } from '@/components/Tag';
import { scoreColor } from '@/lib/format';
import { matchJobs, OpenAIError } from '@/lib/openai';
import { useStore } from '@/lib/store';
import type { SkillToImprove } from '@/lib/types';

const IMPORTANCE_TONE: Record<
  SkillToImprove['importance'],
  'danger' | 'caution' | 'info' | 'muted'
> = {
  critical: 'danger',
  high: 'caution',
  medium: 'info',
  low: 'muted',
};

function searchRole(role: string) {
  router.replace({ pathname: '/jobs', params: { q: role } });
}

export default function MatchesScreen() {
  const [muted, accent] = useThemeColor(['muted', 'accent']);
  const analysis = useStore((s) => s.analysis);
  const profile = useStore((s) => s.profile);
  const matchResult = useStore((s) => s.matchResult);
  const setMatchResult = useStore((s) => s.setMatchResult);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (!analysis || !profile) return;
    setLoading(true);
    setError(null);
    try {
      const result = await matchJobs({
        analysis,
        rawCv: profile.rawText,
        targetRole: profile.targetRole,
      });
      setMatchResult(result);
    } catch (e) {
      setError(e instanceof OpenAIError ? e.message : 'Matching failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [analysis, profile, setMatchResult]);

  useEffect(() => {
    if (analysis && profile && !matchResult) void run();
  }, [analysis, profile, matchResult, run]);

  return (
    <View className="bg-background flex-1">
      <View className="pt-safe-offset-4 border-border border-b px-4 pb-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-foreground text-lg font-bold">Jobs you qualify for</Text>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <X color={muted} size={22} />
          </Pressable>
        </View>
      </View>

      {!analysis || !profile ? (
        <View className="flex-1 justify-center">
          <EmptyState
            icon={Target}
            title="Analyze your CV first"
            description="Job matching reads your analyzed CV to find roles you already qualify for."
            actionLabel="Add my CV"
            onAction={() => router.replace('/cv')}
          />
        </View>
      ) : loading && !matchResult ? (
        <View className="flex-1 items-center justify-center">
          <Spinner />
          <Text className="text-muted mt-3 text-sm">Matching your CV to roles…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View className="bg-danger/10 mb-4 rounded-xl px-3 py-3">
              <Text className="text-danger text-sm">{error}</Text>
            </View>
          ) : null}

          {matchResult ? (
            <>
              {matchResult.targetGapPlan && !matchResult.alignedWithTarget ? (
                <SectionCard
                  title="Reaching your target role"
                  subtitle={matchResult.targetGapPlan.targetRole}
                  className="mb-4"
                  right={
                    <Text
                      className={`text-xl font-bold ${scoreColor(matchResult.targetGapPlan.readiness)}`}
                    >
                      {matchResult.targetGapPlan.readiness}%
                    </Text>
                  }
                >
                  <View className="bg-violet-soft mb-3 flex-row items-start gap-2 rounded-xl px-3 py-2.5">
                    <Target color={accent} size={16} />
                    <Text className="text-foreground flex-1 text-xs leading-5">
                      {matchResult.targetGapPlan.verdict}
                    </Text>
                  </View>

                  {matchResult.targetGapPlan.certifications.length > 0 ? (
                    <>
                      <Text className="text-foreground mb-2 text-sm font-semibold">
                        Recommended certifications
                      </Text>
                      <View className="gap-2">
                        {matchResult.targetGapPlan.certifications.map((c) => (
                          <View
                            key={c.name}
                            className="border-border flex-row items-start gap-2 rounded-xl border p-3"
                          >
                            <Award color={accent} size={16} />
                            <View className="flex-1">
                              <Text className="text-foreground text-sm font-medium">{c.name}</Text>
                              <Text className="text-muted text-xs">{c.provider}</Text>
                              <Text className="text-muted mt-1 text-xs leading-5">{c.why}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </>
                  ) : null}

                  {matchResult.targetGapPlan.skills.length > 0 ? (
                    <View className="mt-3">
                      <Text className="text-foreground mb-2 text-sm font-semibold">
                        Skills to add
                      </Text>
                      <View className="flex-row flex-wrap gap-1.5">
                        {matchResult.targetGapPlan.skills.map((s) => (
                          <Tag key={s} label={s} tone="violet" />
                        ))}
                      </View>
                    </View>
                  ) : null}

                  <Button
                    variant="tertiary"
                    className="mt-3"
                    onPress={() => router.push('/roadmap')}
                  >
                    <Button.Label>Build a learning roadmap</Button.Label>
                  </Button>
                </SectionCard>
              ) : (
                <SectionCard className="mb-4">
                  <View className="flex-row items-center gap-2">
                    <View className="bg-positive-soft h-9 w-9 items-center justify-center rounded-xl">
                      <Sparkles color={accent} size={18} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground text-sm font-semibold">
                        Aligned with your target
                      </Text>
                      <Text className="text-muted text-xs">
                        Your CV is strongest for {matchResult.bestFitRole}.
                      </Text>
                    </View>
                  </View>
                </SectionCard>
              )}

              <Text className="text-foreground mb-2 text-base font-semibold">
                Roles you qualify for
              </Text>
              <View className="gap-3">
                {matchResult.qualifiedJobs.map((job) => (
                  <SectionCard key={job.role}>
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 pr-3">
                        <Text className="text-foreground text-base font-semibold">{job.role}</Text>
                        <Text className="text-muted mt-0.5 text-xs leading-5">{job.reason}</Text>
                      </View>
                      <View className="items-end">
                        <Text className={`text-lg font-bold ${scoreColor(job.matchScore)}`}>
                          {job.matchScore}%
                        </Text>
                        <Text className="text-muted text-[10px]">fit</Text>
                      </View>
                    </View>
                    <View className="mt-2 flex-row flex-wrap gap-1.5">
                      {job.matchingSkills.slice(0, 5).map((s) => (
                        <Tag key={s} label={s} tone="brand" />
                      ))}
                    </View>
                    <Pressable
                      onPress={() => searchRole(job.exampleTitles[0] ?? job.role)}
                      className="mt-3 flex-row items-center gap-1"
                    >
                      <Search color={accent} size={14} />
                      <Text className="text-brand text-xs font-semibold">
                        Search live {job.role} jobs
                      </Text>
                      <ArrowRight color={accent} size={14} />
                    </Pressable>
                  </SectionCard>
                ))}
              </View>

              <Text className="text-foreground mt-5 mb-2 text-base font-semibold">
                Skills to improve
              </Text>
              <SectionCard>
                <View className="gap-3">
                  {matchResult.skillsToImprove.map((skill, i) => (
                    <View
                      key={skill.skill}
                      className={i > 0 ? 'border-border border-t pt-3' : undefined}
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className="text-foreground flex-1 pr-2 text-sm font-medium">
                          {skill.skill}
                        </Text>
                        <Tag label={skill.importance} tone={IMPORTANCE_TONE[skill.importance]} />
                      </View>
                      <Text className="text-muted mt-1 text-xs leading-5">{skill.why}</Text>
                      <View className="mt-1.5 flex-row items-start gap-1.5">
                        <TrendingUp color={muted} size={13} />
                        <Text className="text-muted flex-1 text-xs leading-5">
                          {skill.howToLearn}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </SectionCard>

              <Button
                variant="secondary"
                className="mt-5"
                onPress={() => void run()}
                isDisabled={loading}
              >
                {loading ? <Spinner size="sm" /> : <Briefcase color={accent} size={16} />}
                <Button.Label>Re-run match</Button.Label>
              </Button>
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
