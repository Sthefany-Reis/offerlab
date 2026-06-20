import { Lock, Sparkles, X } from 'lucide-react-native';
import { Button, Label, Spinner, Text, TextArea, TextField, useThemeColor } from 'heroui-native';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { SectionCard } from '@/components/SectionCard';
import { OpenAIError, tailorApplication } from '@/lib/openai';
import { useStore } from '@/lib/store';

export default function NewApplication() {
  const [muted, accent] = useThemeColor(['muted', 'accent']);
  const params = useLocalSearchParams();
  const analysis = useStore((s) => s.analysis);
  const profile = useStore((s) => s.profile);
  const addApplication = useStore((s) => s.addApplication);
  const isPro = useStore((s) => Boolean(s.pro?.active));

  const [jobTitle, setJobTitle] = useState(
    Array.isArray(params.jobTitle) ? (params.jobTitle[0] ?? '') : (params.jobTitle ?? ''),
  );
  const [company, setCompany] = useState(
    Array.isArray(params.company) ? (params.company[0] ?? '') : (params.company ?? ''),
  );
  const [jobDescription, setJobDescription] = useState(
    Array.isArray(params.jobDescription)
      ? (params.jobDescription[0] ?? '')
      : (params.jobDescription ?? ''),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formReady =
    jobTitle.trim().length > 1 && jobDescription.trim().length >= 60 && !loading && !!analysis;
  const canSubmit = isPro ? formReady : !loading;

  const submit = async () => {
    if (!analysis || !profile) return;
    if (!isPro) {
      router.push({ pathname: '/paywall', params: { feature: 'AI cover letters' } });
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const app = await tailorApplication({
        analysis,
        rawCv: profile.rawText,
        jobTitle: jobTitle.trim(),
        company: company.trim(),
        jobDescription: jobDescription.trim(),
      });
      addApplication(app);
      router.replace({ pathname: '/application/[id]', params: { id: app.id } });
    } catch (e) {
      setError(e instanceof OpenAIError ? e.message : 'Could not tailor this application.');
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
          <Text className="text-foreground text-lg font-bold">Tailor application</Text>
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
              <Label>Job title</Label>
              <Field value={jobTitle} onChangeText={setJobTitle} placeholder="Staff Engineer" />
            </TextField>
            <TextField>
              <Label>Company</Label>
              <Field value={company} onChangeText={setCompany} placeholder="Acme Inc." />
            </TextField>
            <TextField>
              <Label>Job description</Label>
              <TextArea
                placeholder="Paste the full job description here…"
                value={jobDescription}
                onChangeText={setJobDescription}
                multiline
                style={{ minHeight: 180, textAlignVertical: 'top' }}
              />
            </TextField>
            <Text className="text-muted text-xs">
              {jobDescription.trim().length} characters · paste the full posting for the best match
            </Text>
          </View>
        </SectionCard>

        {error ? (
          <View className="bg-danger/10 mb-4 rounded-xl px-3 py-3">
            <Text className="text-danger text-sm">{error}</Text>
          </View>
        ) : null}

        {!isPro ? (
          <View
            className="mb-4 flex-row items-start gap-2 rounded-xl px-3 py-3"
            style={{ backgroundColor: `${accent}14` }}
          >
            <Lock color={accent} size={16} />
            <Text className="text-foreground flex-1 text-xs leading-5">
              AI cover letters and tailored resume bullets are a Pro feature. Unlock to generate a
              tailored application from this posting.
            </Text>
          </View>
        ) : null}

        <Button onPress={submit} isDisabled={!canSubmit}>
          {loading ? (
            <Spinner size="sm" />
          ) : isPro ? (
            <Sparkles color="#fff" size={18} />
          ) : (
            <Lock color="#fff" size={18} />
          )}
          <Button.Label>
            {loading
              ? 'Tailoring your application…'
              : isPro
                ? 'Tailor my application'
                : 'Unlock with Pro'}
          </Button.Label>
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
