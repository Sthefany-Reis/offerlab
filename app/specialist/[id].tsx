import { ArrowLeft, Linkedin, MessageCircle, RotateCcw, Send } from 'lucide-react-native';
import { Spinner, Text, useThemeColor } from 'heroui-native';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';

import { EmptyState } from '@/components/EmptyState';
import { chatWithSpecialist, OpenAIError } from '@/lib/openai';
import { getSpecialist } from '@/lib/specialists';
import { useStore } from '@/lib/store';
import type { ChatMessage } from '@/lib/types';

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function SpecialistChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [muted, foreground] = useThemeColor(['muted', 'foreground']);
  const specialist = id ? getSpecialist(id) : undefined;

  const analysis = useStore((s) => s.analysis);
  const profile = useStore((s) => s.profile);
  const chats = useStore((s) => s.chats);
  const addChatMessage = useStore((s) => s.addChatMessage);
  const clearChat = useStore((s) => s.clearChat);

  const messages = useMemo(() => (id ? (chats[id] ?? []) : []), [chats, id]);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [messages.length, sending]);

  if (!specialist || !id) {
    return (
      <View className="bg-background flex-1 justify-center">
        <EmptyState
          icon={MessageCircle}
          title="Specialist not found"
          description="This mentor is unavailable."
          actionLabel="Back"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setError(null);
    const userMsg: ChatMessage = { id: uid(), role: 'user', text, createdAt: Date.now() };
    addChatMessage(id, userMsg);
    setInput('');
    setSending(true);
    try {
      const reply = await chatWithSpecialist({
        specialist,
        history: [...messages, userMsg],
        analysis,
        targetRole: profile?.targetRole ?? '',
      });
      addChatMessage(id, { id: uid(), role: 'specialist', text: reply, createdAt: Date.now() });
    } catch (e) {
      setError(e instanceof OpenAIError ? e.message : 'Message failed. Try again.');
    } finally {
      setSending(false);
    }
  };

  const suggestions = [
    'Review my CV strengths',
    'How do I reach my target role?',
    'What should I focus on next?',
  ];

  const initials = specialist.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2);

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="pt-safe-offset-3 border-border border-b px-4 pb-3">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <ArrowLeft color={foreground} size={22} />
          </Pressable>
          <View
            className={`${specialist.avatarColor} h-9 w-9 items-center justify-center rounded-full`}
          >
            <Text className="text-xs font-bold text-white">{initials}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-foreground text-base font-bold">{specialist.name}</Text>
            <Text className="text-muted text-xs">{specialist.title}</Text>
          </View>
          {messages.length > 0 ? (
            <Pressable onPress={() => clearChat(id)} hitSlop={8}>
              <RotateCcw color={muted} size={18} />
            </Pressable>
          ) : null}
          <Pressable onPress={() => void Linking.openURL(specialist.linkedinUrl)} hitSlop={8}>
            <Linkedin color="#0A66C2" size={20} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 12 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View className="mt-6 items-center">
            <View
              className={`${specialist.avatarColor} h-16 w-16 items-center justify-center rounded-full`}
            >
              <Text className="text-xl font-bold text-white">{initials}</Text>
            </View>
            <Text className="text-foreground mt-3 text-center text-base font-semibold">
              Chat with {specialist.name.split(' ')[0]}
            </Text>
            <Text className="text-muted mt-1 text-center text-xs leading-5">
              {specialist.bio} Ask anything about {specialist.field.toLowerCase()}.
            </Text>
            <View className="mt-4 w-full gap-2">
              {suggestions.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setInput(s)}
                  className="border-border bg-surface rounded-xl border px-3 py-2.5 active:opacity-70"
                >
                  <Text className="text-foreground text-sm">{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          messages.map((m) => (
            <View
              key={m.id}
              className={`mb-3 max-w-[82%] rounded-2xl px-3.5 py-2.5 ${
                m.role === 'user'
                  ? 'bg-brand self-end'
                  : 'bg-surface border-border self-start border'
              }`}
            >
              <Text
                className={`text-sm leading-6 ${m.role === 'user' ? 'text-white' : 'text-foreground'}`}
              >
                {m.text}
              </Text>
            </View>
          ))
        )}

        {sending ? (
          <View className="bg-surface border-border mb-3 flex-row items-center gap-2 self-start rounded-2xl border px-3.5 py-2.5">
            <Spinner size="sm" />
            <Text className="text-muted text-xs">{specialist.name.split(' ')[0]} is typing…</Text>
          </View>
        ) : null}

        {error ? (
          <View className="bg-danger/10 mb-2 rounded-xl px-3 py-2.5">
            <Text className="text-danger text-xs">{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View className="border-border bg-background pb-safe-offset-2 border-t px-3 pt-2.5">
        <View className="bg-field-background border-border flex-row items-end gap-2 rounded-2xl border px-3 py-2">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={`Message ${specialist.name.split(' ')[0]}…`}
            placeholderTextColor={muted}
            className="text-foreground max-h-28 flex-1 text-base"
            multiline
          />
          <Pressable
            onPress={() => void send()}
            disabled={!input.trim() || sending}
            className={`h-9 w-9 items-center justify-center rounded-full ${
              input.trim() && !sending ? 'bg-brand' : 'bg-default'
            }`}
          >
            <Send color={input.trim() && !sending ? '#fff' : muted} size={16} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
