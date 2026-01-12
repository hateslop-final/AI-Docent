import React, { useEffect, useState } from 'react';
import { Modal, Text, Pressable, FlatList, ActivityIndicator, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatDatabaseService } from '@/services/chathistory_service';
import { useAuth } from '@/store/auth.store';

type SessionRow = {
  id: number;
  title: string | null;
  created_at: string;
  updated_at?: string;
};

type Props = {
  visible: boolean;
  exhibitionId?: number;
  onClose: () => void;
  onSelectSession: (sessionId: number) => void;
  onCreateNew: (sessionId: number) => void;
};

export default function SessionListModal({
  visible,
  exhibitionId,
  onClose,
  onSelectSession,
  onCreateNew,
}: Props) {
  const user = useAuth((s) => s.user);

  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  /** ===== 세션 목록 로드 ===== */
  useEffect(() => {
    let mounted = true;

    async function loadSessions() {
      if (!visible || !user || !exhibitionId) return;

      setLoading(true);
      setError(null);

      try {
        const rows = await ChatDatabaseService.listSessions(
          user.id,
          exhibitionId
        );
        if (mounted) setSessions(rows || []);
      } catch (e: any) {
        console.log('[SessionListModal] listSessions error', e);
        if (mounted) setError(e.message || '세션 목록 로드 실패');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSessions();
    return () => {
      mounted = false;
    };
  }, [visible, user, exhibitionId]);

  /** ===== 새 세션 생성 ===== */
  const handleCreate = async () => {
    if (!user || !exhibitionId) return;

    // 세션 개수 제한 확인 (3개까지)
    if (sessions.length >= 3) {
      Alert.alert(
        '세션 개수 제한',
        '전시당 최대 3개의 세션만 생성할 수 있습니다.\n기존 세션을 삭제한 후 새로 생성해주세요.',
        [{ text: '확인' }]
      );
      return;
    }

    setLoading(true);
    try {
      const r = await ChatDatabaseService.createSession(
        user.id,
        exhibitionId
      );
      onCreateNew(r.id);
    } catch (e: any) {
      console.log('[SessionListModal] createSession error', e);
      setError(e.message || '세션 생성 실패');
    } finally {
      setLoading(false);
    }
  };

  /** ===== 세션 삭제 ===== */
  const handleDelete = (sessionId: number) => {
    Alert.alert(
      '세션 삭제',
      '이 세션의 모든 대화가 삭제됩니다.\n되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await ChatDatabaseService.deleteSession(sessionId);

              // UI 즉시 반영
              setSessions((prev) =>
                prev.filter((s) => s.id !== sessionId)
              );
            } catch (e: any) {
              console.log('[SessionListModal] deleteSession error', e);
              setError(e.message || '세션 삭제 실패');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  /** ===== 렌더 ===== */
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"   // iOS
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={{ flex: 1, backgroundColor: '#fff' }}
        edges={['top', 'bottom']}
      >
        {/* ===== 헤더 ===== */}
        <View style={{ padding: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700' }}>
              세션 목록
            </Text>

            <View style={{ flexDirection: 'row' }}>
              <Pressable onPress={handleCreate} style={{ padding: 8 }}>
                <Text
                  style={{ color: '#007AFF', fontWeight: '600' }}
                >
                  ＋ 새 세션
                </Text>
              </Pressable>

              <Pressable onPress={onClose} style={{ padding: 8 }}>
                <Text style={{ color: '#333' }}>닫기</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* ===== 본문 ===== */}
        {loading ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ActivityIndicator />
          </View>
        ) : error ? (
          <View style={{ padding: 16 }}>
            <Text style={{ color: 'red' }}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={sessions}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 32,
            }}
            renderItem={({ item }) => (
              <View
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderColor: '#eee',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                {/* 세션 선택 */}
                <Pressable
                  onPress={() => onSelectSession(item.id)}
                  style={{ flex: 1 }}
                >
                  <Text
                    style={{ fontSize: 16, fontWeight: '600' }}
                  >
                    {item.title ||
                      `세션 ${new Date(
                        item.created_at
                      ).toLocaleString()}`}
                  </Text>
                  <Text
                    style={{ color: '#666', marginTop: 4 }}
                  >
                    {new Date(
                      item.created_at
                    ).toLocaleString()}
                  </Text>
                </Pressable>

                {/* 삭제 버튼 */}
                <Pressable
                  onPress={() => handleDelete(item.id)}
                  style={{ padding: 8 }}
                >
                  <Text
                    style={{
                      color: 'red',
                      fontWeight: '600',
                    }}
                  >
                    삭제
                  </Text>
                </Pressable>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}