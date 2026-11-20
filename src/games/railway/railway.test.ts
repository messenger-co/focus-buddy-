import { describe, expect, it } from "vitest";
import { followRails, makeBoard, neighbor, routes, sockets } from "./railway";
describe("Đường ray đom đóm", () => {
  it.each(routes.map((r, i) => [r.name, i] as const))(
    "%s có đường giải qua đủ đèn bằng cách xoay ray",
    (_, level) => {
      const b = makeBoard(level),
        solve = [...b.initial];
      expect(followRails(b, solve).stop).not.toBe("arrived");
      let cell = b.start,
        enter = 3;
      const expected = [cell],
        exits = [...routes[level].steps].map((c) => "NESW".indexOf(c));
      for (const [step, exit] of [...exits, 1].entries()) {
        let touches = 0;
        while (
          ![enter, exit].every((d) =>
            sockets(b.tiles[cell], solve[cell]).includes(d),
          ) &&
          touches < 4
        ) {
          solve[cell] = (solve[cell] + 1) % 4;
          touches++;
        }
        expect(touches).toBeLessThan(4);
        if (step === exits.length) break;
        cell = neighbor(cell, exit, b.width, b.height);
        expect(cell).toBeGreaterThanOrEqual(0);
        expect(expected).not.toContain(cell);
        expected.push(cell);
        enter = (exit + 2) % 4;
      }
      expect(cell).toBe(b.exit);
      expect(followRails(b, solve)).toMatchObject({
        path: expected,
        stop: "arrived",
      });
      expect(b.lanterns.every((i) => expected.includes(i))).toBe(true);
      expect(new Set(b.lanterns).size).toBe(routes[level].lanterns);
    },
  );
  it("chỉ về đích khi đã đi qua các đèn", () => {
    const b = makeBoard(0);
    for (let cell = b.start; cell < b.start + b.width; cell++)
      b.tiles[cell] = "straight";
    b.exit = b.start + b.width - 1;
    b.lanterns = [0];
    expect(
      followRails(
        b,
        b.tiles.map(() => 1),
      ),
    ).toMatchObject({ stop: "missed", fault: 0 });
  });
});
