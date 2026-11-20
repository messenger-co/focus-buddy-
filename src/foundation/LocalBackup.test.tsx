import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import LocalBackup from "./LocalBackup";
import { exportLocalBackup } from "./localBackup";

const fileFrom=(content:string,name="backup.json")=>{
  const file=new File([content],name,{type:"application/json"});
  Object.defineProperty(file,"text",{value:async()=>content});
  return file;
};
beforeEach(()=>{localStorage.clear();});
afterEach(()=>{cleanup();vi.restoreAllMocks();});

describe("local backup transfer UI",()=>{
  it("shows privacy consent and a download button without auto-exporting chat",()=>{
    render(<LocalBackup/>);
    expect(screen.getByText(/Không xuất khóa đăng nhập/)).toBeTruthy();
    expect(screen.getByRole("checkbox")).toBeTruthy();
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(false);
    expect(screen.getByRole("button",{name:/Tải bản sao lưu/})).toBeTruthy();
    expect(screen.queryByText(/mục có thể khôi phục/)).toBeNull();
  });
  it("previews real slash-based game scores and shows overwrite count",async()=>{
    localStorage.setItem("focus-buddy-level-v1/hang-bang/2",'{"count":2,"seconds":9}');
    const backup=exportLocalBackup(localStorage);
    render(<LocalBackup/>);
    const input=screen.getByLabelText("Tệp sao lưu JSON") as HTMLInputElement;
    fireEvent.change(input,{target:{files:[fileFrom(JSON.stringify(backup))]}});
    await waitFor(()=>expect(screen.getByText(/1 mục có thể khôi phục/)).toBeTruthy());
    expect(screen.getByText(/1 mục sẽ thay thế/)).toBeTruthy();
    expect(screen.getByText(/Trò chơi và sáng tạo · 1/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Xem xác nhận khôi phục"}));
    expect(screen.getByRole("group",{name:"Xác nhận ghi đè dữ liệu"})).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Hủy"}));
    expect(screen.queryByRole("group",{name:"Xác nhận ghi đè dữ liệu"})).toBeNull();
  });
  it("does not show AI chat in import selection until user opts in",async()=>{
    localStorage.setItem("focus-buddy-demo-v2","demo");
    localStorage.setItem("focus-buddy-assistant-history-v1","saved-chat");
    const source=JSON.stringify(exportLocalBackup(localStorage,true));
    localStorage.clear();
    render(<LocalBackup/>);
    fireEvent.change(screen.getByLabelText("Tệp sao lưu JSON"),{
      target:{files:[fileFrom(source)]},
    });
    await waitFor(()=>expect(screen.getByText(/1 mục có thể khôi phục/)).toBeTruthy());
    expect(screen.getByText(/Lịch sử AI \(tùy chọn\) · 0/)).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox"));
    await waitFor(()=>expect(screen.getByText(/2 mục có thể khôi phục/)).toBeTruthy());
    expect(screen.getByText(/Lịch sử AI \(tùy chọn\) · 1/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Xem xác nhận khôi phục"}));
    fireEvent.click(screen.getByRole("checkbox"));
    expect(screen.queryByRole("group",{name:"Xác nhận ghi đè dữ liệu"})).toBeNull();
  });
  it("rejects an invalid file without modifying device storage",async()=>{
    localStorage.setItem("focus-buddy-journal-v3",'{"2026-11-20":"note"}');
    render(<LocalBackup/>);
    fireEvent.change(screen.getByLabelText("Tệp sao lưu JSON"),{
      target:{files:[fileFrom("definitely-not-json")]},
    });
    await waitFor(()=>expect(screen.getByRole("alert").textContent).toContain("JSON"));
    expect(localStorage.getItem("focus-buddy-journal-v3")).toContain("note");
    expect(screen.queryByRole("button",{name:"Xác nhận khôi phục"})).toBeNull();
  });
});
