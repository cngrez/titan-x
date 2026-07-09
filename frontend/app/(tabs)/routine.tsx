import { useState } from "react"
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from "react-native"
import { useRouter } from "expo-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/authStore"
import { apiClient } from "@/lib/apiClient"

// Types
interface Exercise {
  id: number
  name: string
  category: string
  muscle_group: string
}

interface RoutineExercise {
  id: number
  order_index: number
  default_sets: number
  default_reps: number
  default_weight: number
  notes: string | null
  exercise_id: number
  routine_id: number
  name: string
  category: string
  muscle_group: string
}

interface Routine {
  id: number
  name: string
  description: string | null
  is_template: boolean
  created_at: string
}

// a new exercise being built before saving
interface DraftExercise {
  exercise_id: number
  name: string
  default_sets: string
  default_reps: string
  default_weight: string
  notes: string
}

export default function RoutineScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((state) => state.accessToken)

  // which routine card is expanded
  const [expandedId, setExpandedId] = useState<number | null>(null)
  // which routine is in edit mode
  const [editingId, setEditingId] = useState<number | null>(null)
  // edit form state
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")

  // create modal
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [draftExercises, setDraftExercises] = useState<DraftExercise[]>([])
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [createdRoutineId, setCreatedRoutineId] = useState<number | null>(null)

  // exercise picker for existing routine edit
  const [showExercisePickerForRoutine, setShowExercisePickerForRoutine] = useState(false)

  // fetch all routines
  const { data: routines = [], isLoading, error } = useQuery<Routine[]>({
    queryKey: ["routines"],
    queryFn: () =>
      apiClient.get<Routine[]>("/api/routines/", {
        token: accessToken ?? undefined,
      }),
    enabled: !!accessToken,
  })

  // fetch exercises for expanded routine
  const { data: routineExercises = [], isLoading: exercisesLoading } = useQuery<RoutineExercise[]>({
    queryKey: ["routine-exercises", expandedId],
    queryFn: () =>
      apiClient.get<RoutineExercise[]>(
        `/api/routines/${expandedId}/exercises`,
        { token: accessToken ?? undefined }
      ),
    enabled: !!expandedId && !!accessToken,
  })

  // fetch all exercises for picker
  const { data: allExercises = [] } = useQuery<Exercise[]>({
    queryKey: ["exercises"],
    queryFn: () =>
      apiClient.get<Exercise[]>("/api/exercises/", {
        token: accessToken ?? undefined,
      }),
    enabled: !!accessToken,
  })

  // create routine
  const { mutate: createRoutine, isPending: creating } = useMutation({
    mutationFn: (body: { name: string; description: string | null }) =>
      apiClient.post<Routine>("/api/routines/", body, {
        token: accessToken ?? undefined,
      }),
    onSuccess: async (routine) => {
      // save exercises to the new routine
      for (const draft of draftExercises) {
        await apiClient.post(
          `/api/routines/${routine.id}/exercises`,
          {
            exercise_id: draft.exercise_id,
            order_index: draftExercises.indexOf(draft) + 1,
            default_sets: parseInt(draft.default_sets) || 3,
            default_reps: parseInt(draft.default_reps) || 10,
            default_weight: parseFloat(draft.default_weight) || 0,
            notes: draft.notes || null,
          },
          { token: accessToken ?? undefined }
        )
      }
      queryClient.invalidateQueries({ queryKey: ["routines"] })
      setShowCreate(false)
      setNewName("")
      setNewDescription("")
      setDraftExercises([])
    },
    onError: (err: Error) => Alert.alert("Error", err.message),
  })

  // update routine name/description
  const { mutate: updateRoutine, isPending: updating } = useMutation({
    mutationFn: ({ id, body }: { id: number; body: { name: string; description: string | null } }) =>
      apiClient.patch<Routine>(`/api/routines/${id}`, body, {
        token: accessToken ?? undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] })
      setEditingId(null)
    },
    onError: (err: Error) => Alert.alert("Error", err.message),
  })

  // delete routine
  const { mutate: deleteRoutine } = useMutation({
    mutationFn: (id: number) =>
      apiClient.delete(`/api/routines/${id}`, {
        token: accessToken ?? undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] })
      setExpandedId(null)
      setEditingId(null)
    },
    onError: (err: Error) => Alert.alert("Error", err.message),
  })

  // update routine exercise (sets/reps/weight)
  const { mutate: updateRoutineExercise } = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<RoutineExercise> }) =>
      apiClient.patch(`/api/routines/exercises/${id}`, body, {
        token: accessToken ?? undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routine-exercises", expandedId] })
    },
  })

  // delete routine exercise
  const { mutate: deleteRoutineExercise } = useMutation({
    mutationFn: (id: number) =>
      apiClient.delete(`/api/routines/exercises/${id}`, {
        token: accessToken ?? undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routine-exercises", expandedId] })
    },
  })

  // add exercise to existing routine
  const addExerciseToRoutine = async (exercise: Exercise) => {
    if (!expandedId) return
    try {
      const body = {
        exercise_id: exercise.id,
        order_index: routineExercises.length + 1,
        default_sets: 3,
        default_reps: 10,
        default_weight: 0.00,
        notes: "",
      }
      
      console.log("Adding exercise to routine:", body)
      
      await apiClient.post(
        `/api/routines/${expandedId}/exercises`,
        body,
        { token: accessToken ?? undefined }
      )
      
      queryClient.invalidateQueries({ queryKey: ["routine-exercises", expandedId] })
      setShowExercisePickerForRoutine(false)
    } catch (err: any) {

      console.log("Error caught:", err.message)
      Alert.alert("Error", err.message)
    }
  }

  const handleStartWithRoutine = async (routineId: number) => {
    try {
      const session = await apiClient.post<{ id: number }>(
        "/api/workout-sessions/",
        { date: new Date().toISOString(), routine_id: routineId, notes: null },
        { token: accessToken ?? undefined }
      )
      await apiClient.post(
        `/api/workout-exercises/${session.id}/copy-from-routine/${routineId}`,
        {},
        { token: accessToken ?? undefined }
      )
      queryClient.invalidateQueries({ queryKey: ["workout-summaries"] })
      router.push(`/workout/${session.id}`)
    } catch (err: any) {
      Alert.alert("Error", err.message)
    }
  }

  const handleStartWithoutRoutine = async () => {
    try {
      const session = await apiClient.post<{ id: number }>(
        "/api/workout-sessions/",
        { date: new Date().toISOString(), routine_id: null, notes: null },
        { token: accessToken ?? undefined }
      )
      queryClient.invalidateQueries({ queryKey: ["workout-summaries"] })
      router.push(`/workout/${session.id}`)
    } catch (err: any) {
      Alert.alert("Error", err.message)
    }
  }

  const startEdit = (routine: Routine) => {
    setEditingId(routine.id)
    setEditName(routine.name)
    setEditDescription(routine.description ?? "")
  }

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      Alert.alert("Error", "Name is required")
      return
    }
    updateRoutine({
      id: editingId!,
      body: { name: editName.trim(), description: editDescription.trim() || null },
    })
  }

  const handleCreate = () => {
    if (!newName.trim()) {
      Alert.alert("Error", "Routine name is required")
      return
    }
    createRoutine({
      name: newName.trim(),
      description: newDescription.trim() || null,
    })
  }

  const addDraftExercise = (exercise: Exercise) => {
    setDraftExercises((prev) => [
      ...prev,
      {
        exercise_id: exercise.id,
        name: exercise.name,
        default_sets: "3",
        default_reps: "10",
        default_weight: "0",
        notes: "",
      },
    ])
    setShowExercisePicker(false)
  }

  const updateDraft = (index: number, field: keyof DraftExercise, value: string) => {
    setDraftExercises((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    )
  }

  const removeDraft = (index: number) => {
    setDraftExercises((prev) => prev.filter((_, i) => i !== index))
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Routines</Text>
          <Pressable style={styles.createBtn} onPress={() => setShowCreate(true)}>
            <Text style={styles.createBtnText}>+ New</Text>
          </Pressable>
        </View>

        {/* Start without routine */}
        <View style={styles.quickStart}>
          <Pressable style={styles.quickStartBtn} onPress={handleStartWithoutRoutine}>
            <Text style={styles.quickStartText}>Start session without routine</Text>
          </Pressable>
        </View>

        {/* Routine list */}
        {routines.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No routines yet</Text>
            <Text style={styles.emptyText}>Create a routine to get started</Text>
            <Pressable style={styles.emptyBtn} onPress={() => setShowCreate(true)}>
              <Text style={styles.emptyBtnText}>Create routine</Text>
            </Pressable>
          </View>
        ) : (
          routines.map((routine) => {
            const isExpanded = expandedId === routine.id
            const isEditing = editingId === routine.id

            return (
              <View key={routine.id} style={styles.routineCard}>

                {/* Routine header */}
                <Pressable
                  style={styles.routineHeader}
                  onPress={() => {
                    setExpandedId(isExpanded ? null : routine.id)
                    setEditingId(null)
                  }}
                >
                  <View style={styles.routineInfo}>
                    <Text style={styles.routineName}>{routine.name}</Text>
                    {routine.description && (
                      <Text style={styles.routineDesc}>{routine.description}</Text>
                    )}
                  </View>
                  <Text style={styles.chevron}>{isExpanded ? "▲" : "▼"}</Text>
                </Pressable>

                {/* Expanded */}
                {isExpanded && (
                  <View style={styles.expandedContent}>

                    {/* Edit name/description inline */}
                    {isEditing ? (
                      <View style={styles.inlineEdit}>
                        <Text style={styles.label}>Name</Text>
                        <TextInput
                          style={styles.input}
                          value={editName}
                          onChangeText={setEditName}
                          placeholder="Routine name"
                        />
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                          style={[styles.input, styles.textArea]}
                          value={editDescription}
                          onChangeText={setEditDescription}
                          placeholder="Optional description"
                          multiline
                        />
                        <View style={styles.inlineEditButtons}>
                          <Pressable
                            style={styles.cancelBtn}
                            onPress={() => setEditingId(null)}
                          >
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                          </Pressable>
                          <Pressable
                            style={styles.saveBtn}
                            onPress={handleSaveEdit}
                            disabled={updating}
                          >
                            <Text style={styles.saveBtnText}>
                              {updating ? "Saving..." : "Save"}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : null}

                    {/* Exercises */}
                    {exercisesLoading ? (
                      <ActivityIndicator size="small" color="#3b82f6" />
                    ) : (
                      <>
                        {routineExercises.length === 0 && (
                          <Text style={styles.noExercises}>No exercises yet</Text>
                        )}
                        {routineExercises
                          .sort((a, b) => a.order_index - b.order_index)
                          .map((ex) => (
                            <ExerciseEditRow
                              key={ex.id}
                              exercise={ex}
                              isEditing={isEditing}
                              onUpdate={(body) => updateRoutineExercise({ id: ex.id, body })}
                              onDelete={() => {
                                Alert.alert(
                                  "Remove exercise",
                                  `Remove ${ex.name} from this routine?`,
                                  [
                                    { text: "Cancel", style: "cancel" },
                                    {
                                      text: "Remove",
                                      style: "destructive",
                                      onPress: () => deleteRoutineExercise(ex.id),
                                    },
                                  ]
                                )
                              }}
                            />
                          ))}

                        {/* Add exercise button (only in edit mode) */}
                        {isEditing && (
                          <Pressable
                            style={styles.addExerciseBtn}
                            onPress={() => setShowExercisePickerForRoutine(true)}
                          >
                            <Text style={styles.addExerciseBtnText}>+ Add exercise</Text>
                          </Pressable>
                        )}
                      </>
                    )}

                    {/* Action buttons */}
                    <View style={styles.actionRow}>
                      <Pressable
                        style={styles.startBtn}
                        onPress={() => handleStartWithRoutine(routine.id)}
                      >
                        <Text style={styles.startBtnText}>Start workout</Text>
                      </Pressable>
                      {!isEditing ? (
                        <Pressable
                          style={styles.editRoutineBtn}
                          onPress={() => startEdit(routine)}
                        >
                          <Text style={styles.editRoutineBtnText}>Edit</Text>
                        </Pressable>
                      ) : (
                        <Pressable
                          style={styles.deleteBtn}
                          onPress={() =>
                            Alert.alert(
                              "Delete routine",
                              `Delete "${routine.name}"?`,
                              [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: "Delete",
                                  style: "destructive",
                                  onPress: () => deleteRoutine(routine.id),
                                },
                              ]
                            )
                          }
                        >
                          <Text style={styles.deleteBtnText}>Delete</Text>
                        </Pressable>
                      )}
                    </View>

                  </View>
                )}
              </View>
            )
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Create Routine Modal ── */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => { setShowCreate(false); setDraftExercises([]) }}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>New routine</Text>
            <Pressable onPress={handleCreate} disabled={creating}>
              <Text style={styles.modalSave}>{creating ? "Saving..." : "Save"}</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Name + description */}
            <View style={styles.field}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={newName}
                onChangeText={setNewName}
                placeholder="e.g. Push Day"
                autoFocus
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newDescription}
                onChangeText={setNewDescription}
                placeholder="e.g. Chest, shoulders, triceps"
                multiline
              />
            </View>

            {/* Draft exercises */}
            <Text style={styles.sectionLabel}>Exercises</Text>
            {draftExercises.length === 0 && (
              <Text style={styles.noExercises}>No exercises added yet</Text>
            )}
            {draftExercises.map((draft, index) => (
              <View key={index} style={styles.draftCard}>
                <View style={styles.draftHeader}>
                  <Text style={styles.draftName}>{draft.name}</Text>
                  <Pressable onPress={() => removeDraft(index)}>
                    <Text style={styles.draftRemove}>✕</Text>
                  </Pressable>
                </View>
                <View style={styles.draftFields}>
                  <View style={styles.draftField}>
                    <Text style={styles.draftFieldLabel}>Sets</Text>
                    <TextInput
                      style={styles.draftInput}
                      value={draft.default_sets}
                      onChangeText={(v) => updateDraft(index, "default_sets", v)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.draftField}>
                    <Text style={styles.draftFieldLabel}>Reps</Text>
                    <TextInput
                      style={styles.draftInput}
                      value={draft.default_reps}
                      onChangeText={(v) => updateDraft(index, "default_reps", v)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.draftField}>
                    <Text style={styles.draftFieldLabel}>Weight (kg)</Text>
                    <TextInput
                      style={styles.draftInput}
                      value={draft.default_weight}
                      onChangeText={(v) => updateDraft(index, "default_weight", v)}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
              </View>
            ))}

            <Pressable
              style={styles.addExerciseBtn}
              onPress={() => setShowExercisePicker(true)}
            >
              <Text style={styles.addExerciseBtnText}>+ Add exercise</Text>
            </Pressable>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* ── Exercise Picker (for create modal) ── */}
      <Modal visible={showExercisePicker} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowExercisePicker(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Pick exercise</Text>
            <View style={{ width: 60 }} />
          </View>
          <FlatList
            data={allExercises}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <Pressable
                style={styles.exercisePickerItem}
                onPress={() => addDraftExercise(item)}
              >
                <Text style={styles.exercisePickerName}>{item.name}</Text>
                <Text style={styles.exercisePickerMeta}>
                  {item.category} · {item.muscle_group}
                </Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>

      {/* ── Exercise Picker (for existing routine) ── */}
      <Modal
        visible={showExercisePickerForRoutine}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowExercisePickerForRoutine(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Pick exercise</Text>
            <View style={{ width: 60 }} />
          </View>
          <FlatList
            data={allExercises}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <Pressable
                style={styles.exercisePickerItem}
                onPress={() => addExerciseToRoutine(item)}
              >
                <Text style={styles.exercisePickerName}>{item.name}</Text>
                <Text style={styles.exercisePickerMeta}>
                  {item.category} · {item.muscle_group}
                </Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>

    </View>
  )
}

// ── Extracted component for editing a single exercise row ──
function ExerciseEditRow({
  exercise,
  isEditing,
  onUpdate,
  onDelete,
}: {
  exercise: RoutineExercise
  isEditing: boolean
  onUpdate: (body: Partial<RoutineExercise>) => void
  onDelete: () => void
}) {
  const [sets, setSets] = useState(exercise.default_sets.toString())
  const [reps, setReps] = useState(exercise.default_reps.toString())
  const [weight, setWeight] = useState(exercise.default_weight.toString())

  const handleBlur = () => {
    onUpdate({
      default_sets: parseInt(sets) || exercise.default_sets,
      default_reps: parseInt(reps) || exercise.default_reps,
      default_weight: parseFloat(weight) || exercise.default_weight,
    })
  }

  return (
    <View style={styles.exerciseRow}>
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={styles.exerciseMeta}>
          {exercise.muscle_group} · {exercise.category}
        </Text>
      </View>

      {isEditing ? (
        // editable inputs
        <View style={styles.exerciseEditFields}>
          <View style={styles.miniField}>
            <Text style={styles.miniLabel}>Sets</Text>
            <TextInput
              style={styles.miniInput}
              value={sets}
              onChangeText={setSets}
              onBlur={handleBlur}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.miniField}>
            <Text style={styles.miniLabel}>Reps</Text>
            <TextInput
              style={styles.miniInput}
              value={reps}
              onChangeText={setReps}
              onBlur={handleBlur}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.miniField}>
            <Text style={styles.miniLabel}>kg</Text>
            <TextInput
              style={styles.miniInput}
              value={weight}
              onChangeText={setWeight}
              onBlur={handleBlur}
              keyboardType="decimal-pad"
            />
          </View>
          <Pressable onPress={onDelete} style={styles.removeBtn}>
            <Text style={styles.removeBtnText}>✕</Text>
          </Pressable>
        </View>
      ) : (
        // read only
        <View style={styles.exerciseDefaults}>
          <Text style={styles.defaultText}>
            {exercise.default_sets} × {exercise.default_reps}
          </Text>
          <Text style={styles.defaultWeight}>{exercise.default_weight}kg</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingTop: 60,
  },
  title: { fontSize: 28, fontWeight: "700", color: "#111827" },
  createBtn: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  quickStart: { paddingHorizontal: 24, marginBottom: 24 },
  quickStartBtn: {
    borderWidth: 1.5,
    borderColor: "#3b82f6",
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  quickStartText: { color: "#3b82f6", fontWeight: "600", fontSize: 15 },

  routineCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  routineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  routineInfo: { flex: 1 },
  routineName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  routineDesc: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  chevron: { fontSize: 12, color: "#9ca3af", marginLeft: 8 },

  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    padding: 16,
  },

  // inline edit
  inlineEdit: { marginBottom: 16 },
  inlineEditButtons: { flexDirection: "row", gap: 8, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelBtnText: { color: "#6b7280", fontWeight: "600" },
  saveBtn: {
    flex: 1,
    backgroundColor: "#3b82f6",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "600" },

  noExercises: { fontSize: 13, color: "#9ca3af", textAlign: "center", padding: 8 },

  // exercise row
  exerciseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb",
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  exerciseMeta: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  exerciseDefaults: { alignItems: "flex-end" },
  defaultText: { fontSize: 14, fontWeight: "600", color: "#3b82f6" },
  defaultWeight: { fontSize: 12, color: "#6b7280", marginTop: 2 },

  // editable exercise fields
  exerciseEditFields: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  miniField: { alignItems: "center" },
  miniLabel: { fontSize: 10, color: "#9ca3af", marginBottom: 2 },
  miniInput: {
    width: 44,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    padding: 6,
    fontSize: 13,
    textAlign: "center",
    color: "#111827",
    backgroundColor: "#f9fafb",
  },
  removeBtn: { padding: 4 },
  removeBtnText: { color: "#ef4444", fontSize: 16 },

  addExerciseBtn: {
    borderWidth: 1,
    borderColor: "#3b82f6",
    borderStyle: "dashed",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 12,
  },
  addExerciseBtnText: { color: "#3b82f6", fontWeight: "600", fontSize: 14 },

  // action row
  actionRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  startBtn: {
    flex: 2,
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  startBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  editRoutineBtn: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  editRoutineBtnText: { color: "#374151", fontWeight: "600", fontSize: 14 },
  deleteBtn: {
    flex: 1,
    backgroundColor: "#fef2f2",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteBtnText: { color: "#ef4444", fontWeight: "600", fontSize: 14 },

  // empty
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 24,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#6b7280", marginBottom: 16, textAlign: "center" },
  emptyBtn: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

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
  modalCancel: { fontSize: 16, color: "#6b7280" },
  modalSave: { fontSize: 16, color: "#3b82f6", fontWeight: "600" },
  modalBody: { padding: 24 },

  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", color: "#6b7280", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#111827",
  },
  textArea: { height: 80, textAlignVertical: "top" },

  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 12,
    marginTop: 4,
  },

  // draft exercise card
  draftCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  draftHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  draftName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  draftRemove: { fontSize: 16, color: "#ef4444" },
  draftFields: { flexDirection: "row", gap: 8 },
  draftField: { flex: 1 },
  draftFieldLabel: { fontSize: 11, color: "#9ca3af", marginBottom: 4 },
  draftInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    textAlign: "center",
    color: "#111827",
    backgroundColor: "#f9fafb",
  },

  // exercise picker
  exercisePickerItem: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  exercisePickerName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  exercisePickerMeta: { fontSize: 13, color: "#6b7280", marginTop: 2 },
})