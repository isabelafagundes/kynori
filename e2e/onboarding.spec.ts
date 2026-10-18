import { test, expect, STORAGE_KEYS, lerArmazenado } from "./apoio/teste";
import type { Usuario } from "../src/domain/usuario";

/* Primeira execução: quem instala o app pela loja cai exatamente aqui, e é o
   único fluxo que não dá pra consertar com um update sem perder o usuário. */

test.use({ semearEstado: { usuario: null, dados: { programas: [], fichas: [] } } });

test("cria o perfil no onboarding e chega na home", async ({ page }) => {
  await page.goto("/#/treinos");

  await expect(page.getByRole("button", { name: "Bora começar" })).toBeVisible();
  await page.getByRole("button", { name: "Bora começar" }).click();

  // Perfil
  await page.getByPlaceholder("Seu nome").fill("Isa");
  await page.getByRole("button", { name: "Selecionar avatar 🦊" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();

  // Tema
  await page.getByRole("button", { name: "Continuar" }).click();

  // Meta semanal
  await page.getByRole("button", { name: "Continuar" }).click();

  // Contrato do tutorial: a spec cobre o wizard, não o tutorial guiado.
  await page.getByRole("button", { name: "Sei me virar, pular tutorial" }).click();

  await expect(page.getByRole("heading", { name: /Isa/ }).first()).toBeVisible();

  const usuario = await lerArmazenado<Usuario>(page, STORAGE_KEYS.USUARIO);
  expect(usuario).toMatchObject({ nome: "Isa", avatarEmoji: "🦊" });
});

test("não repete o onboarding depois de recarregar", async ({ page }) => {
  await page.goto("/#/treinos");
  await page.getByRole("button", { name: "Bora começar" }).click();
  await page.getByPlaceholder("Seu nome").fill("Isa");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Sei me virar, pular tutorial" }).click();
  await expect(page.getByRole("heading", { name: /Isa/ }).first()).toBeVisible();

  await page.reload();

  await expect(page.getByRole("button", { name: "Bora começar" })).toBeHidden();
  await expect(page.getByRole("heading", { name: /Isa/ }).first()).toBeVisible();
});
