import React, { useRef } from 'react';
import { Modal, View, TouchableOpacity, TouchableWithoutFeedback, Animated, PanResponder, StyleSheet, Dimensions, DimensionValue } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface BottomModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: DimensionValue;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const BottomModal: React.FC<BottomModalProps> = ({ visible, onClose, children, maxHeight }) => {
  const { theme } = useTheme();
  const panY = useRef(new Animated.Value(0)).current;

  const resetPositionAnim = Animated.timing(panY, {
    toValue: 0,
    duration: 300,
    useNativeDriver: true,
  });

  const closeAnim = Animated.timing(panY, {
    toValue: SCREEN_HEIGHT,
    duration: 300,
    useNativeDriver: true,
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only handle vertical swipes
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 1.5) {
          // Swipe down threshold crossed, close modal
          closeAnim.start(() => {
            onClose();
            panY.setValue(0);
          });
        } else {
          // Reset position
          resetPositionAnim.start();
        }
      },
    })
  ).current;

  // Reset position when modal opens
  React.useEffect(() => {
    if (visible) {
      panY.setValue(0);
    }
  }, [visible, panY]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <Animated.View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.surface, maxHeight: maxHeight || 'auto' },
              { transform: [{ translateY: panY }] }
            ]}
          >
            <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
              <View style={styles.modalIndicator} />
            </View>
            {children}
          </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    // Add shadow for better appearance
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: -24, // Pull up to cover padding
  },
  modalIndicator: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(150,150,150,0.3)',
    borderRadius: 2,
  },
});
