module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Expo SDK 49+는 기본적으로 .env 파일의 EXPO_PUBLIC_* 변수를 자동으로 읽습니다
    // 추가 플러그인 없이 process.env.EXPO_PUBLIC_*로 접근 가능
  };
};
