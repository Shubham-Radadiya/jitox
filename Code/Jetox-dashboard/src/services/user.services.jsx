import { usersApi } from "./api";

export const userService = {
  getAll: () => usersApi.getAll(),
  getById: (id) => usersApi.getById(id),
  create: (data) => usersApi.create(data),
  update: (id, data) => usersApi.update(id, data),
  delete: (id) => usersApi.delete(id),
};
