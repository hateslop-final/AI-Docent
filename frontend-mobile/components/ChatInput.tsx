import { View, TextInput, Pressable, StyleSheet, Platform, Animated } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Keyboard } from "react-native";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";

interface ChatInputProps {
  message: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onCameraPress: () => void;
  exhibitionId?: number;
  isLoading: boolean;
  isPastExhibition: boolean;
  placeholder?: string;
}

export default function ChatInput({
  message,
  onChangeText,
  onSend,
  onCameraPress,
  exhibitionId,
  isLoading,
  isPastExhibition,
  placeholder,
}: ChatInputProps) {
  const { colors } = useTheme();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const floatingTabBarHeight = 70; // FloatingTabBar 높이
  const bottomAnim = useRef(new Animated.Value(floatingTabBarHeight)).current;
  const isInitialMountRef = useRef(true);
  const hasSetInitialValueRef = useRef(false);

  // 렌더링 전에 초기값 설정 (흔들림 방지)
  useLayoutEffect(() => {
    if (!hasSetInitialValueRef.current) {
      bottomAnim.setValue(floatingTabBarHeight);
      hasSetInitialValueRef.current = true;
    }
  }, []);

  useEffect(() => {
    let isListenerReady = false;
    
    const readyTimer = setTimeout(() => {
      isListenerReady = true;
    }, 100);

    const showSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        if (!isListenerReady) return;
        
        setIsKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
        if (isInitialMountRef.current) {
          bottomAnim.setValue(e.endCoordinates.height);
          isInitialMountRef.current = false;
        } else {
          Animated.timing(bottomAnim, {
            toValue: e.endCoordinates.height,
            duration: Platform.OS === "ios" ? 250 : 100,
            useNativeDriver: false,
          }).start();
        }
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        if (!isListenerReady) return;
        
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
        if (isInitialMountRef.current) {
          bottomAnim.setValue(floatingTabBarHeight);
          isInitialMountRef.current = false;
        } else {
          Animated.timing(bottomAnim, {
            toValue: floatingTabBarHeight,
            duration: Platform.OS === "ios" ? 250 : 100,
            useNativeDriver: false,
          }).start();
        }
      }
    );

    const timer = setTimeout(() => {
      isInitialMountRef.current = false;
    }, 500);

    return () => {
      clearTimeout(readyTimer);
      clearTimeout(timer);
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [bottomAnim, floatingTabBarHeight]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: bottomAnim,
          backgroundColor: colors.cardBackground,
          borderTopColor: colors.border,
        },
        isKeyboardVisible && styles.containerWithKeyboard,
      ]}
    >
      {exhibitionId ? (
        <Pressable onPress={onCameraPress} style={styles.iconButton}>
          {isPastExhibition ? (
            <MaterialIcons name="image-search" size={24} color={colors.text} />
          ) : (
            <MaterialIcons name="camera-alt" size={24} color={colors.text} />
          )}
        </Pressable>
      ) : (
        <View style={styles.iconButton}>
          <MaterialIcons name="camera-alt" size={24} color={colors.textSecondary} />
        </View>
      )}

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.primaryLight,
            color: colors.text,
          },
          isKeyboardVisible && styles.inputWithKeyboard,
        ]}
        value={message}
        onChangeText={onChangeText}
        editable={!!exhibitionId && !isLoading}
        multiline={true}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType="default"
        returnKeyType="default"
      />

      {exhibitionId ? (
        <Pressable
          onPress={message.trim() ? onSend : undefined}
          style={[
            styles.sendButton,
            !message.trim() && styles.sendButtonDisabled,
          ]}
          disabled={!message.trim()}
        >
          <MaterialIcons
            name="send"
            size={24}
            color={message.trim() ? colors.text : colors.textSecondary}
          />
        </Pressable>
      ) : (
        <View style={styles.sendButtonPlaceholder} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 26,
    alignItems: "center",
    justifyContent: "flex-start",
    borderTopWidth: 1,
    zIndex: 999,
  },
  containerWithKeyboard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  iconButton: {
    padding: 0,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    marginHorizontal: 0,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    minHeight: 40,
    maxHeight: 100,
  },
  inputWithKeyboard: {
    paddingVertical: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonPlaceholder: {
    width: 40,
    height: 40,
  },
});
