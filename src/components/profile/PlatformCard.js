import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
  UIManager,
  LayoutAnimation,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import StatBar from './StatBar';
import { getProfileUrl } from '../../lib/platforms';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental &&
  !UIManager.__layoutAnimationEnabled
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
  UIManager.__layoutAnimationEnabled = true;
}

// Codeforces rank color helper
const getCodeforcesRankColor = (rankName = '', rating = 0) => {
  const r = rankName.toLowerCase();
  if (r.includes('legendary') || r.includes('international grandmaster') || r.includes('grandmaster')) {
    return '#FF7675';
  }
  if (r.includes('master')) return '#FFA116';
  if (r.includes('candidate')) return '#A29BFE';
  if (r.includes('expert')) return '#0984E3';
  if (r.includes('specialist')) return '#00CEC9';
  if (r.includes('pupil')) return '#00B894';
  if (r.includes('newbie')) return '#A0A0B0';

  if (rating >= 2400) return '#FF7675';
  if (rating >= 2200) return '#FFA116';
  if (rating >= 1900) return '#A29BFE';
  if (rating >= 1600) return '#0984E3';
  if (rating >= 1400) return '#00CEC9';
  if (rating >= 1200) return '#00B894';
  return '#A0A0B0';
};

// Format date helper
const formatDate = (val) => {
  if (!val) return 'N/A';
  try {
    let date;
    if (typeof val === 'number') {
      date = new Date(val > 10000000000 ? val : val * 1000);
    } else {
      date = new Date(val);
    }
    if (isNaN(date.getTime())) return String(val);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
      day: 'numeric',
    });
  } catch (e) {
    return String(val);
  }
};

