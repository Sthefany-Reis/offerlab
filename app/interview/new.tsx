import { Sparkles, X } from 'lucide-react-native';
import { Button, Label, Spinner, Text, TextField, useThemeColor } from 'heroui-native';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';

import { SectionCard } from '@/components/SectionCard';
import { generateInterview, OpenAIError } from '@/lib/openai';
import { useStore } from '@/lib/store';

export default function NewInterview() {
  const [muted] = useThemeColor(['muted']);
  const analysis = useStore((s) => s.analysis);
  const profile = useStore((s) => s.profile);
  const addSession = useStore((s) => s.addSession);

  const [role, setRole] = useState(profile?.targetRole ?? analysis?.detectedRole ?? '');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = role.trim().length > 1 && !loading && !!profile;

  const submit = async () => {
    if (!profile) return;
    setError(null);
    setLoading(true);
    try {
      const session = await generateInterview({
        role: role.trim(),
        company: company.trim(),
        rawCv: profile.rawText,
      });
      addSession(session);
      router.replace({ pathname: '/interview/[id]', params: { id: session.id } });
    } catch (e) {
      setError(e instanceof OpenAIError ? e.message : 'Could not generate questions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="pt-safe-offset-4 border-border border-b px-4 pb-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-foreground text-lg font-bold">Interview practice</Text>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <X color={muted} size={22} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SectionCard className="mb-4">
          <View className="gap-3">
            <TextField>
              <Label>Role</Label>
              <Field value={role} onChangeText={setRole} placeholder="Senior Backend Engineer" />
            </TextField>
            <TextField>
              <Label>Company (optional)</Label>
              <Field value={company} onChangeText={setCompany} placeholder="Acme Inc." />
            </TextField>
          </View>
          <Text className="text-muted mt-3 text-xs">
            We generate questions tailored to this role and your CV, then coach your answers.
          </Text>
        </SectionCard>

        {error ? (
          <View className="bg-danger/10 mb-4 rounded-xl px-3 py-3">
            <Text className="text-danger text-sm">{error}</Text>
          </View>
        ) : null}

        <Button onPress={submit} isDisabled={!canSubmit}>
          {loading ? <Spinner size="sm" /> : <Sparkles color="#fff" size={18} />}
          <Button.Label>{loading ? 'Building your session…' : 'Generate questions'}</Button.Label>
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field(props: { value: string; onChangeText: (t: string) => void; placeholder: string }) {
  const [muted] = useThemeColor(['muted']);
  return (
    <View className="bg-field-background border-border rounded-xl border px-3 py-2.5">
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={muted}
        className="text-foreground text-base"
      />
    </View>
  );
}
