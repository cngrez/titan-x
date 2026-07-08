import { useEffect, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  FlatList,
  RefreshControl,
} from "react-native"
import { useRouter } from "expo-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/authStore"
import { apiClient } from "@/lib/apiClient"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Types
interface Exercise {
  id: number
  name: string
  category: string
  muscle_group: string
}

interface PR {
  weight: number | null
  reps: number | null
  created_at: string | null
  name: string | null
}

interface WorkoutSummary {
  id: number
  date: string
  workout_name: string | null
  total_volume: number
  exercise_count: number
}

const MAX_PR_EXERCISES = 4

export default function HomeScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  // load saved PR exercises from storage
  useEffect(() => {
    const loadSaved = async () => {
      try {
        const saved = await AsyncStorage.getItem("pr_exercises")
        if (saved) setSelectedExercises(JSON.parse(saved))
      } catch {}
    }
    loadSaved()
  }, [])

  // fetch all exercises for the picker
  const { data: allExercises = [], isLoading: exercisesLoading } = useQuery<Exercise[]>({
    queryKey: ["exercises"],
    queryFn: () =>
      apiClient.get<Exercise[]>("/api/exercises/", { token: accessToken ?? undefined }),
    enabled: !!accessToken,
  })

  // fetch workout summaries (recent workouts with volume, duration, etc.)
  const { 
    data: recentWorkouts = [], 
    isLoading: workoutsLoading,
    refetch: refetchWorkouts,
  } = useQuery<WorkoutSummary[]>({
    queryKey: ["workout-summaries"],
    queryFn: () =>
      apiClient.get<WorkoutSummary[]>("/api/set-logs/summary", {
        token: accessToken ?? undefined,
      }),
    enabled: !!accessToken,
    select: (data) => data.slice(0, 3), // limit to 3 for home screen
  })

  // fetch PR for each selected exercise
  const { data: prs = [], isLoading: prsLoading, refetch: refetchPRs } = useQuery({
    queryKey: ["prs", selectedExercises.map((e) => e.id)],
    queryFn: async () => {
      if (selectedExercises.length === 0) return []
      return Promise.all(
        selectedExercises.map((ex) =>
          apiClient.get<PR>(`/api/set-logs/pr/${ex.id}`, {
            token: accessToken ?? undefined,
          })
        )
      )
    },
    enabled: selectedExercises.length > 0 && !!accessToken,
  })

  // Refresh all data
  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([
      refetchWorkouts(),
      refetchPRs(),
      queryClient.invalidateQueries({ queryKey: ["exercises"] }),
    ])
    setRefreshing(false)
  }

  const toggleExercise = async (exercise: Exercise) => {
    let updated: Exercise[]
    const isSelected = selectedExercises.find((e) => e.id === exercise.id)

    if (isSelected) {
      updated = selectedExercises.filter((e) => e.id !== exercise.id)
    } else {
      if (selectedExercises.length >= MAX_PR_EXERCISES) return
      updated = [...selectedExercises, exercise]
    }

    setSelectedExercises(updated)
    await AsyncStorage.setItem("pr_exercises", JSON.stringify(updated))
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-NZ", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    })
  }

  const formatDateLong = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-NZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  // Helper to get workout display name
  const getWorkoutName = (workout: WorkoutSummary) => {
    return workout.workout_name || "Custom Workout"
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.name}>
            {user?.first_name} {user?.last_name}
          </Text>
        </View>
        <Pressable
          style={styles.profileCircle}
          onPress={() => router.push("/profile")}
        >
          <Text style={styles.profileInitials}>
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </Text>
        </Pressable>
      </View>

    {/* START WORKOUT CARD - NEW */}
    <View style={styles.startWorkoutSection}>
        <View style={styles.startWorkoutCard}>
          <View>
            <Text style={styles.startWorkoutTitle}>Ready to train? 💪</Text>
            <Text style={styles.startWorkoutSubtitle}>
              Start a new workout session
            </Text>
          </View>
          <Pressable
            style={styles.startWorkoutButton}
            onPress={() => router.push("/routine")}
          >
            <Text style={styles.startWorkoutButtonText}>Start</Text>
          </Pressable>
        </View>
      </View>

      {/* PR Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent PRs 🏆</Text>
          <Pressable onPress={() => setShowPicker(true)}>
            <Text style={styles.editButton}>Edit</Text>
          </Pressable>
        </View>

        {prsLoading && selectedExercises.length > 0 ? (
          <Text style={styles.loadingText}>Loading PRs...</Text>
        ) : selectedExercises.length === 0 ? (
          <Pressable style={styles.emptyCard} onPress={() => setShowPicker(true)}>
            <Text style={styles.emptyText}>Tap edit to add exercises</Text>
          </Pressable>
        ) : (
          <View style={styles.prGrid}>
            {selectedExercises.map((exercise, index) => {
              const pr = prs[index]
              return (
                <Pressable 
                  key={exercise.id} 
                  style={styles.prCard}
                  onPress={() => router.push(`/progress`)}
                >
                  <Text style={styles.prExerciseName}>{exercise.name}</Text>
                  {pr?.weight ? (
                    <>
                      <Text style={styles.prWeight}>{pr.weight}kg</Text>
                      <Text style={styles.prReps}>{pr.reps} reps</Text>
                      <Text style={styles.prDate}>
                        {pr.created_at ? formatDateLong(pr.created_at) : ""}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.prEmpty}>No PR yet</Text>
                  )}
                </Pressable>
              )
            })}
          </View>
        )}
      </View>

      {/* Recent Workouts Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Sessions 💪</Text>
          <Pressable onPress={() => router.push("/history")}>
            <Text style={styles.editButton}>See all</Text>
          </Pressable>
        </View>

        {workoutsLoading ? (
          <Text style={styles.loadingText}>Loading workouts...</Text>
        ) : recentWorkouts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No workouts yet</Text>
            <Text style={styles.emptySubtext}>
              Start your first workout to see it here!
            </Text>
          </View>
        ) : (
          recentWorkouts.map((workout) => (
            <Pressable
              key={workout.id}
              style={styles.workoutCard}
              onPress={() => router.push(`/workout/${workout.id}`)}
            >
              <View style={styles.workoutHeader}>
                <Text style={styles.workoutName}>
                  {getWorkoutName(workout)}
                </Text>
                <Text style={styles.workoutDate}>
                  {formatDate(workout.date)}
                </Text>
              </View>
              <View style={styles.workoutFooter}>
                <Text style={styles.workoutVolume}>
                  {workout.total_volume.toLocaleString()} kg
                </Text>
                <Text style={styles.workoutExerciseCount}>
                  {workout.exercise_count} exercises
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </View>

      {/* Exercise Picker Modal */}
      <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Select exercises ({selectedExercises.length}/{MAX_PR_EXERCISES})
            </Text>
            <Pressable onPress={() => setShowPicker(false)}>
              <Text style={styles.modalDone}>Done</Text>
            </Pressable>
          </View>

          {exercisesLoading ? (
            <View style={styles.loadingContainer}>
              <Text>Loading exercises...</Text>
            </View>
          ) : (
            <FlatList
              data={allExercises}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                const isSelected = selectedExercises.find((e) => e.id === item.id)
                const isDisabled = !isSelected && selectedExercises.length >= MAX_PR_EXERCISES
                return (
                  <Pressable
                    style={[
                      styles.exerciseItem,
                      isSelected && styles.exerciseItemSelected,
                      isDisabled && styles.exerciseItemDisabled,
                    ]}
                    onPress={() => toggleExercise(item)}
                    disabled={isDisabled}
                  >
                    <View>
                      <Text style={styles.exerciseItemName}>{item.name}</Text>
                      <Text style={styles.exerciseItemMeta}>
                        {item.category} · {item.muscle_group}
                      </Text>
                    </View>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </Pressable>
                )
              }}
            />
          )}
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },

  // header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingTop: 60,
    backgroundColor: "#f9fafb",
  },
  greeting: { fontSize: 16, color: "#6b7280" },
  name: { fontSize: 24, fontWeight: "700", color: "#111827" },
  profileCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitials: { color: "#fff", fontWeight: "700", fontSize: 16 },

    // START WORKOUT CARD - NEW STYLES
    startWorkoutSection: {
        paddingHorizontal: 24,
        marginBottom: 32,
      },
      startWorkoutCard: {
        backgroundColor: "#3b82f6",
        borderRadius: 16,
        padding: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        shadowColor: "#3b82f6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      },
      startWorkoutTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#ffffff",
      },
      startWorkoutSubtitle: {
        fontSize: 14,
        color: "#bfdbfe",
        marginTop: 2,
      },
      startWorkoutButton: {
        backgroundColor: "#ffffff",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      startWorkoutButtonText: {
        color: "#3b82f6",
        fontSize: 16,
        fontWeight: "700",
      },
  // sections
  section: { paddingHorizontal: 24, marginBottom: 32 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  editButton: { fontSize: 14, color: "#3b82f6", fontWeight: "600" },

  // loading
  loadingText: { 
    textAlign: "center", 
    color: "#9ca3af", 
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },

  // PR grid
  prGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  prCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  prExerciseName: { fontSize: 13, color: "#6b7280", marginBottom: 8 },
  prWeight: { fontSize: 24, fontWeight: "700", color: "#111827" },
  prReps: { fontSize: 13, color: "#6b7280" },
  prDate: { fontSize: 11, color: "#9ca3af", marginTop: 4 },
  prEmpty: { fontSize: 13, color: "#9ca3af" },

  // workout cards
  workoutCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  workoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  workoutDate: {
    fontSize: 14,
    color: "#6b7280",
  },
  workoutFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workoutVolume: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3b82f6",
  },
  workoutExerciseCount: {
    fontSize: 14,
    color: "#6b7280",
  },

  // empty state
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
  emptySubtext: { color: "#d1d5db", fontSize: 12, marginTop: 4 },

  // modal
  modal: { flex: 1, backgroundColor: "#f9fafb" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingTop: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  modalDone: { fontSize: 16, color: "#3b82f6", fontWeight: "600" },
  exerciseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  exerciseItemSelected: { backgroundColor: "#eff6ff" },
  exerciseItemDisabled: { opacity: 0.4 },
  exerciseItemName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  exerciseItemMeta: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  checkmark: { fontSize: 18, color: "#3b82f6", fontWeight: "700" },
})