const PlatformCard = ({
  platform = {},
  username = '',
  stats = null,
  loading = false,
  isVerified = false,
  verifiedEmail = null,
  verifiedAt = null,
  onVerify,
  onRefresh,
  onRemove,
  expanded,
  onToggleExpand,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = expanded !== undefined ? expanded : internalExpanded;

  const brandColor = platform.color || colors.primary;
  const platformId = platform.id || 'default';

  const handleToggle = () => {
    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch (e) {
      // Ignore layout animation error
    }
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  const handleOpenProfile = async () => {
    const url = getProfileUrl ? getProfileUrl(platformId, username) : `https://${platformId}.com/${username}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Cannot Open URL', `Unable to open: ${url}`);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to open browser: ' + err.message);
    }
  };

  const handleRemovePress = () => {
    Alert.alert(
      'Remove Platform',
      `Are you sure you want to unlink your ${platform.name || 'platform'} account (@${username})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemove && onRemove(platformId),
        },
      ]
    );
  };

  // Compute key metric for collapsed header
  const getKeyMetric = () => {
    if (loading) return null;
    if (stats?.error) return null;
    if (!stats) return '—';

    switch (platformId) {
      case 'leetcode':
        if (stats.rating) return Math.round(stats.rating);
        if (stats.totalSolved !== undefined) return `${stats.totalSolved} solved`;
        return '—';
      case 'codeforces':
        if (stats.rating) return `${stats.rating}`;
        return '—';
      case 'codechef':
        if (stats.rating || stats.currentRating) return `${stats.rating || stats.currentRating}`;
        return '—';
      case 'chess':
        if (stats.rapid?.rating) return `${stats.rapid.rating}`;
        if (stats.rating) return `${stats.rating}`;
        return '—';
      case 'github':
        if (stats.publicRepos !== undefined) return `${stats.publicRepos} repos`;
        if (stats.repos !== undefined) return `${stats.repos} repos`;
        return '—';
      default:
        return stats.rating || stats.score || '—';
    }
  };

  const keyMetric = getKeyMetric();

  // Render platform-specific expanded body
  const renderPlatformContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={brandColor} />
          <Text style={styles.loadingText}>Fetching latest stats...</Text>
        </View>
      );
    }

    if (stats?.error) {
      return (
        <View style={styles.errorContainer}>
          <View style={styles.errorHeader}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.danger} />
            <Text style={styles.errorText}>
              {typeof stats.error === 'string' ? stats.error : 'Failed to load stats.'}
            </Text>
          </View>
          {onRefresh && (
            <TouchableOpacity style={styles.retryButton} activeOpacity={0.7} onPress={onRefresh}>
              <MaterialCommunityIcons name="reload" size={16} color={colors.white} />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if (!stats) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No stats available. Tap refresh to fetch.</Text>
        </View>
      );
    }

    switch (platformId) {
      case 'leetcode':
        return renderLeetCode();
      case 'codeforces':
        return renderCodeforces();
      case 'codechef':
        return renderCodeChef();
      case 'chess':
        return renderChess();
      case 'github':
        return renderGitHub();
      default:
        return renderGeneric();
    }
  };

  // --- LEETCODE ---
  const renderLeetCode = () => {
    const totalSolved =
      stats.totalSolved ??
      ((stats.easySolved || 0) + (stats.mediumSolved || 0) + (stats.hardSolved || 0));
    const streak = stats.streak ?? stats.currentStreak ?? 0;
    const activeDays = stats.totalActiveDays ?? stats.activeDays ?? 0;
    const rating = stats.rating ? Math.round(stats.rating) : 'Unrated';
    const ranking = stats.globalRanking || stats.ranking;
    const badge = stats.badge || stats.contestBadge;
    const contests = stats.contestsAttended ?? stats.contests ?? 0;
    const topPct = stats.topPercentage ? `${stats.topPercentage}%` : null;

    return (
      <View style={styles.detailsContainer}>
        {/* Rating + Ranking + Badge Row */}
        <View style={styles.statTilesRow}>
          <View style={styles.statTile}>
            <Text style={styles.statTileLabel}>Contest Rating</Text>
            <Text style={[styles.statTileValue, { color: brandColor }]}>{rating}</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statTileLabel}>Global Rank</Text>
            <Text style={styles.statTileValue}>
              {ranking ? `#${Number(ranking).toLocaleString()}` : 'N/A'}
            </Text>
          </View>
          {badge ? (
            <View style={[styles.statTile, styles.badgeTile]}>
              <Text style={styles.statTileLabel}>Badge</Text>
              <View style={[styles.badgePill, { borderColor: brandColor }]}>
                <MaterialCommunityIcons name="shield-star" size={13} color={brandColor} />
                <Text style={[styles.badgePillText, { color: brandColor }]}>{badge}</Text>
              </View>
            </View>
          ) : topPct ? (
            <View style={styles.statTile}>
              <Text style={styles.statTileLabel}>Top Standing</Text>
              <Text style={[styles.statTileValue, { color: colors.secondary }]}>{topPct}</Text>
            </View>
          ) : null}
        </View>

        {/* Contests row if attended */}
        {contests > 0 && (
          <View style={styles.subInfoRow}>
            <View style={styles.inlineInfo}>
              <MaterialCommunityIcons name="trophy-outline" size={15} color={colors.warning} />
              <Text style={styles.subInfoText}>
                Contests: <Text style={styles.boldText}>{contests}</Text>
              </Text>
            </View>
            {topPct && !badge && (
              <View style={styles.inlineInfo}>
                <MaterialCommunityIcons name="chart-line" size={15} color={colors.secondary} />
                <Text style={styles.subInfoText}>
                  Standing: <Text style={styles.boldText}>Top {topPct}</Text>
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Streak & Active Days */}
        <View style={styles.streakRow}>
          <View style={styles.streakBox}>
            <Text style={styles.fireEmoji}>🔥</Text>
            <View>
              <Text style={styles.streakNumber}>{streak}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
            </View>
          </View>

          <View style={styles.streakBox}>
            <MaterialCommunityIcons name="calendar-check" size={24} color={colors.secondary} />
            <View style={styles.activeDaysCol}>
              <Text style={styles.streakNumber}>{activeDays}</Text>
              <Text style={styles.streakLabel}>Active Days</Text>
            </View>
          </View>
        </View>

        {/* Problems Solved with StatBars */}
        <View style={styles.sectionDivider} />
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionSubTitle}>Problems Solved</Text>
          <Text style={[styles.solvedTotalHighlight, { color: brandColor }]}>
            {totalSolved}
          </Text>
        </View>

        <StatBar
          label="Easy"
          value={stats.easySolved || 0}
          maxValue={stats.totalEasy || 830}
          color={colors.success}
          size="small"
        />
        <StatBar
          label="Medium"
          value={stats.mediumSolved || 0}
          maxValue={stats.totalMedium || 1730}
          color={colors.warning}
          size="small"
        />
        <StatBar
          label="Hard"
          value={stats.hardSolved || 0}
          maxValue={stats.totalHard || 740}
          color={colors.danger}
          size="small"
        />
      </View>
    );
  };

  // --- CODEFORCES ---
  const renderCodeforces = () => {
    const rating = stats.rating || 'Unrated';
    const maxRating = stats.maxRating || stats.max_rating || 'N/A';
    const rankName = stats.rank || 'Unrated';
    const rankColor = getCodeforcesRankColor(rankName, stats.rating);
    const contribution = stats.contribution ?? 0;
    const formattedDate = formatDate(stats.registrationTime || stats.registered || stats.createdAt);

    return (
      <View style={styles.detailsContainer}>
        {/* Rating + Max Rating */}
        <View style={styles.statTilesRow}>
          <View style={styles.statTile}>
            <Text style={styles.statTileLabel}>Current Rating</Text>
            <Text style={[styles.statTileValue, { color: rankColor }]}>{rating}</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statTileLabel}>Max Rating</Text>
            <Text style={styles.statTileValue}>{maxRating}</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statTileLabel}>Contribution</Text>
            <Text
              style={[
                styles.statTileValue,
                { color: contribution >= 0 ? colors.success : colors.danger },
              ]}
            >
              {contribution >= 0 ? `+${contribution}` : contribution}
            </Text>
          </View>
        </View>

        {/* Rank Badge */}
        <View style={styles.rankBadgeRow}>
          <Text style={styles.subInfoLabel}>Rank Tier:</Text>
          <View style={[styles.rankPill, { backgroundColor: `${rankColor}25`, borderColor: rankColor }]}>
            <MaterialCommunityIcons name="star-circle" size={14} color={rankColor} />
            <Text style={[styles.rankPillText, { color: rankColor }]}>
              {rankName.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Registration Date */}
        <View style={styles.infoMetaRow}>
          <MaterialCommunityIcons name="clock-outline" size={15} color={colors.textMuted} />
          <Text style={styles.metaText}>Registered: {formattedDate}</Text>
        </View>
      </View>
    );
  };

  // --- CODECHEF ---
  const renderCodeChef = () => {
    const currentRating = stats.rating || stats.currentRating || 'Unrated';
    const highestRating = stats.maxRating || stats.highestRating || 'N/A';
    const globalRank = stats.globalRank || stats.global_rank;
    const countryRank = stats.countryRank || stats.country_rank;
    const totalSolved = stats.totalSolved || stats.problemsSolved || stats.fullySolved || 0;

    // Determine star count
    let starCount = 1;
    if (typeof stats.stars === 'number') {
      starCount = stats.stars;
    } else if (typeof stats.stars === 'string') {
      const match = stats.stars.match(/\d+/);
      if (match) starCount = parseInt(match[0], 10);
    } else if (typeof currentRating === 'number') {
      if (currentRating >= 2500) starCount = 7;
      else if (currentRating >= 2200) starCount = 6;
      else if (currentRating >= 2000) starCount = 5;
      else if (currentRating >= 1800) starCount = 4;
      else if (currentRating >= 1600) starCount = 3;
      else if (currentRating >= 1400) starCount = 2;
      else starCount = 1;
    }

    return (
      <View style={styles.detailsContainer}>
        {/* Rating + Highest Rating */}
        <View style={styles.statTilesRow}>
          <View style={styles.statTile}>
            <Text style={styles.statTileLabel}>Rating</Text>
            <Text style={[styles.statTileValue, { color: brandColor }]}>{currentRating}</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statTileLabel}>Highest Rating</Text>
            <Text style={styles.statTileValue}>{highestRating}</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statTileLabel}>Problems Solved</Text>
            <Text style={[styles.statTileValue, { color: colors.secondary }]}>
              {totalSolved}
            </Text>
          </View>
        </View>

        {/* Stars Display */}
        <View style={styles.starsRow}>
          <Text style={styles.subInfoLabel}>Star Rating:</Text>
          <View style={styles.starsContainer}>
            {Array.from({ length: Math.min(7, Math.max(1, starCount)) }).map((_, idx) => (
              <Text key={idx} style={styles.starIcon}>
                ★
              </Text>
            ))}
            <Text style={styles.starTextNumber}>({starCount}★)</Text>
          </View>
        </View>

        {/* Global + Country Rank */}
        <View style={styles.subInfoRow}>
          <View style={styles.inlineInfo}>
            <MaterialCommunityIcons name="earth" size={15} color={colors.primary} />
            <Text style={styles.subInfoText}>
              Global: <Text style={styles.boldText}>{globalRank ? `#${Number(globalRank).toLocaleString()}` : 'N/A'}</Text>
            </Text>
          </View>
          <View style={styles.inlineInfo}>
            <MaterialCommunityIcons name="flag-outline" size={15} color={colors.accent} />
            <Text style={styles.subInfoText}>
              Country: <Text style={styles.boldText}>{countryRank ? `#${Number(countryRank).toLocaleString()}` : 'N/A'}</Text>
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // --- CHESS.COM ---
  const renderChess = () => {
    const rapid = stats.rapid || {};
    const blitz = stats.blitz || {};
    const bullet = stats.bullet || {};

    const rapidGames = (rapid.win || 0) + (rapid.loss || 0) + (rapid.draw || 0);
    const blitzGames = (blitz.win || 0) + (blitz.loss || 0) + (blitz.draw || 0);
    const bulletGames = (bullet.win || 0) + (bullet.loss || 0) + (bullet.draw || 0);

    const totalGames = stats.totalGames ?? (rapidGames + blitzGames + bulletGames);
    const totalWins = (rapid.win || 0) + (blitz.win || 0) + (bullet.win || 0);
    const winRate =
      stats.winRate ?? (totalGames > 0 ? (totalWins / totalGames) * 100 : 0);

    const renderChessCol = (title, modeStats) => (
      <View style={styles.chessCol}>
        <Text style={styles.chessModeTitle}>{title}</Text>
        <Text style={[styles.chessRating, { color: brandColor }]}>
          {modeStats.rating ?? '—'}
        </Text>
        <Text style={styles.chessBest}>Best: {modeStats.best ?? '—'}</Text>
        <Text style={styles.chessRecord}>
          {modeStats.win ?? 0}W / {modeStats.loss ?? 0}L / {modeStats.draw ?? 0}D
        </Text>
      </View>
    );

    return (
      <View style={styles.detailsContainer}>
        {/* Three Columns: Rapid, Blitz, Bullet */}
        <View style={styles.chessColsRow}>
          {renderChessCol('Rapid', rapid)}
          <View style={styles.chessDivider} />
          {renderChessCol('Blitz', blitz)}
          <View style={styles.chessDivider} />
          {renderChessCol('Bullet', bullet)}
        </View>

        {/* Total Games Row */}
        <View style={styles.sectionDivider} />
        <View style={styles.chessStatsSummary}>
          <View style={styles.inlineInfo}>
            <MaterialCommunityIcons name="chess-king" size={16} color={colors.warning} />
            <Text style={styles.subInfoText}>
              Total Games: <Text style={styles.boldText}>{totalGames.toLocaleString()}</Text>
            </Text>
          </View>
        </View>

        {/* Overall Win Rate StatBar */}
        <StatBar
          label="Win Rate"
          value={winRate}
          maxValue={100}
          showPercentage={true}
          color={colors.secondary}
          size="normal"
        />
      </View>
    );
  };

  // --- GITHUB ---
  const renderGitHub = () => {
    const repos = stats.publicRepos ?? stats.repos ?? 0;
    const followers = stats.followers ?? 0;
    const following = stats.following ?? 0;
    const bio = stats.bio;
    const formattedDate = formatDate(stats.createdAt || stats.memberSince || stats.joined);

    return (
      <View style={styles.detailsContainer}>
        {/* Stat Boxes: Repos, Followers, Following */}
        <View style={styles.statTilesRow}>
          <View style={styles.statTile}>
            <Text style={styles.statTileLabel}>Public Repos</Text>
            <Text style={[styles.statTileValue, { color: brandColor }]}>{repos}</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statTileLabel}>Followers</Text>
            <Text style={styles.statTileValue}>{followers}</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statTileLabel}>Following</Text>
            <Text style={styles.statTileValue}>{following}</Text>
          </View>
        </View>

        {/* Bio if available */}
        {bio ? (
          <View style={styles.githubBioContainer}>
            <MaterialCommunityIcons
              name="format-quote-open"
              size={16}
              color={colors.textMuted}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.githubBioText} numberOfLines={3}>
              {bio}
            </Text>
          </View>
        ) : null}

        {/* Member since date */}
        <View style={styles.infoMetaRow}>
          <MaterialCommunityIcons name="calendar-month-outline" size={15} color={colors.textMuted} />
          <Text style={styles.metaText}>Member since: {formattedDate}</Text>
        </View>
      </View>
    );
  };

  // --- GENERIC FALLBACK ---
  const renderGeneric = () => (
    <View style={styles.detailsContainer}>
      <Text style={styles.genericText}>
        {JSON.stringify(stats, null, 2)}
      </Text>
    </View>
  );

  return (
    <View style={[styles.card, { borderLeftColor: brandColor }]}>
      {/* Collapsed Header (Always Visible) */}
      <TouchableOpacity
        style={styles.header}
        activeOpacity={0.8}
        onPress={handleToggle}
      >
        {/* Platform Icon */}
        <View style={[styles.iconWrapper, { backgroundColor: `${brandColor}20` }]}>
          <MaterialCommunityIcons
            name={platform.icon || 'code-braces'}
            size={24}
            color={brandColor}
          />
        </View>

        {/* Platform & Username Info */}
        <View style={styles.headerInfo}>
          <Text style={styles.platformName} numberOfLines={1}>
            {platform.name || 'Platform'}
          </Text>
          <View style={styles.usernameRow}>
            <Text style={styles.usernameText} numberOfLines={1}>
              @{username}
            </Text>
            {isVerified ? (
              <View style={styles.verifiedMiniTag}>
                <MaterialCommunityIcons name="shield-check" size={12} color={colors.success} />
                <Text style={styles.verifiedMiniText}>Verified</Text>
              </View>
            ) : (
              <View style={styles.unverifiedMiniTag}>
                <MaterialCommunityIcons name="alert-circle-outline" size={11} color={colors.warning} />
                <Text style={styles.unverifiedMiniText}>Unverified</Text>
              </View>
            )}
          </View>
        </View>

        {/* Right Metric */}
        <View style={styles.rightSection}>
          {loading ? (
            <ActivityIndicator size="small" color={brandColor} />
          ) : keyMetric ? (
            <Text style={[styles.keyMetric, { color: brandColor }]}>{keyMetric}</Text>
          ) : null}

          {/* Chevron */}
          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={colors.textMuted}
            style={styles.chevron}
          />
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.expandedWrapper}>
          <View style={styles.divider} />

          {/* Verification Status Banner */}
          {isVerified ? (
            <View style={styles.verifiedBannerCard}>
              <MaterialCommunityIcons name="check-decagram" size={16} color={colors.success} />
              <Text style={styles.verifiedBannerText} numberOfLines={1}>
                Verified account • Linked to {verifiedEmail || 'college account'}
              </Text>
            </View>
          ) : (
            <View style={styles.unverifiedBannerCard}>
              <View style={styles.unverifiedBannerInfo}>
                <MaterialCommunityIcons name="shield-alert-outline" size={18} color={colors.warning} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.unverifiedBannerTitle}>Unverified Handle</Text>
                  <Text style={styles.unverifiedBannerSub}>
                    Prove ownership to get the verified student badge.
                  </Text>
                </View>
              </View>
              {onVerify && (
                <TouchableOpacity
                  style={styles.verifyActionBtn}
                  activeOpacity={0.7}
                  onPress={onVerify}
                >
                  <Text style={styles.verifyActionBtnText}>Verify</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {renderPlatformContent()}

          {/* Action Buttons Row */}
          <View style={styles.actionsRow}>
            {onRefresh && (
              <TouchableOpacity
                style={styles.actionBtn}
                activeOpacity={0.7}
                onPress={onRefresh}
                disabled={loading}
              >
                <MaterialCommunityIcons
                  name="refresh"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.actionBtnText}>Refresh</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.7}
              onPress={handleOpenProfile}
            >
              <MaterialCommunityIcons
                name="open-in-new"
                size={16}
                color={colors.primary}
              />
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                Open Profile
              </Text>
            </TouchableOpacity>

            {onRemove && (
              <TouchableOpacity
                style={styles.actionBtn}
                activeOpacity={0.7}
                onPress={handleRemovePress}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={16}
                  color={colors.danger}
                />
                <Text style={[styles.actionBtnText, { color: colors.danger }]}>
                  Remove
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  platformName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  usernameText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  keyMetric: {
    fontSize: 18,
    fontWeight: '800',
    marginRight: 8,
    letterSpacing: 0.3,
  },
  chevron: {
    marginLeft: 2,
  },
  expandedWrapper: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  detailsContainer: {
    marginBottom: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 13,
    color: colors.textSecondary,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    padding: 12,
    marginVertical: 6,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  statTilesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statTile: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statTileLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  statTileValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  badgeTile: {
    paddingVertical: 8,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 3,
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginVertical: 6,
    paddingVertical: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
  },
  inlineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subInfoText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  subInfoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    marginRight: 8,
  },
  boldText: {
    color: colors.text,
    fontWeight: '700',
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  streakBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fireEmoji: {
    fontSize: 26,
    marginRight: 10,
  },
  activeDaysCol: {
    marginLeft: 10,
  },
  streakNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF9F43',
    lineHeight: 22,
  },
  streakLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionSubTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  solvedTotalHighlight: {
    fontSize: 15,
    fontWeight: '800',
  },
  rankBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 4,
  },
  rankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rankPillText: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 5,
    letterSpacing: 0.5,
  },
  infoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 6,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    fontSize: 16,
    color: '#F1C40F',
    marginRight: 2,
  },
  starTextNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F1C40F',
    marginLeft: 4,
  },
  chessColsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 6,
  },
  chessCol: {
    flex: 1,
    alignItems: 'center',
  },
  chessDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  chessModeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  chessRating: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  chessBest: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 2,
  },
  chessRecord: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chessStatsSummary: {
    marginBottom: 8,
    alignItems: 'center',
  },
  githubBioContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    padding: 10,
    borderRadius: 8,
    marginVertical: 6,
    alignItems: 'flex-start',
  },
  githubBioText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  genericText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    marginTop: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 5,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedMiniTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}18`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  verifiedMiniText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  unverifiedMiniTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}18`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  unverifiedMiniText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.warning,
  },
  verifiedBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}15`,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: `${colors.success}40`,
    gap: 8,
  },
  verifiedBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  unverifiedBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${colors.warning}12`,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: `${colors.warning}35`,
  },
  unverifiedBannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  unverifiedBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warning,
    marginBottom: 1,
  },
  unverifiedBannerSub: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
  },
  verifyActionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  verifyActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
});

export default PlatformCard;
