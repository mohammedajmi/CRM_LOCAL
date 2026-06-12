import { Users, Session } from './db';
import type { User } from './types';

const listeners = new Set<(user: User | null) => void>();

export function getCurrentUser(): User | null {
  return Session.get();
}

export function login(emailOrName: string, password: string): User {
  const isEmail = emailOrName.includes('@');
  const user = isEmail
    ? Users.findByEmail(emailOrName)
    : Users.findByName(emailOrName);

  if (!user || user.password !== password) {
    throw new Error('Invalid credentials');
  }

  Session.set(user);
  listeners.forEach(fn => fn(user));
  return user;
}

export function quickLogin(user: User): User {
  return login(user.email, user.password);
}

export function logout(): void {
  Session.clear();
  listeners.forEach(fn => fn(null));
}

export function onAuthChange(fn: (user: User | null) => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
