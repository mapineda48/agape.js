import { renderHook } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { createStore } from "./store";
import { useSelector } from "./hooks";
import Decimal from "@utils/data/Decimal";
import DateTime from "@utils/data/DateTime";

describe("useSelector", () => {
  it("should revive special values when selecting state", () => {
    const file = new File(["hello"], "hello.txt", { type: "text/plain" });
    const blob = new Blob(["world"], { type: "text/plain" });
    const decimal = new Decimal("12.34");
    const dateTime = new DateTime("2024-01-01T12:00:00Z");

    const store = createStore({
      profile: {
        avatar: file,
        attachment: blob,
        salary: decimal,
        birthday: dateTime,
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(
      () => useSelector((state: any) => state.profile),
      { wrapper }
    );

    expect(result.current.avatar).toBe(file);
    expect(result.current.attachment).toBe(blob);
    expect(result.current.salary).toBeInstanceOf(Decimal);
    expect(result.current.salary.toString()).toBe(decimal.toString());
    expect(result.current.birthday).toBeInstanceOf(DateTime);
    expect(result.current.birthday.toISOString()).toBe(dateTime.toISOString());
  });
});
