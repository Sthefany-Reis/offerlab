import { AlertTriangle, FileText, Sparkles, Upload, X } from 'lucide-react-native';
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
import { pickAndExtractCv } from '@/lib/cv';
import { analyzeCv, OpenAIError } from '@/lib/openai';
import { useStore } from '@/lib/store';

export default function CvScreen() {
  const [accent, foreground, muted] = useThemeColor(['accent', 'foreground', 'muted']);
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const setAnalysis = useStore((s) => s.setAnalysis);

  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [targetRole, setTargetRole] = useState(profile?.targetRole ?? '');
  const [location, setLocation] = useState(profile?.location ?? '');
  const [rawText, setRawText] = useState(profile?.rawText ?? '');
  const [sourceName, setSourceName] = useState(profile?.sourceName ?? '');
  const [warning, setWarning] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAnalyze = rawText.trim().length >= 80 && !analyzing;

  const handlePick = async () => {
    setError(null);
    setWarning(null);
    setPicking(true);
    try {
      const doc = await pickAndExtractCv();
      if (doc) {
        setRawText(doc.text);
        setSourceName(doc.name);
        if (doc.warning) setWarning(doc.warning);
      }
    } catch {
      setError('Could not read that file. Try pasting your CV text instead.');
    } finally {
      setPicking(false);
    }
  };

  const handleAnalyze = async () => {
    setError(null);
    setAnalyzing(true);
    try {
      const cleanText = rawText.trim();
      setProfile({
        fullName: fullName.trim(),
        targetRole: targetRole.trim(),
        location: location.trim(),
        rawText: cleanText,
        sourceName: sourceName || 'Pasted text',
        updatedAt: Date.now(),
      });
      const result = await analyzeCv({
        rawText: cleanText,
        targetRole: targetRole.trim(),
        location: location.trim(),
      });
      setAnalysis(result);
      router.back();
    } catch (e) {
      setError(e instanceof OpenAIError ? e.message : 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="pt-safe-offset-4 border-border border-b px-4 pb-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-foreground text-lg font-bold">Your CV</Text>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <X color={muted} size={22} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SectionCard title="About you" className="mb-4">
          <View className="gap-3">
            <TextField>
              <Label>Full name</Label>
              <FieldInput value={fullName} onChangeText={setFullName} placeholder="Jane Doe" />
            </TextField>
            <TextField>
              <Label>Target role</Label>
              <FieldInput
                value={targetRole}
                onChangeText={setTargetRole}
                placeholder="Senior Product Designer"
              />
            </TextField>
            <TextField>
              <Label>Location</Label>
              <FieldInput
                value={location}
                onChangeText={setLocation}
                placeholder="Berlin, Germany"
              />
            </TextField>
          </View>
        </SectionCard>

        <SectionCard
          title="CV content"
          subtitle="Upload a file or paste your CV text"
          className="mb-4"
        >
          <Button variant="secondary" onPress={handlePick} isDisabled={picking}>
            {picking ? <Spinner size="sm" /> : <Upload color={foreground} size={18} />}
            <Button.Label>{picking ? 'Reading file…' : 'Upload PDF, DOC or TXT'}</Button.Label>
          </Button>

          {sourceName ? (
            <View className="bg-brand-soft mt-3 flex-row items-center gap-2 rounded-xl px-3 py-2">
              <FileText color={accent} size={16} />
              <Text className="text-brand flex-1 text-xs font-medium" numberOfLines={1}>
                {sourceName}
              </Text>
            </View>
          ) : null}

          {warning ? (
            <View className="bg-caution-soft mt-3 flex-row items-start gap-2 rounded-xl px-3 py-2">
              <AlertTriangle color="#9a6a00" size={16} />
              <Text className="text-caution flex-1 text-xs">{warning}</Text>
            </View>
          ) : null}

          <View className="my-3 flex-row items-center gap-2">
            <View className="bg-border h-px flex-1" />
            <Text className="text-muted text-xs">or paste below</Text>
            <View className="bg-border h-px flex-1" />
          </View>

          <TextField>
            <TextArea
              placeholder="Paste your full CV here…"
              value={rawText}
              onChangeText={setRawText}
              multiline
              className="min-h-40"
              style={{ minHeight: 160, textAlignVertical: 'top' }}
            />
          </TextField>
          <Text className="text-muted mt-1.5 text-xs">
            {rawText.trim().length} characters ·{' '}
            {rawText.trim().length >= 80 ? 'ready' : 'add more detail'}
          </Text>
        </SectionCard>

        {error ? (
          <View className="bg-danger/10 mb-4 rounded-xl px-3 py-3">
            <Text className="text-danger text-sm">{error}</Text>
          </View>
        ) : null}

        <Button onPress={handleAnalyze} isDisabled={!canAnalyze}>
          {analyzing ? <Spinner size="sm" /> : <Sparkles color="#fff" size={18} />}
          <Button.Label>
            {analyzing ? 'Analyzing your CV…' : 'Analyze & estimate value'}
          </Button.Label>
        </Button>
        <Text className="text-muted mt-2 text-center text-xs">
          We estimate market value, strengths and skill gaps.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FieldInput(props: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
}) {
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
