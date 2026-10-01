import { Component, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class DatabaseErrorBoundary extends Component<Props, State> {
  state: State = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error): void {
    console.error('Falha ao carregar o MercadON:', error);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>
            Não foi possível iniciar o MercadON
          </Text>
          <Text style={styles.description}>
            Houve um problema na inicialização. Feche e abra o
            aplicativo novamente. Seus dados não foram apagados.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
  },
});