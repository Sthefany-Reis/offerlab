import { Check, Eye, EyeOff, X } from 'lucide-react-native';
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

export default function AccountScreen() {
  const [muted] = useThemeColor(['muted']);
  const account = useStore((s) => s.account);
  const signUp = useStore((s) => s.signUp);
  const updateAccount = useStore((s) => s.updateAccount);

  const isEditing = Boolean(account);
  const [name, setName] = useState(account?.name ?? '');
  const [email, setEmail] = useState(account?.email ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const emailValid = /.+@.+\..+/.test(email.trim());
  const nameValid = name.trim().length >= 2;
  const passwordValid = isEditing || password.length >= 6;
  const canSubmit = nameValid && emailValid && passwordValid;

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (isEditing) {
      const result = updateAccount({ name, email });
      if (!result.ok) {
        setError(result.error ?? 'Could not save profile.');
        return;
      }
      router.back();
      return;
    }
    const result = signUp({ name, email, password });
    if (!result.ok) {
      setError(result.error ?? 'Could not create account.');
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
          {isEditing ? 'Update your details.' : 'Start turning your CV into offers.'}
        </Text>

        <View className="mt-8 gap-4">
          <FieldInput label="Name" value={name} onChangeText={setName} placeholder="Jane Doe" />
          <FieldInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="jane@example.com"
            keyboardType="email-address"
          />
          {isEditing ? null : (
            <PasswordInput value={password} onChangeText={setPassword} muted={muted} />
          )}
        </View>

        {error ? <Text className="text-danger mt-4 text-center text-sm">{error}</Text> : null}

        <Button className="mt-6" onPress={handleSubmit} isDisabled={!canSubmit}>
          <Check color="#fff" size={18} />
          <Button.Label>{isEditing ? 'Save profile' : 'Create account'}</Button.Label>
        </Button>

        {isEditing ? (
          <Text className="text-muted mt-4 text-center text-xs leading-5">
            Stored only on this device to personalize OfferLab.
          </Text>
        ) : (
          <View className="mt-6 flex-row items-center justify-center gap-1.5">
            <Text className="text-muted text-sm">Already have an account?</Text>
            <Pressable onPress={() => router.replace('/sign-in')} hitSlop={8}>
              <Text className="text-brand text-sm font-semibold">Sign in</Text>
            </Pressable>
          </View>
        )}
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

function PasswordInput(props: { value: string; onChangeText: (t: string) => void; muted: string }) {
  const [show, setShow] = useState(false);
  return (
    <View className="gap-1.5">
      <Text className="text-foreground text-sm font-medium">Password</Text>
      <View className="bg-field-background border-border flex-row items-center rounded-xl border px-3 py-3">
        <TextInput
          value={props.value}
          onChangeText={props.onChangeText}
          placeholder="At least 6 characters"
          placeholderTextColor={props.muted}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          className="text-foreground flex-1 text-base"
        />
        <Pressable onPress={() => setShow((v) => !v)} hitSlop={8}>
          {show ? <EyeOff color={props.muted} size={18} /> : <Eye color={props.muted} size={18} />}
        </Pressable>
      </View>
    </View>
  );
}
