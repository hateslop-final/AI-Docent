import { View, TextInput, Pressable, StyleSheet, Platform, Animated } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Keyboard } from "react-native";
import { useEffect, useState, useRef, useLayoutEffect } from "react";

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
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const floatingTabBarHeight = 92;
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
    // 리스너 등록 전에 발생하는 키보드 이벤트 무시를 위한 플래그
    let isListenerReady = false;
    
    // 리스너가 준비될 때까지 약간의 지연 (마운트 시 발생하는 이벤트 무시)
    const readyTimer = setTimeout(() => {
      isListenerReady = true;
    }, 100);

    const showSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        if (!isListenerReady) return; // 리스너 준비 전 이벤트 무시
        
        setIsKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
        // 초기 마운트 시에는 애니메이션 없이 즉시 설정
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
        if (!isListenerReady) return; // 리스너 준비 전 이벤트 무시
        
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
        // 초기 마운트 시에는 애니메이션 없이 즉시 설정
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

    // 컴포넌트가 마운트된 후 초기 마운트 플래그 해제 (약간의 지연 후)
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
        },
        isKeyboardVisible && styles.containerWithKeyboard,
      ]}
    >
      {exhibitionId ? (
        <Pressable onPress={onCameraPress} style={styles.iconButton}>
          {isPastExhibition ? (
            <MaterialIcons name="image-search" size={24} color="#007AFF" />
          ) : (
            <MaterialIcons name="camera-alt" size={24} color="#007AFF" />
          )}
        </Pressable>
      ) : (
        <View style={styles.iconButton}>
          <MaterialIcons name="camera-alt" size={24} color="#ccc" />
        </View>
      )}

      <TextInput
        style={[
          styles.input,
          isKeyboardVisible && styles.inputWithKeyboard,
        ]}
        value={message}
        onChangeText={onChangeText}
        editable={!!exhibitionId && !isLoading}
        multiline={true}
        placeholder={placeholder}
        placeholderTextColor="#999"
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
            size={25}
            color={message.trim() ? "#007AFF" : "#ccc"}
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
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    alignItems: "center",
    backgroundColor: "#fff",
    zIndex: 999,
  },
  containerWithKeyboard: {
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  iconButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    padding: 10,
    fontSize: 16,
  },
  inputWithKeyboard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    // borderRadius: 18,
    // backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    // backgroundColor: "#f5f5f5",
  },
  sendButtonPlaceholder: {
    width: 36,
    height: 36,
  },
});
