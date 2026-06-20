import {
  AlertCircle,
  CheckCircle2,
  Crown,
  FileClock,
  FileText,
  LogOut,
  Minus,
  RefreshCw,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  UserRound,
} from 'lucide-react-native';
import { Button, Text, useThemeColor } from 'heroui-native';
import { Alert, Platform, Pressable, ScrollView, View } from 'react-native';
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
  const account = useStore((s) => s.account);
  const profile = useStore((s) => s.profile);
  const analysis = useStore((s) => s.analysis);
  const resetAll = useStore((s) => s.resetAll);
  const signOut = useStore((s) => s.signOut);
  const pro = useStore((s) => s.pro);
  const cancelPro = useStore((s) => s.cancelPro);
  const isPro = Boolean(pro?.active);

  const confirmCancelPro = () => {
    if (Platform.OS === 'web') {
      cancelPro();
      return;
    }
    Alert.alert('Cancel OfferLab Pro?', 'You will lose access to Pro features.', [
      { text: 'Keep Pro', style: 'cancel' },
      { text: 'Cancel Pro', style: 'destructive', onPress: () => cancelPro() },
    ]);
  };

  const handleSignOut = () => {
    signOut();
    router.replace('/sign-in');
  };

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
        <View className="px-6">
          <Button variant="tertiary" onPress={handleSignOut}>
            <LogOut color={muted} size={18} />
            <Button.Label>Sign out</Button.Label>
          </Button>
        </View>
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
              {account?.name || profile.fullName || analysis.detectedRole}
            </Text>
            <Text className="text-muted text-sm">{account?.email || analysis.detectedRole}</Text>
            <View className="mt-2 flex-row flex-wrap gap-2">
              <Tag label={analysis.seniority} tone="violet" />
              <Tag label={`${analysis.yearsExperience} yrs`} tone="brand" />
            </View>
          </View>
        </View>
        <Text className="text-muted mt-3 text-sm leading-5">{analysis.oneLineSummary}</Text>
      </SectionCard>

      {isPro ? (
        <SectionCard className="mb-4">
          <View className="flex-row items-center gap-3">
            <View
              className="h-11 w-11 items-center justify-center rounded-xl"
              style={{ backgroundColor: accent }}
            >
              <Crown color="#fff" size={20} />
            </View>
            <View className="flex-1">
              <Text className="text-foreground text-base font-bold">OfferLab Pro</Text>
              <Text className="text-muted text-xs capitalize">
                {pro?.plan} plan · renews {new Date(pro?.renewsAt ?? 0).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <Button className="mt-3" variant="tertiary" onPress={confirmCancelPro}>
            <Button.Label>Cancel subscription</Button.Label>
          </Button>
        </SectionCard>
      ) : (
        <Pressable
          onPress={() => router.push('/paywall')}
          className="mb-4 flex-row items-center gap-3 rounded-2xl p-4 active:opacity-90"
          style={{ backgroundColor: '#15131f' }}
        >
          <View
            className="h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: accent }}
          >
            <Sparkles color="#fff" size={20} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-white">Upgrade to Pro</Text>
            <Text className="text-xs text-white/55">Rebuild CV, AI cover letters & more</Text>
          </View>
          <Crown color="#a78bfa" size={20} />
        </Pressable>
      )}

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
        <Button variant="secondary" onPress={() => router.push('/account')}>
          <UserRound color={accent} size={18} />
          <Button.Label>Edit your profile</Button.Label>
        </Button>
        <Button variant="secondary" onPress={() => router.push('/cv')}>
          <RefreshCw color={accent} size={18} />
          <Button.Label>Update CV & re-analyze</Button.Label>
        </Button>
        <Button variant="secondary" onPress={() => router.push('/cv-history')}>
          <FileClock color={accent} size={18} />
          <Button.Label>CV history</Button.Label>
        </Button>
        <Button variant="tertiary" onPress={confirmReset}>
          <Trash2 color={muted} size={18} />
          <Button.Label>Reset all data</Button.Label>
        </Button>
        <Button variant="tertiary" onPress={handleSignOut}>
          <LogOut color={muted} size={18} />
          <Button.Label>Sign out</Button.Label>
        </Button>
      </View>
    </ScrollView>
  );
}
