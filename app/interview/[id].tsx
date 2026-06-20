import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Lightbulb,
  SkipForward,
  Sparkles,
  Trash2,
} from 'lucide-react-native';
import { Button, Spinner, Text, TextArea, TextField, useThemeColor } from 'heroui-native';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProgressBar } from '@/components/ProgressBar';
import { SectionCard } from '@/components/SectionCard';
import { Tag } from '@/components/Tag';
import { scoreColor } from '@/lib/format';
import { evaluateAnswer, OpenAIError } from '@/lib/openai';
import { useStore } from '@/lib/store';
import type { InterviewAnswerFeedback } from '@/lib/types';

const CATEGORY_TONE = {
  behavioral: 'violet',
  technical: 'brand',
  'role-specific': 'info',
  'company-fit': 'caution',
} as const;

export default function InterviewDetail() {
  const insets = useSafeAreaInsets();
  const [foreground, muted, accent] = useThemeColor(['foreground', 'muted', 'accent']);
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useStore((s) => s.sessions.find((x) => x.id === id));
  const remove = useStore((s) => s.removeSession);
  const addFeedback = useStore((s) => s.addSessionFeedback);

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = session?.questions.length ?? 0;
  const question = session?.questions[index];

  const feedback = useMemo(
    () => session?.feedback.find((f) => f.questionId === question?.id),
    [session?.feedback, question?.id],
  );

  if (!session || !question) {
    return (
      <View
        className="bg-background flex-1 items-center justify-center"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-muted">Session not found.</Text>
        <Button variant="tertiary" className="mt-3" onPress={() => router.back()}>
          <Button.Label>Go back</Button.Label>
        </Button>
      </View>
    );
  }

  const answeredCount = session.feedback.length;
  const progress = total ? ((index + 1) / total) * 100 : 0;
  const isLast = index >= total - 1;

  const goTo = (next: number) => {
    if (next < 0 || next >= total) return;
    setIndex(next);
    setAnswer('');
    setRevealed(false);
    setError(null);
    setLoading(false);
  };

  const handleDelete = () => {
    remove(session.id);
    router.back();
  };

  const evaluate = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await evaluateAnswer({ question, answer: answer.trim(), role: session.role });
      addFeedback(session.id, result);
    } catch (e) {
      setError(e instanceof OpenAIError ? e.message : 'Could not evaluate your answer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        className="border-border flex-row items-center justify-between border-b px-4 pb-3"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable onPress={() => router.back()} hitSlop={10} className="flex-row items-center">
          <ChevronLeft color={foreground} size={24} />
          <Text className="text-foreground text-base font-semibold">{session.role}</Text>
        </Pressable>
        <Pressable onPress={handleDelete} hitSlop={10}>
          <Trash2 color={muted} size={20} />
        </Pressable>
      </View>

      <View className="border-border border-b px-4 py-3">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-muted text-xs font-semibold">
            Question {index + 1} of {total}
          </Text>
          <Text className="text-muted text-xs">{answeredCount} answered</Text>
        </View>
        <ProgressBar value={progress} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SectionCard>
          <View className="flex-row items-center gap-2">
            <Tag label={question.category} tone={CATEGORY_TONE[question.category]} />
            <Tag label={question.difficulty} tone="muted" />
            {feedback ? (
              <Text className={`ml-auto text-sm font-bold ${scoreColor(feedback.score)}`}>
                {feedback.score}/100
              </Text>
            ) : null}
          </View>

          <Text className="text-foreground mt-3 text-lg leading-7 font-semibold">
            {question.question}
          </Text>

          <View className="bg-default/60 mt-3 rounded-xl p-3">
            <Text className="text-muted text-xs font-semibold">What they look for</Text>
            <Text className="text-foreground mt-1 text-xs leading-5">
              {question.whatTheyLookFor}
            </Text>
          </View>

          <TextField className="mt-4">
            <TextArea
              placeholder="Type your answer…"
              value={feedback ? feedback.userAnswer : answer}
              onChangeText={setAnswer}
              editable={!feedback}
              multiline
              style={{ minHeight: 120, textAlignVertical: 'top' }}
            />
          </TextField>

          {error ? <Text className="text-danger mt-2 text-xs">{error}</Text> : null}

          {!feedback ? (
            <View className="mt-3 gap-2">
              <Button onPress={evaluate} isDisabled={answer.trim().length < 15 || loading}>
                {loading ? <Spinner size="sm" /> : <Sparkles color="#fff" size={16} />}
                <Button.Label>{loading ? 'Scoring…' : 'Submit answer'}</Button.Label>
              </Button>

              <View className="flex-row gap-2">
                <Button
                  variant="tertiary"
                  className="flex-1"
                  onPress={() => setRevealed((v) => !v)}
                >
                  <Eye color={accent} size={16} />
                  <Button.Label>{revealed ? 'Hide answer' : 'Show answer'}</Button.Label>
                </Button>
                <Button
                  variant="tertiary"
                  className="flex-1"
                  onPress={() => (isLast ? router.back() : goTo(index + 1))}
                >
                  <SkipForward color={accent} size={16} />
                  <Button.Label>{isLast ? 'Finish' : 'Skip'}</Button.Label>
                </Button>
              </View>
            </View>
          ) : null}

          {revealed && !feedback ? (
            <View className="bg-violet-soft mt-4 rounded-xl p-3">
              <View className="flex-row items-center gap-1.5">
                <Lightbulb color={accent} size={14} />
                <Text className="text-violet text-xs font-semibold">Model answer</Text>
              </View>
              <Text className="text-foreground mt-1.5 text-xs leading-5">
                {question.modelAnswerOutline}
              </Text>
            </View>
          ) : null}

          {feedback ? <FeedbackBlock feedback={feedback} /> : null}
        </SectionCard>

        <View className="mt-4 flex-row gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onPress={() => goTo(index - 1)}
            isDisabled={index === 0}
          >
            <ChevronLeft color={index === 0 ? muted : accent} size={16} />
            <Button.Label>Previous</Button.Label>
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onPress={() => (isLast ? router.back() : goTo(index + 1))}
          >
            <Button.Label>{isLast ? 'Done' : 'Next'}</Button.Label>
            <ChevronRight color={accent} size={16} />
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FeedbackBlock({ feedback }: { feedback: InterviewAnswerFeedback }) {
  const [accent] = useThemeColor(['accent']);
  return (
    <View className="mt-4 gap-3">
      <View className="bg-positive/10 flex-row items-center gap-2 rounded-xl px-3 py-2.5">
        <Check color="#16a34a" size={16} />
        <Text className="text-positive text-sm font-semibold">Answer submitted</Text>
      </View>
      {feedback.strengths.length ? (
        <View>
          <Text className="text-positive text-xs font-semibold">Strengths</Text>
          {feedback.strengths.map((s) => (
            <Text key={s} className="text-foreground mt-1 text-xs leading-5">
              • {s}
            </Text>
          ))}
        </View>
      ) : null}
      {feedback.improvements.length ? (
        <View>
          <Text className="text-caution text-xs font-semibold">Improve</Text>
          {feedback.improvements.map((s) => (
            <Text key={s} className="text-foreground mt-1 text-xs leading-5">
              • {s}
            </Text>
          ))}
        </View>
      ) : null}
      {feedback.tips.length ? (
        <View className="bg-brand-soft rounded-xl p-3">
          <View className="flex-row items-center gap-1.5">
            <Lightbulb color={accent} size={14} />
            <Text className="text-brand text-xs font-semibold">How to answer this</Text>
          </View>
          {feedback.tips.map((t) => (
            <Text key={t} className="text-foreground mt-1.5 text-xs leading-5">
              • {t}
            </Text>
          ))}
        </View>
      ) : null}
      <View className="bg-violet-soft rounded-xl p-3">
        <View className="flex-row items-center gap-1.5">
          <Sparkles color={accent} size={14} />
          <Text className="text-violet text-xs font-semibold">Full sample answer</Text>
        </View>
        <Text className="text-foreground mt-1.5 text-xs leading-5">{feedback.fullAnswer}</Text>
      </View>
      <View className="bg-default/60 rounded-xl p-3">
        <Text className="text-muted text-xs font-semibold">Quick tip</Text>
        <Text className="text-foreground mt-1.5 text-xs leading-5">{feedback.suggestedAnswer}</Text>
      </View>
    </View>
  );
}
