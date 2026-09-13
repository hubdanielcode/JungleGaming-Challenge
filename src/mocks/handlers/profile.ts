import { http, HttpResponse } from "msw";
import type { AvatarUpdateInput, PasswordChangeInput, ProfileUpdateInput } from "@/types";
import { mockDatabase } from "../db";
import { applyNetworkConditions, createApiErrorResponse, getSessionFromRequest } from "./shared";

const createFakePasswordHash = (password: string) => {
  return `sim_${btoa(password).split("").reverse().join("")}`;
};

const profileHandlers = [
  http.get("/api/profile", async ({ request }) => {
    await applyNetworkConditions();

    const storedSession = getSessionFromRequest(request);

    if (!storedSession) {
      return createApiErrorResponse("UNAUTHENTICATED", "Faça login para ver seu perfil.");
    }

    return HttpResponse.json(mockDatabase.getPublicUser(storedSession.userId));
  }),

  http.patch("/api/profile", async ({ request }) => {
    await applyNetworkConditions();

    const storedSession = getSessionFromRequest(request);

    if (!storedSession) {
      return createApiErrorResponse("UNAUTHENTICATED", "Faça login para editar seu perfil.");
    }

    const profileUpdateInput = (await request.json()) as ProfileUpdateInput;
    const currentUser = mockDatabase.state.usersById[storedSession.userId];

    if (profileUpdateInput.email && profileUpdateInput.email !== currentUser.email) {
      const emailAlreadyInUse = Object.values(mockDatabase.state.usersById).some(
        (userFixture) => userFixture.id !== currentUser.id && userFixture.email === profileUpdateInput.email,
      );

      if (emailAlreadyInUse) {
        return createApiErrorResponse("CONFLICT", "E-mail já está em uso.", [{ field: "email", message: "E-mail já está em uso." }]);
      }

      currentUser.email = profileUpdateInput.email;
    }

    if (profileUpdateInput.username && profileUpdateInput.username !== currentUser.username) {
      if (profileUpdateInput.username.length < 3) {
        return createApiErrorResponse("VALIDATION_ERROR", "Nome de usuário inválido.", [
          {
            field: "username",
            message: "Nome de usuário deve ter ao menos 3 caracteres.",
          },
        ]);
      }

      const usernameAlreadyInUse = Object.values(mockDatabase.state.usersById).some(
        (userFixture) => userFixture.id !== currentUser.id && userFixture.username === profileUpdateInput.username,
      );

      if (usernameAlreadyInUse) {
        return createApiErrorResponse("CONFLICT", "Nome de usuário indisponível.", [{ field: "username", message: "Nome de usuário indisponível." }]);
      }

      currentUser.username = profileUpdateInput.username;
    }

    mockDatabase.persist();

    return HttpResponse.json(mockDatabase.getPublicUser(currentUser.id));
  }),

  http.put("/api/profile/avatar", async ({ request }) => {
    await applyNetworkConditions();

    const storedSession = getSessionFromRequest(request);

    if (!storedSession) {
      return createApiErrorResponse("UNAUTHENTICATED", "Faça login para editar seu perfil.");
    }

    const avatarUpdateInput = (await request.json()) as AvatarUpdateInput;
    mockDatabase.state.usersById[storedSession.userId].avatar = avatarUpdateInput.avatarDataUrl;

    mockDatabase.persist();
    return HttpResponse.json(mockDatabase.getPublicUser(storedSession.userId));
  }),

  http.post("/api/profile/password", async ({ request }) => {
    await applyNetworkConditions();

    const storedSession = getSessionFromRequest(request);

    if (!storedSession) {
      return createApiErrorResponse("UNAUTHENTICATED", "Faça login para alterar a senha.");
    }

    const passwordChangeInput = (await request.json()) as PasswordChangeInput;
    const currentUser = mockDatabase.state.usersById[storedSession.userId];

    if (currentUser.passwordHash !== createFakePasswordHash(passwordChangeInput.currentPassword)) {
      return createApiErrorResponse("VALIDATION_ERROR", "Senha atual incorreta.", [{ field: "currentPassword", message: "Senha atual incorreta." }]);
    }

    if (passwordChangeInput.newPassword.length < 6) {
      return createApiErrorResponse("VALIDATION_ERROR", "A nova senha deve ter ao menos 6 caracteres.", [
        {
          field: "newPassword",
          message: "A nova senha deve ter ao menos 6 caracteres.",
        },
      ]);
    }

    currentUser.passwordHash = createFakePasswordHash(passwordChangeInput.newPassword);
    mockDatabase.persist();

    return HttpResponse.json({ ok: true });
  }),
];

export { profileHandlers };
