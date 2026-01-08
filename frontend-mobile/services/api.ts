import { Platform } from "react-native";
import Constants from "expo-constants";

const envApiBase = process.env.EXPO_PUBLIC_API_BASE;

const getHostIP = (): string | null => {
  try {
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.hostUri;
    
    if (hostUri) {
      const [ip] = hostUri.split(":");
      if (ip && /^\d+\.\d+\.\d+\.\d+$/.test(ip) && ip !== "127.0.0.1") {
        return ip;
      }
    }
    
    const manifest2 = Constants.manifest2;
    if (manifest2?.extra?.expoGo?.hostUri) {
      const [ip] = manifest2.extra.expoGo.hostUri.split(":");
      if (ip && /^\d+\.\d+\.\d+\.\d+$/.test(ip) && ip !== "127.0.0.1") {
        return ip;
      }
    }
  } catch (error) {
    console.warn("호스트 IP 감지 실패:", error);
  }
  return null;
};

const getApiBase = (): string => {
  if (envApiBase) {
    if (envApiBase.includes("127.0.0.1")) {
      return envApiBase.replace("127.0.0.1", "localhost");
    }
    return envApiBase;
  }
  
  if (Platform.OS === "ios") {
    const hostIP = getHostIP();
    if (hostIP) {
      return `http://${hostIP}:8000`;
    }
    return "http://localhost:8000";
  }
  
  return "http://10.0.2.2:8000";
};

const API_BASE = getApiBase();

console.log("🔗 API_BASE:", API_BASE);

export { API_BASE };
export const getApiBaseUrl = (): string => API_BASE;
