import { db } from '@/lib/db';
import { NotFoundError, ConflictError } from '@/utils/errors';
import type { UpdateUserInput } from './users.schema';

export async function getUserById(id: string) {
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}

export async function updateUser(id: string, data: UpdateUserInput) {
  if (data.email) {
    const existingUser = await db.user.findFirst({
      where: {
        email: data.email,
        NOT: { id },
      },
    });

    if (existingUser) {
      throw new ConflictError('Email already in use');
    }
  }

  const user = await db.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

export async function deleteUser(id: string) {
  await db.user.delete({
    where: { id },
  });
}
