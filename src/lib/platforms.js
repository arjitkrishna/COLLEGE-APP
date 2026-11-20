/**
 * platforms.js
 * 
 * Platform API library for IIIT NR Workspace.
 * Defines supported external competitive programming, chess, and developer platforms,
 * their metadata, username cleaners, profile URLs, and live stats fetchers.
 */

const FETCH_TIMEOUT_MS = 15000;
const STATS_TIMEOUT_MS = 30000;

async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// -----------------------------------------------------------------------------
// LeetCode GraphQL Query & Fetcher
// -----------------------------------------------------------------------------
const LEETCODE_GRAPHQL_QUERY = `query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile {
      ranking
      reputation
      starRating
    }
    submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
      }
    }
    userCalendar {
      streak
      totalActiveDays
    }
    contestBadge {
      name
    }
  }
  userContestRanking(username: $username) {
    rating
    attendedContestsCount
    globalRanking
    topPercentage
  }
}`;

async function fetchLeetCodeStats(username, timeoutMs = FETCH_TIMEOUT_MS) {
  try {
    const cleanUser = cleanUsername('leetcode', username);
    if (!cleanUser) {
      return { error: 'Username is required' };
    }

    const response = await fetchWithTimeout(
      'https://leetcode.com/graphql',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Referer': 'https://leetcode.com',
        },
        body: JSON.stringify({
          query: LEETCODE_GRAPHQL_QUERY,
          variables: { username: cleanUser },
        }),
      },
      timeoutMs
    );

    if (!response.ok) {
      return { error: `LeetCode request failed with status ${response.status}` };
    }

    const json = await response.json();

    if (!json.data || !json.data.matchedUser) {
      if (json.errors && json.errors.length > 0) {
        return { error: json.errors[0]?.message || 'User not found' };
      }
      return { error: 'User not found' };
    }

    const { matchedUser, userContestRanking } = json.data;
    const submissions = matchedUser.submitStatsGlobal?.acSubmissionNum || [];

    const getSolvedCount = (difficulty) => {
      const match = submissions.find(
        (item) => item.difficulty?.toLowerCase() === difficulty.toLowerCase()
      );
      return match ? match.count : 0;
    };

    return {
      rating: userContestRanking?.rating ? Math.round(userContestRanking.rating) : null,
      ranking: matchedUser.profile?.ranking ?? null,
      globalRanking: userContestRanking?.globalRanking ?? null,
      topPercentage: userContestRanking?.topPercentage != null ? userContestRanking.topPercentage : null,
      totalSolved: getSolvedCount('All'),
      easySolved: getSolvedCount('Easy'),
      mediumSolved: getSolvedCount('Medium'),
      hardSolved: getSolvedCount('Hard'),
      streak: matchedUser.userCalendar?.streak ?? 0,
      totalActiveDays: matchedUser.userCalendar?.totalActiveDays ?? 0,
      contestsAttended: userContestRanking?.attendedContestsCount ?? 0,
      contestBadge: matchedUser.contestBadge?.name ?? null,
      badge: matchedUser.contestBadge?.name ?? null,
    };
  } catch (error) {
    return { error: error.message || 'Could not fetch stats' };
  }
}

// -----------------------------------------------------------------------------
// Codeforces API Fetcher
// -----------------------------------------------------------------------------
async function fetchCodeforcesStats(username, timeoutMs = FETCH_TIMEOUT_MS) {
  try {
    const cleanUser = cleanUsername('codeforces', username);
    if (!cleanUser) {
      return { error: 'Username is required' };
    }

    const response = await fetchWithTimeout(
      `https://codeforces.com/api/user.info?handles=${encodeURIComponent(cleanUser)}`,
      {
        headers: {
          Accept: 'application/json',
        },
      },
      timeoutMs
    );

    if (!response.ok) {
      return { error: `Codeforces request failed with status ${response.status}` };
    }

    const json = await response.json();

    if (json.status !== 'OK' || !json.result || json.result.length === 0) {
      return { error: json.comment || 'User not found' };
    }

    const user = json.result[0];

    return {
      rating: user.rating ?? null,
      maxRating: user.maxRating ?? null,
      rank: user.rank ?? 'unrated',
      maxRank: user.maxRank ?? 'unrated',
      contribution: user.contribution ?? 0,
      friendOfCount: user.friendOfCount ?? 0,
      registrationTimeSeconds: user.registrationTimeSeconds ?? null,
    };
  } catch (error) {
    return { error: error.message || 'Could not fetch stats' };
  }
}

