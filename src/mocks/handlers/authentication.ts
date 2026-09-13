import { http, HttpResponse } from "msw";
import type { LoginInput, RegisterInput } from "@/types";
import { mockDatabase } from "../db";
import { applyNetworkConditions, createApiErrorResponse, getSessionFromRequest } from "./shared";

const sessionDurationMs = 30 * 60000;

const createSessionToken = () => {
  return `tok_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
};

const createFakePasswordHash = (password: string) => {
  return `sim_${btoa(password).split("").reverse().join("")}`;
};

const authenticationHandlers = [
  http.post("/api/auth/register", async ({ request }) => {
    await applyNetworkConditions();

    const registerInput = (await request.json()) as Partial<RegisterInput>;
    const fieldErrors: { field: string; message: string }[] = [];

    if (!registerInput.email?.includes("@")) {
      fieldErrors.push({ field: "email", message: "E-mail inválido." });
    }

    if (!registerInput.username || registerInput.username.length < 3) {
      fieldErrors.push({
        field: "username",
        message: "Nome de usuário deve ter ao menos 3 caracteres.",
      });
    }

    if (!registerInput.password || registerInput.password.length < 6) {
      fieldErrors.push({
        field: "password",
        message: "Senha deve ter ao menos 6 caracteres.",
      });
    }

    if (registerInput.confirmPassword !== registerInput.password) {
      fieldErrors.push({
        field: "confirmPassword",
        message: "As senhas não coincidem.",
      });
    }

    if (fieldErrors.length > 0) {
      return createApiErrorResponse("VALIDATION_ERROR", "Verifique os campos do formulário.", fieldErrors);
    }

    const existingUser = Object.values(mockDatabase.state.usersById).find(
      (userFixture) => userFixture.email === registerInput.email || userFixture.username === registerInput.username,
    );

    if (existingUser) {
      const conflictField = existingUser.email === registerInput.email ? "email" : "username";
      const conflictMessage = conflictField === "email" ? "E-mail já cadastrado." : "Nome de usuário indisponível.";

      return createApiErrorResponse("CONFLICT", "Já existe uma conta com esses dados.", [{ field: conflictField, message: conflictMessage }]);
    }

    const userId = `user-${Math.random().toString(36).slice(2, 8)}`;
    mockDatabase.state.usersById[userId] = {
      id: userId,
      email: registerInput.email!,
      username: registerInput.username!,
      passwordHash: createFakePasswordHash(registerInput.password!),
      avatar: null,
    };

    const sessionToken = createSessionToken();
    const sessionExpiresAt = new Date(Date.now() + sessionDurationMs).toISOString();

    mockDatabase.state.sessionsByToken[sessionToken] = {
      token: sessionToken,
      userId,
      expiresAt: sessionExpiresAt,
    };

    mockDatabase.persist();

    return HttpResponse.json(
      {
        user: mockDatabase.getPublicUser(userId),
        token: sessionToken,
        expiresAt: sessionExpiresAt,
      },

      { status: 201 },
    );
  }),

  http.post("/api/auth/login", async ({ request }) => {
    await applyNetworkConditions();

    const loginInput = (await request.json()) as Partial<LoginInput>;
    const matchingUser = Object.values(mockDatabase.state.usersById).find((userFixture) => userFixture.email === loginInput.email);

    if (!matchingUser || matchingUser.passwordHash !== createFakePasswordHash(loginInput.password ?? "")) {
      return createApiErrorResponse("VALIDATION_ERROR", "E-mail ou senha incorretos.", [
        { field: "password", message: "E-mail ou senha incorretos." },
      ]);
    }

    const sessionToken = createSessionToken();
    const sessionExpiresAt = new Date(Date.now() + sessionDurationMs).toISOString();

    mockDatabase.state.sessionsByToken[sessionToken] = {
      token: sessionToken,
      userId: matchingUser.id,
      expiresAt: sessionExpiresAt,
    };

    /* - O login mescla o carrinho visitante ao carrinho autenticado antes de persistir a sessão. - */

    const guestOwnerKey = request.headers.get("x-guest-id");
    if (guestOwnerKey) {
      mockDatabase.mergeGuestCartIntoUser(guestOwnerKey, matchingUser.id);
    }

    mockDatabase.persist();

    return HttpResponse.json({
      user: mockDatabase.getPublicUser(matchingUser.id),
      token: sessionToken,
      expiresAt: sessionExpiresAt,
    });
  }),

  http.get("/api/session", async ({ request }) => {
    await applyNetworkConditions();

    const storedSession = getSessionFromRequest(request);
    if (!storedSession) {
      return createApiErrorResponse("SESSION_EXPIRED", "Sessão expirada ou inexistente.");
    }

    return HttpResponse.json({
      user: mockDatabase.getPublicUser(storedSession.userId),
      expiresAt: storedSession.expiresAt,
    });
  }),

  http.post("/api/auth/logout", async ({ request }) => {
    await applyNetworkConditions();

    const authorizationHeader = request.headers.get("authorization");
    const sessionToken = authorizationHeader?.replace("Bearer ", "");

    if (sessionToken) {
      delete mockDatabase.state.sessionsByToken[sessionToken];
    }

    mockDatabase.persist();

    return HttpResponse.json({ ok: true });
  }),
];

export { authenticationHandlers };
