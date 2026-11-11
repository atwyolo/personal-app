import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Image } from "./Image";

const src = "https://example.com/photo.jpg";

describe("Image", () => {
  it("renders the image with its alt text", () => {
    render(<Image src={src} alt="Photo" sizes="100vw" />);

    expect(screen.getByRole("img", { name: "Photo" }).tagName).toBe("IMG");
  });

  it("loads a priority image at once with a high fetch priority", () => {
    render(<Image src="https://blob.example/a.jpg" alt="A" sizes="100vw" priority />);

    const image = screen.getByRole("img", { name: "A" });
    expect(image).toHaveAttribute("fetchpriority", "high");
    expect(image).toHaveAttribute("loading", "eager");
  });

  it("loads an ordinary image lazily", () => {
    render(<Image src="https://blob.example/b.jpg" alt="B" sizes="100vw" />);

    expect(screen.getByRole("img", { name: "B" })).toHaveAttribute("loading", "lazy");
  });

  it("shows a labelled placeholder when there is no source", () => {
    render(<Image src={null} alt="Photo" sizes="100vw" />);

    expect(screen.getByRole("img", { name: "Photo" }).tagName).toBe("DIV");
  });

  it("replaces the image with the placeholder when it fails to load", () => {
    render(<Image src={src} alt="Photo" sizes="100vw" />);

    fireEvent.error(screen.getByRole("img", { name: "Photo" }));

    expect(screen.getByRole("img", { name: "Photo" }).tagName).toBe("DIV");
  });

  it("tries again when the source changes after a failure", () => {
    const { rerender } = render(<Image src={src} alt="Photo" sizes="100vw" />);
    fireEvent.error(screen.getByRole("img", { name: "Photo" }));

    rerender(<Image src="https://example.com/new.jpg" alt="Photo" sizes="100vw" />);

    expect(screen.getByRole("img", { name: "Photo" }).tagName).toBe("IMG");
  });

  it("leaves the placeholder without a frame by default", () => {
    render(<Image src={null} alt="Photo" sizes="100vw" />);

    expect(screen.getByRole("img", { name: "Photo" })).not.toHaveClass("border-dashed");
  });

  it("gives a framed placeholder the dashed border and the radius", () => {
    render(<Image src={null} alt="Photo" sizes="100vw" framed />);

    expect(screen.getByRole("img", { name: "Photo" })).toHaveClass("border-dashed", "rounded-[14px]");
  });

  it("rounds a framed image and keeps its own classes", () => {
    render(<Image src={src} alt="Photo" sizes="100vw" className="object-cover" framed />);

    expect(screen.getByRole("img", { name: "Photo" })).toHaveClass("rounded-[14px]", "object-cover");
  });
});
