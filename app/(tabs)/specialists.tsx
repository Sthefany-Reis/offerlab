import { Linkedin, MessageCircle, Search, Sparkles, Users } from 'lucide-react-native';
import { Text, useThemeColor } from 'heroui-native';
import { Linking, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';

import { SectionCard } from '@/components/SectionCard';
import { Tag } from '@/components/Tag';
import { SPECIALISTS } from '@/lib/specialists';
import { useStore } from '@/lib/store';
import type { Specialist } from '@/lib/types';

function openLinkedin(url: string) {
  void Linking.openURL(url);
}

export default function SpecialistsTab() {
  const [muted, accent] = useThemeColor(['muted', 'accent']);
  const chats = useStore((s) => s.chats);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SPECIALISTS;
    return SPECIALISTS.filter((sp) =>
      `${sp.name} ${sp.title} ${sp.field} ${sp.expertise.join(' ')}`.toLowerCase().includes(q),
    );
  }, [query]);

  const recommended = filtered.slice(0, 3);
  const showRecommended = query.trim().length === 0 && recommended.length > 0;

  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-foreground mb-1 text-2xl font-bold">Career specialists</Text>
      <Text className="text-muted mb-4 text-sm leading-5">
        Search for the right expert or browse our recommendations, chat with an AI specialist for
        tailored guidance, then connect with them on LinkedIn when you&apos;re ready.
      </Text>

      <View className="bg-field-background border-border mb-5 flex-row items-center gap-2 rounded-xl border px-3 py-2.5">
        <Search color={muted} size={18} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, specialty, or skill"
          placeholderTextColor={muted}
          className="text-foreground flex-1 text-base"
        />
      </View>

      {showRecommended ? (
        <>
          <View className="mb-3 flex-row items-center gap-2">
            <Sparkles color={accent} size={16} />
            <Text className="text-foreground text-base font-semibold">Recommended for you</Text>
          </View>
          <View className="mb-6 gap-3">
            {recommended.map((sp) => (
              <SpecialistCard
                key={sp.id}
                specialist={sp}
                messageCount={chats[sp.id]?.length ?? 0}
              />
            ))}
          </View>
        </>
      ) : null}

      <View className="mb-3 flex-row items-center gap-2">
        <Users color={muted} size={16} />
        <Text className="text-foreground text-base font-semibold">
          {query.trim() ? 'Results' : 'All specialists'}
        </Text>
      </View>

      {filtered.length === 0 ? (
        <SectionCard>
          <Text className="text-muted py-4 text-center text-sm">
            No specialists match “{query.trim()}”. Try a broader keyword.
          </Text>
        </SectionCard>
      ) : (
        <View className="gap-3">
          {filtered.map((sp) => (
            <SpecialistCard key={sp.id} specialist={sp} messageCount={chats[sp.id]?.length ?? 0} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function SpecialistCard({
  specialist: sp,
  messageCount,
}: {
  specialist: Specialist;
  messageCount: number;
}) {
  const initials = sp.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2);

  return (
    <SectionCard>
      <View className="flex-row items-start gap-3">
        <View className={`${sp.avatarColor} h-12 w-12 items-center justify-center rounded-full`}>
          <Text className="text-base font-bold text-white">{initials}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-foreground text-base font-semibold">{sp.name}</Text>
          <Text className="text-muted text-xs">{sp.title}</Text>
        </View>
      </View>

      <Text className="text-brand mt-3 text-sm font-semibold">{sp.field}</Text>
      <Text className="text-muted mt-1 text-xs leading-5">{sp.bio}</Text>

      <View className="mt-3 flex-row flex-wrap gap-1.5">
        {sp.expertise.map((e) => (
          <Tag key={e} label={e} tone="muted" />
        ))}
      </View>

      <View className="mt-4 flex-row gap-2">
        <Pressable
          onPress={() => router.push({ pathname: '/specialist/[id]', params: { id: sp.id } })}
          className="bg-brand flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 active:opacity-80"
        >
          <MessageCircle color="#fff" size={16} />
          <Text className="text-sm font-semibold text-white">
            {messageCount > 0 ? 'Continue chat' : 'Chat'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => openLinkedin(sp.linkedinUrl)}
          className="border-border flex-row items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 active:opacity-70"
        >
          <Linkedin color="#0A66C2" size={16} />
          <Text className="text-foreground text-sm font-semibold">Connect</Text>
        </Pressable>
      </View>

      {messageCount > 0 ? (
        <Text className="text-muted mt-2 text-xs">
          {messageCount} {messageCount === 1 ? 'message' : 'messages'}
        </Text>
      ) : null}
    </SectionCard>
  );
}
