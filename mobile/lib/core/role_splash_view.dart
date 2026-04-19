import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../features/auth/providers/auth_provider.dart';
import '../features/auth/views/login_view.dart';

class RoleSplashView extends ConsumerWidget {
  const RoleSplashView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return authState.when(
      data: (user) {
        if (user == null) {
          return const LoginView();
        }

        // Fetch meta data role
        final role = user.userMetadata?['role'] ?? 'buyer';
        
        // Return appropriate dashboard based on role
        return DashboardPlaceholder(role: role);
      },
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (err, stack) => Scaffold(
        body: Center(child: Text('Error: $err')),
      ),
    );
  }
}

class DashboardPlaceholder extends StatelessWidget {
  final String role;
  const DashboardPlaceholder({super.key, required this.role});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('${role[0].toUpperCase()}${role.substring(1)} Dashboard'),
        actions: [
          Consumer(builder: (context, ref, child) {
            return IconButton(
              icon: const Icon(Icons.logout),
              onPressed: () => ref.read(authProvider.notifier).signOut(),
            );
          }),
        ],
      ),
      body: Center(
        child: Text('Welcome to your $role dashboard!\nBuild in progress.'),
      ),
    );
  }
}
