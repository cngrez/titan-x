import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native"
import { useRouter } from "expo-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/authStore"
import { apiClient } from "@/lib/apiClient"

// Types
interface Profile {
  id: number
  first_name: string
  last_name: string
  email: string
  role: string
  created_at: string
}

interface UpdateProfileRequest {
  first_name: string
  last_name: string
  email: string
}

export default function ProfileScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, accessToken, setAuth, clearAuth } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)

  // Form state - initialized empty, filled by API
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")

  // Fetch profile
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: () =>
      apiClient.get<Profile>("/api/users/me", {
        token: accessToken!,
      }),
    enabled: !!accessToken,
  })

  // Update form state when profile loads
  useEffect(() => {
    if (!profile) return

    setFirstName(profile.first_name)
    setLastName(profile.last_name)
    setEmail(profile.email)
  }, [profile])

  // Update profile mutation
  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: (values: UpdateProfileRequest) =>
      apiClient.patch<Profile>("/api/users/me", values, {
        token: accessToken!,
      }),
    onSuccess: (updatedProfile) => {
      // Update auth store
      setAuth(updatedProfile, accessToken!)

      // Update React Query cache
      queryClient.setQueryData(["profile"], updatedProfile)

      setIsEditing(false)

      Alert.alert("Success", "Profile updated successfully!")
    },
    onError: (err: Error) => {
      Alert.alert("Error", err.message || "Failed to update profile")
    },
  })

  // Logout
  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.post(
                "/api/auth/logout",
                {},
                {
                  token: accessToken!,
                }
              )
            } catch {
              // Ignore errors - logout locally anyway
            }

            clearAuth()
            router.replace("/login")
          },
        },
      ]
    )
  }

  const handleSave = () => {
    // Validation
    if (!firstName.trim()) {
      Alert.alert("Error", "First name is required")
      return
    }

    if (!lastName.trim()) {
      Alert.alert("Error", "Last name is required")
      return
    }

    if (!email.trim()) {
      Alert.alert("Error", "Email is required")
      return
    }

    updateProfile({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
    })
  }

  const handleCancel = () => {
    if (!profile) return

    setFirstName(profile.first_name)
    setLastName(profile.last_name)
    setEmail(profile.email)
    setIsEditing(false)
  }

  const getInitials = () => {
    return `${profile?.first_name?.[0] || ""}${profile?.last_name?.[0] || ""}`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-NZ", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load profile</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => queryClient.invalidateQueries({ queryKey: ["profile"] })}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
        </View>
        <Text style={styles.fullName}>
          {profile?.first_name} {profile?.last_name}
        </Text>
        <Text style={styles.email}>{profile?.email}</Text>
      </View>

      {/* Personal Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>

        {isEditing ? (
          // Edit Mode
          <>
            <View style={styles.field}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Member Since</Text>
              <Text style={styles.value}>
                {profile?.created_at ? formatDate(profile.created_at) : "N/A"}
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.saveButton, isPending && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={isPending}
              >
                <Text style={styles.saveButtonText}>
                  {isPending ? "Saving..." : "Save"}
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          // View Mode
          <>
            <View style={styles.field}>
              <Text style={styles.label}>First Name</Text>
              <Text style={styles.value}>{profile?.first_name}</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Last Name</Text>
              <Text style={styles.value}>{profile?.last_name}</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{profile?.email}</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Member Since</Text>
              <Text style={styles.value}>
                {profile?.created_at ? formatDate(profile.created_at) : "N/A"}
              </Text>
            </View>

            <Pressable style={styles.editButton} onPress={() => setIsEditing(true)}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Logout */}
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </Pressable>

      {/* Bottom spacer */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Header Card
  headerCard: {
    backgroundColor: "#fff",
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 1,
  },
  fullName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#6b7280",
  },

  // Section
  section: {
    backgroundColor: "#fff",
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 20,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Fields
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  value: {
    fontSize: 16,
    color: "#111827",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#fff",
  },

  // Buttons
  editButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#3b82f6",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
  },
  cancelButtonText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  // Logout
  logoutButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 20,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  bottomSpacer: {
    height: 40,
  },
})