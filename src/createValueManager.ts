export function createValueManager<T>() {
  let values: T[] = [];
  let changes: { latValue: T; newValue: T }[] = [];

  return {
    cloneValue(value: T) {
      values.push(structuredClone(value));
      if (values.length === 2) {
        const [latValue, newValue] = values;

        if (JSON.stringify(latValue) !== JSON.stringify(newValue))
          changes.push({
            newValue,
            latValue,
          });

        values.shift();
      }
    },
    changes(): { latValue: T; newValue: T }[] {
      return changes;
    },
    hasChanges() {
      return changes.length > 0;
    },
    clearValueManager() {
      values = [];
      changes = [];
    },
  };
}
