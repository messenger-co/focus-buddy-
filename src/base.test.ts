import { describe, expect, it } from "vitest";
import { githubBase } from "./base";
describe("Đường dẫn GitHub Pages", () => {
  it("dùng tên kho cho trang dự án", () =>
    expect(githubBase("ban/focus-buddy")).toBe("/focus-buddy/"));
  it("dùng đường dẫn gốc cho trang cá nhân", () =>
    expect(githubBase("Ban/Ban.github.io")).toBe("/"));
  it("chạy tại gốc trên máy cá nhân", () => expect(githubBase()).toBe("/"));
  it("cho phép ghi đè cho tên miền riêng hoặc thư mục khác", () => {
    expect(githubBase("ban/focus-buddy", "/")).toBe("/");
    expect(githubBase("ban/focus-buddy", "lop-hoc")).toBe("/lop-hoc/");
  });
});
