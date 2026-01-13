import { View, TextInput, Pressable, StyleSheet, Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Keyboard } from "react-native";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setIsKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // FloatingTabBar 높이 (64 + 28 marginBottom = 92)
  const floatingTabBarHeight = 92;
  const bottomOffset = isKeyboardVisible
    ? keyboardHeight
    : floatingTabBarHeight + 0;

  return (
    <View
      style={[
        styles.container,
        {
          bottom: bottomOffset,
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
            size={20}
            color={message.trim() ? "#fff" : "#ccc"}
          />
        </Pressable>
      ) : (
        <View style={styles.sendButtonPlaceholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
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
    borderRadius: 18,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#f5f5f5",
  },
  sendButtonPlaceholder: {
    width: 36,
    height: 36,
  },
});
