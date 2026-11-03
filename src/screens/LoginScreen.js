import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "../auth/AuthContext";

export default function LoginScreen() {
  const { signIn, error, ready } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>IIIT Naya Raipur</Text>
      <Text style={styles.sub}>Sign in with your college Google account</Text>

      <TouchableOpacity style={styles.btn} onPress={signIn} disabled={!ready}>
        <Text style={styles.btnText}>Sign in with Google</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 8 },
  sub: { fontSize: 14, color: "#aaa", marginBottom: 32, textAlign: "center" },
  btn: { backgroundColor: "#4285F4", paddingVertical: 14, paddingHorizontal: 28, borderRadius: 8 },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  error: { color: "#d33", marginTop: 16, textAlign: "center" },
});