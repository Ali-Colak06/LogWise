module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated v3 (SDK 54): plugin paketin kendi içindedir.
      // (Reanimated v4'te 'react-native-worklets/plugin' ayrı pakete taşındı; SDK 56+'da geçecek.)
      // MUTLAKA plugin listesinin SON elemanı olmalı.
      'react-native-reanimated/plugin',
    ],
  };
};
