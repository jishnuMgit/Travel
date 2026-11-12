/* The search of every dropdown (as filterPairOption in STOCK): typing matches any column of the list, the ID
   or the name, whichever box is open. Every typed word must be found, in any order, so "ramees 60004" works.
   An option is searched by its label, its value and every other text it carries (secondLabel, listFirst, ...). */
export const searchFilter = (
  option: { label: string; value: string; data: unknown },
  inputValue: string,
): boolean => {
  const words = inputValue.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;

  const extra =
    option.data && typeof option.data === "object"
      ? Object.values(option.data as Record<string, unknown>).filter(
          (part): part is string => typeof part === "string",
        )
      : [];

  const text = [option.label, option.value, ...extra].join(" ").toLowerCase();
  return words.every((word) => text.includes(word));
};
