import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../theme/typography';
import { Ionicons } from '@expo/vector-icons';

export const Header = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 20;
  const topPadding = Math.max(insets.top, statusBarHeight) + 12;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
          borderBottomColor: theme.border,
          paddingTop: topPadding,
        },
      ]}
    >
      <View style={styles.leftContainer}>
        {showBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        )}
        <View style={styles.titleWrapper}>
          <Text style={[typography.h2, { color: theme.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[typography.bodySmall, { color: theme.textSecondary, marginTop: 2 }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightAction && <View style={styles.rightContainer}>{rightAction}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleWrapper: {
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  rightContainer: {
    marginLeft: 12,
  },
});


