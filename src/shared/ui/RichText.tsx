import { type FC, Fragment, type ReactNode } from "react";

import type { RichTextDoc, RichTextNode } from "@/shared/lib/rich-text";
import { cn } from "@/shared/lib/utils";

const renderChildren = (node: RichTextNode) => node.content?.map(renderNode);

const renderNode = (node: RichTextNode, index: number): ReactNode => {
  switch (node.type) {
    case "text":
      return node.marks?.some((mark) => mark.type === "bold") ? (
        <strong key={index} className="font-semibold in-data-[size=post]:font-bold in-data-[size=post]:text-foreground">
          {node.text}
        </strong>
      ) : (
        <Fragment key={index}>{node.text}</Fragment>
      );
    case "paragraph":
      return <p key={index}>{renderChildren(node)}</p>;
    case "bulletList":
      return (
        <ul key={index} className="flex flex-col gap-2.5">
          {renderChildren(node)}
        </ul>
      );
    case "listItem":
      return (
        <li
          key={index}
          className="flex gap-2.5 text-foreground-soft before:mt-2 before:size-2 before:shrink-0 before:rounded-[2px] before:bg-deco lg:gap-3 in-data-[size=post]:before:mt-[0.62em] in-data-[size=post]:before:rounded-full in-data-[size=post]:before:bg-brand"
        >
          {renderChildren(node)}
        </li>
      );
    default:
      // A node added to the editor later still shows its text, just without its own styling.
      return <Fragment key={index}>{renderChildren(node)}</Fragment>;
  }
};

interface RichTextProps {
  doc: RichTextDoc;
  /**
   * `"post"`: the article sizes of the post page's handoff (18 / 1.75 from `lg`, 16.5 / 1.7 below, 22 px between
   * blocks, bold in `foreground`, round `brand` list markers). The default is the size every other page uses.
   */
  size?: "default" | "post";
  /** Type sizes of the block; spacing between the document's blocks comes from here. */
  className?: string;
}

/**
 * Renders a stored Tiptap document on the server, with no editor code in the bundle.
 * Elements are built by React from a known list of nodes, so stored text can never become markup.
 */
export const RichText: FC<RichTextProps> = (props) => {
  const { doc, size = "default", className } = props;
  const isPost = size === "post";

  return (
    <div
      data-size={isPost ? "post" : undefined}
      className={cn(
        "flex min-w-0 flex-col gap-3.5 lg:gap-4",
        isPost && "gap-[22px] text-[16.5px] leading-[1.7] text-foreground-soft lg:gap-[22px] lg:text-lg lg:leading-[1.75]",
        className,
      )}
    >
      {doc.content.map(renderNode)}
    </div>
  );
};
