import { useRef } from "react";
import type { AriaListBoxOptions } from "@react-aria/listbox";
import type { ListState } from "react-stately";
import type { Node } from "@react-types/shared";
import {
  mergeProps,
  useHover,
  useListBox,
  useListBoxSection,
  useOption,
} from "react-aria";
import type { WithRequired } from "@tanstack/react-query";
import cs from "clsx";

interface ListBoxProps extends AriaListBoxOptions<unknown> {
  listBoxRef?: React.RefObject<HTMLUListElement | null>;
  state: ListState<unknown>;
}

interface SectionProps {
  section: Node<unknown>;
  state: ListState<unknown>;
}

interface OptionProps {
  item: Node<unknown>;
  state: ListState<unknown>;
}

const ListboxStyle = cs([
  "w-full",
  "max-h-xs",
  "overflow-auto",
  "bg-slate-100",
  "text-purple",
]);

export function ListBox(props: ListBoxProps) {
  let ref = useRef<HTMLUListElement>(null);

  const propsWithDefaults: WithRequired<ListBoxProps, "listBoxRef"> = {
    ...props,
    listBoxRef: props.listBoxRef ?? ref,
  };

  const { state, listBoxRef } = propsWithDefaults;

  let { listBoxProps } = useListBox(props, state, listBoxRef);

  return (
    <ul {...listBoxProps} ref={listBoxRef} className={ListboxStyle}>
      {[...state.collection].map((item) =>
        item.type === "section" ? (
          <ListBoxSection key={item.key} section={item} state={state} />
        ) : (
          <Option key={item.key} item={item} state={state} />
        ),
      )}
    </ul>
  );
}

function ListBoxSection({ section, state }: SectionProps) {
  let { itemProps, headingProps, groupProps } = useListBoxSection({
    heading: section.rendered,
  });

  return (
    <>
      <li {...itemProps} className="pt-2">
        {section.rendered && (
          <span {...headingProps} className="py-1 px-4 text-lg font-bold">
            {section.rendered}
          </span>
        )}
        <ul {...groupProps}>
          {[...section.childNodes].map((node) => (
            <Option key={node.key} item={node} state={state} />
          ))}
        </ul>
      </li>
    </>
  );
}

const OptionStyle = cs([
  "py-1 px-4",
  "data-[hovered=true]:bg-purple",
  "data-[hovered=true]:text-white",
  "data-[selected=true]:bg-purple-600",
  "data-[selected=true]:text-white",
  "data-[focus-visible=true]:bg-purple",
  "data-[focus-visible=true]:text-white",
  "data-[focus-visible=true]:outline",
  "data-[focus-visible=true]:outline-3",
  "data-[focus-visible=true]:outline-purple",
  "data-[focus-visible=true]:outline-offset-2",
]);

const Option = function Option({ item, state }: OptionProps) {
  let ref = useRef<HTMLLIElement>(null);
  let {
    optionProps,
    isSelected,
    isFocusVisible,
    isFocused,
    isDisabled: isOptionDisabled,
  } = useOption(
    {
      key: item.key,
    },
    state,
    ref,
  );

  const { hoverProps, isHovered } = useHover({ isDisabled: isOptionDisabled });

  return (
    <li
      {...mergeProps(hoverProps, optionProps)}
      ref={ref}
      className={OptionStyle}
      data-selected={isSelected}
      data-focus-visible={isFocusVisible}
      data-focused={isFocused}
      data-hovered={isHovered}
    >
      {item.textValue}
    </li>
  );
};
