import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Discussion from "./Discussion";

const stubs = vi.hoisted(() => ({
  rpc: vi.fn(),
  onAuthChange: vi.fn(),
  channel: vi.fn(),
  removeChannel: vi.fn(),
}));

vi.mock("./room", async (original) => {
  const real = await original<typeof import("./room")>();
  return { ...real, rpc: stubs.rpc };
});
vi.mock("../cloud", () => ({
  supabase: {
    auth: { onAuthStateChange: stubs.onAuthChange },
    channel: stubs.channel,
    removeChannel: stubs.removeChannel,
  },
}));

const topics = [
  { id: "tu-hoc", name: "Bàn tự học", description: "Đặt mục tiêu học.", private: false },
];
const disabled = {
  enabled: false, verified: false, moderator: false, rooms: topics,
};
const requiresLogin = {
  enabled: true, verified: false, moderator: false, rooms: topics,
};
const active = {
  enabled: true, verified: true, moderator: false, rooms: topics,
};

beforeEach(() => {
  stubs.rpc.mockReset();
  stubs.onAuthChange.mockReset();
  stubs.channel.mockReset();
  stubs.removeChannel.mockReset();
  stubs.onAuthChange.mockImplementation(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  }));
  stubs.channel.mockImplementation(() => {
    const fake = {
      on: vi.fn(),
      subscribe: vi.fn(),
    };
    fake.on.mockReturnValue(fake);
    fake.subscribe.mockReturnValue(fake);
    return fake;
  });
  stubs.removeChannel.mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("discussion room entry", () => {
  it("allows opening a self-study topic when the moderated server is closed", async () => {
    stubs.rpc.mockResolvedValue(disabled);
    render(<Discussion openAccount={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/Phòng trực tuyến chưa được quản trị viên mở/)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /Vào chủ đề/ }));
    expect(screen.getByRole("heading", { name: "Bàn tự học" })).toBeTruthy();
    expect(screen.getByText(/Tự học trên thiết bị/)).toBeTruthy();
    const draft = screen.getByLabelText("Thử viết câu trả lời của bạn") as HTMLTextAreaElement;
    fireEvent.change(draft, { target: { value: "Ý tưởng của mình" } });
    expect(draft.value).toBe("Ý tưởng của mình");
    expect(stubs.rpc.mock.calls.some(([name]) => name === "fb_room_join")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Tất cả chủ đề" }));
    expect(screen.getByRole("heading", { name: "Phòng thảo luận" })).toBeTruthy();
  });

  it("shows email sign-in rather than silently rejecting unverified users", async () => {
    const openAccount = vi.fn();
    stubs.rpc.mockResolvedValue(requiresLogin);
    render(<Discussion openAccount={openAccount} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Đăng nhập để thảo luận" })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /Vào chủ đề/ }));
    expect(screen.getByText(/Cần xác minh email để thảo luận trực tuyến/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập để thảo luận" }));
    expect(openAccount).toHaveBeenCalledTimes(1);
    expect(stubs.rpc.mock.calls.some(([name]) => name === "fb_room_join")).toBe(false);
  });

  it("lets verified users enter the real moderated room", async () => {
    stubs.rpc.mockImplementation(async (name: string) => {
      if (name === "fb_community_status") return active;
      if (name === "fb_room_join") return {
        alias: "Mây Nhỏ", buddy: "fox", theme: "forest", interest: "",
      };
      if (name === "fb_room_feed") return { online: 1, messages: [] };
      return null;
    });
    render(<Discussion openAccount={vi.fn()} />);
    await waitFor(() => expect(screen.getByRole("button", { name: /Vào phòng/ })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /Vào phòng/ }));
    await waitFor(() => expect(stubs.rpc.mock.calls.some(([name]) => name === "fb_room_join")).toBe(true));
    await waitFor(() => expect(screen.getByText(/người vừa hoạt động/)).toBeTruthy());
    expect(screen.getByLabelText("Câu hỏi hoặc ý kiến học tập")).toBeTruthy();
    expect(stubs.channel).toHaveBeenCalled();
  });

  it("keeps topics usable and explains missing database migrations", async () => {
    stubs.rpc.mockRejectedValueOnce(new Error(
      "Máy chủ chưa cài đặt đầy đủ phòng thảo luận. Quản trị viên cần áp dụng các migration Supabase theo tài liệu dự án.",
    )).mockResolvedValue(disabled);
    render(<Discussion openAccount={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/Máy chủ chưa cài đặt đầy đủ/)).toBeTruthy());
    fireEvent.click(screen.getAllByRole("button", { name: /Vào chủ đề/ })[0]);
    expect(screen.getByRole("heading", { name: "Bàn tự học" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Thử kết nối lại" }));
    await waitFor(() => expect(stubs.rpc).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByText(/Phòng thảo luận trực tuyến chưa mở/)).toBeTruthy());
  });
});
