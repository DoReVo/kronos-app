import { memo, useRef, type PropsWithChildren } from "react";
import type { AriaListBoxOptions } from "@react-aria/listbox";
import type { ListState } from "react-stately";
import type { Node } from "@react-types/shared";
import { useListBox, useListBoxSection, useOption } from "react-aria";
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

const ListboxStyle = cs(["w-full", "max-h-72", "overflow-auto"]);

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
          <span
            {...headingProps}
            className="text-xs font-bold uppercase text-gray-500 mx-3"
          >
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

const Option = memo(function Option({ item, state }: OptionProps) {
  let ref = useRef<HTMLLIElement>(null);
  let { optionProps } = useOption(
    {
      key: item.key,
    },
    state,
    ref,
  );

  return (
    <li {...optionProps} ref={ref} className="">
      {item.textValue}
    </li>
  );
});
