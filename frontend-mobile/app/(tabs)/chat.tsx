import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useState, useEffect, useRef } from "react";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useOnboardingStore } from "@/store/onboarding.store";

export default function ChatScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const [message, setMessage] = useState("");
  const exhibitionId = useOnboardingStore((s) => s.exhibition);
  const galleryId = useOnboardingStore((s) => s.gallery);
  const isExhibitionSelected = exhibitionId !== undefined;
  const prevGalleryIdRef = useRef<number | undefined>(galleryId);
  const prevExhibitionIdRef = useRef<number | undefined>(exhibitionId);

  // 갤러리/전시 변경 시 현재 탭 유지
  useEffect(() => {
    const galleryChanged = prevGalleryIdRef.current !== galleryId;
    const exhibitionChanged = prevExhibitionIdRef.current !== exhibitionId;
    
    if ((galleryChanged || exhibitionChanged) && pathname?.includes("/chat")) {
      // 현재 경로가 채팅이면 명시적으로 채팅 탭 유지
      router.replace("/(tabs)/chat" as any);
    }
    
    prevGalleryIdRef.current = galleryId;
    prevExhibitionIdRef.current = exhibitionId;
  }, [galleryId, exhibitionId, pathname, router]);

  const handleCameraPress = () => {
    if (!isExhibitionSelected) {
      return;
    }
    router.push({
      pathname: "/camera",
      params: {
        exhibitionId: String(exhibitionId),
      },
    });
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        >
          <View style={{ alignItems: "center", justifyContent: "center", flex: 1, paddingVertical: 40 }}>
            {isExhibitionSelected ? (
              <>
                <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>
                  AI 도슨트와 대화하기
                </Text>
                <Text style={{ color: "#666", textAlign: "center" }}>
                  궁금한 점을 물어보세요
                </Text>
              </>
            ) : (
              <>
                <MaterialIcons name="info-outline" size={48} color="#FF9500" style={{ marginBottom: 16 }} />
                <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8, color: "#FF9500" }}>
                  전시를 선택하세요
                </Text>
                <Text style={{ color: "#666", textAlign: "center", paddingHorizontal: 20 }}>
                  채팅 기능을 사용하려면 먼저 전시를 선택해주세요.
                </Text>
              </>
            )}
          </View>
        </ScrollView>

        {/* 입력창 영역 */}
        <View style={{ 
          flexDirection: "row", 
          alignItems: "center", 
          padding: 12,
          paddingBottom: 100,
          borderTopWidth: 1, 
          borderTopColor: "#e5e5e5",
          backgroundColor: "#fff"
        }}>
          <Pressable
            onPress={handleCameraPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={!isExhibitionSelected}
            style={{
              marginRight: 8,
              padding: 8,
              opacity: isExhibitionSelected ? 1 : 0.5,
            }}
          >
            <MaterialIcons 
              name="camera-alt" 
              size={24} 
              color={isExhibitionSelected ? "#007AFF" : "#ccc"} 
            />
          </Pressable>
          
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: isExhibitionSelected ? "#e5e5e5" : "#e0e0e0",
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              fontSize: 16,
              backgroundColor: isExhibitionSelected ? "#f5f5f5" : "#f0f0f0",
            }}
            placeholder={isExhibitionSelected ? "메시지를 입력하세요..." : "전시를 선택하세요"}
            value={message}
            onChangeText={setMessage}
            multiline
            editable={isExhibitionSelected}
          />
          
          <Pressable
            onPress={() => {
              if (isExhibitionSelected && message.trim()) {
                setMessage("");
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              marginLeft: 8,
              padding: 8,
              opacity: isExhibitionSelected && message.trim() ? 1 : 0.5,
            }}
            disabled={!isExhibitionSelected || !message.trim()}
          >
            <MaterialIcons 
              name="send" 
              size={24} 
              color={isExhibitionSelected && message.trim() ? "#007AFF" : "#ccc"} 
            />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
