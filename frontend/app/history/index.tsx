import { useState } from "react";
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    FlatList,
    RefreshControl,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/apiClient";

// Types
interface WorkoutSummary {
    id: number            
    date: string
    notes: string | null
    workout_name: string | null
    total_volume: number
    exercise_count: number
  }

export default function HistoryScreen() {
    const router = useRouter();
    const accessToken = useAuthStore((state) => state.accessToken);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch all workout summaries
    const {
        data: workoutSummaries = [],
        isLoading,
        refetch,
    } = useQuery<WorkoutSummary[]>({
        queryKey: ["workoutSummaries"],
        queryFn: () =>
            apiClient.get<WorkoutSummary[]>("/api/set-logs/summary", {
                token: accessToken ?? undefined,
            }),
        enabled: !!accessToken,
    });

    // Helper: Get workout display name
    const getWorkoutName = (workout: WorkoutSummary) => {
        return workout.workout_name || "Custom Workout";
    };

    // Helper: Format date
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-NZ", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    // Helper: Format volume
    const formatVolume = (volume: number) => {
        return volume.toLocaleString();
    };

    // Loading state
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    // Empty state
    if (workoutSummaries.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No workouts yet 💪</Text>
                <Text style={styles.emptyText}>
                    Start your first workout to see it here.
                </Text>
                <Pressable
                    style={styles.startButton}
                    onPress={() => router.push("/workout/new")}
                >
                    <Text style={styles.startButtonText}>Start Workout</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Workout History</Text>
            <Pressable onPress={() => router.push("/(tabs)")}>
            <View>
                <Text>
                    Back
                </Text>
                </View>
            </Pressable>

            <FlatList
                data={workoutSummaries}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={async () => {
                            setRefreshing(true);
                            await refetch();
                            setRefreshing(false);
                        }}
                    />
                }
                renderItem={({ item }) => (
                    <Pressable
                        style={styles.workoutCard}
                        onPress={() => router.push(`/workout/${item.id}`)}
                    >
                        <View style={styles.workoutHeader}>
                            <Text style={styles.workoutName}>
                                {getWorkoutName(item)}
                            </Text>
                            <Text style={styles.workoutDate}>
                                {formatDate(item.date)}
                            </Text>
                        </View>

                        <View style={styles.workoutFooter}>
                            <View style={styles.stat}>
                                <Text style={styles.statValue}>
                                    {formatVolume(item.total_volume)} kg
                                </Text>
                                <Text style={styles.statLabel}>Total Volume</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.stat}>
                                <Text style={styles.statValue}>
                                    {item.exercise_count}
                                </Text>
                                <Text style={styles.statLabel}>Exercises</Text>
                            </View>
                        </View>
                    </Pressable>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1, // ✅ THIS IS IMPORTANT - gives FlatList a fixed height
        backgroundColor: "#f9fafb",
        paddingHorizontal: 16,
        paddingTop: 16,
    },

    // Title
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 16,
        paddingHorizontal: 8,
    },

    // List
    listContent: {
        paddingBottom: 24,
        flexGrow: 1, // ✅ Helps with empty state scrolling
    },

    // Loading
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f9fafb",
    },

    // Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f9fafb",
        padding: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: "#6b7280",
        marginBottom: 24,
        textAlign: "center",
    },
    startButton: {
        backgroundColor: "#3b82f6",
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
    },
    startButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },

    // Workout Card
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
        marginBottom: 12,
    },
    workoutName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        flex: 1,
        marginRight: 8,
    },
    workoutDate: {
        fontSize: 14,
        color: "#6b7280",
    },

    // Footer Stats
    workoutFooter: {
        flexDirection: "row",
        alignItems: "center",
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#f3f4f6",
    },
    stat: {
        flex: 1,
        alignItems: "center",
    },
    statValue: {
        fontSize: 18,
        fontWeight: "700",
        color: "#3b82f6",
    },
    statLabel: {
        fontSize: 12,
        color: "#6b7280",
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: "#e5e7eb",
    },
});