import { Briefcase, MapPin, Search, Sparkles, X } from 'lucide-react-native';
import { Button, Spinner, Text, useThemeColor } from 'heroui-native';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { EmptyState } from '@/components/EmptyState';
import { SectionCard } from '@/components/SectionCard';
import { Tag } from '@/components/Tag';
import { JobSearchError, type JobListing, searchJobs } from '@/lib/jobs';
import { useStore } from '@/lib/store';

export default function JobSearchScreen() {
  const [muted, accent] = useThemeColor(['muted', 'accent']);
  const analysis = useStore((s) => s.analysis);
  const profile = useStore((s) => s.profile);

  const [query, setQuery] = useState(profile?.targetRole ?? '');
  const [location, setLocation] = useState('');
  const [results, setResults] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(async (q: string, loc: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const jobs = await searchJobs({
        query: q.trim(),
        location: loc.trim(),
        signal: controller.signal,
      });
      if (!controller.signal.aborted) {
        setResults(jobs);
        setHasSearched(true);
      }
    } catch (e) {
      if (controller.signal.aborted) return;
      setError(e instanceof JobSearchError ? e.message : 'Could not load jobs. Try again.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void runSearch(profile?.targetRole ?? '', '');
    return () => abortRef.current?.abort();
  }, [runSearch, profile?.targetRole]);

  const openTailor = (job: JobListing) => {
    if (!analysis) {
      router.push('/cv');
      return;
    }
    router.push({
      pathname: '/application/new',
      params: {
        jobTitle: job.title,
        company: job.company,
        jobDescription: job.description,
      },
    });
  };

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="pt-safe-offset-4 border-border border-b px-4 pb-3">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-foreground text-lg font-bold">Search jobs</Text>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <X color={muted} size={22} />
          </Pressable>
        </View>

        <View className="bg-field-background border-border mb-2 flex-row items-center gap-2 rounded-xl border px-3 py-2.5">
          <Search color={muted} size={18} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Role, skill or company"
            placeholderTextColor={muted}
            className="text-foreground flex-1 text-base"
            returnKeyType="search"
            onSubmitEditing={() => void runSearch(query, location)}
          />
        </View>
        <View className="bg-field-background border-border flex-row items-center gap-2 rounded-xl border px-3 py-2.5">
          <MapPin color={muted} size={18} />
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Location (optional)"
            placeholderTextColor={muted}
            className="text-foreground flex-1 text-base"
            returnKeyType="search"
            onSubmitEditing={() => void runSearch(query, location)}
          />
        </View>

        <Button
          className="mt-3"
          onPress={() => void runSearch(query, location)}
          isDisabled={loading}
        >
          {loading ? <Spinner size="sm" /> : <Search color="#fff" size={18} />}
          <Button.Label>{loading ? 'Searching…' : 'Search'}</Button.Label>
        </Button>
      </View>

      {error ? (
        <View className="bg-danger/10 mx-4 mt-4 rounded-xl px-3 py-3">
          <Text className="text-danger text-sm">{error}</Text>
        </View>
      ) : null}

      {loading && results.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Spinner />
          <Text className="text-muted mt-3 text-sm">Loading live job listings…</Text>
        </View>
      ) : results.length === 0 && hasSearched ? (
        <View className="flex-1 justify-center">
          <EmptyState
            icon={Briefcase}
            title="No matching jobs"
            description="Try a broader role keyword or clear the location filter."
          />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            results.length > 0 ? (
              <Text className="text-muted mb-3 text-xs">
                {results.length} live {results.length === 1 ? 'listing' : 'listings'}
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => openTailor(item)} className="mb-3">
              <SectionCard>
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-foreground text-base font-semibold">{item.title}</Text>
                    <Text className="text-muted text-sm">{item.company}</Text>
                  </View>
                  <Sparkles color={accent} size={18} />
                </View>

                <View className="mt-2 flex-row flex-wrap items-center gap-1.5">
                  {item.remote ? <Tag label="Remote" tone="positive" /> : null}
                  {item.location ? <Tag label={item.location} tone="info" /> : null}
                  {item.tags.slice(0, 3).map((t) => (
                    <Tag key={t} label={t} tone="muted" />
                  ))}
                </View>

                {item.description ? (
                  <Text className="text-muted mt-2 text-xs leading-5" numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}

                <View className="mt-3 flex-row items-center">
                  <Text className="text-brand text-xs font-semibold">
                    Tap to tailor application
                  </Text>
                </View>
              </SectionCard>
            </Pressable>
          )}
        />
      )}
    </KeyboardAvoidingView>
  );
}