// -----------------------------------------------------------------------------
// CodeChef API Fetcher
// -----------------------------------------------------------------------------
async function fetchCodeChefStats(username, timeoutMs = FETCH_TIMEOUT_MS) {
  try {
    const cleanUser = cleanUsername('codechef', username);
    if (!cleanUser) {
      return { error: 'Username is required' };
    }

    const response = await fetchWithTimeout(
      `https://codechef-api.vercel.app/handle/${encodeURIComponent(cleanUser)}`,
      {
        headers: {
          Accept: 'application/json',
        },
      },
      timeoutMs
    );

    if (!response.ok) {
      return { error: `CodeChef request failed with status ${response.status}` };
    }

    const json = await response.json();

    if (json.success === false || json.status === 'error' || json.status === 404) {
      return { error: json.message || json.error || 'User not found' };
    }

    const parseNum = (val) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const cleaned = val.replace(/[^0-9]/g, '');
        const num = parseInt(cleaned, 10);
        return isNaN(num) ? null : num;
      }
      return null;
    };

    return {
      rating: parseNum(json.currentRating ?? json.rating),
      currentRating: parseNum(json.currentRating ?? json.rating),
      highestRating: parseNum(json.highestRating ?? json.maxRating),
      stars: json.stars != null ? String(json.stars) : null,
      globalRank: parseNum(json.globalRank ?? json.global_rank),
      countryRank: parseNum(json.countryRank ?? json.country_rank),
      totalProblemsSolved: parseNum(
        json.totalProblemsSolved ?? json.totalSolved ?? json.problemsSolved
      ) ?? 0,
      totalSolved: parseNum(
        json.totalProblemsSolved ?? json.totalSolved ?? json.problemsSolved
      ) ?? 0,
    };
  } catch (error) {
    return { error: error.message || 'Could not fetch stats' };
  }
}

// -----------------------------------------------------------------------------
// Chess.com API Fetcher
// -----------------------------------------------------------------------------
async function fetchChessStats(username, timeoutMs = FETCH_TIMEOUT_MS) {
  try {
    const cleanUser = cleanUsername('chess', username);
    if (!cleanUser) {
      return { error: 'Username is required' };
    }

    const response = await fetchWithTimeout(
      `https://api.chess.com/pub/player/${encodeURIComponent(cleanUser.toLowerCase())}/stats`,
      {
        headers: {
          'User-Agent': 'IIIT-NR-Workspace-App (Student Workspace)',
          Accept: 'application/json',
        },
      },
      timeoutMs
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { error: 'Chess.com player not found' };
      }
      return { error: `Chess.com request failed with status ${response.status}` };
    }

    const json = await response.json();

    const parseTimeControl = (control) => ({
      rating: control?.last?.rating ?? null,
      best: control?.best?.rating ?? null,
      wins: control?.record?.win ?? 0,
      losses: control?.record?.loss ?? 0,
      draws: control?.record?.draw ?? 0,
    });

    const rapid = parseTimeControl(json.chess_rapid);
    const blitz = parseTimeControl(json.chess_blitz);
    const bullet = parseTimeControl(json.chess_bullet);

    const totalWins = (rapid.wins || 0) + (blitz.wins || 0) + (bullet.wins || 0);
    const totalLosses = (rapid.losses || 0) + (blitz.losses || 0) + (bullet.losses || 0);
    const totalDraws = (rapid.draws || 0) + (blitz.draws || 0) + (bullet.draws || 0);
    const totalGames = totalWins + totalLosses + totalDraws;

    const overallWinRate = totalGames > 0
      ? Number(((totalWins / totalGames) * 100).toFixed(1))
      : 0;

    return {
      rapid,
      blitz,
      bullet,
      totalGames,
      overallWinRate,
    };
  } catch (error) {
    return { error: error.message || 'Could not fetch stats' };
  }
}

// -----------------------------------------------------------------------------
// GitHub API Fetcher
// -----------------------------------------------------------------------------
async function fetchGitHubStats(username, timeoutMs = FETCH_TIMEOUT_MS) {
  try {
    const cleanUser = cleanUsername('github', username);
    if (!cleanUser) {
      return { error: 'Username is required' };
    }

    const response = await fetchWithTimeout(
      `https://api.github.com/users/${encodeURIComponent(cleanUser)}`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'IIIT-NR-Workspace-App',
        },
      },
      timeoutMs
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { error: 'GitHub user not found' };
      }
      return { error: `GitHub request failed with status ${response.status}` };
    }

    const json = await response.json();

    return {
      publicRepos: json.public_repos ?? 0,
      repos: json.public_repos ?? 0,
      followers: json.followers ?? 0,
      following: json.following ?? 0,
      bio: json.bio ?? '',
      company: json.company ?? null,
      location: json.location ?? null,
      createdAt: json.created_at ?? null,
    };
  } catch (error) {
    return { error: error.message || 'Could not fetch stats' };
  }
}

