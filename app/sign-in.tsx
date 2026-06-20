import { Eye, EyeOff, LogIn } from 'lucide-react-native';
import { Button, Text, useThemeColor } from 'heroui-native';
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

export default function SignInScreen() {
  const signIn = useStore((s) => s.signIn);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const emailValid = /.+@.+\..+/.test(email.trim());
  const canSubmit = emailValid && password.length >= 1;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const result = signIn({ email, password });
    if (!result.ok) {
      setError(result.error ?? 'Could not sign in.');
      return;
    }
    setError(null);
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 40, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-safe-offset-4 items-center">
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

        <Text className="text-foreground mt-7 text-center text-3xl font-bold">Welcome back</Text>
        <Text className="text-muted mt-1.5 text-center text-base">
          Sign in to pick up where you left off.
        </Text>

        <View className="mt-8 gap-4">
          <FieldInput
            label="Email"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setError(null);
            }}
            placeholder="jane@example.com"
            keyboardType="email-address"
          />
          <PasswordInput
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setError(null);
            }}
          />
        </View>

        {error ? <Text className="text-danger mt-4 text-center text-sm">{error}</Text> : null}

        <Button className="mt-6" onPress={handleSubmit} isDisabled={!canSubmit}>
          <LogIn color="#fff" size={18} />
          <Button.Label>Sign in</Button.Label>
        </Button>

        <View className="mt-6 flex-row items-center justify-center gap-1.5">
          <Text className="text-muted text-sm">New to OfferLab?</Text>
          <Pressable onPress={() => router.push('/account')} hitSlop={8}>
            <Text className="text-brand text-sm font-semibold">Create an account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FieldInput(props: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address';
}) {
  const [muted] = useThemeColor(['muted']);
  return (
    <View className="gap-1.5">
      <Text className="text-foreground text-sm font-medium">{props.label}</Text>
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
    </View>
  );
}

function PasswordInput(props: { value: string; onChangeText: (t: string) => void }) {
  const [muted] = useThemeColor(['muted']);
  const [show, setShow] = useState(false);
  return (
    <View className="gap-1.5">
      <Text className="text-foreground text-sm font-medium">Password</Text>
      <View className="bg-field-background border-border flex-row items-center rounded-xl border px-3 py-3">
        <TextInput
          value={props.value}
          onChangeText={props.onChangeText}
          placeholder="Your password"
          placeholderTextColor={muted}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          className="text-foreground flex-1 text-base"
        />
        <Pressable onPress={() => setShow((v) => !v)} hitSlop={8}>
          {show ? <EyeOff color={muted} size={18} /> : <Eye color={muted} size={18} />}
        </Pressable>
      </View>
    </View>
  );
}
