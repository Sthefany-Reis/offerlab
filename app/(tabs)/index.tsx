import {
  ArrowRight,
  ArrowUpRight,
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

const HERO_BG = '#15131f';
const VIOLET = '#7c5cff';
const VIOLET_LT = '#a78bfa';

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
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero band — spans full width, anchors the screen */}
      <View
        style={{
          backgroundColor: HERO_BG,
          paddingTop: insets.top + 16,
          paddingBottom: 26,
          paddingHorizontal: 16,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Image
              source={logo}
              style={{ width: 26, height: 26 }}
              resizeMode="contain"
              accessibilityLabel="OfferLab logo"
            />
            <Text className="text-sm font-bold">
              <Text className="text-sm font-bold text-white">Offer</Text>
              <Text className="text-sm font-bold" style={{ color: VIOLET_LT }}>
                Lab
              </Text>
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/account')}
            hitSlop={8}
            accessibilityLabel={account ? 'Edit your profile' : 'Set up your profile'}
            className="h-10 w-10 items-center justify-center rounded-full active:opacity-80"
            style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
          >
            {initials ? (
              <Text className="text-sm font-bold text-white">{initials}</Text>
            ) : (
              <UserRound color="#fff" size={20} />
            )}
          </Pressable>
        </View>

        <Text className="mt-5 text-3xl font-bold text-white">
          {greetingName ? `Hi, ${greetingName.split(' ')[0]}` : 'Welcome'}
        </Text>
        <Text className="mt-1 text-sm text-white/55">Where applications become offers.</Text>

        {analysis ? (
          <View className="mt-5 flex-row items-end justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-[11px] font-semibold tracking-wide text-white/45 uppercase">
                CV market value
              </Text>
              <View className="mt-1.5 flex-row items-end gap-1">
                <Text className="text-3xl font-bold text-white">
                  {formatSalary(analysis.marketValue.midAnnual, analysis.marketValue.currency)}
                </Text>
                <Text className="mb-1 text-xs text-white/50">/ yr</Text>
              </View>
              <Text className="mt-1 text-xs text-white/50">
                {formatSalary(analysis.marketValue.lowAnnual, analysis.marketValue.currency)} –{' '}
                {formatSalary(analysis.marketValue.highAnnual, analysis.marketValue.currency)}
              </Text>
              <Pressable
                onPress={() => router.push('/profile')}
                className="mt-3 flex-row items-center gap-1 active:opacity-70"
              >
                <Text className="text-sm font-semibold" style={{ color: VIOLET_LT }}>
                  Full analysis
                </Text>
                <ArrowRight color={VIOLET_LT} size={15} />
              </Pressable>
            </View>
            <View className="items-center">
              <View
                className="h-[76px] w-[76px] items-center justify-center rounded-full border-4"
                style={{ borderColor: VIOLET }}
              >
                <Text className="text-2xl font-bold text-white">{analysis.overallScore}</Text>
              </View>
              <Text className="mt-1.5 text-[10px] text-white/55">CV score</Text>
            </View>
          </View>
        ) : null}
      </View>

      <View className="px-4 pt-4">
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
            {/* Stat strip */}
            <View className="mb-5 flex-row gap-3">
              <StatTile
                icon={TrendingUp}
                value={String(analysis.skillGaps.length)}
                label="Skill gaps"
                accent={accent}
              />
              <StatTile
                icon={Send}
                value={String(applications.length)}
                label="Applications"
                accent={accent}
              />
              <StatTile
                icon={GraduationCap}
                value={roadmap ? `${roadmapDone}/${roadmap.steps.length}` : '0'}
                label="Roadmap"
                accent={accent}
              />
            </View>

            {/* Primary actions — 2-col feature grid */}
            <Text className="text-foreground mb-3 text-base font-semibold">For you</Text>
            <View className="mb-5 flex-row flex-wrap gap-3">
              <FeatureTile
                icon={Target}
                title="Jobs you qualify for"
                subtitle="Roles that fit your CV"
                onPress={() => router.push('/matches')}
                accent={accent}
              />
              <FeatureTile
                icon={Wand2}
                title="Rebuild my CV"
                subtitle="AI-improved & structured"
                onPress={() => router.push('/cv-rebuild')}
                accent={accent}
                highlight={analysis.overallScore < 70}
              />
              <FeatureTile
                icon={Send}
                title="Tailor application"
                subtitle="Match CV to a job"
                onPress={() => router.push('/applications')}
                accent={accent}
              />
              <FeatureTile
                icon={MessagesSquare}
                title="Interview prep"
                subtitle="Practice with feedback"
                onPress={() => router.push('/interview')}
                accent={accent}
              />
            </View>

            {roadmap ? (
              <SectionCard
                title="Learning roadmap"
                subtitle={`${roadmapDone}/${roadmap.steps.length} steps · ${roadmap.goalRole}`}
                className="mb-5"
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

        <Text className="text-foreground mt-1 mb-3 text-base font-semibold">More</Text>
        <View className="gap-2.5">
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
            icon={Users}
            title="Chat with specialists"
            subtitle="Mentor advice + LinkedIn"
            onPress={() => router.push('/specialists')}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function StatTile({
  icon: Icon,
  value,
  label,
  accent,
}: {
  icon: typeof FileText;
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <View className="bg-surface border-border flex-1 rounded-2xl border p-3.5">
      <Icon color={accent} size={17} />
      <Text className="text-foreground mt-2 text-xl font-bold">{value}</Text>
      <Text className="text-muted text-[11px]">{label}</Text>
    </View>
  );
}

function FeatureTile({
  icon: Icon,
  title,
  subtitle,
  onPress,
  accent,
  highlight,
}: {
  icon: typeof FileText;
  title: string;
  subtitle: string;
  onPress: () => void;
  accent: string;
  highlight?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{ width: '47.5%', flexGrow: 1 }}
      className={
        highlight
          ? 'bg-brand min-h-[124px] justify-between rounded-2xl p-4 active:opacity-80'
          : 'bg-surface border-border min-h-[124px] justify-between rounded-2xl border p-4 active:opacity-70'
      }
    >
      <View className="flex-row items-start justify-between">
        <View
          className={
            highlight
              ? 'h-10 w-10 items-center justify-center rounded-xl'
              : 'bg-brand-soft h-10 w-10 items-center justify-center rounded-xl'
          }
          style={highlight ? { backgroundColor: 'rgba(255,255,255,0.18)' } : undefined}
        >
          <Icon color={highlight ? '#fff' : accent} size={20} />
        </View>
        <ArrowUpRight color={highlight ? '#fff' : accent} size={18} />
      </View>
      <View className="mt-3">
        <Text
          className={
            highlight ? 'text-sm font-semibold text-white' : 'text-foreground text-sm font-semibold'
          }
        >
          {title}
        </Text>
        <Text className={highlight ? 'mt-0.5 text-xs text-white/75' : 'text-muted mt-0.5 text-xs'}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
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
