import { ArrowRight, Linkedin, MessageCircle } from 'lucide-react-native';
import { Text, useThemeColor } from 'heroui-native';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';

import { SectionCard } from '@/components/SectionCard';
import { Tag } from '@/components/Tag';
import { SPECIALISTS } from '@/lib/specialists';
import { useStore } from '@/lib/store';

function openLinkedin(url: string) {
  void Linking.openURL(url);
}

export default function SpecialistsTab() {
  const [muted] = useThemeColor(['muted']);
  const chats = useStore((s) => s.chats);

  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-foreground mb-1 text-2xl font-bold">Specialists</Text>
      <Text className="text-muted mb-4 text-sm">
        Chat with expert mentors for tailored advice, then connect with them on LinkedIn.
      </Text>

      <View className="gap-3">
        {SPECIALISTS.map((sp) => {
          const messageCount = chats[sp.id]?.length ?? 0;
          const initials = sp.name
            .split(' ')
            .map((p) => p[0])
            .join('')
            .slice(0, 2);
          return (
            <Pressable
              key={sp.id}
              onPress={() => router.push({ pathname: '/specialist/[id]', params: { id: sp.id } })}
            >
              <SectionCard>
                <View className="flex-row items-start gap-3">
                  <View
                    className={`${sp.avatarColor} h-12 w-12 items-center justify-center rounded-full`}
                  >
                    <Text className="text-base font-bold text-white">{initials}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground text-base font-semibold">{sp.name}</Text>
                    <Text className="text-brand text-xs font-medium">{sp.title}</Text>
                    <Text className="text-muted mt-1 text-xs leading-5">{sp.bio}</Text>
                  </View>
                </View>

                <View className="mt-3 flex-row flex-wrap gap-1.5">
                  {sp.expertise.map((e) => (
                    <Tag key={e} label={e} tone="muted" />
                  ))}
                </View>

                <View className="border-border mt-3 flex-row items-center justify-between border-t pt-3">
                  <View className="flex-row items-center gap-1.5">
                    <MessageCircle color={muted} size={15} />
                    <Text className="text-muted text-xs">
                      {messageCount > 0 ? `${messageCount} messages` : 'Start chatting'}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <Pressable
                      onPress={() => openLinkedin(sp.linkedinUrl)}
                      hitSlop={8}
                      className="flex-row items-center gap-1"
                    >
                      <Linkedin color="#0A66C2" size={16} />
                      <Text className="text-xs font-semibold" style={{ color: '#0A66C2' }}>
                        Connect
                      </Text>
                    </Pressable>
                    <ArrowRight color={muted} size={16} />
                  </View>
                </View>
              </SectionCard>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
