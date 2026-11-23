import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../auth/AuthContext";
import colors from "../theme/colors";

export default function LoginScreen() {
  const { signIn, signInAsDemo, error, ready } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setSigningIn(true);
      await signIn();
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Branding Section */}
        <View style={styles.headerArea}>
          <LinearGradient
            colors={['#252954', '#16213E']}
            style={styles.logoBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="school" size={44} color={colors.primary} />
            <Text style={styles.logoAbbreviation}>IIIT NR</Text>
          </LinearGradient>

          <Text style={styles.appName}>IIIT NR Workspace</Text>
          <Text style={styles.tagline}>
            Campus workspace, batch channels & academic hub
          </Text>

          {/* Three Department Badges */}
          <View style={styles.branchesRow}>
            <View style={[styles.branchPill, { borderColor: colors.branches.CSE, backgroundColor: `${colors.branches.CSE}15` }]}>
              <View style={[styles.branchDot, { backgroundColor: colors.branches.CSE }]} />
              <Text style={[styles.branchText, { color: colors.branches.CSE }]}>CSE</Text>
            </View>
            <View style={[styles.branchPill, { borderColor: colors.branches.DSAI, backgroundColor: `${colors.branches.DSAI}15` }]}>
              <View style={[styles.branchDot, { backgroundColor: colors.branches.DSAI }]} />
              <Text style={[styles.branchText, { color: colors.branches.DSAI }]}>DSAI</Text>
            </View>
            <View style={[styles.branchPill, { borderColor: colors.branches.ECE, backgroundColor: `${colors.branches.ECE}15` }]}>
              <View style={[styles.branchDot, { backgroundColor: colors.branches.ECE }]} />
              <Text style={[styles.branchText, { color: colors.branches.ECE }]}>ECE</Text>
            </View>
          </View>
        </View>

        {/* Card Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Student Sign In</Text>
          <Text style={styles.cardSubtitle}>
            Use your official college Google account to access your branch workspace, real-time channels, and attendance.
          </Text>

          {/* Google Sign In Button */}
          <TouchableOpacity
            style={[styles.googleButton, (!ready || signingIn) && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={!ready || signingIn}
            activeOpacity={0.85}
          >
            {signingIn ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="google"
                  size={20}
                  color={colors.white}
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.domainHint}>
            Only <Text style={{ color: colors.secondary, fontWeight: '700' }}>@iiitnr.edu.in</Text> accounts permitted
          </Text>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR EXPLORE</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Demo Login Button */}
          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => signInAsDemo('CSE')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="account-arrow-right-outline"
              size={18}
              color={colors.textSecondary}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.demoButtonText}>Explore Demo Workspace</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footerContainer}>
          <MaterialCommunityIcons
            name="shield-check-outline"
            size={14}
            color={colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.footerText}>
            Dr. Shyama Prasad Mukherjee IIIT Naya Raipur
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 24,
    justifyContent: "center",
  },
  headerArea: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#3D3D6A",
    marginBottom: 16,
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  logoAbbreviation: {
    fontSize: 11,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: 2,
    marginTop: -2,
  },
  appName: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: 0.4,
    textAlign: "center",
  },
  tagline: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: "center",
  },
  branchesRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  branchPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 5,
  },
  branchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  branchText: {
    fontSize: 11,
    fontWeight: "700",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 18,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4285F4",
    borderRadius: 12,
    height: 50,
    shadowColor: "#4285F4",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  domainHint: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 10,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${colors.danger}18`,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: 10,
    marginTop: 14,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 12,
    lineHeight: 16,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    marginHorizontal: 10,
    letterSpacing: 1,
  },
  demoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
  },
  demoButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  footerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
