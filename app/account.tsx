import { Check, X } from 'lucide-react-native';
import { Button, Label, Text, TextField, useThemeColor } from 'heroui-native';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';

import { useStore } from '@/lib/store';

const logo = require('@/assets/offerlab-logo.png');

export default function AccountScreen() {
  const [muted] = useThemeColor(['muted']);
  const account = useStore((s) => s.account);
  const setAccount = useStore((s) => s.setAccount);

  const isEditing = Boolean(account);
  const [name, setName] = useState(account?.name ?? '');
  const [email, setEmail] = useState(account?.email ?? '');

  const emailValid = /.+@.+\..+/.test(email.trim());
  const canSubmit = name.trim().length >= 2 && emailValid;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setAccount({ name, email });
    router.back();
  };

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="pt-safe-offset-4 flex-row items-center justify-end px-4 pb-2">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <X color={muted} size={22} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 40, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center">
          <View
            className="bg-surface border-border items-center rounded-3xl border p-6"
            style={{
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: 2,
            }}
          >
            <Image
              source={logo}
              style={{ width: 88, height: 88 }}
              resizeMode="contain"
              accessibilityLabel="OfferLab logo"
            />
            <Text className="text-muted mt-1 text-[10px] font-semibold tracking-[1.5px] uppercase">
              Experiment. Optimize. Land your next offer.
            </Text>
          </View>
        </View>

        <Text className="text-foreground mt-7 text-center text-3xl font-bold">
          {isEditing ? 'Your profile' : 'Create your account'}
        </Text>
        <Text className="text-muted mt-1.5 text-center text-base">
          Start turning your CV into offers.
        </Text>

        <View className="mt-8 gap-4">
          <TextField>
            <Label>Name</Label>
            <FieldInput value={name} onChangeText={setName} placeholder="Jane Doe" />
          </TextField>
          <TextField>
            <Label>Email</Label>
            <FieldInput
              value={email}
              onChangeText={setEmail}
              placeholder="jane@example.com"
              keyboardType="email-address"
            />
          </TextField>
        </View>

        <Button className="mt-7" onPress={handleSubmit} isDisabled={!canSubmit}>
          <Check color="#fff" size={18} />
          <Button.Label>{isEditing ? 'Save profile' : 'Create account'}</Button.Label>
        </Button>

        <Text className="text-muted mt-4 text-center text-xs leading-5">
          Stored only on this device to personalize OfferLab. No password required.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FieldInput(props: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address';
}) {
  const [muted] = useThemeColor(['muted']);
  return (
    <View className="bg-field-background border-border rounded-xl border px-3 py-3">
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={muted}
        keyboardType={props.keyboardType ?? 'default'}
        autoCapitalize={props.keyboardType === 'email-address' ? 'none' : 'words'}
        autoCorrect={false}
        className="text-foreground text-base"
      />
    </View>
  );
}
