const pendingSaves = new Map<string, Promise<void>>();

export function queueBuilderSave(
  formId: string,
  operation: () => Promise<void>,
): Promise<void> {
  const previous = pendingSaves.get(formId) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(operation);

  pendingSaves.set(formId, current);
  void current.then(
    () => {
      if (pendingSaves.get(formId) === current) pendingSaves.delete(formId);
    },
    () => {
      if (pendingSaves.get(formId) === current) pendingSaves.delete(formId);
    },
  );

  return current;
}

export async function waitForBuilderSaves(formId: string): Promise<void> {
  const pending = pendingSaves.get(formId);
  if (pending) await pending;
}
