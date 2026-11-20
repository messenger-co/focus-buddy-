import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import SiteStatus from "./SiteStatus";

const originalWorker=Object.getOwnPropertyDescriptor(navigator,"serviceWorker");
const originalOnline=Object.getOwnPropertyDescriptor(navigator,"onLine");
function connectedWorker() {
  const registration=Object.assign(new EventTarget(),{
    installing:null as EventTarget|null,
    waiting:null as object|null,
  });
  const container=Object.assign(new EventTarget(),{
    controller:{id:"previous"} as object|null,
    getRegistration:vi.fn().mockResolvedValue(registration),
  });
  Object.defineProperty(navigator,"serviceWorker",{configurable:true,value:container});
  Object.defineProperty(navigator,"onLine",{configurable:true,value:true});
  return {registration,container};
}
beforeEach(()=>{
  Object.defineProperty(navigator,"onLine",{configurable:true,value:true});
});
afterEach(()=>{
  cleanup();
  vi.restoreAllMocks();
  if(originalWorker)Object.defineProperty(navigator,"serviceWorker",originalWorker);
  else Reflect.deleteProperty(navigator,"serviceWorker");
  if(originalOnline)Object.defineProperty(navigator,"onLine",originalOnline);
  else Reflect.deleteProperty(navigator,"onLine");
});

describe("service-worker update and offline status",()=>{
  it("keeps the page unchanged until a newer controller actually takes over",async()=>{
    const {container}=connectedWorker();
    render(<SiteStatus/>);
    await waitFor(()=>expect(container.getRegistration).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/Focus Buddy có bản mới/)).toBeNull();
    container.controller={id:"new"};
    act(()=>{container.dispatchEvent(new Event("controllerchange"));});
    await waitFor(()=>expect(screen.getByText(/Focus Buddy có bản mới/)).toBeTruthy());
    expect(screen.getByRole("button",{name:"Tải phiên bản mới"})).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Để cập nhật sau"}));
    expect(screen.queryByText(/Focus Buddy có bản mới/)).toBeNull();
  });
  it("detects an installed waiting worker before controller swap",async()=>{
    const {registration}=connectedWorker();
    render(<SiteStatus/>);
    await waitFor(()=>expect(registration).toBeTruthy());
    const next=Object.assign(new EventTarget(),{state:"installing"});
    registration.installing=next;
    act(()=>{registration.dispatchEvent(new Event("updatefound"));});
    next.state="installed";
    act(()=>{next.dispatchEvent(new Event("statechange"));});
    await waitFor(()=>expect(screen.getByText(/Focus Buddy có bản mới/)).toBeTruthy());
  });
  it("shows the offline notice without reloading or requiring a service worker",()=>{
    Reflect.deleteProperty(navigator,"serviceWorker");
    render(<SiteStatus/>);
    fireEvent(window,new Event("offline"));
    expect(screen.getByText(/Thiết bị đang ngoại tuyến/)).toBeTruthy();
    fireEvent(window,new Event("online"));
    expect(screen.queryByText(/Thiết bị đang ngoại tuyến/)).toBeNull();
  });
  it("shows a recoverable status when worker registration cannot be inspected",async()=>{
    const {container}=connectedWorker();
    container.getRegistration.mockRejectedValueOnce(new Error("blocked"));
    render(<SiteStatus/>);
    await waitFor(()=>expect(screen.getByText(/Chưa kiểm tra được bản cập nhật/)).toBeTruthy());
    fireEvent.click(screen.getByRole("button",{name:"Thử lại"}));
    await waitFor(()=>expect(container.getRegistration).toHaveBeenCalledTimes(2));
    expect(screen.queryByText(/Chưa kiểm tra được bản cập nhật/)).toBeNull();
  });
});
