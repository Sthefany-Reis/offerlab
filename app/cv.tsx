import { AlertTriangle, FileText, Sparkles, Upload, X } from 'lucide-react-native';
import { Button, Spinner, Text, TextArea, TextField, useThemeColor } from 'heroui-native';
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

type InputMode = 'paste' | 'upload';

export default function CvScreen() {
  const [accent, foreground, muted] = useThemeColor(['accent', 'foreground', 'muted']);
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const setAnalysis = useStore((s) => s.setAnalysis);
  const recordCvHistory = useStore((s) => s.recordCvHistory);

  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [targetRole, setTargetRole] = useState(profile?.targetRole ?? '');
  const [location, setLocation] = useState(profile?.location ?? '');
  const [rawText, setRawText] = useState(profile?.rawText ?? '');
  const [sourceName, setSourceName] = useState(profile?.sourceName ?? '');
  const [mode, setMode] = useState<InputMode>('paste');
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
      const nextProfile = {
        fullName: fullName.trim(),
        targetRole: targetRole.trim(),
        location: location.trim(),
        rawText: cleanText,
        sourceName: sourceName || 'Pasted text',
        updatedAt: Date.now(),
      };
      setProfile(nextProfile);
      const result = await analyzeCv({
        rawText: cleanText,
        targetRole: targetRole.trim(),
        location: location.trim(),
      });
      setAnalysis(result);
      recordCvHistory({ analysis: result, profile: nextProfile });
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
          <Text className="text-foreground text-lg font-bold">Analyze your CV</Text>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <X color={muted} size={22} />
          </Pressable>
        </View>
        <Text className="text-muted mt-1 text-sm leading-5">
          Paste your CV or upload a file. Tell us the role you want next for a tailored
          qualification path.
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SectionCard className="mb-4">
          <Text className="text-foreground text-base font-semibold">
            The role you want next{' '}
            <Text className="text-muted text-sm font-normal">(optional)</Text>
          </Text>
          <View className="bg-field-background border-border mt-2 rounded-xl border px-3 py-2.5">
            <TextInput
              value={targetRole}
              onChangeText={setTargetRole}
              placeholder="e.g. Senior Data Scientist"
              placeholderTextColor={muted}
              className="text-foreground text-base"
            />
          </View>
          <Text className="text-muted mt-2 text-xs leading-4">
            We&apos;ll show the certifications and skills you need to qualify for it.
          </Text>
        </SectionCard>

        <SectionCard className="mb-4">
          <View className="bg-default flex-row rounded-xl p-1">
            <ModeTab
              active={mode === 'paste'}
              label="Paste text"
              icon={<FileText color={mode === 'paste' ? accent : muted} size={16} />}
              onPress={() => setMode('paste')}
            />
            <ModeTab
              active={mode === 'upload'}
              label="Upload file"
              icon={<Upload color={mode === 'upload' ? accent : muted} size={16} />}
              onPress={() => setMode('upload')}
            />
          </View>

          {mode === 'paste' ? (
            <View className="mt-3">
              <TextField>
                <TextArea
                  placeholder="Paste the full text of your CV here…"
                  value={rawText}
                  onChangeText={setRawText}
                  multiline
                  className="min-h-44"
                  style={{ minHeight: 176, textAlignVertical: 'top' }}
                />
              </TextField>
              <Text className="text-muted mt-1.5 text-xs">
                {rawText.trim().length} characters ·{' '}
                {rawText.trim().length >= 80 ? 'ready' : 'add more detail'}
              </Text>
            </View>
          ) : (
            <View className="mt-3">
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

              {rawText.trim().length > 0 ? (
                <Text className="text-muted mt-2 text-xs">
                  {rawText.trim().length} characters extracted
                </Text>
              ) : null}
            </View>
          )}
        </SectionCard>

        <SectionCard title="About you" subtitle="Helps personalize your analysis" className="mb-4">
          <View className="gap-3">
            <View className="bg-field-background border-border rounded-xl border px-3 py-2.5">
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Full name"
                placeholderTextColor={muted}
                className="text-foreground text-base"
              />
            </View>
            <View className="bg-field-background border-border rounded-xl border px-3 py-2.5">
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="Location (e.g. Berlin, Germany)"
                placeholderTextColor={muted}
                className="text-foreground text-base"
              />
            </View>
          </View>
        </SectionCard>

        {error ? (
          <View className="bg-danger/10 mb-4 rounded-xl px-3 py-3">
            <Text className="text-danger text-sm">{error}</Text>
          </View>
        ) : null}

        <Button onPress={handleAnalyze} isDisabled={!canAnalyze}>
          {analyzing ? <Spinner size="sm" /> : <Sparkles color="#fff" size={18} />}
          <Button.Label>{analyzing ? 'Analyzing your CV…' : 'Analyze my CV'}</Button.Label>
        </Button>
        <Text className="text-muted mt-2 text-center text-xs">
          We estimate market value, strengths and skill gaps.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ModeTab(props: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-lg py-2 ${
        props.active ? 'bg-surface' : ''
      }`}
      style={
        props.active
          ? {
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 1 },
              elevation: 1,
            }
          : undefined
      }
    >
      {props.icon}
      <Text className={`text-sm font-semibold ${props.active ? 'text-foreground' : 'text-muted'}`}>
        {props.label}
      </Text>
    </Pressable>
  );
}
