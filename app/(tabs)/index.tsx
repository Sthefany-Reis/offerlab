import {
  ArrowRight,
  FileClock,
  FileText,
  GraduationCap,
  MessagesSquare,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Users,
  Wand2,
} from 'lucide-react-native';
import { Text, useThemeColor } from 'heroui-native';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { ProgressBar } from '@/components/ProgressBar';
import { SectionCard } from '@/components/SectionCard';
import { formatSalary } from '@/lib/format';
import { useStore } from '@/lib/store';

const logo = require('@/assets/offerlab-logo.png');

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const [accent] = useThemeColor(['accent']);
  const account = useStore((s) => s.account);
  const profile = useStore((s) => s.profile);
  const analysis = useStore((s) => s.analysis);
  const roadmap = useStore((s) => s.roadmap);
  const applications = useStore((s) => s.applications);

  const roadmapDone = roadmap ? roadmap.steps.filter((s) => s.done).length : 0;
  const roadmapProgress =
    roadmap && roadmap.steps.length ? (roadmapDone / roadmap.steps.length) * 100 : 0;

  const greetingName = account?.name || profile?.fullName;
  const initials = greetingName
    ? greetingName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : null;

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
            {greetingName ? `Hi, ${greetingName.split(' ')[0]}` : 'Welcome'}
          </Text>
          <Text className="text-muted text-[11px] font-semibold tracking-[1.5px] uppercase">
            Where applications become offers.
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/account')}
          hitSlop={8}
          accessibilityLabel={account ? 'Edit your profile' : 'Set up your profile'}
          className="bg-brand h-11 w-11 items-center justify-center rounded-full active:opacity-80"
        >
          {initials ? (
            <Text className="text-sm font-bold text-white">{initials}</Text>
          ) : (
            <UserRound color="#fff" size={20} />
          )}
        </Pressable>
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
          <View
            className="mb-4 overflow-hidden rounded-3xl p-5"
            style={{
              backgroundColor: '#15131f',
              shadowColor: '#15131f',
              shadowOpacity: 0.25,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 10 },
              elevation: 4,
            }}
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-xs font-semibold tracking-wide text-white/60 uppercase">
                  CV market value
                </Text>
                <View className="mt-2 flex-row items-end gap-1">
                  <Text className="text-3xl font-bold text-white">
                    {formatSalary(analysis.marketValue.midAnnual, analysis.marketValue.currency)}
                  </Text>
                  <Text className="mb-1 text-xs text-white/60">/ yr</Text>
                </View>
                <Text className="mt-1 text-xs text-white/60">
                  {formatSalary(analysis.marketValue.lowAnnual, analysis.marketValue.currency)} –{' '}
                  {formatSalary(analysis.marketValue.highAnnual, analysis.marketValue.currency)}
                </Text>
              </View>
              <View className="items-center">
                <View
                  className="h-[68px] w-[68px] items-center justify-center rounded-full border-4"
                  style={{ borderColor: '#7c5cff' }}
                >
                  <Text className="text-xl font-bold text-white">{analysis.overallScore}</Text>
                </View>
                <Text className="mt-1.5 text-[10px] text-white/60">CV score</Text>
              </View>
            </View>

            <View className="mt-4 h-2 w-full flex-row overflow-hidden rounded-full bg-white/10">
              <View className="flex-1" style={{ backgroundColor: '#5b4bd6' }} />
              <View className="flex-1" style={{ backgroundColor: '#7c5cff' }} />
              <View className="flex-1" style={{ backgroundColor: '#a78bfa' }} />
            </View>

            <View className="mt-4 flex-row items-center justify-between">
              <View className="self-start rounded-full bg-white/10 px-2.5 py-1">
                <Text className="text-xs font-medium text-white">
                  {analysis.marketValue.matchedRole} · {analysis.seniority}
                </Text>
              </View>
              <Pressable
                onPress={() => router.push('/profile')}
                className="flex-row items-center gap-1 active:opacity-70"
              >
                <Text className="text-sm font-semibold" style={{ color: '#a78bfa' }}>
                  Full analysis
                </Text>
                <ArrowRight color="#a78bfa" size={15} />
              </Pressable>
            </View>
          </View>

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
          icon={FileClock}
          title="CV history"
          subtitle="Revisit past analyses"
          onPress={() => router.push('/cv-history')}
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
