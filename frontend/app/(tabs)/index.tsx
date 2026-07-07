import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    ScrollView,
    Pressable,
  } from "react-native"
  import { useRouter } from "expo-router"
  import { useQuery } from "@tanstack/react-query"
  import { useAuthStore } from "@/stores/authStore"
  import { apiClient } from "@/lib/apiClient"
  
  interface RecentPR {
    exercise_id: number
    exercise_name: string
    weight: number
    reps: number
    date: string
  }
  
  interface RecentSession {
    id: number
    date: string
    exercises_count: number
    total_volume: number
  }
  
  export default function HomeScreen() {
    const router = useRouter()
    const { user } = useAuthStore()
  
    const { data: recentPRs, isLoading: prsLoading } = useQuery<RecentPR[]>({
      queryKey: ["recent-prs"],
      queryFn: () =>
        apiClient.get("/api/users/me/recent-prs").then((res) => res.data),
    })
  
    const { data: recentSessions, isLoading: sessionsLoading } = useQuery<RecentSession[]>({
      queryKey: ["recent-sessions"],
      queryFn: () =>
        apiClient.get("/api/workouts/recent?limit=3").then((res) => res.data),
    })
  
    const getGreeting = () => {
      const hour = new Date().getHours()
      if (hour < 12) return "Good morning"
      if (hour < 17) return "Good afternoon"
      return "Good evening"
    }
  
    return (
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>
              {user?.first_name} {user?.last_name}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.profileCircle}
            onPress={() => router.push("/profile")}
          >
            {user?.profile_picture ? (
              <Image 
                source={{ uri: user.profile_picture }} 
                style={styles.profileImage}
              />
            ) : (
              <Text style={styles.profileInitials}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </Text>
            )}
          </TouchableOpacity>
        </View>
  
        {/* Ready to Train */}
        <View style={styles.readySection}>
          <Text style={styles.readyTitle}>Ready to train? 💪</Text>
          <Pressable
            style={styles.startWorkoutButton}
            onPress={() => router.push("/exercise")}
          >
            <Text style={styles.startWorkoutText}>Start Workout</Text>
          </Pressable>
        </View>
  
        {/* Recent PRs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent PRs 🏆</Text>
            <Pressable onPress={() => router.push("/exercise")}>
              <Text style={styles.seeAllText}>See All</Text>
            </Pressable>
          </View>
  
          {prsLoading ? (
            <Text style={styles.loadingText}>Loading PRs...</Text>
          ) : recentPRs && recentPRs.length > 0 ? (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={recentPRs}
              keyExtractor={(item) => item.exercise_id.toString()}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.prCard}
                //   onPress={() => router.push(`/exercises/${item.exercise_id}`)}
                >
                  <Text style={styles.prExerciseName}>{item.exercise_name}</Text>
                  <Text style={styles.prWeight}>{item.weight} kg</Text>
                  <Text style={styles.prReps}>× {item.reps} reps</Text>
                  <Text style={styles.prDate}>
                    {new Date(item.date).toLocaleDateString()}
                  </Text>
                </Pressable>
              )}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No PRs yet. Start training!</Text>
            </View>
          )}
        </View>
  
        {/* Recent Sessions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Sessions 📋</Text>
            <Pressable onPress={() => router.push("/exercise")}>
              <Text style={styles.seeAllText}>See All</Text>
            </Pressable>
          </View>
  
          {sessionsLoading ? (
            <Text style={styles.loadingText}>Loading sessions...</Text>
          ) : recentSessions && recentSessions.length > 0 ? (
            recentSessions.map((session) => (
              <Pressable
                key={session.id}
                style={styles.sessionCard}
                // onPress={() => router.push(`/workout/${session.id}`)}
              >
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionDate}>
                    {new Date(session.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                  <Text style={styles.sessionDetails}>
                    {session.exercises_count} exercises • {session.total_volume} kg volume
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No recent sessions</Text>
            </View>
          )}
        </View>
  
        {/* Bottom spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    )
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#f8f9fa",
    },
    contentContainer: {
      paddingBottom: 20,
    },
  
    // Header
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 20,
      backgroundColor: "#ffffff",
    },
    greeting: {
      fontSize: 14,
      color: "#6b7280",
    },
    userName: {
      fontSize: 24,
      fontWeight: "700",
      color: "#111827",
    },
    profileCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: "#3b82f6",
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    profileImage: {
      width: 48,
      height: 48,
    },
    profileInitials: {
      color: "#ffffff",
      fontSize: 18,
      fontWeight: "600",
    },
  
    // Ready Section
    readySection: {
      backgroundColor: "#ffffff",
      paddingHorizontal: 24,
      paddingVertical: 24,
      marginTop: 12,
      alignItems: "center",
    },
    readyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: "#111827",
      marginBottom: 16,
    },
    startWorkoutButton: {
      backgroundColor: "#3b82f6",
      paddingVertical: 16,
      paddingHorizontal: 48,
      borderRadius: 12,
      width: "100%",
      alignItems: "center",
    },
    startWorkoutText: {
      color: "#ffffff",
      fontSize: 18,
      fontWeight: "600",
    },
  
    // Section
    section: {
      marginTop: 20,
      paddingHorizontal: 24,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: "#111827",
    },
    seeAllText: {
      fontSize: 14,
      color: "#3b82f6",
      fontWeight: "500",
    },
  
    // PR Cards
    prCard: {
      backgroundColor: "#ffffff",
      padding: 16,
      borderRadius: 12,
      marginRight: 12,
      minWidth: 120,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    prExerciseName: {
      fontSize: 14,
      fontWeight: "500",
      color: "#111827",
    },
    prWeight: {
      fontSize: 20,
      fontWeight: "700",
      color: "#3b82f6",
      marginTop: 4,
    },
    prReps: {
      fontSize: 14,
      color: "#6b7280",
    },
    prDate: {
      fontSize: 12,
      color: "#9ca3af",
      marginTop: 4,
    },
  
    // Session Cards
    sessionCard: {
      backgroundColor: "#ffffff",
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 2,
      elevation: 1,
    },
    sessionInfo: {
      flex: 1,
    },
    sessionDate: {
      fontSize: 16,
      fontWeight: "500",
      color: "#111827",
    },
    sessionDetails: {
      fontSize: 14,
      color: "#6b7280",
      marginTop: 2,
    },
    chevron: {
      fontSize: 20,
      color: "#d1d5db",
    },
  
    // Empty & Loading
    loadingText: {
      color: "#9ca3af",
      textAlign: "center",
      paddingVertical: 20,
    },
    emptyState: {
      backgroundColor: "#ffffff",
      padding: 20,
      borderRadius: 12,
      alignItems: "center",
    },
    emptyStateText: {
      color: "#9ca3af",
      fontSize: 14,
    },
  
    bottomSpacer: {
      height: 20,
    },
  })