import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native"
import { Link, useRouter } from "expo-router"
import { useForm, Controller } from "react-hook-form"
import { useMutation } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/authStore"
import { apiClient } from "@/lib/apiClient"

interface RegisterFormValues {
  first_name: string
  last_name: string
  email: string
  password: string
  confirmPassword: string
}

interface RegisterResponse {
  access_token: string
  user: {
    id: number
    email: string
    first_name: string
    last_name: string
    role: string
  }
}

export default function RegisterScreen() {
  const router = useRouter()
  const setAuth = useAuthStore((state) => state.setAuth)

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const { mutate: register, isPending, error } = useMutation({
    mutationFn: (values: RegisterFormValues) =>
      apiClient.post<RegisterResponse>("/api/auth/register", {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        password: values.password,
      }, { requiresAuth: false }),
    onSuccess: (data) => {
      setAuth(data.user, data.access_token)
      router.replace("/(tabs)")
    },
  })

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Start tracking your workouts</Text>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error.message}</Text>
          </View>
        )}

        <Controller
          control={control}
          name="first_name"
          rules={{ required: "First name is required" }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.field}>
              <Text style={styles.label}>First name</Text>
              <TextInput
                style={[styles.input, errors.first_name && styles.inputError]}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                placeholder="John"
                autoComplete="given-name"
                textContentType="givenName"
              />
              {errors.first_name && (
                <Text style={styles.fieldError}>{errors.first_name.message}</Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="last_name"
          rules={{ required: "Last name is required" }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.field}>
              <Text style={styles.label}>Last name</Text>
              <TextInput
                style={[styles.input, errors.last_name && styles.inputError]}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                placeholder="Doe"
                autoComplete="family-name"
                textContentType="familyName"
              />
              {errors.last_name && (
                <Text style={styles.fieldError}>{errors.last_name.message}</Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="email"
          rules={{
            required: "Email is required",
            pattern: { value: /\S+@\S+\.\S+/, message: "Invalid email" },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
              />
              {errors.email && (
                <Text style={styles.fieldError}>{errors.email.message}</Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="password"
          rules={{
            required: "Password is required",
            minLength: { value: 6, message: "Password must be at least 6 characters" },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                placeholder="••••••••"
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
              />
              {errors.password && (
                <Text style={styles.fieldError}>{errors.password.message}</Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          rules={{
            required: "Please confirm your password",
            validate: (value) =>
              value === watch("password") || "Passwords do not match",
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.field}>
              <Text style={styles.label}>Confirm password</Text>
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                placeholder="••••••••"
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
              />
              {errors.confirmPassword && (
                <Text style={styles.fieldError}>{errors.confirmPassword.message}</Text>
              )}
            </View>
          )}
        />

        <Pressable
          onPress={handleSubmit((v) => register(v))}
          style={[styles.button, isPending && styles.buttonLoading]}
          disabled={isPending}
        >
          <Text style={styles.buttonText}>
            {isPending ? "Creating account..." : "Create account"}
          </Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/login">
            <Text style={styles.footerLinkText}>Sign in</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "700", color: "#111827", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#6b7280", marginBottom: 32 },
  errorBanner: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: { color: "#dc2626", fontSize: 14 },
  field: { marginBottom: 16, gap: 6 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#fff",
  },
  inputError: { borderColor: "#ef4444" },
  fieldError: { fontSize: 12, color: "#ef4444" },
  button: {
    backgroundColor: "#3b82f6",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonLoading: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { color: "#6b7280", fontSize: 14 },
  footerLinkText: { color: "#3b82f6", fontSize: 14, fontWeight: "600" },
})