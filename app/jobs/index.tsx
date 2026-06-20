import {
  Briefcase,
  ExternalLink,
  Linkedin,
  MapPin,
  Search,
  Sparkles,
  X,
} from 'lucide-react-native';
import { Button, Spinner, Text, useThemeColor } from 'heroui-native';
import {
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { EmptyState } from '@/components/EmptyState';
import { SectionCard } from '@/components/SectionCard';
import { Tag } from '@/components/Tag';
import {
  indeedJobUrl,
  JobSearchError,
  type JobListing,
  linkedinJobUrl,
  searchJobs,
  type WorkType,
} from '@/lib/jobs';
import { useStore } from '@/lib/store';

const WORK_TYPES: { value: WorkType; label: string }[] = [
  { value: 'any', label: 'Any' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'Onsite' },
];

export default function JobSearchScreen() {
  const [muted, accent, foreground] = useThemeColor(['muted', 'accent', 'foreground']);
  const params = useLocalSearchParams();
  const analysis = useStore((s) => s.analysis);
  const profile = useStore((s) => s.profile);

  const initialQuery = Array.isArray(params.q)
    ? (params.q[0] ?? '')
    : (params.q ?? profile?.targetRole ?? '');
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState('');
  const [workType, setWorkType] = useState<WorkType>('any');
  const [results, setResults] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(async (q: string, loc: string, wt: WorkType) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const jobs = await searchJobs({
        query: q.trim(),
        location: loc.trim(),
        workType: wt,
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
    void runSearch(initialQuery, '', 'any');
    return () => abortRef.current?.abort();
  }, [runSearch, initialQuery]);

  const selectWorkType = (wt: WorkType) => {
    setWorkType(wt);
    void runSearch(query, location, wt);
  };

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
        <View className="mb-1 flex-row items-center justify-between">
          <Text className="text-foreground text-lg font-bold">Find jobs</Text>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <X color={muted} size={22} />
          </Pressable>
        </View>
        <Text className="text-muted mb-3 text-xs">
          Search openings tailored to your profile and apply in one click.
        </Text>

        <View className="bg-field-background border-border mb-2 flex-row items-center gap-2 rounded-xl border px-3 py-2.5">
          <Search color={muted} size={18} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Role or keywords, e.g. Frontend Engineer"
            placeholderTextColor={muted}
            className="text-foreground flex-1 text-base"
            returnKeyType="search"
            onSubmitEditing={() => void runSearch(query, location, workType)}
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
            onSubmitEditing={() => void runSearch(query, location, workType)}
          />
        </View>

        <View className="mt-3 flex-row flex-wrap gap-2">
          {WORK_TYPES.map((wt) => {
            const active = workType === wt.value;
            return (
              <Pressable
                key={wt.value}
                onPress={() => selectWorkType(wt.value)}
                className={`rounded-full px-4 py-1.5 ${active ? 'bg-brand' : 'bg-default'}`}
              >
                <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-muted'}`}>
                  {wt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Button
          className="mt-3"
          onPress={() => void runSearch(query, location, workType)}
          isDisabled={loading}
        >
          {loading ? <Spinner size="sm" /> : <Search color="#fff" size={18} />}
          <Button.Label>{loading ? 'Searching…' : 'Search jobs'}</Button.Label>
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
            description="Try a broader role keyword, change the work type, or clear the location filter."
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
            <View className="mb-3">
              <SectionCard>
                <Pressable onPress={() => openTailor(item)}>
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-foreground text-base font-semibold">{item.title}</Text>
                      <Text className="text-muted text-sm">{item.company}</Text>
                    </View>
                    <Sparkles color={accent} size={18} />
                  </View>

                  <View className="mt-2 flex-row flex-wrap items-center gap-1.5">
                    <Tag
                      label={item.workType[0].toUpperCase() + item.workType.slice(1)}
                      tone={item.workType === 'remote' ? 'positive' : 'info'}
                    />
                    {item.location ? <Tag label={item.location} tone="muted" /> : null}
                    {item.tags.slice(0, 2).map((t) => (
                      <Tag key={t} label={t} tone="muted" />
                    ))}
                  </View>

                  {item.description ? (
                    <Text className="text-muted mt-2 text-xs leading-5" numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}

                  <Text className="text-brand mt-3 text-xs font-semibold">
                    Tap to tailor application
                  </Text>
                </Pressable>

                <View className="border-border mt-3 flex-row items-center gap-3 border-t pt-3">
                  <Text className="text-muted text-xs">Compare this role on:</Text>
                  <Pressable
                    onPress={() => void Linking.openURL(linkedinJobUrl(item.title, item.company))}
                    hitSlop={6}
                    className="flex-row items-center gap-1"
                  >
                    <Linkedin color="#0A66C2" size={15} />
                    <Text className="text-xs font-semibold" style={{ color: '#0A66C2' }}>
                      LinkedIn
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => void Linking.openURL(indeedJobUrl(item.title, item.company))}
                    hitSlop={6}
                    className="flex-row items-center gap-1"
                  >
                    <ExternalLink color={foreground} size={14} />
                    <Text className="text-foreground text-xs font-semibold">Indeed</Text>
                  </Pressable>
                </View>
              </SectionCard>
            </View>
          )}
        />
      )}
    </KeyboardAvoidingView>
  );
}
