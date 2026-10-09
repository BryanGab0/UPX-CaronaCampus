import { describe, it, expect } from "vitest";
import { base64UrlParaBytes } from "./push";

describe("base64UrlParaBytes", () => {
  it("converte base64 de URL (com - e _ e sem =) em bytes", () => {
    // bytes 251, 255, 191 -> base64 padrão "+/+/" -> base64 de URL "-_-_"
    expect([...base64UrlParaBytes("-_-_")]).toEqual([251, 255, 191]);
  });
  it("aceita tamanhos que precisariam de preenchimento", () => {
    expect([...base64UrlParaBytes("QQ")]).toEqual([65]); // "A"
    expect([...base64UrlParaBytes("QUI")]).toEqual([65, 66]); // "AB"
  });
});
