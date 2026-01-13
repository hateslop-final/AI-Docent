# 로그인 사용자 전시 변경 시 세션 저장 및 생성 흐름

## 시나리오
1. 로그인한 사용자가 처음 전시 A를 선택
2. 대화를 함 (로컬에 저장, `currentSessionId`는 `null` 또는 임시)
3. 전시 B로 변경
4. 전시 A의 세션이 DB에 저장되어야 함
5. 전시 B를 선택하면 이전 세션이 DB에 없는 상태라 새 세션이 바로 생성되어야 함

---

## 코드 실행 순서

### 📍 **1단계: 전시 A 선택 및 대화 시작**

**위치:** `chat.tsx` 또는 사용자 입력
- 전시 A 선택 → `exhibitionId` = A
- 사용자가 메시지 입력
- **로컬 저장:** `useChatStore.addMessage()` → `chatHistories[A].messages`에 추가
- **DB 저장:** ❌ 아직 없음 (세션이 DB에 없음)
- **상태:**
  - `currentSessionId` = `null` (또는 임시 ID)
  - `chatHistories[A].messages` = [메시지들...] (로컬에만 존재)

---

### 📍 **2단계: 전시 B로 변경**

**트리거:** `ExhibitionHeader.tsx` - `useEffect` (exhibitionId 변경 감지)

**위치:** `ExhibitionHeader.tsx:154-260`

```typescript
useEffect(() => {
  const prevId = prevExhibitionIdRef.current;  // 전시 A
  const currentId = exhibitionId;              // 전시 B
  
  if (prevId !== undefined && prevId !== currentId) {
    const hasHistoryNow = (() => {
      const h = useChatStore.getState().getChatHistory(prevId);
      return (h?.messages.length ?? 0) > 0;
    })();
    
    if (hasHistoryNow && user) {
      // 로그인 사용자 + 메시지 있음
      isProcessingChangeRef.current = true;
      
      // ... 저장 로직 실행
    }
  }
}, [exhibitionId, ...]);
```

---

### 📍 **3단계: 전시 A의 세션을 DB에 저장**

**위치:** `ExhibitionHeader.tsx:178-189`

```typescript
(async () => {
  try {
    // 1. 현재 세션 메시지들을 DB에 저장
    await ChatDatabaseService.saveOnExhibitionChange(
      user.id,
      prevId,                    // 전시 A
      currentMessages,           // 로컬에 있던 메시지들
      currentExhibitionName,     // 전시 A 이름
      currentSessionId,          // null (아직 DB에 세션 없음)
      age ?? null,
      aesthetic ?? null
    );
  } catch (e) {
    console.error('[ExhibitionHeader] auto-save error:', e);
  } finally {
    // 2. 로컬 히스토리 삭제
    useChatStore.getState().clearAllChatHistories();
    useChatStore.getState().setCurrentSessionId(null);
    
    // 3. 새 전시에 기존 세션이 있는지 확인
    // ...
  }
})();
```

**내부 실행:** `chathistory_service.ts:247-277` → `saveOnExhibitionChange()`

```typescript
async saveOnExhibitionChange(...) {
  // saveFullHistory 호출
  const savedSessionId = await this.saveFullHistory(
    userId,
    exhibitionId,    // 전시 A
    messages,        // 로컬 메시지들
    exhibitionName,
    sessionId,        // null (세션 ID 없음)
    ageGroup,
    expertiseLevel
  );
  return savedSessionId;
}
```

**내부 실행:** `chathistory_service.ts:30-122` → `saveFullHistory()`

```typescript
async saveFullHistory(...) {
  let activeSessionId = sessionId;  // null
  
  // 1. 세션 ID가 없는 경우에만 새로 생성
  if (!activeSessionId) {
    // 세션 개수 제한 확인 (3개까지)
    const existingSessions = await this.listSessions(userId, exhibitionId);
    
    if (existingSessions.length >= 3) {
      throw new Error('전시당 최대 3개의 세션만 생성할 수 있습니다.');
    }
    
    // 🔥 새 세션 생성 (전시 A용)
    const { data: history } = await supabase
      .from('chat_history')
      .insert({ 
        user_id: userId, 
        exhibition_id: exhibitionId,  // 전시 A
        title: exhibitionName 
      })
      .select()
      .single();
    
    activeSessionId = history.id;  // 새로 생성된 세션 ID
  }
  
  // 2. 메시지들을 DB에 저장
  const messagesToInsert = newMessages.map((m) => ({
    session_id: activeSessionId,  // 방금 생성한 세션 ID
    role: m.isUser ? 'user' : 'assistant',
    content: m.text,
    // ...
  }));
  
  await supabase.from('chat_messages').insert(messagesToInsert);
  
  return activeSessionId;
}
```

**결과:**
- ✅ 전시 A의 세션이 DB에 생성됨 (`chat_history` 테이블)
- ✅ 전시 A의 메시지들이 DB에 저장됨 (`chat_messages` 테이블)
- ✅ 로컬 히스토리 삭제됨 (`clearAllChatHistories()`)
- ✅ `currentSessionId` = `null`로 리셋

---

