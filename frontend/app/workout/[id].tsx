import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    Alert,
  } from "react-native"
  import { useLocalSearchParams, useRouter } from "expo-router"
  import { useQuery } from "@tanstack/react-query"
  import { useAuthStore } from "@/stores/authStore"
  import { apiClient } from "@/lib/apiClient"
  
  // Types
  interface WorkoutSession {
    id: number
    date: string
    notes: string | null
    routine_id: number | null
  }
  
  interface WorkoutExercise {
    id: number  // This is workout_exercise.id
    order_index: number
    notes: string | null
    exercise_id: number
    workout_id: number
    name: string
    category: string
    muscle_group: string
    sets?: SetLog[]  // Optional, will be populated
  }
  
  interface SetLog {
    id: number
    set_number: number
    reps: number
    weight: number
    rpe: number
    is_warmup: boolean
    notes: string | null
    created_at: string
  }
  
  export default function WorkoutDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const router = useRouter()
    const accessToken = useAuthStore((state) => state.accessToken)
  
    // 1. Fetch workout session
    const {
      data: session,
      isLoading: sessionLoading,
      error: sessionError,
    } = useQuery<WorkoutSession>({
      queryKey: ["workout-session", id],
      queryFn: () =>
        apiClient.get<WorkoutSession>(`/api/workout-sessions/${id}`, {
          token: accessToken ?? undefined,
        }),
      enabled: !!accessToken && !!id,
    })
  
    // 2. Fetch exercises for this workout
    const {
      data: exercises = [],
      isLoading: exercisesLoading,
      error: exercisesError,
    } = useQuery<WorkoutExercise[]>({
      queryKey: ["workout-exercises", id],
      queryFn: () =>
        apiClient.get<WorkoutExercise[]>(
          `/api/workout-exercises/workouts/${id}/exercises`,
          { token: accessToken ?? undefined }
        ),
      enabled: !!accessToken && !!id,
    })
  
    // 3. Fetch set logs for each exercise
    const {
      data: allSetLogs = {},
      isLoading: setsLoading,
      error: setsError,
    } = useQuery<Record<number, SetLog[]>>({
      queryKey: ["workout-sets", id, exercises.map((e) => e.id)],
      queryFn: async () => {
        console.log("Fetching sets for exercises:", exercises.map(e => ({ id: e.id, name: e.name })))
        
        if (exercises.length === 0) return {}
            
            const results = await Promise.all(
            exercises.map(async (ex) => {
                try {
                console.log(`Fetching sets for workout_exercise_id: ${ex.id}`)
                const sets = await apiClient.get<SetLog[]>(`/api/set-logs/${ex.id}`, {
                    token: accessToken ?? undefined,
                })
                console.log(`Got ${sets.length} sets for exercise ${ex.id}`)
                return { exerciseId: ex.id, sets }
                } catch (error) {
                console.error(`Failed to fetch sets for exercise ${ex.id}:`, error)
                return { exerciseId: ex.id, sets: [] } // Return empty array on error
                }
            })
            )
        ``
        // Turn array into a map: { exerciseId: sets[] }
        return results.reduce((acc, { exerciseId, sets }) => {
          acc[exerciseId] = sets
          return acc
        }, {} as Record<number, SetLog[]>)
      },
      enabled: exercises.length > 0 && !!accessToken,
      staleTime: 0, // Always fetch fresh data
    })
  
    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString("en-NZ", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    }
  
    const getTotalVolume = () => {
      const allSets = Object.values(allSetLogs).flat()
      return allSets.reduce((total, set) => total + set.weight * set.reps, 0)
    }
  
    const getTotalSets = () => {
      return Object.values(allSetLogs).flat().length
    }
  
    const isLoading = sessionLoading || exercisesLoading || setsLoading
  
    // Show loading
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading workout...</Text>
        </View>
      )
    }
  
    // Show error
    if (sessionError || !session) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Workout not found</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go back</Text>
          </Pressable>
        </View>
      )
    }
  
    // Log what we have
    console.log("Exercises:", exercises.length)
    console.log("AllSetLogs keys:", Object.keys(allSetLogs))
    console.log("AllSetLogs data:", allSetLogs)
  
    return (
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </Pressable>
          <Text style={styles.date}>{formatDate(session.date)}</Text>
          {session.notes && (
            <Text style={styles.sessionNotes}>{session.notes}</Text>
          )}
        </View>
  
        {/* Summary Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{exercises.length}</Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{getTotalSets()}</Text>
            <Text style={styles.statLabel}>Total Sets</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{getTotalVolume().toLocaleString()}</Text>
            <Text style={styles.statLabel}>kg Volume</Text>
          </View>
        </View>
  
        {/* Exercises */}
        <View style={styles.section}>
          {exercises.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No exercises logged</Text>
            </View>
          ) : (
            exercises
              .sort((a, b) => a.order_index - b.order_index)
              .map((exercise) => {
                const sets = allSetLogs[exercise.id] ?? []
                const warmupSets = sets.filter((s) => s.is_warmup)
                const workingSets = sets.filter((s) => !s.is_warmup)
  
                return (
                  <View key={exercise.id} style={styles.exerciseCard}>
                    {/* Exercise header */}
                    <View style={styles.exerciseHeader}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseMeta}>
                        {exercise.category} · {exercise.muscle_group}
                      </Text>
                    </View>
  
                    {/* Set table header */}
                    {sets.length > 0 && (
                      <View style={styles.setTableHeader}>
                        <Text style={[styles.setCol, styles.setColLabel]}>Set</Text>
                        <Text style={[styles.setCol, styles.setColLabel]}>kg</Text>
                        <Text style={[styles.setCol, styles.setColLabel]}>Reps</Text>
                        <Text style={[styles.setCol, styles.setColLabel]}>RPE</Text>
                      </View>
                    )}


  
                    {/* Warmup sets */}
                    {warmupSets.map((set) => (
                      <View key={set.id} style={[styles.setRow, styles.warmupRow]}>
                        <Text style={[styles.setCol, styles.warmupText]}>
                          W{set.set_number}
                        </Text>
                        <Text style={[styles.setCol, styles.warmupText]}>
                          {set.weight}
                        </Text>
                        <Text style={[styles.setCol, styles.warmupText]}>
                          {set.reps}
                        </Text>
                        <Text style={[styles.setCol, styles.warmupText]}>
                          {set.rpe}
                        </Text>
                      </View>
                    ))}
  
                    {/* Working sets */}
                    {workingSets.map((set) => (
                      <View key={set.id} style={styles.setRow}>
                        <Text style={styles.setCol}>{set.set_number}</Text>
                        <Text style={styles.setCol}>{set.weight}</Text>
                        <Text style={styles.setCol}>{set.reps}</Text>
                        <Text style={styles.setCol}>{set.rpe}</Text>
                      </View>
                    ))}
  
                    {sets.length === 0 && (
                      <Text style={styles.noSets}>No sets logged yet</Text>
                    )}
  
                    {/* Exercise notes */}
                    {exercise.notes && (
                      <Text style={styles.exerciseNotes}>{exercise.notes}</Text>
                    )}
                  </View>
                )
              })
          )}
        </View>
      </ScrollView>
    )
  }
  
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f9fafb" },
  
    // loading
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#f9fafb",
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: "#6b7280",
    },
  
    // error
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#f9fafb",
      padding: 24,
    },
    errorText: { fontSize: 16, color: "#6b7280", marginBottom: 16 },
    backButton: {
      backgroundColor: "#3b82f6",
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    backButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  
    // header
    header: {
      padding: 24,
      paddingTop: 60,
      backgroundColor: "#fff",
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
    },
    backBtn: { marginBottom: 12 },
    backBtnText: { fontSize: 16, color: "#3b82f6", fontWeight: "600" },
    date: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 4 },
    sessionNotes: { fontSize: 14, color: "#6b7280", marginTop: 4 },
  
    // stats
    statsRow: {
      flexDirection: "row",
      padding: 16,
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: "#fff",
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#e5e7eb",
    },
    statValue: { fontSize: 20, fontWeight: "700", color: "#3b82f6" },
    statLabel: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  
    // exercises
    section: { padding: 16 },
    exerciseCard: {
      backgroundColor: "#fff",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: "#e5e7eb",
    },
    exerciseHeader: { marginBottom: 12 },
    exerciseName: { fontSize: 16, fontWeight: "700", color: "#111827" },
    exerciseMeta: { fontSize: 13, color: "#6b7280", marginTop: 2 },
    exerciseNotes: {
      fontSize: 13,
      color: "#6b7280",
      marginTop: 8,
      fontStyle: "italic",
    },
  
    // set table
    setTableHeader: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#f3f4f6",
      paddingBottom: 8,
      marginBottom: 4,
    },
    setRow: {
      flexDirection: "row",
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: "#f9fafb",
    },
    warmupRow: { backgroundColor: "#fafafa" },
    setCol: {
      flex: 1,
      fontSize: 14,
      color: "#111827",
      textAlign: "center",
    },
    setColLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: "#6b7280",
      textAlign: "center",
    },
    warmupText: { color: "#9ca3af" },
    noSets: { fontSize: 13, color: "#9ca3af", textAlign: "center", padding: 8 },
  
    // empty
    emptyCard: {
      backgroundColor: "#fff",
      borderRadius: 12,
      padding: 24,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#e5e7eb",
      borderStyle: "dashed",
    },
    emptyText: { color: "#9ca3af", fontSize: 14 },
  })