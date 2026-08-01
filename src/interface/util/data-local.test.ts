import { describe, expect, it } from "vitest";
import { formatarDataLocalISO, interpretarDataLocal } from "./data-local";

describe("data local", () => {
  it("não desloca uma data sem horário para o dia anterior", () => {
    const data = interpretarDataLocal("2026-07-27");

    expect(data.getFullYear()).toBe(2026);
    expect(data.getMonth()).toBe(6);
    expect(data.getDate()).toBe(27);
  });

  it("preserva a data local ao gerar YYYY-MM-DD", () => {
    const data = new Date(2026, 6, 27, 23, 30);

    expect(formatarDataLocalISO(data)).toBe("2026-07-27");
  });

  it("continua interpretando timestamps completos como instantes", () => {
    const timestamp = "2026-07-27T23:53:00.000Z";

    expect(interpretarDataLocal(timestamp).getTime()).toBe(new Date(timestamp).getTime());
  });
});
