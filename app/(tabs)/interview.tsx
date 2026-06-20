import { MessagesSquare, Plus } from 'lucide-react-native';
import { Button, Text } from 'heroui-native';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { SectionCard } from '@/components/SectionCard';
import { Tag } from '@/components/Tag';
import { useStore } from '@/lib/store';

export default function InterviewTab() {
  const insets = useSafeAreaInsets();
  const analysis = useStore((s) => s.analysis);
  const sessions = useStore((s) => s.sessions);

  if (!analysis) {
    return (
      <View className="bg-background flex-1 justify-center" style={{ paddingTop: insets.top }}>
        <EmptyState
          icon={MessagesSquare}
          title="Analyze your CV first"
          description="Interview prep is personalized to your background. Add and analyze your CV to begin."
          actionLabel="Add my CV"
          onAction={() => router.push('/cv')}
        />
      </View>
    );
  }

  return (
    <View className="bg-background flex-1">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
      >
        {sessions.length === 0 ? (
          <SectionCard>
            <EmptyState
              icon={MessagesSquare}
              title="Practice your interview"
              description="Generate role-specific questions, answer them, and get instant AI feedback with model answers."
              actionLabel="Start a session"
              onAction={() => router.push('/interview/new')}
            />
          </SectionCard>
        ) : (
          sessions.map((session) => {
            const answered = session.feedback.length;
            return (
              <Pressable
                key={session.id}
                onPress={() =>
                  router.push({ pathname: '/interview/[id]', params: { id: session.id } })
                }
                className="mb-3"
              >
                <SectionCard>
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-foreground text-base font-semibold">
                        {session.role}
                      </Text>
                      {session.company ? (
                        <Text className="text-muted text-sm">{session.company}</Text>
                      ) : null}
                    </View>
                    <Tag
                      label={`${answered}/${session.questions.length}`}
                      tone={answered === session.questions.length ? 'positive' : 'brand'}
                    />
                  </View>
                  <Text className="text-muted mt-2 text-xs">
                    {session.questions.length} questions · {answered} answered
                  </Text>
                </SectionCard>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {sessions.length > 0 ? (
        <View
          className="absolute inset-x-0 bottom-0 px-4"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <Button onPress={() => router.push('/interview/new')}>
            <Plus color="#fff" size={18} />
            <Button.Label>New practice session</Button.Label>
          </Button>
        </View>
      ) : null}
    </View>
  );
}
