import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final authProvider = StateNotifierProvider<AuthNotifier, AsyncValue<User?>>((ref) {
  return AuthNotifier();
});

class AuthNotifier extends StateNotifier<AsyncValue<User?>> {
  AuthNotifier() : super(const AsyncValue.loading()) {
    _init();
  }

  final _supabase = Supabase.instance.client;

  void _init() {
    final session = _supabase.auth.currentSession;
    state = AsyncValue.data(session?.user);

    _supabase.auth.onAuthStateChange.listen((data) {
      state = AsyncValue.data(data.user);
    });
  }

  Future<void> signIn(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      await _supabase.auth.signInWithPassword(email: email, password: password);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> signOut() async {
    await _supabase.auth.signOut();
  }
}
