import { View, Text, Alert, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions, CameraViewRef } from "expo-camera";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useRef } from "react";
import { PhotoService } from "@/services/photo";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable } from "react-native";

export default function CameraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ exhibitionId?: string }>();
  const exhibitionId = params.exhibitionId ? parseInt(params.exhibitionId, 10) : null;
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<CameraViewRef>(null);

  if (!permission) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top", "bottom"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top", "bottom"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <MaterialIcons name="camera-alt" size={64} color="#fff" style={{ marginBottom: 24 }} />
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600", marginBottom: 12, textAlign: "center" }}>
            카메라 권한이 필요합니다
          </Text>
          <Text style={{ color: "#ccc", fontSize: 14, textAlign: "center", marginBottom: 24 }}>
            작품을 검색하기 위해 카메라 접근 권한이 필요합니다
          </Text>
          <Pressable
            onPress={requestPermission}
            style={{
              backgroundColor: "#007AFF",
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
              권한 허용
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (!exhibitionId || Number.isNaN(exhibitionId)) {
      Alert.alert("오류", "전시 정보가 없습니다.");
      return;
    }

    if (!cameraRef.current) {
      Alert.alert("오류", "카메라를 초기화할 수 없습니다.");
      return;
    }

    try {
      setLoading(true);
      const photo = await (cameraRef.current as any).takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (!photo?.uri) {
        throw new Error("사진 촬영에 실패했습니다.");
      }

      const results = await PhotoService.searchImage({
        tempUri: photo.uri,
        exhibitionId,
      });

      if (!results || (Array.isArray(results) && results.length === 0)) {
        router.push({
          pathname: "/camera/noresult",
          params: {
            exhibitionId: String(exhibitionId),
          },
        });
        return;
      }

      router.push({
        pathname: "/camera/result",
        params: {
          results: JSON.stringify(results),
          exhibitionId: String(exhibitionId),
        },
      });
    } catch (error: any) {
      console.error("이미지 검색 오류:", error);
      Alert.alert(
        "오류",
        error.message || "이미지 검색에 실패했습니다.\n\n네트워크 연결을 확인해주세요."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top", "bottom"]}>
      <View style={{ flex: 1 }}>
        <CameraView
          ref={cameraRef as any}
          style={{ flex: 1 }}
          facing={facing}
          onCameraReady={() => setLoading(false)}
        />
        <View style={{ 
          position: "absolute", 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          justifyContent: "flex-end", 
          padding: 20 
        }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(0,0,0,0.5)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIcons name="close" size={24} color="#fff" />
            </Pressable>

            <Pressable
              onPress={() => setFacing(facing === "back" ? "front" : "back")}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(0,0,0,0.5)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIcons name="flip-camera-ios" size={24} color="#fff" />
            </Pressable>
          </View>

          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <Pressable
              onPress={takePicture}
              disabled={loading}
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: loading ? "#666" : "#fff",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 4,
                borderColor: "#e5e5e5",
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: "#fff",
                  }}
                />
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
