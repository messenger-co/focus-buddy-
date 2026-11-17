import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { HashRouter, MemoryRouter } from "react-router-dom";
import App from "./App";
import { DEMO_STORAGE_KEY } from "./state";

const mount = (path = "/") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
const saved = () => JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) || "{}");

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, "", "/");
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: true,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Trải nghiệm dùng thử bằng tiếng Việt", () => {
  it("mở không cần dịch vụ, điểm danh và lưu bạn đồng hành", async () => {
    mount();
    expect(screen.getByRole("heading", { name: "Chào Mầm Nhỏ," })).toBeTruthy();
    expect(screen.getByText("Lưu trên thiết bị")).toBeTruthy();
    await screen.findByRole("img", { name: /Cáo Mây đang đồng hành/ });
    fireEvent.click(screen.getByRole("button", { name: /Rất vui/ }));
    await waitFor(() => expect(saved().profile.total_xp).toBe(10));
    expect(
      (screen.getByRole("button", { name: /Rất vui/ }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    fireEvent.click(screen.getByRole("link", { name: "Bạn đồng hành" }));
    fireEvent.click(await screen.findByRole("button", { name: /Mèo Mít/ }));
    await waitFor(() => expect(saved().profile.companion).toBe("cat"));
    fireEvent.click(screen.getByRole("tab", { name: "Phong cách" }));
    fireEvent.click(screen.getByRole("button", { name: "Tím hoa cà" }));
    await waitFor(() => expect(saved().profile.color).toBe("lavender"));
    fireEvent.click(screen.getByRole("button", { name: "Nghỉ ngơi một chút" }));
    expect(
      screen.getByRole("img", { name: "Mèo Mít đang nghỉ ngơi" }),
    ).toBeTruthy();
  });

  it("chấm bài qua giao diện và chỉ nhận thưởng lần đầu", async () => {
    mount("/nhiem-vu");
    fireEvent.click(
      screen.getByRole("button", { name: /01.*Khám phá quy luật/ }),
    );
    let dialog = screen.getByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Đáp án C: 16" }),
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Kiểm tra câu trả lời" }),
    );
    await waitFor(() => expect(saved().profile.total_xp).toBe(30));
    expect(await within(dialog).findByText("Đúng rồi! +30 điểm")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Hoàn tất" }));
    fireEvent.click(
      screen.getByRole("button", { name: /01.*Khám phá quy luật/ }),
    );
    dialog = screen.getByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Đáp án C: 16" }),
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Kiểm tra câu trả lời" }),
    );
    expect(
      await within(dialog).findByText(
        "Đúng rồi! Bạn đã nhận điểm cho bài này.",
      ),
    ).toBeTruthy();
    expect(saved().profile.total_xp).toBe(30);
  });

  it("khôi phục đồng hồ sau tải lại và hoàn thành đúng 20 phút", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const start = Date.parse("2026-11-17T10:00:00Z");
    vi.setSystemTime(start);
    let app = mount("/tap-trung");
    fireEvent.click(
      screen.getByRole("button", { name: "Bắt đầu phiên tập trung" }),
    );
    await waitFor(() => expect(saved().focus_sessions).toHaveLength(1));
    await screen.findByRole("img", { name: "Cáo Mây cùng bạn tập trung" });
    app.unmount();
    vi.setSystemTime(start + 5 * 60_000);
    app = mount("/tap-trung");
    expect(screen.getByRole("timer").textContent).toBe("15:00");
    expect(saved().profile.total_xp).toBe(0);
    app.unmount();
    vi.setSystemTime(start + 20 * 60_000);
    app = mount("/tap-trung");
    await waitFor(() => expect(saved().profile.total_xp).toBe(50));
    expect(saved().focus_sessions[0].status).toBe("completed");
    app.unmount();
    mount("/tap-trung");
    expect(saved().profile.total_xp).toBe(50);
  });

  it("bỏ bảng xếp hạng và ghi rõ câu trả lời soạn sẵn", async () => {
    mount();
    expect(
      screen.queryByRole("link", { name: "Cùng nhau tiến bộ" }),
    ).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Trò chuyện cùng bạn" }),
    );
    expect(screen.getByText(/Câu trả lời được soạn sẵn/)).toBeTruthy();
    fireEvent.change(
      screen.getByRole("textbox", { name: "Tin nhắn cho bạn đồng hành" }),
      { target: { value: "Mình hơi mệt" } },
    );
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Gửi tin nhắn" })),
    );
    expect(screen.getByText(/Mệt một chút cũng không sao/)).toBeTruthy();
  });

  it("mở và tải lại đường dẫn HashRouter trong thư mục kho GitHub", async () => {
    window.history.replaceState({}, "", "/focus-buddy-/#/ban-dong-hanh");
    let app = render(
      <HashRouter>
        <App />
      </HashRouter>,
    );
    expect(
      await screen.findByRole("heading", { name: "Gặp bạn đồng hành của bạn" }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Nhiệm vụ học tập" })
        .getAttribute("href"),
    ).toBe("#/nhiem-vu");
    app.unmount();
    app = render(
      <HashRouter>
        <App />
      </HashRouter>,
    );
    expect(
      await screen.findByRole("heading", { name: "Gặp bạn đồng hành của bạn" }),
    ).toBeTruthy();
    await screen.findByRole("img", { name: "Cáo Mây đang đồng hành cùng bạn" });
    app.unmount();
    window.history.replaceState({}, "", "/");
  });

  it("lưu tên, phụ kiện và khung cảnh mới mà không đổi điểm", async () => {
    let app = mount("/ban-dong-hanh");
    fireEvent.click(await screen.findByRole("button", { name: /Rồng Đậu/ }));
    await waitFor(() => expect(saved().profile.companion).toBe("dragon"));
    fireEvent.change(
      screen.getByRole("textbox", { name: "Đặt một cái tên thật riêng" }),
      { target: { value: "Đậu Xanh" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Lưu tên" }));
    await waitFor(() => expect(saved().profile.buddy_name).toBe("Đậu Xanh"));
    fireEvent.keyDown(screen.getByRole("tab", { name: "Bạn nhỏ" }), {
      key: "ArrowRight",
    });
    expect(document.activeElement).toBe(
      screen.getByRole("tab", { name: "Phong cách" }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Vương miện/ }));
    await waitFor(() => expect(saved().profile.accessory).toBe("crown"));
    fireEvent.click(screen.getByRole("tab", { name: "Không gian" }));
    fireEvent.click(screen.getByRole("button", { name: /Ngân hà/ }));
    await waitFor(() => expect(saved().profile.scene).toBe("space"));
    expect(saved().profile.total_xp).toBe(0);
    app.unmount();
    app = mount("/ban-dong-hanh");
    expect(
      await screen.findByRole("heading", { name: "Đậu Xanh" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", { name: /Không gian Ngân hà/ }),
    ).toBeTruthy();
    app.unmount();
  });

  it("tương tác với bạn nhỏ và dừng trò chơi trong phiên tập trung", async () => {
    mount("/ban-dong-hanh");
    fireEvent.click(await screen.findByRole("button", { name: "Ôm một cái" }));
    expect(
      await screen.findByText("Một cái ôm cho bạn, một cái ôm cho mình!"),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Mời bánh" }));
    expect(
      await screen.findByText("Ngon quá! Mình nạp đầy năng lượng rồi."),
    ).toBeTruthy();
    expect(localStorage.getItem(DEMO_STORAGE_KEY)).toBeNull();
    fireEvent.click(screen.getByRole("link", { name: "Giờ tập trung" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Bắt đầu phiên tập trung" }),
    );
    await waitFor(() => expect(saved().focus_sessions).toHaveLength(1));
    fireEvent.click(screen.getByRole("link", { name: "Bạn đồng hành" }));
    const play = await screen.findByRole("button", { name: "Chơi cùng" });
    expect((play as HTMLButtonElement).disabled).toBe(true);
    expect(
      screen.getByText(
        "Các trò chơi tạm nghỉ đến khi phiên tập trung kết thúc.",
      ),
    ).toBeTruthy();
    expect(saved().profile.total_xp).toBe(0);
  });

  it("giữ vị trí nhập khi ứng dụng cập nhật đồng hồ và đóng hộp thoại bằng Escape", async () => {
    mount();
    fireEvent.click(
      screen.getByRole("button", { name: "Cài đặt & tài khoản" }),
    );
    const input = screen.getByRole("textbox", { name: "Biệt danh của bạn" });
    input.focus();
    fireEvent.change(input, { target: { value: "Mây Nhỏ" } });
    await new Promise((resolve) => setTimeout(resolve, 1100));
    expect(document.activeElement).toBe(input);
    fireEvent.click(screen.getByRole("button", { name: "Lưu biệt danh" }));
    await waitFor(() => expect(saved().profile.display_name).toBe("Mây Nhỏ"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
