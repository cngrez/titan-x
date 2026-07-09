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

// ── Types ──
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

interface DraftExercise {
  exercise_id: number
  name: string
  sets: string
  reps: string
  weight: string
}

interface ExerciseEdit {
  sets: string
  reps: string
  weight: string
}

// ── Main Screen ──
export default function RoutineScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((state) => state.accessToken)

  // expand/edit state
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [exerciseEdits, setExerciseEdits] = useState<Record<number, ExerciseEdit>>({})

  // create modal state
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [draftExercises, setDraftExercises] = useState<DraftExercise[]>([])

  // picker modals
  const [showPickerForCreate, setShowPickerForCreate] = useState(false)
  const [showPickerForEdit, setShowPickerForEdit] = useState(false)

  // ── Queries ──
  const { data: routines = [], isLoading } = useQuery<Routine[]>({
    queryKey: ["routines"],
    queryFn: () =>
      apiClient.get<Routine[]>("/api/routines/", {
        token: accessToken ?? undefined,
      }),
    enabled: !!accessToken,
  })

  const { data: routineExercises = [], isLoading: exercisesLoading } = useQuery<RoutineExercise[]>({
    queryKey: ["routine-exercises", expandedId],
    queryFn: () =>
      apiClient.get<RoutineExercise[]>(
        `/api/routines/${expandedId}/exercises`,
        { token: accessToken ?? undefined }
      ),
    enabled: !!expandedId && !!accessToken,
  })

  const { data: allExercises = [] } = useQuery<Exercise[]>({
    queryKey: ["exercises"],
    queryFn: () =>
      apiClient.get<Exercise[]>("/api/exercises/", {
        token: accessToken ?? undefined,
      }),
    enabled: !!accessToken,
  })

  // ── Mutations ──
  const { mutate: createRoutine, isPending: creating } = useMutation({
    mutationFn: (body: { name: string; description: string | null }) =>
      apiClient.post<Routine>("/api/routines/", body, {
        token: accessToken ?? undefined,
      }),
    onSuccess: async (routine) => {
      for (let i = 0; i < draftExercises.length; i++) {
        const draft = draftExercises[i]
        await apiClient.post(
          `/api/routines/${routine.id}/exercises`,
          {
            exercise_id: draft.exercise_id,
            order_index: i + 1,
            default_sets: parseInt(draft.sets) || 3,
            default_reps: parseInt(draft.reps) || 10,
            default_weight: parseFloat(draft.weight) || 0,
            notes: null,
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

  const { mutate: deleteRoutineExercise } = useMutation({
    mutationFn: (id: number) =>
      apiClient.delete(`/api/routines/exercises/${id}`, {
        token: accessToken ?? undefined,
      }),
    onSuccess: () => {
      // immediately refetch so the exercise disappears
      queryClient.invalidateQueries({ queryKey: ["routine-exercises", expandedId] })
    },
    onError: (err: Error) => Alert.alert("Error", err.message),
  })

  // ── Handlers ──
  const startEdit = (routine: Routine) => {
    setEditingId(routine.id)
    setEditName(routine.name)
    setEditDescription(routine.description ?? "")
    // pre-fill exercise edits from current data
    const edits: Record<number, ExerciseEdit> = {}
    routineExercises.forEach((ex) => {
      edits[ex.id] = {
        sets: ex.default_sets.toString(),
        reps: ex.default_reps.toString(),
        weight: ex.default_weight.toString(),
      }
    })
    setExerciseEdits(edits)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setExerciseEdits({})
  }

  const handleSaveAll = async () => {
    if (!editName.trim()) {
      Alert.alert("Error", "Name is required")
      return
    }

    try {
      // 1. save routine name/description
      await apiClient.patch(
        `/api/routines/${editingId}`,
        {
          name: editName.trim(),
          description: editDescription.trim() || null,
        },
        { token: accessToken ?? undefined }
      )

      // 2. save all exercise edits
      for (const [idStr, vals] of Object.entries(exerciseEdits)) {
        await apiClient.patch(
          `/api/routines/exercises/${idStr}`,
          {
            default_sets: parseInt(vals.sets) || 3,
            default_reps: parseInt(vals.reps) || 10,
            default_weight: parseFloat(vals.weight) || 0,
          },
          { token: accessToken ?? undefined }
        )
      }

      // 3. refetch everything
      await queryClient.invalidateQueries({ queryKey: ["routines"] })
      await queryClient.invalidateQueries({ queryKey: ["routine-exercises", expandedId] })

      setEditingId(null)
      setExerciseEdits({})
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save")
    }
  }

  const handleAddExerciseToRoutine = async (exercise: Exercise) => {
    if (!expandedId) return
    try {
      await apiClient.post(
        `/api/routines/${expandedId}/exercises`,
        {
          exercise_id: exercise.id,
          order_index: routineExercises.length + 1,
          default_sets: 3,
          default_reps: 10,
          default_weight: 0,
          notes: null,
        },
        { token: accessToken ?? undefined }
      )
      await queryClient.invalidateQueries({ queryKey: ["routine-exercises", expandedId] })
      setShowPickerForEdit(false)

      // add to exerciseEdits so it's editable immediately
      setExerciseEdits((prev) => ({
        ...prev,
        // we don't know the new id yet so refetch handles it
      }))
    } catch (err: any) {
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

  const updateExerciseEdit = (id: number, field: keyof ExerciseEdit, value: string) => {
    setExerciseEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }))
  }

  const addDraftExercise = (exercise: Exercise) => {
    setDraftExercises((prev) => [
      ...prev,
      {
        exercise_id: exercise.id,
        name: exercise.name,
        sets: "3",
        reps: "10",
        weight: "0",
      },
    ])
    setShowPickerForCreate(false)
  }

  const updateDraft = (index: number, field: keyof DraftExercise, value: string) => {
    setDraftExercises((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    )
  }

  const removeDraft = (index: number) => {
    setDraftExercises((prev) => prev.filter((_, i) => i !== index))
  }

  // ── Render ──
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

                {/* Tap to expand/collapse */}
                <Pressable
                  style={styles.routineHeader}
                  onPress={() => {
                    if (isExpanded) {
                      setExpandedId(null)
                      setEditingId(null)
                      setExerciseEdits({})
                    } else {
                      setExpandedId(routine.id)
                      setEditingId(null)
                      setExerciseEdits({})
                    }
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

                {/* Expanded content */}
                {isExpanded && (
                  <View style={styles.expandedContent}>

                    {/* Edit name + description */}
                    {isEditing && (
                      <View style={styles.inlineEdit}>
                        <Text style={styles.label}>Routine name</Text>
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
                          placeholder="Optional"
                          multiline
                        />
                      </View>
                    )}

                    {/* Exercise list */}
                    {exercisesLoading ? (
                      <ActivityIndicator size="small" color="#3b82f6" />
                    ) : (
                      <>
                        {routineExercises.length === 0 && (
                          <Text style={styles.noExercises}>No exercises yet</Text>
                        )}

                        {routineExercises
                          .sort((a, b) => a.order_index - b.order_index)
                          .map((ex) => {
                            const edit = exerciseEdits[ex.id]
                            return (
                              <View key={ex.id} style={styles.exerciseRow}>
                                <View style={styles.exerciseInfo}>
                                  <Text style={styles.exerciseName}>{ex.name}</Text>
                                  <Text style={styles.exerciseMeta}>
                                    {ex.muscle_group} · {ex.category}
                                  </Text>
                                </View>

                                {isEditing ? (
                                  <View style={styles.exerciseEditFields}>
                                    <View style={styles.miniField}>
                                      <Text style={styles.miniLabel}>Sets</Text>
                                      <TextInput
                                        style={styles.miniInput}
                                        value={edit?.sets ?? ex.default_sets.toString()}
                                        onChangeText={(v) => updateExerciseEdit(ex.id, "sets", v)}
                                        keyboardType="numeric"
                                      />
                                    </View>
                                    <View style={styles.miniField}>
                                      <Text style={styles.miniLabel}>Reps</Text>
                                      <TextInput
                                        style={styles.miniInput}
                                        value={edit?.reps ?? ex.default_reps.toString()}
                                        onChangeText={(v) => updateExerciseEdit(ex.id, "reps", v)}
                                        keyboardType="numeric"
                                      />
                                    </View>
                                    <View style={styles.miniField}>
                                      <Text style={styles.miniLabel}>kg</Text>
                                      <TextInput
                                        style={styles.miniInput}
                                        value={edit?.weight ?? ex.default_weight.toString()}
                                        onChangeText={(v) => updateExerciseEdit(ex.id, "weight", v)}
                                        keyboardType="decimal-pad"
                                      />
                                    </View>
                                    <Pressable
                                      onPress={() =>
                                        Alert.alert(
                                          "Remove exercise",
                                          `Remove ${ex.name}?`,
                                          [
                                            { text: "Cancel", style: "cancel" },
                                            {
                                              text: "Remove",
                                              style: "destructive",
                                              onPress: () => deleteRoutineExercise(ex.id),
                                            },
                                          ]
                                        )
                                      }
                                      style={styles.removeBtn}
                                    >
                                      <Text style={styles.removeBtnText}>✕</Text>
                                    </Pressable>
                                  </View>
                                ) : (
                                  <View style={styles.exerciseDefaults}>
                                    <Text style={styles.defaultText}>
                                      {ex.default_sets} × {ex.default_reps}
                                    </Text>
                                    <Text style={styles.defaultWeight}>
                                      {ex.default_weight}kg
                                    </Text>
                                  </View>
                                )}
                              </View>
                            )
                          })}

                        {/* Add exercise button in edit mode */}
                        {isEditing && (
                          <Pressable
                            style={styles.addExerciseBtn}
                            onPress={() => setShowPickerForEdit(true)}
                          >
                            <Text style={styles.addExerciseBtnText}>+ Add exercise</Text>
                          </Pressable>
                        )}
                      </>
                    )}

                    {/* Action buttons */}
                    <View style={styles.actionRow}>
                      {!isEditing ? (
                        <>
                          <Pressable
                            style={styles.startBtn}
                            onPress={() => handleStartWithRoutine(routine.id)}
                          >
                            <Text style={styles.startBtnText}>Start workout</Text>
                          </Pressable>
                          <Pressable
                            style={styles.editRoutineBtn}
                            onPress={() => startEdit(routine)}
                          >
                            <Text style={styles.editRoutineBtnText}>Edit</Text>
                          </Pressable>
                        </>
                      ) : (
                        <>
                          <Pressable
                            style={styles.saveBtn}
                            onPress={handleSaveAll}
                          >
                            <Text style={styles.saveBtnText}>Save</Text>
                          </Pressable>
                          <Pressable
                            style={styles.cancelBtn}
                            onPress={cancelEdit}
                          >
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                          </Pressable>
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
                        </>
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
            <Pressable onPress={() => createRoutine({ name: newName.trim(), description: newDescription.trim() || null })} disabled={creating}>
              <Text style={styles.modalSave}>{creating ? "Saving..." : "Save"}</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody}>
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
                      value={draft.sets}
                      onChangeText={(v) => updateDraft(index, "sets", v)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.draftField}>
                    <Text style={styles.draftFieldLabel}>Reps</Text>
                    <TextInput
                      style={styles.draftInput}
                      value={draft.reps}
                      onChangeText={(v) => updateDraft(index, "reps", v)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.draftField}>
                    <Text style={styles.draftFieldLabel}>Weight (kg)</Text>
                    <TextInput
                      style={styles.draftInput}
                      value={draft.weight}
                      onChangeText={(v) => updateDraft(index, "weight", v)}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
              </View>
            ))}

            <Pressable style={styles.addExerciseBtn} onPress={() => setShowPickerForCreate(true)}>
              <Text style={styles.addExerciseBtnText}>+ Add exercise</Text>
            </Pressable>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* ── Exercise Picker for Create ── */}
      <Modal visible={showPickerForCreate} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowPickerForCreate(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Pick exercise</Text>
            <View style={{ width: 60 }} />
          </View>
          <FlatList
            data={allExercises}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <Pressable style={styles.exercisePickerItem} onPress={() => addDraftExercise(item)}>
                <Text style={styles.exercisePickerName}>{item.name}</Text>
                <Text style={styles.exercisePickerMeta}>{item.category} · {item.muscle_group}</Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>

      {/* ── Exercise Picker for Edit ── */}
      <Modal visible={showPickerForEdit} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowPickerForEdit(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Pick exercise</Text>
            <View style={{ width: 60 }} />
          </View>
          <FlatList
            data={allExercises}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <Pressable style={styles.exercisePickerItem} onPress={() => handleAddExerciseToRoutine(item)}>
                <Text style={styles.exercisePickerName}>{item.name}</Text>
                <Text style={styles.exercisePickerMeta}>{item.category} · {item.muscle_group}</Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>

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

  inlineEdit: { marginBottom: 16 },

  noExercises: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
    paddingVertical: 12,
  },

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
  removeBtn: { padding: 4, marginLeft: 4 },
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
  saveBtn: {
    flex: 2,
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelBtnText: { color: "#6b7280", fontWeight: "600", fontSize: 14 },
  deleteBtn: {
    flex: 1,
    backgroundColor: "#fef2f2",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteBtnText: { color: "#ef4444", fontWeight: "600", fontSize: 14 },

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
  },

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

  exercisePickerItem: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  exercisePickerName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  exercisePickerMeta: { fontSize: 13, color: "#6b7280", marginTop: 2 },
})