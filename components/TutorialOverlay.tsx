import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TutorialOverlayProps {
  visible: boolean;
  steps: {
    targetRect: { x: number, y: number, width: number, height: number } | null;
    title: string;
    description: string;
    arrowDirection: 'up' | 'down' | 'left' | 'right';
  }[];
  currentStep: number;
  onNext: () => void;
  onSkip: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  visible,
  steps,
  currentStep,
  onNext,
  onSkip,
}) => {
  const { theme, sfs } = useTheme();
  const { t } = useTranslation();
  const opacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    contentOpacity.setValue(0);
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [currentStep]);

  if (!visible || !steps[currentStep]) return null;

  const step = steps[currentStep];
  const hasTarget = step.targetRect && step.targetRect.width > 0;
  const rect = step.targetRect || { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2, width: 0, height: 0 };

  const padding = 8;
  const hX = rect.x - padding;
  const hY = rect.y - padding;
  const hW = rect.width + padding * 2;
  const hH = rect.height + padding * 2;

  // Calculate info box position
  let infoTop = hY + hH + 20;
  if (!hasTarget) {
    infoTop = SCREEN_HEIGHT / 2 - 120;
  } else if (hY > SCREEN_HEIGHT / 2) {
    infoTop = hY - 260; // Increased to accommodate larger buttons
  }
  
  // Safety constraints - ensuring it fits within the screen
  infoTop = Math.max(Platform.OS === 'ios' ? 60 : 40, Math.min(infoTop, SCREEN_HEIGHT - 320));

  return (
    <Animated.View style={[styles.container, { opacity }]} pointerEvents="box-none">
      {/* Dimmed backgrounds - only show if we have a target */}
      {hasTarget ? (
        <>
          <Pressable 
            onPress={onNext}
            style={[styles.dim, { top: 0, left: 0, right: 0, height: Math.max(0, hY) }]} 
          />
          <Pressable 
            onPress={onNext}
            style={[styles.dim, { top: hY + hH, left: 0, right: 0, bottom: 0 }]} 
          />
          <Pressable 
            onPress={onNext}
            style={[styles.dim, { top: Math.max(0, hY), left: 0, width: Math.max(0, hX), height: Math.max(0, hH) }]} 
          />
          <Pressable 
            onPress={onNext}
            style={[styles.dim, { top: Math.max(0, hY), left: hX + hW, right: 0, height: Math.max(0, hH) }]} 
          />
          
          {/* The Hole (Interactive area - tapping here also goes next) */}
          <TouchableOpacity 
            activeOpacity={0.6}
            onPress={onNext}
            style={[styles.hole, { left: hX, top: hY, width: hW, height: hH, borderColor: theme.colors.primary }]} 
          />
        </>
      ) : (
        <View style={[styles.dim, { top: 0, left: 0, right: 0, bottom: 0 }]} />
      )}

      {/* Info Content */}
      <Animated.View style={[styles.infoBox, { top: infoTop, opacity: contentOpacity }]} pointerEvents="box-none">
        {hasTarget && step.arrowDirection === 'up' && (
          <View style={styles.arrowUp}>
            <Ionicons name="arrow-up" size={sfs(32)} color={theme.colors.primary} />
          </View>
        )}
        
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.textPrimary, fontSize: sfs(22) }]}>{step.title}</Text>
          <Text style={[styles.desc, { color: theme.colors.textSecondary, fontSize: sfs(16) }]}>{step.description}</Text>
          
          <View style={styles.footer}>
            <TouchableOpacity 
              onPress={onSkip}
              activeOpacity={0.5}
              hitSlop={{ top: 25, bottom: 25, left: 25, right: 25 }}
              style={styles.skipBtn}
            >
              <Text style={[styles.skipText, { color: theme.colors.textMuted, fontSize: sfs(16) }]}>{t('tutorial.skip')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.nextBtn, { backgroundColor: theme.colors.primary }]} 
              onPress={onNext}
              activeOpacity={0.8}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Text style={[styles.nextBtnText, { fontSize: sfs(18) }]}>
                {currentStep === steps.length - 1 ? t('tutorial.finish') : t('tutorial.next')}
              </Text>
              <Ionicons name="chevron-forward" size={sfs(20)} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {hasTarget && step.arrowDirection === 'down' && (
          <View style={styles.arrowDown}>
            <Ionicons name="arrow-down" size={sfs(32)} color={theme.colors.primary} />
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  dim: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  hole: {
    position: 'absolute',
    borderWidth: 3,
    borderRadius: 20,
    borderStyle: 'dashed',
    zIndex: 10001,
  },
  infoBox: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 10002,
  },
  card: {
    width: '100%',
    padding: 24,
    borderRadius: 32,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  desc: {
    lineHeight: 24,
    marginBottom: 28,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  skipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  skipText: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 18,
    gap: 8,
  },
  nextBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  arrowUp: {
    marginBottom: 14,
  },
  arrowDown: {
    marginTop: 14,
  },
});
