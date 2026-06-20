import { Check, Copy, Lock, RefreshCw, Share2, Sparkles, X } from 'lucide-react-native';
import { Button, Spinner, Text, useThemeColor } from 'heroui-native';
import { Pressable, ScrollView, Share, View } from 'react-native';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import * as Clipboard from 'expo-clipboard';

import { EmptyState } from '@/components/EmptyState';
import { SectionCard } from '@/components/SectionCard';
import { OpenAIError, rebuildCv } from '@/lib/openai';
import { useStore } from '@/lib/store';
import type { RebuiltCv } from '@/lib/types';

function toPlainText(cv: RebuiltCv): string {
  const lines: string[] = [cv.headline, '', cv.summary, ''];
  for (const section of cv.sections) {
    lines.push(section.heading.toUpperCase());
    for (const bullet of section.bullets) lines.push(`• ${bullet}`);
    lines.push('');
  }
  return lines.join('\n').trim();
}

export default function CvRebuildScreen() {
  const [muted, accent] = useThemeColor(['muted', 'accent']);
  const analysis = useStore((s) => s.analysis);
  const profile = useStore((s) => s.profile);
  const rebuiltCv = useStore((s) => s.rebuiltCv);
  const setRebuiltCv = useStore((s) => s.setRebuiltCv);
  const isPro = useStore((s) => Boolean(s.pro?.active));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const run = useCallback(async () => {
    if (!analysis || !profile || !isPro) return;
    setLoading(true);
    setError(null);
    try {
      const result = await rebuildCv({
        analysis,
        rawCv: profile.rawText,
        fullName: profile.fullName,
        targetRole: profile.targetRole,
      });
      setRebuiltCv(result);
    } catch (e) {
      setError(e instanceof OpenAIError ? e.message : 'Could not rebuild your CV. Try again.');
    } finally {
      setLoading(false);
    }
  }, [analysis, profile, isPro, setRebuiltCv]);

  useEffect(() => {
    if (analysis && profile && isPro && !rebuiltCv) void run();
  }, [analysis, profile, isPro, rebuiltCv, run]);

  const handleCopy = async () => {
    if (!rebuiltCv) return;
    await Clipboard.setStringAsync(toPlainText(rebuiltCv));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleShare = async () => {
    if (!rebuiltCv) return;
    try {
      await Share.share({ message: toPlainText(rebuiltCv) });
    } catch {
      // user cancelled
    }
  };

  const weakCv = (analysis?.overallScore ?? 100) < 70;

  return (
    <View className="bg-background flex-1">
      <View className="pt-safe-offset-4 border-border border-b px-4 pb-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-foreground text-lg font-bold">Rebuilt CV</Text>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <X color={muted} size={22} />
          </Pressable>
        </View>
      </View>

      {!analysis || !profile ? (
        <View className="flex-1 justify-center">
          <EmptyState
            icon={Sparkles}
            title="Analyze your CV first"
            description="Add and analyze your CV so OfferLab can rebuild a stronger version."
            actionLabel="Add my CV"
            onAction={() => router.replace('/cv')}
          />
        </View>
      ) : !isPro ? (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <SectionCard className="mb-4 items-center">
            <View
              className="h-14 w-14 items-center justify-center rounded-2xl"
              style={{ backgroundColor: accent }}
            >
              <Lock color="#fff" size={24} />
            </View>
            <Text className="text-foreground mt-3 text-lg font-bold">Rebuild my CV is Pro</Text>
            <Text className="text-muted mt-1 text-center text-sm leading-5">
              Get an AI-restructured, ATS-friendly version of your CV with a sharper summary,
              quantified bullets, and copy & share — included with OfferLab Pro.
            </Text>
          </SectionCard>
          <Button
            onPress={() =>
              router.push({ pathname: '/paywall', params: { feature: 'Rebuild my CV' } })
            }
          >
            <Sparkles color="#fff" size={18} />
            <Button.Label>Unlock with Pro</Button.Label>
          </Button>
        </ScrollView>
      ) : loading && !rebuiltCv ? (
        <View className="flex-1 items-center justify-center">
          <Spinner />
          <Text className="text-muted mt-3 text-sm">Rewriting your CV…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {weakCv ? (
            <View className="bg-caution-soft mb-4 flex-row items-start gap-2 rounded-xl px-3 py-2.5">
              <Sparkles color="#9a6a00" size={16} />
              <Text className="text-caution flex-1 text-xs leading-5">
                Your current CV scored {analysis.overallScore}/100. This rebuilt version improves
                structure and impact while keeping your real experience.
              </Text>
            </View>
          ) : null}

          {error ? (
            <View className="bg-danger/10 mb-4 rounded-xl px-3 py-3">
              <Text className="text-danger text-sm">{error}</Text>
            </View>
          ) : null}

          {rebuiltCv ? (
            <>
              <SectionCard className="mb-4">
                <Text className="text-foreground text-xl font-bold">
                  {profile.fullName || 'Your name'}
                </Text>
                <Text className="text-brand text-sm font-semibold">{rebuiltCv.headline}</Text>
                <Text className="text-muted mt-2 text-sm leading-6">{rebuiltCv.summary}</Text>
              </SectionCard>

              {rebuiltCv.sections.map((section) => (
                <SectionCard key={section.heading} title={section.heading} className="mb-4">
                  <View className="gap-2">
                    {section.bullets.map((bullet) => (
                      <View key={bullet} className="flex-row gap-2">
                        <Text className="text-brand text-sm">•</Text>
                        <Text className="text-foreground flex-1 text-sm leading-6">{bullet}</Text>
                      </View>
                    ))}
                  </View>
                </SectionCard>
              ))}

              {rebuiltCv.improvements.length > 0 ? (
                <SectionCard title="What we improved" className="mb-4">
                  <View className="gap-2">
                    {rebuiltCv.improvements.map((imp) => (
                      <View key={imp} className="flex-row items-start gap-2">
                        <Check color={accent} size={15} />
                        <Text className="text-muted flex-1 text-xs leading-5">{imp}</Text>
                      </View>
                    ))}
                  </View>
                </SectionCard>
              ) : null}

              <View className="flex-row gap-2">
                <Button className="flex-1" variant="secondary" onPress={handleCopy}>
                  {copied ? <Check color={accent} size={16} /> : <Copy color={accent} size={16} />}
                  <Button.Label>{copied ? 'Copied' : 'Copy'}</Button.Label>
                </Button>
                <Button className="flex-1" variant="secondary" onPress={handleShare}>
                  <Share2 color={accent} size={16} />
                  <Button.Label>Share</Button.Label>
                </Button>
              </View>

              <Button
                className="mt-2"
                variant="tertiary"
                onPress={() => void run()}
                isDisabled={loading}
              >
                {loading ? <Spinner size="sm" /> : <RefreshCw color={muted} size={16} />}
                <Button.Label>Regenerate</Button.Label>
              </Button>
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
