module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@constants': './src/constants',
          '@services': './src/services',
          '@components': './src/components',
          '@store': './src/store',
          '@app-types': './src/types',
          '@assets': './src/assets',
          '@screens': './src/screens',
          '@navigation': './src/navigation',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
