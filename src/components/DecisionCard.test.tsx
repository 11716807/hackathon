import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DecisionCard } from "./DecisionCard";

describe("DecisionCard", () => {
  it("renders a HOLD gate in industrial language", () => {
    render(
      <DecisionCard
        decision="HOLD"
        summary="2 must-fix: Label does not match the work order"
        locale="en"
      />,
    );
    expect(screen.getByTestId("decision-card")).toHaveTextContent("HOLD");
    expect(screen.getByText("Not clear to run")).toBeInTheDocument();
  });

  it("renders CLEAR", () => {
    render(
      <DecisionCard
        decision="CLEAR"
        summary="Clear to run. All five frames match."
        locale="en"
      />,
    );
    expect(screen.getByText("Clear to run")).toBeInTheDocument();
  });
});