### 📍 **4단계: 전시 B의 기존 세션 확인**

**위치:** `ExhibitionHeader.tsx:197-242`

```typescript
// 3. 새 전시에 기존 세션이 있는지 확인
if (currentId !== undefined && !globalSessionCreationLock) {
  try {
    // 🔥 Supabase에서 전시 B의 기존 세션 조회
    const existingSessions = await ChatDatabaseService.listSessions(
      user.id, 
      currentId  // 전시 B
    );
    
    console.log('[ExhibitionHeader] 🔵 전시 변경 후 기존 세션 확인:', {
      exhibitionId: currentId,
      sessionCount: existingSessions.length
    });
    
    if (existingSessions.length > 0) {
      // 기존 세션이 있으면 세션 모달 열기
      useChatStore.getState().openSessionModal();
    } else {
      // 🔥 기존 세션이 없으면 새 세션 생성
      globalSessionCreationLock = true;
      try {
        const newExhibitionName = exhibitions.find(e => e.id === currentId)?.name;
        
        const newSession = await ChatDatabaseService.createSession(
          user.id,
          currentId,           // 전시 B
          newExhibitionName
        );
        
        useChatStore.getState().setCurrentSessionId(newSession.id);
      } finally {
        setTimeout(() => {
          globalSessionCreationLock = false;
        }, 500);
      }
    }
  } catch (e) {
    console.error('[ExhibitionHeader] ❌ 세션 목록 확인 실패:', e);
  }
}
```

**내부 실행:** `chathistory_service.ts:123-133` → `listSessions()`

```typescript
async listSessions(userId: string, exhibitionId: number) {
  // 🔥 Supabase에서 조회
  const { data, error } = await supabase
    .from('chat_history')
    .select('id, title, created_at, updated_at')
    .eq('user_id', userId)
    .eq('exhibition_id', exhibitionId)  // 전시 B
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;  // [] (빈 배열 - 전시 B에 세션 없음)
}
```

**결과:**
- `existingSessions.length` = `0` (전시 B에 세션 없음)
- `else` 블록 실행 → 새 세션 생성

---

### 📍 **5단계: 전시 B의 새 세션 생성**

**위치:** `chathistory_service.ts:165-202` → `createSession()`

```typescript
async createSession(userId: string, exhibitionId: number, title?: string) {
  console.log('[ChatDatabaseService] 🔵 createSession 호출:', {
    userId,
    exhibitionId,  // 전시 B
    title
  });
  
  // 기존 세션 개수 확인
  const existingSessions = await this.listSessions(userId, exhibitionId);
  console.log('[ChatDatabaseService] 🔵 기존 세션 개수:', existingSessions.length);
  
  if (existingSessions.length >= 3) {
    throw new Error('전시당 최대 3개의 세션만 생성할 수 있습니다.');
  }
  
  // 🔥 새 세션 생성 (전시 B용)
  const { data, error } = await supabase
    .from('chat_history')
    .insert({ 
      user_id: userId, 
      exhibition_id: exhibitionId,  // 전시 B
      title: title ?? `세션 ${new Date().toLocaleString()}` 
    })
    .select()
    .single();
  
  if (error) throw error;
  
  console.log('[ChatDatabaseService] ✅ 세션 생성 완료:', {
    sessionId: data.id,
    userId,
    exhibitionId
  });
  
  return data;  // { id: number, title: string, created_at: string }
}
```

**결과:**
- ✅ 전시 B의 새 세션이 DB에 생성됨
- ✅ `useChatStore.getState().setCurrentSessionId(newSession.id)` 실행
- ✅ 로컬 상태: `currentSessionId` = 새 세션 ID (전시 B)

---

## 전체 흐름 요약

```
[전시 A 선택]
  ↓
[대화 시작] → 로컬에만 저장 (currentSessionId = null)
  ↓
[전시 B로 변경]
  ↓
[ExhibitionHeader.tsx - useEffect 감지]
  ↓
[1] 전시 A 세션 DB 저장
    → saveOnExhibitionChange()
    → saveFullHistory()
    → 세션 ID 없음 → 새 세션 생성 (전시 A)
    → 메시지들 DB 저장
  ↓
[2] 로컬 히스토리 삭제
    → clearAllChatHistories()
    → setCurrentSessionId(null)
  ↓
[3] 전시 B 기존 세션 확인
    → listSessions(user.id, 전시B)
    → Supabase 조회
    → [] (세션 없음)
  ↓
[4] 전시 B 새 세션 생성
    → createSession(user.id, 전시B)
    → Supabase에 새 세션 생성
    → setCurrentSessionId(새세션ID)
  ↓
[완료] 전시 B에서 새 세션으로 대화 시작
```

---

## 핵심 포인트

1. **로컬 저장:** 처음 대화는 로컬에만 저장 (`currentSessionId = null`)
2. **전시 변경 시:** 이전 전시의 세션이 DB에 저장됨 (`saveFullHistory`에서 세션 자동 생성)
3. **새 전시:** 기존 세션 확인 → 없으면 새 세션 생성
4. **항상 로컬에는 한 세션만:** `clearAllChatHistories()`로 항상 초기화
