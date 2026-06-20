import { Check, FileText, MessagesSquare, Sparkles, Target, Wand2, X } from 'lucide-react-native';
import { Button, Spinner, Text, useThemeColor } from 'heroui-native';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { SectionCard } from '@/components/SectionCard';
import { useStore } from '@/lib/store';
import type { ProPlan } from '@/lib/store';

const PERKS = [
  {
    icon: Wand2,
    title: 'Rebuild my CV',
    desc: 'AI-restructured, ATS-friendly CV with copy & share',
  },
  {
    icon: FileText,
    title: 'AI cover letters',
    desc: 'Tailored cover letter + resume bullets per job',
  },
  { icon: Target, title: 'Unlimited tailored applications', desc: 'Match your CV to any posting' },
  {
    icon: MessagesSquare,
    title: 'Priority mentor chats',
    desc: 'Faster, deeper specialist advice',
  },
];

const PLANS: { plan: ProPlan; label: string; price: string; sub: string; badge?: string }[] = [
  {
    plan: 'yearly',
    label: 'Yearly',
    price: '$59.99 / yr',
    sub: 'Just $5/mo · save 50%',
    badge: 'Best value',
  },
  {
    plan: 'monthly',
    label: 'Monthly',
    price: '$9.99 / mo',
    sub: 'Billed monthly · cancel anytime',
  },
];

export default function PaywallScreen() {
  const [muted, accent] = useThemeColor(['muted', 'accent']);
  const subscribePro = useStore((s) => s.subscribePro);
  const isPro = useStore((s) => Boolean(s.pro?.active));

  const params = useLocalSearchParams();
  const featureLabel =
    typeof params.feature === 'string' && params.feature.length > 0 ? params.feature : null;

  const [selected, setSelected] = useState<ProPlan>('yearly');
  const [processing, setProcessing] = useState(false);

  const handleSubscribe = () => {
    if (processing) return;
    setProcessing(true);
    // Simulated checkout — no real payment is processed.
    setTimeout(() => {
      subscribePro(selected);
      setProcessing(false);
      router.back();
    }, 1400);
  };

  return (
    <View className="bg-background flex-1">
      <View className="pt-safe-offset-4 border-border border-b px-4 pb-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-foreground text-lg font-bold">OfferLab Pro</Text>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <X color={muted} size={22} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-5 items-center">
          <View
            className="h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: accent }}
          >
            <Sparkles color="#fff" size={26} />
          </View>
          <Text className="text-foreground mt-3 text-xl font-bold">Unlock OfferLab Pro</Text>
          <Text className="text-muted mt-1 text-center text-sm leading-5">
            {featureLabel
              ? `${featureLabel} is a Pro feature. Upgrade to unlock it and everything below.`
              : 'Go from applications to offers faster with the full toolkit.'}
          </Text>
        </View>

        <SectionCard className="mb-4">
          <View className="gap-3">
            {PERKS.map((perk) => (
              <View key={perk.title} className="flex-row items-start gap-3">
                <View
                  className="h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${accent}1a` }}
                >
                  <perk.icon color={accent} size={18} />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-semibold">{perk.title}</Text>
                  <Text className="text-muted text-xs leading-4">{perk.desc}</Text>
                </View>
                <Check color={accent} size={16} />
              </View>
            ))}
          </View>
        </SectionCard>

        <View className="mb-4 gap-3">
          {PLANS.map((p) => {
            const active = selected === p.plan;
            return (
              <Pressable
                key={p.plan}
                onPress={() => setSelected(p.plan)}
                className="rounded-2xl border p-4 active:opacity-80"
                style={{
                  borderColor: active ? accent : 'rgba(0,0,0,0.08)',
                  borderWidth: active ? 2 : 1,
                  backgroundColor: active ? `${accent}0d` : '#fff',
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-foreground text-base font-bold">{p.label}</Text>
                    {p.badge ? (
                      <View
                        className="rounded-full px-2 py-0.5"
                        style={{ backgroundColor: accent }}
                      >
                        <Text className="text-[10px] font-bold text-white">{p.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View
                    className="h-5 w-5 items-center justify-center rounded-full border"
                    style={{ borderColor: active ? accent : muted }}
                  >
                    {active ? (
                      <View
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: accent }}
                      />
                    ) : null}
                  </View>
                </View>
                <Text className="text-foreground mt-1 text-sm font-semibold">{p.price}</Text>
                <Text className="text-muted text-xs">{p.sub}</Text>
              </Pressable>
            );
          })}
        </View>

        {isPro ? (
          <View className="bg-positive-soft mb-4 flex-row items-center gap-2 rounded-xl px-3 py-3">
            <Check color="#16a34a" size={16} />
            <Text className="text-positive flex-1 text-sm">You&apos;re already a Pro member.</Text>
          </View>
        ) : null}

        <Button onPress={handleSubscribe} isDisabled={processing || isPro}>
          {processing ? <Spinner size="sm" /> : <Sparkles color="#fff" size={18} />}
          <Button.Label>
            {isPro
              ? 'Subscribed'
              : processing
                ? 'Processing…'
                : `Subscribe · ${selected === 'yearly' ? '$59.99/yr' : '$9.99/mo'}`}
          </Button.Label>
        </Button>

        <Text className="text-muted mt-3 text-center text-[11px] leading-4">
          Simulated checkout for preview — no real payment is charged. Manage or cancel anytime from
          Profile.
        </Text>
      </ScrollView>
    </View>
  );
}
