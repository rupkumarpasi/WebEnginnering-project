import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createUser, fetchUser, fetchUsers } from '../api/users.js';

export const useUsers = () =>
  useQuery({ queryKey: ['users'], queryFn: fetchUsers });

export const useUser = (id) =>
  useQuery({
    queryKey: ['users', id],
    queryFn: () => fetchUser(id),
    enabled: Boolean(id),
  });

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: (created) => {
      queryClient.setQueryData(['users'], (oldUsers = []) => [...oldUsers, created]);
    },
  });
}
