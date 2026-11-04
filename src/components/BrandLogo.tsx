import { Image } from 'expo-image';
import type { StyleProp, ImageStyle } from 'react-native';

const BRAND_ASSETS = {
  compact: require('../../assets/branding/mercadon-logo-compact.png'),
  horizontal: require('../../assets/branding/mercadon-logo-horizontal.png'),
} as const;

type BrandLogoProps = {
  variant: keyof typeof BRAND_ASSETS;
  style?: StyleProp<ImageStyle>;
};

export function BrandLogo({ variant, style }: BrandLogoProps) {
  return (
    <Image
      accessibilityLabel="MercadON"
      accessible
      contentFit="contain"
      source={BRAND_ASSETS[variant]}
      style={style}
    />
  );
}
