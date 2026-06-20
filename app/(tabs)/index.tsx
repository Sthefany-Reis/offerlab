import {
  ArrowRight,
  FileText,
  GraduationCap,
  MessagesSquare,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wand2,
} from 'lucide-react-native';
import { Text, useThemeColor } from 'heroui-native';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { ProgressBar } from '@/components/ProgressBar';
import { ScoreRing } from '@/components/ScoreRing';
import { SectionCard } from '@/components/SectionCard';
import { Tag } from '@/components/Tag';
import { formatSalary } from '@/lib/format';
import { useStore } from '@/lib/store';

const logo = require('@/assets/offerlab-logo.png');

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const [accent] = useThemeColor(['accent']);
  const profile = useStore((s) => s.profile);
  const analysis = useStore((s) => s.analysis);
  const roadmap = useStore((s) => s.roadmap);
  const applications = useStore((s) => s.applications);

  const roadmapDone = roadmap ? roadmap.steps.filter((s) => s.done).length : 0;
  const roadmapProgress =
    roadmap && roadmap.steps.length ? (roadmapDone / roadmap.steps.length) * 100 : 0;

  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: 32,
        paddingHorizontal: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View className="mb-5 flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Image
              source={logo}
              style={{ width: 26, height: 26 }}
              resizeMode="contain"
              accessibilityLabel="OfferLab logo"
            />
            <Text className="text-sm font-bold">
              <Text className="text-navy text-sm font-bold">Offer</Text>
              <Text className="text-coral text-sm font-bold">Lab</Text>
            </Text>
          </View>
          <Text className="text-foreground mt-1 text-2xl font-bold">
            {profile?.fullName ? `Hi, ${profile.fullName.split(' ')[0]}` : 'Welcome'}
          </Text>
          <Text className="text-muted text-[11px] font-semibold tracking-[1.5px] uppercase">
            Experiment. Optimize. Land your next offer.
          </Text>
        </View>
        {analysis ? <ScoreRing score={analysis.overallScore} label="CV score" size={72} /> : null}
      </View>

      {!profile ? (
        <SectionCard className="mb-4">
          <EmptyState
            icon={FileText}
            title="Add your CV to begin"
            description="Upload or paste your CV. OfferLab estimates your market value, finds skill gaps, and builds your plan."
            actionLabel="Add my CV"
            onAction={() => router.push('/cv')}
          />
        </SectionCard>
      ) : !analysis ? (
        <SectionCard className="mb-4">
          <EmptyState
            icon={Sparkles}
            title="Run your analysis"
            description="Your CV is saved. Generate your market value, strengths, and skill gaps."
            actionLabel="Analyze CV"
            onAction={() => router.push('/cv')}
          />
        </SectionCard>
      ) : (
        <>
          <SectionCard
            title="Estimated market value"
            subtitle={`${analysis.marketValue.matchedRole} · ${analysis.marketValue.region}`}
            className="mb-4"
            right={<Tag label={analysis.seniority} tone="violet" />}
          >
            <View className="flex-row items-end gap-1">
              <Text className="text-brand text-3xl font-bold">
                {formatSalary(analysis.marketValue.midAnnual, analysis.marketValue.currency)}
              </Text>
              <Text className="text-muted mb-1 text-xs">/ yr</Text>
            </View>
            <Text className="text-muted mt-1 text-xs">
              Range {formatSalary(analysis.marketValue.lowAnnual, analysis.marketValue.currency)} –{' '}
              {formatSalary(analysis.marketValue.highAnnual, analysis.marketValue.currency)}
            </Text>
            <View className="bg-default mt-3 h-2 w-full flex-row overflow-hidden rounded-full">
              <View className="bg-brand/40 flex-1" />
              <View className="bg-brand flex-1" />
              <View className="bg-coral flex-1" />
            </View>
            <Pressable
              onPress={() => router.push('/profile')}
              className="mt-3 flex-row items-center gap-1"
            >
              <Text className="text-brand text-sm font-semibold">See full analysis</Text>
              <ArrowRight color={accent} size={15} />
            </Pressable>
          </SectionCard>

          <View className="mb-4 flex-row gap-3">
            <View className="bg-surface border-border flex-1 rounded-2xl border p-4">
              <TrendingUp color={accent} size={18} />
              <Text className="text-foreground mt-2 text-2xl font-bold">
                {analysis.skillGaps.length}
              </Text>
              <Text className="text-muted text-xs">Skill gaps</Text>
            </View>
            <View className="bg-surface border-border flex-1 rounded-2xl border p-4">
              <Send color={accent} size={18} />
              <Text className="text-foreground mt-2 text-2xl font-bold">{applications.length}</Text>
              <Text className="text-muted text-xs">Applications</Text>
            </View>
          </View>

          <Pressable onPress={() => router.push('/matches')} className="mb-4">
            <SectionCard>
              <View className="flex-row items-center gap-3">
                <View className="bg-brand-soft h-11 w-11 items-center justify-center rounded-xl">
                  <Target color={accent} size={22} />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-semibold">
                    Jobs you qualify for
                  </Text>
                  <Text className="text-muted text-xs">
                    Roles that fit your CV + skills to improve
                  </Text>
                </View>
                <ArrowRight color={accent} size={18} />
              </View>
            </SectionCard>
          </Pressable>

          {analysis.overallScore < 70 ? (
            <Pressable onPress={() => router.push('/cv-rebuild')} className="mb-4">
              <SectionCard>
                <View className="flex-row items-center gap-3">
                  <View className="bg-caution-soft h-11 w-11 items-center justify-center rounded-xl">
                    <Wand2 color="#9a6a00" size={22} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground text-sm font-semibold">
                      Rebuild a stronger CV
                    </Text>
                    <Text className="text-muted text-xs">
                      Your CV scored {analysis.overallScore}/100 — let AI improve it
                    </Text>
                  </View>
                  <ArrowRight color={accent} size={18} />
                </View>
              </SectionCard>
            </Pressable>
          ) : null}

          {roadmap ? (
            <SectionCard
              title="Learning roadmap"
              subtitle={`${roadmapDone}/${roadmap.steps.length} steps · ${roadmap.goalRole}`}
              className="mb-4"
            >
              <ProgressBar value={roadmapProgress} />
              <Pressable
                onPress={() => router.push('/roadmap')}
                className="mt-3 flex-row items-center gap-1"
              >
                <Text className="text-brand text-sm font-semibold">Open roadmap</Text>
                <ArrowRight color={accent} size={15} />
              </Pressable>
            </SectionCard>
          ) : null}
        </>
      )}

      <Text className="text-foreground mt-1 mb-2 text-base font-semibold">Quick actions</Text>
      <View className="gap-3">
        <ActionRow
          icon={Target}
          title="Jobs you qualify for"
          subtitle="Match your CV to roles"
          onPress={() => router.push('/matches')}
        />
        <ActionRow
          icon={Wand2}
          title="Rebuild my CV"
          subtitle="AI-improved, structured CV"
          onPress={() => router.push('/cv-rebuild')}
        />
        <ActionRow
          icon={FileText}
          title="CV & analysis"
          subtitle="Upload, paste, re-analyze"
          onPress={() => router.push('/cv')}
        />
        <ActionRow
          icon={GraduationCap}
          title="Learning roadmap"
          subtitle="Close your skill gaps"
          onPress={() => router.push('/roadmap')}
        />
        <ActionRow
          icon={Send}
          title="Tailor an application"
          subtitle="Match your CV to a job"
          onPress={() => router.push('/applications')}
        />
        <ActionRow
          icon={MessagesSquare}
          title="Interview prep"
          subtitle="Practice and get feedback"
          onPress={() => router.push('/interview')}
        />
        <ActionRow
          icon={Users}
          title="Chat with specialists"
          subtitle="Mentor advice + LinkedIn"
          onPress={() => router.push('/specialists')}
        />
      </View>
    </ScrollView>
  );
}

function ActionRow({
  icon: Icon,
  title,
  subtitle,
  onPress,
}: {
  icon: typeof FileText;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const [accent, muted] = useThemeColor(['accent', 'muted']);
  return (
    <Pressable
      onPress={onPress}
      className="bg-surface border-border flex-row items-center gap-3 rounded-2xl border p-4 active:opacity-70"
    >
      <View className="bg-brand-soft h-10 w-10 items-center justify-center rounded-xl">
        <Icon color={accent} size={20} />
      </View>
      <View className="flex-1">
        <Text className="text-foreground text-sm font-semibold">{title}</Text>
        <Text className="text-muted text-xs">{subtitle}</Text>
      </View>
      <ArrowRight color={muted} size={18} />
    </Pressable>
  );
}