// -----------------------------------------------------------------------------
// PLATFORMS Registry
// -----------------------------------------------------------------------------
export const PLATFORMS = {
  leetcode: {
    id: 'leetcode',
    name: 'LeetCode',
    icon: 'code-braces',
    color: '#FFA116',
    description: 'Show your problem-solving stats',
    placeholder: 'Enter your LeetCode username',
    urlPattern: /leetcode\.com\/(?:u\/)?([a-zA-Z0-9_-]+)/i,
    profileUrl: (username) => `https://leetcode.com/u/${username}`,
    fetchStats: fetchLeetCodeStats,
  },
  codeforces: {
    id: 'codeforces',
    name: 'Codeforces',
    icon: 'chart-bell-curve-cumulative',
    color: '#1F8ACB',
    description: 'Display your competitive rating',
    placeholder: 'Enter your Codeforces handle',
    urlPattern: /codeforces\.com\/profile\/([a-zA-Z0-9_.-]+)/i,
    profileUrl: (username) => `https://codeforces.com/profile/${username}`,
    fetchStats: fetchCodeforcesStats,
  },
  codechef: {
    id: 'codechef',
    name: 'CodeChef',
    icon: 'food-fork-drink',
    color: '#D4A373',
    description: 'Share your CodeChef stars & rank',
    placeholder: 'Enter your CodeChef username',
    urlPattern: /codechef\.com\/users\/([a-zA-Z0-9_]+)/i,
    profileUrl: (username) => `https://www.codechef.com/users/${username}`,
    fetchStats: fetchCodeChefStats,
  },
  chess: {
    id: 'chess',
    name: 'Chess.com',
    icon: 'chess-knight',
    color: '#81B64C',
    description: 'Flex your chess ELO ratings',
    placeholder: 'Enter your Chess.com username',
    urlPattern: /chess\.com\/member\/([a-zA-Z0-9_.-]+)/i,
    profileUrl: (username) => `https://chess.com/member/${username}`,
    fetchStats: fetchChessStats,
  },
  github: {
    id: 'github',
    name: 'GitHub',
    icon: 'github',
    color: '#F0F6FC',
    description: 'Showcase your open source work',
    placeholder: 'Enter your GitHub username',
    urlPattern: /github\.com\/([a-zA-Z0-9_.-]+)/i,
    profileUrl: (username) => `https://github.com/${username}`,
    fetchStats: fetchGitHubStats,
  },
};

export const getPlatformList = () => Object.values(PLATFORMS);

export const getPlatformById = (id) => {
  if (!id || typeof id !== 'string') return null;
  const key = id.trim().toLowerCase();
  if (key === 'chess.com') return PLATFORMS.chess;
  return PLATFORMS[key] || null;
};

export const cleanUsername = (platformId, input = '') => {
  if (!input) return '';
  let trimmed = input.trim();
  const platform = getPlatformById(platformId);
  if (platform?.urlPattern) {
    const match = trimmed.match(platform.urlPattern);
    if (match && match[1]) {
      return match[1].replace(/\/+$/, '');
    }
  }

  // If a URL was pasted, extract the last path segment
  if (trimmed.includes('://') || trimmed.includes('.com') || trimmed.includes('/')) {
    const cleanUrl = trimmed.split('?')[0].split('#')[0].replace(/\/+$/, '');
    const parts = cleanUrl.split('/').filter(Boolean);
    if (parts.length > 0) {
      const last = parts[parts.length - 1];
      if (last && !last.includes('.')) {
        return last.replace(/^@/, '');
      }
    }
  }

  // Remove any trailing slashes or @ symbols
  return trimmed.replace(/^@/, '').replace(/\/+$/, '');
};

export const extractUsername = cleanUsername;

export const getProfileUrl = (platformId, username) => {
  if (!username) return '';
  if (username.startsWith('http://') || username.startsWith('https://')) {
    return username;
  }
  const platform = getPlatformById(platformId);
  if (platform && typeof platform.profileUrl === 'function') {
    return platform.profileUrl(cleanUsername(platformId, username));
  }
  return `https://${platformId}.com/${username}`;
};

export const fetchPlatformStats = async (platformId, username) => {
  if (!platformId || !username) {
    return { error: 'Platform and username are required' };
  }

  const platform = getPlatformById(platformId);
  if (!platform) {
    return { error: `Platform '${platformId}' not supported` };
  }

  const clean = cleanUsername(platformId, username);
  if (!clean) {
    return { error: 'Invalid username' };
  }

  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Request timed out after 30 seconds'));
    }, STATS_TIMEOUT_MS);
  });

  try {
    const statsPromise = platform.fetchStats(clean, STATS_TIMEOUT_MS);
    const result = await Promise.race([statsPromise, timeoutPromise]);
    return result;
  } catch (error) {
    return { error: error.message || 'Could not fetch stats' };
  } finally {
    clearTimeout(timeoutId);
  }
};

export default {
  PLATFORMS,
  getPlatformList,
  getPlatformById,
  cleanUsername,
  extractUsername,
  getProfileUrl,
  fetchPlatformStats,
};
