import { Sparkles, X } from 'lucide-react-native';
import { Button, Label, Spinner, Text, TextArea, TextField, useThemeColor } from 'heroui-native';
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
import { OpenAIError, tailorApplication } from '@/lib/openai';
import { useStore } from '@/lib/store';

export default function NewApplication() {
  const [muted] = useThemeColor(['muted']);
  const analysis = useStore((s) => s.analysis);
  const profile = useStore((s) => s.profile);
  const addApplication = useStore((s) => s.addApplication);

  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    jobTitle.trim().length > 1 && jobDescription.trim().length >= 60 && !loading && !!analysis;

  const submit = async () => {
    if (!analysis || !profile) return;
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

        <Button onPress={submit} isDisabled={!canSubmit}>
          {loading ? <Spinner size="sm" /> : <Sparkles color="#fff" size={18} />}
          <Button.Label>
            {loading ? 'Tailoring your application…' : 'Tailor my application'}
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
