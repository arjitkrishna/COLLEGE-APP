import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, UIManager, LayoutAnimation } from 'react-native';
import colors from '../../theme/colors';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental &&
  !UIManager.__layoutAnimationEnabled
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
  UIManager.__layoutAnimationEnabled = true;
}

const StatBar = ({
  label,
  value = 0,
  maxValue,
  color = colors.primary,
  showPercentage = false,
  size = 'normal',
  style,
}) => {
  const numericVal = typeof value === 'number' ? value : parseFloat(value) || 0;
  const numericMax =
    maxValue !== undefined && maxValue !== null
      ? typeof maxValue === 'number'
        ? maxValue
        : parseFloat(maxValue) || 0
      : null;

  let targetPercentage = 0;
  if (numericMax !== null) {
    targetPercentage = numericMax > 0 ? Math.min(100, Math.max(0, (numericVal / numericMax) * 100)) : 0;
  } else {
    targetPercentage = Math.min(100, Math.max(0, numericVal));
  }

  const [currentPercent, setCurrentPercent] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      } catch (e) {
        // Fallback silently if LayoutAnimation is not supported
      }
      setCurrentPercent(targetPercentage);
    }, 80);

    return () => clearTimeout(timer);
  }, [targetPercentage]);

  const isSmall = size === 'small';
  const barHeight = isSmall ? 6 : 10;

  // Build display text for the right-hand value
  let displayText = '';
  if (showPercentage) {
    if (numericMax !== null && numericMax !== 100) {
      displayText = `${numericVal}/${numericMax} (${Math.round(targetPercentage)}%)`;
    } else {
      const formatted =
        typeof numericVal === 'number' && !Number.isInteger(numericVal)
          ? numericVal.toFixed(1)
          : Math.round(targetPercentage);
      displayText = `${formatted}%`;
    }
  } else if (numericMax !== null) {
    displayText = `${numericVal} / ${numericMax}`;
  } else {
    displayText = `${value}`;
  }

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text style={[styles.label, isSmall && styles.labelSmall]} numberOfLines={1}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.track,
          {
            height: barHeight,
            borderRadius: barHeight / 2,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${currentPercent}%`,
              backgroundColor: color,
              height: barHeight,
              borderRadius: barHeight / 2,
            },
          ]}
        />
      </View>

      <Text style={[styles.value, isSmall && styles.valueSmall]} numberOfLines={1}>
        {displayText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  label: {
    width: 68,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginRight: 10,
  },
  labelSmall: {
    width: 58,
    fontSize: 11,
    marginRight: 8,
  },
  track: {
    flex: 1,
    backgroundColor: colors.border,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    minWidth: 0,
  },
  value: {
    minWidth: 54,
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
    marginLeft: 10,
  },
  valueSmall: {
    minWidth: 46,
    fontSize: 11,
    marginLeft: 8,
  },
});

export default StatBar;
