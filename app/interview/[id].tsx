import { Check, ChevronLeft, Lightbulb, Sparkles, Trash2 } from 'lucide-react-native';
import { Button, Spinner, Text, TextArea, TextField, useThemeColor } from 'heroui-native';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProgressBar } from '@/components/ProgressBar';
import { SectionCard } from '@/components/SectionCard';
import { Tag } from '@/components/Tag';
import { scoreColor } from '@/lib/format';
import { evaluateAnswer, OpenAIError } from '@/lib/openai';
import { useStore } from '@/lib/store';
import type { InterviewQuestion } from '@/lib/types';

const CATEGORY_TONE = {
  behavioral: 'violet',
  technical: 'brand',
  'role-specific': 'info',
  'company-fit': 'caution',
} as const;

export default function InterviewDetail() {
  const insets = useSafeAreaInsets();
  const [foreground, muted] = useThemeColor(['foreground', 'muted']);
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useStore((s) => s.sessions.find((x) => x.id === id));
  const remove = useStore((s) => s.removeSession);

  if (!session) {
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

  const answered = session.feedback.length;
  const progress = session.questions.length ? (answered / session.questions.length) * 100 : 0;

  const handleDelete = () => {
    remove(session.id);
    router.back();
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

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SectionCard
          className="mb-4"
          title="Progress"
          subtitle={`${answered}/${session.questions.length} answered`}
        >
          <ProgressBar value={progress} />
        </SectionCard>

        {session.questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            index={i}
            sessionId={session.id}
            role={session.role}
            question={q}
          />
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function QuestionCard({
  index,
  sessionId,
  role,
  question,
}: {
  index: number;
  sessionId: string;
  role: string;
  question: InterviewQuestion;
}) {
  const [accent] = useThemeColor(['accent']);
  const feedback = useStore((s) =>
    s.sessions.find((x) => x.id === sessionId)?.feedback.find((f) => f.questionId === question.id),
  );
  const addFeedback = useStore((s) => s.addSessionFeedback);

  const [answer, setAnswer] = useState(feedback?.userAnswer ?? '');
  const [open, setOpen] = useState(!feedback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evaluate = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await evaluateAnswer({ question, answer: answer.trim(), role });
      addFeedback(sessionId, result);
    } catch (e) {
      setError(e instanceof OpenAIError ? e.message : 'Could not evaluate your answer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard className="mb-3">
      <Pressable onPress={() => setOpen((v) => !v)} className="flex-row items-start gap-2">
        <View
          className={`mt-0.5 h-6 w-6 items-center justify-center rounded-full ${
            feedback ? 'bg-positive' : 'bg-brand-soft'
          }`}
        >
          {feedback ? (
            <Check color="#fff" size={14} />
          ) : (
            <Text className="text-brand text-xs font-bold">{index + 1}</Text>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-foreground text-sm leading-5 font-semibold">
            {question.question}
          </Text>
          <View className="mt-2 flex-row items-center gap-2">
            <Tag label={question.category} tone={CATEGORY_TONE[question.category]} />
            <Tag label={question.difficulty} tone="muted" />
            {feedback ? (
              <Text className={`ml-auto text-sm font-bold ${scoreColor(feedback.score)}`}>
                {feedback.score}/100
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>

      {open ? (
        <View className="mt-3">
          <View className="bg-default/60 mb-3 rounded-xl p-3">
            <Text className="text-muted text-xs font-semibold">What they look for</Text>
            <Text className="text-foreground mt-1 text-xs leading-5">
              {question.whatTheyLookFor}
            </Text>
          </View>

          <TextField>
            <TextArea
              placeholder="Type your answer…"
              value={answer}
              onChangeText={setAnswer}
              multiline
              style={{ minHeight: 120, textAlignVertical: 'top' }}
            />
          </TextField>

          {error ? <Text className="text-danger mt-2 text-xs">{error}</Text> : null}

          <Button
            className="mt-3"
            variant={feedback ? 'secondary' : 'primary'}
            onPress={evaluate}
            isDisabled={answer.trim().length < 15 || loading}
          >
            {loading ? (
              <Spinner size="sm" />
            ) : (
              <Sparkles color={feedback ? accent : '#fff'} size={16} />
            )}
            <Button.Label>
              {loading ? 'Scoring…' : feedback ? 'Re-evaluate' : 'Get feedback'}
            </Button.Label>
          </Button>

          {feedback ? (
            <View className="mt-4 gap-3">
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
              <View className="bg-violet-soft rounded-xl p-3">
                <View className="flex-row items-center gap-1.5">
                  <Lightbulb color={accent} size={14} />
                  <Text className="text-violet text-xs font-semibold">Model answer</Text>
                </View>
                <Text className="text-foreground mt-1.5 text-xs leading-5">
                  {feedback.suggestedAnswer}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
    </SectionCard>
  );
}
